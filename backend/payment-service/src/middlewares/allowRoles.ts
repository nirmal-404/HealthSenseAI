import { NextFunction, Response } from "express";
import httpStatus from "http-status";
import { XRequest } from "../types/XRequest";
import { ApiError } from "../utils/ApiError";

export const allowRoles = (...allowedRoles: string[]) => {
  return (req: XRequest, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;

    if (!userRole) {
      return next(new ApiError(httpStatus.FORBIDDEN, "Forbidden: No role found"));
    }

    if (!allowedRoles.includes(userRole)) {
      return next(new ApiError(httpStatus.FORBIDDEN, "Forbidden: Access denied"));
    }

    return next();
  };
};
