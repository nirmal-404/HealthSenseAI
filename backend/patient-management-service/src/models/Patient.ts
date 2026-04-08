import mongoose, { Document } from "mongoose";

export interface IPatient extends Document {
  patientId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: Date;
  gender: "male" | "female" | "other";
  address?: string;
  bloodGroup?: string;
  allergies: string[];
  emergencyContact?: string;
}

const patientSchema = new mongoose.Schema<IPatient>(
  {
    patientId: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
      unique: true,
    },
    firstName: {
      type: String,
      required: [true, "firstName is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "lastName is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    phoneNumber: {
      type: String,
      required: [true, "phoneNumber is required"],
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: [true, "dateOfBirth is required"],
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: [true, "gender is required"],
    },
    address: {
      type: String,
      default: "",
      trim: true,
    },
    bloodGroup: {
      type: String,
      default: "",
      trim: true,
    },
    allergies: {
      type: [String],
      default: [],
    },
    emergencyContact: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Patient = mongoose.model<IPatient>("Patient", patientSchema);

export default Patient;