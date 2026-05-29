import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { CONFIG } from "../config/envConfig";
import { ApiError } from "../utils/ApiError";

export const errorConverter = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode =
      (error as any)?.statusCode || httpStatus.INTERNAL_SERVER_ERROR;

    const message =
      (error as any)?.message ||
      (httpStatus[statusCode as keyof typeof httpStatus] as string);

    error = new ApiError(statusCode, message as string, false, (err as any)?.stack);
  }

  next(error);
};

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let { statusCode, message } = err;

  if (CONFIG.ENV === "production" && !err.isOperational) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = httpStatus[httpStatus.INTERNAL_SERVER_ERROR] as string;
  }

  const response: Record<string, any> = {
    success: false,
    code: statusCode,
    message,
  };

  if (CONFIG.ENV === "development") {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
