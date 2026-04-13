import twilio from "twilio";
import { CONFIG } from "../config/envConfig";
import { SMSSendResult } from "../types";

class SMSService {
  private client: any;

  constructor() {
    if (CONFIG.TWILIO_ACCOUNT_SID && CONFIG.TWILIO_AUTH_TOKEN) {
      this.client = twilio(CONFIG.TWILIO_ACCOUNT_SID, CONFIG.TWILIO_AUTH_TOKEN);
    }
  }

  async sendSMS(to: string, message: string): Promise<SMSSendResult> {
    try {
      if (!this.client) {
        console.warn("Twilio not configured, skipping SMS");
        return {
          success: false,
          error: "SMS service not configured",
        };
      }

      const result = await this.client.messages.create({
        body: message,
        from: CONFIG.TWILIO_PHONE_NUMBER,
        to,
      });

      return {
        success: true,
        messageId: result.sid,
      };
    } catch (error: any) {
      console.error("SMS sending error:", error);
      return {
        success: false,
        error: error?.message || "Failed to send SMS",
      };
    }
  }

  async sendAppointmentConfirmationSMS(
    to: string,
    data: {
      patientName: string;
      doctorName: string;
      appointmentDate: string;
      appointmentTime: string;
    }
  ): Promise<SMSSendResult> {
    const message = `Hi ${data.patientName}, your appointment with Dr. ${data.doctorName} is confirmed for ${data.appointmentDate} at ${data.appointmentTime}. Please arrive 10 minutes early. -HealthSense`;
    return this.sendSMS(to, message);
  }

  async sendAppointmentReminderSMS(
    to: string,
    data: {
      patientName: string;
      doctorName: string;
      appointmentDate: string;
      appointmentTime: string;
    }
  ): Promise<SMSSendResult> {
    const message = `Reminder ${data.patientName}: Your appointment with Dr. ${data.doctorName} is tomorrow at ${data.appointmentTime}. -HealthSense`;
    return this.sendSMS(to, message);
  }

  async sendPaymentConfirmationSMS(
    to: string,
    data: {
      userName: string;
      amount: number;
      currency: string;
    }
  ): Promise<SMSSendResult> {
    const message = `Hi ${data.userName}, your payment of ${data.currency} ${data.amount} has been confirmed. Transaction ID: ${Date.now()}. -HealthSense`;
    return this.sendSMS(to, message);
  }

  async sendPrescriptionNotificationSMS(
    to: string,
    data: {
      patientName: string;
      doctorName: string;
    }
  ): Promise<SMSSendResult> {
    const message = `Hi ${data.patientName}, your prescription from Dr. ${data.doctorName} is now available in your HealthSense account. -HealthSense`;
    return this.sendSMS(to, message);
  }

  async sendVerificationSMS(to: string, verificationCode: string): Promise<SMSSendResult> {
    const message = `Your HealthSense verification code is: ${verificationCode}. Do not share this code with anyone.`;
    return this.sendSMS(to, message);
  }
}

export default new SMSService();
