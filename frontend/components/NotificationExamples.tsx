'use client';

import { useEffect } from 'react';
import { useSocketIO } from '@/components/providers/SocketIOProvider';

/**
 * Example component showing how to use Socket.IO notifications
 * This demonstrates listening to real-time appointment events
 */
export function AppointmentNotificationListener() {
  const socketIO = useSocketIO();

  useEffect(() => {
    // Listen to appointment booked events
    const unsubscribeBooked = socketIO.subscribe(
      'appointment-booked',
      (notification: any) => {
        console.log('Appointment booked event received:', notification);

        // Refresh appointment list
        // Update UI state
        // Navigate to appointment details
      }
    );

    // Listen to appointment confirmed events
    const unsubscribeConfirmed = socketIO.subscribe(
      'appointment-confirmed',
      (notification: any) => {
        console.log('Appointment confirmed event received:', notification);

        // Update appointment status in UI
        // Show success message
      }
    );

    // Listen to appointment rejected events
    const unsubscribeRejected = socketIO.subscribe(
      'appointment-rejected',
      (notification: any) => {
        console.log('Appointment rejected event received:', notification);

        // Update appointment status in UI
        // Show rejection reason
      }
    );

    // Listen to consultation completed events
    const unsubscribeConsultation = socketIO.subscribe(
      'consultation-completed',
      (notification: any) => {
        console.log('Consultation completed event received:', notification);

        // Handle post-consultation actions
        // Show survey/feedback form
      }
    );

    // Cleanup subscriptions
    return () => {
      unsubscribeBooked();
      unsubscribeConfirmed();
      unsubscribeRejected();
      unsubscribeConsultation();
    };
  }, [socketIO]);

  // Return null or any UI needed
  return null;
}

/**
 * Connection status component
 * Shows if real-time notifications are connected
 */
export function NotificationConnectionStatus() {
  const socketIO = useSocketIO();

  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-3 h-3 rounded-full ${
          socketIO.isConnected
            ? 'bg-green-500 animate-pulse'
            : 'bg-gray-400'
        }`}
      />
      <span className="text-sm font-medium">
        {socketIO.isConnected
          ? 'Real-time notifications enabled'
          : 'Connecting to notifications...'}
      </span>
    </div>
  );
}
