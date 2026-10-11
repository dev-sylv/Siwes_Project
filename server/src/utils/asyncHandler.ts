import { Response, NextFunction, RequestHandler } from "express";
import { AuthRequest } from "../middleware/auth";

const asyncHandler =
  (
    fn: (
      req: AuthRequest,
      res: Response,
      next: NextFunction,
    ) => Promise<unknown>,
  ): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req as AuthRequest, res, next)).catch(next);
  };

// Sets the status code and throws, so the error handler can reply
export const httpError = (
  res: Response,
  status: number,
  message: string,
): never => {
  res.status(status);
  throw new Error(message);
};

export default asyncHandler;
