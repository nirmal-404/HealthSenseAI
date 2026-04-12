import axios from "axios";
import httpStatus from "http-status";
import Stripe from "stripe";
import { CONFIG } from "../config/envConfig";
import Payment from "../models/Payment";
import { XAuthUser } from "../types/XRequest";
import { ApiError } from "../utils/ApiError";

type CreatePaymentIntentInput = {
  appointmentId: string;
  notes?: string;
};

type ProcessPaymentInput = {
  paymentMethod?: "mock" | "stripe" | "payhere";
  notes?: string;
};

type RefundPaymentInput = {
  reason?: string;
};

type AppointmentForPayment = {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  appointmentDate: Date | string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "rejected";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
};

type DoctorBillingData = {
  doctorId: string;
  userMongoId: string;
  consultationFee: number;
  firstName: string;
  lastName: string;
};

type PatientIdentityData = {
  patientId: string;
  userMongoId: string;
  firstName: string;
  lastName: string;
  email: string;
};

type InternalUserData = {
  id: string;
  role: "patient" | "doctor" | "admin";
  isActive: boolean;
  email: string;
};

type ConfirmPaymentStatus = "pending" | "success" | "failed" | "refunded";

const internalHeaders = {
  "x-internal-service-key": CONFIG.JWT_SECRET,
};

let stripeClient: Stripe | null = null;

const getStripeClient = () => {
  if (!CONFIG.STRIPE_SECRET_KEY) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Stripe secret key is not configured");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(CONFIG.STRIPE_SECRET_KEY);
  }

  return stripeClient;
};

const getAppointmentForPayment = async (appointmentId: string): Promise<AppointmentForPayment> => {
  try {
    const response = await axios.get<{ data?: AppointmentForPayment }>(
      `${CONFIG.APPOINTMENT_SERVICE_URL}/appointments/${encodeURIComponent(appointmentId)}`,
      { headers: internalHeaders, timeout: 5000 }
    );

    const appointment = response.data?.data;
    if (!appointment) {
      throw new ApiError(
        httpStatus.BAD_GATEWAY,
        "Appointment service response did not include appointment details"
      );
    }

    return appointment;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === httpStatus.NOT_FOUND) {
      throw new ApiError(httpStatus.NOT_FOUND, "Appointment not found");
    }

    throw new ApiError(httpStatus.BAD_GATEWAY, "Failed to validate appointment");
  }
};

const confirmAppointmentPayment = async (
  appointmentId: string,
  paymentId: string,
  status: ConfirmPaymentStatus,
  notes?: string
) => {
  await axios.post(
    `${CONFIG.APPOINTMENT_SERVICE_URL}/appointments/confirm-payment`,
    {
      appointmentId,
      paymentId,
      status,
      notes: notes || "",
    },
    { headers: internalHeaders, timeout: 5000 }
  );
};

const updateAppointmentPaymentStatus = async (
  appointmentId: string,
  paymentStatus: "pending" | "paid" | "failed" | "refunded",
  notes?: string
) => {
  await axios.put(
    `${CONFIG.APPOINTMENT_SERVICE_URL}/internal/appointments/${encodeURIComponent(
      appointmentId
    )}/payment-status`,
    { paymentStatus, notes: notes || "" },
    { headers: internalHeaders, timeout: 5000 }
  );
};

const getDoctorBillingData = async (doctorId: string): Promise<DoctorBillingData> => {
  try {
    const response = await axios.get<{ data?: DoctorBillingData }>(
      `${CONFIG.DOCTOR_MANAGEMENT_SERVICE_URL}/internal/doctors/${encodeURIComponent(
        doctorId
      )}/billing`,
      { headers: internalHeaders, timeout: 5000 }
    );

    const billing = response.data?.data;
    if (!billing) {
      throw new ApiError(
        httpStatus.BAD_GATEWAY,
        "Doctor service response did not include billing details"
      );
    }

    return billing;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === httpStatus.NOT_FOUND) {
      throw new ApiError(httpStatus.NOT_FOUND, "Doctor not found");
    }

    throw new ApiError(httpStatus.BAD_GATEWAY, "Failed to fetch doctor billing details");
  }
};

