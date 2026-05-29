import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError";
import { ERROR_CODES } from "../constants";
import { CONFIG } from "../config/envConfig";
import { logger } from "../utils/logger";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
    });
  }

  logger.error("Unhandled error", { err });
  const message =
    CONFIG.NODE_ENV === "production"
      ? "Internal server error"
      : String((err as Error)?.message || err);

  return res.status(500).json({
    success: false,
    error: message,
    code: ERROR_CODES.INTERNAL,
  });
}
