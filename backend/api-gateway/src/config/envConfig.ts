export const CONFIG = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET || "defaultsecret",
  ADMIN_MANAGEMENT_SERVICE_URL: process.env.ADMIN_MANAGEMENT_SERVICE_URL || "http://localhost:5001",
  AI_SYMPTOM_CHECKER_SERVICE_URL: process.env.AI_SYMPTOM_CHECKER_SERVICE_URL || "http://localhost:5002",
  APPOINTMENT_SERVICE_URL: process.env.APPOINTMENT_SERVICE_URL || "http://localhost:5003",
  DOCTOR_MANAGEMENT_SERVICE_URL: process.env.DOCTOR_MANAGEMENT_SERVICE_URL || "http://localhost:5004",
  NOTIFICATION_SERVICE_URL: process.env.NOTIFICATION_SERVICE_URL || "http://localhost:5005",
  PATIENT_MANAGEMENT_SERVICE_URL: process.env.PATIENT_MANAGEMENT_SERVICE_URL || "http://localhost:5006",
  PAYMENT_SERVICE_URL: process.env.PAYMENT_SERVICE_URL || "http://localhost:5007",
  TELEMEDICINE_SERVICE_URL: process.env.TELEMEDICINE_SERVICE_URL || "http://localhost:5008",
  USER_SERVICE_URL: process.env.USER_SERVICE_URL || "http://localhost:5009",
};