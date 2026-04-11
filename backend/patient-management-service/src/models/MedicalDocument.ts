import mongoose, { Document } from "mongoose";

export interface IMedicalDocument extends Document {
  documentId: string;
  patientId: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  uploadDate: Date;
  description?: string;
}

const medicalDocumentSchema = new mongoose.Schema<IMedicalDocument>(
  {
    documentId: {
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
    documentType: {
      type: String,
      required: [true, "documentType is required"],
      trim: true,
    },
    fileName: {
      type: String,
      required: [true, "fileName is required"],
      trim: true,
    },
    fileUrl: {
      type: String,
      required: [true, "fileUrl is required"],
      trim: true,
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

medicalDocumentSchema.index({ patientId: 1, uploadDate: -1 });

const MedicalDocument = mongoose.model<IMedicalDocument>("MedicalDocument", medicalDocumentSchema);

export default MedicalDocument;