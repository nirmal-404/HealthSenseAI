# Patient Dashboard Notification System - Implementation Guide

## Overview

The patient dashboard now has a fully functional notification system with:
- **Bell Icon** in the navigation bar that displays unread notification count
- **Dropdown Menu** showing the 5 most recent notifications
- **Full Notifications Page** at `/patient/notifications` for viewing all notifications with filtering
- **Auto-refresh** capability that updates notifications every 15-30 seconds
- **Real-time Unread Count** display on the bell icon

## Components Created

### 1. **NotificationBell Component**
**File:** `components/NotificationBell.tsx`

A dropdown component that displays:
- Bell icon with unread count badge
- 5 most recent notifications in a dropdown menu
- Auto-refresh while dropdown is open (every 15 seconds)
- Link to full notifications page

**Usage:**
```tsx
<NotificationBell userId={user?.userId} />
```

### 2. **Notifications Page**
**File:** `app/patient/notifications/page.tsx`

A full-page view that includes:
- Statistics: Total, Sent, Unread, Failed notifications
- Filters by Status (All, Sent, Pending, Failed, Queued)
- Filters by Category (Appointment, Payment, Reminder, Prescription, etc.)
- Refresh button to manually fetch latest notifications
- Detailed notification list with timestamps and status badges

## Features

### Unread Count Badge
- Shows number of notifications with status "pending" or "queued"
- Updates automatically as notifications arrive
- Displays "9+" for counts over 9

### Notification Status Colors
- **Sent** (Green) ✓ - Notification successfully delivered
- **Failed** (Red) ✗ - Notification failed to deliver
- **Pending** (Yellow) ⏳ - Currently processing
- **Queued** (Blue) 📋 - Waiting to be sent

### Notification Categories
- **Appointment** 📅 - Appointment confirmations and reminders
- **Payment** 💳 - Payment confirmations and invoices
- **Reminder** 🔔 - General reminders
- **Prescription** 💊 - Prescription updates
- **Verification** ✓ - Account verification notifications
- **Message** 💬 - Direct messages

### Auto-Refresh Behavior
- **In Navigation Dropdown:** Refreshes every 15 seconds when dropdown is open
- **Full Page:** Refreshes automatically via useNotifications hook (30 seconds)
- **Manual Refresh:** Users can click refresh button on full notifications page

## Integration Details

### Patient Layout Update
The bell icon in `app/patient/layout.tsx` has been replaced with the NotificationBell component:

```tsx
import { NotificationBell } from '@/components/NotificationBell';

// In the header section:
<NotificationBell userId={user?.userId} />
```

### API Endpoints Used

The notification system uses the following API endpoints:

```
GET /api/notifications/user/{userId}?limit={limit}&offset={offset}
  - Fetch user's notifications
  - Params: limit (default 50), offset (default 0)

GET /api/notifications/{notificationId}
  - Fetch a specific notification

GET /api/notifications/stats
  - Get notification statistics

PUT /api/notifications/preferences/{userId}
  - Update notification preferences

GET /api/notifications/preferences/{userId}
  - Get user notification preferences

POST /api/notifications/send
  - Send immediate notification

POST /api/notifications/send-bulk
  - Send bulk notifications

POST /api/notifications/retry-failed
  - Retry failed notifications
```

## Usage Examples

### Adding Notifications in Other Components

To send a notification to the user:

```tsx
import { useNotifications } from '@/hooks/useNotifications';

export function MyComponent() {
  const { sendNotification } = useNotifications(userId);

  const handleAction = async () => {
    try {
      await sendNotification({
        userId: user.id,
        type: 'email',
        recipient: user.email,
        subject: 'Appointment Confirmed',
        message: 'Your appointment with Dr. Smith has been confirmed for tomorrow at 10:00 AM',
        category: 'appointment',
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  };

  return <button onClick={handleAction}>Book Appointment</button>;
}
```

### Accessing Full Notification Center

Users can access the full notification page in two ways:
1. Click "View all notifications" link in the dropdown menu
2. Navigate directly to `/patient/notifications`

## Styling

The notification components use the existing HealthSenseAI color scheme:
- Primary Blue: `#3460e9`, `#3f69ec`
- Light Blue Background: `#f8fbff`, `#eaf1ff`
- Border Gray: `#dce5f2`, `#e6edf8`
- Text Dark: `#1f2a44`
- Text Secondary: `#slate-500`, `#slate-600`

## Environment Configuration

Ensure the following environment variables are set:

**.env.local (Frontend)**
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:50000/api
```

## Testing the Notification System

### Manual Testing Steps:

1. **Navigate to Patient Dashboard**
   - Go to `/patient/dashboard`
   - Look for the bell icon in the top navigation bar

2. **View Notification Dropdown**
   - Click the bell icon
   - Should see dropdown with recent notifications
   - Unread count badge should display if there are pending notifications

3. **View Full Notifications Page**
   - Click "View all notifications" in dropdown
   - Or navigate to `/patient/notifications`
   - Should see all notifications with filters

4. **Test Filters**
   - Try filtering by status (Sent, Pending, Failed, Queued)
   - Try filtering by category (Appointment, Payment, etc.)
   - Click Refresh to load latest notifications

### Troubleshooting

**Notifications not loading?**
1. Check browser console for errors
2. Verify API endpoint is running on port 50000
3. Check that user ID is being passed correctly
4. Ensure `NEXT_PUBLIC_API_BASE_URL` is configured

**Unread count not updating?**
1. Check that notification status is "pending" or "queued"
2. Verify notifications have a valid `notificationId`
3. Try manual refresh by clicking refresh button

**Dropdown not opening?**
1. Check for browser console errors
2. Verify DropdownMenu component is imported correctly
3. Check that NotificationBell component is mounted in layout

## Future Enhancements

Potential improvements for the notification system:

1. **WebSocket Integration** - Real-time notifications without polling
2. **Toast Notifications** - Show notifications as they arrive
3. **Notification Sounds** - Audio alert for new notifications
4. **Email/SMS Delivery** - Integration with notification service backend
5. **Notification Groups** - Group similar notifications together
6. **Mark as Read** - Track which notifications user has seen
7. **Push Notifications** - Browser push notification support
8. **Notification History Export** - Download notification history

## Support

For issues or questions about the notification system, refer to:
- [Notification Service Documentation](../backend/notification-service/README.md)
- [Frontend API Documentation](./lib/api.ts)
- [useNotifications Hook](./hooks/useNotifications.ts)
