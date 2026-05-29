import { Request, Response } from "express";
import NotificationService from "../service/NotificationService";
import EmailService from "../service/EmailService";
import SMSService from "../service/SMSService";
import { SendNotificationRequest, SendBulkNotificationRequest } from "../types";

class NotificationController {
  /**
   * Send a single notification
   * POST /notifications/send
   */
  async sendNotification(req: Request, res: Response) {
    try {
      const payload: SendNotificationRequest = req.body;

      const result = await NotificationService.sendNotification(payload);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
          message: result.message,
        });
      }

      res.status(200).json({
        success: true,
        notificationId: result.notificationId,
        messageId: result.messageId,
      });
    } catch (error: any) {
      console.error("Error in sendNotification:", error);
      res.status(500).json({
        success: false,
        error: error?.message || "Internal server error",
      });
    }
  }

  /**
   * Send bulk notifications
   * POST /notifications/send-bulk
   */
  async sendBulkNotification(req: Request, res: Response) {
    try {
      const payload: SendBulkNotificationRequest = req.body;

      const result = await NotificationService.sendBulkNotification(payload);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
        });
      }

      res.status(200).json({
        success: true,
        totalNotifications: result.totalNotifications,
        notifications: result.notifications,
      });
    } catch (error: any) {
      console.error("Error in sendBulkNotification:", error);
      res.status(500).json({
        success: false,
        error: error?.message || "Internal server error",
      });
    }
  }

  /**
   * Get notification by ID
   * GET /notifications/:notificationId
   */
  async getNotification(req: Request, res: Response) {
    try {
      const notificationId = req.params.notificationId as string;

      const result = await NotificationService.getNotificationById(notificationId);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          error: result.error,
        });
      }

      res.status(200).json({
        success: true,
        notification: result.notification,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error?.message,
      });
    }
  }

  /**
   * Get notifications for a user
   * GET /notifications/user/:userId
   */
  async getUserNotifications(req: Request, res: Response) {
    try {
      const userId = req.params.userId as string;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await NotificationService.getUserNotifications(userId, limit, offset);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
        });
      }

      res.status(200).json({
        success: true,
        notifications: result.notifications,
        total: result.total,
        limit,
        offset,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error?.message,
      });
    }
  }

  /**
   * Get notifications for a specific appointment
   * GET /notifications/appointment/:appointmentId
   */
  async getAppointmentNotifications(req: Request, res: Response) {
    try {
      const appointmentId = req.params.appointmentId as string;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await NotificationService.getAppointmentNotifications(appointmentId, limit, offset);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
        });
      }

      res.status(200).json({
        success: true,
        notifications: result.notifications,
        total: result.total,
        limit,
        offset,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error?.message,
      });
    }
  }

  /**
   * Retry failed notifications
   * POST /notifications/retry-failed
   */
  async retryFailedNotifications(req: Request, res: Response) {
    try {
      const result = await NotificationService.retryFailedNotifications();

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
        });
      }

      res.status(200).json({
        success: true,
        retried: result.retried,
        results: result.results,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error?.message,
      });
    }
  }

  /**
   * Get notification statistics
   * GET /notifications/stats
   */
  async getStats(req: Request, res: Response) {
    try {
      const stats = await NotificationService.getNotificationStats();

      res.status(200).json({
        success: true,
        stats,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error?.message,
      });
    }
  }

  /**
   * Create notification template
   * POST /templates
   */
  async createTemplate(req: Request, res: Response) {
    try {
      const result = await NotificationService.createTemplate(req.body);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
        });
      }

      res.status(201).json({
        success: true,
        template: result.template,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error?.message,
      });
    }
  }

  /**
   * Get all templates
   * GET /templates
   */
  async getTemplates(req: Request, res: Response) {
    try {
      const result = await NotificationService.getTemplates();

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
        });
      }

      res.status(200).json({
        success: true,
        templates: result.templates,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error?.message,
      });
    }
  }

  /**
   * Get template by name
   * GET /templates/:templateName
   */
  async getTemplate(req: Request, res: Response) {
    try {
      const templateName = req.params.templateName as string;

      const result = await NotificationService.getTemplateByName(templateName);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          error: result.error,
        });
      }

      res.status(200).json({
        success: true,
        template: result.template,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error?.message,
      });
    }
  }

  /**
   * Update notification preferences
   * PUT /preferences/:userId
   */
  async updatePreference(req: Request, res: Response) {
    try {
      const userId = req.params.userId as string;

      const result = await NotificationService.updatePreference(userId, req.body);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
        });
      }

      res.status(200).json({
        success: true,
        preference: result.preference,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error?.message,
      });
    }
  }

  /**
   * Get notification preferences
   * GET /preferences/:userId
   */
  async getPreference(req: Request, res: Response) {
    try {
      const userId = req.params.userId as string;

      const result = await NotificationService.getPreference(userId);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
        });
      }

      res.status(200).json({
        success: true,
        preference: result.preference,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error?.message,
      });
    }
  }

  /**
   * Health check endpoint
   * GET /health
   */
  async healthCheck(req: Request, res: Response) {
    try {
      const stats = await NotificationService.getNotificationStats();

      res.status(200).json({
        status: "UP",
        code: 200,
        stats,
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(503).json({
        status: "DOWN",
        code: 503,
        error: error?.message,
      });
    }
  }
}

export default new NotificationController();
