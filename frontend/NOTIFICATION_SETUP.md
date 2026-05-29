# Frontend Notification System Implementation

This document explains how the frontend notification system works and how to integrate it into your components.

## 📁 Files Created

1. **`hooks/useNotifications.ts`** - React hook for notification management
2. **`lib/notificationService.ts`** - Utility functions for notification operations
3. **`components/NotificationCenter.tsx`** - Full notification management UI
4. **`components/AppointmentBookingExample.tsx`** - Example of integrating notifications
5. **`components/ui/Toast.tsx`** - Toast notification system
6. **`app/layout.tsx`** - Updated with ToastProvider

## 🏗️ Architecture

```
Frontend (Next.js/React)
    ↓
API Gateway (port 50000)
    ↓
Notification Service (port 50005)
    ↓
Email/SMS Delivery
```

## 🚀 Quick Start

### 1. Using the Toast Notification System

The toast system is already set up in your layout. Use it anywhere:

```typescript
import { useToast } from '@/components/ui/Toast';

export function MyComponent() {
  const toast = useToast();

  const handleAction = async () => {
    try {
      // Do something
      toast.success('Success!', 'Operation completed successfully');
    } catch (error) {
      toast.error('Error', 'Something went wrong');
    }
  };

  return <button onClick={handleAction}>Click me</button>;
}
```

### 2. Using the useNotifications Hook

```typescript
import { useNotifications } from '@/hooks/useNotifications';

export function MyNotificationComponent({ userId }: { userId: string }) {
  const {
    notifications,
    loading,
    fetchNotifications,
    sendNotification,
  } = useNotifications(userId);

  return (
    <div>
      <button onClick={() => fetchNotifications()}>Refresh</button>
      {notifications.map(notif => (
        <div key={notif.notificationId}>{notif.message}</div>
      ))}
    </div>
  );
}
```

### 3. Using Notification Service Functions

```typescript
import { sendAppointmentConfirmation } from '@/lib/notificationService';

async function bookAppointment() {
  // Book appointment...
  
  // Send notification
  await sendAppointmentConfirmation(userId, userEmail, {
    doctorName: 'Dr. Smith',
    appointmentDate: '2026-04-20',
    appointmentTime: '10:00',
    appointmentType: 'video',
  });
}
```

### 4. Full Notification Center UI

```typescript
import { NotificationCenter } from '@/components/NotificationCenter';

export function MyPage({ userId }: { userId: string }) {
  return <NotificationCenter userId={userId} />;
}
```

## 📖 API Integration Flow

### When User Books an Appointment:

1. **Frontend**: User submits appointment form
2. **API Call**: POST `/api/appointments/book` → API Gateway
3. **Backend**: Appointment Service processes request
4. **Notification**: Appointment Service calls Notification Service (50005)
5. **Email**: Notification Service sends email to patient
6. **Response**: Frontend receives success response
7. **Toast**: Show success toast to user

```typescript
const handleBookAppointment = async (formData) => {
  try {
    // POST to API Gateway
    const response = await axiosInstance.post('/api/appointments/book', formData);
    
    // Show success toast
    toast.success('Appointment Booked!', 'Check your email for confirmation');
    
    // Optional: Send additional notification
    await sendNotification({
      userId: userId,
      type: 'sms',
      recipient: phoneNumber,
      message: 'Your appointment is confirmed!',
      category: 'appointment'
    });
  } catch (error) {
    toast.error('Booking Failed', error.message);
  }
};
```

## 🔄 Two-Way Notification Flow

### **Implicit Notifications** (Automatic)
- User books appointment → System sends email automatically
- No frontend code needed for sending
- Backend handles notification delivery

### **Explicit Notifications** (On-Demand)
- Frontend fetches user's notification history
- Frontend can send notifications manually
- Used for notification center, reminders, etc.

## 📊 Hook API Reference

### useNotifications(userId)

**State:**
```typescript
{
  notifications: Notification[],      // User's notifications
  stats: NotificationStats,           // Overall stats
  preferences: UserPreferences,       // User preferences
  loading: boolean,                   // Loading state
  error: string | null,               // Error message
}
```

**Methods:**
```typescript
{
  fetchNotifications(limit?, offset?),           // Fetch notifications
  getNotification(notificationId),               // Get single notification
  sendNotification(payload),                     // Send notification
  sendBulkNotifications(payload),                // Send to multiple users
  fetchStats(),                                  // Get statistics
  updatePreferences(updates),                    // Update preferences
  fetchPreferences(),                            // Get preferences
  retryFailedNotifications(),                    // Retry failed ones
}
```

