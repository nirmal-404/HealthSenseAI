import axiosInstance from '@/lib/axios';

/**
 * Notification Service - Utility functions for notification operations
 */

export interface SendNotificationParams {
  userId: string;
  type: 'email' | 'sms' | 'push';
  category: 'appointment' | 'payment' | 'reminder' | 'prescription' | 'verification';
  recipient: string;
  subject?: string;
  message: string;
  templateName?: string;
  templateVariables?: Record<string, any>;
}

export interface SendBulkNotificationParams {
  userIds: string[];
  type: 'email' | 'sms' | 'push';
  category: string;
  subject?: string;
  message: string;
}

/**
 * Send a single notification
 */
export const sendNotification = async (payload: SendNotificationParams) => {
  try {
    const response = await axiosInstance.post('/api/notifications/send', payload);
    return response.data?.data;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

/**
 * Send notifications to multiple users
 */
export const sendBulkNotifications = async (payload: SendBulkNotificationParams) => {
  try {
    const response = await axiosInstance.post('/api/notifications/send-bulk', payload);
    return response.data?.data;
  } catch (error) {
    console.error('Error sending bulk notifications:', error);
    throw error;
  }
};

/**
 * Get user notifications
 */
export const getUserNotifications = async (userId: string, limit = 50, offset = 0) => {
  try {
    const response = await axiosInstance.get(
      `/api/notifications/user/${userId}?limit=${limit}&offset=${offset}`
    );
    return response.data?.data;
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    throw error;
  }
};

/**
 * Get notification by ID
 */
export const getNotification = async (notificationId: string) => {
  try {
    const response = await axiosInstance.get(`/api/notifications/${notificationId}`);
    return response.data?.data?.notification;
  } catch (error) {
    console.error('Error fetching notification:', error);
    throw error;
  }
};

/**
 * Get notification statistics
 */
export const getNotificationStats = async () => {
  try {
    const response = await axiosInstance.get('/api/notifications/stats');
    return response.data?.data?.stats;
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    throw error;
  }
};

/**
 * Update user notification preferences
 */
export const updateNotificationPreferences = async (
  userId: string,
  preferences: {
    emailEnabled?: boolean;
    smsEnabled?: boolean;
    appointmentNotifications?: boolean;
    paymentNotifications?: boolean;
    reminderNotifications?: boolean;
    prescriptionNotifications?: boolean;
    verificationNotifications?: boolean;
  }
) => {
  try {
    const response = await axiosInstance.put(
      `/api/notifications/preferences/${userId}`,
      preferences
    );
    return response.data?.data?.preference;
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    throw error;
  }
};

/**
 * Get user notification preferences
 */
export const getNotificationPreferences = async (userId: string) => {
  try {
    const response = await axiosInstance.get(`/api/notifications/preferences/${userId}`);
    return response.data?.data?.preference;
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    throw error;
  }
};

/**
 * Retry failed notifications
 */
export const retryFailedNotifications = async () => {
  try {
    const response = await axiosInstance.post('/api/notifications/retry-failed', {});
    return response.data?.data;
  } catch (error) {
    console.error('Error retrying failed notifications:', error);
    throw error;
  }
};

/**
 * Helper function - Send appointment confirmation notification
 */
export const sendAppointmentConfirmation = async (
  userId: string,
  patientEmail: string,
  appointmentDetails: {
    doctorName: string;
    appointmentDate: string;
    appointmentTime: string;
    appointmentType: string;
  }
) => {
  return sendNotification({
    userId,
    type: 'email',
    category: 'appointment',
    recipient: patientEmail,
    subject: 'Appointment Confirmed',
    message: `Your appointment with Dr. ${appointmentDetails.doctorName} is confirmed for ${appointmentDetails.appointmentDate} at ${appointmentDetails.appointmentTime} (${appointmentDetails.appointmentType}).`,
  });
};

/**
 * Helper function - Send appointment reminder notification
 */
export const sendAppointmentReminder = async (
  userId: string,
  patientEmail: string,
  patientPhone: string,
  appointmentDetails: {
    doctorName: string;
    appointmentDate: string;
    appointmentTime: string;
  }
) => {
  return sendBulkNotifications({
    userIds: [userId],
    type: 'sms',
    category: 'reminder',
    message: `Reminder: Your appointment with Dr. ${appointmentDetails.doctorName} is ${appointmentDetails.appointmentDate} at ${appointmentDetails.appointmentTime}. Please arrive 10 minutes early. -HealthSense`,
  });
};

/**
 * Helper function - Send payment confirmation notification
 */
export const sendPaymentConfirmation = async (
  userId: string,
  userEmail: string,
  paymentDetails: {
    transactionId: string;
    amount: number;
    currency: string;
    description: string;
  }
) => {
  return sendNotification({
    userId,
    type: 'email',
    category: 'payment',
    recipient: userEmail,
    subject: 'Payment Confirmation',
    message: `Your payment of ${paymentDetails.currency} ${paymentDetails.amount} has been received. Transaction ID: ${paymentDetails.transactionId}. Description: ${paymentDetails.description}`,
  });
};

/**
 * Helper function - Send password reset notification
 */
export const sendPasswordReset = async (
  userId: string,
  userEmail: string,
  resetLink: string
) => {
  return sendNotification({
    userId,
    type: 'email',
    category: 'verification',
    recipient: userEmail,
    subject: 'Password Reset Request',
    message: `Click the link below to reset your password:\n${resetLink}\n\nThis link will expire in 1 hour.`,
  });
};

/**
 * Helper function - Send prescription notification
 */
export const sendPrescriptionNotification = async (
  userId: string,
  userEmail: string,
  prescriptionDetails: {
    doctorName: string;
    medication: string;
    dosage: string;
  }
) => {
  return sendNotification({
    userId,
    type: 'email',
    category: 'prescription',
    recipient: userEmail,
    subject: 'New Prescription',
    message: `Dr. ${prescriptionDetails.doctorName} has sent you a prescription:\n\nMedication: ${prescriptionDetails.medication}\nDosage: ${prescriptionDetails.dosage}\n\nPlease log in to view complete details.`,
  });
};
