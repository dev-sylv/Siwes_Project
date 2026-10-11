import { Response } from "express";
import Session from "../models/session";
import { httpError } from "./asyncHandler";

const resolveSessionId = async (
  res: Response,
  requested?: string,
): Promise<string> => {
  if (requested) return requested;
  const current = await Session.findOne({ isCurrent: true });
  if (!current) httpError(res, 404, "No current session has been set");
  return String(current!._id);
};

export default resolveSessionId;
