# RabbitMQ Integration Guide: Appointment Service ↔ Notification Service

## Overview

This guide explains how the **Appointment Service** (RabbitMQ Producer) connects with the **Notification Service** (RabbitMQ Consumer) through RabbitMQ for async event-driven communication.

---

## Architecture

```
┌──────────────────────────────┐
│   APPOINTMENT SERVICE        │
│   (RabbitMQ Producer)        │
└──────────────┬───────────────┘
               │
               │ Publishes Events
               ↓
       ┌───────────────────┐
       │   RABBITMQ BROKER │
       │                   │
       │ Exchange:         │
       │ "appointments"    │
       │ (topic type)      │
       └─────────┬─────────┘
               ↓
       ┌─────────────────────────────┐
       │ Routing Keys:               │
       │ ├─ appointment.booked       │
       │ ├─ appointment.cancelled    │
       │ └─ appointment.rescheduled  │
       └─────────────────────────────┘
               ↓
       ┌─────────────────────────────┐
       │ Queue:                      │
       │ "appointment_notifications" │
       └──────────┬──────────────────┘
               ↓
┌──────────────────────────────┐
│  NOTIFICATION SERVICE        │
│  (RabbitMQ Consumer)         │
│  - Sends Emails              │
│  - Sends SMS                 │
└──────────────────────────────┘
```

---

## Configuration

### Appointment Service (.env)

```env
# RabbitMQ Connection
RABBITMQ_URL=amqp://guest:guest@localhost:5672

# Exchange & Routing Configuration
APPOINTMENT_EXCHANGE=appointments
APPOINTMENT_QUEUE=appointment_notifications
APPOINTMENT_ROUTING_KEY=appointment.booked

# Connection Settings
RABBITMQ_CONNECTION_MAX_RETRIES=5
RABBITMQ_CONNECTION_RETRY_DELAY=2000
```

### Notification Service (.env)

```env
# RabbitMQ Connection
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672

# Appointment Events Exchange & Queue
APPOINTMENT_EXCHANGE=appointments
APPOINTMENT_QUEUE=appointment_notifications
APPOINTMENT_ROUTING_KEY=appointment.booked

# Consultation Events Exchange & Queue (for future use)
CONSULTATION_EXCHANGE=consultations
CONSULTATION_QUEUE=consultation_notifications
CONSULTATION_ROUTING_KEY=consultation.completed
```

---

## Event Payload Structure

### Appointment Booked Event

**Topic:** `appointment.booked`  
**Exchange:** `appointments`  
**Queue:** `appointment_notifications`

```json
{
  "eventId": "appointment-1713176445123",
  "timestamp": "2024-04-15T10:30:45.123Z",
  "eventType": "appointment.booked",
  "data": {
    "appointmentId": "64f1e9c2d5a8b3f2e1c9d4b5",
    "patientId": "64f1e9c2d5a8b3f2e1c9d4a0",
    "doctorId": "64f1e9c2d5a8b3f2e1c9d4c1",
    "appointmentDate": "2024-04-20",
    "appointmentTime": "14:30",
    "doctorName": "Dr. Jane Smith",
    "patientName": "John Doe",
    "patientEmail": "john@example.com",
    "patientPhone": "+1234567890",
    "doctorEmail": "jane@healthcenter.com",
    "doctorPhone": "+0987654321",
    "status": "booked"
  }
}
```

### Appointment Cancelled Event

**Topic:** `appointment.cancelled`

```json
{
  "eventId": "appointment-1713176445124",
  "timestamp": "2024-04-15T10:30:45.123Z",
  "eventType": "appointment.cancelled",
  "data": {
    "appointmentId": "64f1e9c2d5a8b3f2e1c9d4b5",
    "patientId": "64f1e9c2d5a8b3f2e1c9d4a0",
    "doctorId": "64f1e9c2d5a8b3f2e1c9d4c1",
    "appointmentDate": "2024-04-20",
    "appointmentTime": "14:30",
    "doctorName": "Dr. Jane Smith",
    "patientName": "John Doe",
    "patientEmail": "john@example.com",
    "patientPhone": "+1234567890",
    "doctorEmail": "jane@healthcenter.com",
    "doctorPhone": "+0987654321",
    "cancelReason": "Patient requested cancellation",
    "status": "cancelled"
  }
}
```

### Appointment Rescheduled Event

**Topic:** `appointment.rescheduled`

