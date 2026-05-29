 Doctor Management Service
Responsibilities: Manage doctor profiles, availability, and professional information.
Models:

Doctor

doctorId (UUID)
firstName, lastName
email, phoneNumber
specialization
qualification (array)
licenseNumber
experience (years)
consultationFee
biography
profileImage
isVerified (boolean)
rating (average)
createdAt, updatedAt


Availability

availabilityId (UUID)
doctorId (FK)
dayOfWeek
startTime, endTime
slotDuration (minutes)
isActive (boolean)


TimeSlot

slotId (UUID)
doctorId (FK)
date
startTime, endTime
status (available, booked, blocked)



Functionalities:

Doctor registration (pending admin verification)
Profile management
Set and manage availability schedules
Generate time slots based on availability
Block specific time slots
View appointment requests
Update consultation fees
View patient medical records (when authorized)

API Endpoints:

POST /api/doctors/register
PUT /api/doctors/{id}/profile
POST /api/doctors/{id}/availability
GET /api/doctors/{id}/time-slots
PUT /api/doctors/{id}/time-slots/{slotId}/block
GET /api/doctors/search?specialty={specialty}
GET /api/doctors/{id}/appointments

Internal Endpoints:

GET /internal/doctors/{id}/billing