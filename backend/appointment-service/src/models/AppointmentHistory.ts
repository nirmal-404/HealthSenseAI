import mongoose, { Document } from "mongoose";

export interface IAppointmentHistory extends Document {
  historyId: string;
  appointmentId: string;
  statusChange: string;
  changedBy: string;
  timestamp: Date;
  notes?: string;
}

const appointmentHistorySchema = new mongoose.Schema<IAppointmentHistory>(
  {
    historyId: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
      unique: true,
    },
    appointmentId: {
      type: String,
      required: [true, "appointmentId is required"],
      index: true,
      trim: true,
    },
    statusChange: {
      type: String,
      required: [true, "statusChange is required"],
      trim: true,
    },
    changedBy: {
      type: String,
      required: [true, "changedBy is required"],
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: false,
  }
);

appointmentHistorySchema.index({ appointmentId: 1, timestamp: -1 });

const AppointmentHistory = mongoose.model<IAppointmentHistory>(
  "AppointmentHistory",
  appointmentHistorySchema
);

export default AppointmentHistory;