import axios from "axios";
import { CONFIG } from "../config/envConfig";
import { SMSSendResult } from "../types";

class SMSService {
  private apiKey: string;
  private senderId: string;
  private apiUrl = "https://dashboard.smsapi.lk/api/v3/sms/send";

  constructor() {
    this.apiKey = CONFIG.SMSAPI_API_KEY;
    this.senderId = CONFIG.SMSAPI_SENDER_ID;
  }

  async sendSMS(to: string, message: string): Promise<SMSSendResult> {
    try {
      if (!this.apiKey) {
        console.warn("SMSAPI.lk not configured, skipping SMS");
        return { success: false, error: "SMS service not configured" };
      }

      const formattedPhone = to.replace(/\D/g, '').replace(/^1/, '');

      const response = await axios.post(
        this.apiUrl,
        {
          recipient: formattedPhone,
          sender_id: this.senderId,
          message: message,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        return {
          success: true,
          messageId: response.data?.data?.id || response.data?.message_id,
        };
      } else {
        return {
          success: false,
          error: response.data?.message || "Failed to send SMS",
        };
      }
    } catch (error: any) {
      console.error("SMS sending error:", error);
      return { success: false, error: error?.message || "Failed to send SMS" };
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

  async sendVerificationSMS(
    to: string,
    verificationCode: string
  ): Promise<SMSSendResult> {
    const message = `Your HealthSense verification code is: ${verificationCode}. Do not share this code with anyone.`;
    return this.sendSMS(to, message);
  }

  /**
   * Verify SMS service connection
   */
  async verifyConnection(): Promise<boolean> {
    try {
      if (!this.apiKey) {
        console.warn("⚠️  SMS Service: Not configured (API key missing)");
        return false;
      }

      console.log("🔗 SMS Service: Verifying connection to SMSAPI.lk...");
      console.log(`   API URL: ${this.apiUrl}`);
      console.log(`   Sender ID: ${this.senderId}`);
      
      // Test connection with a valid Sri Lankan phone number format
      // Format: +94XXXXXXXXX or 0XXXXXXXXX
      const response = await axios.post(
        this.apiUrl,
        {
          recipient: "+94701234567",  // Valid Sri Lankan format
          sender_id: this.senderId,
          message: "Test connection",
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 5000,
        }
      );

      console.log("✅ SMS Service: Connected successfully to SMSAPI.lk");
      return true;
    } catch (error: any) {
      console.warn("⚠️  SMS Service: Connection verification failed");
      console.warn(`   Error: ${error?.message || "Unknown error"}`);
      
      if (error?.response) {
        console.warn(`   Status Code: ${error.response.status}`);
        console.warn(`   Response: ${JSON.stringify(error.response.data)}`);
        
        if (error.response.status === 403) {
          const responseMsg = error.response.data?.message || "";
          
          if (responseMsg.includes("invalid phone number")) {
            console.warn("   📝 Phone number validation failed (this is expected in test mode)");
            console.warn("   ✅ API Key and Sender ID appear to be valid!");
            console.log("✅ SMS Service: API credentials validated successfully");
            return true;
          }
          
          console.warn("   📝 Possible causes for 403:");
          console.warn("      - Invalid or expired API key");
          console.warn("      - Wrong authorization header format (check if Bearer token is correct)");
          console.warn("      - Sender ID not activated in SMSAPI.lk dashboard");
          console.warn("      - API key doesn't have SMS sending permissions");
          console.warn("   💡 Fix: Verify API key and Sender ID in SMSAPI.lk dashboard");
        }
      }
      
      return false;
    }
  }
}

export default new SMSService();