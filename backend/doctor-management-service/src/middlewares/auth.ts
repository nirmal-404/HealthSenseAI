import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { CONFIG } from "../config/envConfig";
import { UnauthorizedError } from "../errors/AppError";

export type AuthUser = { id: string; role: string; email: string };

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUser;
    }
  }
}

/**
 * Requires Bearer JWT or gateway user headers.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const uid = req.headers["x-user-id"] as string | undefined;
  const role = req.headers["x-user-role"] as string | undefined;
  const email = req.headers["x-user-email"] as string | undefined;

  if (header?.startsWith("Bearer ")) {
    const token = header.slice(7);
    try {
      const d = jwt.verify(token, CONFIG.JWT_SECRET) as {
        id: string;
        role: string;
        email: string;
      };
      req.authUser = { id: d.id, role: d.role, email: d.email };
      return next();
    } catch {
      return next(new UnauthorizedError("Invalid token"));
    }
  }
  if (uid && role) {
    req.authUser = { id: uid, role, email: email || "" };
    return next();
  }
  return next(new UnauthorizedError("Authentication required"));
}
