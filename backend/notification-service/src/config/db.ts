import mongoose from "mongoose";
import { CONFIG } from "./envConfig";

export const connectDB = async () => {
  try {
    await mongoose.connect(CONFIG.MONGO_URI);
    console.log("✓ Connected to MongoDB");
    return mongoose.connection;
  } catch (error) {
    console.error("✗ MongoDB connection error:", error);
    process.exit(1);
  }
};


