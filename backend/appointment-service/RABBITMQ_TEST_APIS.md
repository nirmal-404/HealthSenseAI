# RabbitMQ Test APIs - Appointment Service

## Overview
This document describes the test APIs for RabbitMQ message publishing in the Appointment Service. These are producer endpoints that send events to RabbitMQ for the Notification Service to consume.

---

## Base URL
```
http://localhost:50003
```

---

## 1. RabbitMQ Producer Status Check

### Endpoint
```
GET /test/rabbitmq-status
```

### Description
Check if the RabbitMQ producer is connected and ready to publish events.

### Response (Success)
```json
{
  "success": true,
  "message": "RabbitMQ Producer Connected",
  "data": {
    "isConnected": true,
    "timestamp": "2024-04-15T10:30:45.123Z"
  }
}
```

### Response (Failed)
```json
{
  "success": true,
  "message": "RabbitMQ Producer Disconnected",
  "data": {
    "isConnected": false,
    "timestamp": "2024-04-15T10:30:45.123Z"
  }
}
```

---

## 2. Publish Appointment Booked Event

### Endpoint
```
POST /test/publish-appointment-booked
```

### Description
Publishes an `appointment.booked` event to RabbitMQ. This event is consumed by the Notification Service to send confirmation emails/SMS.

### Request Headers
```
Content-Type: application/json
```

### Request Body
```json
{
  "appointmentId": "64f1e9c2d5a8b3f2e1c9d4b5",
  "patientId": "64f1e9c2d5a8b3f2e1c9d4a0",
  "patientEmail": "patient@example.com",
  "patientName": "John Doe",
  "patientPhone": "+1234567890",
  "doctorId": "64f1e9c2d5a8b3f2e1c9d4c1",
  "doctorName": "Dr. Jane Smith",
  "doctorEmail": "doctor@example.com",
  "doctorPhone": "+0987654321",
  "appointmentDate": "2024-04-20",
  "appointmentTime": "14:30",
  "reason": "General Checkup",
  "status": "booked"
}
```

### Response (Success)
```json
{
  "success": true,
  "message": "Appointment booked event published successfully",
  "data": {
    "eventType": "appointment.booked",
    "timestamp": "2024-04-15T10:30:45.123Z",
    "appointmentData": {
      "appointmentId": "64f1e9c2d5a8b3f2e1c9d4b5",
      "patientId": "64f1e9c2d5a8b3f2e1c9d4a0",
      "patientEmail": "patient@example.com",
      "patientName": "John Doe",
      "doctorId": "64f1e9c2d5a8b3f2e1c9d4c1",
      "doctorName": "Dr. Jane Smith",
      "appointmentDate": "2024-04-20",
      "appointmentTime": "14:30",
      "reason": "General Checkup",
      "status": "booked"
    }
  }
}
```

### Response (Failed)
```json
{
  "success": false,
  "message": "Failed to publish event",
  "data": {
    "eventType": "appointment.booked",
    "timestamp": "2024-04-15T10:30:45.123Z",
    "appointmentData": { ... }
  }
}
```

---

## 3. Publish Appointment Cancelled Event

### Endpoint
```
POST /test/publish-appointment-cancelled
```

### Description
Publishes an `appointment.cancelled` event to RabbitMQ. This event notifies the patient and doctor of cancellation.

### Request Headers
```
Content-Type: application/json
```

### Request Body
```json
{
  "appointmentId": "64f1e9c2d5a8b3f2e1c9d4b5",
  "patientId": "64f1e9c2d5a8b3f2e1c9d4a0",
  "patientEmail": "patient@example.com",
  "patientName": "John Doe",
  "patientPhone": "+1234567890",
  "doctorId": "64f1e9c2d5a8b3f2e1c9d4c1",
  "doctorName": "Dr. Jane Smith",
  "doctorEmail": "doctor@example.com",
  "doctorPhone": "+0987654321",
  "appointmentDate": "2024-04-20",
  "appointmentTime": "14:30",
  "cancelReason": "Patient requested cancellation",
  "status": "cancelled",
  "cancelledAt": "2024-04-15T10:30:45.123Z"
}
```

