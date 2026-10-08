# LANZEY — Coal Intelligence Portal

> From Documents → Verified Data → AI Insights → Automated Reports → Better Mining Decisions

---

## Architecture

```
Frontend  (React 18 + Vite + TypeScript + Tailwind)  → localhost:5173
Backend   (Node.js + Express.js)                      → localhost:4000
Database  (PostgreSQL + Prisma ORM)                   → localhost:5432
```

---

## Prerequisites

- Node.js 18+
- PostgreSQL 15+ running locally
- npm

---

## Setup — Step by Step

### 1. Clone / open the project

```
cd "coal intellegence"
```

### 2. Frontend dependencies (already installed if you ran npm install)

```
npm install
```

### 3. Backend setup

```
cd server
npm install
```

### 4. Configure database

Create a PostgreSQL database:

```sql
CREATE DATABASE lanzey_db;
```

Copy `.env.example` to `.env` and set your credentials:

```
cd server
copy .env.example .env
```

Edit `server/.env`:
```
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/lanzey_db"
JWT_SECRET="your-long-random-secret-here"
```

### 5. Push schema and generate Prisma client

```
cd server
npx prisma db push
npx prisma generate
```

### 6. Seed the database

```
cd server
node src/utils/seed.js
```

This creates:
- 7 demo users (one per role)
- 10 mine sites
- 70 production records (2020–2026)
- Geological seam data
- Reserve records
- Machinery + maintenance + telemetry
- Environmental monitoring data
- Risk items

### 7. Start the backend

```
cd server
npm run dev
```

Backend runs on: http://localhost:4000
Health check: http://localhost:4000/api/health

### 8. Start the frontend

In the root project folder:

```
npm run dev
```

Frontend runs on: http://localhost:5173

---

## Demo Accounts

| Email | Password | Role | Dashboard |
|-------|----------|------|-----------|
| admin@lanzey.in | lanzey123 | ADMIN | /dashboard/admin |
| cil@lanzey.in | lanzey123 | CIL | /dashboard/cil |
| cmpdi@lanzey.in | lanzey123 | CMPDI | /dashboard/cmpdi |
| geo@lanzey.in | lanzey123 | GEOLOGICAL | /dashboard/geological |
| env@lanzey.in | lanzey123 | ENVIRONMENT | /dashboard/environment |
| mach@lanzey.in | lanzey123 | MACHINERY | /dashboard/machinery |
| reserve@lanzey.in | lanzey123 | RESERVE_CHECKER | /dashboard/reserve |

---

## Routes

### Public
- `/` — Landing page (preserved exactly)
- `/login` — Login page

### Application (authenticated)
- `/dashboard` — Overview dashboard
- `/documents` — Document processing pipeline
- `/ask` — Ask LANZEY AI query
- `/risk` — Risk Intelligence
- `/reports/generate` — Automated report generator
- `/query/official` — Parliamentary/Official Query Assistant

### Department Dashboards (role-gated)
- `/dashboard/cil` — CIL Operations
- `/dashboard/cmpdi` — CMPDI
- `/dashboard/geological` — Geological
- `/dashboard/environment` — Environmental
- `/dashboard/machinery` — Machinery
- `/dashboard/reserve` — Reserve Verification
- `/dashboard/admin` — Admin

---

## API Endpoints

```
GET  /api/health
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
POST /api/auth/register

GET  /api/sites
GET  /api/sites/:id

GET  /api/documents
POST /api/documents/upload
GET  /api/documents/:id
GET  /api/documents/:id/status
DELETE /api/documents/:id

GET  /api/production
GET  /api/production/summary
GET  /api/production/trend

GET  /api/geology
GET  /api/geology/seams
GET  /api/geology/summary
GET  /api/geology/:siteId/detail

GET  /api/machinery
GET  /api/machinery/summary
GET  /api/machinery/:id
GET  /api/machinery/:id/telemetry
GET  /api/machinery/:id/maintenance

GET  /api/environment
GET  /api/environment/compliance-summary

GET  /api/reserve
GET  /api/reserve/summary

GET  /api/risk
GET  /api/risk/summary
GET  /api/risk/:id

GET  /api/reports
POST /api/reports/generate
GET  /api/reports/:id
DELETE /api/reports/:id

POST /api/query
POST /api/query/official

GET  /api/admin/users
PATCH /api/admin/users/:id
DELETE /api/admin/users/:id
GET  /api/admin/stats
GET  /api/admin/activity
```

---

## Data Flow

```
Upload Document → /api/documents/upload
  → File saved to server/uploads/
  → Pipeline: UPLOADED → EXTRACTING → PROCESSING → AI_ANALYSIS → INDEXED → READY
  → Status polled via /api/documents/:id/status

Ask LANZEY → /api/query
  → Intent parsed from question
  → PostgreSQL queried
  → Structured answer + source references returned

Generate Report → /api/reports/generate
  → Fetches relevant data from all tables
  → Builds structured report with source traceability
  → Returns JSON report content + sources + disclaimer

Official Query → /api/query/official
  → Identifies mine + period from question
  → Retrieves production trend data
  → Returns trend + chart data + export-ready response
```

---

## Security

- JWT Bearer token authentication
- bcrypt password hashing (cost factor 12)
- Helmet.js security headers
- CORS restricted to frontend origin
- Rate limiting: 200 req/15min general, 20 req/15min auth
- RBAC middleware on all department routes
- Input validation via express-validator
- No plaintext passwords stored or exposed

---

## Known Limitations

1. **Document text extraction** is simulated (pipeline advances on timer). Real OCR requires integrating Tesseract.js or a cloud OCR API.
2. **AI extraction of geological fields** from uploaded PDFs is not implemented — requires an LLM API (OpenAI, etc.) integration.
3. **Chart exports** are text-format only; PDF export requires a library like puppeteer.
4. **Real-time telemetry** uses seeded static data; live SCADA integration requires WebSocket connections to actual equipment.
5. **Reserve calculations** only show source data; automated verification requires domain-specific calculation models.
