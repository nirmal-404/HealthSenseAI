import EmailService from "./EmailService";
import SMSService from "./SMSService";
import { CONFIG } from "../config/envConfig";
import { AppointmentNotificationPayload, ConsultationCompletedPayload } from "../types";

/**
 * Event handler for appointment.booked event
 * Sends email and SMS notifications to both patient and doctor
 */
export const handleAppointmentBooked = async (
  payload: AppointmentNotificationPayload
): Promise<void> => {
  console.log(
    `\n📋 Processing appointment.booked event for appointment ${payload.appointmentId}`
  );

  try {
    // Prepare notification data
    const appointmentData = {
      patientName: payload.patientName,
      doctorName: payload.doctorName,
      appointmentDate: payload.appointmentDate,
      appointmentTime: payload.appointmentTime,
    };

    // Send patient notifications
    console.log(`\n👤 Sending patient notifications...`);
    
    // Patient email
    const patientEmailResult = await EmailService.sendAppointmentConfirmation(
      payload.patientEmail,
      appointmentData
    );
    console.log(
      `${patientEmailResult.success ? "✓" : "✗"} Patient email: ${patientEmailResult.success ? "sent" : "failed"}`
    );

    // Patient SMS
    const patientSMSResult = await SMSService.sendAppointmentConfirmationSMS(
      payload.patientPhone,
      appointmentData
    );
    console.log(
      `${patientSMSResult.success ? "✓" : "✗"} Patient SMS: ${patientSMSResult.success ? "sent" : "failed"}`
    );

    // Send doctor notifications
    console.log(`\n👨‍⚕️ Sending doctor notifications...`);

    const doctorEmailSubject = `New Appointment Booked - ${payload.patientName}`;
    const doctorEmailContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #007bff;">New Appointment Notification</h2>
            <p>Dear Dr. <strong>${payload.doctorName}</strong>,</p>
            <p>A new appointment has been booked with you.</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Patient:</strong> ${payload.patientName}</p>
              <p><strong>Date:</strong> ${payload.appointmentDate}</p>
              <p><strong>Time:</strong> ${payload.appointmentTime}</p>
              <p><strong>Appointment ID:</strong> ${payload.appointmentId}</p>
            </div>
            <p style="margin-top: 20px;">Please log in to your HealthSense account to confirm or reschedule if needed.</p>
            <p>Best regards,<br><strong>HealthSense Team</strong></p>
          </div>
        </body>
      </html>
    `;

    // Doctor email
    const doctorEmailResult = await EmailService.sendEmail(
      payload.doctorEmail,
      doctorEmailSubject,
      doctorEmailContent
    );
    console.log(
      `${doctorEmailResult.success ? "✓" : "✗"} Doctor email: ${doctorEmailResult.success ? "sent" : "failed"}`
    );

    // Doctor SMS
    const doctorSMSMessage = `Hi Dr. ${payload.doctorName}, a new appointment has been booked with you by ${payload.patientName} on ${payload.appointmentDate} at ${payload.appointmentTime}. Please confirm at HealthSense. -HealthSense`;
    const doctorSMSResult = await SMSService.sendSMS(
      payload.doctorPhone,
      doctorSMSMessage
    );
    console.log(
      `${doctorSMSResult.success ? "✓" : "✗"} Doctor SMS: ${doctorSMSResult.success ? "sent" : "failed"}`
    );

    // Log summary
    const successCount = [
      patientEmailResult.success,
      patientSMSResult.success,
      doctorEmailResult.success,
      doctorSMSResult.success,
    ].filter(Boolean).length;

    console.log(
      `\n✅ Appointment booking notifications completed: ${successCount}/4 sent`
    );
    console.log(`   Appointment ID: ${payload.appointmentId}\n`);
  } catch (error: any) {
    console.error(
      `❌ Error handling appointment.booked event: ${error?.message}`
    );
    throw error;
  }
};

/**
 * Event handler for consultation.completed event
 * Sends email and SMS notifications to both patient and doctor
 */
export const handleConsultationCompleted = async (
  payload: ConsultationCompletedPayload
): Promise<void> => {
  console.log(
    `\n🎥 Processing consultation.completed event for session ${payload.sessionId}`
  );

  try {
    const consultationData = {
      patientName: payload.patientName,
      doctorName: payload.doctorName,
      consultationDate: payload.consultationDate,
      consultationTime: payload.consultationTime,
      duration: payload.duration,
    };

    // Send patient notifications
    console.log(`\n👤 Sending patient notifications...`);

    const patientEmailSubject = `Consultation Completed - Dr. ${payload.doctorName}`;
    const patientEmailContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #28a745;">Consultation Completed</h2>
            <p>Dear <strong>${payload.patientName}</strong>,</p>
            <p>Your telemedicine consultation with Dr. ${payload.doctorName} has been completed successfully.</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Doctor:</strong> Dr. ${payload.doctorName}</p>
              <p><strong>Date:</strong> ${payload.consultationDate}</p>
              <p><strong>Time:</strong> ${payload.consultationTime}</p>
              <p><strong>Duration:</strong> ${payload.duration} minutes</p>
              <p><strong>Session ID:</strong> ${payload.sessionId}</p>
            </div>
            ${payload.notes ? `<p><strong>Notes:</strong> ${payload.notes}</p>` : ""}
            <p style="margin-top: 20px;">You can now view your consultation summary, prescription details, and medical reports in your HealthSense account.</p>
            <p>If you have any follow-up questions, please contact the doctor through the app.</p>
            <p>Best regards,<br><strong>HealthSense Team</strong></p>
          </div>
        </body>
      </html>
    `;

    // Patient email
    const patientEmailResult = await EmailService.sendEmail(
      payload.patientEmail,
      patientEmailSubject,
      patientEmailContent
    );
    console.log(
      `${patientEmailResult.success ? "✓" : "✗"} Patient email: ${patientEmailResult.success ? "sent" : "failed"}`
    );

    // Patient SMS
    const patientSMSMessage = `Hi ${payload.patientName}, your consultation with Dr. ${payload.doctorName} is complete. Check your HealthSense account for prescription and reports. -HealthSense`;
    const patientSMSResult = await SMSService.sendSMS(
      payload.patientPhone,
      patientSMSMessage
    );
    console.log(
      `${patientSMSResult.success ? "✓" : "✗"} Patient SMS: ${patientSMSResult.success ? "sent" : "failed"}`
    );

    // Send doctor notifications
    console.log(`\n👨‍⚕️ Sending doctor notifications...`);

    const doctorEmailSubject = `Consultation with ${payload.patientName} Completed`;
    const doctorEmailContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #28a745;">Telemedicine Session Completed</h2>
            <p>Dear Dr. <strong>${payload.doctorName}</strong>,</p>
            <p>Your telemedicine consultation session has been completed successfully.</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Patient:</strong> ${payload.patientName}</p>
              <p><strong>Date:</strong> ${payload.consultationDate}</p>
              <p><strong>Time:</strong> ${payload.consultationTime}</p>
              <p><strong>Duration:</strong> ${payload.duration} minutes</p>
              <p><strong>Session ID:</strong> ${payload.sessionId}</p>
            </div>
            <p style="margin-top: 20px;">Please ensure that you have uploaded any prescriptions or medical documents to the patient's record if applicable.</p>
            <p>Best regards,<br><strong>HealthSense Team</strong></p>
          </div>
        </body>
      </html>
    `;

    // Doctor email
    const doctorEmailResult = await EmailService.sendEmail(
      payload.doctorEmail,
      doctorEmailSubject,
      doctorEmailContent
    );
    console.log(
      `${doctorEmailResult.success ? "✓" : "✗"} Doctor email: ${doctorEmailResult.success ? "sent" : "failed"}`
    );

    // Doctor SMS
    const doctorSMSMessage = `Hi Dr. ${payload.doctorName}, your consultation with ${payload.patientName} is complete. Upload any prescriptions/documents to the patient's record. -HealthSense`;
    const doctorSMSResult = await SMSService.sendSMS(
      payload.doctorPhone,
      doctorSMSMessage
    );
    console.log(
      `${doctorSMSResult.success ? "✓" : "✗"} Doctor SMS: ${doctorSMSResult.success ? "sent" : "failed"}`
    );

    // Log summary
    const successCount = [
      patientEmailResult.success,
      patientSMSResult.success,
      doctorEmailResult.success,
      doctorSMSResult.success,
    ].filter(Boolean).length;

    console.log(
      `\n✅ Consultation completion notifications completed: ${successCount}/4 sent`
    );
    console.log(`   Session ID: ${payload.sessionId}\n`);
  } catch (error: any) {
    console.error(
      `❌ Error handling consultation.completed event: ${error?.message}`
    );
    throw error;
  }
};
