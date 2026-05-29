import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken"
import { CONFIG } from "../config/envConfig";
import { JWTPayload } from "../types/JWTPayload";

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userIdHeader = req.headers["x-user-id"];
  const userRoleHeader = req.headers["x-user-role"];

  if (userIdHeader) {
    (req as any).user = {
      id: Array.isArray(userIdHeader) ? userIdHeader[0] : String(userIdHeader),
      role: Array.isArray(userRoleHeader) ? userRoleHeader[0] : userRoleHeader,
    };
    return next();
  }

  const token =
    req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: Not logged in" });
  }

  try {
    const decodedToken = jwt.verify(token, CONFIG.JWT_SECRET) as JWTPayload;
    (req as any).user = {
      id: decodedToken.id,
      role: decodedToken.role,
    };
    return next();
  } catch {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
}

export default requireAuth;