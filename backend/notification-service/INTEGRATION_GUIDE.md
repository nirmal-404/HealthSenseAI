# Integration Guide for Publishing Events to Notification Service

This guide explains how other microservices (Appointment Service, Telemedicine Service) should publish events to the Notification Service via RabbitMQ.

## Overview

The Notification Service listens for two events:
1. `appointment.booked` - When a patient books an appointment
2. `consultation.completed` - When a telemedicine consultation ends

Each event triggers automatic notifications to both patient and doctor via email and SMS.

---

## Prerequisites

- RabbitMQ running and accessible
- Node.js with amqplib package (`npm install amqplib`)
- Event data structure prepared

---

## Publishing Events

### 1. Appointment Service: Publishing `appointment.booked` Event

#### In your Appointment Service (`appointment-service/src`):

```typescript
// File: src/service/RabbitMQPublisher.ts

import amqp, { Connection, Channel } from "amqplib";

class RabbitMQPublisher {
  private connection: Connection | null = null;
  private channel: Channel | null = null;

  async connect(url: string = "amqp://guest:guest@localhost:5672"): Promise<void> {
    try {
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();
      
      // Declare exchange
      await this.channel.assertExchange("appointments", "topic", { durable: true });
      
      console.log("✓ Connected to RabbitMQ for publishing");
    } catch (error: any) {
      console.error("Failed to connect to RabbitMQ:", error?.message);
      throw error;
    }
  }

  async publishAppointmentBooked(payload: any): Promise<void> {
    if (!this.channel) {
      throw new Error("Channel not initialized");
    }

    try {
      const messageBuffer = Buffer.from(JSON.stringify(payload));
      
      this.channel.publish(
        "appointments",
        "appointment.booked",
        messageBuffer,
        { persistent: true, contentType: "application/json" }
      );

      console.log(`✓ Published appointment.booked event for appointment ${payload.appointmentId}`);
    } catch (error: any) {
      console.error("Failed to publish appointment.booked event:", error?.message);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.channel) await this.channel.close();
    if (this.connection) await this.connection.close();
  }
}

export default new RabbitMQPublisher();
```

#### Use in Appointment Booking Controller:

```typescript
// File: src/controller/AppointmentController.ts

import { Request, Response } from "express";
import RabbitMQPublisher from "../service/RabbitMQPublisher";
import AppointmentService from "../service/AppointmentService";

export const bookAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { patientId, doctorId, appointmentDate, appointmentTime } = req.body;

    // 1. Save appointment to database
    const appointment = await AppointmentService.createAppointment({
      patientId,
      doctorId,
      appointmentDate,
      appointmentTime,
      status: "booked",
    });

    // 2. Fetch patient and doctor details
    const patient = await getPatientDetails(patientId);
    const doctor = await getDoctorDetails(doctorId);

    // 3. Publish event to RabbitMQ
    const appointmentBookedPayload = {
      appointmentId: appointment._id,
      patientId: patientId,
      doctorId: doctorId,
      appointmentDate: appointmentDate,
      appointmentTime: appointmentTime,
      doctorName: doctor.name,
      patientName: patient.name,
      patientEmail: patient.email,
      patientPhone: patient.phone,
      doctorEmail: doctor.email,
      doctorPhone: doctor.phone,
      status: "booked",
    };

    await RabbitMQPublisher.publishAppointmentBooked(appointmentBookedPayload);

    // 4. Return response
    res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      appointment: appointment,
    });
  } catch (error: any) {
    console.error("Error booking appointment:", error?.message);
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to book appointment",
    });
  }
};
```

#### Initialize in Appointment Service startup:

```typescript
// File: src/index.ts

import express from "express";
import RabbitMQPublisher from "./service/RabbitMQPublisher";

const app = express();

const startServer = async () => {
  try {
    // Connect to RabbitMQ for publishing
    await RabbitMQPublisher.connect(process.env.RABBITMQ_URL);

    app.listen(process.env.PORT, () => {
      console.log(`✓ Appointment Service started on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
```

---

### 2. Telemedicine Service: Publishing `consultation.completed` Event

#### In your Telemedicine Service (`telemedicine-service/src`):

```typescript
// File: src/service/ConsultationEventPublisher.ts

import amqp, { Connection, Channel } from "amqplib";

class ConsultationEventPublisher {
  private connection: Connection | null = null;
  private channel: Channel | null = null;

  async connect(url: string = "amqp://guest:guest@localhost:5672"): Promise<void> {
    try {
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();
      
      // Declare exchange
      await this.channel.assertExchange("consultations", "topic", { durable: true });
      
      console.log("✓ Connected to RabbitMQ for publishing");
    } catch (error: any) {
      console.error("Failed to connect to RabbitMQ:", error?.message);
      throw error;
    }
  }

