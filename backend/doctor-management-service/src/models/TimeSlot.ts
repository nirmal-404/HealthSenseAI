import mongoose, { Document } from "mongoose";

export interface ITimeSlot extends Document {
  slotId: string;
  doctorId: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: "available" | "booked" | "blocked";
}

const timeSlotSchema = new mongoose.Schema<ITimeSlot>(
  {
    slotId: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
      unique: true,
    },
    doctorId: {
      type: String,
      required: [true, "doctorId is required"],
      trim: true,
      index: true,
    },
    date: {
      type: Date,
      required: [true, "date is required"],
      index: true,
    },
    startTime: {
      type: String,
      required: [true, "startTime is required"],
      trim: true,
    },
    endTime: {
      type: String,
      required: [true, "endTime is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["available", "booked", "blocked"],
      default: "available",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

timeSlotSchema.index({ doctorId: 1, date: 1, startTime: 1 }, { unique: true });

const TimeSlot = mongoose.model<ITimeSlot>("TimeSlot", timeSlotSchema);

export default TimeSlot;