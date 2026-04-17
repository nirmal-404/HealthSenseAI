/**
 * Appointment type pricing configuration
 * Defines consultation fees for different appointment types
 */

export type AppointmentType = 'video' | 'in-person';

export const APPOINTMENT_PRICING: Record<AppointmentType, number> = {
  video: 2500, // LKR 2500 for video consultation
  'in-person': 3000, // LKR 3000 for in-person visit
};

/**
 * Get consultation fee for appointment type
 */
export const getConsultationFee = (appointmentType: AppointmentType): number => {
  return APPOINTMENT_PRICING[appointmentType] || 0;
};

/**
 * Format fee as currency
 */
export const formatFeeAsCurrency = (fee: number): string => {
  return `LKR ${fee.toFixed(2)}`;
};
