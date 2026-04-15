import { randomUUID } from "crypto";
import { DoctorRepository } from "../repositories/doctorRepository";
import { AuthUser } from "../middlewares/auth";
import { ForbiddenError, NotFoundError } from "../errors/AppError";
import { IDoctorProfile } from "../models/DoctorProfile";
import { AppointmentClient } from "./appointmentClient";
import { PatientReportsService } from "./patientReportsService";

/**
 * Doctor profile, availability, appointments, and patient report reads.
 */
export class DoctorService {
  constructor(
    private readonly doctors: DoctorRepository,
    private readonly appointments: AppointmentClient,
    private readonly patients: PatientReportsService,
  ) {}

  private assertDoctor(user: AuthUser, doctorId: string) {
    const r = user.role?.toLowerCase() || "";
    if (r === "admin") return;
    if (r === "doctor" && user.id !== doctorId) {
      throw new ForbiddenError("Cannot modify another doctor");
    }
  }

  /** Returns doctor profile or 404 (read for any authenticated client). */
  async getProfile(doctorId: string) {
    const d = await this.doctors.findByDoctorId(doctorId);
    if (!d) throw new NotFoundError("Doctor profile not found");
    return d;
  }

  /** Creates or updates doctor profile. */
  async upsertProfile(
    doctorId: string,
    body: Partial<IDoctorProfile>,
    user: AuthUser,
  ) {
    this.assertDoctor(user, doctorId);
    return this.doctors.upsertProfile({ ...body, doctorId });
  }

  /** Registers a new doctor profile. */
  async registerProfile(body: Partial<IDoctorProfile>) {
    const doctorId = randomUUID();
    return this.doctors.upsertProfile({ doctorId, ...body });
  }

  /** Searches doctors by specialty. */
  async searchBySpecialty(speciality: string) {
    return this.doctors.findBySpeciality(speciality);
  }

  /** Returns paginated appointment references when available. */
  async listAppointments(doctorId: string, user: AuthUser) {
    this.assertDoctor(user, doctorId);
    return {
      items: [],
      message:
        "Appointment listing is not available in the current appointment service.",
    };
  }

  /** Returns weekly slots and blocked dates. */
  async getAvailability(doctorId: string) {
    const d = await this.getProfile(doctorId);
    return {
      weeklySlots: d.weeklySlots,
      blockedDates: d.blockedDates,
    };
  }

  /** Generates time slots for the next seven days based on availability. */
  async getTimeSlots(doctorId: string) {
    const d = await this.getProfile(doctorId);
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const blockedDateSet = new Set(d.blockedDates.map((b) => b.date));
    const blockedSlotSet = new Set(d.blockedSlotIds || []);
    const slots: Array<{
      slotId: string;
      date: string;
      startTime: string;
      endTime: string;
      status: string;
    }> = [];

    for (let offset = 0; offset < 7; offset += 1) {
      const date = new Date();
      date.setDate(date.getDate() + offset);
      const dateStr = date.toISOString().slice(0, 10);
      const weekday = dayNames[date.getDay()];

      if (blockedDateSet.has(dateStr)) continue;

      for (const slot of d.weeklySlots) {
        if (slot.dayOfWeek.toLowerCase() !== weekday.toLowerCase()) continue;
        const slotId = `${dateStr}-${slot.startTime}-${slot.endTime}`;
        if (blockedSlotSet.has(slotId)) continue;
        slots.push({
          slotId,
          date: dateStr,
          startTime: slot.startTime,
          endTime: slot.endTime,
          status: "available",
        });
      }
    }

    return slots;
  }

  async blockTimeSlot(doctorId: string, slotId: string, user: AuthUser) {
    this.assertDoctor(user, doctorId);
    const d = await this.doctors.addBlockedSlot(doctorId, slotId);
    if (!d) throw new NotFoundError("Doctor profile not found");
    return d;
  }

  /** Replaces availability template and blocked dates. */
  async setAvailability(
    doctorId: string,
    weeklySlots: IDoctorProfile["weeklySlots"],
    blockedDates: IDoctorProfile["blockedDates"],
    user: AuthUser,
  ) {
    this.assertDoctor(user, doctorId);
    const d = await this.doctors.updateAvailability(
      doctorId,
      weeklySlots,
      blockedDates,
    );
    if (!d) throw new NotFoundError("Doctor profile not found");
    return d;
  }

