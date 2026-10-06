import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import User from "../models/user";
import generateToken from "../utils/generateToken";
import { AuthRequest } from "../middleware/auth";

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { name, email, password, level } = req.body;

    if (!name || !email || !password || !level) {
      res.status(400);
      throw new Error("Name, email, password and level are required");
    }

    const existing = await User.findOne({ email });
    if (existing) {
      res.status(409);
      throw new Error("An account with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // role is never read from the request, so nobody can register as admin
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      level,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      level: user.level,
      token: generateToken(String(user._id)),
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error("Email and password are required");
    }

    const user = await User.findOne({ email }).select("+password");
    const passwordMatches = user
      ? await bcrypt.compare(password, user.password)
      : false;

    if (!user || !passwordMatches) {
      res.status(401);
      throw new Error("Invalid email or password");
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      level: user.level,
      token: generateToken(String(user._id)),
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = (req: AuthRequest, res: Response): void => {
  res.json(req.user);
};
