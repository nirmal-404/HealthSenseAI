import { NextFunction, Response } from "express";
import { XRequest } from "../types/XRequest";

export const allowRoles = (...allowedRoles: string[]) => {
  return (req: XRequest, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;

    if (!userRole) {
      return res.status(403).json({ message: 'Forbidden: No role found' });
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: 'Forbidden: Access denied' });
    }

    next();
  };
}