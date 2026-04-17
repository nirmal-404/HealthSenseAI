import { Router } from "express";
import {
  confirmStripePaymentController,
  createPaymentIntentController,
  getPatientPaymentHistoryController,
  getPaymentByIdController,
  getPaymentStatusController,
  processAppointmentPaymentController,
  refundPaymentController,
} from "../controller/paymentController";
import { allowRoles } from "../middlewares/allowRoles";
import requireAuth from "../middlewares/requireAuth";
import { validate } from "../middlewares/validate";
import {
  createPaymentIntentValidation,
  patientHistoryValidation,
  paymentDetailsValidation,
  paymentIdValidation,
  processPaymentValidation,
  refundPaymentValidation,
} from "../validations/paymentValidations";

const router = Router();

router.post(
  "/create",
  requireAuth,
  allowRoles("patient", "admin"),
  validate(createPaymentIntentValidation),
  createPaymentIntentController
);

router.post(
  "/appointments/:appointmentId/process",
  requireAuth,
  allowRoles("patient", "admin"),
  validate(processPaymentValidation),
  processAppointmentPaymentController
);

router.post(
  "/:paymentId/confirm",
  requireAuth,
  allowRoles("patient", "admin"),
  validate(paymentIdValidation),
  confirmStripePaymentController
);

router.get(
  "/:paymentId/status",
  requireAuth,
  allowRoles("patient", "doctor", "admin"),
  validate(paymentIdValidation),
  getPaymentStatusController
);

router.get(
  "/patient/:patientId/history",
  requireAuth,
  allowRoles("patient", "admin"),
  validate(patientHistoryValidation),
  getPatientPaymentHistoryController
);

router.post(
  "/:paymentId/refund",
  requireAuth,
  allowRoles("admin"),
  validate(refundPaymentValidation),
  refundPaymentController
);

router.get("/health", (req, res) => {
  res.json({ success: true, status: "UP", code: 200 });
});

router.get(
  "/:id",
  requireAuth,
  allowRoles("patient", "doctor", "admin"),
  validate(paymentDetailsValidation),
  getPaymentByIdController
);

export default router;