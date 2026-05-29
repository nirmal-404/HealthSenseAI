import mongoose, { Document } from "mongoose";

export interface IDoctorVerification extends Document {
  verificationId: string;
  doctorId: string;
  documents: string[];
  status: "pending" | "approved" | "rejected";
  reviewedBy?: string;
  reviewNotes?: string;
  submittedAt: Date;
  reviewedAt?: Date;
}

const doctorVerificationSchema = new mongoose.Schema<IDoctorVerification>(
  {
    verificationId: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
      unique: true,
    },
    doctorId: {
      type: String,
      required: [true, "doctorId is required"],
      trim: true,
      index: true,
      unique: true,
    },
    documents: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    reviewedBy: {
      type: String,
      trim: true,
      default: "",
    },
    reviewNotes: {
      type: String,
      default: "",
      trim: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const DoctorVerification = mongoose.model<IDoctorVerification>(
  "DoctorVerification",
  doctorVerificationSchema
);

export default DoctorVerification;