import { Router } from "express";
import {
  getAnalyticsController,
  getPendingVerificationController,
  getReportsController,
  getTransactionsController,
  getUsersController,
  updateUserStatusController,
  verifyDoctorController,
} from "../controller/adminController";
import { allowRoles } from "../middlewares/allowRoles";
import requireAuth from "../middlewares/requireAuth";
import { validate } from "../middlewares/validate";
import {
  doctorVerificationValidation,
  userStatusValidation,
} from "../validations/adminValidations";

const router = Router();

router.get("/users", requireAuth, allowRoles("admin"), getUsersController);

router.put(
  "/users/:userId/status",
  requireAuth,
  allowRoles("admin"),
  validate(userStatusValidation),
  updateUserStatusController
);

router.get(
  "/doctors/pending-verification",
  requireAuth,
  allowRoles("admin"),
  getPendingVerificationController
);

router.put(
  "/doctors/:doctorId/verify",
  requireAuth,
  allowRoles("admin"),
  validate(doctorVerificationValidation),
  verifyDoctorController
);

router.get("/analytics", requireAuth, allowRoles("admin"), getAnalyticsController);
router.get("/transactions", requireAuth, allowRoles("admin"), getTransactionsController);
router.get("/reports", requireAuth, allowRoles("admin"), getReportsController);

router.get("/health", (req, res) => {
  res.json({ status: "UP", code: 200 });
});

export default router;
