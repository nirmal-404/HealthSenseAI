import { Request, Response } from "express";
import RabbitMQProducer from "../utils/RabbitMQProducer";

// Type definition for validation
interface AppointmentPayload {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  appointmentTime: string;
  doctorName: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  doctorEmail: string;
  doctorPhone: string;
  status?: string;
}

/**
 * Validate required fields for appointment payload
 */
const validateAppointmentPayload = (data: any): string | null => {
  const requiredFields = [
    "appointmentId",
    "patientId",
    "doctorId",
    "appointmentDate",
    "appointmentTime",
    "doctorName",
    "patientName",
    "patientEmail",
    "patientPhone",
    "doctorEmail",
    "doctorPhone",
  ];

  const missingFields = requiredFields.filter((field) => !data[field]);
  if (missingFields.length > 0) {
    return `Missing required fields: ${missingFields.join(", ")}`;
  }

  return null;
};

/**
 * Test API: Publish Appointment Booked Event
 * POST /test/publish-appointment-booked
 */
export const publishAppointmentBookedController = async (
  req: Request,
  res: Response
) => {
  try {
    const appointmentData: AppointmentPayload = req.body;

    // Validate payload
    const validationError = validateAppointmentPayload(appointmentData);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
        requiredFields: [
          "appointmentId",
          "patientId",
          "doctorId",
          "appointmentDate",
          "appointmentTime",
          "doctorName",
          "patientName",
          "patientEmail",
          "patientPhone",
          "doctorEmail",
          "doctorPhone",
        ],
      });
    }

    const result = await RabbitMQProducer.publishAppointmentBooked({
      ...appointmentData,
      status: appointmentData.status || "booked",
    });

    res.status(result ? 200 : 500).json({
      success: result,
      message: result
        ? "Appointment booked event published successfully"
        : "Failed to publish event",
      data: {
        eventType: "appointment.booked",
        timestamp: new Date().toISOString(),
        appointmentData: { ...appointmentData, status: appointmentData.status || "booked" },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error publishing event",
      error: error?.message,
    });
  }
};


