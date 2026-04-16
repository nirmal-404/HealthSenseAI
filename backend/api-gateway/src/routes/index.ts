import { Router } from "express";
import adminManagementRoutes from "./admin-management-routes";
import aiSymptomCheckerRoutes from "./ai-symptom-checker-routes";
//import appointmentRespondRoutes from "./appointment-respond-routes";
import appointmentRoutes from "./appointment-routes";
import doctorManagementRoutes from "./doctor-management-routes";
import notificationRoutes from "./notification-routes";
import patientManagementRoutes from "./patient-management-routes";
import paymentRoutes from "./payment-routes";
import prescriptionsRoutes from "./prescriptions-routes";
import sessionsRoutes from "./sessions-routes";
import telemedicineRoutes from "./telemedicine-routes";
import userRoutes from "./user-routes";
import healthcheckRoutes from "./healthcheck-routes";

const router = Router();

router.use("/admin", adminManagementRoutes);
router.use("/ai", aiSymptomCheckerRoutes);
router.use("/sessions", sessionsRoutes);
router.use("/prescriptions", prescriptionsRoutes);
//router.use("/appointments", appointmentRespondRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/doctors", doctorManagementRoutes);
router.use("/notifications", notificationRoutes);
router.use("/patients", patientManagementRoutes);
router.use("/payments", paymentRoutes);
router.use("/telemedicine", telemedicineRoutes);
router.use("/auth", userRoutes);

router.use("/health-all", healthcheckRoutes);

router.get("/health", (req, res) => {
  res.json({ status: "UP", code: 200 });
});

export default router;
