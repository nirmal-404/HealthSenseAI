import { NextFunction, Response } from "express";
import httpStatus from "http-status";
import jwt from "jsonwebtoken";
import { CONFIG } from "../config/envConfig";
import { JWTPayload } from "../types/JWTPayload";
import { XRequest } from "../types/XRequest";
import { ApiError } from "../utils/ApiError";

const requireAuth = (req: XRequest, res: Response, next: NextFunction) => {
  try {
    const userIdHeader = req.headers["x-user-id"];
    const userRoleHeader = req.headers["x-user-role"];

    if (userIdHeader) {
      req.user = {
        id: String(userIdHeader),
        role: String(userRoleHeader || ""),
      };
      return next();
    }

    const token = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null;

    if (!token) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized: Not logged in"));
    }

    const decodedToken = jwt.verify(token, CONFIG.JWT_SECRET) as JWTPayload;
    req.user = {
      id: decodedToken.id,
      role: decodedToken.role,
    };

    return next();
  } catch (error) {
    return next(new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized: Invalid token"));
  }
};

export default requireAuth;
