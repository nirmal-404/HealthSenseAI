import { Router } from "express";
import {
  bookAppointmentController,
  cancelAppointmentController,
  confirmAppointmentController,
  getAppointmentController,
  getAppointmentsByDoctorController,
  getAppointmentsByPatientController,
  getAppointmentStatusController,
  rejectAppointmentController,
  rescheduleAppointmentController,
} from "../controller/appointmentController";
import { allowRoles } from "../middlewares/allowRoles";
import requireAuth from "../middlewares/requireAuth";
import { validate } from "../middlewares/validate";
import {
  appointmentIdValidation,
  bookAppointmentValidation,
  byDoctorValidation,
  byPatientValidation,
  decisionValidation,
  rescheduleAppointmentValidation,
} from "../validations/appointmentValidations";

const router = Router();

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