import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken"
import { CONFIG } from "../config/envConfig";
import { JWTPayload } from "../types/JWTPayload";

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userId = req.headers['x-user-id'];
  const userRole = req.headers['x-user-role'];

  if (userId) {
    (req as any).user = {
      id: String(userId),
      role: String(userRole || "")
    };

    return next();
  }

  const token =
    req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: Not logged in' });
  }

  const decodedToken = jwt.verify(token, CONFIG.JWT_SECRET) as JWTPayload;
  (req as any).user = {
    id: decodedToken.id,
    role: decodedToken.role
  };

  return next();
}

export default requireAuth;