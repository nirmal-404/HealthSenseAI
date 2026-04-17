# Socket.IO Real-Time Push Notifications - Implementation Complete ✅

## What Was Added

### Backend (Notification Service)

#### 1. **SocketIOService** (`src/service/SocketIOService.ts`)
- Manages WebSocket connections using Socket.IO
- Handles user registration and authentication
- Broadcasts real-time notifications to connected clients
- Methods implemented:
  - `initialize(httpServer)` - Initialize Socket.IO server
  - `notifyAppointmentBooked()` - Send push notification when appointment is booked
  - `notifyAppointmentConfirmed()` - Send push notification when appointment is confirmed
  - `notifyAppointmentRejected()` - Send push notification when appointment is rejected
  - `notifyConsultationCompleted()` - Send push notification when consultation ends
  - `notifyUser()` - Send notification to specific user
  - `broadcastNotification()` - Send to all connected clients

#### 2. **EventHandlers Integration** (`src/service/EventHandlers.ts`)
- Updated all event handlers to trigger Socket.IO notifications
  - `handleAppointmentBooked()` → calls `SocketIOService.notifyAppointmentBooked()`
  - `handleAppointmentConfirmed()` → calls `SocketIOService.notifyAppointmentConfirmed()`
  - `handleAppointmentRejected()` → calls `SocketIOService.notifyAppointmentRejected()`
  - `handleConsultationCompleted()` → calls `SocketIOService.notifyConsultationCompleted()`

#### 3. **HTTP Server Setup** (`src/index.ts`)
- Changed from `app.listen()` to HTTP server with Socket.IO
- Initializes Socket.IO server on startup
- Updated server startup logs to show Socket.IO status

#### 4. **Type Definitions** (`src/types/index.ts`)
- Added `notes?` property to `AppointmentNotificationPayload`
- Added `'rejected'` status to appointment status union type

### Dependencies Added
- ✅ `socket.io` package (17 packages added)

## How It Works

### Flow Diagram
```
Appointment Event (RabbitMQ)
        ↓
RabbitMQService consumes message
        ↓
EventHandlers processes event
        ↓
Email & SMS sent to users
        ↓
SocketIOService sends real-time notification
        ↓
Connected clients receive notification instantly
        ↓
Frontend toast/notification displays
```

## Frontend Integration

### Setup Instructions

1. **Install Socket.IO client:**
```bash
cd frontend
npm install socket.io-client
```

2. **Create Hook** (`hooks/useNotifications.ts`):
```typescript
import { useEffect, useCallback, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import { useToast } from '@/hooks/use-toast';

export const useNotifications = (userId?: string) => {
  const socketRef = useRef<Socket | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) return;

    const socket = io(
      process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_URL || 'http://localhost:50005',
      {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        transports: ['websocket', 'polling'],
      }
    );

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Connected to notification service');
      socket.emit('register', userId);
    });

    socket.on('notification', (notification) => {
      console.log('📱 Notification:', notification);
      toast({
        title: notification.title,
        description: notification.message,
      });
      
      // Emit custom event
      window.dispatchEvent(new CustomEvent('notification', { detail: notification }));
    });

    socket.on('appointment-booked', (notification) => {
      toast({
        title: '📅 Appointment Booked',
        description: notification.message,
      });
    });

    socket.on('appointment-confirmed', (notification) => {
      toast({
        title: '✅ Appointment Confirmed',
        description: notification.message,
      });
    });

    socket.on('appointment-rejected', (notification) => {
      toast({
        title: '❌ Appointment Rejected',
        description: notification.message,
        variant: 'destructive',
      });
    });

    socket.on('disconnect', () => {
      console.log('🔌 Disconnected');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId, toast]);

  return socketRef.current;
};
```

3. **Add Environment Variable** (`.env.local`):
```env
NEXT_PUBLIC_NOTIFICATION_SERVICE_URL=http://localhost:50005
```

4. **Use in Layout** (`app/layout.tsx`):
```typescript
'use client';

import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';
import { Toaster } from '@/components/ui/toaster';

export default function RootLayout({ children }) {
  const auth = useAuth();
  useNotifications(auth?.user?.id);

  return (
    <html>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
```

5. **Listen to Events in Components:**
```typescript
useEffect(() => {
  const handleNotification = (event: any) => {
    const { type, data } = event.detail;
    
    if (type === 'appointment.booked') {
      console.log('Appointment booked:', data);
      // Refresh appointments
    }
  };

  window.addEventListener('notification', handleNotification);
  return () => window.removeEventListener('notification', handleNotification);
}, []);
```

## Testing

### Step-by-Step Testing

1. **Start Notification Service:**
```bash
cd backend/notification-service
npm start
```

