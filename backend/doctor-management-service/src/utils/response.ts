import { Response } from "express";

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = "OK",
  status = 200,
) {
  return res.status(status).json({ success: true, data, message });
}

export function sendFailure(
  res: Response,
  error: string,
  code: string,
  status: number,
) {
  return res.status(status).json({ success: false, error, code });
}
