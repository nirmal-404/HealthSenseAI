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