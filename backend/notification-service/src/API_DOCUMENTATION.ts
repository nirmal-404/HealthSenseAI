/**
 * API Documentation for Notification Service
 * 
 * Base URL: http://localhost:5005
 * 
 * All responses follow the standard format:
 * {
 *   "success": boolean,
 *   "data": object | array,
 *   "error": string (only if success is false)
 * }
 */

// ============================================================================
// NOTIFICATION ENDPOINTS
// ============================================================================

/**
 * Send a Single Notification
 * 
 * POST /notifications/send
 * 
 * Request Body:
 * {
 *   "userId": "user-id-123",
 *   "type": "email" | "sms",
 *   "category": "appointment" | "payment" | "reminder" | "prescription" | "verification",
 *   "recipient": "email@example.com" | "+94771234567",
 *   "subject": "Notification Subject (required for email)",
 *   "message": "Notification message body",
 *   "templateName": "optional-template-name",
 *   "templateVariables": { "variable": "value" }
 * }
 * 
 * Response (200):
 * {
 *   "success": true,
 *   "notificationId": "550e8400-e29b-41d4-a716-446655440000",
 *   "messageId": "twilio-message-id"
 * }
 */

/**
 * Send Bulk Notifications
 * 
 * POST /notifications/send-bulk
 * 
 * Request Body:
 * {
 *   "userIds": ["user-1", "user-2", "user-3"],
 *   "type": "email" | "sms",
 *   "category": "appointment",
 *   "subject": "Bulk notification subject",
 *   "message": "Message for all users"
 * }
 * 
 * Response (200):
 * {
 *   "success": true,
 *   "totalNotifications": 3,
 *   "notifications": [
 *     { "userId": "user-1", "notificationId": "...", "status": "queued" },
 *     { "userId": "user-2", "notificationId": "...", "status": "queued" },
 *     { "userId": "user-3", "notificationId": "...", "status": "queued" }
 *   ]
 * }
 */

/**
 * Get Notification by ID
 * 
 * GET /notifications/:notificationId
 * 
 * Response (200):
 * {
 *   "success": true,
 *   "notification": {
 *     "notificationId": "...",
 *     "userId": "...",
 *     "type": "email",
 *     "category": "appointment",
 *     "status": "sent",
 *     "sentAt": "2025-04-13T10:30:00Z",
 *     "createdAt": "2025-04-13T10:00:00Z"
 *   }
 * }
 */

/**
 * Get User Notifications
 * 
 * GET /notifications/user/:userId?limit=50&offset=0
 * 
 * Query Parameters:
 * - limit: number (default: 50)
 * - offset: number (default: 0)
 * 
 * Response (200):
 * {
 *   "success": true,
 *   "notifications": [...],
 *   "total": 120,
 *   "limit": 50,
 *   "offset": 0
 * }
 */

/**
 * Retry Failed Notifications
 * 
 * POST /notifications/retry-failed
 * 
 * Response (200):
 * {
 *   "success": true,
 *   "retried": 5,
 *   "results": [
 *     { "notificationId": "...", "status": "sent" },
 *     { "notificationId": "...", "status": "failed" }
 *   ]
 * }
 */

/**
 * Get Notification Statistics
 * 
 * GET /notifications/stats
 * 
 * Response (200):
 * {
 *   "success": true,
 *   "stats": {
 *     "total": 1000,
 *     "sent": 950,
 *     "failed": 30,
 *     "pending": 10,
 *     "queued": 10
 *   }
 * }
 */

// ============================================================================
// TEMPLATE ENDPOINTS
// ============================================================================

/**
 * Create Notification Template
 * 
 * POST /templates
 * 
 * Request Body:
 * {
 *   "templateName": "appointment_confirmation",
 *   "type": "email" | "sms",
 *   "subject": "Appointment Confirmation (required for email)",
 *   "bodyTemplate": "Dear {{patientName}}, your appointment with Dr. {{doctorName}} is confirmed for {{date}} at {{time}}.",
 *   "variables": ["patientName", "doctorName", "date", "time"]
 * }
 * 
 * Response (201):
 * {
 *   "success": true,
 *   "template": {
 *     "templateId": "...",
 *     "templateName": "appointment_confirmation",
 *     "type": "email",
 *     "variables": ["patientName", "doctorName", "date", "time"],
 *     "isActive": true,
 *     "createdAt": "2025-04-13T10:00:00Z"
 *   }
 * }
 */

