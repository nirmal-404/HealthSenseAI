import nodemailer, { Transporter, TransportOptions } from "nodemailer";
import { CONFIG } from "../config/envConfig";
import { EmailSendResult } from "../types";

class EmailService {
  private transporter: Transporter;
  private emailVerified: boolean = false;

  constructor() {
    // Configure TLS based on environment
    // Production: Strict certificate validation (minVersion TLSv1.2)
    // Development: Allow self-signed certificates for testing
    const tlsConfig = CONFIG.ENV === "production"
      ? { rejectUnauthorized: true, minVersion: "TLSv1.2" as any }
      : { rejectUnauthorized: false };

    // Properly typed SMTP transport options
    const smtpOptions: TransportOptions = {
      host: CONFIG.EMAIL_HOST,
      port: CONFIG.EMAIL_PORT,
      secure: CONFIG.EMAIL_SECURE,
      auth: {
        user: CONFIG.EMAIL_USER,
        pass: CONFIG.EMAIL_PASSWORD,
      },
      tls: tlsConfig as any,
      // Add logging for debugging
      logger: CONFIG.ENV === "development",
      debug: CONFIG.ENV === "development",
    } as any;

    this.transporter = nodemailer.createTransport(smtpOptions);
  }

  async sendEmail(
    to: string,
    subject: string,
    htmlContent: string,
    textContent?: string
  ): Promise<EmailSendResult> {
    try {
      // Verify connection before sending (for important notifications)
      if (!this.emailVerified) {
        await this.verifyConnection();
      }

      const mailOptions = {
        from: CONFIG.EMAIL_FROM,
        to,
        subject,
        html: htmlContent,
        text: textContent || htmlContent.replace(/<[^>]*>/g, ""),
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      // Log successful send
      console.log(`✓ Email sent to ${to} | MessageID: ${info.messageId}`);
      
      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error: any) {
      const errorMessage = `Email sending failed to ${to}: ${error?.message || "Unknown error"}`;
      console.error(`✗ ${errorMessage}`);
      
      // Log detailed error for production monitoring
      console.error({
        service: "EmailService",
        recipient: to,
        error: error?.message,
        code: error?.code,
        command: error?.command,
        timestamp: new Date().toISOString(),
        environment: CONFIG.ENV,
      });
      
      return {
        success: false,
        error: error?.message || "Failed to send email",
      };
    }
  }

  async sendAppointmentConfirmation(
    to: string,
    data: {
      patientName: string;
      doctorName: string;
      appointmentDate: string;
      appointmentTime: string;
    }
  ): Promise<EmailSendResult> {
    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #007bff;">Appointment Confirmation</h2>
            <p>Dear <strong>${data.patientName}</strong>,</p>
            <p>Your appointment has been successfully booked with Dr. <strong>${data.doctorName}</strong>.</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Appointment Details:</strong></p>
              <p><strong>Date:</strong> ${data.appointmentDate}</p>
              <p><strong>Time:</strong> ${data.appointmentTime}</p>
            </div>
            <p>Please arrive 10 minutes before your scheduled appointment time.</p>
            <p style="color: #666; font-size: 12px;">
              If you need to cancel or reschedule, please login to your account at least 24 hours before your appointment.
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">HealthSense Team</p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail(to, "Appointment Confirmation - HealthSense", htmlContent);
  }

  async sendAppointmentReminder(
    to: string,
    data: {
      patientName: string;
      doctorName: string;
      appointmentDate: string;
      appointmentTime: string;
    }
  ): Promise<EmailSendResult> {
    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #ff7b00;">Appointment Reminder</h2>
            <p>Dear <strong>${data.patientName}</strong>,</p>
            <p>This is a reminder about your upcoming appointment with Dr. <strong>${data.doctorName}</strong>.</p>
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ff7b00;">
              <p><strong>Date:</strong> ${data.appointmentDate}</p>
              <p><strong>Time:</strong> ${data.appointmentTime}</p>
            </div>
            <p>Please make sure to be online or at the clinic 10 minutes before your appointment.</p>
            <p style="color: #666; font-size: 12px;">
              HealthSense Team
            </p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail(to, "Appointment Reminder - HealthSense", htmlContent);
  }

  async sendPaymentConfirmation(
    to: string,
    data: {
      userName: string;
      amount: number;
      currency: string;
      transactionId: string;
    }
  ): Promise<EmailSendResult> {
    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #28a745;">Payment Confirmation</h2>
            <p>Dear <strong>${data.userName}</strong>,</p>
            <p>Your payment has been successfully processed.</p>
            <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
              <p><strong>Amount:</strong> ${data.currency} ${data.amount}</p>
              <p><strong>Transaction ID:</strong> ${data.transactionId}</p>
            </div>
            <p>Thank you for using HealthSense. You will receive your appointment confirmation shortly.</p>
            <p style="color: #666; font-size: 12px;">
              HealthSense Team
            </p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail(to, "Payment Confirmation - HealthSense", htmlContent);
  }

  async sendPrescriptionNotification(
    to: string,
    data: {
      patientName: string;
      doctorName: string;
      medications: string[];
    }
  ): Promise<EmailSendResult> {
    const medicationsList = data.medications.map((med) => `<li>${med}</li>`).join("");

    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #007bff;">Digital Prescription</h2>
            <p>Dear <strong>${data.patientName}</strong>,</p>
            <p>Your prescription from Dr. <strong>${data.doctorName}</strong> is now available.</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Medications:</strong></p>
              <ul>${medicationsList}</ul>
            </div>
      this.emailVerified = true;
      console.log("✓ Email service connection verified");
      return true;
    } catch (error: any) {
      this.emailVerified = false;
      console.error("✗ Email service connection failed:", error?.message);
      
      // Log to monitoring in production
      if (CONFIG.ENV === "production") {
        console.error({
          alert: "Email Service Unavailable",
          service: "EmailService",
          error: error?.message,
          timestamp: new Date().toISOString(),
          severity: "critical",
        });
      }
      
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">HealthSense Team</p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail(to, "Your Digital Prescription - HealthSense", htmlContent);
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log("✓ Email service connection verified");
      return true;
    } catch (error) {
      console.error("✗ Email service connection failed:", error);
      return false;
    }
  }
}

export default new EmailService();
