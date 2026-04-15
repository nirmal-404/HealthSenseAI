import { Router } from "express";
import {
  createPatientProfileController,
  getPatientDashboardController,
  getInternalPatientIdentityController,
  getPatientMedicalHistoryController,
  getPatientPrescriptionsController,
  updatePatientProfileController,
  uploadPatientDocumentController,
} from "../controller/patientController";
import { allowRoles } from "../middlewares/allowRoles";
import { requireInternalServiceKey } from "../middlewares/requireInternalServiceKey";
import requireAuth from "../middlewares/requireAuth";
import { validate } from "../middlewares/validate";
import {
  createPatientProfileValidation,
  internalPatientIdentityValidation,
  patientIdValidation,
  updatePatientValidation,
  uploadDocumentValidation,
} from "../validations/patientValidations";

const router = Router();

router.get(
  "/internal/patients/:id/identity",
  requireInternalServiceKey,
  validate(internalPatientIdentityValidation),
  getInternalPatientIdentityController
);

router.post(
  "/profile",
  requireAuth,
  allowRoles("patient", "admin"),
  validate(createPatientProfileValidation),
  createPatientProfileController
);

router.put(
  "/:id/profile",
  requireAuth,
  allowRoles("patient", "admin"),
  validate(updatePatientValidation),
  updatePatientProfileController
);

router.post(
  "/:id/documents",
  requireAuth,
  allowRoles("patient", "admin"),
  validate(uploadDocumentValidation),
  uploadPatientDocumentController
);

router.get(
  "/:id/medical-history",
  requireAuth,
  allowRoles("patient", "doctor", "admin"),
  validate(patientIdValidation),
  getPatientMedicalHistoryController
);

router.get(
  "/:id/prescriptions",
  requireAuth,
  allowRoles("patient", "doctor", "admin"),
  validate(patientIdValidation),
  getPatientPrescriptionsController
);

router.get(
  "/:id/dashboard",
  requireAuth,
  allowRoles("patient", "admin"),
  validate(patientIdValidation),
  getPatientDashboardController
);

router.get("/health", (req, res) => {
  res.json({ status: "UP", code: 200 });
});

export default router;