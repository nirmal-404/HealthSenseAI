import { Router } from "express";
import doctorRoutes from "./doctorRoutes";
import prescriptionRoutes from "./prescriptionRoutes";
import appointmentRoutes from "./appointmentRoutes";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "doctor-management-service" });
});

router.use("/prescriptions", prescriptionRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/", doctorRoutes);

export default router;
