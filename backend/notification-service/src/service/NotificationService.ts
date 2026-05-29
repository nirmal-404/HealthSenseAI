import Notification from "../models/Notification";
import NotificationTemplate from "../models/NotificationTemplate";
import NotificationPreference from "../models/NotificationPreference";
import EmailService from "./EmailService";
import SMSService from "./SMSService";
import { CONFIG } from "../config/envConfig";
import {
  SendNotificationRequest,
  SendBulkNotificationRequest,
  NotificationTemplateRequest,
  NotificationPreferenceRequest,
  UpdateNotificationPreferenceRequest,
  NotificationStatus,
} from "../types";

class NotificationService {
  /**
   * Send a single notification
   */
  async sendNotification(payload: SendNotificationRequest) {
    let notification: any = null;
    try {
      // Check user preferences
      const preferences = await NotificationPreference.findOne({ userId: payload.userId });

      if (preferences) {
        if (payload.type === "email" && !preferences.emailEnabled) {
          return {
            success: false,
            message: "Email notifications are disabled for this user",
          };
        }
        if (payload.type === "sms" && !preferences.smsEnabled) {
          return {
            success: false,
            message: "SMS notifications are disabled for this user",
          };
        }
      }

      // Create notification record
      notification = new Notification({
        userId: payload.userId,
        type: payload.type,
        category: payload.category,
        recipient: payload.recipient,
        subject: payload.subject,
        message: payload.message,
        status: "queued",
      });

      await notification.save();

      // Process notification based on type
      let result: any;
      if (payload.type === "email") {
        result = await EmailService.sendEmail(
          payload.recipient,
          payload.subject || "Notification",
          payload.message
        );
      } else if (payload.type === "sms") {
        result = await SMSService.sendSMS(payload.recipient, payload.message);
      }

      // Update notification status
      if (result.success) {
        notification.status = "sent";
        notification.sentAt = new Date();
        console.log(`✓ Notification sent | ID: ${notification.notificationId} | Type: ${payload.type}`);
      } else {
        notification.status = "failed";
        notification.error = result.error;
        notification.retryCount = 0;
        
        console.error(`✗ Notification failed | ID: ${notification.notificationId} | Error: ${result.error}`);
        
        // Log to monitoring in production
        if (CONFIG.ENV === "production") {
          console.error({
            alert: "Notification Send Failed",
            notificationId: notification.notificationId,
            userId: payload.userId,
            type: payload.type,
            recipient: payload.recipient,
            error: result.error,
            timestamp: new Date().toISOString(),
            severity: "high",
          });
        }
      }

      await notification.save();

      return {
        success: result.success,
        notificationId: notification.notificationId,
        messageId: result.messageId,
        error: result.error,
      };
    } catch (error: any) {
      console.error("✗ Error sending notification:", error?.message);
      
      // Log to monitoring in production
      if (CONFIG.ENV === "production") {
        console.error({
          alert: "Notification Service Error",
          error: error?.message,
          stack: error?.stack,
          timestamp: new Date().toISOString(),
          severity: "high",
        });
      }
      
      return {
        success: false,
        error: error?.message || "Failed to send notification",
      };
    }
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotification(payload: SendBulkNotificationRequest) {
    try {
      const results = [];

      for (const userId of payload.userIds) {
        const notification = new Notification({
          userId,
          type: payload.type,
          category: payload.category,
          recipient: payload.message, // Placeholder
          subject: payload.subject,
          message: payload.message,
          status: "queued",
        });

        await notification.save();
        results.push({
          userId,
          notificationId: notification.notificationId,
          status: "queued",
        });
      }

      return {
        success: true,
        totalNotifications: results.length,
        notifications: results,
      };
    } catch (error: any) {
      console.error("Error sending bulk notifications:", error);
      return {
        success: false,
        error: error?.message || "Failed to send bulk notifications",
      };
    }
  }

  /**
   * Get notification by ID
   */
  async getNotificationById(notificationId: string) {
    try {
      const notification = await Notification.findOne({ notificationId });
      if (!notification) {
        return {
          success: false,
          error: "Notification not found",
        };
      }
      return {
        success: true,
        notification,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message,
      };
    }
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(userId: string, limit: number = 50, offset: number = 0) {
    try {
      const notifications = await Notification.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset);

      const total = await Notification.countDocuments({ userId });

      return {
        success: true,
        notifications,
        total,
        limit,
        offset,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message,
      };
    }
  }

  /**
   * Get notifications for a specific appointment
   */
  async getAppointmentNotifications(appointmentId: string, limit: number = 50, offset: number = 0) {
    try {
      // Query notifications where message or subject contains the appointmentId or category is 'appointment'
      const notifications = await Notification.find({
        $and: [
          { category: "appointment" },
          {
            $or: [
              { message: { $regex: appointmentId, $options: "i" } },
              { subject: { $regex: appointmentId, $options: "i" } },
            ],
          },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset);

      const total = await Notification.countDocuments({
        $and: [
          { category: "appointment" },
          {
            $or: [
              { message: { $regex: appointmentId, $options: "i" } },
              { subject: { $regex: appointmentId, $options: "i" } },
            ],
          },
        ],
      });

      return {
        success: true,
        notifications,
        total,
        limit,
        offset,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message,
      };
    }
  }

  /**
   * Retry failed notifications
   */
  async retryFailedNotifications() {
    try {
      const failedNotifications = await Notification.find({
        status: "failed",
        retryCount: { $lt: 3 },
      }).limit(100);

      const results = [];

      for (const notification of failedNotifications) {
        if (notification.type === "email") {
          const result = await EmailService.sendEmail(
            notification.recipient,
            notification.subject || "Notification",
            notification.message
          );

          if (result.success) {
            notification.status = "sent";
            notification.sentAt = new Date();
          } else {
            notification.retryCount += 1;
          }
        } else if (notification.type === "sms") {
          const result = await SMSService.sendSMS(notification.recipient, notification.message);

          if (result.success) {
            notification.status = "sent";
            notification.sentAt = new Date();
          } else {
            notification.retryCount += 1;
          }
        }

        await notification.save();
        results.push({
          notificationId: notification.notificationId,
          status: notification.status,
        });
      }

      return {
        success: true,
        retried: results.length,
        results,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message,
      };
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(): Promise<NotificationStatus> {
    try {
      const total = await Notification.countDocuments();
      const sent = await Notification.countDocuments({ status: "sent" });
      const failed = await Notification.countDocuments({ status: "failed" });
      const pending = await Notification.countDocuments({ status: "pending" });
      const queued = await Notification.countDocuments({ status: "queued" });

      return {
        total,
        sent,
        failed,
        pending,
        queued,
      };
    } catch (error: any) {
      throw new Error(`Failed to get notification stats: ${error?.message}`);
    }
  }

  /**
   * Create notification template
   */
  async createTemplate(payload: NotificationTemplateRequest) {
    try {
      const existingTemplate = await NotificationTemplate.findOne({
        templateName: payload.templateName,
      });

      if (existingTemplate) {
        return {
          success: false,
          error: "Template with this name already exists",
        };
      }

      const template = new NotificationTemplate(payload);
      await template.save();

      return {
        success: true,
        template,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message,
      };
    }
  }

  /**
   * Get all templates
   */
  async getTemplates() {
    try {
      const templates = await NotificationTemplate.find({ isActive: true });
      return {
        success: true,
        templates,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message,
      };
    }
  }

  /**
   * Get template by name
   */
  async getTemplateByName(templateName: string) {
    try {
      const template = await NotificationTemplate.findOne({
        templateName,
        isActive: true,
      });

      if (!template) {
        return {
          success: false,
          error: "Template not found",
        };
      }

      return {
        success: true,
        template,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message,
      };
    }
  }

  /**
   * Update notification preference
   */
  async updatePreference(userId: string, payload: UpdateNotificationPreferenceRequest) {
    try {
      let preference = await NotificationPreference.findOne({ userId });

      if (!preference) {
        preference = new NotificationPreference({ userId, ...payload });
      } else {
        Object.assign(preference, payload);
      }

      await preference.save();

      return {
        success: true,
        preference,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message,
      };
    }
  }

  /**
   * Get notification preference
   */
  async getPreference(userId: string) {
    try {
      let preference = await NotificationPreference.findOne({ userId });

      if (!preference) {
        // Create default preference
        preference = new NotificationPreference({
          userId,
          emailEnabled: true,
          smsEnabled: true,
          appointmentNotifications: true,
          paymentNotifications: true,
          reminderNotifications: true,
          prescriptionNotifications: true,
          verificationNotifications: true,
        });
        await preference.save();
      }

      return {
        success: true,
        preference,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message,
      };
    }
  }

  /**
   * Replace template variables with actual values
   */
  replaceTemplateVariables(template: string, variables: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{${key}}}`, "g"), value);
    }
    return result;
  }
}

export default new NotificationService();