const getPatientIdentityData = async (patientId: string): Promise<PatientIdentityData> => {
  try {
    const response = await axios.get<{ data?: PatientIdentityData }>(
      `${CONFIG.PATIENT_MANAGEMENT_SERVICE_URL}/internal/patients/${encodeURIComponent(
        patientId
      )}/identity`,
      { headers: internalHeaders, timeout: 5000 }
    );

    const identity = response.data?.data;
    if (!identity) {
      throw new ApiError(
        httpStatus.BAD_GATEWAY,
        "Patient service response did not include identity details"
      );
    }

    return identity;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === httpStatus.NOT_FOUND) {
      throw new ApiError(httpStatus.NOT_FOUND, "Patient not found");
    }

    throw new ApiError(httpStatus.BAD_GATEWAY, "Failed to fetch patient details");
  }
};

const getInternalUserData = async (userId: string): Promise<InternalUserData> => {
  try {
    const response = await axios.get<{ data?: InternalUserData }>(
      `${CONFIG.USER_SERVICE_URL}/internal/users/${encodeURIComponent(userId)}`,
      { headers: internalHeaders, timeout: 5000 }
    );

    const user = response.data?.data;
    if (!user) {
      throw new ApiError(
        httpStatus.BAD_GATEWAY,
        "User service response did not include user details"
      );
    }

    return user;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === httpStatus.NOT_FOUND) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    throw new ApiError(httpStatus.BAD_GATEWAY, "Failed to fetch user details");
  }
};

const assertPatientOwnership = async (
  patientId: string,
  user: XAuthUser
): Promise<PatientIdentityData> => {
  const identity = await getPatientIdentityData(patientId);

  if (user.role === "patient" && identity.userMongoId !== user.id) {
    throw new ApiError(httpStatus.FORBIDDEN, "Forbidden: Access denied");
  }

  return identity;
};

const assertDoctorOwnership = async (doctorId: string, user: XAuthUser): Promise<void> => {
  if (user.role !== "doctor") {
    return;
  }

  const doctorBilling = await getDoctorBillingData(doctorId);

  if (doctorBilling.userMongoId !== user.id) {
    throw new ApiError(httpStatus.FORBIDDEN, "Forbidden: Access denied");
  }
};

const getNormalizedStatus = (status: string): "pending" | "success" | "failed" | "refunded" => {
  if (status === "completed") {
    return "success";
  }

  if (status === "pending" || status === "success" || status === "failed" || status === "refunded") {
    return status;
  }

  return "pending";
};

export const createPaymentIntentService = async (
  payload: CreatePaymentIntentInput,
  requestedBy: XAuthUser
) => {
  const appointment = await getAppointmentForPayment(payload.appointmentId);

  if (appointment.status !== "confirmed") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Payment can be initiated only for confirmed appointments"
    );
  }

  if (appointment.paymentStatus === "paid") {
    throw new ApiError(httpStatus.CONFLICT, "Appointment is already paid");
  }

  const patientIdentity = await assertPatientOwnership(appointment.patientId, requestedBy);
  const payerUser = await getInternalUserData(patientIdentity.userMongoId);

  if (!payerUser.isActive) {
    throw new ApiError(httpStatus.FORBIDDEN, "Payer account is not active");
  }

  const doctorBilling = await getDoctorBillingData(appointment.doctorId);
  const amount = Number(doctorBilling.consultationFee);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Doctor consultation fee is not configured");
  }

  const existingSuccessfulPayment = await Payment.findOne({
    appointmentId: appointment.appointmentId,
    status: { $in: ["success", "completed"] },
  });

  if (existingSuccessfulPayment) {
    throw new ApiError(httpStatus.CONFLICT, "Payment already completed for this appointment");
  }

  const amountInCents = Math.round(amount * 100);

  if (amountInCents <= 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid payment amount");
  }

  const stripe = getStripeClient();
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: "lkr",
    automatic_payment_methods: {
      enabled: true,
    },
    metadata: {
      appointmentId: appointment.appointmentId,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      userId: patientIdentity.userMongoId,
    },
    description: `HealthSense consultation payment for appointment ${appointment.appointmentId}`,
  });

  const payment = await Payment.create({
    appointmentId: appointment.appointmentId,
    userId: patientIdentity.userMongoId,
    patientId: appointment.patientId,
    doctorId: appointment.doctorId,
    amount,
    currency: "LKR",
    paymentMethod: "stripe",
    stripePaymentIntentId: paymentIntent.id,
    status: "pending",
    initiatedAt: new Date(),
  });

  console.log(
    `[payment-service] Stripe PaymentIntent created for appointment ${appointment.appointmentId}, payment ${payment.paymentId}`
  );

  return {
    paymentId: payment.paymentId,
    appointmentId: payment.appointmentId,
    userId: payment.userId,
    patientId: payment.patientId,
    doctorId: payment.doctorId,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    stripePaymentIntentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret,
    notes: payload.notes || "",
  };
};

