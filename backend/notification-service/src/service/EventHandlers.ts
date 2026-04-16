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
  console.log(`📧 Payload received:`, {
    appointmentId: payload.appointmentId,
    patientEmail: payload.patientEmail,
    doctorEmail: payload.doctorEmail,
    patientPhone: payload.patientPhone,
    doctorPhone: payload.doctorPhone,
  });

  try {
    // Prepare notification data
    const appointmentData = {
      patientName: payload.patientName || "Patient",
      doctorName: payload.doctorName || "Doctor",
      appointmentDate: payload.appointmentDate,
      appointmentTime: payload.appointmentTime,
    };

    let successCount = 0;

    // Send patient notifications
    console.log(`\n👤 Sending patient notifications...`);
    
    if (!payload.patientEmail || !payload.patientPhone) {
      console.warn(
        `⚠️  Missing patient contact info - Email: ${payload.patientEmail ? "✓" : "✗"}, Phone: ${payload.patientPhone ? "✓" : "✗"}`
      );
    } else {
      // Patient email
      const patientEmailResult = await EmailService.sendAppointmentConfirmation(
        payload.patientEmail,
        appointmentData
      );
      console.log(
        `${patientEmailResult.success ? "✓" : "✗"} Patient email: ${patientEmailResult.success ? "sent" : "failed"}`
      );
      if (patientEmailResult.success) successCount++;

      // Patient SMS
      const patientSMSResult = await SMSService.sendAppointmentConfirmationSMS(
        payload.patientPhone,
        appointmentData
      );
      console.log(
        `${patientSMSResult.success ? "✓" : "✗"} Patient SMS: ${patientSMSResult.success ? "sent" : "failed"}`
      );
      if (patientSMSResult.success) successCount++;
    }

    // Send doctor notifications
    console.log(`\n👨‍⚕️ Sending doctor notifications...`);

    if (!payload.doctorEmail || !payload.doctorPhone) {
      console.warn(
        `⚠️  Missing doctor contact info - Email: ${payload.doctorEmail ? "✓" : "✗"}, Phone: ${payload.doctorPhone ? "✓" : "✗"}`
      );
    } else {
      const doctorEmailSubject = `New Appointment Booked - ${appointmentData.patientName}`;
      const doctorEmailContent = `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
              <h2 style="color: #007bff;">New Appointment Notification</h2>
              <p>Dear Dr. <strong>${appointmentData.doctorName}</strong>,</p>
              <p>A new appointment has been booked with you.</p>
              <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Patient:</strong> ${appointmentData.patientName}</p>
                <p><strong>Date:</strong> ${appointmentData.appointmentDate}</p>
                <p><strong>Time:</strong> ${appointmentData.appointmentTime}</p>
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
      if (doctorEmailResult.success) successCount++;

      // Doctor SMS
      const doctorSMSMessage = `Hi Dr. ${appointmentData.doctorName}, a new appointment has been booked with you by ${appointmentData.patientName} on ${appointmentData.appointmentDate} at ${appointmentData.appointmentTime}. Please confirm at HealthSense. -HealthSense`;
      const doctorSMSResult = await SMSService.sendSMS(
        payload.doctorPhone,
        doctorSMSMessage
      );
      console.log(
        `${doctorSMSResult.success ? "✓" : "✗"} Doctor SMS: ${doctorSMSResult.success ? "sent" : "failed"}`
      );
      if (doctorSMSResult.success) successCount++;
    }

    console.log(
      `\n✅ Appointment booking notifications completed: ${successCount} sent`
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

/**
 * Event handler for appointment.confirmed event
 * Sends email and SMS notifications to both patient and doctor when doctor confirms appointment
 */
export const handleAppointmentConfirmed = async (
  payload: AppointmentNotificationPayload
): Promise<void> => {
  console.log(
    `\n✅ Processing appointment.confirmed event for appointment ${payload.appointmentId}`
  );

  try {
    // Check if required contact info is available
    if (!payload.patientEmail && !payload.patientPhone && !payload.doctorEmail && !payload.doctorPhone) {
      console.warn(
        `⚠️  Missing all contact information for appointment ${payload.appointmentId}. Skipping notifications.`
      );
      return;
    }

    // Prepare notification data
    const appointmentData = {
      patientName: payload.patientName || "Patient",
      doctorName: payload.doctorName || "Doctor",
      appointmentDate: payload.appointmentDate,
      appointmentTime: payload.appointmentTime,
    };

    let successCount = 0;

    // Send patient notifications
    console.log(`\n👤 Sending patient notifications...`);

    if (payload.patientEmail && payload.patientPhone) {
      const patientEmailSubject = `Appointment Confirmed by Dr. ${appointmentData.doctorName}`;
      const patientEmailContent = `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
              <h2 style="color: #28a745;">✓ Appointment Confirmed</h2>
              <p>Dear <strong>${appointmentData.patientName}</strong>,</p>
              <p>Great news! Your appointment has been confirmed by Dr. ${appointmentData.doctorName}.</p>
              <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Doctor:</strong> Dr. ${appointmentData.doctorName}</p>
                <p><strong>Date:</strong> ${appointmentData.appointmentDate}</p>
                <p><strong>Time:</strong> ${appointmentData.appointmentTime}</p>
                <p><strong>Appointment ID:</strong> ${payload.appointmentId}</p>
              </div>
              <p style="margin-top: 20px;">Please make sure to be ready 5 minutes before the scheduled time. You can join via the HealthSense app.</p>
              <p>Best regards,<br><strong>HealthSense Team</strong></p>
            </div>
          </body>
        </html>
      `;

      const patientEmailResult = await EmailService.sendEmail(
        payload.patientEmail,
        patientEmailSubject,
        patientEmailContent
      );
      console.log(
        `${patientEmailResult.success ? "✓" : "✗"} Patient email: ${patientEmailResult.success ? "sent" : "failed"}`
      );
      if (patientEmailResult.success) successCount++;

      const patientSMSMessage = `Hi ${appointmentData.patientName}, your appointment with Dr. ${appointmentData.doctorName} on ${appointmentData.appointmentDate} at ${appointmentData.appointmentTime} has been confirmed. -HealthSense`;
      const patientSMSResult = await SMSService.sendSMS(
        payload.patientPhone,
        patientSMSMessage
      );
      console.log(
        `${patientSMSResult.success ? "✓" : "✗"} Patient SMS: ${patientSMSResult.success ? "sent" : "failed"}`
      );
      if (patientSMSResult.success) successCount++;
    } else {
      console.warn(`⚠️  Missing patient contact info for notifications`);
    }

    // Send doctor notifications
    console.log(`\n👨‍⚕️ Sending doctor notifications...`);

    if (payload.doctorEmail && payload.doctorPhone) {
      const doctorEmailSubject = `Appointment Confirmed with ${appointmentData.patientName}`;
      const doctorEmailContent = `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
              <h2 style="color: #28a745;">✓ Appointment Confirmed</h2>
              <p>Dear Dr. <strong>${appointmentData.doctorName}</strong>,</p>
              <p>You have successfully confirmed your appointment with ${appointmentData.patientName}.</p>
              <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Patient:</strong> ${appointmentData.patientName}</p>
                <p><strong>Date:</strong> ${appointmentData.appointmentDate}</p>
                <p><strong>Time:</strong> ${appointmentData.appointmentTime}</p>
                <p><strong>Appointment ID:</strong> ${payload.appointmentId}</p>
                <p><strong>Patient Phone:</strong> ${payload.patientPhone || "N/A"}</p>
              </div>
              <p style="margin-top: 20px;">The patient has been notified and is prepared for the appointment. Please be ready to start the consultation at the scheduled time.</p>
              <p>Best regards,<br><strong>HealthSense Team</strong></p>
            </div>
          </body>
        </html>
      `;

      const doctorEmailResult = await EmailService.sendEmail(
        payload.doctorEmail,
        doctorEmailSubject,
        doctorEmailContent
      );
      console.log(
        `${doctorEmailResult.success ? "✓" : "✗"} Doctor email: ${doctorEmailResult.success ? "sent" : "failed"}`
      );
      if (doctorEmailResult.success) successCount++;

      const doctorSMSMessage = `Hi Dr. ${appointmentData.doctorName}, your appointment with ${appointmentData.patientName} on ${appointmentData.appointmentDate} at ${appointmentData.appointmentTime} is confirmed. -HealthSense`;
      const doctorSMSResult = await SMSService.sendSMS(
        payload.doctorPhone,
        doctorSMSMessage
      );
      console.log(
        `${doctorSMSResult.success ? "✓" : "✗"} Doctor SMS: ${doctorSMSResult.success ? "sent" : "failed"}`
      );
      if (doctorSMSResult.success) successCount++;
    } else {
      console.warn(`⚠️  Missing doctor contact info for notifications`);
    }

    console.log(
      `\n✅ Appointment confirmation notifications completed: ${successCount} sent`
    );
    console.log(`   Appointment ID: ${payload.appointmentId}\n`);
  } catch (error: any) {
    console.error(
      `❌ Error handling appointment.confirmed event: ${error?.message}`
    );
    throw error;
  }
};

/**
 * Event handler for appointment.rejected event
 * Sends email and SMS notifications to both patient and doctor when doctor rejects appointment
 */
export const handleAppointmentRejected = async (
  payload: AppointmentNotificationPayload
): Promise<void> => {
  console.log(
    `\n❌ Processing appointment.rejected event for appointment ${payload.appointmentId}`
  );

  try {
    // Check if required contact info is available
    if (!payload.patientEmail && !payload.patientPhone && !payload.doctorEmail && !payload.doctorPhone) {
      console.warn(
        `⚠️  Missing all contact information for appointment ${payload.appointmentId}. Skipping notifications.`
      );
      return;
    }

    // Prepare notification data
    const appointmentData = {
      patientName: payload.patientName || "Patient",
      doctorName: payload.doctorName || "Doctor",
      appointmentDate: payload.appointmentDate,
      appointmentTime: payload.appointmentTime,
    };

    let successCount = 0;

    // Send patient notifications
    console.log(`\n👤 Sending patient notifications...`);

    if (payload.patientEmail && payload.patientPhone) {
      const patientEmailSubject = `Appointment Request - ${payload.notes || "Please try scheduling another time"}`;
      const patientEmailContent = `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
              <h2 style="color: #dc3545;">Appointment Request Status</h2>
              <p>Dear <strong>${appointmentData.patientName}</strong>,</p>
              <p>Unfortunately, Dr. ${appointmentData.doctorName} is unable to accept your appointment request at this time.</p>
              <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Doctor:</strong> Dr. ${appointmentData.doctorName}</p>
                <p><strong>Requested Date:</strong> ${appointmentData.appointmentDate}</p>
                <p><strong>Requested Time:</strong> ${appointmentData.appointmentTime}</p>
                <p><strong>Reason:</strong> ${payload.notes || "Doctor unavailable at this time"}</p>
                <p><strong>Appointment ID:</strong> ${payload.appointmentId}</p>
              </div>
              <p style="margin-top: 20px;">Please schedule a new appointment with Dr. ${appointmentData.doctorName} at a different time or consult with another available doctor. We apologize for any inconvenience.</p>
              <p>Best regards,<br><strong>HealthSense Team</strong></p>
            </div>
          </body>
        </html>
      `;

      const patientEmailResult = await EmailService.sendEmail(
        payload.patientEmail,
        patientEmailSubject,
        patientEmailContent
      );
      console.log(
        `${patientEmailResult.success ? "✓" : "✗"} Patient email: ${patientEmailResult.success ? "sent" : "failed"}`
      );
      if (patientEmailResult.success) successCount++;

      const patientSMSMessage = `Hi ${appointmentData.patientName}, your appointment request with Dr. ${appointmentData.doctorName} on ${appointmentData.appointmentDate} at ${appointmentData.appointmentTime} could not be confirmed. ${payload.notes ? "Reason: " + payload.notes : "Please try another time."}`;
      const patientSMSResult = await SMSService.sendSMS(
        payload.patientPhone,
        patientSMSMessage
      );
      console.log(
        `${patientSMSResult.success ? "✓" : "✗"} Patient SMS: ${patientSMSResult.success ? "sent" : "failed"}`
      );
      if (patientSMSResult.success) successCount++;
    } else {
      console.warn(`⚠️  Missing patient contact info for notifications`);
    }

    // Send doctor notifications
    console.log(`\n👨‍⚕️ Sending doctor notifications...`);

    if (payload.doctorEmail && payload.doctorPhone) {
      const doctorEmailSubject = `Appointment Request Declined - ${appointmentData.patientName}`;
      const doctorEmailContent = `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
              <h2 style="color: #dc3545;">Appointment Request Declined</h2>
              <p>Dear Dr. <strong>${appointmentData.doctorName}</strong>,</p>
              <p>Your decision to decline the appointment request has been processed and the patient has been notified.</p>
              <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Patient:</strong> ${appointmentData.patientName}</p>
                <p><strong>Date:</strong> ${appointmentData.appointmentDate}</p>
                <p><strong>Time:</strong> ${appointmentData.appointmentTime}</p>
                <p><strong>Appointment ID:</strong> ${payload.appointmentId}</p>
                ${payload.notes ? `<p><strong>Your Note:</strong> ${payload.notes}</p>` : ""}
              </div>
              <p style="margin-top: 20px;">The appointment slot is now available for other patients to book.</p>
              <p>Best regards,<br><strong>HealthSense Team</strong></p>
            </div>
          </body>
        </html>
      `;

      const doctorEmailResult = await EmailService.sendEmail(
        payload.doctorEmail,
        doctorEmailSubject,
        doctorEmailContent
      );
      console.log(
        `${doctorEmailResult.success ? "✓" : "✗"} Doctor email: ${doctorEmailResult.success ? "sent" : "failed"}`
      );
      if (doctorEmailResult.success) successCount++;

      const doctorSMSMessage = `Hi Dr. ${appointmentData.doctorName}, your decline of the appointment request with ${appointmentData.patientName} on ${appointmentData.appointmentDate} at ${appointmentData.appointmentTime} has been confirmed. The slot is now available. -HealthSense`;
      const doctorSMSResult = await SMSService.sendSMS(
        payload.doctorPhone,
        doctorSMSMessage
      );
      console.log(
        `${doctorSMSResult.success ? "✓" : "✗"} Doctor SMS: ${doctorSMSResult.success ? "sent" : "failed"}`
      );
      if (doctorSMSResult.success) successCount++;
    } else {
      console.warn(`⚠️  Missing doctor contact info for notifications`);
    }

    console.log(
      `\n✅ Appointment rejection notifications completed: ${successCount} sent`
    );
    console.log(`   Appointment ID: ${payload.appointmentId}\n`);
  } catch (error: any) {
    console.error(
      `❌ Error handling appointment.rejected event: ${error?.message}`
    );
    throw error;
  }
};
