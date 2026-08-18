# BiyaEase 🇵🇭

> **BiyaEase** is a Philippine commute navigation application designed to help users find and understand public transportation routes across jeepneys, UV Express, buses, MRT/LRT rail lines, tricycles, and walking transfers.

---

## 🚀 Project Overview

Navigating public transit in the Philippines involves a complex network of traditional jeepneys, modern PUVs, UV Express vans, buses, and elevated rail transit. BiyaEase simplifies the daily commute by providing clear, practical guidance on:

- Where to board and alight
- Which vehicle or route line to take
- Estimated fares and travel durations
- Number of transfers and walking segments

---

## 🛠️ Technology Stack

| Component           | Technology                     |
| ------------------- | ------------------------------ |
| **Mobile App**      | React Native, Expo, TypeScript |
| **Backend API**     | Node.js, Express, TypeScript   |
| **Database**        | PostgreSQL + PostGIS           |
| **Admin Dashboard** | React, Vite, TypeScript        |
| **Infrastructure**  | Railway                        |
| **Package Manager** | npm (Workspaces)               |

---

## 📁 Project Structure

```
BiyaEase/
├── mobile/             # React Native / Expo commuter mobile application
├── server/             # Node.js Express REST API backend
├── dashboard/          # React + Vite admin management interface
├── data/
│   └── gtfs/           # GTFS transit feeds storage directory
├── docs/
│   └── architecture.md # Architecture specification and 18-phase roadmap
├── .env.example        # Environment variables template
├── .gitignore          # Git exclusion rules
├── package.json        # Root monorepo workspace configuration
└── README.md           # Project documentation
```

---

## 📋 Development Requirements

- **Node.js**: `v20.x` or `v22.x`+ (`v24.x` compatible)
- **npm**: `v10.x`+
- **PostgreSQL**: `15+` with **PostGIS** extension (optional for Phase 0 runtime testing)
- **Expo Go** app (optional for physical device testing)

---

## ⚙️ Installation & Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/andreicrp/BiyaEase.git
   cd BiyaEase
   ```

2. **Install all dependencies across the monorepo:**

   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   ```bash
   cp .env.example .env
   ```
   > [!IMPORTANT]
   > Real secrets, API keys, and database passwords must **never** be committed to Git. The `.env` file is excluded in `.gitignore`.

---

## 🏃 Running the Applications

### 1. Backend Server API

```bash
# Start development server with hot-reloading
npm run dev:server

# Build for production
npm run build:server

# Start compiled production server
npm run start --workspace=server
```

- API Base URL: `http://localhost:5000`
- Health Check: `http://localhost:5000/api/health`

### 2. Mobile Application (Expo)

```bash
# Start Expo development bundler
npm run dev:mobile
```

- Press `w` to open in web browser.
- Press `a` for Android emulator or `i` for iOS simulator.
- Scan the QR code with **Expo Go** on your physical device.

### 3. Admin Dashboard (Vite)

```bash
# Start Vite development server
npm run dev:dashboard

# Build production bundle
npm run build:dashboard
```

- Local URL: `http://localhost:5173`

---

## 🗄️ Database Setup (PostgreSQL + PostGIS)

1. Create a local PostgreSQL database:
   ```sql
   CREATE DATABASE biyaease_dev;
   ```
2. Enable PostGIS:
   ```sql
   \c biyaease_dev;
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```
3. Set your `DATABASE_URL` in `.env`:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/biyaease_dev
   ```
4. Test database connection & PostGIS availability:
   ```bash
   npm run db:test --workspace=server
   ```

---

## 📜 Available Scripts

| Command                 | Action                                                    |
| ----------------------- | --------------------------------------------------------- |
| `npm run dev:server`    | Starts backend in development mode (`tsx watch`)          |
| `npm run dev:mobile`    | Starts mobile Expo development server                     |
| `npm run dev:dashboard` | Starts dashboard Vite development server                  |
| `npm run build`         | Builds server and dashboard for production                |
| `npm run typecheck`     | Typechecks all packages (`server`, `mobile`, `dashboard`) |
| `npm run lint`          | Runs ESLint across the codebase                           |
| `npm run lint:fix`      | Automatically fixes linting issues                        |
| `npm run format`        | Formats codebase using Prettier                           |
| `npm run format:check`  | Verifies formatting compliance                            |

---

## 🌐 Example API Endpoints

### Health Check

```http
GET /api/health
```

**Response (200 OK):**

```json
{
  "status": "ok",
  "service": "biyaease-api"
}
```

### Root API Info

```http
GET /
```

**Response (200 OK):**

```json
{
  "name": "BiyaEase API",
  "version": "0.1.0",
  "description": "Philippine Public Transportation & Commute Navigation API",
  "environment": "development",
  "docs": "/api/health"
}
```

---

## 🗺️ Phase Roadmap

- [x] **Phase 0**: Project Foundation
- [ ] **Phase 1**: UI/UX Foundation (Mock screens & design system)
- [ ] **Phase 2**: Database Schema & PostGIS Models
- [ ] **Phase 3**: GTFS Importer
- [ ] **Phase 4**: Map System (Google Maps Platform)
- [ ] **Phase 5**: Location Search & Autocomplete
- [ ] **Phase 6**: Multi-Modal Routing Engine
- [ ] **Phase 7**: Route Comparison & Options
- [ ] **Phase 8**: Turn-by-Turn Route Details
- [ ] **Phase 9**: Real-Time Navigation Guidance
- [ ] **Phase 10**: Saved Places
- [ ] **Phase 11**: User Authentication
- [ ] **Phase 12**: Crowdsourced Community Reports
- [ ] **Phase 13**: Admin Analytics Dashboard
- [ ] **Phase 14**: Transit Data Management Tools
- [ ] **Phase 15**: Live Vehicle GPS & Real-time ETA
- [ ] **Phase 16**: Security Hardening & Performance Optimization
- [ ] **Phase 17**: End-to-End Testing Suite
- [ ] **Phase 18**: Production Deployment on Railway

---

## 🚂 Railway Deployment Ready

The backend server is architected for zero-configuration containerized deployment on Railway:

- Configurable `PORT` from environment
- Production build script `npm run build`
- Production run script `npm start`
- Health check route `/api/health` for Railway deployment health checks
- Decoupled database connection with SSL support in production
