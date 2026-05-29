# Frontend Socket.IO Real-Time Notifications Integration Guide

## Overview

This guide covers the complete frontend implementation of real-time push notifications using Socket.IO in the HealthSense application.

## Files Created

### 1. **hooks/useSocketNotifications.ts**
Custom React hook that manages Socket.IO connection and notification handling.

**Key Features:**
- Auto-connect on mount when userId is available
- Reconnection logic with exponential backoff
- Event subscription/unsubscription system
- Custom event dispatch for component integration
- Debug logging capability

**Usage Example:**
```typescript
const { isConnected, subscribe, unsubscribe } = useSocketNotifications(userId, {
  enabled: true,
  autoReconnect: true,
  debug: false
});
```

### 2. **components/providers/SocketIOProvider.tsx**
React Context provider for global Socket.IO access.

**Features:**
- Wraps entire application
- Provides useSocketIO hook for any component
- Auto-initializes with authenticated user ID
- Global notification state management

### 3. **components/RealtimeNotificationBell.tsx**
Pre-built notification UI component.

**Features:**
- Fixed notification bell in top-right
- Notification toast display
- Unread count badge
- Notification panel with history
- Auto-dismiss after 10 seconds
- Clear all notifications button

### 4. **.env.local**
Environment configuration for development.

```env
NEXT_PUBLIC_NOTIFICATION_SERVICE_URL=http://localhost:50005
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:50000/api
NEXT_PUBLIC_SOCKET_IO_DEBUG=false
```

### 5. **components/NotificationExamples.tsx**
Example components showing integration patterns.

## Setup Instructions

### Step 1: Socket.IO Package Already Installed

```bash
# Package was installed automatically
npm list socket.io-client
```

### Step 2: Update Root Layout (✅ Already Done)

The layout has been updated with:
```typescript
import { SocketIOProvider } from "@/components/providers/SocketIOProvider";
import { RealtimeNotificationBell } from "@/components/RealtimeNotificationBell";

// In JSX:
<AuthProvider>
  <SocketIOProvider enabled={true} debug={false}>
    <ThemeProvider>
      {children}
      <RealtimeNotificationBell />
      // ... other components
    </ThemeProvider>
  </SocketIOProvider>
</AuthProvider>
```

### Step 3: Environment Variables (✅ Already Done)

Configuration is set in `.env.local`:
```env
NEXT_PUBLIC_NOTIFICATION_SERVICE_URL=http://localhost:50005
```

For production:
```env
NEXT_PUBLIC_NOTIFICATION_SERVICE_URL=https://notification-service.yourdomain.com
```

## Integration Patterns

### Pattern 1: Listen to Notifications in Components

```typescript
'use client';

import { useSocketIO } from '@/components/providers/SocketIOProvider';
import { useEffect } from 'react';

export function MyComponent() {
  const socketIO = useSocketIO();

  useEffect(() => {
    // Subscribe to appointment booked notifications
    const unsubscribe = socketIO.subscribe('appointment-booked', (notification) => {
      console.log('New appointment:', notification.data);
      // Refresh appointments list
      // Update UI
      // Navigate
    });

    return unsubscribe; // Cleanup
  }, [socketIO]);

  return (
    <div>
      <p>Connection Status: {socketIO.isConnected ? 'Connected ✅' : 'Connecting...'}</p>
    </div>
  );
}
```

### Pattern 2: Custom Event Listener

```typescript
useEffect(() => {
  const handleSocketNotification = (event: any) => {
    const notification = event.detail;
    console.log('Notification:', notification);

    // Custom logic based on notification type
    if (notification.type === 'appointment.confirmed') {
      // Handle appointment confirmed
      refreshAppointmentList();
    }
  };

  window.addEventListener('socket-notification', handleSocketNotification);
  
  return () => {
    window.removeEventListener('socket-notification', handleSocketNotification);
  };
}, []);
```

### Pattern 3: Multiple Event Subscriptions

```typescript
useEffect(() => {
  // Subscribe to multiple events
  const unsubscribeBooked = socketIO.subscribe('appointment-booked', handleBooked);
  const unsubscribeConfirmed = socketIO.subscribe('appointment-confirmed', handleConfirmed);
  const unsubscribeRejected = socketIO.subscribe('appointment-rejected', handleRejected);

  return () => {
    // Cleanup all subscriptions
    unsubscribeBooked();
    unsubscribeConfirmed();
    unsubscribeRejected();
  };
}, [socketIO]);
```

