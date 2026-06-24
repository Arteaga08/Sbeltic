# Sbeltic System

Full-stack management and automation platform for the **Sbeltic** aesthetic clinic. It centralizes daily operations — scheduling, clinical records, inventory, marketing and team — in a single web platform, cutting down manual work through automations, alerts and WhatsApp notifications.

> **Status:** In production. Deployed on a Synology NAS with public access via Cloudflare Tunnel.

---

## Table of contents

- [Overview](#overview)
- [Tech stack](#tech-stack)
- [Modules](#modules)
- [Automations](#automations)
- [Security](#security)
- [Roles & permissions](#roles--permissions)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Local setup](#local-setup)
- [Deployment](#deployment)

---

## Overview

Sbeltic System is a full-stack application tailored to an aesthetic clinic. Every module is interconnected: scheduling consumes patients, treatments and team data; inventory triggers automatic alerts; marketing measures the impact of its campaigns. The goal is for the medical and administrative staff to operate from a single panel — without juggling code or scattered tools.

## Tech stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · Headless UI · Phosphor Icons |
| **Backend** | Node.js · Express 5 · layered architecture (routes / controllers / services / models / validators / middlewares) |
| **Database** | MongoDB · Mongoose |
| **Validation** | Zod · express-validator |
| **Security** | Helmet · JWT · bcrypt · rate limiting · NoSQL sanitization |
| **Documents** | @react-pdf/renderer · react-signature-canvas (digital signature) · QR codes |
| **Images** | Sharp · Multer (clinical photo processing and upload) |
| **Messaging** | WhatsApp Cloud API (Meta) · HMAC-validated webhooks |
| **Scheduled tasks** | node-cron |
| **Infrastructure** | Docker · Docker Compose · Synology NAS · Cloudflare Tunnel · Tailscale |

## Modules

### 🗓️ Smart Scheduling
The operational core that connects nearly every other module. Manages **appointments**, the **waitlist**, **time blocks** and availability calculation. Includes a calendar view, rescheduling, appointment PDF generation and status widgets on the dashboard.

### 👥 Patients & Clinical Records
A complete digital clinical record:
- Medical history, background and gynecological/obstetric data
- Evolutions / SOAP notes
- **Digital signature** by the patient (in person or remotely via link/WhatsApp)
- PDF document generation and privacy notices
- **Before/after photos** of treatments (processed with Sharp, restricted access)
- Reusable templates for post-op notes and prescriptions
- Per-patient **debt** tracking

### 📦 Smart Inventory
Control of **products**, **batches**, **categories** and **suppliers**, with automatic SKU generation. Low-stock and expiration alerts, with smart refill widgets on the dashboard.

### 📣 Marketing & Rewards
Management of **coupons** segmented by category and promotional campaigns, with performance metrics surfaced on the dashboard.

### 🧑‍⚕️ Team
Staff administration: users, authentication and role-based access control.

### 🌐 Public Area
Unauthenticated routes for patient flows (e.g. signing consent forms via link/WhatsApp) and medical history capture, protected with strict rate limiting.

## Automations

- **Cron jobs** for periodic inventory checks (low stock, expirations) and alert dispatching.
- **WhatsApp notifications** through Meta pre-approved templates (reminders, confirmations, signature links).
- **WhatsApp webhooks** validated by HMAC to process incoming replies.
- **Inventory alert service** that automatically notifies the administrator.

## Security

- **JWT authentication** with bcrypt password hashing.
- **Helmet** for secure HTTP headers.
- **Differentiated rate limiting**: standard for the API, strict (10 req / 15 min) for public routes.
- **NoSQL sanitization** against Mongo injection.
- **Input validation** with Zod and express-validator on every endpoint.
- External webhooks validated via **HMAC signature**.
- Sensitive variables kept out of the repository; only example templates are versioned.

## Roles & permissions

Access is enforced per role via authorization middleware:

`ADMIN` · `RECEPTIONIST` · `DOCTOR` · `MARKETING` · `NURSE` · `PHYSIOTHERAPIST`

## Architecture

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Next.js    │─────▶│  Express API │─────▶│   MongoDB    │
│  (frontend)  │ HTTP │  (backend)   │      │              │
└──────────────┘      └──────┬───────┘      └──────────────┘
                             │
                  ┌──────────┼───────────┐
                  ▼          ▼           ▼
            WhatsApp     node-cron    Sharp/Multer
            Cloud API    (jobs)       (photos)
```

Deployed on a Synology NAS with five Docker containers: `frontend`, `backend`, `mongo`, `cloudflared` (public access) and `tailscale` (remote administration).

## Project structure

```
sbeltic-system/
├── backend/
│   └── src/
│       ├── config/         # DB connection, CORS
│       ├── controllers/    # Logic for each resource
│       ├── jobs/           # Cron jobs (inventory, alerts)
│       ├── middlewares/    # Auth, roles, rate limit, sanitization, uploads
│       ├── models/         # Mongoose schemas (clinical / inventory / marketing)
│       ├── routes/         # REST endpoint definitions
│       ├── services/       # Inventory, WhatsApp, automation, photos, notifications
│       ├── utils/          # Helpers (tokens, errors, SKU, responses)
│       └── validators/     # Validation schemas
├── frontend/
│   └── src/
│       ├── app/            # App Router: (dashboard), (auth), public, paciente
│       ├── components/     # Modular UI by domain (agenda, patients, inventory, marketing…)
│       ├── context/        # Global state (treatment categories)
│       ├── hooks/          # useAuthImage, useBreakpoint, useScrollLock
│       └── lib/            # Authenticated fetch, error handling, utilities
├── scripts/                # NAS sync and deploy
└── docker-compose.yml
```

## Local setup

**Requirements:** Node.js 18+, MongoDB and npm.

```bash
# Install root, backend and frontend dependencies
npm run install-all

# Start backend (5009) and frontend (3000) in parallel
npm run dev
```

Individual commands:

```bash
npm run backend     # Backend only (nodemon)
npm run frontend    # Frontend only (Next.js)
```

Configure the environment variables from the example files before starting (MongoDB connection, JWT secret, WhatsApp credentials, etc.).

To create the initial administrator user:

```bash
npm run seed:admin
```

## Deployment

The system is deployed on a Synology NAS through sync scripts. The development Mac is the single source of truth for the code.

```bash
npm run sync        # Sync files to the NAS (no rebuild)
npm run deploy      # Sync and rebuild the Docker containers
```

Public access is exposed through Cloudflare Tunnel and remote administration through Tailscale.

---

<p align="center">Built by <strong>Vidix Studio</strong> · Custom system for the Sbeltic aesthetic clinic</p>
