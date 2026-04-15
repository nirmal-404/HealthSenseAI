# Quick Start: Appointment ↔ Notification Integration

## Prerequisites

- Node.js 16+
- Docker & Docker Compose
- MongoDB
- RabbitMQ

## Setup Steps

### 1. Start RabbitMQ

```bash
docker run -d --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  -e RABBITMQ_DEFAULT_USER=guest \
  -e RABBITMQ_DEFAULT_PASS=guest \
  rabbitmq:3.12-management-alpine
```

Or use Docker Compose:
```bash
docker-compose up -d rabbitmq
```

### 2. Setup Appointment Service

```bash
cd backend/appointment-service
npm install
```

Create/update `.env`:
```env
PORT=50003
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/healthsenseai_appointment
RABBITMQ_URL=amqp://guest:guest@localhost:5672
APPOINTMENT_EXCHANGE=appointments
APPOINTMENT_QUEUE=appointment_notifications
APPOINTMENT_ROUTING_KEY=appointment.booked
```

Start the service:
```bash
npm run dev
```

### 3. Setup Notification Service

```bash
cd backend/notification-service
npm install
```

Create/update `.env`:
```env
PORT=5005
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/notification-service
RABBITMQ_URL=amqp://guest:guest@localhost:5672
APPOINTMENT_EXCHANGE=appointments
APPOINTMENT_QUEUE=appointment_notifications
APPOINTMENT_ROUTING_KEY=appointment.booked
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

Start the service:
```bash
npm run dev
```

## Testing the Integration

### 1. Check RabbitMQ Status

```bash
curl http://localhost:50003/test/rabbitmq-status
```

Expected response:
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

### 3. Monitor RabbitMQ

Access RabbitMQ Management UI:
```
http://localhost:15672/
Username: guest
Password: guest
```

Verify:
- Exchange `appointments` exists (type: topic)
- Queue `appointment_notifications` exists
- Queue has messages
- Consumers are connected

### 4. Check Notification Service Logs

Watch for messages like:
```
📋 Processing appointment.booked event for appointment test-001
👤 Sending patient notifications...
✓ Patient email: sent
✓ Patient SMS: sent
👨‍⚕️ Sending doctor notifications...
✓ Doctor email: sent
✓ Doctor SMS: sent
✅ Appointment booking notifications completed: 4/4 sent
```

## Message Flow Verification

### Step 1: Send Request
```
POST /test/publish-appointment-booked
├─ Validate payload
├─ Publish to RabbitMQ
└─ Return response
```

### Step 2: Message in RabbitMQ
```
Exchange: appointments (topic)
├─ Routing Key: appointment.booked
├─ Queue: appointment_notifications
├─ Message: {eventId, timestamp, eventType, data}
└─ Status: Unacked
```

### Step 3: Notification Service Processes
```
Consumer picks message
├─ Parse JSON
├─ Extract data
├─ Call handleAppointmentBooked()
├─ Send emails/SMS
├─ Acknowledge message
└─ Status: Acked
```

## Common Issues

### Issue: "RabbitMQ Producer Disconnected"

**Cause:** RabbitMQ not running or wrong URL

**Fix:**
```bash
# Check if RabbitMQ is running
docker ps | grep rabbitmq

# If not running, start it
docker start rabbitmq

# Verify URL format
echo $RABBITMQ_URL
```

### Issue: "Missing required fields"

**Cause:** Incomplete payload

**Fix:** Include all required fields:
```json
{
  "appointmentId": "required",
  "patientId": "required",
  "doctorId": "required",
  "appointmentDate": "required",
  "appointmentTime": "required",
  "doctorName": "required",
  "patientName": "required",
  "patientEmail": "required",
  "patientPhone": "required",
  "doctorEmail": "required",
  "doctorPhone": "required"
}
```

### Issue: Email/SMS not sent

**Cause:** SMTP/Twilio credentials not configured

**Fix:** 
1. Check .env in notification-service:
   ```bash
   cat .env | grep EMAIL
   cat .env | grep TWILIO
   ```

2. For Gmail, use App Password:
   - Go to Google Account settings
   - Create app-specific password
   - Use in EMAIL_PASSWORD

3. Restart notification service:
   ```bash
   npm run dev
   ```

## Using Postman Collection

1. Import [RabbitMQ_Test_Collection.postman_collection.json](./RabbitMQ_Test_Collection.postman_collection.json)
2. Set `base_url` variable to `http://localhost:50003`
3. Run requests in order:
   - Check RabbitMQ Status
   - Publish Appointment Booked
   - Publish Appointment Cancelled
   - Publish Appointment Rescheduled

## Monitoring Commands

### Check RabbitMQ queues
```bash
docker exec rabbitmq rabbitmqctl list_queues
```

### Check RabbitMQ messages
```bash
docker exec rabbitmq rabbitmqctl list_queues messages consumers
```

### View Appointment Service logs
```bash
# If running with npm
npm run dev

# If running with Docker
docker logs -f appointment-service
```

### View Notification Service logs
```bash
# If running with npm
npm run dev

# If running with Docker
docker logs -f notification-service
```

## Next Steps

1. **Integrate with actual appointment creation:**
   - Call `RabbitMQProducer.publishAppointmentBooked()` after creating appointment
   - Include all required fields from database

2. **Setup additional events:**
   - `appointment.cancelled` - Publish when appointment is cancelled
   - `appointment.rescheduled` - Publish when appointment is rescheduled

3. **Production hardening:**
   - Add error handling and retry logic
   - Implement dead letter queues
   - Add message TTL
   - Setup monitoring and alerting

## Documentation

- [Full Integration Guide](./RABBITMQ_INTEGRATION_GUIDE.md)
- [API Documentation](./appointment-service/RABBITMQ_TEST_APIS.md)
- [Notification Service README](./notification-service/README.md)

## Support

For detailed documentation, see:
- [RABBITMQ_INTEGRATION_GUIDE.md](./RABBITMQ_INTEGRATION_GUIDE.md) - Complete integration guide
- [appointment-service/RABBITMQ_TEST_APIS.md](./appointment-service/RABBITMQ_TEST_APIS.md) - API reference
