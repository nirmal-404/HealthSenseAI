# Notification Service - Event Documentation

## Overview

The Notification Service is a microservice that handles all email and SMS notifications for the HealthSenseAI platform. It consumes events from RabbitMQ published by other microservices and sends appropriate notifications to patients and doctors.

## Architecture

```
┌─────────────────────────────┐
│   Appointment Service       │
└──────────────┬──────────────┘
               │ Publishes: appointment.booked
               │
               ▼
┌─────────────────────────────┐
│     RabbitMQ Broker         │
│  (amqp://guest:guest@...)   │
└──────────────┬──────────────┘
               │
               ├─ Exchange: appointments (topic)
               │   └─ Queue: appointment_notifications
               │
               └─ Exchange: consultations (topic)
                   └─ Queue: consultation_notifications
                       │
                       ▼
            ┌──────────────────────┐
            │ Notification Service │
            └──────────────────────┘
                   │           │
      ┌────────────┘           └────────────┐
      │                                     │
      ▼                                     ▼
┌─────────────────┐           ┌─────────────────────┐
│ Email Service   │           │  SMS Service        │
│ (Gmail SMTP)    │           │ (Twilio API)        │
└─────────────────┘           └─────────────────────┘
      │                                     │
      └──────────────┬──────────────────────┘
                     │
                     ▼
        ┌──────────────────────────┐
        │ Patient & Doctor         │
        │ (Email & SMS)            │
        └──────────────────────────┘
```

## Supported Events

### 1. appointment.booked

**Exchange:** `appointments` (topic)  
**Queue:** `appointment_notifications`  
**Routing Key:** `appointment.booked`

#### Event Payload

```json
{
  "appointmentId": "string",
  "patientId": "string",
  "doctorId": "string",
  "appointmentDate": "string (YYYY-MM-DD)",
  "appointmentTime": "string (HH:MM)",
  "doctorName": "string",
  "patientName": "string",
  "patientEmail": "string",
  "patientPhone": "string (+1234567890 format)",
  "doctorEmail": "string",
  "doctorPhone": "string (+1234567890 format)",
  "status": "booked"
}
```

#### Notifications Sent

| Recipient | Channel | Content |
|-----------|---------|---------|
| Patient | Email | Appointment confirmation with date, time, and doctor details |
| Patient | SMS | Brief appointment confirmation reminder |
| Doctor | Email | New appointment notification with patient details |
| Doctor | SMS | Alert of new appointment booking |

#### Example Usage

**Publishing from Appointment Service:**

```typescript
// In appointment-service
const appointmentBooked = {
  appointmentId: "apt-12345",
  patientId: "patient-001",
  doctorId: "doctor-001",
  appointmentDate: "2026-04-20",
  appointmentTime: "14:30",
  doctorName: "Dr. John Smith",
  patientName: "Jane Doe",
  patientEmail: "jane@example.com",
  patientPhone: "+94771234567",
  doctorEmail: "john@healthsense.com",
  doctorPhone: "+94771234560",
  status: "booked"
};

channel.publish(
  "appointments",
  "appointment.booked",
  Buffer.from(JSON.stringify(appointmentBooked))
);
```

---

### 2. consultation.completed

**Exchange:** `consultations` (topic)  
**Queue:** `consultation_notifications`  
**Routing Key:** `consultation.completed`

#### Event Payload

```json
{
  "sessionId": "string",
  "patientId": "string",
  "doctorId": "string",
  "consultationDate": "string (YYYY-MM-DD)",
  "consultationTime": "string (HH:MM)",
  "duration": "number (in minutes)",
  "status": "completed|cancelled",
  "patientName": "string",
  "doctorName": "string",
  "patientEmail": "string",
  "patientPhone": "string (+1234567890 format)",
  "doctorEmail": "string",
  "doctorPhone": "string (+1234567890 format)",
  "notes": "string (optional)"
}
```

#### Notifications Sent

| Recipient | Channel | Content |
|-----------|---------|---------|
| Patient | Email | Consultation completion confirmation with duration and next steps |
| Patient | SMS | Alert that consultation is complete and records uploaded |
| Doctor | Email | Session completion confirmation and reminders |
| Doctor | SMS | Alert to upload prescription/documents if needed |

#### Example Usage

**Publishing from Telemedicine Service:**