  async publishConsultationCompleted(payload: any): Promise<void> {
    if (!this.channel) {
      throw new Error("Channel not initialized");
    }

    try {
      const messageBuffer = Buffer.from(JSON.stringify(payload));
      
      this.channel.publish(
        "consultations",
        "consultation.completed",
        messageBuffer,
        { persistent: true, contentType: "application/json" }
      );

      console.log(`✓ Published consultation.completed event for session ${payload.sessionId}`);
    } catch (error: any) {
      console.error("Failed to publish consultation.completed event:", error?.message);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.channel) await this.channel.close();
    if (this.connection) await this.connection.close();
  }
}

export default new ConsultationEventPublisher();
```

#### Use in Consultation End Controller:

```typescript
// File: src/controller/ConsultationController.ts

import { Request, Response } from "express";
import ConsultationEventPublisher from "../service/ConsultationEventPublisher";
import ConsultationService from "../service/ConsultationService";

export const endConsultation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId, patientId, doctorId, consultationNotes } = req.body;

    // 1. Update consultation status in database
    const consultation = await ConsultationService.endConsultation(sessionId, {
      status: "completed",
      notes: consultationNotes,
      endTime: new Date(),
    });

    // 2. Calculate duration
    const duration = Math.round(
      (new Date(consultation.endTime).getTime() - new Date(consultation.startTime).getTime()) / 60000
    );

    // 3. Fetch patient and doctor details
    const patient = await getPatientDetails(patientId);
    const doctor = await getDoctorDetails(doctorId);

    // 4. Publish event to RabbitMQ
    const consultationCompletedPayload = {
      sessionId: sessionId,
      patientId: patientId,
      doctorId: doctorId,
      consultationDate: consultation.startTime.toISOString().split("T")[0],
      consultationTime: consultation.startTime.toISOString().split("T")[1].slice(0, 5),
      duration: duration,
      status: "completed",
      patientName: patient.name,
      doctorName: doctor.name,
      patientEmail: patient.email,
      patientPhone: patient.phone,
      doctorEmail: doctor.email,
      doctorPhone: doctor.phone,
      notes: consultationNotes,
    };

    await ConsultationEventPublisher.publishConsultationCompleted(consultationCompletedPayload);

    // 5. Return response
    res.status(200).json({
      success: true,
      message: "Consultation ended successfully",
      consultation: consultation,
    });
  } catch (error: any) {
    console.error("Error ending consultation:", error?.message);
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to end consultation",
    });
  }
};
```

#### Initialize in Telemedicine Service startup:

```typescript
// File: src/index.ts

import express from "express";
import ConsultationEventPublisher from "./service/ConsultationEventPublisher";

const app = express();

