import axios from "axios";
import { CONFIG } from "../config/envConfig";
import { SMSSendResult } from "../types";

class SMSService {
  private apiKey: string;
  private senderId: string;
  private apiUrl = "https://api.smsapi.lk/api/SmsAPI/SendSingleSms";

  constructor() {
    this.apiKey = CONFIG.SMSAPI_API_KEY;
    this.senderId = CONFIG.SMSAPI_SENDER_ID;
  }

  async sendSMS(to: string, message: string): Promise<SMSSendResult> {
    try {
      if (!this.apiKey) {
        console.warn("SMSAPI.lk not configured, skipping SMS");
        return {
          success: false,
          error: "SMS service not configured",
        };
      }

      // Format phone number - remove + if present and ensure it starts with country code
      const formattedPhone = to.replace(/\D/g, '').replace(/^1/, '');

      const response = await axios.post(this.apiUrl, 
        {
          API_KEY: this.apiKey,
          SenderID: this.senderId,
          Message: message,
          MobileNumbers: formattedPhone,
        }
      );

      if (response.data && response.data.StatusCode === 200) {
        return {
          success: true,
          messageId: response.data.MessageID || response.data.message_id,
        };
      } else {
        return {
          success: false,
          error: response.data?.StatusMessage || "Failed to send SMS",
        };
      }
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
