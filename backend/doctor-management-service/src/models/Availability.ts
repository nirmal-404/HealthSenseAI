import mongoose, { Document } from "mongoose";

export interface IAvailability extends Document {
  availabilityId: string;
  doctorId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  slotDuration: number;
  isActive: boolean;
}

const availabilitySchema = new mongoose.Schema<IAvailability>(
  {
    availabilityId: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
      unique: true,
    },
    doctorId: {
      type: String,
      required: [true, "doctorId is required"],
      index: true,
      trim: true,
    },
    dayOfWeek: {
      type: String,
      required: [true, "dayOfWeek is required"],
      enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
      lowercase: true,
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
    slotDuration: {
      type: Number,
      default: 30,
      min: 5,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

availabilitySchema.index({ doctorId: 1, dayOfWeek: 1 }, { unique: true });

const Availability = mongoose.model<IAvailability>("Availability", availabilitySchema);

export default Availability;