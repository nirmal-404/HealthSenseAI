import winston from "winston";
import { CONFIG } from "../config/envConfig";

export const logger = winston.createLogger({
  level: CONFIG.NODE_ENV === "production" ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: "doctor-management-service" },
  transports: [new winston.transports.Console()],
});
