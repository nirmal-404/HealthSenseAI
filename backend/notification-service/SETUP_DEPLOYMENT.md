# Notification Service - Setup & Deployment Guide

## Prerequisites

- Node.js 16+ and npm
- MongoDB
- RabbitMQ
- Gmail account with app-specific password
- Twilio account with credentials

## Local Development Setup

### 1. Install Dependencies

```bash
cd backend/notification-service
npm install
```

### 2. Configure Environment Variables

Create or update `.env` file:

```bash
# Service Configuration
PORT=5005
NODE_ENV=development

# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/notification-service

# Email Configuration (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
EMAIL_FROM=HealthSense <noreply@healthsense.com>

# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+your-verified-number

# RabbitMQ Configuration
RABBITMQ_URL=amqp://guest:guest@localhost:5672
RABBITMQ_CONNECTION_RETRY_DELAY=5000
RABBITMQ_CONNECTION_MAX_RETRIES=10

# RabbitMQ Queue & Exchange Configuration
APPOINTMENT_EXCHANGE=appointments
APPOINTMENT_QUEUE=appointment_notifications
APPOINTMENT_ROUTING_KEY=appointment.booked

CONSULTATION_EXCHANGE=consultations
CONSULTATION_QUEUE=consultation_notifications
CONSULTATION_ROUTING_KEY=consultation.completed

# Notification Configuration
RETRY_ATTEMPTS=3
RETRY_DELAY=5000
NOTIFICATION_TIMEOUT=30000
BATCH_PROCESS_INTERVAL=60000

# Logging
LOG_LEVEL=info
ENV=local
```

### 3. Start RabbitMQ

#### Option A: Docker

```bash
docker run -d \
  --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  -e RABBITMQ_DEFAULT_USER=guest \
  -e RABBITMQ_DEFAULT_PASS=guest \
  rabbitmq:3-management

# Access RabbitMQ Management UI at http://localhost:15672
# Default credentials: guest/guest
```

#### Option B: Using docker-compose

```bash
# In project root
docker-compose up -d rabbitmq
```

### 4. Start MongoDB

```bash
# Using Docker
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  mongo:latest

# Update MONGO_URI in .env if needed
```

### 5. Start the Notification Service

#### Development Mode (with hot reload)

```bash
npm run dev

# Expected output:
# ╔════════════════════════════════════════════════════╗
# ║  Notification Service - Starting                   ║
# ║  Environment: development                          ║
# ║  Port: 5005                                        ║
# ║  Security: SSL/TLS Enabled                         ║
# ╚════════════════════════════════════════════════════╝
# 
# ✓ MongoDB connection established
# 🔗 Connecting to RabbitMQ: amqp://guest:guest@localhost:5672
# ✅ Connected to RabbitMQ
# 📋 Registering event handlers...
# ✓ Registered event handler for: appointment.booked
# ✓ Registered event handler for: consultation.completed
# 
# ✅ Notification Service Started
# Port: 5005
# Environment: development
# Email Service: ✓ Connected
# RabbitMQ: ✓ Connected
# Database: ✓ Connected
```

#### Production Mode

```bash
npm run build
npm run start
```

### 6. Verify Service is Running

```bash
curl http://localhost:5005/health

# Expected response:
# {
#   "status": "UP",
#   "code": 200,
#   "service": "notification-service"
# }
```

---

## Gmail Configuration

### Step 1: Generate App Password

1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer"
3. Google will generate a 16-character password
4. Copy this password and use it for `EMAIL_PASS` in `.env`

### Step 2: Verify Configuration

```bash
# Test email service (optional)
curl -X POST http://localhost:5005/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "type": "email",
    "category": "verification",
    "recipient": "test@example.com",
    "subject": "Test Email",
    "message": "This is a test email from HealthSense"
  }'
```

---

## Twilio Configuration

### Step 1: Get Credentials

1. Sign up at https://www.twilio.com
2. Get your Account SID and Auth Token from dashboard
3. Verify a phone number to use as `TWILIO_PHONE_NUMBER`

### Step 2: Update .env

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

### Step 3: Verify Configuration

