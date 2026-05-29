import { Schema, model, Document } from "mongoose";
import { v4 as uuidv4 } from "uuid";

export interface INotificationTemplate extends Document {
  templateId: string;
  templateName: string;
  type: "email" | "sms";
  subject?: string;
  bodyTemplate: string;
  variables: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationTemplateSchema = new Schema<INotificationTemplate>(
  {
    templateId: {
      type: String,
      default: uuidv4,
      unique: true,
      index: true,
    },
    templateName: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ["email", "sms"],
      required: true,
    },
    subject: {
      type: String,
      default: null,
    },
    bodyTemplate: {
      type: String,
      required: true,
    },
    variables: [
      {
        type: String,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default model<INotificationTemplate>("NotificationTemplate", NotificationTemplateSchema);
