'use client';

import { useEffect, useRef, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
import { toast } from 'sonner';

export interface PushNotification {
  type: string;
  appointmentId?: string;
  sessionId?: string;
  title: string;
  message: string;
  data: {
    appointmentId?: string;
    sessionId?: string;
    patientId?: string;
    doctorId?: string;
    patientName?: string;
    doctorName?: string;
    appointmentDate?: string;
    appointmentTime?: string;
    duration?: number;
    timestamp: string;
  };
}

interface UseSocketNotificationsOptions {
  enabled?: boolean;
  autoReconnect?: boolean;
  debug?: boolean;
}

/**
 * Hook to manage real-time push notifications via Socket.IO
 * Handles connection, registration, and notification handling
 */
export const useSocketNotifications = (
  userId?: string,
  options: UseSocketNotificationsOptions = {}
) => {
  const { enabled = true, autoReconnect = true, debug = false } = options;
  const socketRef = useRef<Socket | null>(null);
  const isConnectedRef = useRef(false);
  const callbacksRef = useRef<Map<string, Function[]>>(new Map());

  const log = useCallback(
    (message: string, data?: any) => {
      if (debug) {
        console.log(`[SocketIO] ${message}`, data || '');
      }
    },
    [debug]
  );

  const emit = useCallback(
    (eventType: string, data?: any) => {
      const callbacks = callbacksRef.current.get(eventType) || [];
      callbacks.forEach((callback) => callback(data));
    },
    []
  );

  const subscribe = useCallback(
    (eventType: string, callback: Function) => {
      if (!callbacksRef.current.has(eventType)) {
        callbacksRef.current.set(eventType, []);
      }
      callbacksRef.current.get(eventType)?.push(callback);

      // Return unsubscribe function
      return () => {
        const callbacks = callbacksRef.current.get(eventType) || [];
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      };
    },
    []
  );

  const unsubscribe = useCallback(
    (eventType: string, callback?: Function) => {
      if (!callback) {
        callbacksRef.current.delete(eventType);
      } else {
        const callbacks = callbacksRef.current.get(eventType) || [];
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    },
    []
  );

  const connect = useCallback(() => {
    if (!enabled || !userId) {
      log('Socket.IO disabled or userId missing');
      return;
    }

    if (socketRef.current?.connected) {
      log('Already connected');
      return;
    }

    try {
      const socketUrl =
        process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_URL ||
        'http://localhost:50005';

      log(`Connecting to ${socketUrl}`);

      socketRef.current = io(socketUrl, {
        reconnection: autoReconnect,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        transports: ['websocket', 'polling'],
        forceNew: false,
      });

      const socket = socketRef.current;

      // Connection established
      socket.on('connect', () => {
        log('Connected to notification service');
        isConnectedRef.current = true;

        // Register user
        socket.emit('register', userId);
        log(`Registered user: ${userId}`);

        emit('connected');
      });

      // General notification
      socket.on('notification', (notification: PushNotification) => {
        log('Received notification:', notification);

        toast.success(notification.title, {
          description: notification.message,
          duration: 5000,
        });

        // Dispatch custom event
        window.dispatchEvent(
          new CustomEvent('socket-notification', {
            detail: notification,
          })
        );

        emit('notification', notification);
      });

      // Appointment booked
      socket.on('appointment-booked', (notification: PushNotification) => {
        log('Appointment booked:', notification);

        toast.success('📅 Appointment Booked', {
          description: notification.message,
          duration: 5000,
        });

        emit('appointment-booked', notification);
        emit('notification', notification);
      });

      // Appointment confirmed
      socket.on('appointment-confirmed', (notification: PushNotification) => {
        log('Appointment confirmed:', notification);

        toast.success('✅ Appointment Confirmed', {
          description: notification.message,
          duration: 5000,
        });

        emit('appointment-confirmed', notification);
        emit('notification', notification);
      });

      // Appointment rejected
      socket.on('appointment-rejected', (notification: PushNotification) => {
        log('Appointment rejected:', notification);

        toast.error('❌ Appointment Rejected', {
          description: notification.message,
          duration: 5000,
        });

        emit('appointment-rejected', notification);
        emit('notification', notification);
      });

      // Consultation completed
      socket.on('consultation-completed', (notification: PushNotification) => {
        log('Consultation completed:', notification);

        toast.success('🎥 Consultation Completed', {
          description: notification.message,
          duration: 5000,
        });

        emit('consultation-completed', notification);
        emit('notification', notification);
      });

      // Disconnected
      socket.on('disconnect', () => {
        log('Disconnected from notification service');
        isConnectedRef.current = false;
        emit('disconnected');
      });

      // Error event
      socket.on('error', (error) => {
        console.error('Socket.IO error:', error);
        toast.error('Connection Error', {
          description: 'Failed to connect to notification service',
        });
        emit('error', error);
      });

      // Connection error
      socket.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
      });
    } catch (error) {
      console.error('Failed to initialize Socket.IO:', error);
    }
  }, [enabled, userId, autoReconnect, log, emit]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      isConnectedRef.current = false;
      log('Socket.IO disconnected');
      emit('disconnected');
    }
  }, [log, emit]);

  const getConnectionStatus = useCallback(() => {
    return isConnectedRef.current;
  }, []);

  // Auto-connect on mount and when userId changes
  useEffect(() => {
    if (enabled && userId) {
      // If already connected with a different userId, disconnect first
      if (socketRef.current?.connected) {
        // Re-register with new userId
        socketRef.current.emit('register', userId);
        log(`Re-registered with userId: ${userId}`);
      } else {
        // Connect with new userId
        connect();
      }
    }

    // Cleanup on unmount
    return () => {
      // Don't disconnect on unmount - keep connection alive
      // Only disconnect when explicitly called or userId changes
    };
  }, [userId, enabled, connect, log]);

  return {
    socket: socketRef.current,
    isConnected: isConnectedRef.current,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    emit,
    getConnectionStatus,
  };
};
