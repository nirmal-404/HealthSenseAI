import mongoose, { Document } from "mongoose";

export interface IAdmin extends Document {
  adminId: string;
  userMongoId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: "super-admin" | "moderator";
  permissions: string[];
  createdAt: Date;
}

const adminSchema = new mongoose.Schema<IAdmin>(
  {
    adminId: {
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
    role: {
      type: String,
      enum: ["super-admin", "moderator"],
      required: [true, "role is required"],
    },
    permissions: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const Admin = mongoose.model<IAdmin>("Admin", adminSchema);

export default Admin;