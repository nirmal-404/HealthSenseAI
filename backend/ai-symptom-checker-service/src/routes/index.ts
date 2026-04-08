import { Router } from "express";
import { checkSymptomsController, answerFollowUpQuestionsController } from "../controller/symptomCheckerController";
import { followUpAnswersSchema } from "../validations/aiResponseValidation";
import { validate } from "../middlewares/validate";
import requireAuth from "../middlewares/requireAuth";

const router = Router();

router.post("/symptom-check", requireAuth, checkSymptomsController);

router.post(
  "/symptom-check/:checkId/answer",
  requireAuth,
  validate(followUpAnswersSchema),
  answerFollowUpQuestionsController
);


router.get("/health", (req, res) => {
  res.json({ status: "UP", code: 200 });
});

export default router;