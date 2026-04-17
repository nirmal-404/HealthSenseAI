# SMS Integration Migration: Twilio → SMSAPI.lk

## Overview
Migrated SMS provider from Twilio to SMSAPI.lk for cost efficiency and local SMS support.

## Changes Made

### 1. Code Updates
- **SMSService.ts**: Replaced Twilio SDK with axios-based HTTP API calls to SMSAPI.lk
- **envConfig.ts**: Updated environment variables
  - Removed: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
  - Added: `SMSAPI_API_KEY`, `SMSAPI_SENDER_ID`
- **Types**: Updated SMS provider type from "twilio" to "smsapi.lk"
- **package.json**: Removed Twilio dependency

### 2. Environment Variables
```bash
# Old (Twilio)
TWILIO_ACCOUNT_SID=xxxx
TWILIO_AUTH_TOKEN=xxxx
TWILIO_PHONE_NUMBER=+xxx

# New (SMSAPI.lk)
SMSAPI_API_KEY=your-api-key
SMSAPI_SENDER_ID=HealthSense
```

### 3. Documentation Updates
- SETUP_DEPLOYMENT.md: Updated SMS configuration section
- QUICK_START_RABBITMQ.md: Updated troubleshooting guide
- RABBITMQ_INTEGRATION_GUIDE.md: Updated SMS credential references

## SMSAPI.lk API Details
- **Endpoint**: `https://api.smsapi.lk/api/SmsAPI/SendSingleSms`
- **Method**: POST
- **Request Body**:
  ```json
  {
    "API_KEY": "your-api-key",
    "SenderID": "HealthSense",
    "Message": "Your message",
    "MobileNumbers": "94713123456"
  }
  ```
- **Response**: `StatusCode: 200` on success

## Phone Number Format
- Remove country code prefix (e.g., +94 for Sri Lanka)
- SMSAPI.lk handles formatting internally
- Example: `+94713123456` → `0713123456`

## Setup Steps
1. Sign up at https://www.smsapi.lk
2. Get API Key from dashboard
3. Set environment variables in `.env`
4. Removed `npm uninstall twilio`
5. Service will use SMSAPI.lk automatically

## SMS Functions
All existing SMS methods are unchanged and work with SMSAPI.lk:
- `sendSMS()` - Generic SMS
- `sendAppointmentConfirmationSMS()`
- `sendAppointmentReminderSMS()`
- `sendPaymentConfirmationSMS()`
- `sendPrescriptionNotificationSMS()`
- `sendVerificationSMS()`

## Testing
```bash
curl -X POST http://localhost:5005/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "type": "sms",
    "category": "verification",
    "recipient": "+94713123456",
    "message": "Test message from HealthSense"
  }'
```

## Cost Benefit
- SMSAPI.lk: More affordable, local Sri Lankan provider
- Better for regional SMS distribution
- Faster response times for local numbers
