import { NextFunction, Request, Response } from "express";

export const allowRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).user?.role;

    if (!userRole) {
      return res.status(403).json({ message: 'Forbidden: No role found' });
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: 'Forbidden: Access denied' });
    }

    next();
  };
}