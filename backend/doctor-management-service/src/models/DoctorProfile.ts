import mongoose, { Schema } from "mongoose";

export type WeeklySlot = {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
};

export type BlockedDate = { date: string };

export interface IDoctorProfile extends mongoose.Document {
  doctorId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  speciality: string;
  qualifications: string[];
  bio?: string;
  licenseNumber?: string;
  weeklySlots: WeeklySlot[];
  blockedDates: BlockedDate[];
  blockedSlotIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

const weeklySlotSchema = new Schema(
  {
    dayOfWeek: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
  },
  { _id: false },
);

const blockedSchema = new Schema(
  { date: { type: String, required: true } },
  { _id: false },
);

const doctorProfileSchema = new Schema<IDoctorProfile>(
  {
    doctorId: { type: String, required: true, unique: true, index: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phoneNumber: { type: String },
    speciality: { type: String, required: true },
    qualifications: { type: [String], default: [] },
    bio: { type: String },
    licenseNumber: { type: String },
    weeklySlots: { type: [weeklySlotSchema], default: [] },
    blockedDates: { type: [blockedSchema], default: [] },
    blockedSlotIds: { type: [String], default: [] },
  },
  { timestamps: true },
);

export const DoctorProfileModel =
  mongoose.models.DoctorProfile ||
  mongoose.model<IDoctorProfile>("DoctorProfile", doctorProfileSchema);
