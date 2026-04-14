export const CONFIG = {
  // Service Configuration
  PORT: process.env.PORT || 5005,
  ENV: process.env.NODE_ENV || "development",
  JWT_SECRET: process.env.JWT_SECRET || "defaultsecret",

  // MongoDB Configuration
  MONGO_URI: process.env.MONGO_URI || "mongodb://mongo:27017/notification-service",

  // Email Configuration (Nodemailer)
  EMAIL_HOST: process.env.EMAIL_HOST || "smtp.gmail.com",
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT || "465"),
  EMAIL_SECURE: process.env.EMAIL_SECURE === "true" || true,
  EMAIL_USER: process.env.EMAIL_USER || "your-email@gmail.com",
  EMAIL_PASSWORD: process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD || "your-app-password",
  EMAIL_FROM: process.env.EMAIL_FROM || "HealthSense <noreply@healthsense.com>",

  // SMS Configuration (Twilio)
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || "",
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || "",
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || "+1234567890",

  // RabbitMQ Configuration
  RABBITMQ_URL: process.env.RABBITMQ_URL || "amqp://guest:guest@rabbitmq:5672",
  RABBITMQ_CONNECTION_RETRY_DELAY: parseInt(process.env.RABBITMQ_CONNECTION_RETRY_DELAY || "5000"), // ms
  RABBITMQ_CONNECTION_MAX_RETRIES: parseInt(process.env.RABBITMQ_CONNECTION_MAX_RETRIES || "10"),

  // RabbitMQ Queue & Exchange Configuration
  APPOINTMENT_EXCHANGE: process.env.APPOINTMENT_EXCHANGE || "appointments",
  APPOINTMENT_QUEUE: process.env.APPOINTMENT_QUEUE || "appointment_notifications",
  APPOINTMENT_ROUTING_KEY: process.env.APPOINTMENT_ROUTING_KEY || "appointment.booked",

  CONSULTATION_EXCHANGE: process.env.CONSULTATION_EXCHANGE || "consultations",
  CONSULTATION_QUEUE: process.env.CONSULTATION_QUEUE || "consultation_notifications",
  CONSULTATION_ROUTING_KEY: process.env.CONSULTATION_ROUTING_KEY || "consultation.completed",

  // Service URLs
  ADMIN_MANAGEMENT_SERVICE_URL: process.env.ADMIN_MANAGEMENT_SERVICE_URL || "http://localhost:5001",
  AI_SYMPTOM_CHECKER_SERVICE_URL: process.env.AI_SYMPTOM_CHECKER_SERVICE_URL || "http://localhost:5002",
  APPOINTMENT_SERVICE_URL: process.env.APPOINTMENT_SERVICE_URL || "http://localhost:5003",
  DOCTOR_MANAGEMENT_SERVICE_URL: process.env.DOCTOR_MANAGEMENT_SERVICE_URL || "http://localhost:5004",
  PATIENT_MANAGEMENT_SERVICE_URL: process.env.PATIENT_MANAGEMENT_SERVICE_URL || "http://localhost:5006",
  PAYMENT_SERVICE_URL: process.env.PAYMENT_SERVICE_URL || "http://localhost:5007",
  TELEMEDICINE_SERVICE_URL: process.env.TELEMEDICINE_SERVICE_URL || "http://localhost:5008",
  USER_SERVICE_URL: process.env.USER_SERVICE_URL || "http://localhost:5009",

  // Notification Configuration
  RETRY_ATTEMPTS: parseInt(process.env.RETRY_ATTEMPTS || "3"),
  RETRY_DELAY: parseInt(process.env.RETRY_DELAY || "5000"), // ms
  NOTIFICATION_TIMEOUT: parseInt(process.env.NOTIFICATION_TIMEOUT || "30000"), // ms
  BATCH_PROCESS_INTERVAL: parseInt(process.env.BATCH_PROCESS_INTERVAL || "60000"), // ms

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
};