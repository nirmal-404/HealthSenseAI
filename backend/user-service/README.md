Authentication & Authorization Service
Responsibilities: Handle user authentication and role-based access control.
Models:

User

userId (UUID)
email
passwordHash
role (patient, doctor, admin)
isActive (boolean)
lastLogin
createdAt

Session

sessionId (UUID)
userId (FK)
token (JWT)
expiresAt
ipAddress
userAgent

Role

roleId (UUID)
roleName
permissions (array)

Functionalities:

User registration
User login/logout
Token generation and validation (JWT)
Role-based access control (RBAC)
Password reset
Email verification
Two-factor authentication (optional)
Session management

API Endpoints:

POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh-token
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET /api/auth/verify-email/{token}
