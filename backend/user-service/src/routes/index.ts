import { Router } from "express";
import {
  registerController,
  loginController,
  logoutController,
  refreshTokenController,
  forgotPasswordController,
  resetPasswordController,
  verifyEmailController,
  getInternalUserByIdController,
  updateInternalUserStatusController,
} from "../controller/authController";
import { requireInternalServiceKey } from "../middlewares/requireInternalServiceKey";
import requireAuth from "../middlewares/requireAuth";
import { validate } from "../middlewares/validate";
import {
  forgotPasswordValidation,
  loginValidation,
  registerValidation,
  resetPasswordValidation,
  verifyEmailValidation
} from "../validations/authValidations";

const router = Router();

router.post("/register", validate(registerValidation), registerController);
router.post("/login", validate(loginValidation), loginController);
router.post("/refresh-token", refreshTokenController);
router.post("/forgot-password", validate(forgotPasswordValidation), forgotPasswordController);
router.post("/reset-password/:token", validate(resetPasswordValidation), resetPasswordController);
router.get("/verify-email/:token", validate(verifyEmailValidation), verifyEmailController);

router.post("/logout", requireAuth, logoutController);

router.get(
  "/internal/users/:id",
  requireInternalServiceKey,
  getInternalUserByIdController
);
router.put(
  "/internal/users/:id/status",
  requireInternalServiceKey,
  updateInternalUserStatusController
);

router.get("/health", (req, res) => {
  res.json({ status: "UP", code: 200 });
});

export default router;