  /** Accepts or rejects an appointment in Appointment service. */
  async respondAppointment(
    appointmentId: string,
    action: "accept" | "reject",
    user: AuthUser,
  ) {
    if (
      user.role?.toLowerCase() !== "doctor" &&
      user.role?.toLowerCase() !== "admin"
    ) {
      throw new ForbiddenError("Only doctors can respond");
    }
    await this.appointments.respond(appointmentId, action);
    return { appointmentId, action, correlationId: randomUUID() };
  }

  /** Proxies patient documents for a doctor. */
  async patientReports(
    doctorId: string,
    patientId: string,
    user: AuthUser,
    authHeader?: string,
  ) {
    this.assertDoctor(user, doctorId);
    const data = await this.patients.fetchPatientDocuments(
      patientId,
      authHeader,
    );
    if (data === null) throw new NotFoundError("Patient reports not found");
    return data;
  }
}
import axios from "axios";
import httpStatus from "http-status";
import Availability from "../models/Availability";
import Doctor from "../models/Doctor";
import TimeSlot from "../models/TimeSlot";
import { CONFIG } from "../config/envConfig";
import { ApiError } from "../utils/ApiError";

type RegisterDoctorInput = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: Date;
  gender: "male" | "female" | "other";
  address?: string;
  password: string;
  specialization: string;
  qualification?: string[];
  licenseNumber: string;
  experience?: number;
  consultationFee?: number;
  biography?: string;
  profileImage?: string;
};

type AvailabilityInput = {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  slotDuration: number;
  isActive?: boolean;
};

const parseTimeToMinutes = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

const formatMinutesToTime = (value: number) => {
  const hh = String(Math.floor(value / 60)).padStart(2, "0");
  const mm = String(value % 60).padStart(2, "0");
  return `${hh}:${mm}`;
};

const dayMap: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const generateUpcomingSlots = async (doctorId: string, availability: AvailabilityInput) => {
  if (!availability.isActive) {
    return;
  }

  const dayIndex = dayMap[availability.dayOfWeek.toLowerCase()];
  const startMinutes = parseTimeToMinutes(availability.startTime);
  const endMinutes = parseTimeToMinutes(availability.endTime);

  const now = new Date();
  const operations: Promise<any>[] = [];

  for (let i = 0; i < 14; i += 1) {
    const date = new Date(now);
    date.setDate(now.getDate() + i);

    if (date.getDay() !== dayIndex) {
      continue;
    }

    const slotDate = new Date(date);
    slotDate.setHours(0, 0, 0, 0);

    for (
      let cursor = startMinutes;
      cursor + availability.slotDuration <= endMinutes;
      cursor += availability.slotDuration
    ) {
      const slotStart = formatMinutesToTime(cursor);
      const slotEnd = formatMinutesToTime(cursor + availability.slotDuration);

      operations.push(
        TimeSlot.updateOne(
          {
            doctorId,
            date: slotDate,
            startTime: slotStart,
          },
          {
            $setOnInsert: {
              doctorId,
              date: slotDate,
              startTime: slotStart,
              endTime: slotEnd,
              status: "available",
            },
          },
          { upsert: true }
        )
      );
    }
  }

  await Promise.all(operations);
};

export const registerDoctorService = async (payload: RegisterDoctorInput) => {
  const { password, dateOfBirth, gender, address, ...doctorProfilePayload } = payload;

  const existingDoctor = await Doctor.findOne({
    $or: [{ email: payload.email.toLowerCase() }, { licenseNumber: payload.licenseNumber }],
  });

  if (existingDoctor) {
    throw new ApiError(httpStatus.CONFLICT, "Doctor with given email or license number already exists");
  }

  const userRegistrationUrl = `${CONFIG.API_GATEWAY_URL}/api/auth/register`;
  const userServicePayload = {
    firstName: doctorProfilePayload.firstName,
    lastName: doctorProfilePayload.lastName,
    email: doctorProfilePayload.email,
    phoneNumber: doctorProfilePayload.phoneNumber,
    dateOfBirth,
    gender,
    address: address || "",
    password,
    role: "doctor",
  };

  const userServiceResponse = await axios.post(userRegistrationUrl, userServicePayload);
  const userMongoId = userServiceResponse.data?.data?.id;

  if (!userMongoId) {
    throw new ApiError(
      httpStatus.BAD_GATEWAY,
      "User service response did not include canonical user id"
    );
  }

  const doctor = await Doctor.create({
    ...doctorProfilePayload,
    email: doctorProfilePayload.email.toLowerCase(),
    userMongoId,
    isVerified: false,
    rating: 0,
  });

  return doctor;
};