## 🛠️ Notification Service Functions

### Available Helper Functions:

```typescript
// Send single notification
sendNotification(payload)

// Send to multiple users
sendBulkNotifications(payload)

// Get user notifications
getUserNotifications(userId, limit, offset)

// Get single notification
getNotification(notificationId)

// Statistics
getNotificationStats()

// Preferences
updateNotificationPreferences(userId, preferences)
getNotificationPreferences(userId)

// Retry
retryFailedNotifications()

// Helper functions:
sendAppointmentConfirmation(userId, email, details)
sendAppointmentReminder(userId, email, phone, details)
sendPaymentConfirmation(userId, email, details)
sendPasswordReset(userId, email, resetLink)
sendPrescriptionNotification(userId, email, details)
```

## 💡 Common Use Cases

### 1. Show Notifications in Header

```typescript
import { useNotifications } from '@/hooks/useNotifications';

export function NotificationBell({ userId }: { userId: string }) {
  const { notifications, fetchNotifications } = useNotifications(userId);
  
  // Count unread notifications
  const unreadCount = notifications.filter(n => n.status === 'pending').length;

  return (
    <div className="relative">
      <button>🔔</button>
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
          {unreadCount}
        </span>
      )}
    </div>
  );
}
```

### 2. Show Recent Notifications

```typescript
export function RecentNotifications({ userId }: { userId: string }) {
  const { notifications } = useNotifications(userId);
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-bold mb-3">Recent Notifications</h3>
      {notifications.slice(0, 5).map(notif => (
        <div key={notif.notificationId} className="text-sm py-2 border-b">
          <p>{notif.message}</p>
          <span className="text-xs text-gray-500">
            {new Date(notif.createdAt).toLocaleDateString()}
          </span>
        </div>
      ))}
    </div>
  );
}
```

### 3. Notification Preferences Panel

```typescript
export function PreferencesPanel({ userId }: { userId: string }) {
  const { preferences, updatePreferences } = useNotifications(userId);

  return (
    <div className="space-y-4">
      <label className="flex items-center">
        <input
          type="checkbox"
          checked={preferences?.emailEnabled}
          onChange={(e) =>
            updatePreferences({ emailEnabled: e.target.checked })
          }
        />
        <span className="ml-2">Enable Email Notifications</span>
      </label>
      
      <label className="flex items-center">
        <input
          type="checkbox"
          checked={preferences?.appointmentNotifications}
          onChange={(e) =>
            updatePreferences({ appointmentNotifications: e.target.checked })
          }
        />
        <span className="ml-2">Appointment Alerts</span>
      </label>
    </div>
  );
}
```

## 📱 Toast Customization

### Show Different Types:

```typescript
const toast = useToast();

// Success
toast.success('Done!', 'Your action was successful');

// Error
toast.error('Oops!', 'Something went wrong');

// Info
toast.info('FYI', 'Here is some information');

// Warning
toast.warning('Caution!', 'Are you sure?');
```

## 🔐 Authentication

All API calls automatically include JWT token from localStorage:

```typescript
// From lib/axios.ts - already configured
const token = localStorage.getItem("token");
if (token) {
  config.headers.Authorization = `Bearer ${token}`;
}
```

## 🚨 Error Handling

All hooks and functions include error handling:

```typescript
const { notifications, error } = useNotifications(userId);

if (error) {
  toast.error('Error', error);
}
```

## 📈 Performance Tips

1. **Pagination**: Use `limit` and `offset` for large notification lists
2. **Debouncing**: Debounce refresh calls to avoid too many API requests
3. **Auto-refresh**: Set interval to 30 seconds (configurable)
4. **Error Recovery**: Failed notifications auto-retry

## 🐛 Debugging

Check browser console for:
- API response logs
- Error messages
- Network requests to `/api/notifications/*`

## 📞 API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/notifications/send` | POST | Send notification |
| `/api/notifications/send-bulk` | POST | Bulk send |
| `/api/notifications/user/{id}` | GET | Get user notifications |
| `/api/notifications/{id}` | GET | Get single notification |
| `/api/notifications/stats` | GET | Get statistics |
| `/api/notifications/preferences/{userId}` | GET/PUT | Preferences |
| `/api/notifications/retry-failed` | POST | Retry failed |

---

**Version**: 1.0  
**Created**: April 14, 2026  
**Framework**: Next.js 14+, React 18+, TypeScript
