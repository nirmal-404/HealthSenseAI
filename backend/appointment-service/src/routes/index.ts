import { Router } from "express";
import {
  bookAppointmentController,
  cancelAppointmentController,
  confirmAppointmentPaymentController,
  confirmAppointmentController,
  getAppointmentController,
  getInternalAppointmentPaymentContextController,
  getAppointmentsByDoctorController,
  getAppointmentsByPatientController,
  getAppointmentStatusController,
  rejectAppointmentController,
  rescheduleAppointmentController,
  updateInternalAppointmentPaymentStatusController,
} from "../controller/appointmentController";
import { allowRoles } from "../middlewares/allowRoles";
import { requireInternalServiceKey } from "../middlewares/requireInternalServiceKey";
import requireAuth from "../middlewares/requireAuth";
import { validate } from "../middlewares/validate";
import {
  appointmentIdValidation,
  bookAppointmentValidation,
  byDoctorValidation,
  byPatientValidation,
  confirmAppointmentPaymentValidation,
  decisionValidation,
  internalAppointmentPaymentContextValidation,
  internalAppointmentPaymentStatusValidation,
  rescheduleAppointmentValidation,
} from "../validations/appointmentValidations";

const router = Router();

router.get(
  "/internal/appointments/:id/payment-context",
  requireInternalServiceKey,
  validate(internalAppointmentPaymentContextValidation),
  getInternalAppointmentPaymentContextController
);

router.get(
  "/appointments/:id",
  requireInternalServiceKey,
  validate(appointmentIdValidation),
  getAppointmentController
);

router.post(
  "/appointments/confirm-payment",
  requireInternalServiceKey,
  validate(confirmAppointmentPaymentValidation),
  confirmAppointmentPaymentController
);

router.put(
  "/internal/appointments/:id/payment-status",
  requireInternalServiceKey,
  validate(internalAppointmentPaymentStatusValidation),
  updateInternalAppointmentPaymentStatusController
);

router.post(
  "/book",
  requireAuth,
  allowRoles("patient", "admin"),
  validate(bookAppointmentValidation),
  bookAppointmentController
);

router.get(
  "/patient/:patientId",
  requireAuth,
  allowRoles("patient", "admin"),
  validate(byPatientValidation),
  getAppointmentsByPatientController
);

router.get(
  "/doctor/:doctorId",
  requireAuth,
  allowRoles("doctor", "admin"),
  validate(byDoctorValidation),
  getAppointmentsByDoctorController
);

router.get(
  "/:id/status",
  requireAuth,
  allowRoles("patient", "doctor", "admin"),
  validate(appointmentIdValidation),
  getAppointmentStatusController
);

router.get(
  "/:id",
  requireAuth,
  allowRoles("patient", "doctor", "admin"),
  validate(appointmentIdValidation),
  getAppointmentController
);

router.put(
  "/:id/reschedule",
  requireAuth,
  allowRoles("patient", "admin"),
  validate(rescheduleAppointmentValidation),
  rescheduleAppointmentController
);

router.delete(
  "/:id/cancel",
  requireAuth,
  allowRoles("patient", "admin"),
  validate(appointmentIdValidation),
  cancelAppointmentController
);

router.put(
  "/:id/confirm",
  requireAuth,
  allowRoles("doctor", "admin"),
  validate(decisionValidation),
  confirmAppointmentController
);

router.put(
  "/:id/reject",
  requireAuth,
  allowRoles("doctor", "admin"),
  validate(decisionValidation),
  rejectAppointmentController
);

router.get("/health", (req, res) => {
  res.json({ status: "UP", code: 200 });
});

export default router;