import { Response, NextFunction } from "express";
import RoleRequest from "../models/roleRequests";
import User from "../models/user";
import { AuthRequest } from "../middleware/auth";

const allowedRoles = ["course_rep", "president"];

export const requestRole = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { requestedRole, reason } = req.body;
    const user = req.user!;

    if (!allowedRoles.includes(requestedRole) || !reason) {
      res.status(400);
      throw new Error("Choose course_rep or president and give a reason");
    }
    if (user.role === requestedRole || user.role === "admin") {
      res.status(400);
      throw new Error("You already have this role or higher");
    }

    const pending = await RoleRequest.findOne({
      user: user._id,
      status: "pending",
    });
    if (pending) {
      res.status(409);
      throw new Error("You already have a pending role request");
    }

    const request = await RoleRequest.create({
      user: user._id,
      requestedRole,
      reason,
    });
    res.status(201).json(request);
  } catch (error) {
    next(error);
  }
};

export const getMyRequests = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const requests = await RoleRequest.find({ user: req.user!._id }).sort({
      createdAt: -1,
    });
    res.json(requests);
  } catch (error) {
    next(error);
  }
};

export const getRoleRequests = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const status = (req.query.status as string) || "pending";
    const requests = await RoleRequest.find({ status!: status })
      .populate("user", "name email level role")
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    next(error);
  }
};

export const reviewRoleRequest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { decision } = req.body;

    if (decision !== "approve" && decision !== "reject") {
      res.status(400);
      throw new Error("Decision must be approve or reject");
    }

    const request = await RoleRequest.findById(req.params.id);
    if (!request) {
      res.status(404);
      throw new Error("Role request not found");
    }
    if (request.status !== "pending") {
      res.status(400);
      throw new Error("This request has already been reviewed");
    }

    if (decision === "approve") {
      await User.findByIdAndUpdate(request.user, {
        role: request.requestedRole,
      });
    }

    request.status = decision === "approve" ? "approved" : "rejected";
    request.reviewedBy = req.user!._id as typeof request.reviewedBy;
    await request.save();

    res.json(request);
  } catch (error) {
    next(error);
  }
};
