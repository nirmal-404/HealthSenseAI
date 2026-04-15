import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import {
  availabilityBody,
  doctorIdParam,
  doctorProfileBody,
  doctorSearchQuery,
  patientReportsParams,
  slotIdParams,
} from "../validations/schemas";
import {
  blockTimeSlot,
  getAvailability,
  getAppointments,
  getDoctor,
  getTimeSlots,
  patientReports,
  postAvailability,
  postRegister,
  putAvailability,
  putDoctor,
  searchDoctors,
} from "../controller/doctorController";

const router = Router();

router.post("/register", validate({ body: doctorProfileBody }), postRegister);
router.get("/search", validate({ query: doctorSearchQuery }), searchDoctors);

router.use(requireAuth);

router.get(
  "/:id/availability",
  validate({ params: doctorIdParam }),
  getAvailability,
);

router.post(
  "/:id/availability",
  validate({ params: doctorIdParam, body: availabilityBody }),
  postAvailability,
);

router.put(
  "/:id/availability",
  validate({ params: doctorIdParam, body: availabilityBody }),
  putAvailability,
);

router.get(
  "/:id/time-slots",
  validate({ params: doctorIdParam }),
  getTimeSlots,
);

router.put(
  "/:id/time-slots/:slotId/block",
  validate({ params: slotIdParams }),
  blockTimeSlot,
);

router.get(
  "/:id/appointments",
  validate({ params: doctorIdParam }),
  getAppointments,
);

router.get(
  "/:doctorId/patients/:patientId/reports",
  validate({ params: patientReportsParams }),
  patientReports,
);

router.get("/:id", validate({ params: doctorIdParam }), getDoctor);

router.put(
  "/:id",
  validate({ params: doctorIdParam, body: doctorProfileBody }),
  putDoctor,
);

export default router;
