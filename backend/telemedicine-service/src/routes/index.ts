import { Router } from "express";
import sessionRoutes from "./sessionRoutes";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "telemedicine-service" });
});

router.use("/sessions", sessionRoutes);

export default router;