/**
 * Get All Templates
 * 
 * GET /templates
 * 
 * Response (200):
 * {
 *   "success": true,
 *   "templates": [...]
 * }
 */

/**
 * Get Template by Name
 * 
 * GET /templates/:templateName
 * 
 * Response (200):
 * {
 *   "success": true,
 *   "template": {...}
 * }
 */

// ============================================================================
// PREFERENCE ENDPOINTS
// ============================================================================

/**
 * Update Notification Preferences
 * 
 * PUT /preferences/:userId
 * 
 * Request Body (all fields optional):
 * {
 *   "emailEnabled": true,
 *   "smsEnabled": false,
 *   "appointmentNotifications": true,
 *   "paymentNotifications": true,
 *   "reminderNotifications": false,
 *   "prescriptionNotifications": true,
 *   "verificationNotifications": true
 * }
 * 
 * Response (200):
 * {
 *   "success": true,
 *   "preference": {...}
 * }
 */

/**
 * Get Notification Preferences
 * 
 * GET /preferences/:userId
 * 
 * Response (200):
 * {
 *   "success": true,
 *   "preference": {
 *     "preferenceId": "...",
 *     "userId": "...",
 *     "emailEnabled": true,
 *     "smsEnabled": true,
 *     "appointmentNotifications": true,
 *     "paymentNotifications": true,
 *     "reminderNotifications": true,
 *     "prescriptionNotifications": true,
 *     "verificationNotifications": true
 *   }
 * }
 */

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * Health Check
 * 
 * GET /health
 * 
 * Response (200):
 * {
 *   "status": "UP",
 *   "code": 200,
 *   "service": "notification-service"
 * }
 */

// ============================================================================
// ERROR RESPONSES
// ============================================================================

/**
 * All error responses follow this format:
 * 
 * 400 Bad Request:
 * {
 *   "success": false,
 *   "error": "Validation error",
 *   "details": [
 *     { "field": "userId", "message": "User ID is required" }
 *   ]
 * }
 * 
 * 401 Unauthorized:
 * {
 *   "success": false,
 *   "error": "No authorization token provided"
 * }
 * 
 * 404 Not Found:
 * {
 *   "success": false,
 *   "error": "Notification not found"
 * }
 * 
 * 500 Internal Server Error:
 * {
 *   "success": false,
 *   "error": "Internal server error"
 * }
 */

// ============================================================================
// EXAMPLE REQUESTS (cURL)
// ============================================================================

/**
 * Send Email Notification
 * 
 * curl -X POST http://localhost:5005/notifications/send \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "userId": "user-123",
 *     "type": "email",
 *     "category": "appointment",
 *     "recipient": "patient@example.com",
 *     "subject": "Appointment Confirmation",
 *     "message": "Your appointment is confirmed for tomorrow at 2:00 PM"
 *   }'
 */

/**
 * Send SMS Notification
 * 
 * curl -X POST http://localhost:5005/notifications/send \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "userId": "user-123",
 *     "type": "sms",
 *     "category": "appointment",
 *     "recipient": "+94771234567",
 *     "message": "Hi, your appointment with Dr. Smith is confirmed for tomorrow at 2:00 PM"
 *   }'
 */

/**
 * Create Template
 * 
 * curl -X POST http://localhost:5005/templates \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "templateName": "payment_confirmation",
 *     "type": "email",
 *     "subject": "Payment Confirmation",
 *     "bodyTemplate": "Payment of {{amount}} {{currency}} received. Transaction ID: {{transactionId}}",
 *     "variables": ["amount", "currency", "transactionId"]
 *   }'
 */

/**
 * Update Preferences
 * 
 * curl -X PUT http://localhost:5005/preferences/user-123 \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "emailEnabled": true,
 *     "smsEnabled": false,
 *     "appointmentNotifications": true,
 *     "reminderNotifications": false
 *   }'
 */

export {};
