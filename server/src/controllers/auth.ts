import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import User from "../models/user";
import generateToken from "../utils/generateToken";
import { AuthRequest } from "../middleware/auth";
import crypto from "crypto";
import { sendPasswordResetEmail } from "../utils/mailer";

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

const RESET_TTL_MINUTES = 30;
const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email } = req.body;
    // Same reply whether or not the email exists, so the form can't be used to discover accounts
    const reply = {
      message:
        "If an account exists for that email, a password reset link has been sent.",
    };

    const user = await User.findOne({ email });
    if (!user) {
      res.json(reply);
      return;
    }

    // Only a hash of the token is stored; the raw token exists only in the email
    const token = crypto.randomBytes(32).toString("hex");
    await User.updateOne(
      { _id: user._id },
      {
        resetPasswordToken: hashToken(token),
        resetPasswordExpires: new Date(
          Date.now() + RESET_TTL_MINUTES * 60 * 1000,
        ),
      },
    );

    const link = `${process.env.CLIENT_URL}/reset-password/${token}`;
    if (process.env.NODE_ENV !== "production")
      console.log("Password reset link:", link);

    const sent = await sendPasswordResetEmail(
      user.email,
      user.name,
      link,
      RESET_TTL_MINUTES,
    );
    if (sent === 0)
      console.error(`Password reset email to ${user.email} was not delivered`);

    res.json(reply);
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: hashToken(token),
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400);
      throw new Error(
        "This reset link is invalid or has expired. Please request a new one.",
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // Save the new password and remove the token so the link can't be used twice
    await User.updateOne(
      { _id: user._id },
      {
        $set: { password: hashedPassword },
        $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 },
      },
    );

    res.json({ message: "Your password has been reset. You can now log in." });
  } catch (error) {
    next(error);
  }
};
