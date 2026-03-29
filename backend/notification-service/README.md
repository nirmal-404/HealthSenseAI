Notification Service
Responsibilities: Send notifications via email and SMS.
Models:

Notification

notificationId (UUID)
userId (FK)
type (email, sms, push)
category (appointment, payment, reminder, etc.)
recipient
subject
message
status (pending, sent, failed)
sentAt
createdAt


NotificationTemplate

templateId (UUID)
templateName
type (email/sms)
subject
bodyTemplate
variables (array)


NotificationPreference

preferenceId (UUID)
userId (FK)
emailEnabled (boolean)
smsEnabled (boolean)
categories (array)



Functionalities:

Send appointment confirmation notifications
Send appointment reminders (24h before)
Send payment confirmations
Send prescription notifications
Send doctor verification updates
Queue notifications for batch processing
Retry failed notifications
Track delivery status
Support templated messages

API Endpoints:

POST /api/notifications/send
POST /api/notifications/send-bulk
GET /api/notifications/user/{userId}
PUT /api/notifications/preferences/{userId}
GET /api/notifications/{notificationId}/status