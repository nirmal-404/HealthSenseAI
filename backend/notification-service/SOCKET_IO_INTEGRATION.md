# Socket.IO Real-Time Notifications Integration Guide

This guide explains how to integrate Socket.IO real-time push notifications in your HealthSense frontend.

## Overview

The notification service now uses Socket.IO to deliver real-time push notifications to connected clients. When events occur (appointment booked, confirmed, rejected, or consultation completed), notifications are sent instantly to the relevant users.

## Client-Side Integration

### 1. Install Socket.IO Client

```bash
npm install socket.io-client
```

### 2. Create a Socket.IO Notification Hook

Create `hooks/useNotifications.ts`:

```typescript
import { useEffect, useCallback, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  type: string;
  title: string;
  message: string;
  data: any;
  timestamp: string;
}

export const useNotifications = (userId?: string) => {
  const socketRef = useRef<Socket | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) return;

    // Connect to Socket.IO server
    const socket = io(process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_URL || 'http://localhost:50005', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    // Connect event
    socket.on('connect', () => {
      console.log('✅ Connected to notification service');
      
      // Register user with their ID
      if (userId) {
        socket.emit('register', userId);
        console.log(`👤 Registered user: ${userId}`);
      }
    });

    // Listen for general notifications
    socket.on('notification', (notification: Notification) => {
      console.log('📱 Received notification:', notification);
      
      // Show Toast notification
      toast({
        title: notification.title,
        description: notification.message,
        variant: 'default',
      });

      // Emit custom event that components can listen to
      window.dispatchEvent(new CustomEvent('notification', { detail: notification }));
    });

    // Listen for specific appointment events
    socket.on('appointment-booked', (notification: Notification) => {
      console.log('📅 Appointment booked:', notification);
      toast({
        title: '📅 Appointment Booked',
        description: notification.message,
        variant: 'default',
      });
    });

    socket.on('appointment-confirmed', (notification: Notification) => {
      console.log('✅ Appointment confirmed:', notification);
      toast({
        title: '✅ Appointment Confirmed',
        description: notification.message,
        variant: 'default',
      });
    });

    socket.on('appointment-rejected', (notification: Notification) => {
      console.log('❌ Appointment rejected:', notification);
      toast({
        title: '❌ Appointment Rejected',
        description: notification.message,
        variant: 'destructive',
      });
    });

    socket.on('consultation-completed', (notification: Notification) => {
      console.log('🎥 Consultation completed:', notification);
      toast({
        title: '🎥 Consultation Completed',
        description: notification.message,
        variant: 'default',
      });
    });

    // Disconnect event
    socket.on('disconnect', () => {
      console.log('🔌 Disconnected from notification service');
    });

    // Error event
    socket.on('error', (error) => {
      console.error('❌ Socket.IO error:', error);
    });

    // Cleanup
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId, toast]);

  return socketRef.current;
};
```

### 3. Use the Hook in Your Components

**In Layout or App wrapper:**

```typescript
'use client';

import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth'; // Your auth hook
import { Toaster } from '@/components/ui/toaster';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = useAuth();
  
  // Initialize notification listener
  useNotifications(auth?.user?.id);

  return (
    <html lang="en">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
```

**In specific components:**

```typescript
'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function AppointmentBookingComponent() {
  const auth = useAuth();

  useEffect(() => {
    // Listen to custom notification events
    const handleNotification = (event: any) => {
      const notification = event.detail;
      
      if (notification.type === 'appointment.booked') {
        console.log('Appointment was booked!', notification.data);
        // Refresh appointments list
        // Update UI
      }
    };

    window.addEventListener('notification', handleNotification);

    return () => {
      window.removeEventListener('notification', handleNotification);
    };
  }, []);

  return (
    <div>
      {/* Your component content */}
    </div>
  );
}
```

### 4. Add Environment Variable

Create or update `.env.local`:

```env
NEXT_PUBLIC_NOTIFICATION_SERVICE_URL=http://localhost:50005
```

For production:

```env
NEXT_PUBLIC_NOTIFICATION_SERVICE_URL=https://notification-service.yourdomain.com
```

## Notification Types

### 1. appointment.booked

