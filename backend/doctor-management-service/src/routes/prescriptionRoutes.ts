import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import {
  createPrescriptionBody,
  doctorListParam,
  paginationQuery,
  prescriptionIdParam,
  verifyTokenParam,
} from "../validations/schemas";
import {
  createPrescription,
  getPrescription,
  listPrescriptionsByDoctor,
  verifyPrescription,
} from "../controller/prescriptionController";

const router = Router();

router.get(
  "/verify/:token",
  validate({ params: verifyTokenParam }),
  verifyPrescription,
);

router.post(
  "/",
  requireAuth,
  validate({ body: createPrescriptionBody }),
  createPrescription,
);

router.get(
  "/doctor/:doctorId",
  requireAuth,
  validate({ params: doctorListParam, query: paginationQuery }),
  listPrescriptionsByDoctor,
);

router.get(
  "/:id",
  requireAuth,
  validate({ params: prescriptionIdParam }),
  getPrescription,
);

export default router;
