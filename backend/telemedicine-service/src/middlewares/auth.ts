import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { CONFIG } from "../config/envConfig";
import { UnauthorizedError } from "../errors/AppError";

export type AuthUser = { id: string; role: string };

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUser;
    }
  }
}

/**
 * Validates Bearer JWT (same secret as user-service / gateway).
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const fromGateway = req.headers["x-user-id"] as string | undefined;
  const roleHeader = req.headers["x-user-role"] as string | undefined;

  if (header?.startsWith("Bearer ")) {
    const token = header.slice(7);
    try {
      const decoded = jwt.verify(token, CONFIG.JWT_SECRET) as {
        id: string;
        role: string;
      };
      req.authUser = { id: decoded.id, role: decoded.role };
      return next();
    } catch {
      return next(new UnauthorizedError("Invalid token"));
    }
  }

  if (fromGateway && roleHeader) {
    req.authUser = { id: fromGateway, role: roleHeader };
    return next();
  }

  return next(new UnauthorizedError("Authentication required"));
}
