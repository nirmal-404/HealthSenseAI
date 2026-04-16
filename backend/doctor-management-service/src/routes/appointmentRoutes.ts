import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import {
  appointmentRespondBody,
  appointmentRespondParams,
} from "../validations/schemas";
import { respondAppointment } from "../controller/doctorController";

const router = Router();

router.patch(
  "/:id/respond",
  requireAuth,
  validate({ params: appointmentRespondParams, body: appointmentRespondBody }),
  respondAppointment,
);

export default router;
