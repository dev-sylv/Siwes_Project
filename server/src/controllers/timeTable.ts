import { Response } from "express";
import TimetableEntry from "../models/timetableEntry";
import Course, { ICourse } from "../models/course";
import asyncHandler, { httpError } from "../utils/asyncHandler";
import resolveSessionId from "../utils/resolveSessions";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const TIME_FORMAT = /^([01]\d|2[0-3]):[0-5]\d$/;

const validateTimes = (res: Response, start: string, end: string): void => {
  if (!TIME_FORMAT.test(start) || !TIME_FORMAT.test(end)) {
    httpError(res, 400, "Times must be in 24-hour HH:MM format, e.g. 08:00");
  }
  if (start >= end) httpError(res, 400, "End time must be after start time");
};

// A level can't have two classes overlapping on the same day
const assertNoClash = async (
  res: Response,
  o: {
    session: string;
    day: string;
    startTime: string;
    endTime: string;
    level: number;
    excludeId?: string;
  },
): Promise<void> => {
  const sameDay = await TimetableEntry.find({
    session: o.session,
    day: o.day,
    ...(o.excludeId ? { _id: { $ne: o.excludeId } } : {}),
  }).populate<{ course: ICourse }>("course", "code level");

  const clash = sameDay.find(
    (e) =>
      e.course &&
      e.course.level === o.level &&
      e.startTime < o.endTime &&
      o.startTime < e.endTime,
  );
  if (clash) {
    httpError(
      res,
      409,
      `Clashes with ${clash.course.code} (${clash.startTime}-${clash.endTime}) for this level`,
    );
  }
};

const listEntries = async (
  res: Response,
  o: { session?: string; level: number; semester?: string; day?: string },
) => {
  const session = await resolveSessionId(res, o.session);
  const courseFilter: Record<string, unknown> = { level: o.level };
  if (o.semester) courseFilter.semester = o.semester;
  const courseIds = await Course.find(courseFilter).distinct("_id");

  const filter: Record<string, unknown> = {
    session,
    course: { $in: courseIds },
  };
  if (o.day) filter.day = o.day;

  const entries = await TimetableEntry.find(filter)
    .populate("course", "code title units level semester")
    .populate("uploadedBy", "name role");

  return entries.sort(
    (a, b) =>
      DAYS.indexOf(a.day) - DAYS.indexOf(b.day) ||
      a.startTime.localeCompare(b.startTime),
  );
};

export const createEntry = asyncHandler(async (req, res) => {
  const user = req.user!;
  const { course: courseId, day, startTime, endTime, venue } = req.body;

  if (!courseId || !day || !startTime || !endTime || !venue) {
    httpError(
      res,
      400,
      "course, day, startTime, endTime and venue are required",
    );
  }
  if (!DAYS.includes(day))
    httpError(res, 400, "Day must be Monday to Saturday");
  validateTimes(res, startTime, endTime);

  const course = await Course.findById(courseId);
  if (!course) httpError(res, 404, "Course not found");
  if (user.role === "course_rep" && course!.level !== user.level) {
    httpError(res, 403, "You can only manage the timetable for your own level");
  }

  const session = await resolveSessionId(res, req.body.session);
  await assertNoClash(res, {
    session,
    day,
    startTime,
    endTime,
    level: course!.level,
  });

  const entry = await TimetableEntry.create({
    course: courseId,
    session,
    uploadedBy: user._id,
    day,
    startTime,
    endTime,
    venue,
  });
  res.status(201).json(entry);
});

export const getTimetable = asyncHandler(async (req, res) => {
  const level = Number(req.query.level) || req.user!.level;
  const entries = await listEntries(res, {
    session: req.query.session as string | undefined,
    level,
    semester: req.query.semester as string | undefined,
    day: req.query.day as string | undefined,
  });
  res.json(entries);
});

export const getToday = asyncHandler(async (req, res) => {
  const level = Number(req.query.level) || req.user!.level;
  const day = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "Africa/Lagos",
  });

  if (!DAYS.includes(day)) {
    res.json([]); // Sunday: no classes
    return;
  }
  res.json(await listEntries(res, { level, day }));
});

const loadManageable = async (
  req: Parameters<typeof updateEntry>[0],
  res: Response,
) => {
  const entry = await TimetableEntry.findById(req.params.id).populate<{
    course: ICourse;
  }>("course", "code level");
  if (!entry) httpError(res, 404, "Timetable entry not found");
  if (
    req.user!.role === "course_rep" &&
    entry!.course.level !== req.user!.level
  ) {
    httpError(res, 403, "You can only manage the timetable for your own level");
  }
  return entry!;
};

export const updateEntry = asyncHandler(async (req, res) => {
  const entry = await loadManageable(req, res);

  const day = req.body.day ?? entry.day;
  const startTime = req.body.startTime ?? entry.startTime;
  const endTime = req.body.endTime ?? entry.endTime;
  const venue = req.body.venue ?? entry.venue;

  if (!DAYS.includes(day))
    httpError(res, 400, "Day must be Monday to Saturday");
  validateTimes(res, startTime, endTime);
  await assertNoClash(res, {
    session: String(entry.session),
    day,
    startTime,
    endTime,
    level: entry.course.level,
    excludeId: String(entry._id),
  });

  entry.set({ day, startTime, endTime, venue });
  await entry.save();
  res.json(entry);
});

export const deleteEntry = asyncHandler(async (req, res) => {
  const entry = await loadManageable(req, res);
  await entry.deleteOne();
  res.json({ message: "Timetable entry deleted" });
});
