import "dotenv/config";
import express from "express";
import cors from "cors";
import pollRouter from "./routes/poll.routes.js";
import { connectRedis, redis } from "./lib/redis.js";

const app  = express();
const port = process.env.PORT || 4000;

app.use(cors({
    origin: process.env.CLIENT_ORIGIN || "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
}));
app.use(express.json());

app.get("/", (_req, res) => res.json({ status: "ok" }));
app.use("/api/polls", pollRouter);

const start = async () => {
    try {
        await connectRedis();
        app.listen(port, () => {
            console.log(`[server] running on http://localhost:${port}`);
        });
    } catch (err) {
        console.error("[server] startup failed:", err);
        process.exit(1);
    }
};

const shutdown = async () => {
    console.log("\n[server] shutting down…");
    await redis.quit();
    process.exit(0);
};

process.on("SIGINT",  shutdown);
process.on("SIGTERM", shutdown);

start();