## Notification Events

### 1. appointment-booked
```typescript
{
  type: "appointment.booked",
  title: "Appointment Booked",
  message: "Your appointment with Dr. John Doe is confirmed...",
  data: {
    appointmentId: "apt-123",
    patientId: "pat-123",
    doctorId: "doc-123",
    doctorName: "Dr. John Doe",
    appointmentDate: "2024-04-20",
    appointmentTime: "10:00"
  }
}
```

### 2. appointment-confirmed
```typescript
{
  type: "appointment.confirmed",
  title: "Appointment Confirmed",
  message: "Your appointment with Dr. John Doe has been confirmed",
  data: { /* same structure */ }
}
```

### 3. appointment-rejected
```typescript
{
  type: "appointment.rejected",
  title: "Appointment Rejected",
  message: "Your appointment request has been declined",
  data: { /* same structure */ }
}
```

### 4. consultation-completed
```typescript
{
  type: "consultation.completed",
  title: "Consultation Completed",
  message: "Your consultation with Dr. Jane Smith has been completed",
  data: {
    sessionId: "session-123",
    duration: 30,
    // ... other data
  }
}
```

## Component Examples

### Display Connection Status

```typescript
import { useSocketIO } from '@/components/providers/SocketIOProvider';

export function ConnectionIndicator() {
  const { isConnected } = useSocketIO();

  return (
    <div className="flex items-center gap-2 p-2">
      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
      <span>{isConnected ? 'Connected' : 'Offline'}</span>
    </div>
  );
}
```

### Refresh Appointments on Notification

```typescript
'use client';

import { useSocketIO } from '@/components/providers/SocketIOProvider';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query'; // if using React Query

export function AppointmentListWithRefresh() {
  const socketIO = useSocketIO();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Refresh on any appointment change
    const unsubscribe = socketIO.subscribe('notification', (notification) => {
      if (notification.type.includes('appointment')) {
        // Invalidate and refetch appointments
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
      }
    });

    return unsubscribe;
  }, [socketIO, queryClient]);

  return (
    <div>
      {/* Appointment list component */}
    </div>
  );
}
```

### Show Toast on Specific Event

```typescript
'use client';

import { useSocketIO } from '@/components/providers/SocketIOProvider';
import { toast } from 'sonner';
import { useEffect } from 'react';

export function AppointmentStatusWatcher() {
  const socketIO = useSocketIO();

  useEffect(() => {
    const unsubscribe = socketIO.subscribe('appointment-confirmed', (notification) => {
      toast.success(notification.title, {
        description: notification.message,
        action: {
          label: 'View',
          onClick: () => {
            // Navigate to appointment details
            window.location.href = `/appointments/${notification.data.appointmentId}`;
          },
        },
      });
    });

    return unsubscribe;
  }, [socketIO]);

  return null;
}
```

## Advanced Usage

### Custom Hook for Appointments

```typescript
// hooks/useAppointmentNotifications.ts
'use client';

import { useSocketIO } from '@/components/providers/SocketIOProvider';
import { useEffect } from 'react';

export const useAppointmentNotifications = (callback?: (event: any) => void) => {
  const socketIO = useSocketIO();

  useEffect(() => {
    const unsubscribeBooked = socketIO.subscribe('appointment-booked', (notification) => {
      console.log('Appointment booked', notification);
      callback?.(notification);
    });

    const unsubscribeConfirmed = socketIO.subscribe('appointment-confirmed', (notification) => {
      console.log('Appointment confirmed', notification);
      callback?.(notification);
    });

    const unsubscribeRejected = socketIO.subscribe('appointment-rejected', (notification) => {
      console.log('Appointment rejected', notification);
      callback?.(notification);
    });

    return () => {
      unsubscribeBooked();
      unsubscribeConfirmed();
      unsubscribeRejected();
    };
  }, [socketIO, callback]);
};
```

Usage:
```typescript
export function AppointmentPage() {
  useAppointmentNotifications((notification) => {
    // Handle appointment change
    refreshAppointments();
  });

  return <div>{/* Page content */}</div>;
}
```

