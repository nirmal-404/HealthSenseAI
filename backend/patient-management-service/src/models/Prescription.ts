import mongoose, { Document, Schema } from "mongoose";

export interface IMedicationLine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export interface IPrescription extends Document {
  prescriptionId: string;
  patientId: string;
  doctorId: string;
  appointmentId: string;
  medications: IMedicationLine[];
  notes?: string;
  pdfBuffer: Buffer;
  issuedDate: Date;
}

const medicationLineSchema = new Schema<IMedicationLine>(
  {
    name: {
      type: String,
      required: [true, "Medication name is required"],
      trim: true,
    },
    dosage: {
      type: String,
      required: [true, "Medication dosage is required"],
      trim: true,
    },
    frequency: {
      type: String,
      required: [true, "Medication frequency is required"],
      trim: true,
    },
    duration: {
      type: String,
      required: [true, "Medication duration is required"],
      trim: true,
    },
  },
  {
    _id: false,
  }
);

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
      unique: true,
      index: true,
    },
    medications: {
      type: [medicationLineSchema],
      required: true,
      validate: {
        validator: (lines: IMedicationLine[]) => lines.length > 0 && lines.length <= 30,
        message: "medications must contain between 1 and 30 entries",
      },
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    pdfBuffer: {
      type: Buffer,
      required: [true, "pdfBuffer is required"],
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
prescriptionSchema.index({ doctorId: 1, issuedDate: -1 });

const Prescription = mongoose.model<IPrescription>("Prescription", prescriptionSchema);

export default Prescription;