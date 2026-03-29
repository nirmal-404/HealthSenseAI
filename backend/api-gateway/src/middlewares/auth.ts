import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWTPayload } from "../types/JWTPayload";

export const optionalAuth = (req : Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    (req as any).user = null; 
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    (req as any).user = decoded;
  } catch {
    (req as any).user = null;
  }

  next();
};