```bash
# Test SMS service (optional)
curl -X POST http://localhost:5005/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "type": "sms",
    "category": "verification",
    "recipient": "+1234567890",
    "message": "This is a test SMS from HealthSense"
  }'
```

---

## Docker Deployment

### 1. Build Docker Image

```bash
cd backend/notification-service
docker build -t healthsense/notification-service:latest .
```

### 2. Run with docker-compose

```bash
# In project root
docker-compose up -d notification-service

# Logs
docker-compose logs -f notification-service
```

### 3. Docker Compose Configuration

The service should be defined in `docker-compose.yml`:

```yaml
services:
  notification-service:
    build:
      context: ./backend/notification-service
      dockerfile: Dockerfile
    container_name: notification-service
    ports:
      - "5005:5005"
    environment:
      - NODE_ENV=production
      - PORT=5005
      - MONGO_URI=mongodb://mongo:27017/notification-service
      - RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
      - EMAIL_HOST=smtp.gmail.com
      - EMAIL_PORT=465
      - EMAIL_SECURE=true
      - EMAIL_USER=${EMAIL_USER}
      - EMAIL_PASS=${EMAIL_PASS}
      - EMAIL_FROM=HealthSense <noreply@healthsense.com>
      - TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID}
      - TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN}
      - TWILIO_PHONE_NUMBER=${TWILIO_PHONE_NUMBER}
    depends_on:
      - rabbitmq
      - mongo
    networks:
      - healthsense-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5005/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  rabbitmq:
    image: rabbitmq:3-management
    container_name: rabbitmq
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      - RABBITMQ_DEFAULT_USER=guest
      - RABBITMQ_DEFAULT_PASS=guest
    networks:
      - healthsense-network
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq

  mongo:
    image: mongo:latest
    container_name: mongo
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=password
    networks:
      - healthsense-network
    volumes:
      - mongo_data:/data/db

volumes:
  rabbitmq_data:
  mongo_data:

networks:
  healthsense-network:
    driver: bridge
```

---

## Kubernetes Deployment

### 1. Create ConfigMap for Configuration

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: notification-service-config
  namespace: healthsense
data:
  PORT: "5005"
  NODE_ENV: "production"
  LOG_LEVEL: "info"
  MONGO_URI: "mongodb://mongo-service:27017/notification-service"
  RABBITMQ_URL: "amqp://guest:guest@rabbitmq-service:5672"
  EMAIL_HOST: "smtp.gmail.com"
  EMAIL_PORT: "465"
  EMAIL_SECURE: "true"
  EMAIL_FROM: "HealthSense <noreply@healthsense.com>"
  APPOINTMENT_EXCHANGE: "appointments"
  APPOINTMENT_QUEUE: "appointment_notifications"
  APPOINTMENT_ROUTING_KEY: "appointment.booked"
  CONSULTATION_EXCHANGE: "consultations"
  CONSULTATION_QUEUE: "consultation_notifications"
  CONSULTATION_ROUTING_KEY: "consultation.completed"
```

### 2. Create Secret for Credentials

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: notification-service-secrets
  namespace: healthsense
type: Opaque
stringData:
  EMAIL_USER: "your-email@gmail.com"
  EMAIL_PASS: "your-app-specific-password"
  TWILIO_ACCOUNT_SID: "your-account-sid"
  TWILIO_AUTH_TOKEN: "your-auth-token"
  TWILIO_PHONE_NUMBER: "+1234567890"
```

### 3. Create Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: notification-service
  namespace: healthsense
  labels:
    app: notification-service
