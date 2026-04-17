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
  startTime?: string;
  endTime?: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "rejected";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  appointmentType?: "video" | "in-person";
  consultationFee?: number;
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

const buildDisplayName = (firstName?: string, lastName?: string): string =>
  [firstName || "", lastName || ""].filter(Boolean).join(" ").trim();

const safeResolveDoctorName = async (
  doctorId: string,
  preferredName?: string
): Promise<string | undefined> => {
  if (preferredName) {
    return preferredName;
  }

  try {
    const doctorBilling = await getDoctorBillingData(doctorId);
    const resolved = buildDisplayName(doctorBilling.firstName, doctorBilling.lastName);
    return resolved || undefined;
  } catch {
    return undefined;
  }
};

const safeResolvePatientName = async (
  patientId: string,
  preferredName?: string
): Promise<string | undefined> => {
  if (preferredName) {
    return preferredName;
  }

  try {
    const patientIdentity = await getPatientIdentityData(patientId);
    const resolved = buildDisplayName(
      patientIdentity.firstName,
      patientIdentity.lastName
    );
    return resolved || undefined;
  } catch {
    return undefined;
  }
};

const provisionTelemedicineSessionIfEligible = async (input: {
  appointmentId: string;
  source: string;
  appointmentSnapshot?: AppointmentForPayment;
  doctorName?: string;
  patientName?: string;
}) => {
  try {
    const appointment =
      input.appointmentSnapshot ||
      (await getAppointmentForPayment(input.appointmentId));

    if (
      appointment.status !== "confirmed" ||
      appointment.paymentStatus !== "paid" ||
      appointment.appointmentType !== "video"
    ) {
      return;
    }

    const [doctorName, patientName] = await Promise.all([
      safeResolveDoctorName(appointment.doctorId, input.doctorName),
      safeResolvePatientName(appointment.patientId, input.patientName),
    ]);

    await axios.post(
      `${CONFIG.TELEMEDICINE_SERVICE_URL}/sessions/create`,
      {
        doctorId: appointment.doctorId,
        patientId: appointment.patientId,
        appointmentId: appointment.appointmentId,
        appointmentType: "video",
        appointmentDate: appointment.appointmentDate,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        consultationFee: appointment.consultationFee,
        doctorName,
        patientName,
      },
      { headers: internalHeaders, timeout: 5000 }
    );

    console.log(
      `[payment-service] Telemedicine session provisioned from ${input.source} for appointment ${appointment.appointmentId}`
    );
  } catch (error: any) {
    const errorDetails = axios.isAxiosError(error)
      ? `${error.response?.status || "n/a"} ${error.response?.data?.message || error.message}`
      : String(error);

    console.warn(
      `[payment-service] Telemedicine provisioning skipped for appointment ${input.appointmentId} (${input.source}): ${errorDetails}`
    );
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

    // Return graceful fallback if doctor service is unavailable
    console.warn(
      `[payment-service] Failed to fetch doctor billing details for ${doctorId}, using fallback`
    );
    return {
      doctorId,
      userMongoId: "",
      consultationFee: 0,
      firstName: "",
      lastName: "",
    };
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

  const amount = Number(appointment.consultationFee);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Appointment consultation fee is not configured");
  }

  const existingSuccessfulPayment = await Payment.findOne({
    appointmentId: appointment.appointmentId,
    status: { $in: ["success", "completed"] },
  });

  if (existingSuccessfulPayment) {
    throw new ApiError(httpStatus.CONFLICT, "Payment already completed for this appointment");
  }

  // Check for existing pending payment - reuse it instead of creating a duplicate
  const existingPendingPayment = await Payment.findOne({
    appointmentId: appointment.appointmentId,
    status: "pending",
  }).sort({ createdAt: -1 });

  if (existingPendingPayment) {
    console.log(
      `[payment-service] Reusing existing pending payment ${existingPendingPayment.paymentId} for appointment ${appointment.appointmentId}`
    );

    let clientSecret: string | null = null;

    // Try to get the clientSecret from Stripe if we have a PaymentIntent ID
    if (existingPendingPayment.stripePaymentIntentId) {
      try {
        const stripe = getStripeClient();
        const existingPaymentIntent = await stripe.paymentIntents.retrieve(
          existingPendingPayment.stripePaymentIntentId
        );
        clientSecret = existingPaymentIntent.client_secret;
      } catch (error) {
        console.warn(
          `[payment-service] Could not retrieve existing PaymentIntent ${existingPendingPayment.stripePaymentIntentId}`
        );
      }
    }

    return {
      paymentId: existingPendingPayment.paymentId,
      appointmentId: existingPendingPayment.appointmentId,
      userId: existingPendingPayment.userId,
      patientId: existingPendingPayment.patientId,
      doctorId: existingPendingPayment.doctorId,
      amount: existingPendingPayment.amount,
      currency: existingPendingPayment.currency,
      status: existingPendingPayment.status,
      stripePaymentIntentId: existingPendingPayment.stripePaymentIntentId || "",
      clientSecret,
      notes: payload.notes || "",
    };
  }

  const amountInCents = Math.round(amount * 100);

  if (amountInCents <= 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid payment amount");
  }

  const doctorBilling = await getDoctorBillingData(appointment.doctorId);

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

  let payment;
  try {
    payment = await Payment.create({
      appointmentId: appointment.appointmentId,
      userId: patientIdentity.userMongoId,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      doctorFirstName: doctorBilling.firstName,
      doctorLastName: doctorBilling.lastName,
      amount,
      currency: "LKR",
      paymentMethod: "stripe",
      stripePaymentIntentId: paymentIntent.id,
      status: "pending",
      initiatedAt: new Date(),
    });
  } catch (error: any) {
    // Handle duplicate key error - reuse existing pending payment
    if (error.code === 11000 && error.keyValue?.status === "pending") {
      console.log(
        `[payment-service] Duplicate pending payment detected for appointment ${appointment.appointmentId}, reusing existing payment`
      );
      const existingPayment = await Payment.findOne({
        appointmentId: appointment.appointmentId,
        status: "pending",
      });
      if (existingPayment) {
        return {
          paymentId: existingPayment.paymentId,
          appointmentId: existingPayment.appointmentId,
          userId: existingPayment.userId,
          patientId: existingPayment.patientId,
          doctorId: existingPayment.doctorId,
          amount: existingPayment.amount,
          currency: existingPayment.currency,
          status: existingPayment.status,
          stripePaymentIntentId: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
          notes: payload.notes || "",
        };
      }
    }
    throw error;
  }

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

  const amount = Number(appointment.consultationFee);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Appointment consultation fee is not configured");
  }

  const doctorBilling = await getDoctorBillingData(appointment.doctorId);

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

    await provisionTelemedicineSessionIfEligible({
      appointmentId,
      source: "direct-payment",
      appointmentSnapshot: {
        ...appointment,
        paymentStatus: "paid",
      },
      doctorName: buildDisplayName(doctorBilling.firstName, doctorBilling.lastName) || undefined,
      patientName: buildDisplayName(patientIdentity.firstName, patientIdentity.lastName) || undefined,
    });
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
      consultationFee: amount,
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

