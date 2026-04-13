# 🔍 Centralized Logging & Monitoring System

A production-ready platform for collecting, storing, searching, analyzing and monitoring logs from multiple microservices in real-time.

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        SYSTEM OVERVIEW                          │
└─────────────────────────────────────────────────────────────────┘

  [Microservice A]  [Microservice B]  [Microservice C]
       │                  │                  │
       └──────────────────┼──────────────────┘
                          │  POST /api/logs
                          ▼
              ┌───────────────────────┐
              │   API Gateway         │
              │  (Express + Node.js)  │  ← JWT Auth, Validation
              └───────────┬───────────┘
                          │
              ┌───────────▼───────────┐
              │    Redis Queue        │  ← BullMQ, Priority Queue
              │  (log-processing)     │
              └───────────┬───────────┘
                          │
              ┌───────────▼───────────┐
              │    Log Worker         │  ← Scalable consumers
              │  (BullMQ Worker)      │  ← Retry on failure
              └─────┬─────────┬───────┘
                    │         │
         ┌──────────▼──┐  ┌───▼──────────┐
         │  MongoDB    │  │  Socket.io   │  ← Realtime push
         │  (persist)  │  │  (emit)      │
         └─────────────┘  └───┬──────────┘
                               │
              ┌────────────────▼──────────┐
              │   React Dashboard         │
              │  - Log table + filters    │
              │  - Live stream            │
              │  - Charts (Recharts)      │
              │  - Alerts                 │
              └───────────────────────────┘
                          │
              ┌───────────▼───────────┐
              │   Alert System        │  ← Redis sliding window
              │  - Email (Nodemailer) │  ← > 50 errors / 60s
              │  - Telegram Bot       │  ← Socket emit to UI
              └───────────────────────┘
```

### Data Flow

```
Log created by service
      │
      ▼
POST /api/logs  ──►  JWT auth  ──►  Validate  ──►  Redis Queue
                                                         │
                                                         ▼
                                                   BullMQ Worker
                                                    (concurrency=10)
                                                         │
                                        ┌────────────────┼────────────┐
                                        ▼                ▼            ▼
                                   MongoDB         Socket.io     Alert Check
                                  (persist)        (emit)       (Redis zset)
                                                      │               │
                                                      ▼               ▼
                                                  Dashboard       Email/Telegram
                                                 (real-time)       (if threshold)
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker Desktop (để chạy Redis + MongoDB)

### 1. Clone và cài đặt

```bash
git clone <repo>
cd centralized-logging

# Cài backend
cd backend && npm install
cp .env.example .env

# Cài frontend
cd ../frontend && npm install --legacy-peer-deps
```

### 2. Khởi động Docker (Redis + MongoDB)

```bash
docker run -d -p 6379:6379 --name redis redis:alpine
docker run -d -p 27017:27017 --name mongodb mongo:7.0
```

### 3. Seed users

```bash
cd backend
npx ts-node src/utils/seed.ts
```

### 4. Chạy hệ thống (3 terminal)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

**Terminal 3 - Simulator** (chờ Terminal 1 báo 🚀 Server running):
```powershell
cd backend
$body = '{"email":"admin@example.com","password":"admin123"}'
$response = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/login" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing
$json = $response.Content | ConvertFrom-Json
$env:SIMULATOR_TOKEN = $json.data.token
npx ts-node src/utils/simulator.ts
```

### 5. Mở dashboard

```
http://localhost:3000
```

**Tài khoản mặc định:**
| Email | Password | Role |
|-------|----------|------|
| admin@example.com | admin123 | Admin |
| dev@example.com | dev123 | Developer |

---

## 📦 Project Structure

