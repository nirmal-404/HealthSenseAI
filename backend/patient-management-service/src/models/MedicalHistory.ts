import mongoose, { Document } from "mongoose";

export interface IMedicalHistory extends Document {
  historyId: string;
  patientId: string;
  condition: string;
  diagnosisDate: Date;
  notes?: string;
}

const medicalHistorySchema = new mongoose.Schema<IMedicalHistory>(
  {
    historyId: {
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
    condition: {
      type: String,
      required: [true, "condition is required"],
      trim: true,
    },
    diagnosisDate: {
      type: Date,
      required: [true, "diagnosisDate is required"],
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

medicalHistorySchema.index({ patientId: 1, diagnosisDate: -1 });

const MedicalHistory = mongoose.model<IMedicalHistory>("MedicalHistory", medicalHistorySchema);

export default MedicalHistory;