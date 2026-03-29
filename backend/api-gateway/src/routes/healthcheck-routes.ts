import { Router } from "express";
import { CONFIG } from "../config/envConfig";
import { checkServiceHealth } from "../utils/healthcheck";

const router = Router();

router.get("/", async (req, res) => {
  const results = await Promise.all([
    checkServiceHealth("admin", CONFIG.ADMIN_MANAGEMENT_SERVICE_URL),
    checkServiceHealth("ai", CONFIG.AI_SYMPTOM_CHECKER_SERVICE_URL),
    checkServiceHealth("appointment", CONFIG.APPOINTMENT_SERVICE_URL),
    checkServiceHealth("doctor", CONFIG.DOCTOR_MANAGEMENT_SERVICE_URL),
    checkServiceHealth("notificcation", CONFIG.NOTIFICATION_SERVICE_URL),
    checkServiceHealth("patient", CONFIG.NOTIFICATION_SERVICE_URL),
    checkServiceHealth("payment", CONFIG.PAYMENT_SERVICE_URL),
    checkServiceHealth("telemedicine", CONFIG.TELEMEDICINE_SERVICE_URL),
    checkServiceHealth("user", CONFIG.USER_SERVICE_URL),
  ]);

  const merged = results.reduce((acc, curr) => ({ ...acc, ...curr }), {});
  res.json(merged);
});

export default router;
