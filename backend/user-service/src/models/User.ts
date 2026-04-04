import mongoose, { Document } from "mongoose";
import bcrypt from "bcrypt";

export interface IUser extends Document {
  userId: string;
  email: string;
  passwordHash: string;
  role: "patient" | "doctor" | "admin";
  isActive: boolean;
  lastLogin: Date | null;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  twoFactorSecret?: string;
  isTwoFactorEnabled: boolean;
  passwordChangedAt?: Date;

  comparePassword(candidatePassword: string): Promise<boolean>;
  changedPasswordAfter(JWTTimestamp: number): boolean;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    userId: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
      unique: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    passwordHash: {
      type: String,
      required: [true, "Password is required"],
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ["patient", "doctor", "admin"],
      default: "patient",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    twoFactorSecret: {
      type: String,
      select: false,
    },
    isTwoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    passwordChangedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.pre("save", async function () {
  const user = this as IUser;

  if (!user.isModified("passwordHash")) return;

  user.passwordHash = await bcrypt.hash(user.passwordHash, 12);

  user.passwordChangedAt = new Date();
});

// Compare password
userSchema.methods.comparePassword = async function (
  candidatePassword: string
) {
  const user = this as IUser;
  return await bcrypt.compare(candidatePassword, user.passwordHash);
};

// Check if password changed after JWT
userSchema.methods.changedPasswordAfter = function (
  JWTTimestamp: number
) {
  const user = this as IUser;

  if (user.passwordChangedAt) {
    const changedTimestamp = Math.floor(
      user.passwordChangedAt.getTime() / 1000
    );
    return JWTTimestamp < changedTimestamp;
  }

  return false;
};

const User = mongoose.model<IUser>("User", userSchema);

export default User;