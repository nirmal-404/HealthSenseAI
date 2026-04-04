import mongoose from "mongoose";

const roleSchema = new mongoose.Schema(
  {
    roleId: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
      unique: true,
    },
    roleName: {
      type: String,
      required: [true, "Role name is required"],
      unique: true,
      trim: true,
      lowercase: true,
      enum: ["patient", "doctor", "admin"],
    },
    permissions: {
      type: [String],
      default: [],
      validate: {
        validator: (arr: string[]) => Array.isArray(arr),
        message: "Permissions must be an array",
      },
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Role = mongoose.model("Role", roleSchema);

export default Role;
