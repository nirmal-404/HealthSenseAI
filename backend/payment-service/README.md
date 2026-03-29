Payment Service
Responsibilities: Process payments for consultations and maintain transaction records.
Models:

Payment

paymentId (UUID)
appointmentId (FK)
patientId (FK)
doctorId (FK)
amount
currency (LKR/USD)
paymentMethod (PayHere, Stripe, etc.)
transactionId (from payment gateway)
status (pending, completed, failed, refunded)
initiatedAt
completedAt


Invoice

invoiceId (UUID)
paymentId (FK)
invoiceNumber
items (array)
subtotal
tax
total
generatedAt


Refund

refundId (UUID)
paymentId (FK)
amount
reason
status (pending, processed, rejected)
requestedAt
processedAt



Functionalities:

Initialize payment for appointments
Process payments via third-party gateways
Handle payment callbacks/webhooks
Verify payment status
Generate invoices
Process refunds (for cancelled appointments)
Payment history tracking
Generate payment reports

API Endpoints:

POST /api/payments/initialize
POST /api/payments/verify
POST /api/payments/webhook
GET /api/payments/{paymentId}/status
POST /api/payments/{paymentId}/refund
GET /api/payments/invoice/{invoiceId}
GET /api/payments/patient/{patientId}/history