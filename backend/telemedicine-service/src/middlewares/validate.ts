import { NextFunction, Request, Response } from "express";
import { AnyZodObject, ZodError } from "zod";
import { ValidationError } from "../errors/AppError";

type SchemaMap = {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
};

/**
 * Express middleware: validates request parts with Zod.
 */
export function validate(schemas: SchemaMap) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query)
        Object.assign(req.query, schemas.query.parse(req.query));
      if (schemas.params)
        Object.assign(req.params, schemas.params.parse(req.params));
      next();
    } catch (e: unknown) {
      if (e instanceof ZodError) {
        const msg = e.errors
          .map((x: { message: string }) => x.message)
          .join("; ");
        return next(new ValidationError(msg));
      }
      next(e);
    }
  };
}
