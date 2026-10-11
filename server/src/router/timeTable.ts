import { Router } from "express";
import { protect, authorize } from "../middleware/auth";
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
router.post("/", ...managers, createEntry);
router.patch("/:id", ...managers, updateEntry);
router.delete("/:id", ...managers, deleteEntry);

export default router;
