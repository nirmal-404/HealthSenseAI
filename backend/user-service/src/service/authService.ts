import crypto from "crypto";
import User from "../models/User";
import Session from "../models/Session";
import { sendEmail } from "../utils/email";
import { ApiError } from "../utils/ApiError";
import { signAccessToken, signRefreshToken, getSessionExpiry } from "../utils/tokenHelpers";
import { CONFIG } from "../config/envConfig";
import httpStatus from "http-status";
import jwt from "jsonwebtoken";
import { JWTPayload } from "../types/JWTPayload";

export const registerService = async ({ email, password, role = "patient" }: { email: string, password: string, role: string }) => {
  try {
    const existingUser = await User.findOne({ email: email });
    if (existingUser) throw new ApiError(httpStatus.CONFLICT, "Email already in use");

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const hashedVerificationToken = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    const user = await User.create({
      email,
      passwordHash: password,
      role,
      emailVerificationToken: hashedVerificationToken,
      emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000,
    });

    const verifyUrl = `${CONFIG.CLIENT_URL}/verify-email/${verificationToken}`;
    await sendEmail({
      to: user.email,
      subject: "Verify your email",
      html: `<p>Click <a href="${verifyUrl}">here</a> to verify your email. Link expires in 24 hours.</p>`,
    });

    return { userId: user.userId, email: user.email, role: user.role };
  } catch (error) {
    console.error(error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Server error');
  }
};

export const loginService = async ({ email, password, ipAddress, userAgent }: { email: string, password: string, ipAddress: string, userAgent: string }) => {
  try {
    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user || !(await user.comparePassword(password))) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid email or password");
    }

    if (!user.isActive) throw new ApiError(httpStatus.FORBIDDEN, "Account is deactivated");
    if (!user.isEmailVerified)
      throw new ApiError(httpStatus.FORBIDDEN, "Please verify your email first");

    const accessToken = signAccessToken(user._id.toString(), user.role);
    const refreshToken = signRefreshToken(user._id.toString());

    await Session.create({
      userId: user._id,
      token: accessToken,
      refreshToken,
      expiresAt: getSessionExpiry(),
      ipAddress,
      userAgent,
    });

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    return {
      accessToken,
      refreshToken,
      user: { userId: user.userId, email: user.email, role: user.role },
    };
  } catch (error) {
    console.error(error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Server error');
  }
};

export const logoutService = async (token: string) => {
  try {
    await Session.findOneAndUpdate({ token }, { isRevoked: true });
  } catch (error) {
    console.error(error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Server error');
  }
};

export const refreshTokenService = async (refreshToken: string) => {
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, CONFIG.JWT_REFRESH_SECRET) as JWTPayload;
    if (!decoded) throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid or expired refresh token");

    const session = await Session.findOne({ refreshToken, isRevoked: false });
    if (!session) throw new ApiError(httpStatus.UNAUTHORIZED, "Session not found or revoked");

    const user = await User.findById(decoded.id);
    if (!user?.isActive) throw new ApiError(httpStatus.UNAUTHORIZED, "User not found");

    const newAccessToken = signAccessToken(user._id.toString(), user.role);
    const newRefreshToken = signRefreshToken(user._id.toString());

    session.token = newAccessToken;
    session.refreshToken = newRefreshToken;
    session.expiresAt = getSessionExpiry();
    await session.save();

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  } catch (error) {
    console.error(error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Server error');
  }
};

export const forgotPasswordService = async (email: string) => {
  try {
    const user = await User.findOne({ email });

    if (!user) return;

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.passwordResetExpires = new Date(Date.now() + 5 * 60 * 1000);; // 10 mins
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    await sendEmail({
      to: user.email,
      subject: "Password Reset Request",
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 1 hour.</p>`,
    });
  } catch (error) {
    console.error(error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Server error');
  }
};

export const resetPasswordService = async (token: string, newPassword: string) => {
  try {
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) throw new ApiError(httpStatus.BAD_REQUEST, "Token is invalid or has expired");

    user.passwordHash = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    await Session.updateMany({ userId: user._id }, { isRevoked: true });
  } catch (error) {
    console.error(error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Server error');
  }
};

export const verifyEmailService = async (token: string) => {
  try {
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    }).select("+emailVerificationToken +emailVerificationExpires");

    if (!user) throw new ApiError(httpStatus.BAD_REQUEST, "Token is invalid or has expired");

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });
  } catch (error) {
    console.error(error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Server error');
  }
};

export const validateTokenService = async (token: string) => {
  let decoded;
  try {
    decoded = jwt.verify(token, CONFIG.JWT_SECRET) as JWTPayload;
    if (!decoded) throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid or expired token");

    const session = await Session.findOne({ token, isRevoked: false });
    if (!session) throw new ApiError(httpStatus.UNAUTHORIZED, "Session not found or revoked");

    const user = await User.findById(decoded.id);
    if (!user?.isActive) throw new ApiError(httpStatus.UNAUTHORIZED, "User not found");

    return { user, decoded };
  } catch (error) {
    console.error(error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Server error');
  }
};