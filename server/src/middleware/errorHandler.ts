import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  err: Error & { code?: number },
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  let statusCode =
    res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message;

  if (err.code === 11000) {
    statusCode = 409;
    message = "A record with these details already exists";
  } else if (err.name === "ValidationError") {
    statusCode = 400;
  } else if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid id";
  }

  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};
