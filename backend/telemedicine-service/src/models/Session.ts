import mongoose, { Schema } from "mongoose";
import { SESSION_STATUS, SUMMARY_STATUS } from "../constants";

export type SoapNote = {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  followUpDate: string | null;
  urgencyLevel: "low" | "medium" | "high";
};

export interface ISession extends mongoose.Document {
  sessionId: string;
  appointmentId?: string;
  doctorId: string;
  patientId: string;
  roomName: string;
  jitsiUrl: string;
  status: string;
  startedAt?: Date;
  endedAt?: Date;
  recordingUrl?: string;
  transcript?: string;
  soapNote?: SoapNote;
  summaryStatus: string;
  summaryError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const soapSchema = new Schema(
  {
    subjective: { type: String, required: true },
    objective: { type: String, required: true },
    assessment: { type: String, required: true },
    plan: { type: String, required: true },
    followUpDate: { type: String, default: null },
    urgencyLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      required: true,
    },
  },
  { _id: false },
);

const sessionSchema = new Schema<ISession>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    appointmentId: { type: String },
    doctorId: { type: String, required: true, index: true },
    patientId: { type: String, required: true, index: true },
    roomName: { type: String, required: true },
    jitsiUrl: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(SESSION_STATUS),
      default: SESSION_STATUS.SCHEDULED,
    },
    startedAt: { type: Date },
    endedAt: { type: Date },
    recordingUrl: { type: String },
    transcript: { type: String },
    soapNote: { type: soapSchema },
    summaryStatus: {
      type: String,
      enum: Object.values(SUMMARY_STATUS),
      default: SUMMARY_STATUS.PENDING,
    },
    summaryError: { type: String },
  },
  { timestamps: true },
);

export const SessionModel =
  mongoose.models.TelemedicineSession ||
  mongoose.model<ISession>("TelemedicineSession", sessionSchema);
