import mongoose, { Document } from "mongoose";

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "rejected";

export interface IAppointment extends Document {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  appointmentDate: Date;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  appointmentType: "video" | "in-person";
  symptoms?: string;
  consultationNotes?: string;
  consultationFee: number;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
}

const appointmentSchema = new mongoose.Schema<IAppointment>(
  {
    appointmentId: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
      unique: true,
    },
    patientId: {
      type: String,
      required: [true, "patientId is required"],
      trim: true,
      index: true,
    },
    doctorId: {
      type: String,
      required: [true, "doctorId is required"],
      trim: true,
      index: true,
    },
    appointmentDate: {
      type: Date,
      required: [true, "appointmentDate is required"],
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
      enum: ["pending", "confirmed", "completed", "cancelled", "rejected"],
      default: "pending",
      index: true,
    },
    appointmentType: {
      type: String,
      enum: ["video", "in-person"],
      required: [true, "appointmentType is required"],
    },
    symptoms: {
      type: String,
      default: "",
      trim: true,
    },
    consultationFee: {
      type: Number,
      required: [true, "consultationFee is required"],
      min: [0, "consultationFee cannot be negative"],
    },
    consultationNotes: {
      type: String,
      default: "",
      trim: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

appointmentSchema.index({ patientId: 1, appointmentDate: -1 });
appointmentSchema.index({ doctorId: 1, appointmentDate: -1 });

const Appointment = mongoose.model<IAppointment>("Appointment", appointmentSchema);

export default Appointment;