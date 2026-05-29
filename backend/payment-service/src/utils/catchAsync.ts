import { NextFunction, Request, Response } from "express";
import { XRequest } from "../types/XRequest";

export const catchAsync = (
  fn: (req: XRequest, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as XRequest, res, next)).catch(next);
  };
};