2. **Start Frontend:**
```bash
cd frontend
npm run dev
```

3. **Open Browser:**
```
http://localhost:3000
```

4. **Book an Appointment:**
- Use API or UI to book an appointment
- Example API call:
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

5. **Watch for Notifications:**
- Toast notification appears instantly in browser
- Check browser console for Socket events
- Verify both email and push notification are sent

## Notification Events

### appointment.booked
```json
{
  "type": "appointment.booked",
  "title": "Appointment Booked",
  "message": "Your appointment with Dr. John Doe is confirmed...",
  "data": {
    "appointmentId": "apt-123",
    "patientId": "pat-123",
    "doctorId": "doc-123",
    "doctorName": "Dr. John Doe",
    "appointmentDate": "2024-04-20",
    "appointmentTime": "10:00"
  }
}
```

### appointment.confirmed
```json
{
  "type": "appointment.confirmed",
  "title": "Appointment Confirmed",
  "message": "Your appointment has been confirmed by the doctor"
}
```

### appointment.rejected
```json
{
  "type": "appointment.rejected",
  "title": "Appointment Rejected",
  "message": "Your appointment request has been declined"
}
```

### consultation.completed
```json
{
  "type": "consultation.completed",
  "title": "Consultation Completed",
  "message": "Your consultation with Dr. John Doe has been completed"
}
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Frontend (React/Next.js)                    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ useNotifications Hook                            │   │
│  │   ├─ Connects to Socket.IO server               │   │
│  │   ├─ Registers user ID                          │   │
│  │   ├─ Listens for notifications                  │   │
│  │   └─ Shows toast/notifications               │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                      ↕ WebSocket
┌─────────────────────────────────────────────────────────┐
│          Notification Service (Node.js/Express)         │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Socket.IO Server                                 │   │
│  │   ├─ Connection management                       │   │
│  │   ├─ User registration (userId → socketId)      │   │
│  │   ├─ Broadcast to specific users                │   │
│  │   └─ Emit notification events                   │   │
│  └──────────────────────────────────────────────────┘   │
│                      ↑                                    │
│  ┌──────────────────────────────────────────────────┐   │
│  │ RabbitMQ Service (Event Consumer)                │   │
│  │   └─ Consumes: appointment.*, consultation.*     │   │
│  └──────────────────────────────────────────────────┘   │
│                      ↑                                    │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Event Handlers                                   │   │
│  │   ├─ handleAppointmentBooked                    │   │
│  │   ├─ handleAppointmentConfirmed                 │   │
│  │   ├─ handleAppointmentRejected                  │   │
│  │   └─ handleConsultationCompleted                │   │
│  └──────────────────────────────────────────────────┘   │
│         (Send Email, SMS, + Socket.IO Push)             │
└─────────────────────────────────────────────────────────┘
                      ↑
┌─────────────────────────────────────────────────────────┐
│         Appointment Service (RabbitMQ Producer)          │
│         Publishes events when appointments change       │
└─────────────────────────────────────────────────────────┘
```

## Features

✅ **Real-time Delivery** - Notifications delivered instantly  
✅ **User-specific** - Notifications sent only to relevant users  
✅ **WebSocket + Polling** - Works even without WebSocket support  
✅ **Reconnection Logic** - Automatically reconnects if connection drops  
✅ **Multiple Transports** - WebSocket or HTTP long-polling fallback  
✅ **Multi-channel** - Email, SMS, and push notifications together  
✅ **Event Tracking** - Custom events for component binding  

## Performance Considerations

- **Lazy initialization** only on authenticated pages
- **Automatic cleanup** when component unmounts
- **Reconnection limits** to prevent resource exhaustion  
- **Batch notifications** for high-traffic scenarios
- **Memory efficient** - Socket connections are managed efficiently

## Next Steps

1. ✅ Built Socket.IO service
2. ✅ Integrated with event handlers
3. ✅ Added backend startup initialization
4. 📋 **TODO:** Install socket.io-client in frontend
5. 📋 **TODO:** Create useNotifications hook
6. 📋 **TODO:** Add to layout/wrapper component
7. 📋 **TODO:** Test end-to-end

## Troubleshooting

**Notifications not appearing:**
- Check console for errors
- Verify notification service is running
- Confirm userId is passed to useNotifications
- Check CORS settings

**Connection issues:**
- HTTP polling fallback enables browser compatibility
- Check firewall/network settings
- Verify Socket.IO port is accessible

**Performance issues:**
- Reduce reconnection attempts if needed
- Implement event throttling for high-frequency updates
- Use broadcast only when necessary

---

📖 **Read full integration guide:** `SOCKET_IO_INTEGRATION.md`
