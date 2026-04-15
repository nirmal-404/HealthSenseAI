import "dotenv/config";

const num = (v: string | undefined, d: number) =>
  v !== undefined && v !== "" ? Number(v) : d;

export const CONFIG = {
  PORT: num(process.env.PORT, 50004),
  NODE_ENV: process.env.NODE_ENV || "development",
  MONGO_URI:
    process.env.MONGO_URI || "mongodb://localhost:27017/healthsenseai_doctors",
  JWT_SECRET: process.env.JWT_SECRET || "defaultsecret",
  PRESCRIPTION_JWT_SECRET:
    process.env.PRESCRIPTION_JWT_SECRET || "defaultsecret",
  PUBLIC_BASE_URL: process.env.PUBLIC_BASE_URL || "http://localhost:50000/api",
  APPOINTMENT_SERVICE_URL:
    process.env.APPOINTMENT_SERVICE_URL || "http://localhost:50003",
  PATIENT_MANAGEMENT_SERVICE_URL:
    process.env.PATIENT_MANAGEMENT_SERVICE_URL || "http://localhost:50006",
  HTTP_TIMEOUT_MS: num(process.env.HTTP_TIMEOUT_MS, 15000),
};
