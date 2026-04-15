# Notification Service - Quick Reference Guide

## What is the Notification Service?

The Notification Service is an event-driven microservice that automatically sends email and SMS notifications to patients and doctors when significant events occur in the HealthSenseAI platform.

## Quick Start

### 1. Install Dependencies
```bash
cd backend/notification-service
npm install
```

### 2. Configure Environment
Copy and update `.env` file with Gmail and Twilio credentials:
```bash
# Email (Gmail SMTP)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672
```

### 3. Start Services
```bash
# Terminal 1: Start RabbitMQ
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management

# Terminal 2: Start MongoDB
docker run -d --name mongo -p 27017:27017 mongo

# Terminal 3: Start Notification Service
npm run dev
```

### 4. Verify It's Running
```bash
curl http://localhost:5005/health
# Response: {"status": "UP", "code": 200, "service": "notification-service"}
```

## Events Handled

| Event | Source | Triggered When | Recipients |
|-------|--------|---|---|
| `appointment.booked` | Appointment Service | Patient books appointment | Patient + Doctor |
| `consultation.completed` | Telemedicine Service | Video session ends | Patient + Doctor |

## Event Flow

```
Appointment Service / Telemedicine Service
         ↓
    Publishes Event to RabbitMQ
         ↓
    Notification Service (Listens)
         ↓
    Event Handler Processes
         ↓
    Send Email (Gmail SMTP)
    + Send SMS (Twilio)
         ↓
    Patient & Doctor Receive Notifications
```

## Notifications Sent Per Event

### appointment.booked
- **To Patient:** Email confirmation + SMS confirmation
- **To Doctor:** Email alert + SMS alert

### consultation.completed
- **To Patient:** Email summary + SMS alert
- **To Doctor:** Email confirmation + SMS reminder

## File Structure

```
backend/notification-service/
├── src/
│   ├── index.ts                      # Main entry point with RabbitMQ setup
│   ├── service/
│   │   ├── RabbitMQService.ts        # RabbitMQ message broker connection
│   │   ├── EventHandlers.ts          # Event processing logic
│   │   ├── EmailService.ts           # Email sending (Gmail SMTP)
│   │   ├── SMSService.ts             # SMS sending (Twilio)
│   │   ├── NotificationService.ts    # Core notification logic
│   │   └── index.ts                  # Service exports
│   ├── config/
│   │   ├── envConfig.ts              # Configuration from .env
│   │   └── db.ts                     # MongoDB connection
│   ├── models/                       # Database schemas
│   ├── controller/                   # API controllers
│   ├── routes/                       # API routes
│   ├── middlewares/                  # Express middleware
│   ├── types/                        # TypeScript type definitions
│   └── validations/                  # Input validation
├── RABBITMQ_EVENTS.md               # Event documentation (payload schemas)
├── SETUP_DEPLOYMENT.md              # Installation & deployment guide
├── INTEGRATION_GUIDE.md             # How to publish events from other services
├── README.md                        # Service overview & API endpoints
├── package.json                     # Dependencies
└── .env                            # Environment configuration
```

## Key Files

| File | Purpose |
|------|---------|
| `src/index.ts` | Application entry point - connects to RabbitMQ and registers event handlers |
| `src/service/RabbitMQService.ts` | Manages RabbitMQ connection and message consumption |
| `src/service/EventHandlers.ts` | Logic for `appointment.booked` and `consultation.completed` events |
| `src/service/EmailService.ts` | Sends emails using Gmail SMTP |
| `src/service/SMSService.ts` | Sends SMS using Twilio API |
| `src/config/envConfig.ts` | Central configuration management |

## Critical Configuration

### RabbitMQ Configuration
```bash
# Connection
RABBITMQ_URL=amqp://guest:guest@localhost:5672

# Exchanges (auto-declared)
APPOINTMENT_EXCHANGE=appointments
CONSULTATION_EXCHANGE=consultations

# Queues (auto-declared)
APPOINTMENT_QUEUE=appointment_notifications
CONSULTATION_QUEUE=consultation_notifications

# Routing Keys
APPOINTMENT_ROUTING_KEY=appointment.booked
CONSULTATION_ROUTING_KEY=consultation.completed
```

### Email Configuration
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password    # Use app password, not Gmail password
EMAIL_FROM=HealthSense <noreply@healthsense.com>
```

### SMS Configuration
```bash
TWILIO_ACCOUNT_SID=AC...                 # 34 characters starting with "AC"
TWILIO_AUTH_TOKEN=...                    # 32 characters
TWILIO_PHONE_NUMBER=+1234567890          # Verified in Twilio console
```

## Common Tasks

### Publish appointment.booked Event

From Appointment Service:
```typescript
const payload = {
  appointmentId: "apt-001",
  patientId: "patient-001",
  doctorId: "doctor-001",
  appointmentDate: "2026-04-25",
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
```

### Publish consultation.completed Event

From Telemedicine Service:
```typescript
const payload = {
  sessionId: "session-001",
  patientId: "patient-001",
  doctorId: "doctor-001",
  consultationDate: "2026-04-25",
  consultationTime: "14:35",
  duration: 25,
  status: "completed",
  patientName: "Jane Doe",
  doctorName: "Dr. John Smith",
  patientEmail: "jane@example.com",
  patientPhone: "+94771234567",
  doctorEmail: "john@healthsense.com",
  doctorPhone: "+94771234560",
  notes: "Follow-up appointment next week"
};

channel.publish(
  "consultations",
  "consultation.completed",
  Buffer.from(JSON.stringify(payload))
);
```

### Send Manual Notification via API

```bash
curl -X POST http://localhost:5005/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "type": "email",
    "category": "appointment",
    "recipient": "user@example.com",
    "subject": "Appointment Confirmation",
    "message": "<html><body>Your appointment is confirmed</body></html>"
  }'
