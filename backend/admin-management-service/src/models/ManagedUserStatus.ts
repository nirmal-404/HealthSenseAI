import mongoose, { Document } from "mongoose";

export interface IManagedUserStatus extends Document {
  userId: string;
  userType: "patient" | "doctor" | "admin" | "unknown";
  status: "active" | "suspended";
  updatedBy?: string;
}

const managedUserStatusSchema = new mongoose.Schema<IManagedUserStatus>(
  {
    userId: {
      type: String,
      required: [true, "userId is required"],
      unique: true,
      trim: true,
      index: true,
    },
    userType: {
      type: String,
      enum: ["patient", "doctor", "admin", "unknown"],
      default: "unknown",
    },
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
      index: true,
    },
    updatedBy: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const ManagedUserStatus = mongoose.model<IManagedUserStatus>(
  "ManagedUserStatus",
  managedUserStatusSchema
);

export default ManagedUserStatus;