import Course from "../models/course";
import asyncHandler, { httpError } from "../utils/asyncHandler";

export const createCourse = asyncHandler(async (req, res) => {
  const { code, title, units, level, semester } = req.body;
  const course = await Course.create({ code, title, units, level, semester });
  res.status(201).json(course);
});

export const getCourses = asyncHandler(async (req, res) => {
  const filter: Record<string, unknown> = {};
  if (req.query.level) filter.level = Number(req.query.level);
  if (req.query.semester) filter.semester = req.query.semester;

  res.json(await Course.find(filter).sort({ level: 1, code: 1 }));
});

export const updateCourse = asyncHandler(async (req, res) => {
  const { code, title, units, level, semester } = req.body;
  const course = await Course.findByIdAndUpdate(
    req.params.id,
    { code, title, units, level, semester },
    { new: true, runValidators: true },
  );
  if (!course) httpError(res, 404, "Course not found");
  res.json(course);
});

export const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findByIdAndDelete(req.params.id);
  if (!course) httpError(res, 404, "Course not found");
  res.json({ message: "Course deleted" });
});
