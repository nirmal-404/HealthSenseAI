import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { CONFIG } from "../config/envConfig";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

/**
 * Middleware to verify JWT token
 */
export const verifyToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "No authorization token provided",
      });
    }

    const decoded = jwt.verify(token, CONFIG.JWT_SECRET) as {
      userId: string;
      role: string;
    };

    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: "Invalid or expired token",
    });
  }
};

/**
 * Middleware to verify internal service key
 */
export const verifyInternalKey = (req: Request, res: Response, next: NextFunction) => {
  try {
    const internalKey = req.headers["x-internal-service-key"];

    if (internalKey !== CONFIG.JWT_SECRET) {
      return res.status(403).json({
        success: false,
        error: "Invalid internal service key",
      });
    }

    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      error: "Authorization failed",
    });
  }
};

/**
 * Middleware to verify user role
 */
export const verifyRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: "Insufficient permissions",
      });
    }

    next();
  };
};

/**
 * Error handling middleware
 */
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", err);

  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal server error",
  });
};

/**
 * Request logging middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.path}`);
  next();
};

/**
 * CORS headers middleware
 */
export const corsHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Internal-Service-Key");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
};