spec:
  replicas: 2
  selector:
    matchLabels:
      app: notification-service
  template:
    metadata:
      labels:
        app: notification-service
    spec:
      containers:
      - name: notification-service
        image: healthsense/notification-service:latest
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 5005
          name: http
        envFrom:
        - configMapRef:
            name: notification-service-config
        env:
        - name: EMAIL_USER
          valueFrom:
            secretKeyRef:
              name: notification-service-secrets
              key: EMAIL_USER
        - name: EMAIL_PASS
          valueFrom:
            secretKeyRef:
              name: notification-service-secrets
              key: EMAIL_PASS
        - name: TWILIO_ACCOUNT_SID
          valueFrom:
            secretKeyRef:
              name: notification-service-secrets
              key: TWILIO_ACCOUNT_SID
        - name: TWILIO_AUTH_TOKEN
          valueFrom:
            secretKeyRef:
              name: notification-service-secrets
              key: TWILIO_AUTH_TOKEN
        - name: TWILIO_PHONE_NUMBER
          valueFrom:
            secretKeyRef:
              name: notification-service-secrets
              key: TWILIO_PHONE_NUMBER
        livenessProbe:
          httpGet:
            path: /health
            port: 5005
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 5005
          initialDelaySeconds: 10
          periodSeconds: 5
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi
```

### 4. Create Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: notification-service
  namespace: healthsense
  labels:
    app: notification-service
spec:
  type: ClusterIP
  ports:
  - port: 5005
    targetPort: 5005
    protocol: TCP
    name: http
  selector:
    app: notification-service
```

### 5. Deploy to Kubernetes

```bash
kubectl apply -f configmap.yaml
kubectl apply -f secret.yaml
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml

# Verify deployment
kubectl get pods -n healthsense
kubectl logs -f deployment/notification-service -n healthsense
```

---

## Monitoring & Logs

### Docker Logs

```bash
docker logs -f notification-service

# Follow specific lines
docker logs -f --tail 100 notification-service
```

### Kubernetes Logs

```bash
kubectl logs -f deployment/notification-service -n healthsense

# Get logs from specific pod
kubectl logs pod-name -n healthsense

# Get logs with timestamps
kubectl logs -f --timestamps=true deployment/notification-service -n healthsense
```

### Health Check

```bash
# Local development
curl http://localhost:5005/health

# Docker container
docker exec notification-service curl http://localhost:5005/health

# Kubernetes pod
kubectl exec -it pod-name -n healthsense -- curl http://localhost:5005/health
```

---

## Troubleshooting

### RabbitMQ Connection Issues

```bash
# Check RabbitMQ is running
docker ps | grep rabbitmq

# Check RabbitMQ logs
docker logs rabbitmq

# Access Management UI
# URL: http://localhost:15672
# Username: guest
# Password: guest
```

### MongoDB Connection Issues

```bash
# Check MongoDB is running
docker ps | grep mongo

# Connect to MongoDB
mongo -u admin -p password --authenticationDatabase admin

# Check notification-service database
use notification-service
db.notifications.find().limit(1)
```

### Email Service Issues

```bash
# Test email connection (from service logs)
# Look for: "Email Service: ✓ Connected"

# Verify credentials
# - EMAIL_USER must be a valid Gmail account
# - EMAIL_PASS must be app-specific password (not Gmail password)
# - EMAIL_HOST must be smtp.gmail.com
# - EMAIL_PORT must be 465 with EMAIL_SECURE=true
```

### SMS Service Issues

```bash
# Verify Twilio credentials in .env
# - TWILIO_ACCOUNT_SID starts with "AC"
# - TWILIO_AUTH_TOKEN is 32 characters
# - TWILIO_PHONE_NUMBER is verified in Twilio console

# Test SMS sending (from service logs)
# Look for: "SMS sent to +1234567890"
```

---

## Performance Tuning

### Database Optimization

- Create indexes on `userId`, `status`, `createdAt`
- Implement retention policy (delete old notifications after 30 days)
- Use database connection pooling

### RabbitMQ Optimization

- Increase prefetch count for better throughput
- Implement dead letter queue for failed messages
- Monitor queue length

### Email/SMS Optimization

- Batch send notifications when possible
- Implement rate limiting to avoid API throttling
- Monitor delivery reports

---

## Security Hardening

1. **Never commit credentials to git** - Use `.env.example` and `.gitignore`
2. **Use HTTPS** - In production, ensure all connections are encrypted
3. **Validate input** - All notification requests are validated
4. **Rate limiting** - Implement rate limiting on API endpoints
5. **Authentication** - Protect API endpoints with JWT or API keys

---

## Next Steps

1. See [RABBITMQ_EVENTS.md](./RABBITMQ_EVENTS.md) for event payload documentation
2. Review [README.md](./README.md) for API documentation
3. Integrate with Appointment Service to publish `appointment.booked` events
4. Integrate with Telemedicine Service to publish `consultation.completed` events
