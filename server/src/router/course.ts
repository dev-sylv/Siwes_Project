import { Router } from "express";
import { protect, authorize } from "../middleware/auth";
import {
  createCourse,
  getCourses,
  updateCourse,
  deleteCourse,
} from "../controllers/course";

const router = Router();

router.get("/", protect, getCourses);
router.post("/", protect, authorize("admin"), createCourse);
router.patch("/:id", protect, authorize("admin"), updateCourse);
router.delete("/:id", protect, authorize("admin"), deleteCourse);

export default router;
