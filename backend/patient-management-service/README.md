Patient Management Service
Responsibilities: Handle all patient-related operations and data management.
Models:

Patient

patientId (UUID)
firstName, lastName
email, phoneNumber
dateOfBirth, gender
address
bloodGroup
allergies (array)
emergencyContact
createdAt, updatedAt


MedicalHistory

historyId (UUID)
patientId (FK)
condition
diagnosisDate
notes


MedicalDocument

documentId (UUID)
patientId (FK)
documentType (lab report, scan, prescription, etc.)
fileName
fileUrl (cloud storage path)
uploadDate
description


Prescription

prescriptionId (UUID)
patientId (FK)
doctorId (FK)
appointmentId (FK)
medications (array)
dosage, frequency, duration
notes
issuedDate



Functionalities:

Patient registration and authentication
Profile management (CRUD operations)
Upload and manage medical documents
View medical history
View past and current prescriptions
Retrieve patient dashboard with summary

API Endpoints:

POST /api/patients/register
PUT /api/patients/{id}/profile
POST /api/patients/{id}/documents
GET /api/patients/{id}/medical-history
GET /api/patients/{id}/prescriptions
GET /api/patients/{id}/dashboard