import { SignOptions } from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const ENV = process.env.ENV || "local";

if (ENV === "local") {
  dotenv.config({ path: `.env.${ENV}`, override: true });
}

type ConfigType = {
  PORT: number;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_EXPIRES_IN: SignOptions["expiresIn"];
  JWT_REFRESH_EXPIRES_IN: SignOptions["expiresIn"];
  SESSION_EXPIRES_DAYS: number;
  INTERNAL_SERVICE_KEY: string;
  MONGO_URI: string;
  EMAIL_USER: string;
  EMAIL_PASS: string;
  CLIENT_URL: string;
  ENV: string;

  ADMIN_MANAGEMENT_SERVICE_URL: string;
  AI_SYMPTOM_CHECKER_SERVICE_URL: string;
  APPOINTMENT_SERVICE_URL: string;
  DOCTOR_MANAGEMENT_SERVICE_URL: string;
  NOTIFICATION_SERVICE_URL: string;
  PATIENT_MANAGEMENT_SERVICE_URL: string;
  PAYMENT_SERVICE_URL: string;
  TELEMEDICINE_SERVICE_URL: string;
  USER_SERVICE_URL: string;
};

export const CONFIG: ConfigType = {
  PORT: Number(process.env.PORT) || 50009,
  JWT_SECRET: process.env.JWT_SECRET || "defaultsecret",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "defaultrefreshsecret",
  JWT_EXPIRES_IN:
    (process.env.JWT_EXPIRES_IN as SignOptions["expiresIn"]) || "15m",
  JWT_REFRESH_EXPIRES_IN:
    (process.env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"]) || "7d",
  SESSION_EXPIRES_DAYS:
    Number(process.env.SESSION_EXPIRES_DAYS) || 7,
  INTERNAL_SERVICE_KEY:
    process.env.INTERNAL_SERVICE_KEY || "internal-dev-key",
  MONGO_URI:
    process.env.MONGO_URI || "mongodb://localhost:27017/healthsenseai",
  EMAIL_USER:
    process.env.EMAIL_USER || "",
  EMAIL_PASS:
    process.env.EMAIL_PASS || "",
  CLIENT_URL:
    process.env.CLIENT_URL || "http://localhost:50000/api/auth",
  ENV: process.env.ENV || process.env.NODE_ENV || "development",

  ADMIN_MANAGEMENT_SERVICE_URL:
    process.env.ADMIN_MANAGEMENT_SERVICE_URL || "http://localhost:5001",
  AI_SYMPTOM_CHECKER_SERVICE_URL:
    process.env.AI_SYMPTOM_CHECKER_SERVICE_URL || "http://localhost:5002",
  APPOINTMENT_SERVICE_URL:
    process.env.APPOINTMENT_SERVICE_URL || "http://localhost:5003",
  DOCTOR_MANAGEMENT_SERVICE_URL:
    process.env.DOCTOR_MANAGEMENT_SERVICE_URL || "http://localhost:5004",
  NOTIFICATION_SERVICE_URL:
    process.env.NOTIFICATION_SERVICE_URL || "http://localhost:5005",
  PATIENT_MANAGEMENT_SERVICE_URL:
    process.env.PATIENT_MANAGEMENT_SERVICE_URL || "http://localhost:5006",
  PAYMENT_SERVICE_URL:
    process.env.PAYMENT_SERVICE_URL || "http://localhost:5007",
  TELEMEDICINE_SERVICE_URL:
    process.env.TELEMEDICINE_SERVICE_URL || "http://localhost:5008",
  USER_SERVICE_URL:
    process.env.USER_SERVICE_URL || "http://localhost:5009",
};