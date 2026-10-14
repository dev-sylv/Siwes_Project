import Announcement from "../models/announcements";
import asyncHandler, { httpError } from "../utils/asyncHandler";

const canSeeAll = (role: string): boolean =>
  role === "president" || role === "admin";

export const createAnnouncement = asyncHandler(async (req, res) => {
  const { title, message, targetLevel, pinned } = req.body;
  const announcement = await Announcement.create({
    title,
    message,
    targetLevel: targetLevel ?? null,
    pinned: Boolean(pinned),
    postedBy: req.user!._id,
  });
  res.status(201).json(announcement);
});

export const getAnnouncements = asyncHandler(async (req, res) => {
  const user = req.user!;
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);

  // students see "everyone" posts plus posts for their own level;
  // the president and admin see everything unless they filter with ?level=
  let filter: Record<string, unknown> = {};
  const levelForFilter = canSeeAll(user.role)
    ? Number(req.query.level) || null
    : user.level;
  if (levelForFilter) {
    filter = { $or: [{ targetLevel: null }, { targetLevel: levelForFilter }] };
  }

  const [items, total] = await Promise.all([
    Announcement.find(filter)
      .sort({ pinned: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("postedBy", "name role"),
    Announcement.countDocuments(filter),
  ]);

  res.json({ items, page, pages: Math.ceil(total / limit), total });
});

export const getAnnouncement = asyncHandler(async (req, res) => {
  const user = req.user!;
  const announcement = await Announcement.findById(req.params.id).populate(
    "postedBy",
    "name role",
  );
  if (!announcement) httpError(res, 404, "Announcement not found");

  const visible =
    canSeeAll(user.role) ||
    announcement!.targetLevel === null ||
    announcement!.targetLevel === user.level;
  if (!visible) httpError(res, 403, "This announcement is not for your level");

  res.json(announcement);
});

export const updateAnnouncement = asyncHandler(async (req, res) => {
  const user = req.user!;
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) httpError(res, 404, "Announcement not found");

  const isOwner = String(announcement!.postedBy) === String(user._id);
  if (!isOwner && user.role !== "admin") {
    httpError(res, 403, "You can only edit your own announcements");
  }

  announcement!.set(req.body);
  await announcement!.save();
  res.json(announcement);
});

export const deleteAnnouncement = asyncHandler(async (req, res) => {
  const user = req.user!;
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) httpError(res, 404, "Announcement not found");

  const isOwner = String(announcement!.postedBy) === String(user._id);
  if (!isOwner && user.role !== "admin") {
    httpError(res, 403, "You can only delete your own announcements");
  }

  await announcement!.deleteOne();
  res.json({ message: "Announcement deleted" });
});
