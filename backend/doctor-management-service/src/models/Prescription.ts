import mongoose, { Schema } from "mongoose";

export type MedicationLine = {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
};

export interface IPrescription extends mongoose.Document {
  prescriptionId: string;
  patientId: string;
  doctorId: string;
  consultationSessionId?: string;
  medications: MedicationLine[];
  notes?: string;
  pdfBuffer: Buffer;
  verifyJwt: string;
  createdAt: Date;
  updatedAt: Date;
}

const medSchema = new Schema(
  {
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true },
  },
  { _id: false },
);

const prescriptionSchema = new Schema<IPrescription>(
  {
    prescriptionId: { type: String, required: true, unique: true, index: true },
    patientId: { type: String, required: true, index: true },
    doctorId: { type: String, required: true, index: true },
    consultationSessionId: { type: String },
    medications: { type: [medSchema], required: true },
    notes: { type: String },
    pdfBuffer: { type: Buffer, required: true },
    verifyJwt: { type: String, required: true },
  },
  { timestamps: true },
);

export const PrescriptionModel =
  mongoose.models.Prescription ||
  mongoose.model<IPrescription>("Prescription", prescriptionSchema);