```
centralized-logging/
├── backend/
│   ├── src/
│   │   ├── config/          # MongoDB + Redis connections
│   │   ├── controllers/     # Request handlers
│   │   ├── middlewares/     # Auth, error handling, validation
│   │   ├── models/          # Mongoose schemas (Log, User)
│   │   ├── queues/          # BullMQ queue setup
│   │   ├── routes/          # Express routes
│   │   ├── services/        # Business logic (log, alert, auth, socket)
│   │   ├── sockets/         # Socket.io server
│   │   ├── utils/           # Logger, cron jobs, simulator, seed
│   │   ├── workers/         # BullMQ log consumer
│   │   └── index.ts         # App entry point
│   ├── Dockerfile
│   ├── Dockerfile.worker
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/      # Sidebar, Header, Layout
│   │   │   ├── logs/        # LogTable, LogFilters, LiveStream, helpers
│   │   │   ├── charts/      # Timeline, LevelPie, ServiceBar
│   │   │   └── alerts/      # AlertBanner
│   │   ├── hooks/           # useAuth, useLogs, useRealtimeLogs
│   │   ├── pages/           # Dashboard, Logs, Live, Alerts, Services, Settings
│   │   ├── services/        # Axios API client, Socket.io client
│   │   └── types/           # TypeScript interfaces
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── docker-compose.yml
├── docker-compose.dev.yml
├── mongo-init.js
├── Makefile
└── README.md
```

---

## 🔌 API Reference

### Authentication
```
POST /api/auth/register   { email, password, name, role? }
POST /api/auth/login      { email, password }
GET  /api/auth/me         → current user (Bearer token required)
```

### Logs
```
POST /api/logs            { service, level, message, timestamp?, metadata?, traceId? }
POST /api/logs/batch      { logs: [...] }  (max 100)
GET  /api/logs            ?service=&level=&search=&startTime=&endTime=&page=&limit=
GET  /api/logs/stats      ?hours=24
GET  /api/logs/services
GET  /api/logs/queue-stats  (admin only)
```

### Log Schema
```json
{
  "service": "payment-service",
  "level": "error",
  "message": "Payment gateway timeout after 5000ms",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "metadata": { "orderId": "ORD-123", "amount": 99.99 },
  "traceId": "abc-def-123"
}
```

---

## ⚡ Realtime (Socket.io)

Connect from client:
```javascript
const socket = io('http://localhost:3001', {
  auth: { token: 'your-jwt-token' }
});

// Listen for new logs
socket.on('new-log', (log) => console.log(log));

// Listen for alerts
socket.on('alert', (alert) => console.warn(alert));

// Filter by service
socket.emit('subscribe:service', 'payment-service');

// Filter by level
socket.emit('subscribe:level', 'error');
```

---

## 🚨 Alert System

Alerts fire when a service exceeds **50 errors in 60 seconds**.

- Uses Redis sorted sets as a sliding window counter
- 5-minute cooldown between alerts per service
- Emits alert via Socket.io to dashboard
- Sends email (if `SMTP_*` configured)
- Sends Telegram message (if `TELEGRAM_*` configured)

Change thresholds in `backend/.env`:
```
ERROR_THRESHOLD=50
ERROR_WINDOW_SECONDS=60
```

---

## 🗄 Database Design

### Log Collection Indexes

| Index | Type | Purpose |
|-------|------|---------|
| `{ service, level }` | Compound | Filter by service + level |
| `{ timestamp: -1 }` | Single | Time-range queries |
| `{ level, timestamp: -1 }` | Compound | Dashboard queries |
| `{ message: 'text' }` | Text | Full-text search |
| `{ createdAt: 1 }` | TTL (7d) | Auto-delete old logs |

---

## 📈 Scalability

**Horizontal scaling:**
```bash
# Scale workers to handle higher throughput
docker-compose up -d --scale worker=5
```

**Fault tolerance:**
- BullMQ retries failed jobs 3× with exponential backoff
- MongoDB `maxPoolSize=10` with reconnect logic
- Redis retryStrategy with exponential backoff
- Docker restart policies: `unless-stopped`

---

## 🔒 Security

- JWT authentication on all API endpoints
- Role-based access: `admin` / `developer`
- Helmet.js security headers
- Input validation (express-validator)
- Non-root Docker user
- Rate limiting via Redis (alert cooldown)

---

## 🧩 Bonus Features Implemented

- ✅ **Log retention** – TTL index auto-deletes after 7 days + cron fallback
- ✅ **Role-based access** – admin/developer roles via JWT
- ✅ **Multi-service simulation** – 6 fake services generating realistic logs
- ✅ **JWT security** – all API endpoints protected
- ✅ **Batch ingest** – POST /api/logs/batch (up to 100 logs)
- ✅ **Email alerts** – Nodemailer with HTML template
- ✅ **Telegram alerts** – Bot API integration
- ✅ **Horizontal scaling** – workers scale independently
- ✅ **Admin Panel** – quản lý user, xóa logs, queue stats, alert config