import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import httpStatus from "http-status";
import { CONFIG } from "../config/envConfig";
import { JWTPayload } from "../types/JWTPayload";
import { XRequest } from "../types/XRequest";
import { ApiError } from "../utils/ApiError";

const requireAuth = (req: XRequest, res: Response, next: NextFunction) => {
  try {
    const userIdHeader = req.headers["x-user-id"];
    const userRoleHeader = req.headers["x-user-role"];
    const userEmailHeader = req.headers["x-user-email"];

    if (userIdHeader) {
      const id = String(userIdHeader);
      const role = String(userRoleHeader || "");
      const email = String(userEmailHeader || "");
      req.user = {
        id,
        role,
      };
      req.authUser = { id, role, email };
      return next();
    }

    const token = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null;

    if (!token) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized: Not logged in"));
    }

    const decodedToken = jwt.verify(token, CONFIG.JWT_SECRET) as JWTPayload;
    const id = decodedToken.id;
    const role = decodedToken.role;
    req.user = {
      id,
      role,
    };
    req.authUser = { id, role, email: "" };

    return next();
  } catch (error) {
    return next(new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized: Invalid token"));
  }
};

export default requireAuth;