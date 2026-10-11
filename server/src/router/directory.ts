import { Router } from "express";
import { protect, authorize } from "../middleware/auth";
import {
  createLecturer,
  getLecturers,
  updateLecturer,
  deleteLecturer,
  createAssignment,
  getAssignments,
  deleteAssignment,
  createExco,
  getExcos,
  updateExco,
  deleteExco,
  getDirectory,
} from "../controllers/directory";

const router = Router();
const admin = [protect, authorize("admin")];

router.get("/", protect, getDirectory);

router.get("/lecturers", protect, getLecturers);
router.post("/lecturers", ...admin, createLecturer);
router.patch("/lecturers/:id", ...admin, updateLecturer);
router.delete("/lecturers/:id", ...admin, deleteLecturer);

router.get("/assignments", protect, getAssignments);
router.post("/assignments", ...admin, createAssignment);
router.delete("/assignments/:id", ...admin, deleteAssignment);

router.get("/excos", protect, getExcos);
router.post("/excos", ...admin, createExco);
router.patch("/excos/:id", ...admin, updateExco);
router.delete("/excos/:id", ...admin, deleteExco);

export default router;
