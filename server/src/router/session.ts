import { Router } from "express";
import { protect, authorize } from "../middleware/auth";
import {
  createSession,
  getSessions,
  getCurrentSession,
  setCurrentSession,
} from "../controllers/session";

const router = Router();

router.get("/", protect, getSessions);
router.get("/current", protect, getCurrentSession);
router.post("/", protect, authorize("admin"), createSession);
router.patch("/:id/current", protect, authorize("admin"), setCurrentSession);

export default router;
