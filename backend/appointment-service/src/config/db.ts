import mongoose from "mongoose";
import { CONFIG } from "./envConfig";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(CONFIG.MONGO_URI, {});
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error: any) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

export default connectDB;