import { Request, Response, NextFunction } from "express";

export const notFound = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  res.status(404);
  next(new Error(`Route not found: ${req.originalUrl}`));
};

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const statusCode =
    res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};
