import mongoose, { Document } from "mongoose";

export interface IDoctor extends Document {
  doctorId: string;
  userMongoId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  specialization: string;
  qualification: string[];
  licenseNumber: string;
  experience: number;
  consultationFee: number;
  biography?: string;
  profileImage?: string;
  isVerified: boolean;
  rating: number;
}

const doctorSchema = new mongoose.Schema<IDoctor>(
  {
    doctorId: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
      unique: true,
    },
    userMongoId: {
      type: String,
      trim: true,
      index: true,
      sparse: true,
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
    specialization: {
      type: String,
      required: [true, "specialization is required"],
      trim: true,
      index: true,
    },
    qualification: {
      type: [String],
      default: [],
    },
    licenseNumber: {
      type: String,
      required: [true, "licenseNumber is required"],
      unique: true,
      trim: true,
    },
    experience: {
      type: Number,
      min: 0,
      default: 0,
    },
    consultationFee: {
      type: Number,
      min: 0,
      default: 0,
    },
    biography: {
      type: String,
      default: "",
      trim: true,
    },
    profileImage: {
      type: String,
      default: "",
      trim: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

doctorSchema.index({ specialization: 1, rating: -1 });

const Doctor = mongoose.model<IDoctor>("Doctor", doctorSchema);

export default Doctor;