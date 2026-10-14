import { Router } from "express";
import { protect, authorize } from "../middleware/auth";
import validate from "../middleware/validate";
import { timetableSchema, timetableUpdateSchema } from "../validators/schemas";
import {
  createEntry,
  getTimetable,
  getToday,
  updateEntry,
  deleteEntry,
} from "../controllers/timeTable";

const router = Router();
const managers = [protect, authorize("course_rep", "admin")];

router.get("/", protect, getTimetable);
router.get("/today", protect, getToday);
router.post("/", ...managers, validate(timetableSchema), createEntry);
router.patch("/:id", ...managers, validate(timetableUpdateSchema), updateEntry);
router.delete("/:id", ...managers, deleteEntry);

export default router;
