import mongoose from "mongoose";
import { CONFIG } from "./envConfig";
import { logger } from "../utils/logger";

/**
 * Connects Mongoose to MongoDB.
 */
export async function connectDb(): Promise<void> {
  mongoose.set("strictQuery", true);
  await mongoose.connect(CONFIG.MONGO_URI);
  logger.info("MongoDB connected");
}
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