```typescript
// In telemedicine-service
const consultationCompleted = {
  sessionId: "session-67890",
  patientId: "patient-001",
  doctorId: "doctor-001",
  consultationDate: "2026-04-20",
  consultationTime: "14:35",
  duration: 25,
  status: "completed",
  patientName: "Jane Doe",
  doctorName: "Dr. John Smith",
  patientEmail: "jane@example.com",
  patientPhone: "+94771234567",
  doctorEmail: "john@healthsense.com",
  doctorPhone: "+94771234560",
  notes: "Follow up appointment scheduled for next week"
};

channel.publish(
  "consultations",
  "consultation.completed",
  Buffer.from(JSON.stringify(consultationCompleted))
);
```

---

## Service Configuration

### Environment Variables

```env
# RabbitMQ Configuration
RABBITMQ_URL=amqp://guest:guest@localhost:5672
RABBITMQ_CONNECTION_RETRY_DELAY=5000
RABBITMQ_CONNECTION_MAX_RETRIES=10

# RabbitMQ Queue & Exchange Configuration
APPOINTMENT_EXCHANGE=appointments
APPOINTMENT_QUEUE=appointment_notifications
APPOINTMENT_ROUTING_KEY=appointment.booked

CONSULTATION_EXCHANGE=consultations
CONSULTATION_QUEUE=consultation_notifications
CONSULTATION_ROUTING_KEY=consultation.completed

# Email Configuration (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
EMAIL_FROM=HealthSense <noreply@healthsense.com>

# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+your-twilio-number
```

### RabbitMQ Setup

The service automatically declares:
- **Exchanges:** 2 topic exchanges (`appointments`, `consultations`)
- **Queues:** 2 durable queues with bindings to specific routing keys
- **Connection:** Auto-reconnection with exponential backoff (max 10 retries)

### Email Configuration (Gmail)

1. Enable "Less secure app access" or use Gmail App Passwords
2. Generate an app-specific password at https://myaccount.google.com/apppasswords
3. Use the app password in `EMAIL_PASS` environment variable

### SMS Configuration (Twilio)

1. Get credentials from Twilio dashboard
2. Set `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN`
3. Configure a verified phone number for `TWILIO_PHONE_NUMBER`

---

## API Endpoints

### Health Check

```
GET /health

Response:
{
  "status": "UP",
  "code": 200,
  "service": "notification-service"
}
```

### Send Notification (Manual)

```
POST /notifications/send

Request Body:
{
  "userId": "user-123",
  "type": "email|sms",
  "category": "appointment|payment|reminder|prescription|verification",
  "recipient": "email@example.com or +1234567890",
  "subject": "Optional subject for email",
  "message": "Notification message"
}

Response:
{
  "success": true,
  "notificationId": "notif-uuid",
  "messageId": "twilio-or-email-message-id"
}
```

### Get Notification Status

```
GET /notifications/:notificationId

Response:
{
  "notificationId": "notif-uuid",
  "userId": "user-123",
  "type": "email",
  "category": "appointment",
  "status": "sent|failed|queued",
  "sentAt": "2026-04-20T14:35:00Z",
  "createdAt": "2026-04-20T14:30:00Z"
}
```

### Get User Notification Preferences

```
GET /preferences/:userId

Response:
{
  "userId": "user-123",
  "emailEnabled": true,
  "smsEnabled": true,
  "appointmentNotifications": true,
  "paymentNotifications": true,
  "reminderNotifications": true,
  "prescriptionNotifications": true
}
```

### Update User Notification Preferences

```
PUT /preferences/:userId

Request Body:
{
  "emailEnabled": true,
  "smsEnabled": false,
  "appointmentNotifications": true,
  "paymentNotifications": true
}

Response:
{
  "success": true,
  "userId": "user-123",
  "updated": true
}
```

---

## Error Handling

### Automatic Retry Logic

- Failed messages are **nack'd** (negative acknowledged) to RabbitMQ
- Messages are automatically **requeued** for retry
- Exponential backoff for RabbitMQ connection failures

### Logging

All events are logged with the following information:

```
📨 Received event: appointment.booked | MessageID: msg-12345
👤 Sending patient notifications...
✓ Patient email: sent
✓ Patient SMS: sent
👨‍⚕️ Sending doctor notifications...
✓ Doctor email: sent
✓ Doctor SMS: sent
✅ Appointment booking notifications completed: 4/4 sent
```

