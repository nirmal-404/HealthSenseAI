Admin Management Service
Responsibilities: Platform administration and oversight.
Models:

Admin

adminId (UUID)
firstName, lastName
email, phoneNumber
role (super-admin, moderator)
permissions (array)
createdAt


DoctorVerification

verificationId (UUID)
doctorId (FK)
documents (array of submitted docs)
status (pending, approved, rejected)
reviewedBy (adminId)
reviewNotes
submittedAt
reviewedAt


PlatformStats

statsId (UUID)
date
totalPatients
totalDoctors
totalAppointments
totalRevenue
activeUsers



Functionalities:

Manage user accounts (patients, doctors, admins)
Verify doctor registrations and credentials
Suspend/activate user accounts
View platform analytics and statistics
Monitor financial transactions
Generate reports
Handle user complaints/disputes
Manage platform settings

API Endpoints:

GET /api/admin/users
PUT /api/admin/users/{userId}/status
GET /api/admin/doctors/pending-verification
PUT /api/admin/doctors/{doctorId}/verify
GET /api/admin/analytics
GET /api/admin/transactions
GET /api/admin/reports