Sent when a new appointment is booked.

```typescript
{
  type: "appointment.booked",
  title: "Appointment Booked",
  message: "Your appointment with Dr. John Doe is confirmed for 2024-04-20 at 10:00 AM",
  data: {
    appointmentId: "apt-001",
    patientId: "pat-001",
    doctorId: "doc-001",
    patientName: "John Smith",
    doctorName: "Dr. John Doe",
    appointmentDate: "2024-04-20",
    appointmentTime: "10:00 AM",
    timestamp: "2024-04-17T10:30:00Z"
  }
}
```

### 2. appointment.confirmed

Sent when doctor confirms an appointment.

```typescript
{
  type: "appointment.confirmed",
  title: "Appointment Confirmed",
  message: "Your appointment with Dr. John Doe has been confirmed",
  data: {
    appointmentId: "apt-001",
    // ... same data fields
  }
}
```

### 3. appointment.rejected

Sent when doctor rejects an appointment.

```typescript
{
  type: "appointment.rejected",
  title: "Appointment Rejected",
  message: "Your appointment request has been declined. Please try scheduling another time.",
  data: {
    appointmentId: "apt-001",
    // ... same data fields
  }
}
```

### 4. consultation.completed

Sent when a video consultation is completed.

```typescript
{
  type: "consultation.completed",
  title: "Consultation Completed",
  message: "Your consultation with Dr. John Doe has been completed",
  data: {
    sessionId: "session-001",
    patientId: "pat-001",
    doctorId: "doc-001",
    patientName: "John Smith",
    doctorName: "Dr. John Doe",
    duration: 30,
    timestamp: "2024-04-17T10:30:00Z"
  }
}
```

## Advanced Features

### 1. Notification Center Component

```typescript
'use client';

import { useState, useEffect } from 'react';

export function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const handleNotification = (event: any) => {
      const notification = event.detail;
      
      // Add to notification list
      setNotifications((prev) => [
        { ...notification, id: Date.now() },
        ...prev,
      ]);

      // Auto-remove after 5 seconds
      setTimeout(() => {
        setNotifications((prev) => prev.slice(1));
      }, 5000);
    };

    window.addEventListener('notification', handleNotification);
    return () => window.removeEventListener('notification', handleNotification);
  }, []);

  return (
    <div className="fixed top-4 right-4 space-y-2 z-50">
      {notifications.map((notification: any) => (
        <div
          key={notification.id}
          className="bg-white p-4 rounded-lg shadow-lg animate-slide-in"
        >
          <h3 className="font-semibold">{notification.title}</h3>
          <p className="text-sm text-gray-600">{notification.message}</p>
        </div>
      ))}
    </div>
  );
}
```

### 2. Browser Notifications (Optional)

```typescript
// In useNotifications hook
socket.on('notification', async (notification: Notification) => {
  // Send browser notification if permission granted
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(notification.title, {
      body: notification.message,
      icon: '/healthsense-icon.png',
    });
  }
});

// Request permission on mount
useEffect(() => {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}, []);
```

## Connection Status

The Socket.IO service maintains connection status. You can check and display connection state:

```typescript
import { useEffect, useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';

export function ConnectionStatus() {
  const socket = useNotifications('user-123');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!socket) return;

    setIsConnected(socket.connected);

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [socket]);

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
      <span className="text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
    </div>
  );
}
```

## Troubleshooting

### Notifications Not Appearing

1. Check browser console for errors
2. Verify notification service is running: `http://localhost:50005`
3. Check that userId is being passed to `useNotifications`
4. Verify CORS settings in notification service

### Connection Issues

- Enable polling as fallback (included in hook by default)
- Check firewall/network settings
- Verify Socket.IO version compatibility

## Testing

Test real-time notifications by:

1. Opening the app in browser
2. Booking an appointment through the API
3. Watch the browser toast notification appear instantly
4. Check browser console for Socket.IO events

## Performance Optimization

- Use lazy initialization only on authenticated pages
- Disconnect socket on logout
- Implement reconnection logic (handled by Socket.IO by default)
- Batch multiple notifications if needed

---

**All done!** Your frontend will now receive real-time push notifications as soon as appointment events occur in the backend.
