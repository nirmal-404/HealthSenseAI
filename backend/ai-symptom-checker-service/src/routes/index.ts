import { Router } from "express";
import { checkSymptomsController } from "../controller/symptomCheckerController";

const router = Router();

router.post("/symptom-check", checkSymptomsController);

router.get("/health", (req, res) => {
  res.json({ status: "UP", code: 200 });
});

export default router;