export const confirmStripePaymentService = async (
  paymentId: string,
  requestedBy: XAuthUser
) => {
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

  if (payment.paymentMethod !== "stripe") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Payment is not a Stripe payment");
  }

  if (!payment.stripePaymentIntentId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Stripe payment intent is missing");
  }

  if (["success", "completed"].includes(payment.status)) {
    await provisionTelemedicineSessionIfEligible({
      appointmentId: payment.appointmentId,
      source: "stripe-confirm-retry",
      doctorName:
        buildDisplayName(payment.doctorFirstName, payment.doctorLastName) ||
        undefined,
    });

    return {
      paymentId: payment.paymentId,
      appointmentId: payment.appointmentId,
      status: payment.status,
      normalizedStatus: getNormalizedStatus(payment.status),
      amount: payment.amount,
      currency: payment.currency,
      updatedAt: payment.updatedAt,
    };
  }

  if (payment.status === "refunded") {
    return {
      paymentId: payment.paymentId,
      appointmentId: payment.appointmentId,
      status: payment.status,
      normalizedStatus: getNormalizedStatus(payment.status),
      amount: payment.amount,
      currency: payment.currency,
      updatedAt: payment.updatedAt,
    };
  }

  if (payment.status !== "success" && payment.status !== "completed") {
    const stripe = getStripeClient();
    const paymentIntent = await stripe.paymentIntents.retrieve(payment.stripePaymentIntentId);

    if (paymentIntent.status === "succeeded") {
      payment.status = "success";
      payment.transactionId = paymentIntent.id;
      payment.failureReason = "";
      payment.completedAt = new Date();
      await payment.save();

      await confirmAppointmentPayment(
        payment.appointmentId,
        payment.paymentId,
        "success",
        "Payment confirmed by client"
      );

      await provisionTelemedicineSessionIfEligible({
        appointmentId: payment.appointmentId,
        source: "stripe-confirm",
        doctorName:
          buildDisplayName(payment.doctorFirstName, payment.doctorLastName) ||
          undefined,
      });
    } else if (
      paymentIntent.status === "canceled" ||
      paymentIntent.status === "requires_payment_method"
    ) {
      payment.status = "failed";
      payment.failureReason = "Payment failed at Stripe";
      await payment.save();

      await confirmAppointmentPayment(
        payment.appointmentId,
        payment.paymentId,
        "failed",
        "Payment failed at Stripe"
      );
    }
  }

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
    doctorFirstName: payment.doctorFirstName,
    doctorLastName: payment.doctorLastName,
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

  const history = await Payment.find({ patientId })
    .select('_id paymentId appointmentId doctorId doctorFirstName doctorLastName amount currency status initiatedAt')
    .sort({ initiatedAt: -1 });
  
  // Enrich payment history with doctor names for records that don't have them
  const enrichedHistory = await Promise.all(
    history.map(async (payment) => {
      let doctorFirstName = payment.doctorFirstName;
      let doctorLastName = payment.doctorLastName;

      // If doctor name is missing, try to fetch it from doctor service (non-blocking)
      if (!doctorFirstName || !doctorLastName) {
        try {
          const doctorBilling = await getDoctorBillingData(payment.doctorId);
          if (doctorBilling.firstName || doctorBilling.lastName) {
            doctorFirstName = doctorBilling.firstName;
            doctorLastName = doctorBilling.lastName;

            // Update the payment record with doctor name for future queries (fire and forget)
            Payment.updateOne(
              { _id: payment._id },
              {
                doctorFirstName,
                doctorLastName,
              }
            ).catch((error) => {
              console.error(
                `[payment-service] Failed to update payment record with doctor name: ${
                  error instanceof Error ? error.message : 'Unknown error'
                }`
              );
            });
          }
        } catch (error) {
          console.warn(
            `[payment-service] Failed to fetch doctor name for doctor ${payment.doctorId}: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`
          );
          // Use fallback display
          doctorFirstName = doctorFirstName || 'Doctor';
          doctorLastName = doctorLastName || '';
        }
      }

      return {
        paymentId: payment.paymentId,
        appointmentId: payment.appointmentId,
        doctorFirstName: doctorFirstName || 'Doctor',
        doctorLastName: doctorLastName || '',
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        initiatedAt: payment.initiatedAt,
      };
    })
  );

  return enrichedHistory;
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

  if (["success", "completed"].includes(payment.status)) {
    await provisionTelemedicineSessionIfEligible({
      appointmentId: payment.appointmentId,
      source: "stripe-webhook-retry",
      doctorName: buildDisplayName(payment.doctorFirstName, payment.doctorLastName) || undefined,
    });
    return;
  }

  if (payment.status === "refunded") {
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

  await provisionTelemedicineSessionIfEligible({
    appointmentId: payment.appointmentId,
    source: "stripe-webhook",
    doctorName: buildDisplayName(payment.doctorFirstName, payment.doctorLastName) || undefined,
  });

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
