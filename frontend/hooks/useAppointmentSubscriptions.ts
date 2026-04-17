'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSocketIO } from '@/components/providers/SocketIOProvider';

interface AppointmentNotification {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  patientName: string;
  appointmentDate: string;
  appointmentTime: string;
}

/**
 * Hook to subscribe to appointment-related notifications
 * Use in components to react to appointment changes
 */
export const useAppointmentNotifications = () => {
  const socketIO = useSocketIO();
  const [latestNotification, setLatestNotification] = useState<any>(null);
  const [appointmentNotifications, setAppointmentNotifications] = useState<
    AppointmentNotification[]
  >([]);

  const handleAppointmentBooked = useCallback(
    (notification: any) => {
      console.log('📅 Appointment booked:', notification);
      setLatestNotification(notification);
      setAppointmentNotifications((prev) => [
        notification.data as AppointmentNotification,
        ...prev,
      ]);
    },
    []
  );

  const handleAppointmentConfirmed = useCallback(
    (notification: any) => {
      console.log('✅ Appointment confirmed:', notification);
      setLatestNotification(notification);
    },
    []
  );

  const handleAppointmentRejected = useCallback(
    (notification: any) => {
      console.log('❌ Appointment rejected:', notification);
      setLatestNotification(notification);
    },
    []
  );

  // Subscribe to appointment events
  useEffect(() => {
    const unsubBookedscribe = socketIO.subscribe(
      'appointment-booked',
      handleAppointmentBooked
    );
    const unsubConfirm = socketIO.subscribe(
      'appointment-confirmed',
      handleAppointmentConfirmed
    );
    const unsubReject = socketIO.subscribe(
      'appointment-rejected',
      handleAppointmentRejected
    );

    return () => {
      unsubBookedscribe();
      unsubConfirm();
      unsubReject();
    };
  }, [
    socketIO,
    handleAppointmentBooked,
    handleAppointmentConfirmed,
    handleAppointmentRejected,
  ]);

  return {
    latestNotification,
    appointmentNotifications,
    isConnected: socketIO.getConnectionStatus(),
  };
};

/**
 * Hook to subscribe to consultation-related notifications
 */
export const useConsultationNotifications = () => {
  const socketIO = useSocketIO();
  const [consultationNotification, setConsultationNotification] = useState<
    any
  >(null);

  const handleConsultationCompleted = useCallback(
    (notification: any) => {
      console.log('🎥 Consultation completed:', notification);
      setConsultationNotification(notification);
    },
    []
  );

  useEffect(() => {
    const unsubscribe = socketIO.subscribe(
      'consultation-completed',
      handleConsultationCompleted
    );

    return () => {
      unsubscribe();
    };
  }, [socketIO, handleConsultationCompleted]);

  return {
    consultationNotification,
    isConnected: socketIO.getConnectionStatus(),
  };
};
