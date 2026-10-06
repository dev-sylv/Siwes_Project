import { Router } from "express";
import { protect, authorize } from "../middleware/auth";
import {
  requestRole,
  getMyRequests,
  getRoleRequests,
  reviewRoleRequest,
} from "../controllers/roleRequests";

const router = Router();

router.post("/request", protect, requestRole);
router.get("/my-requests", protect, getMyRequests);
router.get("/requests", protect, authorize("admin"), getRoleRequests);
router.patch("/requests/:id", protect, authorize("admin"), reviewRoleRequest);

export default router;
