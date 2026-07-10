# GrowEasy AI-Powered CSV CRM Importer

An intelligent, full-stack, stateless web application that maps arbitrary CSV lead lists to standardised CRM fields using LLM semantic matching, runtime Zod validation, and data normalisation.

🌐 **Live Demo**: [csv-importer-frontend-zeta.vercel.app](https://csv-importer-frontend-zeta.vercel.app)  
🔌 **Backend API**: [groweasy-crm-importer-api.onrender.com](https://groweasy-crm-importer-api.onrender.com)

---

## 🎨 Key Features

| Feature | Description |
|---|---|
| **Drag & Drop Upload** | Browser drop zone with file-type and size validation |
| **CSV Preview** | Parses and displays first 10 rows before processing |
| **Auto Delimiter Detection** | Counts `,` vs `;` occurrences to auto-detect separator |
| **AI Column Mapping** | LLM maps arbitrary headers to 14 standard CRM fields |
| **Dual AI Provider** | Auto-detects Groq (`gsk_`) or OpenAI (`sk-`) keys — no code changes needed |
| **Semantic Status Normalisation** | Maps `"interested"` → `GOOD_LEAD_FOLLOW_UP`, `"won"` → `SALE_DONE`, etc. |
| **Phone Number Splitting** | Extracts `country_code` and `mobile_without_country_code` automatically |
| **Streaming Progress** | Real-time NDJSON progress updates during batch processing |
| **Smart Batch Sizing** | 10 rows/batch for Groq free tier, 25 rows/batch for OpenAI |
| **Exponential Backoff Retries** | Retries transient failures up to 3× with 3s → 6s → 12s delays |
| **Zod Validation** | Validates every AI-mapped record against a strict CRM schema |
| **Skipped Records Panel** | Collapsible rows with exact validation failure reasons and raw data |
| **Import Metrics Dashboard** | Total records, imported leads, skipped rows, processing speed, batch stats |
| **Download CSV Export** | One-click download of all successfully mapped leads as a clean CSV |
| **Prompt Injection Defense** | Strips `=`, `+`, `-`, `@` operators from raw cell values |
| **Formula Injection Mitigation** | Prevents Excel macro triggers in downstream exports |
| **Virtualized Table** | High-performance rendering for large result sets |
| **Premium Dark Theme** | Glassmorphism cards, gradient typography, smooth micro-animations |

---

## 🏗️ Architecture

```
                       [Sales Operator (User)]
                                  │
                                  ▼  Drag & Drop CSV
                      [Frontend — Next.js on Vercel]
                                  │
                                  ▼  POST /api/import (multipart/form-data)
                       [Backend — Express on Render]
                                  │
          ┌───────────────────────┼──────────────────────┐
          ▼                       ▼                      ▼
  [CSVService]          [BatchProcessor]        [ValidationService]
  Auto-detects          10 or 25 rows/          Zod schema checks
  delimiter             batch → LLM             email+phone rules
                                  │
                    ┌─────────────┴─────────────┐
                    ▼ gsk_ key                  ▼ sk- key
             [Groq API]                   [OpenAI API]
         llama-3.1-8b-instant            gpt-4o-mini
           500K TPD free tier
```

---

## 📂 Project Structure

```
csv-importer/
├── shared/                     # Zod schemas, TypeScript types (LeadRecord, SkippedRecord)
│   └── src/
│       └── index.ts
├── backend/                    # Node.js + Express REST API
│   ├── src/
│   │   ├── config/             # env.config.ts — validated environment variables
│   │   ├── controllers/        # import.controller.ts, health.controller.ts
│   │   ├── middlewares/        # error.middleware.ts, upload.middleware.ts
│   │   ├── prompts/            # prompt-builder.ts — system + user prompt templates
│   │   ├── providers/          # openai.provider.ts — Groq/OpenAI dual-routing
│   │   ├── routes/             # health.routes.ts, import.routes.ts, swagger.routes.ts
│   │   ├── services/           # batch-processor.ts, csv.service.ts, validation.service.ts
│   │   └── utils/              # errors.ts, logger.ts, normalizers.ts
│   └── tests/                  # Jest + Supertest unit and integration tests
├── frontend/                   # Next.js 14 App Router SPA
│   ├── src/
│   │   ├── app/                # page.tsx — full UI, layout.tsx, globals.css
│   │   ├── hooks/              # useCSVImport.ts — streaming state machine
│   │   └── services/           # importService.ts — NDJSON stream reader
│   └── tests/                  # Vitest + Testing Library UI flow tests
├── demo_leads.csv              # 5-row quick demo file
├── demo_leads_excel.csv        # 200-row comprehensive test dataset
├── docker-compose.yml          # Multi-service container orchestration
└── README.md
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
NODE_ENV=development
OPENAI_API_KEY=your_key_here        # Groq key (gsk_...) OR OpenAI key (sk-...) — auto-detected
ALLOWED_ORIGIN=http://localhost:3000
```

> **Note on `OPENAI_API_KEY`**: Despite the variable name, you can put **either** a Groq API key (`gsk_...`) **or** an OpenAI API key (`sk-...`) here. The app auto-detects the provider from the key prefix.

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## 🚀 Local Development Setup

### Prerequisites
- **Node.js** v20+
- **npm** v10+
- A **Groq API Key** (free at [console.groq.com](https://console.groq.com/keys)) **or** an OpenAI API Key

### Step 1 — Clone & Install

```bash
git clone https://github.com/piyush06singhal/csv-importer.git
cd csv-importer
npm install
```

### Step 2 — Configure Environment

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env and set OPENAI_API_KEY to your Groq or OpenAI key

# Frontend
cp frontend/.env.example frontend/.env.local
# NEXT_PUBLIC_API_URL defaults to http://localhost:5000 — no change needed for local dev
```

### Step 3 — Build Shared Types

```bash
npm run build:shared
```

### Step 4 — Start Development Servers

```bash
# Terminal 1 — Backend API (http://localhost:5000)
npm run dev:backend

# Terminal 2 — Frontend UI (http://localhost:3000)
npm run dev:frontend
```

---

## 🐳 Docker Compose

Builds and runs both services in containers with a single command:

```bash
# Set your API key
export OPENAI_API_KEY="gsk_your_groq_key_here"

# Start both services
docker-compose up --build
```

- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000`
- **Swagger Docs**: `http://localhost:5000/api/docs`

---

## 🧪 Running Tests

```bash
# Run all tests across all workspaces (37 tests)
npm test

# Backend only (Jest + Supertest)
npm run test:backend

# Frontend only (Vitest + Testing Library)
npm run test:frontend
```

**Test Coverage:**
- ✅ CSV parsing (delimiter detection, empty rows, malformed data)
- ✅ Validation service (Zod schema enforcement, skipped record routing)
- ✅ Prompt builder (injection defence, JSON structure)
- ✅ Normalizers (phone splitting, status mapping, date parsing)
- ✅ Import integration (full pipeline with mocked LLM)
- ✅ Frontend UI flows (upload, progress, results, error states)

---

## 📡 API Reference

### `GET /health`

Returns service health status and environment configuration.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-07-10T12:00:00.000Z",
  "uptime": 3600,
  "services": {
    "ai_provider": "configured",
    "provider_type": "groq"
  }
}
```

### `POST /api/import`

Accepts a multipart CSV upload, runs AI mapping, validates, and streams results as NDJSON.

**Request:**
- `Content-Type: multipart/form-data`
- `file`: CSV file (max 250 rows, `.csv` extension required)

**Streaming Response (NDJSON):**

Progress chunks (emitted during processing):
```json
{"type": "progress", "stage": "Processing Batch 2/5", "percent": 43}
```

Final result chunk:
```json
{
  "type": "result",
  "data": {
    "success": true,
    "metadata": {
      "total_records": 5,
      "imported_records": 4,
      "skipped_records": 1,
      "processing_time_ms": 1521,
      "batch_count": 1,
      "failed_batches": 0,
      "retry_count": 0,
      "avg_batch_time_ms": 1521
    },
    "records": [
      {
        "name": "Bruce Wayne",
        "email": "bruce@wayne.com",
        "country_code": "1",
        "mobile_without_country_code": "5550199",
        "company": "Wayne Enterprises",
        "city": "Gotham",
        "lead_owner": "James Gordon",
        "crm_status": "GOOD_LEAD_FOLLOW_UP",
        "data_source": "eden_park",
        "possession_time": "Within 6 months",
        "description": "Wants follow-up on property plots."
      }
    ],
    "skipped": [
      {
        "row_index": 6,
        "raw_data": {"First Name": "Arthur", "Last Name": "Curry"},
        "reason": "Record lacks both email address and mobile number."
      }
    ]
  }
}
```

**Swagger UI**: Available at `/api/docs` when running locally.

---

## ☁️ Deployment

### Backend → Render

1. Create a **Web Service** on [render.com](https://render.com)
2. Connect your GitHub repo
3. Set **Root Directory**: `./` (monorepo root)
4. **Build Command**:
   ```bash
   npm install && npm run build -w shared && npm run build -w backend
   ```
5. **Start Command**:
   ```bash
   npm start -w backend
   ```
6. **Environment Variables** (in Render dashboard → Environment tab):

   | Key | Value |
   |---|---|
   | `OPENAI_API_KEY` | Your Groq key (`gsk_...`) or OpenAI key (`sk-...`) |
   | `ALLOWED_ORIGIN` | Your Vercel frontend URL (e.g. `https://csv-importer-frontend-zeta.vercel.app`) |
   | `NODE_ENV` | `production` |

### Frontend → Vercel

1. Import the GitHub repo on [vercel.com](https://vercel.com)
2. **Framework Preset**: Next.js (auto-detected)
3. **Root Directory**: `./` (monorepo root)
4. **Build Command**: `npm run build -w frontend`
5. **Output Directory**: `frontend/.next`
6. **Environment Variable**:

   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | Your Render backend URL (e.g. `https://groweasy-crm-importer-api.onrender.com`) |

---

## 🧪 Test Dataset

A ready-to-use demo file is included in the repository root:

| File | Rows | Purpose |
|---|---|---|
| `demo_leads.csv` | 5 rows | Quick smoke test (processes in ~1.5s) |
| `demo_leads_excel.csv` | 200 rows | Full stress test with international leads, split names, edge cases |

**Features tested by `demo_leads_excel.csv`:**
- Split `First Name` / `Last Name` columns → AI concatenates to `name`
- International phone formats (`+91`, `+1`, `+44`, `+86`, `+966`)
- Semantic status mapping (`interested`, `won`, `callback`, `no answer`)
- Missing email rows → partial validation
- Missing phone rows → partial validation  
- Rows with neither email nor phone → routed to skipped records

---

## 🔐 Security

- All secrets loaded via environment variables — never hardcoded
- `.env` files are listed in `.gitignore`
- CORS restricted to the configured `ALLOWED_ORIGIN` only
- File uploads restricted to `.csv` MIME type
- Prompt injection mitigation in AI system prompt
- Formula injection stripping (`=`, `+`, `-`, `@` prefixes removed from cell values)
- Security headers: `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind-free Vanilla CSS |
| **Backend** | Node.js, Express 4, TypeScript |
| **AI Providers** | Groq (`llama-3.1-8b-instant`) / OpenAI (`gpt-4o-mini`) |
| **Validation** | Zod |
| **CSV Parsing** | csv-parser |
| **Testing** | Jest, Supertest, Vitest, Testing Library |
| **Deployment** | Vercel (frontend), Render (backend) |
| **Containerisation** | Docker, Docker Compose |
| **Monorepo** | npm workspaces |