### Response (Success)
```json
{
  "success": true,
  "message": "Appointment cancelled event published successfully",
  "data": {
    "eventType": "appointment.cancelled",
    "timestamp": "2024-04-15T10:30:45.123Z",
    "appointmentData": {
      "appointmentId": "64f1e9c2d5a8b3f2e1c9d4b5",
      "patientId": "64f1e9c2d5a8b3f2e1c9d4a0",
      "patientEmail": "patient@example.com",
      "patientName": "John Doe",
      "doctorId": "64f1e9c2d5a8b3f2e1c9d4c1",
      "doctorName": "Dr. Jane Smith",
      "appointmentDate": "2024-04-20",
      "appointmentTime": "14:30",
      "cancelReason": "Patient requested cancellation",
      "status": "cancelled",
      "cancelledAt": "2024-04-15T10:30:45.123Z"
    }
  }
}
```

---

## 4. Publish Appointment Rescheduled Event

### Endpoint
```
POST /test/publish-appointment-rescheduled
```

### Description
Publishes an `appointment.rescheduled` event to RabbitMQ. This event notifies both patient and doctor of the new appointment time.

### Request Headers
```
Content-Type: application/json
```

### Request Body
```json
{
  "appointmentId": "64f1e9c2d5a8b3f2e1c9d4b5",
  "patientId": "64f1e9c2d5a8b3f2e1c9d4a0",
  "patientEmail": "patient@example.com",
  "patientName": "John Doe",
  "patientPhone": "+1234567890",
  "doctorId": "64f1e9c2d5a8b3f2e1c9d4c1",
  "doctorName": "Dr. Jane Smith",
  "doctorEmail": "doctor@example.com",
  "doctorPhone": "+0987654321",
  "oldAppointmentDate": "2024-04-20",
  "oldAppointmentTime": "14:30",
  "newAppointmentDate": "2024-04-22",
  "newAppointmentTime": "10:00",
  "reason": "General Checkup",
  "rescheduleReason": "Doctor unavailable",
  "status": "rescheduled",
  "rescheduledAt": "2024-04-15T10:30:45.123Z"
}
```

### Response (Success)
```json
{
  "success": true,
  "message": "Appointment rescheduled event published successfully",
  "data": {
    "eventType": "appointment.rescheduled",
    "timestamp": "2024-04-15T10:30:45.123Z",
    "appointmentData": {
      "appointmentId": "64f1e9c2d5a8b3f2e1c9d4b5",
      "patientId": "64f1e9c2d5a8b3f2e1c9d4a0",
      "patientEmail": "patient@example.com",
      "patientName": "John Doe",
      "doctorId": "64f1e9c2d5a8b3f2e1c9d4c1",
      "doctorName": "Dr. Jane Smith",
      "oldAppointmentDate": "2024-04-20",
      "oldAppointmentTime": "14:30",
      "newAppointmentDate": "2024-04-22",
      "newAppointmentTime": "10:00",
      "reason": "General Checkup",
      "rescheduleReason": "Doctor unavailable",
      "status": "rescheduled",
      "rescheduledAt": "2024-04-15T10:30:45.123Z"
    }
  }
}
```

---

## Environment Variables

Add these to your `.env` file:

```env
# RabbitMQ Configuration
RABBITMQ_URL=amqp://localhost
APPOINTMENT_EXCHANGE=appointment_exchange
APPOINTMENT_ROUTING_KEY=appointment.booked
RABBITMQ_CONNECTION_MAX_RETRIES=5
RABBITMQ_CONNECTION_RETRY_DELAY=2000
```

---

## Testing with cURL

### 1. Check RabbitMQ Status
```bash
curl -X GET http://localhost:50003/test/rabbitmq-status
```

