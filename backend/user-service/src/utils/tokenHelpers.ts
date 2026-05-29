import jwt from "jsonwebtoken";
import { CONFIG } from "../config/envConfig"

export const signAccessToken = (userId: string, role: string) =>
    jwt.sign({ id: userId, role }, CONFIG.JWT_SECRET, {
        expiresIn: CONFIG.JWT_EXPIRES_IN,
    });

export const signRefreshToken = (userId: string) =>
    jwt.sign({ id: userId }, CONFIG.JWT_REFRESH_SECRET, {
        expiresIn: CONFIG.JWT_REFRESH_EXPIRES_IN,
    });

export const getSessionExpiry = () => {
    const days = CONFIG.SESSION_EXPIRES_DAYS;
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
};