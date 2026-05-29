import { Router } from "express";
import NotificationController from "../controller/NotificationController";
import { validateRequest, sendNotificationSchema, sendBulkNotificationSchema, notificationTemplateSchema, notificationPreferenceSchema } from "../validations";

const router = Router();

// Health check
router.get("/health", (req, res) => {
  res.json({ status: "UP", code: 200 });
});

// Notification endpoints
router.post("/send", validateRequest(sendNotificationSchema), (req, res) =>
  NotificationController.sendNotification(req, res)
);

router.post("/send-bulk", validateRequest(sendBulkNotificationSchema), (req, res) =>
  NotificationController.sendBulkNotification(req, res)
);

router.get("/:notificationId", (req, res) => NotificationController.getNotification(req, res));

router.get("/user/:userId", (req, res) => NotificationController.getUserNotifications(req, res));

router.get("/appointment/:appointmentId", (req, res) => NotificationController.getAppointmentNotifications(req, res));

router.post("/retry-failed", (req, res) => NotificationController.retryFailedNotifications(req, res));

router.get("/stats", (req, res) => NotificationController.getStats(req, res));

// Template endpoints
router.post("/templates", validateRequest(notificationTemplateSchema), (req, res) =>
  NotificationController.createTemplate(req, res)
);

router.get("/templates", (req, res) => NotificationController.getTemplates(req, res));

router.get("/templates/:templateName", (req, res) =>
  NotificationController.getTemplate(req, res)
);

// Preference endpoints
router.put("/preferences/:userId", validateRequest(notificationPreferenceSchema), (req, res) =>
  NotificationController.updatePreference(req, res)
);

router.get("/preferences/:userId", (req, res) =>
  NotificationController.getPreference(req, res)
);

export default router;