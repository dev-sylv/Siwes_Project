import { Router } from "express";
import { protect, authorize } from "../middleware/auth";
import validate from "../middleware/validate";
import { sessionSchema } from "../validators/schemas";
import {
  createSession,
  getSessions,
  getCurrentSession,
  setCurrentSession,
} from "../controllers/session";

const router = Router();

router.get("/", protect, getSessions);
router.get("/current", protect, getCurrentSession);
router.post(
  "/",
  protect,
  authorize("admin"),
  validate(sessionSchema),
  createSession,
);
router.patch("/:id/current", protect, authorize("admin"), setCurrentSession);

export default router;
