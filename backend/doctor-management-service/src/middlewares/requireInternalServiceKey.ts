import { NextFunction, Response } from "express";
import httpStatus from "http-status";
import { CONFIG } from "../config/envConfig";
import { XRequest } from "../types/XRequest";

export const requireInternalServiceKey = (
  req: XRequest,
  res: Response,
  next: NextFunction
) => {
  const providedKey = req.headers["x-internal-service-key"];

  if (!providedKey || providedKey !== CONFIG.JWT_SECRET) {
    return res
      .status(httpStatus.UNAUTHORIZED)
      .json({ message: "Unauthorized internal service call" });
  }

  req.authUser = {
    id: "internal-service",
    role: "admin",
    email: "",
  };

  req.user = {
    id: "internal-service",
    role: "admin",
  };

  return next();
};