```

### Check User Notification Preferences

```bash
curl http://localhost:5005/preferences/user-123
```

### Update User Notification Preferences

```bash
curl -X PUT http://localhost:5005/preferences/user-123 \
  -H "Content-Type: application/json" \
  -d '{
    "emailEnabled": true,
    "smsEnabled": false,
    "appointmentNotifications": true
  }'
```

## Monitoring & Debugging

### View Service Logs
```bash
# Development
npm run dev

# Docker
docker logs -f notification-service

# Kubernetes
kubectl logs -f deployment/notification-service
```

### Monitor RabbitMQ
- Access UI: http://localhost:15672
- Username: guest
- Password: guest
- Check "Queues" tab for message count

### Check Email/SMS Status
Look for these patterns in logs:
```
✓ Email sent to jane@example.com
✓ SMS sent to +94771234567
✗ Email sending failed to john@example.com: Invalid credentials
```

### View Sent Notifications
```bash
curl http://localhost:5005/notifications/stats
```

## Error Scenarios & Solutions

### RabbitMQ Connection Failed
```
❌ Failed to connect to RabbitMQ: ECONNREFUSED
```
**Solution:** Start RabbitMQ or check `RABBITMQ_URL`

### Email Not Sending
```
✗ Email sending failed: Invalid credentials
```
**Solution:** Verify Gmail app password (not Gmail password) in `EMAIL_PASS`

### SMS Not Sending
```
✗ SMS sending error: Invalid phone number
```
**Solution:** Ensure phone number format is `+CountryCodeNumber` (e.g., `+94771234567`)

### Events Not Processed
```
⚠️ No handler registered for event: appointment.booked
```
**Solution:** Check event handler is registered in `index.ts`

## Performance Tips

1. **Batch Notifications:** Service sends 4 notifications in parallel (patient email, patient SMS, doctor email, doctor SMS)
2. **Message Requeue:** Failed messages are automatically requeued by RabbitMQ
3. **Connection Pooling:** Reuse single RabbitMQ connection and channel
4. **Auto-Acknowledgment:** Messages only acknowledged after successful processing

## Security Best Practices

1. **Never commit credentials** to Git - use `.env.local` and `.gitignore`
2. **Use app-specific passwords** for Gmail (not your actual password)
3. **Verify phone numbers** in Twilio console before sending SMS
4. **Validate all input** before processing
5. **Use HTTPS** for API endpoints in production
6. **Implement rate limiting** to prevent abuse

## Deployment Options

### Local Development
```bash
npm run dev
```

### Docker
```bash
docker build -t notification-service .
docker run -p 5005:5005 notification-service
```

### Docker Compose
```bash
docker-compose up -d notification-service
```

### Kubernetes
See [SETUP_DEPLOYMENT.md](./SETUP_DEPLOYMENT.md#kubernetes-deployment)

## Documentation

| Document | Purpose |
|----------|---------|
| [RABBITMQ_EVENTS.md](./RABBITMQ_EVENTS.md) | Event schemas, payloads, and examples |
| [SETUP_DEPLOYMENT.md](./SETUP_DEPLOYMENT.md) | Installation, Docker, Kubernetes setup |
| [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) | How other services publish events |
| [README.md](./README.md) | Service overview, API endpoints |

## Testing the Service

### 1. Local Integration Test
```bash
# Terminal 1: Start RabbitMQ
docker run -d --name test-rabbitmq -p 5672:5672 rabbitmq:3

# Terminal 2: Start Notification Service
npm run dev

# Terminal 3: Test by publishing event to RabbitMQ
# Use RabbitMQ Management UI (http://localhost:15672)
# Check logs for notification processing
```

### 2. API Test
```bash
# Send manual notification
curl -X POST http://localhost:5005/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test",
    "type": "email",
    "category": "verification",
    "recipient": "test@example.com",
    "subject": "Test",
    "message": "This is a test"
  }'
```

### 3. External Service Test
```bash
# From Appointment Service (after integrating)
POST /appointments/book
{
  "patientId": "pat-001",
  "doctorId": "doc-001",
  "appointmentDate": "2026-04-25",
  "appointmentTime": "14:30"
}

# Check Notification Service logs for:
# 📨 Received event: appointment.booked
# ✓ Patient email: sent
# ✓ Patient SMS: sent
# ✓ Doctor email: sent
# ✓ Doctor SMS: sent
```

## Support & Troubleshooting

For detailed troubleshooting steps, see:
- [SETUP_DEPLOYMENT.md - Troubleshooting](./SETUP_DEPLOYMENT.md#troubleshooting)
- [RABBITMQ_EVENTS.md - Error Handling](./RABBITMQ_EVENTS.md#error-handling)

## Next Steps

1. ✅ Install and run Notification Service
2. 📖 Read [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
3. 🔗 Integrate with Appointment Service
4. 🎥 Integrate with Telemedicine Service
5. ✨ Test end-to-end event flow
6. 🚀 Deploy to production

---

**Version:** 1.0.0  
**Last Updated:** 2026-04-14  
**Status:** Production Ready
