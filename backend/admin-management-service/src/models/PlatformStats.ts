import mongoose, { Document } from "mongoose";

export interface IPlatformStats extends Document {
  statsId: string;
  date: Date;
  totalPatients: number;
  totalDoctors: number;
  totalAppointments: number;
  totalRevenue: number;
  activeUsers: number;
}

const platformStatsSchema = new mongoose.Schema<IPlatformStats>(
  {
    statsId: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
      unique: true,
    },
    date: {
      type: Date,
      required: [true, "date is required"],
      index: true,
      unique: true,
    },
    totalPatients: {
      type: Number,
      default: 0,
    },
    totalDoctors: {
      type: Number,
      default: 0,
    },
    totalAppointments: {
      type: Number,
      default: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
    },
    activeUsers: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const PlatformStats = mongoose.model<IPlatformStats>("PlatformStats", platformStatsSchema);

export default PlatformStats;