import { Request, Response } from "express";
import httpStatus from "http-status";
import {
  createPaymentIntentService,
  getPatientPaymentHistoryService,
  getPaymentByIdService,
  getPaymentStatusService,
  handleStripeWebhookService,
  processAppointmentPaymentService,
  refundPaymentService,
} from "../service/paymentService";
import { XRequest } from "../types/XRequest";
import { XResponse } from "../types/XResponse";
import { catchAsync } from "../utils/catchAsync";
import { ApiError } from "../utils/ApiError";

export const createPaymentIntentController = catchAsync(
  async (req: XRequest, res: Response) => {
    const result = await createPaymentIntentService(req.body, req.user!);

    const response: XResponse = {
      success: true,
      message: "Payment intent created successfully",
      data: result,
    };

    res.status(httpStatus.CREATED).send(response);
  }
);

export const processAppointmentPaymentController = catchAsync(
  async (req: XRequest, res: Response) => {
    const result = await processAppointmentPaymentService(
      String(req.params.appointmentId),
      req.body,
      req.user!
    );

    const response: XResponse = {
      success: true,
      message: "Payment processed successfully",
      data: result,
    };

    res.status(httpStatus.CREATED).send(response);
  }
);

export const getPaymentStatusController = catchAsync(async (req: XRequest, res: Response) => {
  const result = await getPaymentStatusService(String(req.params.paymentId), req.user!);

  const response: XResponse = {
    success: true,
    message: "Payment status fetched successfully",
    data: result,
  };

  res.status(httpStatus.OK).send(response);
});

export const getPaymentByIdController = catchAsync(async (req: XRequest, res: Response) => {
  const result = await getPaymentByIdService(String(req.params.id), req.user!);

  const response: XResponse = {
    success: true,
    message: "Payment details fetched successfully",
    data: result,
  };

  res.status(httpStatus.OK).send(response);
});

export const getPatientPaymentHistoryController = catchAsync(
  async (req: XRequest, res: Response) => {
    const result = await getPatientPaymentHistoryService(
      String(req.params.patientId),
      req.user!
    );

    const response: XResponse = {
      success: true,
      message: "Patient payment history fetched successfully",
      data: result,
    };

    res.status(httpStatus.OK).send(response);
  }
);

export const refundPaymentController = catchAsync(async (req: XRequest, res: Response) => {
  const result = await refundPaymentService(String(req.params.paymentId), req.body, req.user!);

  const response: XResponse = {
    success: true,
    message: "Payment refunded successfully",
    data: result,
  };

  res.status(httpStatus.OK).send(response);
});

export const handleStripeWebhookController = catchAsync(
  async (req: Request, res: Response) => {
    const signature = req.headers["stripe-signature"];

    if (!signature || typeof signature !== "string") {
      throw new ApiError(httpStatus.BAD_REQUEST, "Missing Stripe signature header");
    }

    if (!Buffer.isBuffer(req.body)) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Invalid webhook payload. Expected raw request body"
      );
    }

    const result = await handleStripeWebhookService(signature, req.body);

    const response: XResponse = {
      success: true,
      message: "Webhook processed successfully",
      data: result,
    };

    res.status(httpStatus.OK).send(response);
  }
);
