# GrowEasy AI-Powered CSV CRM Importer

An intelligent, full-stack, stateless web application designed to map arbitrary CSV lead lists directly to standardized CRM field mappings using LLM semantic matching, runtime Zod verification, and data normalization.

---

## 🎨 Key Features

- **Drag & Drop File Upload**: Dynamic browser drop zone with file type and size validations.
- **Client-Side CSV Previews**: Parses and lists the first 10 rows in a scrollable preview table before backend ingestion.
- **Dynamic Delimiter Autodetection**: Counts separator occurrences (`,` vs `;`) on the first line to parse files correctly.
- **Simulated Progress Trackers**: Displays progress statements (Uploading, AI Extraction, Validation) to preserve UI responsiveness.
- **Chunked Batching Loop**: Segments large files into chunks of 25 rows to conform to rate-limiting and context window parameters.
- **Exponential Retry Backoff**: Mitigates transient LLM rate-limit failures, retrying up to 3 times before routing rows to skipped metrics.
- **CRM Normalizers**: Cleanups for dates, emails, country prefix dialing codes, and semantic mapping of CRM statuses/sources.
- **Collapsible Warnings List**: Excel-aligned coordinate indexing mapping validation/LLM failures to row numbers with interactive JSON viewers.
- **Premium SaaS Dark Theme**: A responsive Dark-theme-first dashboard using Glassmorphism cards and smooth transitions.

---

## 🏗️ System Architecture

```
                       [Sales Operator (User)]
                                  │
                                  ▼ (Next.js SPA Interface)
                      [Frontend Next.js Client]
                                  │
                                  ▼ (POST /api/import - Multipart Upload)
                       [Express Backend Server]
                                  │
       ┌──────────────────────────┼──────────────────────────┐
       ▼ (Parser Stream)          ▼ (Batch Processor Loops)  ▼ (Field Norms / Zod)
[csv-parser & Delimiters]  [LLMProvider (OpenAIProvider)] [ValidationService]
                                  │
                                  ▼
                             OpenAI APIs
```

---

## 📂 Project Structure

This monorepo uses `npm workspaces` to orchestrate services:

```
├── shared/                       # Data schemas, Zod rules, and typescript types
├── backend/                      # Node.js + Express REST API server
├── frontend/                     # Next.js App Router SPA dashboard
├── docker/                       # Development & Production Dockers
└── docker-compose.yml            # Multi-service container compositor
```

---

## ⚙️ Environment Variables

### Backend Configuration (`backend/.env`)
- `PORT` (Default: `5000`): Port binding of the API server.
- `NODE_ENV` (Default: `development`): Environment mode (`development`, `production`, `test`).
- `OPENAI_API_KEY` (Required): Secret key for invoking OpenAI models.
- `ALLOWED_ORIGIN` (Default: `http://localhost:3000`): Client CORS request origin.

### Frontend Configuration (`frontend/.env`)
- `NEXT_PUBLIC_API_URL` (Default: `http://localhost:5000`): Ingestion server HTTP URL.

---

## 🚀 Local Installation

### Prerequisites
- Node.js (v20+)
- npm (v10+)
- An OpenAI API Key

### 1. Install Workspace Dependencies
Installs packages across workspaces and establishes symlinks:
```bash
npm install
```

### 2. Compile Shared Package
Builds typescript type files for shared contracts:
```bash
npm run build:shared
```

### 3. Running Development Servers
Starts the backend and frontend servers in watch mode:
```bash
# Start backend (Port 5000)
npm run dev:backend

# Start frontend (Port 3000)
npm run dev:frontend
```

---

## 🐳 Docker Container Orchestration

A single command builds and coordinates both application layers:

```bash
# Set OpenAI API key in your shell
export OPENAI_API_KEY="your-api-key"

# Orchestrate containers
docker-compose up --build
```
- Client dashboard: `http://localhost:3000`
- REST API server: `http://localhost:5000`

---

## 🧪 Testing Suites

Run all validation schemas, CSV parsers, prompt builders, normalizers, and client-side view states:

- **Monorepo Global Test**:
  ```bash
  npm test
  ```
- **Backend Tests (Jest + Supertest)**:
  ```bash
  npm run test:backend
  ```
- **Frontend Tests (Vitest + JSDOM)**:
  ```bash
  npm run test:frontend
  ```

---

## 📡 API Documentation

### `GET /health`
Validates environment parameters and database configurations.

**Response (200 OK)**:
```json
{
  "status": "healthy",
  "timestamp": "2026-07-10T12:00:00.000Z",
  "services": {
    "openai_api": "configured"
  }
}
```

### `POST /api/import`
Accepts a multipart CSV form payload, runs AI maps, Normalizes, validates schemas, and builds ingestion packages.

**Payload**:
- `file` (Multipart Form File): CSV sheet.

**Response (200 OK)**:
```json
{
  "success": true,
  "metadata": {
    "total_records": 100,
    "imported_records": 90,
    "skipped_records": 10,
    "processing_time_ms": 1420,
    "batch_count": 4
  },
  "records": [
    {
      "created_at": "2026-07-10T13:00:00.000Z",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "country_code": "91",
      "mobile_without_country_code": "9876543210",
      "company": "Growth Inc",
      "crm_status": "GOOD_LEAD_FOLLOW_UP",
      "data_source": "eden_park",
      "description": "Interested buyer."
    }
  ],
  "skipped": [
    {
      "row_index": 12,
      "raw_data": { "Name": "Broken Data" },
      "reason": "Record lacks both email address and mobile number. At least one is required."
    }
  ]
}
```

---

## ☁️ Deployment Guidelines

### Backend Ingestion Server (Render)
1. Set up a **Web Service** on Render.
2. Build command:
   ```bash
   npm install && npm run build -w shared && npm run build -w backend
   ```
3. Start command:
   ```bash
   npm start -w backend
   ```
4. Define Env variables: `OPENAI_API_KEY`, `ALLOWED_ORIGIN` (Points to Vercel client URL), `NODE_ENV=production`.

### Frontend Client (Vercel)
1. Add a project on Vercel importing the repository.
2. Select root directory: `./`
3. Configure Build Settings:
   - Build command: `npm run build -w frontend`
   - Output directory: `frontend/.next`
4. Define Env variables: `NEXT_PUBLIC_API_URL` (Points to Render server URL).