### 2. Publish Appointment Booked
```bash
curl -X POST http://localhost:50003/test/publish-appointment-booked \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentId": "64f1e9c2d5a8b3f2e1c9d4b5",
    "patientId": "64f1e9c2d5a8b3f2e1c9d4a0",
    "patientEmail": "patient@example.com",
    "patientName": "John Doe",
    "patientPhone": "+1234567890",
    "doctorId": "64f1e9c2d5a8b3f2e1c9d4c1",
    "doctorName": "Dr. Jane Smith",
    "doctorEmail": "doctor@example.com",
    "doctorPhone": "+0987654321",
    "appointmentDate": "2024-04-20",
    "appointmentTime": "14:30",
    "reason": "General Checkup",
    "status": "booked"
  }'
```

### 3. Publish Appointment Cancelled
```bash
curl -X POST http://localhost:50003/test/publish-appointment-cancelled \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentId": "64f1e9c2d5a8b3f2e1c9d4b5",
    "patientId": "64f1e9c2d5a8b3f2e1c9d4a0",
    "patientEmail": "patient@example.com",
    "patientName": "John Doe",
    "patientPhone": "+1234567890",
    "doctorId": "64f1e9c2d5a8b3f2e1c9d4c1",
    "doctorName": "Dr. Jane Smith",
    "doctorEmail": "doctor@example.com",
    "doctorPhone": "+0987654321",
    "appointmentDate": "2024-04-20",
    "appointmentTime": "14:30",
    "cancelReason": "Patient requested cancellation",
    "status": "cancelled",
    "cancelledAt": "2024-04-15T10:30:45.123Z"
  }'
```

### 4. Publish Appointment Rescheduled
```bash
curl -X POST http://localhost:50003/test/publish-appointment-rescheduled \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentId": "64f1e9c2d5a8b3f2e1c9d4b5",
    "patientId": "64f1e9c2d5a8b3f2e1c9d4a0",
    "patientEmail": "patient@example.com",
    "patientName": "John Doe",
    "patientPhone": "+1234567890",
    "doctorId": "64f1e9c2d5a8b3f2e1c9d4c1",
    "doctorName": "Dr. Jane Smith",
    "doctorEmail": "doctor@example.com",
    "doctorPhone": "+0987654321",
    "oldAppointmentDate": "2024-04-20",
    "oldAppointmentTime": "14:30",
    "newAppointmentDate": "2024-04-22",
    "newAppointmentTime": "10:00",
    "reason": "General Checkup",
    "rescheduleReason": "Doctor unavailable",
    "status": "rescheduled",
    "rescheduledAt": "2024-04-15T10:30:45.123Z"
  }'
```

---

## Message Flow

```
Appointment Service (Publisher)
         ↓
RabbitMQ Exchange: appointment_exchange (topic)
         ↓
         ├─ appointment.booked → Notification Service
         ├─ appointment.cancelled → Notification Service
         └─ appointment.rescheduled → Notification Service
         ↓
Notification Service (Consumer)
         ↓
Send Email/SMS to Patient & Doctor
```

---

## Architecture Notes

### RabbitMQ Producer Setup
- **Type**: Single instance pattern
- **Connection**: Automatic retry with exponential backoff
- **Message Persistence**: Enabled (durable: true)
- **Exchange Type**: Topic-based for flexible routing

### Event Structure
Each published event follows this structure:
```json
{
  "eventId": "appointment-1713176445123",
  "timestamp": "2024-04-15T10:30:45.123Z",
  "eventType": "appointment.booked|cancelled|rescheduled",
  "data": {
    // Appointment details
  }
}
```

---

## Error Handling

The producer includes error handling for:
- RabbitMQ connection failures
- Channel errors
- Publish failures
- Message serialization errors

All errors are logged with appropriate severity levels and the service continues to operate.

---

## Monitoring

Check logs for:
- `✓ Producer: Connected to RabbitMQ` - Successful connection
- `✓ Producer: Published` - Successful message publish
- `❌ Producer: Error` - Any publishing errors
- `⏳ Producer: Retrying` - Connection retry attempts

---

## Next Steps

1. Install dependencies: `npm install`
2. Ensure RabbitMQ is running on `localhost:5672`
3. Start the service: `npm run dev`
4. Test with curl or Postman using provided examples

---

## Related Services

- **Notification Service**: Consumes all appointment events
- **RabbitMQ**: Message broker (must be running)
- **MongoDB**: Stores appointment data
