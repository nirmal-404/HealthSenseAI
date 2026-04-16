import "dotenv/config";

type ConfigType = {
  PORT: number;
  JWT_SECRET: string;
  PRESCRIPTION_JWT_SECRET: string;
  MONGO_URI: string;
  NODE_ENV: string;
  ENV: string;
  API_GATEWAY_URL: string;
  PUBLIC_BASE_URL: string;
  APPOINTMENT_SERVICE_URL: string;
  PATIENT_MANAGEMENT_SERVICE_URL: string;
  HTTP_TIMEOUT_MS: number;
  ADMIN_MANAGEMENT_SERVICE_URL: string;
  AI_SYMPTOM_CHECKER_SERVICE_URL: string;
  DOCTOR_MANAGEMENT_SERVICE_URL: string;
  NOTIFICATION_SERVICE_URL: string;
  PAYMENT_SERVICE_URL: string;
  TELEMEDICINE_SERVICE_URL: string;
  USER_SERVICE_URL: string;
};

export const CONFIG: ConfigType = {
  PORT: Number(process.env.PORT) || 50004,
  NODE_ENV: process.env.NODE_ENV || "development",
  ENV: process.env.ENV || process.env.NODE_ENV || "development",
  JWT_SECRET: process.env.JWT_SECRET || "defaultsecret",
  PRESCRIPTION_JWT_SECRET: process.env.PRESCRIPTION_JWT_SECRET || "defaultsecret",
  MONGO_URI:
    process.env.MONGO_URI || "mongodb://localhost:27017/healthsenseai_doctor",
  API_GATEWAY_URL: process.env.API_GATEWAY_URL || "http://api-gateway:50000",
  PUBLIC_BASE_URL: process.env.PUBLIC_BASE_URL || "http://localhost:50000/api",
  APPOINTMENT_SERVICE_URL:
    process.env.APPOINTMENT_SERVICE_URL || "http://localhost:50003",
  PATIENT_MANAGEMENT_SERVICE_URL:
    process.env.PATIENT_MANAGEMENT_SERVICE_URL || "http://localhost:50006",
  HTTP_TIMEOUT_MS: Number(process.env.HTTP_TIMEOUT_MS) || 15000,
  ADMIN_MANAGEMENT_SERVICE_URL:
    process.env.ADMIN_MANAGEMENT_SERVICE_URL || "http://localhost:5001",
  AI_SYMPTOM_CHECKER_SERVICE_URL:
    process.env.AI_SYMPTOM_CHECKER_SERVICE_URL || "http://localhost:5002",
  DOCTOR_MANAGEMENT_SERVICE_URL:
    process.env.DOCTOR_MANAGEMENT_SERVICE_URL || "http://localhost:5004",
  NOTIFICATION_SERVICE_URL:
    process.env.NOTIFICATION_SERVICE_URL || "http://localhost:5005",
  PAYMENT_SERVICE_URL:
    process.env.PAYMENT_SERVICE_URL || "http://localhost:5007",
  TELEMEDICINE_SERVICE_URL:
    process.env.TELEMEDICINE_SERVICE_URL || "http://localhost:5008",
  USER_SERVICE_URL:
    process.env.USER_SERVICE_URL || "http://localhost:5009",
};
