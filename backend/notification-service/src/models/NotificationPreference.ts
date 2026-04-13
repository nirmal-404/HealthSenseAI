import { Schema, model, Document } from "mongoose";
import { v4 as uuidv4 } from "uuid";

export interface INotificationPreference extends Document {
  preferenceId: string;
  userId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  appointmentNotifications: boolean;
  paymentNotifications: boolean;
  reminderNotifications: boolean;
  prescriptionNotifications: boolean;
  verificationNotifications: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationPreferenceSchema = new Schema<INotificationPreference>(
  {
    preferenceId: {
      type: String,
      default: uuidv4,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    emailEnabled: {
      type: Boolean,
      default: true,
    },
    smsEnabled: {
      type: Boolean,
      default: true,
    },
    appointmentNotifications: {
      type: Boolean,
      default: true,
    },
    paymentNotifications: {
      type: Boolean,
      default: true,
    },
    reminderNotifications: {
      type: Boolean,
      default: true,
    },
    prescriptionNotifications: {
      type: Boolean,
      default: true,
    },
    verificationNotifications: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default model<INotificationPreference>("NotificationPreference", NotificationPreferenceSchema);
