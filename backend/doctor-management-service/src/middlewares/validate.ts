import { NextFunction, Request, Response } from "express";
import { AnyZodObject, ZodError } from "zod";
import { ValidationError } from "../errors/AppError";

type SchemaMap = {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
};

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
import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import httpStatus from "http-status";
import { ApiError } from "../utils/ApiError";

const pick = <T extends object, K extends keyof T>(
  object: T,
  keys: K[]
): Pick<T, K> => {
  return keys.reduce((obj, key) => {
    if (object && Object.prototype.hasOwnProperty.call(object, key)) {
      obj[key] = object[key];
    }
    return obj;
  }, {} as Pick<T, K>);
};

interface ValidationSchema {
  params?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  body?: Joi.ObjectSchema;
}

export const validate = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const validSchema = pick(schema, ["params", "query", "body"]);
    const object = pick(req, Object.keys(validSchema) as Array<keyof Request>);

    const { value, error } = Joi.compile(validSchema)
      .prefs({ errors: { label: "key" }, abortEarly: false })
      .validate(object);

    if (error) {
      const errorMessage = error.details.map((details) => details.message).join(", ");
      return next(new ApiError(httpStatus.BAD_REQUEST, errorMessage));
    }

    Object.assign(req, value);
    return next();
  };
};
