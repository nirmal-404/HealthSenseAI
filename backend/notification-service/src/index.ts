import express from "express";
import "dotenv/config";
import "reflect-metadata";
import cors from "cors";
import routes from "./routes";
import { CONFIG } from "./config/envConfig";
import { connectDB } from "./config/db";
import { requestLogger, corsHeaders, errorHandler } from "./middlewares";
import EmailService from "./service/EmailService";

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

    app.listen(CONFIG.PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════╗
║  ✓ Notification Service Started                    ║
║  Port: ${CONFIG.PORT}                                   ║
║  Environment: ${CONFIG.ENV}                              ║
║  Email Service: ${emailConnected ? "✓ Connected" : "✗ Disconnected"}               ║
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
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
