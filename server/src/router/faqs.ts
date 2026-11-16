import { Router } from "express";
import { protect, authorize } from "../middleware/auth";
import { getFaqs, createFaq, updateFaq, deleteFaq } from "../controllers/faqs";

const router = Router();

router.get("/", protect, getFaqs);
router.post("/", protect, authorize("admin"), createFaq);
router.patch("/:id", protect, authorize("admin"), updateFaq);
router.delete("/:id", protect, authorize("admin"), deleteFaq);

export default router;