```json
{
  "eventId": "appointment-1713176445125",
  "timestamp": "2024-04-15T10:30:45.123Z",
  "eventType": "appointment.rescheduled",
  "data": {
    "appointmentId": "64f1e9c2d5a8b3f2e1c9d4b5",
    "patientId": "64f1e9c2d5a8b3f2e1c9d4a0",
    "doctorId": "64f1e9c2d5a8b3f2e1c9d4c1",
    "oldAppointmentDate": "2024-04-20",
    "oldAppointmentTime": "14:30",
    "newAppointmentDate": "2024-04-22",
    "newAppointmentTime": "10:00",
    "doctorName": "Dr. Jane Smith",
    "patientName": "John Doe",
    "patientEmail": "john@example.com",
    "patientPhone": "+1234567890",
    "doctorEmail": "jane@healthcenter.com",
    "doctorPhone": "+0987654321",
    "rescheduleReason": "Doctor unavailable",
    "status": "rescheduled"
  }
}
```

---

## Data Flow

### Step 1: Appointment Booking Flow

```
User/API → Appointment Service
                ↓
        Create Appointment in DB
                ↓
        Call RabbitMQProducer.publishAppointmentBooked()
                ↓
        Send to RabbitMQ Exchange "appointments"
        with Routing Key "appointment.booked"
                ↓
        Message queued in "appointment_notifications"
                ↓
        Notification Service Consumer picks up message
                ↓
        handleAppointmentBooked() -> Sends Email + SMS
                ↓
        Message Acknowledged
```

### Step 2: Notification Service Processing

```
RabbitMQ Consumer
        ↓
    Parse Message
        ↓
    Verify Required Fields
        ↓
    Call Event Handler
        ↓
    sendAppointmentConfirmation() (Patient Email)
    sendAppointmentConfirmationSMS() (Patient SMS)
    sendEmail() (Doctor Email)
    sendSMS() (Doctor SMS)
        ↓
    Log Results
        ↓
    Acknowledge Message
```

---

## Testing the Connection

### 1. Check RabbitMQ Status

```bash
curl http://localhost:50003/test/rabbitmq-status
```

### 2. Publish Test Event

```bash
curl -X POST http://localhost:50003/test/publish-appointment-booked \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentId": "test-001",
    "patientId": "patient-001",
    "doctorId": "doctor-001",
    "appointmentDate": "2024-04-20",
    "appointmentTime": "14:30",
    "doctorName": "Dr. Jane Smith",
    "patientName": "John Doe",
    "patientEmail": "john@example.com",
    "patientPhone": "+1234567890",
    "doctorEmail": "jane@example.com",
    "doctorPhone": "+0987654321",
    "status": "booked"
  }'
```

### 3. Monitor RabbitMQ Management UI

Access RabbitMQ Management Dashboard:
```
http://localhost:15672/
Username: guest
Password: guest
```

Look for:
- Exchange: `appointments` (type: topic)
- Queue: `appointment_notifications`
- Messages flowing through the queue

---

## Docker Compose Setup

### Complete Stack

```yaml
version: '3.8'

services:
  rabbitmq:
    image: rabbitmq:3.12-management-alpine
    ports:
      - "5672:5672"      # AMQP Port
      - "15672:15672"    # Management UI
    environment:
      RABBITMQ_DEFAULT_USER: guest
      RABBITMQ_DEFAULT_PASS: guest
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq

  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  appointment-service:
    build:
      context: ./backend/appointment-service
      dockerfile: Dockerfile
    ports:
      - "50003:50003"
    environment:
      NODE_ENV: development
      PORT: 50003
      MONGO_URI: mongodb://mongodb:27017/healthsenseai_appointment
      RABBITMQ_URL: amqp://guest:guest@rabbitmq:5672
      APPOINTMENT_EXCHANGE: appointments
      APPOINTMENT_QUEUE: appointment_notifications
      APPOINTMENT_ROUTING_KEY: appointment.booked
    depends_on:
      - rabbitmq
      - mongodb

  notification-service:
    build:
      context: ./backend/notification-service
      dockerfile: Dockerfile
    ports:
      - "5005:5005"
    environment:
      NODE_ENV: development
      PORT: 5005
      MONGO_URI: mongodb://mongodb:27017/notification-service
      RABBITMQ_URL: amqp://guest:guest@rabbitmq:5672
      APPOINTMENT_EXCHANGE: appointments
      APPOINTMENT_QUEUE: appointment_notifications
      APPOINTMENT_ROUTING_KEY: appointment.booked
      EMAIL_USER: ${EMAIL_USER}
      EMAIL_PASSWORD: ${EMAIL_PASSWORD}
    depends_on:
      - rabbitmq
      - mongodb

volumes:
  rabbitmq_data:
  mongodb_data:
```

