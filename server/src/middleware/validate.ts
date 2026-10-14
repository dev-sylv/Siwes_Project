import { Request, Response, NextFunction } from "express";
import { ObjectSchema } from "joi";

const validate =
  (schema: ObjectSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true, // silently drops fields we didn't define, e.g. "role"
    });
    if (error) {
      res.status(400);
      return next(new Error(error.details.map((d) => d.message).join(", ")));
    }
    req.body = value;
    next();
  };

export default validate;
