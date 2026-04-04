import nodemailer from "nodemailer";
import { CONFIG } from '../config/envConfig'

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: CONFIG.EMAIL_USER,
        pass: CONFIG.EMAIL_PASS,
    },
});

export const sendEmail = async ({ to, subject, html, text }: { to: string, subject: string, html: string, text?: string }) => {
    await transporter.sendMail({
        from: `HealthSenseAi ${CONFIG.EMAIL_USER}`,
        to,
        subject,
        html,
        text,
    });
}

