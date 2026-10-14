import { Router } from "express";
import { protect, authorize } from "../middleware/auth";
import validate from "../middleware/validate";
import {
  announcementSchema,
  announcementUpdateSchema,
} from "../validators/schemas";
import {
  createAnnouncement,
  getAnnouncements,
  getAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../controllers/announcements";

const router = Router();
const posters = [protect, authorize("president", "admin")];

router.get("/", protect, getAnnouncements);
router.get("/:id", protect, getAnnouncement);
router.post("/", ...posters, validate(announcementSchema), createAnnouncement);
router.patch(
  "/:id",
  ...posters,
  validate(announcementUpdateSchema),
  updateAnnouncement,
);
router.delete("/:id", ...posters, deleteAnnouncement);

export default router;
