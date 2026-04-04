import { Response } from "express";
import {
  forgotPasswordService,
  loginService,
  logoutService,
  refreshTokenService,
  registerService,
  resetPasswordService,
  verifyEmailService,

} from "../service/authService";
import { ApiError } from "../utils/ApiError"
import { catchAsync } from "../utils/catchAsync";
import httpStatus from "http-status";
import { XRequest } from "../types/XRequest";
import { XResponse } from "../types/XResponse";

export const registerController = catchAsync(async (req: XRequest, res: Response) => {
  const { email, password, role } = req.body;

  const result = await registerService({ email, password, role });

  const response: XResponse = {
    message: "Registration successful. Please verify your email.",
    data: result,
  };
  res.status(httpStatus.CREATED).send(response);
});

export const loginController = catchAsync(async (req: XRequest, res: Response) => {
  const { email, password } = req.body;

  const ipAddress = req.ip || req.connection.remoteAddress as string;
  const userAgent = req.headers["user-agent"] as string;

  const result = await loginService({ email, password, ipAddress, userAgent });

  // Send refresh token as httpOnly cookie
  res.cookie("refreshToken", result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  const response: XResponse = {
    message: "Login successful",
    data: {
      accessToken: result.accessToken,
      user: result.user,
    },
  };
  res.status(httpStatus.OK).send(response);
});

export const logoutController = catchAsync(async (req: XRequest, res: Response) => {
  const token =
    req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null;

  if (token) await logoutService(token);

  res.clearCookie("refreshToken");

  const response: XResponse = {
    message: "Logged out successfully",
  };
  res.status(httpStatus.OK).send(response);
});

export const refreshTokenController = catchAsync(async (req: XRequest, res: Response) => {
  const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

  if (!refreshToken) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Refresh token is required");
  }

  const tokens = await refreshTokenService(refreshToken);

  res.cookie("refreshToken", tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  const response: XResponse = {
    message: "Refresh token generated successfully",
    data: {
      accessToken: tokens.accessToken
    },
  };
  res.status(httpStatus.OK).send(response);
});

export const forgotPasswordController = catchAsync(async (req: XRequest, res: Response) => {
  const { email } = req.body;

  await forgotPasswordService(email);

  const response: XResponse = {
    message: "If an account with that email exists, a reset link has been sent.",
  };
  res.status(httpStatus.OK).send(response);
});

export const resetPasswordController = catchAsync(async (req: XRequest, res: Response) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) throw new ApiError(httpStatus.BAD_REQUEST, "New password is required");
  if (password.length < 8)
    throw new ApiError(httpStatus.BAD_REQUEST, "Password must be at least 8 characters");

  await resetPasswordService(token.toString(), password);

  const response: XResponse = {
    message: "Password reset successful. Please log in with your new password.",
  };
  res.status(httpStatus.OK).send(response);
});

export const verifyEmailController = catchAsync(async (req: XRequest, res: Response) => {
  const { token } = req.params;

  await verifyEmailService(token.toString());

  const response: XResponse = {
    message: "Email verified successfully.",
  };
  res.status(httpStatus.OK).send(response);
});