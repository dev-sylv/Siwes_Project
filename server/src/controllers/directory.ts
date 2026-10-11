import { Response } from "express";
import Lecturer from "../models/lecturer";
import CourseAssignment from "../models/courseAssignment";
import Exco from "../models/excos";
import Session from "../models/session";
import asyncHandler, { httpError } from "../utils/asyncHandler";
import resolveSessionId from "../utils/resolveSessions";

// ---------- Lecturers ----------
export const createLecturer = asyncHandler(async (req, res) => {
  const { name, title, email, isHod } = req.body;
  const lecturer = await Lecturer.create({
    name,
    title,
    email,
    isHod: Boolean(isHod),
  });
  if (lecturer.isHod) {
    await Lecturer.updateMany({ _id: { $ne: lecturer._id } }, { isHod: false });
  }
  res.status(201).json(lecturer);
});

export const getLecturers = asyncHandler(async (_req, res) => {
  res.json(await Lecturer.find().sort({ name: 1 }));
});

export const updateLecturer = asyncHandler(async (req, res) => {
  const { name, title, email, isHod } = req.body;
  const lecturer = await Lecturer.findByIdAndUpdate(
    req.params.id,
    { name, title, email, isHod },
    { new: true, runValidators: true },
  );
  if (!lecturer) httpError(res, 404, "Lecturer not found");
  if (lecturer!.isHod) {
    await Lecturer.updateMany(
      { _id: { $ne: lecturer!._id } },
      { isHod: false },
    );
  }
  res.json(lecturer);
});

export const deleteLecturer = asyncHandler(async (req, res) => {
  const lecturer = await Lecturer.findByIdAndDelete(req.params.id);
  if (!lecturer) httpError(res, 404, "Lecturer not found");
  await CourseAssignment.deleteMany({ lecturer: req.params.id });
  res.json({ message: "Lecturer deleted" });
});

// ---------- Course assignments ----------
export const createAssignment = asyncHandler(async (req, res) => {
  const { course, lecturer } = req.body;
  if (!course || !lecturer)
    httpError(res, 400, "course and lecturer are required");

  const session = await resolveSessionId(res, req.body.session);
  const assignment = await CourseAssignment.create({
    course,
    lecturer,
    session,
  });
  res.status(201).json(assignment);
});

export const getAssignments = asyncHandler(async (req, res) => {
  const session = await resolveSessionId(
    res,
    req.query.session as string | undefined,
  );
  const assignments = await CourseAssignment.find({ session })
    .populate("course", "code title level semester")
    .populate("lecturer", "name title");
  res.json(assignments);
});

export const deleteAssignment = asyncHandler(async (req, res) => {
  const assignment = await CourseAssignment.findByIdAndDelete(req.params.id);
  if (!assignment) httpError(res, 404, "Assignment not found");
  res.json({ message: "Assignment removed" });
});

// ---------- Excos ----------
export const createExco = asyncHandler(async (req, res) => {
  const { position, name } = req.body;
  const session = await resolveSessionId(res, req.body.session);
  const exco = await Exco.create({ position, name, session });
  res.status(201).json(exco);
});

export const getExcos = asyncHandler(async (req, res) => {
  const session = await resolveSessionId(
    res,
    req.query.session as string | undefined,
  );
  res.json(await Exco.find({ session }).sort({ createdAt: 1 }));
});

export const updateExco = asyncHandler(async (req, res) => {
  const { position, name } = req.body;
  const exco = await Exco.findByIdAndUpdate(
    req.params.id,
    { position, name },
    { new: true, runValidators: true },
  );
  if (!exco) httpError(res, 404, "Exco not found");
  res.json(exco);
});

export const deleteExco = asyncHandler(async (req, res) => {
  const exco = await Exco.findByIdAndDelete(req.params.id);
  if (!exco) httpError(res, 404, "Exco not found");
  res.json({ message: "Exco removed" });
});

// ---------- Public directory (one call for the frontend) ----------
export const getDirectory = asyncHandler(async (req, res) => {
  const session = await resolveSessionId(
    res,
    req.query.session as string | undefined,
  );

  const [sessionDoc, hod, excos, courseLecturers] = await Promise.all([
    Session.findById(session),
    Lecturer.findOne({ isHod: true }),
    Exco.find({ session }).sort({ createdAt: 1 }),
    CourseAssignment.find({ session })
      .populate("course", "code title level semester")
      .populate("lecturer", "name title"),
  ]);

  res.json({ session: sessionDoc, hod, excos, courseLecturers });
});
