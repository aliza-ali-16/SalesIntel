# AI Sales Intelligence Multi-Agent System

An autonomous, full-stack sales enablement platform that automates the initial phases of the sales cycle. By employing a cooperative multi-agent orchestration team, the platform ingests raw CRM contact data, sanitizes records, performs corporate domain research, qualifies leads using normalized behavioral scoring equations, maps playbooks, drafts personalized B2B outreach emails, and coordinates daily scheduled follow-ups.

Designed with enterprise resilience in mind, the platform integrates dual-database persistence that automatically swaps database targets if your primary server fails, alongside dual-runtime agent engines (native Node.js or Python FastAPI).

---

## Table of Contents
1. [Problem Statement](#problem-statement)
2. [Solution](#solution)
3. [Features](#features)
4. [AI Agent Architecture](#ai-agent-architecture)
5. [System Architecture](#system-architecture)
6. [Tech Stack](#tech-stack)
7. [Folder Structure](#folder-structure)
8. [Prerequisites](#prerequisites)
9. [Environment Variables](#environment-variables)
10. [Installation & Setup](#installation--setup)
11. [Running the Project](#running-the-project)
12. [API Overview](#api-overview)
13. [Workflow](#workflow)
14. [AI Workflow & Decision Flow](#ai-workflow)
15. [Screenshots (Recommended)](#screenshots)
16. [Architecture Diagrams (Recommended)](#architecture-diagrams)
17. [Security](#security)
18. [Performance Optimizations](#performance-optimizations)
19. [Challenges & Solutions](#challenges)
20. [Future Work](#future-work)
21. [Contributing](#contributing)
22. [License](#license)
23. [Acknowledgements](#acknowledgements)

---

## Problem Statement

Modern sales organizations waste critical conversion opportunities due to structural operational bottlenecks:
* **Manual CRM Maintenance**: Representatives spend up to 60% of their day cleaning duplicates, formatting contact capitalization, and correcting emails instead of speaking to buyers.
* **Flawed Lead Prioritization**: Without automated lead scoring, representatives treat cold, window-shopping visitors with the same priority as hot, high-intent buyers, leading to poor time allocation and missed deals.
* **Personalization Bottlenecks**: Creating custom, high-converting outbound emails tailored to individual user behaviors is slow, labor-intensive, and difficult to scale.
* **Follow-up Inconsistency**: Outreach schedules are handled manually across multiple spreadsheets, leading to missed follow-up deadlines and inconsistent touchpoints.
* **Fragile Infrastructure**: Standard AI SaaS applications fail completely if internet latency spikes, API keys block, or database servers disconnect, halting core business pipelines.

---

## Solution

The **AI Sales Intelligence Multi-Agent System** resolves these issues by acting as an autonomous virtual sales enablement division:
* **Structured Data Cleansing**: Automatically validates, normalizes, and deduplicates uploaded CRM contacts.
* **Normalized Lead Scoring**: Calculates engagement scores using behavioral events (visits, opens, purchases) to triage contacts into Hot, Warm, and Cold categories.
* **Corporate Profile Research**: Performs corporate domain research to identify organization sizes, industry categories, and business pain points.
* **Personalized Outreach Composer**: Generates custom B2B outreach email copies by integrating LLMs with local Vector database memory to prevent repetitive messaging.
* **Resilient Dual-Persistence**: Automatically falls back to a local JSON-file database store if your primary MongoDB service goes offline.
* **Dual-Runtime Engine**: Executes agents natively inside Node.js or via an external Python FastAPI microservice.

---

## Features

* **JWT Session Portal**: Secure authentication and custom page route guards.
* **Resilient Dual-Mode Database**: Automatic fallback to local JSON databases if MongoDB is offline.
* **Visual CRM CSV Validator**: Drag-and-drop CSV upload with instant validation alerts.
* **Autonomous Triage Map**: Renders leads as card boards categorized by lead temperature (`HOT`, `WARM`, `COLD`) for immediate prioritization.
* **Interactive Email Center**: Split-pane layout showing draft lists on the left and HTML previews on the right, with copy, approve, and rewrite actions.
* **Real-Time Log Console**: Terminal emulator display streaming backend execution steps.
* **Socket.IO Event Alerts**: Emits instant UI alerts and badges when leads update or agents complete tasks.
* **Recharts Analytics Funnel**: Visualizes conversion drop-offs, lead counts, and predicted pipeline revenue.
* **Global Brand Persona Settings**: Configures the brand voice (Professional, Friendly, Aggressive) and saves settings to local storage.

---

## AI Agent Architecture

The platform splits complex workflows among seven specialized agents to ensure modular logic and output accuracy:

```
                  ┌──────────────────────────────┐
                  │        Manager Agent         │
                  └──────────────┬───────────────┘
                                 │ Orchestrates
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
┌────────────────┐      ┌────────────────┐      ┌────────────────┐
│  CRM Analyzer  │      │  Lead Scorer   │      │  Email Agent   │
└────────────────┘      └────────────────┘      └────────────────┘
```

1. **Manager Agent**: Coordinates the multi-agent pipeline, passes intermediate payloads sequentially, records execution logs, and manages database state.
2. **CRM Intelligence Agent (CRM Analyzer)**: Sanitizes input fields, standardizes header casing, converts emails to lowercase, removes duplicates, and flags churn risks.
3. **Customer Research Agent**: Parses email domains to lookup suggested companies, industry verticals, corporate pain points, and recommended sales approaches.
4. **Advanced Lead Scoring Agent**: Computes behavioral scores (0–100) using a normalized engagement equation:
   $$\text{Raw Score} = (\text{Visits} \times 3) + (\text{Email Opens} \times 5) + (\text{Purchases} \times 10)$$
   Triage threshold boundaries classify leads:
   - **HOT**: Score $\ge 80$
   - **WARM**: Score $50 \text{ to } 79$
   - **COLD**: Score $\le 49$
5. **Sales Strategy Agent**: Maps playbook campaigns based on lead categories and priority channels (Email, LinkedIn, Phone, or Meeting).
6. **Email Agent**: Accesses local Vector memory databases to review past campaign history. Composes personalized outbound email copy using Google Gemini LLMs, ensuring templates adapt if previous approaches failed.
7. **Revenue Forecast Agent**: Predicts expected revenue and overall cohort conversion probabilities, assigning value estimations (`HOT` leads valued at $\$5000$, `WARM` at $\$1500$, `COLD` at $\$100$).

---

## System Architecture

The application uses a decoupled, three-tier service architecture:

```
[Vite Frontend React Client] (Port 3000) ──(REST / Socket.IO)──► [Express API Gateway] (Port 5000)
                                                                       │
                                                      ┌────────────────┴────────────────┐
                                                      ▼                                 ▼
                                          [Node.js Embedded Agents]          [Python FastAPI Service] (Port 8000)
                                                      │                                 │
                                                      └────────────────┬────────────────┘
                                                                       ▼
                                                           [Dual Database Persistence]
                                                           - Primary: MongoDB
                                                           - Fallback: Local JSON Store
```

* **Frontend Client (React.js + Vite)**: Single Page Application (SPA) dashboard styled with a glassmorphism theme, Recharts visualizations, and Socket.IO real-time notification hooks.
* **API Gateway Tier (Node.js + Express.js)**: API controller validating session JWTs, parsing CSV uploads using `multer`, hosting MCP routes, running the background scheduler, and checking database connections.
* **AI Service Tier (Python FastAPI + Uvicorn)**: Houses the python agent classes and manages local cosine-similarity vector queries.
* **Dual Database Persistence**: Operates primarily on MongoDB. If MongoDB is offline during boot, Mongoose operations fall back to reading and writing local JSON files under `data/db_store/` using equivalent queries.

---

## Tech Stack

| Component | Technologies Used | Description |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Recharts, Socket.IO Client | SPA dashboard with a dark-theme glassmorphism design. |
| **Backend Gateway** | Node.js, Express.js, JWT Auth, Multer, CSV-Parser, Socket.IO | Webserver, authentication routes, and daily scheduled tasks. |
| **AI Python Service** | FastAPI, Uvicorn, Pandas, Google Generative AI SDK | REST endpoints for Python agent execution and LLM operations. |
| **Database** | MongoDB Server 8.0, Mongoose ODM, Custom Local JSON Store | Document database with automatic fallback files. |
| **LLMs & AI** | Google Gemini API (`gemini-1.5-flash`, `text-embedding-004`) | Generates personalized text and handles vector embeddings. |

---

## Folder Structure

```text
├── /ai_service             # Python FastAPI Multi-Agent microservice
│   ├── main.py             # FastAPI endpoints & routes
│   ├── agents.py           # Python Manager, Scorer, Research, Strategy, and Email agents
│   ├── vector_db.py        # Vector embedding generator and local float indices database
│   └── requirements.txt    # Python service dependencies
├── /backend                # Node/Express API server & MCP Memory Server
│   ├── /config             # Mongoose connection & JSON database fallback logic
│   ├── /middleware         # JWT authentication route guards
│   ├── /models             # Shared database schemas (schemas.js)
│   ├── /routes             # API routes: auth, crm, agents, mcp, status
│   ├── /services           # Embedded agent engine, scheduler, and WebSockets
│   ├── server.js           # Server boot entry point
│   ├── package.json        # Backend configuration
│   └── .env                # Backend environment variables
├── /frontend               # Vite + React + Tailwind CSS client dashboard
│   ├── /public             # Static assets and icons
│   ├── /src
│   │   ├── /components     # Sidebar, Header, ProtectedRoute layouts
│   │   ├── /context        # Global AuthContext & Axios instance headers
│   │   ├── /hooks          # useFetch, useSocket hooks
│   │   └── /pages          # Dashboard, Upload, Leads, FollowUps, Emails, Logs, Settings
│   ├── package.json        # Frontend configuration
│   └── index.html          # Entry HTML page
└── /data                   # Persistent database and local JSON file stores
    ├── /db                 # MongoDB local db directory target
    └── /db_store           # Local fallback JSON storage tables
```

---

## Prerequisites

* **Node.js**: Version 18.x or above.
* **Python**: Version 3.10 or above.
* **MongoDB**: Local MongoDB community server (v7.x or v8.x) or MongoDB Atlas cluster.
* **Google Gemini API Key**: Obtain a developer key from [Google AI Studio](https://aistudio.google.com/).

---

## Environment Variables

Configure these settings in a `.env` file in the `/backend` folder:

| Variable | Purpose | Example Value |
| :--- | :--- | :--- |
| `PORT` | Local port for Express API Gateway | `5000` |
| `MONGO_URI` | MongoDB Connection String | `mongodb://localhost:27017/sales_intelligence` |
| `JWT_SECRET` | Secret key used to sign JWT session payloads | `sales_intel_secret_key_2026_jwt` |
| `AI_SERVICE_URL` | Microservice URL for the Python AI service | `http://127.0.0.1:8000` |
| `USE_EMBEDDED_AGENTS` | Agent runtime selector (`true`, `false`, or `only_json`) | `only_json` (forces JSON fallback usage) |
| `GEMINI_API_KEY` | Google Generative AI developer access key | `AIzaSyD...` |
| `SMTP_HOST` | Outgoing SMTP mail server | `smtp.mailtrap.io` |
| `SMTP_PORT` | Port for SMTP mail server | `2525` |
| `SMTP_USER` | Username for SMTP mail server | `user_name_string` |
| `SMTP_PASS` | Password for SMTP mail server | `password_string` |
| `SMTP_FROM` | Dispatch sender address | `no-reply@salesplatform.com` |

---

## Installation & Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/ai-sales-intelligence.git
   cd ai-sales-intelligence
   ```

2. **Backend Setup**:
   ```bash
   cd backend
   npm install
   ```

3. **Frontend Setup**:
   ```bash
   cd ../frontend
   npm install
   ```

4. **Python Service Setup**:
   ```bash
   cd ../ai_service
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   pip install -r requirements.txt
   ```

---

## Running the Project

### Step 1: Launch the Database
Start your local MongoDB service. On Windows, you can point directly to the workspace data folder:
```powershell
& "C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe" --dbpath "c:\Users\PMLS\Desktop\AI Sales Intelligence\data\db" --port 27017
```
*(If MongoDB fails to start, the Express API will automatically fall back to local JSON storage files inside `data/db_store/` so the application runs perfectly regardless).*

### Step 2: Start the Python AI service
Ensure your virtual environment is active in `/ai_service`, then start Uvicorn:
```bash
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### Step 3: Start the Backend Gateway
Open a new terminal in `/backend`, configure your `.env` settings, and run:
```bash
npm start
```

### Step 4: Start the React Frontend
Open a new terminal in `/frontend` and run:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## API Overview

### Authentication Routes
* `POST /api/auth/register`
  * Input: `{ "name": "...", "email": "...", "password": "..." }`
  * Output: `{ "token": "...", "user": { "id": "...", "name": "...", "email": "..." } }`
* `POST /api/auth/login`
  * Input: `{ "email": "...", "password": "..." }`
  * Output: `{ "token": "...", "user": { ... } }`

### CRM Ingestion Routes
* `POST /api/crm/upload`
  * Input: Multipart Form Data with `.csv` file attachment.
  * Headers: `Authorization: Bearer <token>`
  * Output: `{ "message": "CRM File processed.", "details": { ... } }`

### Agent & Leads Routes
* `POST /api/agents/analyze`
  * Description: Manually triggers the multi-agent pipeline on the existing customer database.
* `GET /api/agents/leads`
  * Output: Array of leads sorted by score descending.
* `GET /api/agents/followups`
  * Output: Array of follow-up tasks joined with customer profiles.
* `GET /api/agents/emails`
  * Output: Array of email drafts.
* `POST /api/agents/emails/:id/regenerate`
  * Description: Re-runs the Email Agent to generate a new outbound draft.

### Model Context Protocol (MCP) Routes
* `POST /api/mcp/store`
  * Input: `{ "id": "...", "type": "...", "data": { ... } }`
  * Description: Saves agent execution logs and contexts.
* `GET /api/mcp/context/:id`
  * Output: Stored JSON context payload.

---

## Workflow

1. **Authentication**: The user logs in and receives a JWT token.
2. **CRM File Upload**: The user uploads a `.csv` file in the Upload Center.
3. **Multi-Agent Run**: The server parses the file, launches the agents, and streams logs to the console.
4. **Leads Prioritization**: Leads are scored and categorized into Hot, Warm, and Cold columns on the Leads page.
5. **Approvals**: The user reviews generated emails in the Approvals Center, edits if needed, and clicks Approve.
6. **Task Management**: Scheduled follow-up tasks populate the Follow-ups page.

---

## AI Workflow

```
[Raw Customer Record] ➔ [CRM Analyzer cleanses] ➔ [Lead Scorer evaluates metrics]
                                                           │
                                                           ▼
                                               [Triage Category assigned]
                                                - HOT  (Immediate contact)
                                                - WARM (Contact in 3 days)
                                                - COLD (Contact in 30 days)
                                                           │
                                                           ▼
                                                [Email Agent drafts copy]
                                                - Context checked in Vector DB
                                                - Prompt sent to Gemini
                                                - Custom draft saved
```

1. **Deduplication**: The CRM Analyzer cleans name formats, corrects emails, and removes duplicates.
2. **Behavior Evaluation**: The Lead Scorer calculates the raw score:
   $$\text{Visits} \times 3 + \text{Opens} \times 5 + \text{Purchases} \times 10$$
3. **Lead Temperature**: Normalizes scores and triages leads (HOT $\ge 80$, WARM $50 \text{ to } 79$, COLD $\le 49$).
4. **Outreach Timeline**: Sets outreach dates based on lead temperatures (HOT: immediate, WARM: 3 days, COLD: 30 days).
5. **Personalization**: The Email Agent drafts emails matching the customer's score, category, and behavior.
6. **Vector Memory Check**: The Email Agent queries the local vector database using `text-embedding-004` to retrieve past interactions and adjust its approach.

---

## Screenshots

* **Home & Landing Page**: Introducing the platform's multi-agent automation services.
* **Analytics Dashboard**: Dynamic Recharts metrics displaying expected revenue and lead distributions.
* **CRM Ingestion Center**: Drag-and-drop file uploader showing live upload statuses.
* **Leads Temperature Map**: Kanban cards categorized into Hot, Warm, and Cold columns.
* **Approvals Control Panel**: Review page allowing users to inspect, edit, and approve email drafts.
* **Email Client Center**: Workspace containing draft details, tone ratings, and rewrite controls.
* **Follow-up Calendar**: Ordered checklist of pending outreach actions.
* **Agent Operations Terminal**: Console streaming real-time execution logs from the agents.
* **Workspace Settings**: Workspace settings configuration panel.

---

## Architecture Diagrams

* **System Architecture**: Multi-tier architecture diagram showing React, Node API Gateway, Python FastAPI microservice, MongoDB, and Gemini endpoints.
* **Ingestion Sequence**: Sequence diagram showing interactions between the Client, Gateway, Manager Agent, Sub-agents, Database, and real-time updates.
* **Database ER Diagram**: Relationship mapping between Users, Customers, Follow-ups, Email drafts, and Agent logs.
* **Multi-Agent Workflow**: Flowchart displaying how raw inputs flow through CRM Analyzer, Lead Scorer, Sales Strategy, Email Agent, and Revenue Forecast.

---

## Security

* **Authentication**: Stateless JWT security authorization tokens.
* **Password Hashing**: Direct hashing using `bcryptjs` with 10 salt rounds.
* **Input Sanitization**: Regular expression sanitizers protect databases from injection attacks.
* **Upload Limits**: Multer limits upload size to 5MB and accepts only `.csv` files.
* **API Protection**: Route access is protected by JWT validation middleware.

---

## Performance Optimizations

* **Parallel Execution**: Sub-agents process scoring, research, and sales strategy workflows in parallel.
* **Database Fallback Drivers**: Custom database controllers use equivalent query functions to swap between MongoDB and local JSON files without performance drops.
* **Vite Compiling**: Vite asset packaging ensures fast page load speeds.
* **Optimized Vector Queries**: Cosine similarity calculations are cached to speed up vector lookups.

---

## Challenges

### 1. Multi-Runtime Orchestration (Node.js & Python)
* *Problem*: Sharing data between Python agents and the Node.js backend created communication delays.
* *Solution*: Designed a clean microservice API. We also built an **Embedded Node.js agent engine** so the system can run on JavaScript alone without external Python dependencies.

### 2. Database Resilience
* *Problem*: MongoDB crashes or setup issues could halt the application.
* *Solution*: Implemented an automatic database connection check. If MongoDB is offline, the backend redirects queries to local JSON files under `data/db_store/`.

### 3. API Limit Protections
* *Problem*: LLM API rate limits or network issues could crash the pipeline.
* *Solution*: Added template-based fallbacks to the agents, ensuring the pipeline finishes even if the LLM API is unavailable.

---

## Future Work

* **Outbound Channels**: Direct integrations with SMTP mail relays and the WhatsApp Business API.
* **CRM Synchronizations**: Automatic bi-directional syncing with HubSpot and Salesforce.
* **Voice AI Pre-Qualification**: Speech synthesis agents to handle initial lead outreach.
* **Revenue Analytics**: Time-series forecast agents to predict conversion trends.

---


