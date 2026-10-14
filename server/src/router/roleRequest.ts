import { Router } from "express";
import { protect, authorize } from "../middleware/auth";
import validate from "../middleware/validate";
import { roleRequestSchema, reviewSchema } from "../validators/schemas";
import {
  requestRole,
  getMyRequests,
  getRoleRequests,
  reviewRoleRequest,
} from "../controllers/roleRequests";

const router = Router();

router.post("/request", protect, validate(roleRequestSchema), requestRole);
router.get("/my-requests", protect, getMyRequests);
router.get("/requests", protect, authorize("admin"), getRoleRequests);
router.patch(
  "/requests/:id",
  protect,
  authorize("admin"),
  validate(reviewSchema),
  reviewRoleRequest,
);

export default router;
