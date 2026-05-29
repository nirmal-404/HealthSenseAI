import mongoose from "mongoose";
import { CONFIG } from "./envConfig";

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(CONFIG.MONGO_URI);
    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection failed", error);
    process.exit(1);
  }
};

export default connectDB;
