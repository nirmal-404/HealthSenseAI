import { Schema, model, Document } from "mongoose";
import { v4 as uuidv4 } from "uuid";

export interface INotification extends Document {
  notificationId: string;
  userId: string;
  type: "email" | "sms" | "push";
  category: "appointment" | "payment" | "reminder" | "prescription" | "verification" | string;
  recipient: string; // email address or phone number
  subject?: string;
  message: string;
  status: "pending" | "sent" | "failed" | "queued";
  retryCount: number;
  maxRetries: number;
  error?: string;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    notificationId: {
      type: String,
      default: uuidv4,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["email", "sms", "push"],
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ["appointment", "payment", "reminder", "prescription", "verification"],
      required: true,
      index: true,
    },
    recipient: {
      type: String,
      required: true,
      index: true,
    },
    subject: {
      type: String,
      default: null,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "sent", "failed", "queued"],
      default: "pending",
      index: true,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    maxRetries: {
      type: Number,
      default: 3,
    },
    error: {
      type: String,
      default: null,
    },
    sentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for querying pending notifications
NotificationSchema.index({ status: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });

export default model<INotification>("Notification", NotificationSchema);