export const processAppointmentPaymentService = async (
  appointmentId: string,
  payload: ProcessPaymentInput,
  requestedBy: XAuthUser
) => {
  const appointment = await getAppointmentForPayment(appointmentId);

  if (appointment.status !== "confirmed") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Payment can be processed only for confirmed appointments"
    );
  }

  if (appointment.paymentStatus === "paid") {
    throw new ApiError(httpStatus.CONFLICT, "Appointment is already paid");
  }

  const patientIdentity = await assertPatientOwnership(appointment.patientId, requestedBy);
  const payerUser = await getInternalUserData(patientIdentity.userMongoId);

  if (!payerUser.isActive) {
    throw new ApiError(httpStatus.FORBIDDEN, "Payer account is not active");
  }

  const doctorBilling = await getDoctorBillingData(appointment.doctorId);
  const amount = Number(doctorBilling.consultationFee);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Doctor consultation fee is not configured");
  }

  const existingCompletedPayment = await Payment.findOne({
    appointmentId,
    status: { $in: ["success", "completed"] },
  });

  if (existingCompletedPayment) {
    throw new ApiError(httpStatus.CONFLICT, "Payment already completed for this appointment");
  }

  const payment = await Payment.create({
    appointmentId,
    userId: patientIdentity.userMongoId,
    patientId: appointment.patientId,
    doctorId: appointment.doctorId,
    amount,
    currency: "LKR",
    paymentMethod: payload.paymentMethod || "mock",
    status: "pending",
    initiatedAt: new Date(),
  });

  try {
    await updateAppointmentPaymentStatus(
      appointmentId,
      "paid",
      payload.notes || "Payment completed"
    );

    payment.status = "completed";
    payment.transactionId = `MOCK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    payment.completedAt = new Date();
    await payment.save();
  } catch (error) {
    payment.status = "failed";
    payment.failureReason = "Failed to sync appointment payment status";
    await payment.save();

    throw new ApiError(httpStatus.BAD_GATEWAY, "Payment processed but appointment update failed");
  }

  return {
    payment,
    appointment: {
      appointmentId: appointment.appointmentId,
      appointmentDate: appointment.appointmentDate,
    },
    patient: {
      patientId: patientIdentity.patientId,
      firstName: patientIdentity.firstName,
      lastName: patientIdentity.lastName,
      email: patientIdentity.email,
    },
    doctor: {
      doctorId: doctorBilling.doctorId,
      firstName: doctorBilling.firstName,
      lastName: doctorBilling.lastName,
      consultationFee: doctorBilling.consultationFee,
    },
  };
};

export const getPaymentStatusService = async (paymentId: string, requestedBy: XAuthUser) => {
  const payment = await Payment.findOne({ paymentId });

  if (!payment) {
    throw new ApiError(httpStatus.NOT_FOUND, "Payment not found");
  }

  if (requestedBy.role === "patient") {
    const identity = await getPatientIdentityData(payment.patientId);

    if (identity.userMongoId !== requestedBy.id) {
      throw new ApiError(httpStatus.FORBIDDEN, "Forbidden: Access denied");
    }
  }

  await assertDoctorOwnership(payment.doctorId, requestedBy);

  return {
    paymentId: payment.paymentId,
    appointmentId: payment.appointmentId,
    status: payment.status,
    normalizedStatus: getNormalizedStatus(payment.status),
    amount: payment.amount,
    currency: payment.currency,
    updatedAt: payment.updatedAt,
  };
};

export const getPaymentByIdService = async (id: string, requestedBy: XAuthUser) => {
  const payment = await Payment.findOne({ paymentId: id });

  if (!payment) {
    throw new ApiError(httpStatus.NOT_FOUND, "Payment not found");
  }

  if (requestedBy.role === "patient") {
    const identity = await getPatientIdentityData(payment.patientId);

    if (identity.userMongoId !== requestedBy.id) {
      throw new ApiError(httpStatus.FORBIDDEN, "Forbidden: Access denied");
    }
  }

  await assertDoctorOwnership(payment.doctorId, requestedBy);

  return {
    paymentId: payment.paymentId,
    appointmentId: payment.appointmentId,
    userId: payment.userId,
    patientId: payment.patientId,
    doctorId: payment.doctorId,
    amount: payment.amount,
    currency: payment.currency,
    paymentMethod: payment.paymentMethod,
    stripePaymentIntentId: payment.stripePaymentIntentId || "",
    transactionId: payment.transactionId || "",
    status: payment.status,
    normalizedStatus: getNormalizedStatus(payment.status),
    initiatedAt: payment.initiatedAt,
    completedAt: payment.completedAt,
    failureReason: payment.failureReason || "",
    refundReason: payment.refundReason || "",
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  };
};

export const getPatientPaymentHistoryService = async (
  patientId: string,
  requestedBy: XAuthUser
) => {
  await assertPatientOwnership(patientId, requestedBy);

  const history = await Payment.find({ patientId }).sort({ initiatedAt: -1 });
  return history;
};

export const refundPaymentService = async (
  paymentId: string,
  payload: RefundPaymentInput,
  requestedBy: XAuthUser
) => {
  const payment = await Payment.findOne({ paymentId });

  if (!payment) {
    throw new ApiError(httpStatus.NOT_FOUND, "Payment not found");
  }

  if (!["success", "completed"].includes(payment.status)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Only successful payments can be refunded");
  }

  await updateAppointmentPaymentStatus(
    payment.appointmentId,
    "refunded",
    payload.reason || `Refund processed by ${requestedBy.id}`
  );

  payment.status = "refunded";
  payment.refundReason = payload.reason || "";
  payment.completedAt = new Date();
  await payment.save();

  return payment;
};

const handlePaymentIntentSucceeded = async (paymentIntent: Stripe.PaymentIntent) => {
  const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntent.id });

  if (!payment) {
    console.warn(
      `[payment-service] Stripe success webhook received for unknown payment intent ${paymentIntent.id}`
    );
    return;
  }

  if (["success", "completed", "refunded"].includes(payment.status)) {
    return;
  }

  payment.status = "success";
  payment.transactionId = paymentIntent.id;
  payment.failureReason = "";
  payment.completedAt = new Date();
  await payment.save();

  await confirmAppointmentPayment(
    payment.appointmentId,
    payment.paymentId,
    "success",
    "Payment confirmed by Stripe webhook"
  );

  console.log(
    `[payment-service] Payment ${payment.paymentId} marked successful via Stripe webhook`
  );
};

const handlePaymentIntentFailed = async (paymentIntent: Stripe.PaymentIntent) => {
  const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntent.id });

  if (!payment) {
    console.warn(
      `[payment-service] Stripe failure webhook received for unknown payment intent ${paymentIntent.id}`
    );
    return;
  }

  if (["success", "completed", "refunded"].includes(payment.status)) {
    return;
  }

  payment.status = "failed";
  payment.failureReason =
    paymentIntent.last_payment_error?.message || "Payment failed at Stripe";
  await payment.save();

  await confirmAppointmentPayment(
    payment.appointmentId,
    payment.paymentId,
    "failed",
    payment.failureReason
  );

  console.log(
    `[payment-service] Payment ${payment.paymentId} marked failed via Stripe webhook`
  );
};

export const handleStripeWebhookService = async (signature: string, rawBody: Buffer) => {
  if (!CONFIG.STRIPE_WEBHOOK_SECRET) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Stripe webhook secret is not configured"
    );
  }

  const stripe = getStripeClient();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, CONFIG.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid Stripe webhook signature");
  }

  switch (event.type) {
    case "payment_intent.succeeded":
      await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
      break;
    case "payment_intent.payment_failed":
      await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
      break;
    default:
      console.log(`[payment-service] Stripe webhook ignored for event ${event.type}`);
      break;
  }

  return {
    eventId: event.id,
    eventType: event.type,
    received: true,
  };
};
