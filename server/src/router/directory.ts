import { Router } from "express";
import { protect, authorize } from "../middleware/auth";
import validate from "../middleware/validate";
import {
  excoUpdateSchema,
  excoSchema,
  lecturerSchema,
  lecturerUpdateSchema,
  assignmentSchema,
} from "../validators/schemas";
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
router.post("/lecturers", ...admin, validate(lecturerSchema), createLecturer);
router.patch(
  "/lecturers/:id",
  ...admin,
  validate(lecturerUpdateSchema),
  updateLecturer,
);
router.delete("/lecturers/:id", ...admin, deleteLecturer);

router.get("/assignments", protect, getAssignments);
router.post(
  "/assignments",
  ...admin,
  validate(assignmentSchema),
  createAssignment,
);
router.delete("/assignments/:id", ...admin, deleteAssignment);

router.get("/excos", protect, getExcos);
router.post("/excos", ...admin, validate(excoSchema), createExco);
router.patch("/excos/:id", ...admin, validate(excoUpdateSchema), updateExco);
router.delete("/excos/:id", ...admin, deleteExco);

export default router;
