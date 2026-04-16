# Appointment Service - Automatic User Details Integration

## Overview
The appointment service now **automatically fetches patient and doctor details** from their respective services instead of requiring manual input during appointment booking.

## Architecture Flow

### 1. **Book Appointment** 
```
POST /book
├─ Required Fields:
│  ├─ patientId (string)
│  ├─ doctorId (string)
│  ├─ appointmentDate (date)
│  ├─ startTime (string)
│  ├─ endTime (string)
│  └─ appointmentType (video | in-person)
│
├─ Optional Fields (auto-fetched if not provided):
│  ├─ patientName
│  ├─ patientEmail
│  ├─ patientPhone
│  ├─ doctorName
│  ├─ doctorEmail
│  └─ doctorPhone
│
└─ Appointment Service:
   ├─ Creates appointment in database
   ├─ Checks if contact details are provided
   ├─ IF missing → Fetch from Patient & Doctor services:
   │  ├─ GET /patients/{patientId}
   │  └─ GET /doctors/{doctorId}
   ├─ Merge fetched data with provided data
   └─ Publish to RabbitMQ with complete details
      └─ Notification Service receives and sends emails/SMS
```

### 2. **Doctor Confirms Appointment**
```
PUT /:id/confirm
├─ Optional Fields:
│  ├─ notes
│  └─ contact info (auto-fetched if missing)
│
└─ Appointment Service:
   ├─ Updates status to "confirmed"
   ├─ Accepts additional contact info from request (takes precedence)
   ├─ Fetches missing details from services if needed
   └─ Publish appointment.confirmed event
      └─ Patient & Doctor receive confirmation
```

### 3. **Doctor Rejects Appointment**
```
PUT /:id/reject
├─ Optional Fields:
│  ├─ notes (reason for rejection)
│  └─ contact info (auto-fetched if missing)
│
└─ Appointment Service:
   ├─ Updates status to "rejected"
   ├─ Fetches missing contact details
   └─ Publish appointment.rejected event
      └─ Patient notified to rebook
      └─ Doctor notified of slot availability
```

## Implementation Details

### New Files Created:
- **`src/utils/userDataFetcher.ts`** - Utility to fetch user details from external services

### Updated Files:
1. **`src/service/appointmentService.ts`**
   - Added import for `getUserDetailsForAppointment`
   - Updated `bookAppointmentService` to fetch user details
   - Updated `confirmAppointmentService` to fetch user details
   - Updated `rejectAppointmentService` to fetch user details

2. **`src/validations/appointmentValidations.ts`**
   - Fields already marked as optional for flexible input

## How It Works

### Step 1: Fetch User Details
```typescript
const fetchedDetails = await getUserDetailsForAppointment(patientId, doctorId);
```

**Fetched data structure:**
```typescript
{
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  doctorName: string;
  doctorEmail: string;
  doctorPhone: string;
}
```

### Step 2: Merge with Request Data
```typescript
// Request data takes precedence (if provided)
const userDetails = {
  ...fetchedDetails,      // From services
  ...adoptionalData,      // From request (overrides if present)
};
```

### Step 3: Publish to RabbitMQ
```typescript
await RabbitMQProducer.publishAppointmentBooked({
  appointmentId,
  patientId,
  doctorId,
  appointmentDate,
  appointmentTime,
  status: "booked",
  ...userDetails,  // All contact details included
});
```

## API Usage Examples

### Minimal Request (Auto-Fetch)
```json
POST /book
{
  "patientId": "507f1f77bcf86cd799439011",
  "doctorId": "507f1f77bcf86cd799439012",
  "appointmentDate": "2026-04-25",
  "startTime": "10:00 AM",
  "endTime": "11:00 AM",
  "appointmentType": "video"
}
```
✅ Details auto-fetched from Patient & Doctor services

### With Manual Details (Override)
```json
POST /book
{
  "patientId": "507f1f77bcf86cd799439011",
  "doctorId": "507f1f77bcf86cd799439012",
  "appointmentDate": "2026-04-25",
  "startTime": "10:00 AM",
  "endTime": "11:00 AM",
  "appointmentType": "video",
  "patientEmail": "custom@email.com",
  "doctorEmail": "custom-doctor@email.com"
}
```
✅ Provided details take precedence

### Confirm Appointment
```json
PUT /:appointmentId/confirm
{
  "notes": "I'm ready for the consultation"
}
```
✅ Contact details auto-fetched

### Reject Appointment
```json
PUT /:appointmentId/reject
{
  "notes": "Not available at this time. Please reschedule."
}
```
✅ Contact details auto-fetched

## Error Handling

### If Patient/Doctor Service is Down:
- ⚠️ Warning logged: "Failed to fetch patient/doctor details"
- ✅ Appointment still created successfully
- ⚠️ Notification skipped (notification service handles missing data gracefully)

### If Contact Info is Partially Missing:
- ✅ Appointment created
- ⚠️ Only available details used for notifications
- No errors thrown

## Service URLs Configuration

```env
PATIENT_MANAGEMENT_SERVICE_URL=http://localhost:5006
DOCTOR_MANAGEMENT_SERVICE_URL=http://localhost:5004
```

## Benefits

1. **Zero Manual Input** - No need to provide contact details
2. **Automatic Updates** - Always uses latest patient/doctor data
3. **Graceful Degradation** - Works even if external services are temporarily down
4. **Flexible Override** - Can still provide custom details if needed
5. **Consistent Data** - Single source of truth for user information
