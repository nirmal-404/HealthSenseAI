import { Router } from "express";
import doctorRoutes from "./doctorRoutes";
import prescriptionRoutes from "./prescriptionRoutes";
import appointmentRoutes from "./appointmentRoutes";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "doctor-management-service" });
import {
  blockTimeSlotController,
  getDoctorAppointmentsController,
  getInternalDoctorBillingController,
  getTimeSlotsController,
  registerDoctorController,
  searchDoctorController,
  setAvailabilityController,
  updateDoctorProfileController,
} from "../controller/doctorController";
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
} from "../validations/doctorValidations";

const router = Router();

router.get(
  "/internal/doctors/:id/billing",
  requireInternalServiceKey,
  validate(internalDoctorBillingValidation),
  getInternalDoctorBillingController
);

router.post(
  "/register",
  requireAuth,
  allowRoles("doctor", "admin"),
  validate(registerDoctorValidation),
  registerDoctorController
);

router.put(
  "/:id/profile",
  requireAuth,
  allowRoles("doctor", "admin"),
  validate(updateDoctorProfileValidation),
  updateDoctorProfileController
);

router.post(
  "/:id/availability",
  requireAuth,
  allowRoles("doctor", "admin"),
  validate(setAvailabilityValidation),
  setAvailabilityController
);

router.get(
  "/:id/time-slots",
  validate(getTimeSlotsValidation),
  getTimeSlotsController
);

router.put(
  "/:id/time-slots/:slotId/block",
  requireAuth,
  allowRoles("doctor", "admin"),
  validate(blockTimeSlotValidation),
  blockTimeSlotController
);

router.get("/search", validate(searchDoctorValidation), searchDoctorController);

router.get(
  "/:id/appointments",
  requireAuth,
  allowRoles("doctor", "admin"),
  validate(doctorAppointmentsValidation),
  getDoctorAppointmentsController
);

router.get("/health", (req, res) => {
  res.json({ status: "UP", code: 200 });
});

router.use("/prescriptions", prescriptionRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/", doctorRoutes);

export default router;
