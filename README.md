# VOTE.LIVE — Real-Time Polling App ⚡️

A high-performance, real-time polling application built with Next.js, Express, and Redis. Create polls instantly, share the link, and watch the votes roll in live with zero page refreshes.

## 🌟 Features

- **Instant Creation:** No sign-ups or accounts required. Create a poll in seconds.
- **Real-Time Updates:** Powered by Server-Sent Events (SSE) and Redis Pub/Sub, votes are broadcasted live to all viewers instantly.
- **Auto-Expiring Polls:** Uses native Redis TTL (Time-To-Live). Polls automatically close after the configured duration (from 15 minutes up to 7 days).
- **Premium UI:** Designed with a striking "Kinetic Pulse" dark mode aesthetic, featuring smooth CSS transitions, glowing accents, and an interactive dashboard feel.
- **Responsive:** Fluid layout that degrades gracefully on mobile devices.

## 🛠 Tech Stack

### Frontend (`/client`)
- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS v4
- **Icons:** Lucide React
- **Fonts:** Hanken Grotesk & JetBrains Mono

### Backend (`/server`)
- **Framework:** Node.js & Express
- **Database / Message Broker:** Redis (Upstash)
- **Real-Time Communication:** Server-Sent Events (SSE) combined with Redis Pub/Sub (`ioredis`).

## 🚀 How It Works

1. **Storage:** Poll data and vote counts are stored as Redis Hashes.
2. **Real-time Engine:** When a vote is cast via the Express API, it increments the vote count in Redis and immediately publishes a message to a Redis channel dedicated to that poll.
3. **Delivery:** Clients connect to the server via SSE. The server subscribes to the poll's Redis channel and forwards any incoming vote updates directly to the connected clients.

## 💻 Running Locally

### Prerequisites
- Node.js (v18+)
- `pnpm` installed
- A Redis instance (e.g., Upstash)

### 1. Setup Backend
```bash
cd server
pnpm install
```

Create a `.env` file in the `server` directory and add your Redis connection URL:
```env
UPSTASH_REDIS_REST_URL="rediss://default:YOUR_PASSWORD@your-redis-host:6379"
```

Start the development server:
```bash
pnpm dev
```
*The API will run on `http://localhost:4000`.*

### 2. Setup Frontend
```bash
cd client
pnpm install
```

Start the frontend development server:
```bash
pnpm dev
```
*The app will run on `http://localhost:3000`.*

## 📂 Project Structure

```text
lets-vote/
├── client/                 # Next.js Frontend
│   ├── app/                # Next.js App Router (page.tsx, layout.tsx)
│   ├── lib/                # API client helpers
│   └── public/             # Static assets
└── server/                 # Express Backend
    ├── src/
    │   ├── controllers/    # Route handlers & SSE logic
    │   ├── routes/         # Express router definitions
    │   ├── services/       # Core business logic
    │   └── lib/            # Redis configuration
    └── index.ts            # Entry point
```

## 📝 License
MIT License
