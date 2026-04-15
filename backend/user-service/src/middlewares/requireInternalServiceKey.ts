import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { CONFIG } from "../config/envConfig";

export const requireInternalServiceKey = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const providedKey = req.headers["x-internal-service-key"];

  if (!providedKey || providedKey !== CONFIG.JWT_SECRET) {
    return res
      .status(httpStatus.UNAUTHORIZED)
      .json({ message: "Unauthorized internal service call" });
  }

  return next();
};