## Testing

### 1. Verify Connection

Open browser DevTools → Console:
```typescript
// Check if Socket.IO connection shows messages
```

Look for logs:
- `[SocketIO] Connecting to...`
- `✅ Connected to notification service`
- `👤 Registered user: user-123`

### 2. Test with API Call

Book an appointment:
```bash
POST http://localhost:50000/api/appointments/book
{
  "patientId": "patient-123",
  "doctorId": "doctor-456",
  "appointmentDate": "2024-04-20",
  "startTime": "10:00",
  "endTime": "10:30",
  "appointmentType": "video"
}
```

### 3. Watch for Notifications

- Toast notification appears instantly
- Bell icon shows unread count
- Notification panel displays event details

## Troubleshooting

### Notifications Not Appearing

**Check 1: Is Socket.IO connected?**
```typescript
const socketIO = useSocketIO();
console.log(socketIO.isConnected); // Should be true
```

**Check 2: Is backend service running?**
```bash
curl http://localhost:50005/health
# Should return notification service health status
```

**Check 3: Check browser console**
- Look for Socket.IO connection errors
- Verify CORS configuration
- Check for 403/CORS errors

### Connection Failures

**Issue: Cannot connect to notification service**
```
Solution:
1. Verify NEXT_PUBLIC_NOTIFICATION_SERVICE_URL is correct
2. Check notification service is running
3. Verify firewall allows WebSocket connections
4. Check CORS headers from backend
```

**Issue: Reconnection loops**
```
Solution:
1. Check notification service is accessible at URL
2. Verify authentication (userId) is available
3. Check reconnection attempt logs
4. Reduce reconnection attempts if needed
```

## Performance Optimization

### 1. Conditional Connection

```typescript
// Only connect if on appointment-related pages
const shouldConnect = pathname.includes('appointment');
useSocketNotifications(userId, { enabled: shouldConnect });
```

### 2. Unsubscribe When Not Needed

```typescript
useEffect(() => {
  if (!isVisible) return; // Don't listen if component not visible

  const unsubscribe = socketIO.subscribe('appointment-booked', handler);
  return unsubscribe;
}, [isVisible, socketIO]);
```

### 3. Batch Notifications

```typescript
// Instead of updating on every notification, batch updates
const [pendingUpdates, setPendingUpdates] = useState(0);

useEffect(() => {
  const timer = setInterval(() => {
    if (pendingUpdates > 0) {
      refreshData();
      setPendingUpdates(0);
    }
  }, 5000); // Batch every 5 seconds

  return () => clearInterval(timer);
}, [pendingUpdates]);
```

## Production Deployment

### 1. Update Environment Variables

```env
NEXT_PUBLIC_NOTIFICATION_SERVICE_URL=https://notification-service.yourdomain.com
NEXT_PUBLIC_SOCKET_IO_DEBUG=false
```

### 2. Security Considerations

- Use HTTPS/WSS (secure WebSocket)
- Validate user authentication before connecting
- Implement rate limiting for events
- Validate notification data from backend

### 3. CORS Configuration

Ensure backend allows frontend origin:
```typescript
// Backend notification service
cors: {
  origin: 'https://yourdomain.com',
  methods: ['GET', 'POST'],
  credentials: true
}
```

## Next Steps

1. ✅ Socket.IO hook created
2. ✅ Provider component created  
3. ✅ Notification UI component created
4. ✅ Environment variables configured
5. ✅ Layout updated
6. 📋 **Test with backend notification service running**
7. 📋 **Integrate into specific pages (appointments, consultations)**
8. 📋 **Add notification preferences UI**

## Quick Start Checklist

- [ ] Backend notification service running (`npm start`)
- [ ] Frontend development server running (`npm run dev`)
- [ ] Verify `.env.local` has correct notification service URL
- [ ] Check browser console for Socket.IO connection logs
- [ ] Test by booking an appointment
- [ ] Verify toast notification appears

## Support

For issues or questions:
1. Check troubleshooting section
2. Review Socket.IO logs in browser console
3. Verify backend service is running
4. Check network tab for WebSocket connection
5. Review backend logs for event publishing
