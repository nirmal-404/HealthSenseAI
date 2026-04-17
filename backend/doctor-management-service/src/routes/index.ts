import { Router } from "express";
import {
  blockTimeSlot,
  getAppointments,
  getInternalBilling,
  getTimeSlots,
  postRegister,
  searchDoctors,
  putAvailability,
  putDoctor,
  getDoctor,
  getAvailability,
  patientReports,
} from "../controller/doctorController";
import {
  createPrescription,
  getPrescription,
  listPrescriptionsByDoctor,
  verifyPrescription,
} from "../controller/prescriptionController";
import { allowRoles } from "../middlewares/allowRoles";
import { requireInternalServiceKey } from "../middlewares/requireInternalServiceKey";
import requireAuth from "../middlewares/requireAuth";
import { validate } from "../middlewares/validate";
import {
  blockTimeSlotValidation,
  doctorAppointmentsValidation,
  getTimeSlotsValidation,
  internalDoctorBillingValidation,
  registerDoctorValidation,
  searchDoctorValidation,
  setAvailabilityValidation,
  updateDoctorProfileValidation,
  doctorIdValidation,
  createPrescriptionValidation,
  listPrecscriptionsValidation,
  prescriptionIdValidation,
  verifyPrescriptionValidation,
} from "../validations/doctorValidations";

const router = Router();

// --- Internal ---
router.get(
  "/internal/doctors/:id/billing",
  requireInternalServiceKey,
  validate(internalDoctorBillingValidation),
  getInternalBilling
);

// --- Registration & Search ---
router.post(
  "/register",
  requireAuth,
  allowRoles("doctor", "admin"),
  validate(registerDoctorValidation),
  postRegister
);

router.get("/search", validate(searchDoctorValidation), searchDoctors);

// --- Profile & Availability ---
router.get(
  "/:id",
  validate(doctorIdValidation),
  getDoctor
);

router.put(
  "/:id",
  requireAuth,
  allowRoles("doctor", "admin"),
  validate(updateDoctorProfileValidation),
  putDoctor
);

router.put(
  "/:id/profile",
  requireAuth,
  allowRoles("doctor", "admin"),
  validate(updateDoctorProfileValidation),
  putDoctor
);

router.get(
  "/:id/availability",
  validate(doctorIdValidation),
  getAvailability
);

router.post(
  "/:id/availability",
  requireAuth,
  allowRoles("doctor", "admin"),
  validate(setAvailabilityValidation),
  putAvailability
);

router.get(
  "/:id/time-slots",
  validate(getTimeSlotsValidation),
  getTimeSlots
);

router.put(
  "/:id/time-slots/:slotId/block",
  requireAuth,
  allowRoles("doctor", "admin"),
  validate(blockTimeSlotValidation),
  blockTimeSlot
);

// --- Appointments & Reports ---
router.get(
  "/:id/appointments",
  requireAuth,
  allowRoles("doctor", "admin"),
  validate(doctorAppointmentsValidation),
  getAppointments
);

router.get(
  "/:doctorId/patients/:patientId/reports",
  requireAuth,
  allowRoles("doctor", "admin"),
  patientReports
);

// --- Prescriptions ---
router.post(
  "/prescriptions",
  requireAuth,
  allowRoles("doctor", "admin"),
  validate(createPrescriptionValidation),
  createPrescription
);

router.get(
  "/prescriptions/:id",
  requireAuth,
  validate(prescriptionIdValidation),
  getPrescription
);

router.get(
  "/prescriptions/doctor/:doctorId",
  requireAuth,
  validate(listPrecscriptionsValidation),
  listPrescriptionsByDoctor
);

router.get(
  "/prescriptions/verify/:token",
  validate(verifyPrescriptionValidation),
  verifyPrescription
);

router.get("/health", (req, res) => {
  res.json({ status: "UP", code: 200 });
});

export default router;