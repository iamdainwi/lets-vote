# VOTE.LIVE

**Real-time polling, zero friction.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Redis](https://img.shields.io/badge/Redis-Upstash-DC382D?logo=redis&logoColor=white)](https://upstash.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

VOTE.LIVE is a high-performance, real-time polling application. Create a poll in
seconds — no sign-up required — share the link, and watch votes roll in live.
Built with Next.js, Express, and Redis, the app delivers instant updates via
Server-Sent Events (SSE) and Redis Pub/Sub, so every connected viewer sees
results the moment they change.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Design System](#design-system)
- [Contributing](#contributing)
- [License](#license)

## Features

| Feature | Description |
| --- | --- |
| **Instant Creation** | No sign-ups or accounts. Create a poll with 2–6 options in seconds. |
| **Real-Time Updates** | Server-Sent Events + Redis Pub/Sub broadcast every vote to all viewers instantly. |
| **Auto-Expiring Polls** | Redis TTL (Time-To-Live) auto-closes polls after a configurable duration (15 min – 7 days). |
| **Duplicate Vote Prevention** | UUID-based voter tracking prevents the same browser from voting twice. |
| **Live Countdown Timer** | Client-side countdown shows remaining time with second-level precision. |
| **Share & Copy Link** | One-click copy-to-clipboard for sharing poll URLs. |
| **Explore Page** | Browse all active polls sorted by popularity. |
| **Responsive Design** | Fluid layout that works across desktop, tablet, and mobile. |
| **Dark-Mode UI** | "Kinetic Pulse" design system with glowing accents, smooth transitions, and a premium dashboard aesthetic. |

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                        Client                            │
│              Next.js 16 (App Router)                     │
│                                                          │
│  /explore ──── Server Component ──── fetch GET /api/polls│
│  /create ───── Client Component ──── fetch POST /api/polls
│  /poll/[id] ── Server + Client ───── SSE stream ─────────│─ ─ ─ ┐
└──────────────────────┬───────────────────────────────────┘       │
                       │ HTTP                                      │ SSE
                       ▼                                           │
┌──────────────────────────────────────────────────────────┐       │
│                        Server                            │       │
│                Express 5 (Node.js)                       │       │
│                                                          │       │
│  POST /api/polls ─────── createPoll() ───────────────────│───┐   │
│  GET  /api/polls ─────── listActivePolls() ──────────────│───┤   │
│  GET  /api/polls/:id ─── getPoll() ──────────────────────│───┤   │
│  POST /api/polls/:id/vote ─ castVote() + PUBLISH ────────│───┤   │
│  GET  /api/polls/:id/stream ─ SSE + SUBSCRIBE ───────────│─ ─│─ ─┘
└──────────────────────┬───────────────────────────────────┘   │
                       │ ioredis                               │
                       ▼                                       │
┌──────────────────────────────────────────────────────────┐   │
│                   Redis (Upstash)                         │   │
│                                                          │   │
│  poll:<id>:meta   ─── Hash (question, options, expiry)   │◄──┤
│  poll:<id>:votes  ─── Hash (optionId → count)            │◄──┤
│  poll:<id>:voters ─── Set  (voter UUIDs for dedup)       │◄──┤
│  poll:<id>        ─── Pub/Sub channel (vote broadcasts)  │◄──┘
│                                                          │
│  All keys expire via native Redis TTL.                   │
└──────────────────────────────────────────────────────────┘
```

### How It Works

1. **Poll Creation:** The client sends a `POST` request with the question,
   options, and duration. The server generates a unique ID via `nanoid`, stores
   poll metadata and vote counters as Redis Hashes, and sets a TTL on all keys.

2. **Voting:** When a user casts a vote, the server checks for poll validity,
   expiry, and duplicate votes (via a Redis Set). It then atomically increments
   the vote count and publishes the updated totals to a Redis Pub/Sub channel.

3. **Real-Time Delivery:** Each connected client opens an SSE connection. The
   server subscribes to the poll's Redis channel using a dedicated `ioredis`
   subscriber instance and forwards every vote update to the client stream.
   A keepalive ping fires every 25 seconds to prevent connection timeouts.

4. **Expiry:** When the Redis TTL expires, all poll data is automatically
   deleted. The client detects expiry via the countdown timer and transitions to
   the "Poll Closed" view showing final results.

## Tech Stack

### Frontend (`/client`)

| Technology | Purpose |
| --- | --- |
| [Next.js 16](https://nextjs.org/) | React framework with App Router, RSC, and streaming |
| [React 19](https://react.dev/) | UI rendering with `useTransition` for non-blocking mutations |
| [Tailwind CSS v4](https://tailwindcss.com/) | Utility-first CSS framework |
| [shadcn/ui](https://ui.shadcn.com/) | Accessible, composable UI primitives |
| [Radix UI](https://www.radix-ui.com/) | Headless component primitives |
| [Lucide React](https://lucide.dev/) | Icon library |
| [Hanken Grotesk](https://fonts.google.com/specimen/Hanken+Grotesk) | Primary typeface |
| [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) | Monospace typeface for labels and metrics |

### Backend (`/server`)

| Technology | Purpose |
| --- | --- |
| [Express 5](https://expressjs.com/) | HTTP server and routing |
| [ioredis](https://github.com/redis/ioredis) | Redis client with Pub/Sub support |
| [Redis (Upstash)](https://upstash.com/) | Data store, TTL-based expiry, and message broker |
| [Neon](https://neon.tech/) | Serverless PostgreSQL (schema defined via Drizzle ORM) |
| [Drizzle ORM](https://orm.drizzle.team/) | Type-safe SQL schema and migrations |
| [nanoid](https://github.com/ai/nanoid) | Short, URL-friendly unique IDs |
| [tsx](https://github.com/privatenumber/tsx) | TypeScript execution for development |
| [nodemon](https://nodemon.io/) | Auto-restart on file changes |

## Prerequisites

Before you begin, make sure you have:

- **Node.js** v18 or later — [Download](https://nodejs.org/)
- **pnpm** — Install via `npm install -g pnpm`
- **Redis instance** — [Upstash](https://upstash.com/) (free tier available) or
  a local Redis server

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/iamdainwi/lets-vote.git
cd lets-vote
```

### 2. Set Up the Backend

```bash
cd server
pnpm install
```

Create a `.env.local` file in the `server/` directory:

```env
# Redis connection (TLS-enabled Upstash URL)
UPSTASH_REDIS_REST_URL="rediss://default:YOUR_PASSWORD@your-redis-host:6379"

# PostgreSQL connection (Neon)
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# CORS origin for the frontend
CLIENT_ORIGIN="http://localhost:3000"
```

Start the development server:

```bash
pnpm dev
```

The API server starts at **`http://localhost:4000`**.

### 3. Set Up the Frontend

```bash
cd client
pnpm install
```

Create a `.env.local` file in the `client/` directory:

```env
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

Start the development server:

```bash
pnpm dev
```

The frontend starts at **`http://localhost:3000`** and automatically redirects
`/` → `/explore`.

## Environment Variables

### Server (`server/.env.local`)

| Variable | Required | Description |
| --- | :---: | --- |
| `UPSTASH_REDIS_REST_URL` | ✅ | Redis connection string (TLS `rediss://` for Upstash) |
| `DATABASE_URL` | ✅ | PostgreSQL connection string (Neon serverless) |
| `CLIENT_ORIGIN` | ❌ | Allowed CORS origin. Defaults to `*` (allow all). |
| `PORT` | ❌ | Server port. Defaults to `4000`. |

### Client (`client/.env.local`)

| Variable | Required | Description |
| --- | :---: | --- |
| `NEXT_PUBLIC_API_URL` | ❌ | Backend API base URL. Defaults to `http://localhost:4000`. |

## API Reference

All endpoints are prefixed with `/api/polls`.

### List Active Polls

```
GET /api/polls
```

Returns an array of active polls sorted by total votes (descending).

**Response** `200 OK`:

```json
[
  {
    "id": "aBcDeFgHiJ",
    "question": "Tabs or Spaces?",
    "totalVotes": 42,
    "expiresAt": 1717400000000
  }
]
```

---

### Create a Poll

```
POST /api/polls
```

**Request Body:**

| Field | Type | Required | Description |
| --- | --- | :---: | --- |
| `question` | `string` | ✅ | The poll question |
| `options` | `string[]` | ✅ | 2–6 answer options |
| `duration` | `number` | ✅ | Duration in minutes (1–10080) |

**Response** `201 Created`:

```json
{ "id": "aBcDeFgHiJ" }
```

**Error Responses:**

- `400` — Invalid question, options, or duration.

---

### Get a Poll

```
GET /api/polls/:id
```

Returns the full poll state including options and current vote counts.

**Response** `200 OK`:

```json
{
  "id": "aBcDeFgHiJ",
  "question": "Tabs or Spaces?",
  "options": [
    { "id": "abc123", "text": "Tabs" },
    { "id": "def456", "text": "Spaces" }
  ],
  "expiresAt": 1717400000000,
  "votes": { "abc123": 25, "def456": 17 },
  "expired": false
}
```

**Error Responses:**

- `404` — Poll not found or expired.

---

### Cast a Vote

```
POST /api/polls/:id/vote
```

**Request Body:**

| Field | Type | Required | Description |
| --- | --- | :---: | --- |
| `optionId` | `string` | ✅ | The ID of the chosen option |
| `voterId` | `string` | ✅ | A unique identifier for the voter (UUID) |

**Response** `200 OK`:

```json
{ "votes": { "abc123": 26, "def456": 17 } }
```

**Error Responses:**

- `400` — Missing `optionId` or `voterId`, invalid option, or poll expired.
- `409` — Voter has already voted on this poll.

---

### Subscribe to Live Updates (SSE)

```
GET /api/polls/:id/stream
```

Opens a Server-Sent Events stream. The server sends:

1. An initial `init` event with the full poll state.
2. Subsequent `vote` events whenever a vote is cast.
3. A keepalive `: ping` comment every 25 seconds.

**Event Format:**

```
data: {"type":"init","poll":{...}}

data: {"type":"vote","votes":{"abc123":26,"def456":17}}
```

## Project Structure

```
lets-vote/
├── client/                          # Next.js Frontend
│   ├── app/
│   │   ├── layout.tsx               # Root layout with nav header
│   │   ├── globals.css              # Design tokens & Tailwind config
│   │   ├── create/
│   │   │   └── page.tsx             # Poll creation form
│   │   ├── explore/
│   │   │   └── page.tsx             # Browse active polls (SSR)
│   │   └── poll/
│   │       └── [id]/
│   │           ├── page.tsx          # Poll page (SSR + metadata)
│   │           └── PollClient.tsx    # Interactive voting & live results
│   ├── components/
│   │   └── ui/                      # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── spinner.tsx
│   │       └── textarea.tsx
│   ├── lib/
│   │   ├── api.ts                   # API client (fetch wrappers)
│   │   └── utils.ts                 # Utility functions (cn)
│   ├── next.config.ts               # Next.js configuration
│   ├── components.json              # shadcn/ui configuration
│   ├── tsconfig.json
│   └── package.json
│
├── server/                          # Express Backend
│   ├── src/
│   │   ├── index.ts                 # Entry point, middleware, graceful shutdown
│   │   ├── routes/
│   │   │   └── poll.routes.ts       # Route definitions
│   │   ├── controllers/
│   │   │   └── poll.controller.ts   # Request handlers & SSE logic
│   │   ├── services/
│   │   │   └── redis.server.ts      # Core business logic (Redis operations)
│   │   ├── lib/
│   │   │   └── redis.ts             # Redis client setup (ioredis)
│   │   └── db/
│   │       ├── index.ts             # Drizzle ORM + Neon connection
│   │       └── schema.ts            # PostgreSQL schema (polls, options, votes)
│   ├── drizzle.config.ts            # Drizzle Kit configuration
│   ├── nodemon.json                 # Dev server auto-reload config
│   ├── tsconfig.json
│   └── package.json
│
├── ui-design/                       # Design reference assets
│   ├── kinetic_pulse/DESIGN.md      # Full design system specification
│   ├── poll_creation/               # Create page mockup
│   ├── poll_voting/                 # Voting interface mockup
│   ├── live_results/                # Live results dashboard mockup
│   └── poll_expired/                # Expired poll mockup
│
├── .gitignore
└── README.md                        # ← You are here
```

## Design System

VOTE.LIVE uses the **Kinetic Pulse** design system — a dark-mode-first visual
language engineered for real-time data clarity and high-velocity interaction.

### Principles

- **Electric, Precise, Agile** — Every element signals action and state.
- **Functional Vibrance** — Color is used to communicate meaning, not decoration.
- **Dashboard-first** — Dense but organized information hierarchy.

### Color Palette

| Role | Token | Hex | Usage |
| --- | --- | --- | --- |
| Primary | `--primary-container` | `#2E5BFF` | CTAs, active states, focus rings |
| Success | `--secondary-container` | `#36FFC4` | Leading options, positive signals |
| Surface | `--background` | `#0F1419` | App background |
| Text | `--on-surface` | `#DFE2EA` | Primary text |
| Muted | `--on-surface-variant` | `#C4C5D9` | Secondary text, labels |
| Error | `--error` | `#FFB4AB` | Validation errors, destructive actions |

### Typography

- **Hanken Grotesk** — Headlines, body text, metrics.
- **JetBrains Mono** — Labels, timestamps, status indicators.

Full design specification available in
[`ui-design/kinetic_pulse/DESIGN.md`](ui-design/kinetic_pulse/DESIGN.md).

## Contributing

Contributions are welcome! To get started:

1. **Fork** the repository.
2. **Create a branch** for your feature or fix:

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes** and ensure they follow the existing code style.
4. **Test** your changes locally by running both the client and server.
5. **Commit** with a descriptive message following
   [Conventional Commits](https://www.conventionalcommits.org/):

   ```bash
   git commit -m "feat: add multi-language support for poll questions"
   ```

6. **Push** and open a **Pull Request** against `main`.

### Code Style

- TypeScript strict mode is enabled in both client and server.
- Use `pnpm` as the package manager.
- Follow the existing file and folder naming conventions.
- ESLint is configured for the client — run `pnpm lint` before submitting.

### Reporting Issues

Use the [GitHub Issues](https://github.com/iamdainwi/lets-vote/issues) tab. Include:

- Steps to reproduce the bug.
- Expected vs. actual behavior.
- Browser/OS/Node.js version.

## License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">
  Built with ⚡ by <a href="https://github.com/iamdainwi">@iamdainwi</a>
</p>
