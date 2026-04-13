import mongoose from "mongoose";
import { CONFIG } from "./envConfig";

export const connectDB = async () => {
  try {
    await mongoose.connect(CONFIG.MONGODB_URI);
    console.log("✓ Connected to MongoDB");
    return mongoose.connection;
  } catch (error) {
    console.error("✗ MongoDB connection error:", error);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log("✓ Disconnected from MongoDB");
  } catch (error) {
    console.error("✗ MongoDB disconnection error:", error);
  }
};
