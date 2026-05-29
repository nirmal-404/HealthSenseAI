Appointment Service
Responsibilities: Handle appointment booking, modification, and tracking.
Models:

Appointment

appointmentId (UUID)
patientId (FK)
doctorId (FK)
appointmentDate
startTime, endTime
status (pending, confirmed, completed, cancelled, rejected)
appointmentType (video, in-person)
symptoms (text)
consultationNotes
paymentStatus
createdAt, updatedAt


AppointmentHistory

historyId (UUID)
appointmentId (FK)
statusChange
changedBy
timestamp
notes



Functionalities:

Search doctors by specialty, name, or location
Book new appointments
View available time slots
Modify appointment (reschedule)
Cancel appointments
Accept/reject appointment requests (doctor side)
Track appointment status in real-time
Generate appointment confirmations
Filter appointments by status, date, doctor

API Endpoints:

POST /api/appointments/book
GET /api/appointments/{id}
PUT /api/appointments/{id}/reschedule
DELETE /api/appointments/{id}/cancel
PUT /api/appointments/{id}/confirm (doctor)
PUT /api/appointments/{id}/reject (doctor)
GET /api/appointments/patient/{patientId}
GET /api/appointments/doctor/{doctorId}
GET /api/appointments/{id}/status

Internal Endpoints:

GET /internal/appointments/{id}/payment-context
PUT /internal/appointments/{id}/payment-status
GET /appointments/{id}
POST /appointments/confirm-payment