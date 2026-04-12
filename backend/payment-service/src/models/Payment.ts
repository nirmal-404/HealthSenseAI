import mongoose, { Document } from "mongoose";

export type PaymentStatus =
  | "pending"
  | "success"
  | "completed"
  | "failed"
  | "refunded";

export interface IPayment extends Document {
  paymentId: string;
  appointmentId: string;
  userId: string;
  patientId: string;
  doctorId: string;
  amount: number;
  currency: "LKR";
  paymentMethod: "mock" | "stripe" | "payhere";
  stripePaymentIntentId?: string;
  transactionId?: string;
  status: PaymentStatus;
  failureReason?: string;
  refundReason?: string;
  initiatedAt: Date;
  completedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const paymentSchema = new mongoose.Schema<IPayment>(
  {
    paymentId: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
      unique: true,
    },
    appointmentId: {
      type: String,
      required: [true, "appointmentId is required"],
      trim: true,
      index: true,
    },
    userId: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    patientId: {
      type: String,
      required: [true, "patientId is required"],
      trim: true,
      index: true,
    },
    doctorId: {
      type: String,
      required: [true, "doctorId is required"],
      trim: true,
      index: true,
    },
    amount: {
      type: Number,
      required: [true, "amount is required"],
      min: 0,
    },
    currency: {
      type: String,
      enum: ["LKR"],
      default: "LKR",
    },
    paymentMethod: {
      type: String,
      enum: ["mock", "stripe", "payhere"],
      default: "mock",
    },
    stripePaymentIntentId: {
      type: String,
      trim: true,
      index: true,
    },
    transactionId: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "success", "completed", "failed", "refunded"],
      default: "pending",
      index: true,
    },
    failureReason: {
      type: String,
      default: "",
      trim: true,
    },
    refundReason: {
      type: String,
      default: "",
      trim: true,
    },
    initiatedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ patientId: 1, initiatedAt: -1 });
paymentSchema.index({ appointmentId: 1, status: 1 });
paymentSchema.index({ stripePaymentIntentId: 1 }, { unique: true, sparse: true });

const Payment = mongoose.model<IPayment>("Payment", paymentSchema);

export default Payment;
