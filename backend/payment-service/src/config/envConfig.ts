type ConfigType = {
  PORT: number;
  JWT_SECRET: string;
  MONGO_URI: string;
  ENV: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;

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
  PORT: Number(process.env.PORT) || 50007,
  JWT_SECRET: process.env.JWT_SECRET || "defaultsecret",
  MONGO_URI:
    process.env.MONGO_URI || "mongodb://localhost:27017/healthsenseai_payment",
  ENV: process.env.ENV || process.env.NODE_ENV || "development",
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || "",
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || "",

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