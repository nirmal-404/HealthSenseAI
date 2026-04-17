import express from "express";
import "dotenv/config";
import "reflect-metadata";
import cors from "cors";
import { createServer } from "http";
import routes from "./routes";
import { CONFIG } from "./config/envConfig";
import { connectDB } from "./config/db";
import { requestLogger, corsHeaders, errorHandler } from "./middlewares";
import EmailService from "./service/EmailService";
import SMSService from "./service/SMSService";
import RabbitMQService from "./service/RabbitMQService";
import SocketIOService from "./service/SocketIOService";
import {
  handleAppointmentBooked,
  handleConsultationCompleted,
  handleAppointmentConfirmed,
  handleAppointmentRejected,
} from "./service/EventHandlers";

const app = express();

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(corsHeaders);
app.use(requestLogger);

// CORS configuration
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

// Routes
app.use("/", routes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "UP", code: 200, service: "notification-service" });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    console.log(`
╔════════════════════════════════════════════════════╗
║  Notification Service - Starting                   ║
║  Environment: ${CONFIG.ENV.toUpperCase()}                              ║
║  Port: ${CONFIG.PORT}                                   ║
║  Security: ${CONFIG.EMAIL_SECURE ? "SSL/TLS Enabled" : "Warning: TLS Disabled"}       ║
╚════════════════════════════════════════════════════╝
    `);

    // Connect to MongoDB
    await connectDB();

    // Verify email service connection
    const emailConnected = await EmailService.verifyConnection();

    if (!emailConnected && CONFIG.ENV === "production") {
      console.error("⚠️  WARNING: Email service connection failed in production!");
      console.error("This may cause notification delivery failures.");
    }

    // Verify SMS service connection
    const smsConnected = await SMSService.verifyConnection();

    if (!smsConnected && CONFIG.ENV === "production") {
      console.warn("⚠️  WARNING: SMS service connection failed in production!");
      console.warn("SMS notifications may not be delivered.");
    }

    // Connect to RabbitMQ and set up event handlers
    console.log("\n🔗 Setting up RabbitMQ connection...");
    await RabbitMQService.connect();

    // Register event handlers
    console.log("\n📋 Registering event handlers...");
    RabbitMQService.registerEventHandler(
      "appointment.booked",
      handleAppointmentBooked
    );
    RabbitMQService.registerEventHandler(
      "appointment.confirmed",
      handleAppointmentConfirmed
    );
    RabbitMQService.registerEventHandler(
      "appointment.rejected",
      handleAppointmentRejected
    );
    RabbitMQService.registerEventHandler(
      "consultation.completed",
      handleConsultationCompleted
    );

    // Create HTTP server for Socket.IO
    const httpServer = createServer(app);

    // Initialize Socket.IO for real-time notifications
    console.log("\n🔌 Setting up Socket.IO for real-time notifications...");
    SocketIOService.initialize(httpServer);

    // Start the server
    httpServer.listen(CONFIG.PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════╗
║  ✓ Notification Service Started                    ║
║  Port: ${CONFIG.PORT}                                   ║
║  Environment: ${CONFIG.ENV}                              ║
║  Email Service: ${emailConnected ? "✓ Connected" : "✗ Disconnected"}               ║
║  RabbitMQ: ${RabbitMQService.getConnectionStatus() ? "✓ Connected" : "✗ Disconnected"}                ║
║  Socket.IO: ${SocketIOService.isConnected() ? "✓ Connected" : "✗ Initializing"}              ║
║  Database: ✓ Connected                              ║
╚════════════════════════════════════════════════════╝
      `);

      // Log production-specific configuration
      if (CONFIG.ENV === "production") {
        console.log("Production Configuration:");
        console.log(`  Email Host: ${CONFIG.EMAIL_HOST}`);
        console.log(`  Email Port: ${CONFIG.EMAIL_PORT} (SSL/TLS)`);
        console.log(`  Retry Attempts: ${CONFIG.RETRY_ATTEMPTS}`);
        console.log(`  Retry Delay: ${CONFIG.RETRY_DELAY}ms`);
      }

      console.log("\n📨 Event Listeners Active:");
      console.log(`  - appointment.booked (${CONFIG.APPOINTMENT_QUEUE})`);
      console.log(`  - appointment.confirmed`);
      console.log(`  - appointment.rejected`);
      console.log(`  - consultation.completed (${CONFIG.CONSULTATION_QUEUE})`);
      console.log("\n📱 Real-time Push Notifications: Enabled via Socket.IO");
      console.log("\nService is ready to process events from RabbitMQ!");
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on("SIGTERM", async () => {
  console.log("\n📴 SIGTERM received, shutting down gracefully...");
  await RabbitMQService.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("\n📴 SIGINT received, shutting down gracefully...");
  await RabbitMQService.close();
  process.exit(0);
});

startServer();
