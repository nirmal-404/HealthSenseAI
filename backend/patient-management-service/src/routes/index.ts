import { Router } from "express";
import {
  createPrescriptionController,
  deletePrescriptionController,
  downloadPrescriptionController,
  getDoctorPrescriptionsController,
  getPrescriptionByIdController,
  createPatientProfileController,
  getPatientDashboardController,
  getInternalPatientIdentityController,
  getPatientMedicalHistoryController,
  getPatientPrescriptionsController,
  updatePrescriptionController,
  updatePatientProfileController,
  uploadPatientDocumentController,
} from "../controller/patientController";
import { allowRoles } from "../middlewares/allowRoles";
import { requireInternalServiceKey } from "../middlewares/requireInternalServiceKey";
import requireAuth from "../middlewares/requireAuth";
import { validate } from "../middlewares/validate";
import {
  createPrescriptionValidation,
  doctorPrescriptionsValidation,
  patientPrescriptionsValidation,
  prescriptionIdValidation,
  createPatientProfileValidation,
  internalPatientIdentityValidation,
  patientIdValidation,
  updatePrescriptionValidation,
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

router.post(
  "/prescriptions",
  requireAuth,
  allowRoles("doctor", "admin"),
  validate(createPrescriptionValidation),
  createPrescriptionController
);

router.get(
  "/prescriptions/doctor/:doctorId",
  requireAuth,
  allowRoles("doctor", "admin"),
  validate(doctorPrescriptionsValidation),
  getDoctorPrescriptionsController
);

router.get(
  "/prescriptions/:prescriptionId/download",
  requireAuth,
  allowRoles("patient", "doctor", "admin"),
  validate(prescriptionIdValidation),
  downloadPrescriptionController
);

router.get(
  "/prescriptions/:prescriptionId",
  requireAuth,
  allowRoles("patient", "doctor", "admin"),
  validate(prescriptionIdValidation),
  getPrescriptionByIdController
);

router.put(
  "/prescriptions/:prescriptionId",
  requireAuth,
  allowRoles("doctor", "admin"),
  validate(updatePrescriptionValidation),
  updatePrescriptionController
);

router.delete(
  "/prescriptions/:prescriptionId",
  requireAuth,
  allowRoles("doctor", "admin"),
  validate(prescriptionIdValidation),
  deletePrescriptionController
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
  validate(patientPrescriptionsValidation),
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