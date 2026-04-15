type ConfigType = {
  PORT: number;
  JWT_SECRET: string;
  MONGO_URI: string;
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

  // RabbitMQ Configuration
  RABBITMQ_URL: string;
  APPOINTMENT_EXCHANGE: string;
  APPOINTMENT_QUEUE: string;
  APPOINTMENT_ROUTING_KEY: string;
  RABBITMQ_CONNECTION_MAX_RETRIES: number;
  RABBITMQ_CONNECTION_RETRY_DELAY: number;
};

export const CONFIG: ConfigType = {
  PORT: Number(process.env.PORT) || 50003,
  JWT_SECRET: process.env.JWT_SECRET || "defaultsecret",
  MONGO_URI:
    process.env.MONGO_URI || "mongodb://localhost:27017/healthsenseai_appointment",
  ENV: process.env.NODE_ENV || "development",

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

  // RabbitMQ Configuration
  RABBITMQ_URL: process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672",
  APPOINTMENT_EXCHANGE: process.env.APPOINTMENT_EXCHANGE || "appointments",
  APPOINTMENT_QUEUE: process.env.APPOINTMENT_QUEUE || "appointment_notifications",
  APPOINTMENT_ROUTING_KEY: process.env.APPOINTMENT_ROUTING_KEY || "appointment.booked",
  RABBITMQ_CONNECTION_MAX_RETRIES: Number(process.env.RABBITMQ_CONNECTION_MAX_RETRIES) || 5,
  RABBITMQ_CONNECTION_RETRY_DELAY: Number(process.env.RABBITMQ_CONNECTION_RETRY_DELAY) || 2000,
};