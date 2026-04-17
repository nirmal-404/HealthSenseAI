import nodemailer from "nodemailer";
import { CONFIG } from '../config/envConfig'

// Configure TLS based on environment
// Production: Strict certificate validation
// Development: Allow self-signed certificates for testing
const tlsConfig = CONFIG.ENV === "production"
  ? { rejectUnauthorized: true, minVersion: "TLSv1.2" as any }
  : { rejectUnauthorized: false };

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: CONFIG.EMAIL_USER,
        pass: CONFIG.EMAIL_PASS,
    },
    tls: tlsConfig as any,
});

export const sendEmail = async ({ to, subject, html, text }: { to: string, subject: string, html: string, text?: string }) => {
    try {
        const info = await transporter.sendMail({
            from: `HealthSenseAi ${CONFIG.EMAIL_USER}`,
            to,
            subject,
            html,
            text,
        });
        console.log(`✓ Email sent to ${to} | MessageID: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error: any) {
        const errorMessage = `Email sending failed to ${to}: ${error?.message || "Unknown error"}`;
        console.error(`✗ ${errorMessage}`);
        console.error({
            service: "EmailService",
            recipient: to,
            error: error?.message,
            code: error?.code,
            command: error?.command,
            timestamp: new Date().toISOString(),
            environment: CONFIG.ENV,
        });
        throw error;
    }
}