### Start Services

```bash
docker-compose up -d

# View logs
docker-compose logs -f appointment-service
docker-compose logs -f notification-service
docker-compose logs -f rabbitmq
```

---

## Event Handler Implementation

### Appointment Service Producer

**File:** `src/utils/RabbitMQProducer.ts`

```typescript
// Publishing appointment booked event
const success = await RabbitMQProducer.publishAppointmentBooked({
  appointmentId: appointment._id,
  patientId: appointment.patientId,
  doctorId: appointment.doctorId,
  appointmentDate: appointment.appointmentDate,
  appointmentTime: appointment.appointmentTime,
  doctorName: doctor.name,
  patientName: patient.name,
  patientEmail: patient.email,
  patientPhone: patient.phone,
  doctorEmail: doctor.email,
  doctorPhone: doctor.phone,
  status: "booked"
});

if (success) {
  console.log("✅ Notification event published");
} else {
  console.error("❌ Failed to publish notification event");
}
```

### Notification Service Consumer

**File:** `src/service/EventHandlers.ts`

```typescript
export const handleAppointmentBooked = async (
  payload: AppointmentNotificationPayload
): Promise<void> => {
  console.log(
    `📋 Processing appointment.booked event for appointment ${payload.appointmentId}`
  );

  try {
    // Send patient email
    const patientEmailResult = await EmailService.sendAppointmentConfirmation(
      payload.patientEmail,
      appointmentData
    );

    // Send patient SMS
    const patientSMSResult = await SMSService.sendAppointmentConfirmationSMS(
      payload.patientPhone,
      appointmentData
    );

    // Send doctor email and SMS
    // ...

    console.log("✅ Appointment booking notifications completed");
  } catch (error: any) {
    console.error(
      `❌ Error handling appointment.booked event: ${error?.message}`
    );
    throw error;
  }
};
```

---

## Troubleshooting

### Issue: Messages not reaching Notification Service

**Check:**
1. RabbitMQ is running: `docker ps | grep rabbitmq`
2. Exchange exists: RabbitMQ Dashboard → Exchanges
3. Queue exists: RabbitMQ Dashboard → Queues
4. Binding is correct: Queue should bind to exchange with correct routing key
5. Both services use same RABBITMQ_URL

**Fix:**
```bash
# Restart both services
docker-compose restart appointment-service notification-service

# Monitor logs
docker-compose logs -f
```

### Issue: Connection Refused

**Check:**
- RabbitMQ Docker container is running
- Port 5672 is not blocked
- RABBITMQ_URL format is correct: `amqp://[user]:[password]@[host]:[port]`

**Common Formats:**
```
Local: amqp://guest:guest@localhost:5672
Docker: amqp://guest:guest@rabbitmq:5672
Cloud: amqp://username:password@host:port
```

### Issue: Email/SMS not sent from Notification Service

**Check:**
- Email credentials are correct (Gmail requires app password)
- SMS SMSAPI.lk API key is set (SMSAPI_API_KEY)
- Notification Service has internet access
- Check Notification Service logs for errors

---

## Performance Considerations

1. **Message Persistence:** Enabled (durable: true)
   - Messages survive broker restarts

2. **Acknowledgment Strategy:** Manual ACK
   - Messages only deleted after successful processing
   - Failed messages are requeued with exponential backoff

3. **Concurrent Consumers:** Single instance per queue
   - Can scale by running multiple consumer instances

4. **Retry Policy:**
   - Connection retries: up to 5 attempts with exponential backoff
   - Message delivery: automatic requeue on failure

---

## Future Enhancements

1. **Dead Letter Queue (DLQ):** For failed messages
2. **Message TTL:** Expire messages after certain time
3. **Consumer Scaling:** Multiple notification service instances
4. **Event Archival:** Store all events for audit trail
5. **Analytics:** Track delivery success rates
6. **Webhook Fallback:** Fallback to HTTP if RabbitMQ fails

---

## Related Documentation

- [RabbitMQ Official Docs](https://www.rabbitmq.com/documentation.html)
- [Appointment Service API](./RABBITMQ_TEST_APIS.md)
- [Notification Service README](../notification-service/README.md)

---

## Support

For issues or questions:
1. Check logs: `docker-compose logs [service-name]`
2. Verify RabbitMQ Dashboard for queue status
3. Check .env file for correct configuration
4. Ensure RabbitMQ is accessible and running
