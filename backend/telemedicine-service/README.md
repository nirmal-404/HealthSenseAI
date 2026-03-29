Telemedicine Service
Responsibilities: Facilitate real-time video consultations between patients and doctors.
Models:

VideoSession

sessionId (UUID)
appointmentId (FK)
doctorId (FK)
patientId (FK)
roomId (third-party video platform)
roomToken/URL
startTime
endTime
duration (minutes)
status (scheduled, active, completed, failed)
recordingUrl (optional)


SessionParticipant

participantId (UUID)
sessionId (FK)
userId (FK)
userRole (doctor/patient)
joinedAt
leftAt



Functionalities:

Generate video consultation room (via Agora/Twilio/Jitsi)
Provide access tokens for patients and doctors
Start and end video sessions
Track session duration
Store session metadata
Handle session reconnection
Enable chat during consultation (optional)
Record sessions (with consent)

API Endpoints:

POST /api/telemedicine/sessions/create
GET /api/telemedicine/sessions/{sessionId}/token
POST /api/telemedicine/sessions/{sessionId}/start
POST /api/telemedicine/sessions/{sessionId}/end
GET /api/telemedicine/sessions/{sessionId}/status
POST /api/telemedicine/sessions/{sessionId}/join