# ProctoCode

[![Live Site](https://img.shields.io/badge/🚀_Live_Site-Visit_ProctoCode-blue?style=for-the-badge&logo=vercel)](https://procto-code-client.vercel.app/)

**AI-powered proctored coding interview platform** — create isolated interview sessions, monitor candidate behavior in real time, and let AI analyze trust, code quality, and session outcomes.

Built with **Next.js 15 · Express · MongoDB · Socket.IO · Groq AI (Llama 3.3)**

---

## ✨ Features

### 🔐 Authentication & Roles
- JWT-based signup/login with role selection (**Admin** or **Candidate**)
- OTP password reset via SMTP email delivery
- Route-level middleware protection with role-based redirects

### 🧑‍💼 Admin Dashboard
- Create named interview sessions with unique join codes
- Attach AI-generated coding problems (difficulty + topic based)
- Set session duration and manage active/inactive sessions
- Real-time monitoring of connected candidates via Socket.IO
- View per-candidate trust scores, behavior logs, and timelines
- AI-powered session summaries — top performers, flagged candidates, and recommendations

### 👨‍💻 Candidate Workspace
- Join sessions with a session code
- Rules gate + fullscreen enforcement before entering the editor
- Monaco-based code editor with multi-language support
- Run code against test cases in a secure server-side sandbox
- Submit final solutions for AI code review

### 🛡️ Behavior Tracking & Trust Score
- Real-time tracking of suspicious events: tab switches, paste actions, inactivity, fast typing
- Trust score starts at 100 and decreases based on flagged behavior
- Live behavior events pushed to admin dashboards via WebSockets
- Full audit trail stored in MongoDB

### 🤖 AI Integration (Groq — Llama 3.3 70B)
- **Code Review** — quality score, complexity analysis, readability, issues, and suggestions
- **Problem Generation** — generate interview problems with test cases by difficulty and topic
- **Behavior Analysis** — pattern-based risk assessment with suspicious/innocent pattern detection
- **Session Summary** — aggregate insights, flagged candidates, and hiring recommendations

### 🏗️ Secure Code Sandbox
- Server-side code execution in isolated temp directories
- Support for **JavaScript, Python, Java, C, and C++**
- Dangerous pattern blocking (file system, network, process calls)
- Compile + run pipeline with configurable timeout and memory limits
- Test case runner with expected output comparison

### 👁️ Evaluator View
- Read-only access to session data and candidate performance
- Review past sessions with trust scores and AI analysis

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15 (App Router, Turbopack), React 19, TypeScript |
| **Styling** | Tailwind CSS 3 |
| **Editor** | Monaco Editor (`@monaco-editor/react`) |
| **Charts** | Recharts |
| **Backend** | Express 4, TypeScript (ESM) |
| **Database** | MongoDB with Mongoose 8 |
| **Auth** | JWT + bcryptjs, HTTP-only cookies |
| **Real-time** | Socket.IO 4 (JWT-authenticated connections) |
| **AI** | Groq SDK (Llama 3.3 70B Versatile) |
| **Email** | Nodemailer (SMTP) |
| **DevOps** | Docker, Docker Compose, npm Workspaces |

---

## 📁 Project Structure

```text
proctocode/
├── client/                        # Next.js frontend
│   ├── app/
│   │   ├── admin/                 # Admin dashboard page
│   │   ├── dashboard/             # Candidate dashboard page
│   │   ├── evaluator/             # Evaluator view page
│   │   ├── join/                  # Session join page
│   │   ├── login/                 # Login page
│   │   ├── signup/                # Signup page
│   │   ├── forgot-password/       # OTP password reset
│   │   └── api/                   # Next.js API routes (auth proxy)
│   ├── components/
│   │   ├── admin-dashboard.tsx    # Admin session management UI
│   │   ├── admin-user-monitor.tsx # Live candidate monitoring
│   │   ├── ai-behavior-analysis.tsx
│   │   ├── ai-code-review.tsx     # AI code review display
│   │   ├── ai-session-summary.tsx # AI session summary panel
│   │   ├── candidate-workspace.tsx# Full coding workspace
│   │   ├── code-sandbox.tsx       # Monaco editor + run/submit
│   │   ├── evaluator-dashboard.tsx
│   │   ├── session-rules-gate.tsx # Fullscreen rules enforcement
│   │   └── ...
│   ├── hooks/
│   │   └── use-behavior-tracking.ts  # Client-side behavior tracker
│   ├── lib/                       # Auth helpers, API clients
│   ├── middleware.ts              # Route protection + role redirects
│   └── Dockerfile
│
├── server/                        # Express backend
│   ├── src/
│   │   ├── config/                # Env loading, MongoDB connection
│   │   ├── controllers/           # Auth, Session, AI, Sandbox, Monitor, Logs, Trust Score
│   │   ├── middlewares/           # JWT auth middleware
│   │   ├── models/                # User, Session, UserSession, Log, PasswordResetOTP
│   │   ├── routes/                # RESTful API routes
│   │   ├── services/              # Auth, AI, Sandbox, Session, Email services
│   │   ├── sockets/               # Socket.IO setup + behavior event broadcasting
│   │   ├── utils/                 # JWT helpers
│   │   ├── app.ts                 # Express app configuration
│   │   └── server.ts              # Server bootstrap
│   ├── .env.example
│   └── Dockerfile
│
├── docker-compose.yml             # Full stack orchestration
├── package.json                   # Root workspace scripts
└── tsconfig.base.json             # Shared TypeScript config
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **MongoDB** (local or Atlas)
- **SMTP credentials** for email OTP (Gmail App Password, Mailtrap, etc.)
- **Groq API key** (free at [console.groq.com](https://console.groq.com)) for AI features

### Installation

```bash
# Clone the repository
git clone https://github.com/DevPatel1102/ProctoCode.git
cd ProctoCode

# Install all dependencies (client + server)
npm install

# Configure environment
cp server/.env.example server/.env
# Edit server/.env with your values
```

### Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Server port (default `5000`) |
| `CLIENT_ORIGIN` | Frontend URL (default `http://localhost:3000`) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for signing JWTs |
| `JWT_EXPIRES_IN` | Token expiry (e.g. `7d`) |
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP port (e.g. `587`) |
| `SMTP_SECURE` | Use TLS (`true`/`false`) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `SMTP_FROM` | Sender address |
| `GROQ_API_KEY` | Groq API key for AI features |

### Run Locally

```bash
# Start both client and server concurrently
npm run dev

# Or run them separately
npm run dev:client    # http://localhost:3000
npm run dev:server    # http://localhost:5000
```

### Run with Docker

```bash
docker-compose up --build
```

This spins up the client, server, and a MongoDB instance automatically.

---

## 🔌 API Routes

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/signup` | Register a new user |
| `POST` | `/api/auth/login` | Login and receive JWT |
| `POST` | `/api/sessions` | Create a new session (admin) |
| `GET` | `/api/sessions` | List sessions |
| `POST` | `/api/sessions/:id/join` | Join a session (candidate) |
| `POST` | `/api/sandbox/run` | Execute code in sandbox |
| `POST` | `/api/sandbox/submit` | Submit code against test cases |
| `POST` | `/api/ai/review` | AI code review |
| `POST` | `/api/ai/generate-problem` | AI problem generation |
| `POST` | `/api/ai/analyze-behavior` | AI behavior analysis |
| `POST` | `/api/ai/session-summary` | AI session summary |
| `GET` | `/api/monitor/:sessionId` | Get session monitor data |
| `GET` | `/api/trust-score` | Get trust score for a session |
| `POST` | `/api/logs` | Create a behavior log entry |

---

## 🧪 Quick Verification

1. Open `http://localhost:3000` — confirm the landing page loads
2. Open `http://localhost:5000/api/health` — confirm the server returns JSON
3. Create an admin account → create a session → share the code
4. Create a candidate account → join the session → accept rules → start coding
5. Watch live behavior events appear on the admin monitoring view

---

## 📄 License

This project is for educational and portfolio purposes.
