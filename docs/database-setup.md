# BiyaEase Database Provisioning & Railway Setup Guide

This guide walks you through provisioning, connecting, migrating, and verifying the **PostgreSQL + PostGIS** database for BiyaEase on **Railway** (or local development).

---

## 1. Architecture Flow

```
React Native Mobile App (Expo)
        ↓
Node.js + Express REST API Gateway (Railway / Localhost:5000)
        ↓
Railway PostgreSQL 16+ Database
        ↓
PostGIS 3+ Spatial Engine (SRID 4326)
        ↓
BiyaEase Transit Schema (Migrations 001 - 016)
```

---

## 2. Step-by-Step Railway PostgreSQL Provisioning

### Step 2.1: Create Project & Database on Railway

1. Go to **[Railway.app](https://railway.app)** and log in.
2. Click **+ New Project** → **Provision PostgreSQL**.
3. Under the provisioned PostgreSQL service, go to the **Connect** tab.
4. Locate the **Database Connection URL**:
   - For connecting locally/outside Railway: Copy the **Public Connection URL** (e.g. `postgresql://postgres:PASSWORD@junction.proxy.rlwy.net:PORT/railway`).
   - For deploying the backend service on Railway: Railway automatically injects the internal `DATABASE_URL` environment variable.

### Step 2.2: Verify PostGIS on Railway

Railway PostgreSQL comes with PostGIS pre-installed. When migrations run, migration `001_enable_postgis.sql` executes:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

You can test PostGIS availability anytime with:

```powershell
npm run db:postgis
```

---

## 3. Environment Variable Configuration

Create `server/.env` (or set in Railway Dashboard under **Variables**):

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@junction.proxy.rlwy.net:YOUR_PORT/railway?sslmode=require
```

> [!SECURITY]
> **Never commit `.env` files to Git.** Ensure `.env` is listed in your `.gitignore`.

---

## 4. Database Setup & Migration Execution

Once `DATABASE_URL` is set in `server/.env`:

### 4.1 Run Schema Migrations (001 – 016)

Applies all 16 sequential migrations inside transaction boundaries:

```powershell
npm run db:migrate
```

### 4.2 Populate Seed Data (Metro Manila Transit Corridors)

Populates verified Metro Manila stops, routes (MRT-3, LRT-2, EDSA Busway, UP Jeepney), landmarks, and fare structures:

```powershell
npm run db:seed
```

### 4.3 Ingest Sample GTFS Feed (Optional)

Validates and imports the synthetic development GTFS fixture with SHA-256 deduplication:

```powershell
npm run gtfs:import -- ./server/data/raw/fixtures/sample-philippines
```

---

## 5. Verifying Database Integrity & Spatial Queries

### 5.1 Check Database Health Endpoint

Start the server:

```powershell
npm run dev:server
```

Query `http://localhost:5000/api/health`:

```json
{
  "status": "ok",
  "service": "biyaease-api",
  "version": "0.1.0",
  "database": "connected",
  "postgis": "3.4.2",
  "timestamp": "2026-08-18T05:00:00.000Z"
}
```

### 5.2 Test PostGIS Proximity Query (`ST_DWithin` & `ST_Distance`)

Test finding stops within 1,000 meters of UP Diliman (`14.6538, 121.0685`):

```http
GET http://localhost:5000/api/transit/stops/nearby?lat=14.6538&lng=121.0685&radius=1000
```

### 5.3 Test Landmark Place Search

```http
GET http://localhost:5000/api/places/search?q=SM%20North
```

---

## 6. CLI Command Reference

| Command                 | Description                                                              |
| ----------------------- | ------------------------------------------------------------------------ |
| `npm run db:migrate`    | Runs all pending migrations (001–016) in order.                          |
| `npm run db:seed`       | Populates Metro Manila transit seed dataset.                             |
| `npm run db:reset`      | Drops all tables and re-migrates from scratch (protected in production). |
| `npm run db:postgis`    | Tests PostgreSQL connectivity and prints the PostGIS version.            |
| `npm run gtfs:validate` | Validates a local GTFS feed directory.                                   |
| `npm run gtfs:import`   | Transactionally imports a GTFS feed into PostgreSQL/PostGIS.             |
| `npm run gtfs:report`   | Displays the latest markdown diagnostic report.                          |
| `npm run gtfs:test`     | Runs the automated GTFS test suite.                                      |

---

## 7. Production Safety Safeguards

The `db:reset` command includes an automated safety guard that aborts if:

1. `NODE_ENV === 'production'`, or
2. The database host is remote (non-localhost).

To bypass in an explicit staging reset scenario:

```powershell
npm run db:reset -- --force-production-reset
```
