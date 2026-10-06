import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import User, { IUser } from "../models/user";

export interface AuthRequest extends Request {
  user?: IUser;
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      res.status(401);
      throw new Error("Not authorised, no token");
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET is not defined in .env");
    }

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, secret) as JwtPayload;

    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(401);
      throw new Error("Not authorised, user not found");
    }

    req.user = user;
    next();
  } catch (error) {
    if (res.statusCode === 200) res.status(401);
    next(error);
  }
};
