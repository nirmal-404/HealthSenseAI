import { NextFunction, Request, Response } from "express";
import { CONFIG } from "../config/envConfig";
import { UnauthorizedError } from "../errors/AppError";

/**
 * Allows only trusted service-to-service calls for internal endpoints.
 */
export function requireInternalServiceKey(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const headerValue = req.headers["x-internal-service-key"];
  const providedKey = Array.isArray(headerValue) ? headerValue[0] : headerValue;

  if (!providedKey || providedKey !== CONFIG.JWT_SECRET) {
    return next(new UnauthorizedError("Unauthorized internal service call"));
  }

  req.authUser = { id: "internal-service", role: "admin" };
  return next();
}
