import Joi from "joi";

const LEVELS = [100, 200, 300, 400, 500];
const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const objectId = Joi.string().hex().length(24);
const time = Joi.string()
  .pattern(/^([01]\d|2[0-3]):[0-5]\d$/)
  .messages({
    "string.pattern.base": "{{#label}} must be in 24-hour HH:MM format",
  });

// ---------- Auth ----------
export const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).required(),
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().min(6).max(72).required(),
  level: Joi.number()
    .valid(...LEVELS)
    .required(),
});

export const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().required(),
});

// ---------- Roles ----------
export const roleRequestSchema = Joi.object({
  requestedRole: Joi.string().valid("course_rep", "president").required(),
  reason: Joi.string().trim().min(10).max(300).required(),
});

export const reviewSchema = Joi.object({
  decision: Joi.string().valid("approve", "reject").required(),
});

// ---------- Sessions and courses ----------
export const sessionSchema = Joi.object({
  name: Joi.string()
    .trim()
    .pattern(/^\d{4}\/\d{4}$/)
    .required()
    .messages({
      "string.pattern.base": "Session name must look like 2026/2027",
    }),
  isCurrent: Joi.boolean(),
});

export const courseSchema = Joi.object({
  code: Joi.string()
    .trim()
    .pattern(/^[A-Za-z]{3}\s?\d{3}$/)
    .required()
    .messages({
      "string.pattern.base": "Course code must look like CSC 301",
    }),
  title: Joi.string().trim().min(3).max(120).required(),
  units: Joi.number().integer().min(1).max(6).required(),
  level: Joi.number()
    .valid(...LEVELS)
    .required(),
  semester: Joi.string().valid("first", "second").required(),
});

export const courseUpdateSchema = courseSchema
  .fork(["code", "title", "units", "level", "semester"], (s) => s.optional())
  .min(1);

// ---------- Directory ----------
export const lecturerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).required(),
  title: Joi.string().trim().allow("").max(20),
  email: Joi.string().trim().lowercase().email().allow(""),
  isHod: Joi.boolean(),
});

export const lecturerUpdateSchema = lecturerSchema
  .fork(["name"], (s) => s.optional())
  .min(1);

export const assignmentSchema = Joi.object({
  course: objectId.required(),
  lecturer: objectId.required(),
  session: objectId,
});

export const excoSchema = Joi.object({
  position: Joi.string().trim().min(2).max(60).required(),
  name: Joi.string().trim().min(2).max(80).required(),
  session: objectId,
});

export const excoUpdateSchema = excoSchema
  .fork(["position", "name"], (s) => s.optional())
  .min(1);

// ---------- Timetable ----------
export const timetableSchema = Joi.object({
  course: Joi.string().trim().required(), // course id (or code while testing)
  day: Joi.string()
    .valid(...DAYS)
    .required(),
  startTime: time.required(),
  endTime: time.required(),
  venue: Joi.string().trim().min(2).max(100).required(),
  session: objectId,
});

export const timetableUpdateSchema = Joi.object({
  day: Joi.string().valid(...DAYS),
  startTime: time,
  endTime: time,
  venue: Joi.string().trim().min(2).max(100),
}).min(1);

// ---------- Announcements ----------
export const announcementSchema = Joi.object({
  title: Joi.string().trim().min(3).max(120).required(),
  message: Joi.string().trim().min(5).max(2000).required(),
  targetLevel: Joi.number()
    .valid(...LEVELS)
    .allow(null),
  notifyByEmail: Joi.boolean(),
  pinned: Joi.boolean(),
});

export const announcementUpdateSchema = announcementSchema
  .fork(["title", "message"], (s) => s.optional())
  .min(1);
