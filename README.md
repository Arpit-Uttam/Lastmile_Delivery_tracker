# Last-Mile Delivery Tracker

A full-stack delivery management platform with auto-charge calculation, agent assignment, and real-time status tracking.

## Tech Stack

- **Backend**: Node.js, Express, Prisma ORM, PostgreSQL
- **Frontend**: React 18, Vite, TailwindCSS
- **Auth**: JWT (role-based: ADMIN / CUSTOMER / AGENT)
- **Notifications**: Nodemailer (SMTP / Ethereal dev), Twilio SMS

---

## Setup Guide

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Git

### 1. Clone & Install

```bash
git clone <repo-url>
cd delivery-tracker

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Backend Configuration

```bash
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET
```

### 3. Database Setup

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
node prisma/seed.js
```

### 4. Frontend Configuration

```bash
cd frontend
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000/api for local dev
# Or leave blank — Vite proxy handles /api → localhost:5000
```

### 5. Run

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Open http://localhost:5173

---

## Demo Credentials

| Role     | Email                    | Password    |
|----------|--------------------------|-------------|
| Admin    | admin@delivery.com       | admin123    |
| Customer | customer@example.com     | customer123 |
| Agent    | agent1@delivery.com      | agent123    |

---

## API Documentation

### Auth

| Method | Endpoint           | Auth     | Description          |
|--------|--------------------|----------|----------------------|
| POST   | /api/auth/register | Public   | Customer self-register |
| POST   | /api/auth/login    | Public   | Login, returns JWT   |
| GET    | /api/auth/me       | All      | Current user profile |

### Orders

| Method | Endpoint                      | Auth         | Description                      |
|--------|-------------------------------|--------------|----------------------------------|
| POST   | /api/orders/quote             | All          | Preview charge before placing    |
| POST   | /api/orders                   | Customer/Admin | Create order                   |
| GET    | /api/orders                   | All          | List orders (role-filtered)      |
| GET    | /api/orders/:id               | All          | Order detail + tracking history  |
| PATCH  | /api/orders/:id/status        | Agent/Admin  | Update order status              |
| PATCH  | /api/orders/:id/reschedule    | Customer/Admin | Reschedule failed delivery      |

### Admin

| Method | Endpoint                              | Auth  | Description              |
|--------|---------------------------------------|-------|--------------------------|
| GET    | /api/admin/stats                      | Admin | Dashboard stats          |
| GET    | /api/admin/customers                  | Admin | List all customers       |
| POST   | /api/admin/customers                  | Admin | Create customer          |
| POST   | /api/admin/orders/:id/auto-assign     | Admin | Auto-assign nearest agent |
| POST   | /api/admin/orders/:id/assign/:agentId | Admin | Manual agent assignment  |
| PATCH  | /api/admin/orders/:id/status          | Admin | Override any order status |

### Zones

| Method | Endpoint               | Auth  | Description        |
|--------|------------------------|-------|--------------------|
| GET    | /api/zones             | All   | List zones + areas |
| POST   | /api/zones             | Admin | Create zone        |
| DELETE | /api/zones/:id         | Admin | Delete zone        |
| POST   | /api/zones/:id/areas   | Admin | Add area to zone   |
| DELETE | /api/zones/areas/:id   | Admin | Remove area        |

### Rate Cards

| Method | Endpoint            | Auth  | Description      |
|--------|---------------------|-------|------------------|
| GET    | /api/rate-cards     | All   | List rate cards  |
| POST   | /api/rate-cards     | Admin | Create rate card |
| PUT    | /api/rate-cards/:id | Admin | Update rate card |
| DELETE | /api/rate-cards/:id | Admin | Delete rate card |

### Agents

| Method | Endpoint               | Auth  | Description            |
|--------|------------------------|-------|------------------------|
| GET    | /api/agents            | Admin | List all agents        |
| POST   | /api/agents            | Admin | Create agent           |
| PATCH  | /api/agents/:id        | Agent/Admin | Update location/status |
| POST   | /api/agents/:id/zones  | Admin | Assign zones to agent  |

### Public Tracking

| Method | Endpoint                          | Auth   | Description           |
|--------|-----------------------------------|--------|-----------------------|
| GET    | /api/tracking/:trackingNumber     | Public | Track by number       |

---

## DB Schema

```
User         — id, name, email, phone, password, role (ADMIN/CUSTOMER/AGENT)
Zone         — id, name
Area         — id, name, pincode, zoneId (FK → Zone)
RateCard     — id, name, orderType (B2B/B2C), isIntraZone, ratePerKg, minimumCharge, codSurcharge
Agent        — id, userId (FK → User), status (AVAILABLE/BUSY/OFFLINE), latitude, longitude
AgentZone    — agentId, zoneId (many-to-many)
Order        — id, trackingNumber, customerId, createdById, pickup/drop address+pincode+zoneId,
               package dims + weights, orderType, paymentType, status, charges, agentId,
               rescheduleDate, failureReason
TrackingEvent — id, orderId, status, note, actorId, actorRole, createdAt (immutable log)
```

---

## Rate Calculation Logic

1. **Zone Detection**: Look up pickup and drop pincodes in the `Area` table → get parent `Zone`
2. **Intra vs Inter**: Compare zone IDs — same zone = intra-zone rate, different = inter-zone rate
3. **Volumetric Weight**: `(L × B × H) ÷ 5000` (L/B/H in cm, result in kg)
4. **Chargeable Weight**: `max(actualWeight, volumetricWeight)`
5. **Rate Card Lookup**: Filter by `orderType` (B2B/B2C) and `isIntraZone` flag
6. **Base Charge**: `max(chargeableWeight × ratePerKg, minimumCharge)`
7. **COD Surcharge**: If `paymentType = COD` → `baseCharge × (codSurcharge / 100)`
8. **Total**: `baseCharge + codSurcharge`

All rates are admin-configured in the `RateCard` table — zero hardcoding.

---

## Deployment

### Render (recommended)

**Backend**:
- Build command: `npm install && npx prisma generate && npx prisma migrate deploy`
- Start command: `node src/index.js`
- Add environment variables from `.env.example`

**Frontend**:
- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Set `VITE_API_URL` to your backend Render URL

### Railway

Use the Railway PostgreSQL plugin, set `DATABASE_URL` automatically, and deploy both services with their respective build/start commands.
