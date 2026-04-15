# Notification Service

## Overview

The Notification Service is a microservice that handles all notification delivery for the HealthSenseAI platform. It operates in two modes:

1. **Event-Driven Mode** (Primary): Consumes events from RabbitMQ published by other microservices (Appointment Service, Telemedicine Service)
2. **Direct API Mode** (Secondary): Accepts manual notification requests via REST endpoints

### Key Features

- **Email Notifications**: Send personalized emails via Gmail SMTP using Nodemailer
- **SMS Notifications**: Send SMS messages via Twilio API
- **Event-Driven Architecture**: Automatically trigger notifications on appointment and consultation events
- **Retry Logic**: Auto-retry failed notifications with exponential backoff
- **User Preferences**: Respect user notification preferences
- **Message Queuing**: Uses RabbitMQ for reliable event processing
- **Template Management**: Customizable email/SMS templates
- **Status Tracking**: Track all notification delivery attempts

## Responsibilities

### Core Functions

1. **Event Processing**: Listen to appointment and consultation events from RabbitMQ
2. **Notification Dispatch**: Send email and SMS notifications to patients and doctors
3. **Email Management**: Handle email sending using Nodemailer with Gmail SMTP
4. **SMS Management**: Handle SMS sending using Twilio
5. **Preference Management**: Store and respect user notification preferences
6. **Retry Logic**: Automatically retry failed notifications
7. **Status Tracking**: Track notification delivery status
8. **Error Handling**: Graceful error handling with meaningful logging

## Supported Events

The Notification Service listens for two main events:

### 1. appointment.booked
**Published by:** Appointment Service  
**When:** A patient successfully books an appointment  
**Notifications Sent:**
- Email to patient (appointment confirmation)
- SMS to patient (appointment confirmation)
- Email to doctor (new appointment alert)
- SMS to doctor (new appointment alert)

### 2. consultation.completed
**Published by:** Telemedicine Service  
**When:** A video consultation session ends  
**Notifications Sent:**
- Email to patient (consultation completion summary)
- SMS to patient (consultation completion alert)
- Email to doctor (session completion confirmation)
- SMS to doctor (reminder to upload documents)

For detailed event payloads and integration examples, see [RABBITMQ_EVENTS.md](./RABBITMQ_EVENTS.md)

## Data Models

### Notification

```typescript
{
  notificationId: string (UUID)
  userId: string (FK)
  type: "email" | "sms" | "push"
  category: "appointment" | "payment" | "reminder" | "prescription" | "verification"
  recipient: string (email or phone)
  subject?: string
  message: string
  status: "pending" | "sent" | "failed" | "queued"
  retryCount: number
  maxRetries: number
  error?: string
  sentAt?: Date
  createdAt: Date
  updatedAt: Date
}
```

### NotificationTemplate

```typescript
{
  templateId: string (UUID)
  templateName: string
  type: "email" | "sms"
  subject?: string
  bodyTemplate: string
  variables: string[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
```

### NotificationPreference

```typescript
{
  preferenceId: string (UUID)
  userId: string (FK)
  emailEnabled: boolean
  smsEnabled: boolean
  appointmentNotifications: boolean
  paymentNotifications: boolean
  reminderNotifications: boolean
  prescriptionNotifications: boolean
  verificationNotifications: boolean
  createdAt: Date
  updatedAt: Date
}
```

## API Endpoints

### Notification Endpoints

- **POST** `/notifications/send` - Send a single notification
- **POST** `/notifications/send-bulk` - Send bulk notifications
- **GET** `/notifications/:notificationId` - Get notification by ID
- **GET** `/notifications/user/:userId` - Get user notifications
- **POST** `/notifications/retry-failed` - Retry failed notifications
- **GET** `/notifications/stats` - Get notification statistics
- **GET** `/health` - Health check

### Template Endpoints

- **POST** `/templates` - Create notification template
- **GET** `/templates` - Get all templates
- **GET** `/templates/:templateName` - Get template by name

### Preference Endpoints

- **PUT** `/preferences/:userId` - Update user notification preferences
- **GET** `/preferences/:userId` - Get user notification preferences

## Technologies Used

- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Email Service**: Nodemailer
- **SMS Service**: Twilio
- **Validation**: Joi
- **Authentication**: JWT
- **HTTP Client**: Axios

## Environment Configuration

```env
PORT=5005
MONGODB_URI=mongodb://mongo:27017/notification-service
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890
```

## Installation & Setup

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run development server
npm run dev

# Run production server
npm start
```

## Service Integration

The Notification Service communicates with other microservices:

- **User Service**: Fetch user contact information
- **Appointment Service**: Fetch appointment details
- **Doctor Service**: Fetch doctor information
- **Patient Service**: Fetch patient information

## Security

- JWT token verification for authenticated endpoints
- Internal service key validation for inter-service communication
- Timeout handling for external service calls
- Rate limiting support (configurable via Redis)

## Features

- **Template Support**: Predefined templates with variable substitution
- **Retry Mechanism**: Automatic retry for failed notifications
- **Preference Management**: User-controlled notification settings
- **Bulk Operations**: Send notifications to multiple users
- **Status Tracking**: Track delivery status of each notification
- **Error Handling**: Comprehensive error logging and recovery
- **Async Processing**: Queue-based notification processing

## Workflows

### Appointment Confirmation Workflow

1. Appointment Service creates appointment
2. Sends notification request to Notification Service
3. Service fetches user preferences
4. Sends email/SMS based on preferences
5. Updates notification status
6. Returns notification ID to Appointment Service

### Payment Confirmation Workflow

1. Payment Service processes payment
2. Sends notification request to Notification Service
3. Service creates notification record
4. Sends email/SMS confirmation
5. Updates status in database
6. Triggers retry if failed

### Retry Workflow

1. Scheduled job or manual trigger
2. Query failed notifications with retry count < max
3. Attempt to resend
4. Update status based on result
5. Increment retry count if failed
6. Log results

## Future Enhancements

- Push notification support
- WhatsApp integration
- Email scheduling
- Notification analytics dashboard
- Advanced retry strategies
- Message queue integration (RabbitMQ/Kafka)

API Endpoints:

POST /api/notifications/send
POST /api/notifications/send-bulk
GET /api/notifications/user/{userId}
PUT /api/notifications/preferences/{userId}
GET /api/notifications/{notificationId}/status