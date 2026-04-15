# 📬 Notification Service - Postman Routes Testing Guide

## 🌐 Base URLs

### Option 1: Direct Service Access (Internal Testing)
```
http://localhost:5005
```

### Option 2: Via API Gateway (Frontend/Client Access)
```
http://localhost:3000/api/notifications
```

> **Note**: Use **Option 1** for internal service-to-service testing. Use **Option 2** for frontend or external client requests.

---

## 📋 Table of Contents
1. [Health Check](#health-check)
2. [Send Notification](#send-notification)
3. [Send Bulk Notifications](#send-bulk-notifications)
4. [Get Notification by ID](#get-notification-by-id)
5. [Get User Notifications](#get-user-notifications)
6. [Retry Failed Notifications](#retry-failed-notifications)
7. [Get Notification Statistics](#get-notification-statistics)
8. [Create Template](#create-template)
9. [Get All Templates](#get-all-templates)
10. [Get Template by Name](#get-template-by-name)
11. [Update User Preferences](#update-user-preferences)
12. [Get User Preferences](#get-user-preferences)

---

## ✅ Health Check

### Endpoint
#### Direct Service
```
GET http://localhost:5005/health
```

#### Via API Gateway
```
GET http://localhost:3000/api/notifications/health
```

### Description
Check if the Notification Service is running and healthy.

### Headers
```
Content-Type: application/json
```

### Request Body
```
(empty - no body required)
```

### cURL - Direct Service
```bash
curl -X GET http://localhost:5005/health
```

### cURL - Via API Gateway
```bash
curl -X GET http://localhost:3000/api/notifications/health
```

### Response (200 OK)
```json
{
  "status": "UP",
  "code": 200
}
```

### Response (503 Service Unavailable)
```json
{
  "status": "DOWN",
  "code": 503,
  "error": "MongoDB connection failed"
}
```

---

## 📤 Send Notification

### Endpoint
#### Direct Service
```
POST http://localhost:5005/send
```

#### Via API Gateway
```
POST http://localhost:3000/api/notifications/send
```

### Description
Send a single notification (email or SMS) to a user.

### Headers
```
Content-Type: application/json
```

### Request Body - Email Notification
```json
{
  "userId": "patient-123",
  "type": "email",
  "category": "appointment",
  "recipient": "patient@example.com",
  "subject": "Appointment Confirmed",
  "message": "Your appointment is confirmed for tomorrow at 2:00 PM with Dr. Smith. Please arrive 10 minutes early."
}
```

### Request Body - SMS Notification
```json
{
  "userId": "patient-456",
  "type": "sms",
  "category": "reminder",
  "recipient": "+94771234567",
  "message": "Hi Ali, reminder: Your appointment with Dr. Smith is tomorrow at 2:00 PM. -HealthSense"
}
```

### Request Body - Using Template
```json
{
  "userId": "patient-789",
  "type": "email",
  "category": "payment",
  "recipient": "patient@example.com",
  "templateName": "payment_confirmation",
  "templateVariables": {
    "amount": "5000",
    "currency": "LKR",
    "transactionId": "TXN-123456"
  }
}
```

### cURL - Email (Direct)
```bash
curl -X POST http://localhost:5005/send \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "patient-123",
    "type": "email",
    "category": "appointment",
    "recipient": "patient@example.com",
    "subject": "Appointment Confirmed",
    "message": "Your appointment is confirmed for tomorrow at 2:00 PM with Dr. Smith"
  }'
```

### cURL - Email (Via Gateway)
```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "patient-123",
    "type": "email",
    "category": "appointment",
    "recipient": "patient@example.com",
    "subject": "Appointment Confirmed",
    "message": "Your appointment is confirmed for tomorrow at 2:00 PM with Dr. Smith"
  }'
```

### cURL - SMS
```bash
curl -X POST http://localhost:5005/send \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "patient-456",
    "type": "sms",
    "category": "reminder",
    "recipient": "+94771234567",
    "message": "Hi, your appointment with Dr. Smith is tomorrow at 2:00 PM"
  }'
```

### Response (200 OK)
```json
{
  "success": true,
  "notificationId": "550e8400-e29b-41d4-a716-446655440000",
  "messageId": "message-id-123"
}
```

### Response (400 Bad Request)
```json
{
  "success": false,
  "error": "Validation error",
  "details": [
    {
      "field": "userId",
      "message": "User ID is required"
    },
    {
      "field": "recipient",
      "message": "Recipient (email or phone) is required"
    }
  ]
}
```

### Validation Rules
- `userId`: Required (string)
- `type`: Required (email | sms | push)
- `category`: Required (appointment | payment | reminder | prescription | verification)
- `recipient`: Required (email or phone number)
- `message`: Required (string)
- `subject`: Optional (required for email type)

---

## 📨 Send Bulk Notifications

### Endpoint
#### Direct Service
```
POST http://localhost:5005/send-bulk
```

#### Via API Gateway
```
POST http://localhost:3000/api/notifications/send-bulk
```

### Description
Send notifications to multiple users at once.

### Headers
```
Content-Type: application/json
```

### Request Body
```json
{
  "userIds": ["patient-1", "patient-2", "patient-3"],
  "type": "email",
  "category": "reminder",
  "subject": "Appointment Reminder",
  "message": "This is a reminder about your upcoming appointment. Please log in to HealthSense for more details."
}
```

### cURL - Direct Service
```bash
curl -X POST http://localhost:5005/send-bulk \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": ["patient-1", "patient-2", "patient-3"],
    "type": "email",
    "category": "reminder",
    "subject": "Appointment Reminder",
    "message": "This is a reminder about your upcoming appointment"
  }'
```

### cURL - Via API Gateway
```bash
curl -X POST http://localhost:3000/api/notifications/send-bulk \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": ["patient-1", "patient-2", "patient-3"],
    "type": "email",
    "category": "reminder",
    "subject": "Appointment Reminder",
    "message": "This is a reminder about your upcoming appointment"
  }'
```

### Response (200 OK)
```json
{
  "success": true,
  "totalNotifications": 3,
  "notifications": [
    {
      "userId": "patient-1",
      "notificationId": "550e8400-e29b-41d4-a716-446655440001",
      "status": "queued"
    },
    {
      "userId": "patient-2",
      "notificationId": "550e8400-e29b-41d4-a716-446655440002",
      "status": "queued"
    },
    {
      "userId": "patient-3",
      "notificationId": "550e8400-e29b-41d4-a716-446655440003",
      "status": "queued"
    }
  ]
}
```

### Response (400 Bad Request)
```json
{
  "success": false,
  "error": "Validation error",
  "details": [
    {
      "field": "userIds",
      "message": "User IDs must be an array"
    }
  ]
}
```

---

## 🔍 Get Notification by ID

### Endpoint
#### Direct Service
```
GET http://localhost:5005/{notificationId}
```

#### Via API Gateway
```
GET http://localhost:3000/api/notifications/{notificationId}
```

### Description
Retrieve a specific notification by its ID.

### Headers
```
Content-Type: application/json
```

### URL Parameters
- `notificationId` (string, required): The UUID of the notification

### Example - Direct Service
```
GET http://localhost:5005/550e8400-e29b-41d4-a716-446655440000
```

### Example - Via API Gateway
```
GET http://localhost:3000/api/notifications/550e8400-e29b-41d4-a716-446655440000
```

### cURL - Direct Service
```bash
curl -X GET http://localhost:5005/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json"
```

### cURL - Via API Gateway
```bash
curl -X GET http://localhost:3000/api/notifications/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json"
```

### Response (200 OK)
```json
{
  "success": true,
  "notification": {
    "_id": "507f1f77bcf86cd799439011",
    "notificationId": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "patient-123",
    "type": "email",
    "category": "appointment",
    "recipient": "patient@example.com",
    "subject": "Appointment Confirmed",
    "message": "Your appointment is confirmed for tomorrow at 2:00 PM with Dr. Smith",
    "status": "sent",
    "retryCount": 0,
    "maxRetries": 3,
    "sentAt": "2025-04-13T14:30:00Z",
    "createdAt": "2025-04-13T14:25:00Z",
    "updatedAt": "2025-04-13T14:30:00Z"
  }
}
```

### Response (404 Not Found)
```json
{
  "success": false,
  "error": "Notification not found"
}
```

---

## 👤 Get User Notifications

### Endpoint
#### Direct Service
```
GET http://localhost:5005/user/{userId}
```

#### Via API Gateway
```
GET http://localhost:3000/api/notifications/user/{userId}
```

### Description
Retrieve all notifications for a specific user with pagination support.

### Headers
```
Content-Type: application/json
```

### URL Parameters
- `userId` (string, required): The user ID

### Query Parameters
- `limit` (number, optional): Number of results per page (default: 50)
- `offset` (number, optional): Starting position (default: 0)

### Example - Direct Service
```
GET http://localhost:5005/user/patient-123?limit=10&offset=0
```

### Example - Via API Gateway
```
GET http://localhost:3000/api/notifications/user/patient-123?limit=10&offset=0
```

### cURL - Direct Service
```bash
curl -X GET "http://localhost:5005/user/patient-123?limit=10&offset=0" \
  -H "Content-Type: application/json"
```

### cURL - Via API Gateway
```bash
curl -X GET "http://localhost:3000/api/notifications/user/patient-123?limit=10&offset=0" \
  -H "Content-Type: application/json"
```

### Response (200 OK)
```json
{
  "success": true,
  "notifications": [
    {
      "notificationId": "550e8400-e29b-41d4-a716-446655440000",
      "userId": "patient-123",
      "type": "email",
      "category": "appointment",
      "recipient": "patient@example.com",
      "subject": "Appointment Confirmed",
      "message": "Your appointment is confirmed...",
      "status": "sent",
      "retryCount": 0,
      "sentAt": "2025-04-13T14:30:00Z",
      "createdAt": "2025-04-13T14:25:00Z"
    },
    {
      "notificationId": "550e8400-e29b-41d4-a716-446655440001",
      "userId": "patient-123",
      "type": "sms",
      "category": "reminder",
      "recipient": "+94771234567",
      "message": "Hi, reminder about your appointment...",
      "status": "sent",
      "retryCount": 0,
      "sentAt": "2025-04-13T13:30:00Z",
      "createdAt": "2025-04-13T13:25:00Z"
    }
  ],
  "total": 25,
  "limit": 10,
  "offset": 0
}
```

### Response (400 Bad Request)
```json
{
  "success": false,
  "error": "Invalid query parameters"
}
```

---

## 🔄 Retry Failed Notifications

### Endpoint
#### Direct Service
```
POST http://localhost:5005/retry-failed
```

#### Via API Gateway
```
POST http://localhost:3000/api/notifications/retry-failed
```

### Description
Retry all failed notifications that have retries remaining.

### Headers
```
Content-Type: application/json
```

### Request Body
```json
{}
```

### cURL - Direct Service
```bash
curl -X POST http://localhost:5005/retry-failed \
  -H "Content-Type: application/json" \
  -d '{}'
```

### cURL - Via API Gateway
```bash
curl -X POST http://localhost:3000/api/notifications/retry-failed \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Response (200 OK)
```json
{
  "success": true,
  "retried": 3,
  "results": [
    {
      "notificationId": "550e8400-e29b-41d4-a716-446655440005",
      "status": "sent"
    },
    {
      "notificationId": "550e8400-e29b-41d4-a716-446655440006",
      "status": "failed"
    },
    {
      "notificationId": "550e8400-e29b-41d4-a716-446655440007",
      "status": "sent"
    }
  ]
}
```

---

## 📊 Get Notification Statistics

### Endpoint
#### Direct Service
```
GET http://localhost:5005/stats
```

#### Via API Gateway
```
GET http://localhost:3000/api/notifications/stats
```

### Description
Get overall notification statistics including sent, failed, and pending counts.

### Headers
```
Content-Type: application/json
```

### Request Body
```
(empty - no body required)
```

### cURL - Direct Service
```bash
curl -X GET http://localhost:5005/stats \
  -H "Content-Type: application/json"
```

### cURL - Via API Gateway
```bash
curl -X GET http://localhost:3000/api/notifications/stats \
  -H "Content-Type: application/json"
```

### Response (200 OK)
```json
{
  "success": true,
  "stats": {
    "total": 1000,
    "sent": 950,
    "failed": 30,
    "pending": 10,
    "queued": 10
  }
}
```

---

## 📝 Create Template

### Endpoint
#### Direct Service
```
POST http://localhost:5005/templates
```

#### Via API Gateway
```
POST http://localhost:3000/api/notifications/templates
```

### Description
Create a new notification template with variable placeholders.

### Headers
```
Content-Type: application/json
```

### Request Body - Email Template
```json
{
  "templateName": "appointment_confirmation",
  "type": "email",
  "subject": "Appointment Confirmation - {{doctorName}}",
  "bodyTemplate": "Dear {{patientName}},\n\nYour appointment with Dr. {{doctorName}} is confirmed.\n\nDate: {{appointmentDate}}\nTime: {{appointmentTime}}\nLocation: {{location}}\n\nPlease arrive 10 minutes before your appointment.\n\nRegards,\nHealthSense Team",
  "variables": ["patientName", "doctorName", "appointmentDate", "appointmentTime", "location"]
}
```

### Request Body - SMS Template
```json
{
  "templateName": "appointment_reminder_sms",
  "type": "sms",
  "bodyTemplate": "Hi {{patientName}}, reminder: Your appointment with Dr. {{doctorName}} is {{appointmentDate}} at {{appointmentTime}}. -HealthSense",
  "variables": ["patientName", "doctorName", "appointmentDate", "appointmentTime"]
}
```

### cURL - Direct Service
```bash
curl -X POST http://localhost:5005/templates \
  -H "Content-Type: application/json" \
  -d '{
    "templateName": "appointment_confirmation",
    "type": "email",
    "subject": "Appointment Confirmation",
    "bodyTemplate": "Dear {{patientName}}, your appointment with Dr. {{doctorName}} is confirmed for {{appointmentDate}} at {{appointmentTime}}",
    "variables": ["patientName", "doctorName", "appointmentDate", "appointmentTime"]
  }'
```

### cURL - Via API Gateway
```bash
curl -X POST http://localhost:3000/api/notifications/templates \
  -H "Content-Type: application/json" \
  -d '{
    "templateName": "appointment_confirmation",
    "type": "email",
    "subject": "Appointment Confirmation",
    "bodyTemplate": "Dear {{patientName}}, your appointment with Dr. {{doctorName}} is confirmed for {{appointmentDate}} at {{appointmentTime}}",
    "variables": ["patientName", "doctorName", "appointmentDate", "appointmentTime"]
  }'
```

### Response (201 Created)
```json
{
  "success": true,
  "template": {
    "_id": "507f1f77bcf86cd799439012",
    "templateId": "template-001",
    "templateName": "appointment_confirmation",
    "type": "email",
    "subject": "Appointment Confirmation - {{doctorName}}",
    "bodyTemplate": "Dear {{patientName}},\n\nYour appointment with Dr. {{doctorName}} is confirmed...",
    "variables": ["patientName", "doctorName", "appointmentDate", "appointmentTime", "location"],
    "isActive": true,
    "createdAt": "2025-04-13T14:00:00Z",
    "updatedAt": "2025-04-13T14:00:00Z"
  }
}
```

### Response (400 Bad Request)
```json
{
  "success": false,
  "error": "Validation error",
  "details": [
    {
      "field": "templateName",
      "message": "Template name is required"
    }
  ]
}
```

### Response (400 Template Already Exists)
```json
{
  "success": false,
  "error": "Template with this name already exists"
}
```

---

## 📚 Get All Templates

### Endpoint
#### Direct Service
```
GET http://localhost:5005/templates
```

#### Via API Gateway
```
GET http://localhost:3000/api/notifications/templates
```

### Description
Retrieve all active notification templates.

### Headers
```
Content-Type: application/json
```

### Request Body
```
(empty - no body required)
```

### cURL - Direct Service
```bash
curl -X GET http://localhost:5005/templates \
  -H "Content-Type: application/json"
```

### cURL - Via API Gateway
```bash
curl -X GET http://localhost:3000/api/notifications/templates \
  -H "Content-Type: application/json"
```

### Response (200 OK)
```json
{
  "success": true,
  "templates": [
    {
      "templateId": "template-001",
      "templateName": "appointment_confirmation",
      "type": "email",
      "subject": "Appointment Confirmation",
      "isActive": true,
      "createdAt": "2025-04-13T14:00:00Z"
    },
    {
      "templateId": "template-002",
      "templateName": "payment_confirmation",
      "type": "email",
      "subject": "Payment Confirmation",
      "isActive": true,
      "createdAt": "2025-04-13T14:05:00Z"
    },
    {
      "templateId": "template-003",
      "templateName": "prescription_notification",
      "type": "sms",
      "isActive": true,
      "createdAt": "2025-04-13T14:10:00Z"
    }
  ]
}
```

---

## 🔍 Get Template by Name

### Endpoint
#### Direct Service
```
GET http://localhost:5005/templates/{templateName}
```

#### Via API Gateway
```
GET http://localhost:3000/api/notifications/templates/{templateName}
```

### Description
Retrieve a specific template by its name.

### Headers
```
Content-Type: application/json
```

### URL Parameters
- `templateName` (string, required): The name of the template

### Example - Direct Service
```
GET http://localhost:5005/templates/appointment_confirmation
```

### Example - Via API Gateway
```
GET http://localhost:3000/api/notifications/templates/appointment_confirmation
```

### cURL - Direct Service
```bash
curl -X GET http://localhost:5005/templates/appointment_confirmation \
  -H "Content-Type: application/json"
```

### cURL - Via API Gateway
```bash
curl -X GET http://localhost:3000/api/notifications/templates/appointment_confirmation \
  -H "Content-Type: application/json"
```

### Response (200 OK)
```json
{
  "success": true,
  "template": {
    "_id": "507f1f77bcf86cd799439012",
    "templateId": "template-001",
    "templateName": "appointment_confirmation",
    "type": "email",
    "subject": "Appointment Confirmation - {{doctorName}}",
    "bodyTemplate": "Dear {{patientName}},\n\nYour appointment with Dr. {{doctorName}} is confirmed.\n\nDate: {{appointmentDate}}\nTime: {{appointmentTime}}\n\nPlease arrive 10 minutes early.\n\nRegards,\nHealthSense Team",
    "variables": ["patientName", "doctorName", "appointmentDate", "appointmentTime"],
    "isActive": true,
    "createdAt": "2025-04-13T14:00:00Z",
    "updatedAt": "2025-04-13T14:00:00Z"
  }
}
```

### Response (404 Not Found)
```json
{
  "success": false,
  "error": "Template not found"
}
```

---

## ⚙️ Update User Preferences

### Endpoint
#### Direct Service
```
PUT http://localhost:5005/preferences/{userId}
```

#### Via API Gateway
```
PUT http://localhost:3000/api/notifications/preferences/{userId}
```

### Description
Update notification preferences for a user.

### Headers
```
Content-Type: application/json
```

### URL Parameters
- `userId` (string, required): The user ID

### Request Body (all fields optional)
```json
{
  "emailEnabled": true,
  "smsEnabled": false,
  "appointmentNotifications": true,
  "paymentNotifications": true,
  "reminderNotifications": false,
  "prescriptionNotifications": true,
  "verificationNotifications": true
}
```

### Example - Direct Service
```
PUT http://localhost:5005/preferences/patient-123
```

### Example - Via API Gateway
```
PUT http://localhost:3000/api/notifications/preferences/patient-123
```

### cURL - Direct Service
```bash
curl -X PUT http://localhost:5005/preferences/patient-123 \
  -H "Content-Type: application/json" \
  -d '{
    "emailEnabled": true,
    "smsEnabled": false,
    "appointmentNotifications": true,
    "reminderNotifications": false
  }'
```

### cURL - Via API Gateway
```bash
curl -X PUT http://localhost:3000/api/notifications/preferences/patient-123 \
  -H "Content-Type: application/json" \
  -d '{
    "emailEnabled": true,
    "smsEnabled": false,
    "appointmentNotifications": true,
    "reminderNotifications": false
  }'
```

### Response (200 OK)
```json
{
  "success": true,
  "preference": {
    "_id": "507f1f77bcf86cd799439013",
    "preferenceId": "pref-123",
    "userId": "patient-123",
    "emailEnabled": true,
    "smsEnabled": false,
    "appointmentNotifications": true,
    "paymentNotifications": true,
    "reminderNotifications": false,
    "prescriptionNotifications": true,
    "verificationNotifications": true,
    "createdAt": "2025-04-13T14:00:00Z",
    "updatedAt": "2025-04-13T14:15:00Z"
  }
}
```

### Response (400 Bad Request)
```json
{
  "success": false,
  "error": "Validation error",
  "details": [
    {
      "field": "emailEnabled",
      "message": "emailEnabled must be a boolean"
    }
  ]
}
```

---

## 👁️ Get User Preferences

### Endpoint
#### Direct Service
```
GET http://localhost:5005/preferences/{userId}
```

#### Via API Gateway
```
GET http://localhost:3000/api/notifications/preferences/{userId}
```

### Description
Retrieve notification preferences for a user. Creates default preferences if none exist.

### Headers
```
Content-Type: application/json
```

### URL Parameters
- `userId` (string, required): The user ID

### Example - Direct Service
```
GET http://localhost:5005/preferences/patient-123
```

### Example - Via API Gateway
```
GET http://localhost:3000/api/notifications/preferences/patient-123
```

### cURL - Direct Service
```bash
curl -X GET http://localhost:5005/preferences/patient-123 \
  -H "Content-Type: application/json"
```

### cURL - Via API Gateway
```bash
curl -X GET http://localhost:3000/api/notifications/preferences/patient-123 \
  -H "Content-Type: application/json"
```

### Response (200 OK)
```json
{
  "success": true,
  "preference": {
    "_id": "507f1f77bcf86cd799439013",
    "preferenceId": "pref-123",
    "userId": "patient-123",
    "emailEnabled": true,
    "smsEnabled": true,
    "appointmentNotifications": true,
    "paymentNotifications": true,
    "reminderNotifications": true,
    "prescriptionNotifications": true,
    "verificationNotifications": true,
    "createdAt": "2025-04-13T14:00:00Z",
    "updatedAt": "2025-04-13T14:00:00Z"
  }
}
```

---

## 🧪 Postman Testing Sequence

### Recommended order to test endpoints:

1. **Health Check** - Verify service is running
   ```
   GET /health (or /api/notifications/health via gateway)
   ```

2. **Create Template** - Create a template for later use
   ```
   POST /templates (or /api/notifications/templates via gateway)
   ```

3. **Get All Templates** - Verify template was created
   ```
   GET /templates (or /api/notifications/templates via gateway)
   ```

4. **Send Notification** - Send an email notification
   ```
   POST /send (or /api/notifications/send via gateway)
   ```

5. **Send Another Notification** - Send an SMS
   ```
   POST /send (or /api/notifications/send via gateway)
   ```

6. **Get Notification by ID** - Retrieve notification details
   ```
   GET /{notificationId} (or /api/notifications/{notificationId} via gateway)
   ```

7. **Get User Notifications** - List all user notifications
   ```
   GET /user/{userId} (or /api/notifications/user/{userId} via gateway)
   ```

8. **Get Statistics** - Check overall stats
   ```
   GET /stats (or /api/notifications/stats via gateway)
   ```

9. **Update Preferences** - Change user preferences
   ```
   PUT /preferences/{userId} (or /api/notifications/preferences/{userId} via gateway)
   ```

10. **Get Preferences** - Verify preferences were updated
    ```
    GET /preferences/{userId} (or /api/notifications/preferences/{userId} via gateway)
    ```

11. **Send Bulk Notifications** - Send to multiple users
    ```
    POST /send-bulk (or /api/notifications/send-bulk via gateway)
    ```

12. **Retry Failed Notifications** - Retry any failed attempts
    ```
    POST /retry-failed (or /api/notifications/retry-failed via gateway)
    ```

---

## 📌 Important Notes

- **Direct Service Port**: Service runs on port `5005` by default (internal testing only)
- **API Gateway Port**: Frontend/clients access via `http://localhost:3000/api/notifications` (production use)
- **MongoDB Required**: Ensure MongoDB is running and connected
- **Email Configuration**: Set up Gmail credentials in `.env` for email sending
- **SMS Configuration**: Configure Twilio credentials in `.env` for SMS sending
- **All UUIDs**: Notification and template IDs are auto-generated using `uuid v4`
- **Timestamps**: All timestamps are in ISO 8601 format
- **Retry Logic**: Failed notifications are automatically retried up to 3 times
- **Routing Note**: All endpoints are prefixed with `/api/notifications` when accessed through API Gateway

---

## 🔐 Security Headers

For production, add these headers to all requests:

```
Authorization: Bearer {JWT_TOKEN}
X-Internal-Service-Key: {SERVICE_KEY}
```

---

## ❌ Common Errors

| Error | Status | Cause |
|-------|--------|-------|
| "User ID is required" | 400 | Missing userId field |
| "Type must be email, sms, or push" | 400 | Invalid notification type |
| "Recipient email or phone is required" | 400 | Missing recipient field |
| "Subject is required for email templates" | 400 | Email template missing subject |
| "Notification not found" | 404 | Invalid notificationId |
| "Template not found" | 404 | Invalid templateName |
| "Template with this name already exists" | 400 | Duplicate template name |
| "Internal server error" | 500 | Server-side issue |
| "MongoDB connection failed" | 503 | Database unavailable |

---

## 📞 Support

For issues or questions:
1. Check `.env` configuration
2. Verify MongoDB connection
3. Ensure email/SMS services are configured
4. Check application logs
5. Verify network connectivity

---

**Created**: April 13, 2026  
**Updated**: April 14, 2026  
**Version**: 2.0  
**Service**: Notification Service v1.0

> **⚠️ API Gateway Integration**: All endpoints documented with both direct service and API Gateway access methods. Use API Gateway URLs for frontend/client requests.