export const updateDoctorProfileService = async (
  doctorId: string,
  payload: Partial<RegisterDoctorInput>
) => {
  const doctor = await Doctor.findOneAndUpdate({ doctorId }, payload, {
    new: true,
    runValidators: true,
  });

  if (!doctor) {
    throw new ApiError(httpStatus.NOT_FOUND, "Doctor not found");
  }

  return doctor;
};

export const setAvailabilityService = async (doctorId: string, payload: AvailabilityInput) => {
  const doctor = await Doctor.findOne({ doctorId });
  if (!doctor) {
    throw new ApiError(httpStatus.NOT_FOUND, "Doctor not found");
  }

  const availability = await Availability.findOneAndUpdate(
    { doctorId, dayOfWeek: payload.dayOfWeek.toLowerCase() },
    {
      doctorId,
      dayOfWeek: payload.dayOfWeek.toLowerCase(),
      startTime: payload.startTime,
      endTime: payload.endTime,
      slotDuration: payload.slotDuration,
      isActive: payload.isActive ?? true,
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  );

  await generateUpcomingSlots(doctorId, {
    dayOfWeek: availability.dayOfWeek,
    startTime: availability.startTime,
    endTime: availability.endTime,
    slotDuration: availability.slotDuration,
    isActive: availability.isActive,
  });

  return availability;
};

export const getTimeSlotsService = async (
  doctorId: string,
  filter: { date?: Date; status?: string }
) => {
  const query: Record<string, any> = { doctorId };

  if (filter.status) {
    query.status = filter.status;
  }

  if (filter.date) {
    const start = new Date(filter.date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(filter.date);
    end.setHours(23, 59, 59, 999);
    query.date = { $gte: start, $lte: end };
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    query.date = { $gte: today };
  }

  const slots = await TimeSlot.find(query).sort({ date: 1, startTime: 1 });
  return slots;
};

export const blockTimeSlotService = async (doctorId: string, slotId: string) => {
  const slot = await TimeSlot.findOneAndUpdate(
    { doctorId, slotId },
    { status: "blocked" },
    { new: true, runValidators: true }
  );

  if (!slot) {
    throw new ApiError(httpStatus.NOT_FOUND, "Time slot not found");
  }

  return slot;
};

export const searchDoctorsService = async (filter: { specialty?: string; name?: string }) => {
  const query: Record<string, any> = {};

  if (filter.specialty) {
    query.specialization = { $regex: filter.specialty, $options: "i" };
  }

  if (filter.name) {
    query.$or = [
      { firstName: { $regex: filter.name, $options: "i" } },
      { lastName: { $regex: filter.name, $options: "i" } },
    ];
  }

  const doctors = await Doctor.find(query).sort({ rating: -1, createdAt: -1 });
  return doctors;
};

export const getDoctorAppointmentsService = async (doctorId: string) => {
  try {
    const { data } = await axios.get(`${CONFIG.APPOINTMENT_SERVICE_URL}/doctor/${doctorId}`, {
      timeout: 5000,
      headers: {
        "x-user-id": "doctor-service",
        "x-user-role": "admin",
      },
    });

    return data?.data || [];
  } catch (error) {
    return [];
  }
};

export const getInternalDoctorBillingService = async (doctorId: string) => {
  const doctor = await Doctor.findOne({ doctorId }).select(
    "doctorId userMongoId consultationFee firstName lastName"
  );

  if (!doctor) {
    throw new ApiError(httpStatus.NOT_FOUND, "Doctor not found");
  }

  return {
    doctorId: doctor.doctorId,
    userMongoId: doctor.userMongoId || "",
    consultationFee: doctor.consultationFee,
    firstName: doctor.firstName,
    lastName: doctor.lastName,
  };
};
