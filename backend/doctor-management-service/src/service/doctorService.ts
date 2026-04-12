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