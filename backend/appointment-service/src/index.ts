const dotenv = require("dotenv");
dotenv.config();

import express from "express";
import routes from "./routes";
import { CONFIG } from "./config/envConfig";
import connectDB from "./config/db";
import { errorConverter, errorHandler } from "./middlewares/errorMiddleware";
import RabbitMQProducer from "./utils/RabbitMQProducer";

const app = express();

connectDB();

// Initialize RabbitMQ Producer
(async () => {
  try {
    console.log("\n Initializing RabbitMQ Producer...");
    await RabbitMQProducer.connect();
    console.log(" RabbitMQ Producer initialized successfully\n");
  } catch (error) {
    console.error("  RabbitMQ Producer initialization error (service will continue):", error);
  }
})();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", routes);

app.use(errorConverter);
app.use(errorHandler);

app.listen(CONFIG.PORT, () => {
  console.log(`Appointment Service is running on port ${CONFIG.PORT}`);
});