### Error Examples

**Missing RabbitMQ Connection:**
```
❌ Failed to connect to RabbitMQ: ECONNREFUSED
⏳ Retrying RabbitMQ connection in 5000ms (Attempt 1/10)
```

**Email Service Failure:**
```
✗ Email sending failed to jane@example.com: Invalid credentials
❌ Error handling appointment.booked event: Invalid credentials
```

---

## Integration Guide

### Step 1: Publish Event from Source Service

In the Appointment Service or Telemedicine Service:

```typescript
import amqp from "amqplib";

// Connect to RabbitMQ
const connection = await amqp.connect("amqp://guest:guest@localhost:5672");
const channel = await connection.createChannel();

// Declare exchange
await channel.assertExchange("appointments", "topic", { durable: true });

// Publish event
const payload = {
  appointmentId: "apt-12345",
  patientId: "patient-001",
  doctorId: "doctor-001",
  appointmentDate: "2026-04-20",
  appointmentTime: "14:30",
  doctorName: "Dr. John Smith",
  patientName: "Jane Doe",
  patientEmail: "jane@example.com",
  patientPhone: "+94771234567",
  doctorEmail: "john@healthsense.com",
  doctorPhone: "+94771234560",
  status: "booked"
};

channel.publish(
  "appointments",
  "appointment.booked",
  Buffer.from(JSON.stringify(payload))
);

console.log("✓ Event published: appointment.booked");
```

### Step 2: Verify Notification Service is Running

```bash
# Start the notification service
npm run dev

# Check logs
# 🔗 Connecting to RabbitMQ: amqp://guest:guest@localhost:5672
# ✅ Connected to RabbitMQ
# 📋 Registering event handlers...
# ✓ Registered event handler for: appointment.booked
# ✓ Registered event handler for: consultation.completed
```

### Step 3: Monitor Event Processing

The service logs all events it receives and processes:

```
📨 Received event: appointment.booked | MessageID: msg-12345
👤 Sending patient notifications...
✓ Patient email: sent
✓ Patient SMS: sent
👨‍⚕️ Sending doctor notifications...
✓ Doctor email: sent
✓ Doctor SMS: sent
✅ Appointment booking notifications completed: 4/4 sent
   Appointment ID: apt-12345
```

---

## Troubleshooting

### Issue: RabbitMQ Connection Failed

**Solution:**
1. Ensure RabbitMQ is running: `docker-compose up rabbitmq`
2. Check RABBITMQ_URL in .env
3. Verify RabbitMQ credentials (default: guest/guest)

### Issue: Email Not Sending

**Solution:**
1. Verify Gmail app password is correct
2. Enable "Less secure app access" on Gmail account
3. Check EMAIL_USER and EMAIL_PASS in .env
4. Verify recipient email format

### Issue: SMS Not Sending

**Solution:**
1. Verify Twilio credentials are correct
2. Ensure TWILIO_PHONE_NUMBER is verified in Twilio console
3. Check recipient phone number format (+1234567890)
4. Verify account has sufficient credits

### Issue: Messages Being Requeued Continuously

**Solution:**
1. Check logs for specific error message
2. Verify event payload format matches expected schema
3. Check if email/SMS service is responding
4. Review network connectivity to external services

---

## Performance Considerations

- **Concurrent Message Processing:** All messages are processed asynchronously
- **Message Acknowledgment:** Messages are only ack'd after successful notification delivery
- **Retry Logic:** Failed messages are automatically requeued
- **Connection Pooling:** Single connection/channel instance per service
- **Batch Operations:** Notifications are sent in parallel (patient email, patient SMS, doctor email, doctor SMS)

---

## Security Considerations

1. **Credentials:** All credentials (email password, Twilio token) are stored in environment variables
2. **TLS/SSL:** Email connection uses SSL/TLS encryption (port 465)
3. **Message Format:** All RabbitMQ messages are JSON and properly validated
4. **MongoDB:** Notifications are logged with appropriate access controls

---

## Future Enhancements

- [ ] Push notification support
- [ ] Notification scheduling/delays
- [ ] Template management UI
- [ ] SMS delivery reports
- [ ] Email bounce handling
- [ ] Multi-language support
- [ ] Notification analytics dashboard
- [ ] Webhook notifications