const startServer = async () => {
  try {
    // Connect to RabbitMQ for publishing
    await ConsultationEventPublisher.connect(process.env.RABBITMQ_URL);

    app.listen(process.env.PORT, () => {
      console.log(`✓ Telemedicine Service started on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
```

---

## Event Payload Reference

### appointment.booked Payload

```typescript
interface AppointmentBookedEvent {
  appointmentId: string;           // Unique appointment ID
  patientId: string;               // Patient's user ID
  doctorId: string;                // Doctor's user ID
  appointmentDate: string;         // Format: YYYY-MM-DD
  appointmentTime: string;         // Format: HH:MM (24-hour)
  doctorName: string;              // Doctor's full name
  patientName: string;             // Patient's full name
  patientEmail: string;            // Patient's email address
  patientPhone: string;            // Patient's phone number (+CountryCodeNumberFormat)
  doctorEmail: string;             // Doctor's email address
  doctorPhone: string;             // Doctor's phone number (+CountryCodeNumberFormat)
  status: "booked";                // Always "booked" for this event
}
```

**Example:**
```json
{
  "appointmentId": "apt-2026-04-20-001",
  "patientId": "patient-id-123",
  "doctorId": "doctor-id-456",
  "appointmentDate": "2026-04-25",
  "appointmentTime": "14:30",
  "doctorName": "Dr. Rajat Kumar",
  "patientName": "Arjun Patel",
  "patientEmail": "arjun@example.com",
  "patientPhone": "+94771234567",
  "doctorEmail": "rajat@healthsense.com",
  "doctorPhone": "+94771234560",
  "status": "booked"
}
```

### consultation.completed Payload

```typescript
interface ConsultationCompletedEvent {
  sessionId: string;               // Unique session ID
  patientId: string;               // Patient's user ID
  doctorId: string;                // Doctor's user ID
  consultationDate: string;        // Format: YYYY-MM-DD
  consultationTime: string;        // Format: HH:MM (24-hour)
  duration: number;                // Duration in minutes
  status: "completed" | "cancelled"; // "completed" on successful end
  patientName: string;             // Patient's full name
  doctorName: string;              // Doctor's full name
  patientEmail: string;            // Patient's email address
  patientPhone: string;            // Patient's phone number
  doctorEmail: string;             // Doctor's email address
  doctorPhone: string;             // Doctor's phone number
  notes?: string;                  // Optional consultation notes
}
```

**Example:**
```json
{
  "sessionId": "session-2026-04-25-14-30",
  "patientId": "patient-id-123",
  "doctorId": "doctor-id-456",
  "consultationDate": "2026-04-25",
  "consultationTime": "14:30",
  "duration": 28,
  "status": "completed",
  "patientName": "Arjun Patel",
  "doctorName": "Dr. Rajat Kumar",
  "patientEmail": "arjun@example.com",
  "patientPhone": "+94771234567",
  "doctorEmail": "rajat@healthsense.com",
  "doctorPhone": "+94771234560",
  "notes": "Patient presented with mild fever and cough. Prescribed antibiotics and advised rest. Follow-up in 3 days."
}
```

---

## Environment Variables Required

Each service should have these environment variables:

```bash
# RabbitMQ Configuration
RABBITMQ_URL=amqp://guest:guest@localhost:5672
# or in production:
RABBITMQ_URL=amqp://username:password@rabbitmq-server:5672
```

---

## Error Handling

### Example Error Handling:

```typescript
try {
  await RabbitMQPublisher.publishAppointmentBooked(payload);
} catch (error) {
  console.error("Failed to publish appointment.booked event:", error?.message);
  
  // Decide whether to:
  // 1. Fail the entire appointment booking
  // 2. Log the error but still complete the booking (notification will follow)
  // 3. Implement retry logic
  
  // For critical notifications, consider failing gracefully:
  res.status(500).json({
    success: false,
    message: "Failed to create appointment - notification system unavailable",
  });
}
```

---

## Testing

### Test Publishing with curl and RabbitMQ Docker

```bash
# 1. Ensure RabbitMQ is running
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management

# 2. Access RabbitMQ Management UI
# http://localhost:15672
# Username: guest, Password: guest

# 3. Create a test exchange and queue
# Go to "Exchanges" tab -> Add new exchange
# Name: "appointments", Type: "topic", Durable: Yes

# 4. Create queue
# Go to "Queues" tab -> Add new queue
# Name: "appointment_notifications", Durable: Yes

# 5. Bind queue to exchange
# In exchanges tab -> click "appointments" -> Bindings
# Add binding: routing_key: "appointment.booked", destination: "appointment_notifications"

# 6. Publish a test message
# Go to "Exchanges" -> "appointments" -> Publish message
# Routing key: "appointment.booked"
# Payload:
{
  "appointmentId": "test-001",
  "patientId": "pat-001",
  "doctorId": "doc-001",
  "appointmentDate": "2026-04-25",
  "appointmentTime": "14:30",
  "doctorName": "Dr. Test",
  "patientName": "Patient Test",
  "patientEmail": "patient@test.com",
  "patientPhone": "+94771234567",
  "doctorEmail": "doctor@test.com",
  "doctorPhone": "+94771234560",
  "status": "booked"
}
```

---

## Debugging

### Check if Notification Service Received the Event

1. **Monitor Notification Service logs:**
   ```bash
   docker logs -f notification-service
   # Look for: "📨 Received event: appointment.booked"
   ```

2. **Check RabbitMQ Queue Status:**
   - Go to http://localhost:15672
   - Navigate to "Queues" tab
   - Check queue message count

3. **Verify Event Handler is Registered:**
   - Look for logs: `✓ Registered event handler for: appointment.booked`

---

## Production Considerations

1. **Message Persistence:** Ensure `persistent: true` in publish options
2. **Connection Pooling:** Reuse connections, don't create new ones for each publish
3. **Error Handling:** Implement retry logic with exponential backoff
4. **Monitoring:** Log all published events for audit trail
5. **Validation:** Validate event payload before publishing
6. **Dead Letter Queue:** Configure DLQ for failed messages

---

## Next Steps

1. Implement event publishing in Appointment Service
2. Implement event publishing in Telemedicine Service
3. Test with Notification Service running locally
4. Deploy to production environment
5. Monitor logs and verify notifications are being sent
