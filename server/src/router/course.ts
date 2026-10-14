import { Router } from "express";
import { protect, authorize } from "../middleware/auth";
import validate from "../middleware/validate";
import { courseSchema, courseUpdateSchema } from "../validators/schemas";
import {
  createCourse,
  getCourses,
  updateCourse,
  deleteCourse,
} from "../controllers/course";

const router = Router();

router.get("/", protect, getCourses);
router.post(
  "/",
  protect,
  authorize("admin"),
  validate(courseSchema),
  createCourse,
);
router.patch(
  "/:id",
  protect,
  authorize("admin"),
  validate(courseUpdateSchema),
  updateCourse,
);
router.delete("/:id", protect, authorize("admin"), deleteCourse);

export default router;
