Payment Service
Responsibilities: Process payments for consultations and maintain transaction records.
Models:

Payment

paymentId (UUID)
appointmentId (FK)
userId (FK)
patientId (FK)
doctorId (FK)
amount
currency (LKR/USD)
paymentMethod (PayHere, Stripe, etc.)
stripePaymentIntentId
transactionId (from payment gateway)
status (pending, success, completed, failed, refunded)
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

Process appointment payments after doctor confirmation
Compute amount from doctor consultation fee at payment time
Update appointment payment status after payment/refund
Verify payment status
Process refunds
Payment history tracking
Generate payment reports

API Endpoints:

POST /api/payments/create
GET /api/payments/{id}
POST /api/payments/webhook
POST /api/payments/appointments/{appointmentId}/process
GET /api/payments/{paymentId}/status
POST /api/payments/{paymentId}/refund
GET /api/payments/patient/{patientId}/history