import Session from "../models/session";
import asyncHandler, { httpError } from "../utils/asyncHandler";

export const createSession = asyncHandler(async (req, res) => {
  const { name, isCurrent } = req.body;
  if (!name) httpError(res, 400, "Session name is required");

  if (isCurrent) await Session.updateMany({}, { isCurrent: false });
  const session = await Session.create({ name, isCurrent: Boolean(isCurrent) });
  res.status(201).json(session);
});

export const getSessions = asyncHandler(async (_req, res) => {
  res.json(await Session.find().sort({ name: -1 }));
});

export const getCurrentSession = asyncHandler(async (_req, res) => {
  const session = await Session.findOne({ isCurrent: true });
  if (!session) httpError(res, 404, "No current session has been set");
  res.json(session);
});

export const setCurrentSession = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) httpError(res, 404, "Session not found");

  await Session.updateMany({}, { isCurrent: false });
  session!.isCurrent = true;
  await session!.save();
  res.json(session);
});
