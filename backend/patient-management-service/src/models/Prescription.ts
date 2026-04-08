import mongoose, { Document } from "mongoose";

export interface IPrescription extends Document {
  prescriptionId: string;
  patientId: string;
  doctorId: string;
  appointmentId: string;
  medications: string[];
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
  issuedDate: Date;
}

const prescriptionSchema = new mongoose.Schema<IPrescription>(
  {
    prescriptionId: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
      unique: true,
    },
    patientId: {
      type: String,
      required: [true, "patientId is required"],
      index: true,
      trim: true,
    },
    doctorId: {
      type: String,
      required: [true, "doctorId is required"],
      trim: true,
    },
    appointmentId: {
      type: String,
      required: [true, "appointmentId is required"],
      trim: true,
    },
    medications: {
      type: [String],
      default: [],
    },
    dosage: {
      type: String,
      required: [true, "dosage is required"],
      trim: true,
    },
    frequency: {
      type: String,
      required: [true, "frequency is required"],
      trim: true,
    },
    duration: {
      type: String,
      required: [true, "duration is required"],
      trim: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    issuedDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

prescriptionSchema.index({ patientId: 1, issuedDate: -1 });

const Prescription = mongoose.model<IPrescription>("Prescription", prescriptionSchema);

export default Prescription;