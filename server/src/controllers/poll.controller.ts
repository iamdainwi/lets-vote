import { Request, Response } from "express";
import { createPoll, getPoll, castVote, pollChannel, listActivePolls } from "../services/redis.server.js";
import { redis } from "../lib/redis.js";

type IdParams = { id: string };

export const listPollsHandler = async (req: Request, res: Response) => {
    try {
        const polls = await listActivePolls();
        return res.json(polls);
    } catch (err) {
        console.error("[listPolls]", err);
        return res.status(500).json({ error: "Failed to fetch polls" });
    }
};

export const createPollHandler = async (req: Request, res: Response) => {
    try {
        const { question, options, duration } = req.body;

        if (!question || typeof question !== "string" || question.trim().length === 0) {
            return res.status(400).json({ error: "Question is required" });
        }
        if (!Array.isArray(options) || options.length < 2 || options.length > 6) {
            return res.status(400).json({ error: "Provide 2–6 options" });
        }
        const cleanOptions = options.map((o: unknown) => String(o).trim()).filter(Boolean);
        if (cleanOptions.length < 2) {
            return res.status(400).json({ error: "Options must be non-empty strings" });
        }
        const ttl = Math.max(1, Math.min(10080, parseInt(duration, 10) || 5)) * 60;

        const poll = await createPoll(question.trim(), cleanOptions, ttl);
        return res.status(201).json({ id: poll.id });
    } catch (err) {
        console.error("[createPoll]", err);
        return res.status(500).json({ error: "Failed to create poll" });
    }
};

export const getPollHandler = async (req: Request<IdParams>, res: Response) => {
    try {
        const poll = await getPoll(req.params.id);
        if (!poll) return res.status(404).json({ error: "Poll not found or expired" });
        return res.json(poll);
    } catch (err: unknown) {
        console.error("[getPoll]", err);
        return res.status(500).json({ error: "Failed to fetch poll" });
    }
};

export const voteHandler = async (req: Request<IdParams>, res: Response) => {
    try {
        const { optionId, voterId } = req.body;
        if (!optionId) return res.status(400).json({ error: "optionId is required" });
        if (!voterId)  return res.status(400).json({ error: "voterId is required" });

        const clientIp: string =
            ((req.headers["x-forwarded-for"] as string) ?? "")
                .split(",")[0]
                .trim() ||
            req.ip ||
            req.socket?.remoteAddress ||
            "unknown";

        const result = await castVote(req.params.id, optionId, voterId as string, clientIp);

        if (!result.success) {
            const status =
                result.reason === "already_voted"   ? 409 :
                result.reason === "ip_rate_limited" ? 429 : 400;
            return res.status(status).json({ error: result.reason });
        }

        return res.json({ votes: result.votes });
    } catch (err: unknown) {
        console.error("[vote]", err);
        return res.status(500).json({ error: "Failed to cast vote" });
    }
};

export const sseStreamHandler = async (req: Request<IdParams>, res: Response) => {
    const { id } = req.params;

    const poll = await getPoll(id);
    if (!poll) {
        return res.status(404).json({ error: "Poll not found" });
    }

    res.setHeader("Content-Type",    "text/event-stream");
    res.setHeader("Cache-Control",   "no-cache");
    res.setHeader("Connection",      "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    res.write(`data: ${JSON.stringify({ type: "init", poll })}\n\n`);

    const subscriber = redis.duplicate();
    const ch = pollChannel(id);

    const onMessage = (_channel: string, message: string) => {
        res.write(`data: ${message}\n\n`);
    };

    subscriber.subscribe(ch).catch((err: unknown) => {
        console.error("[SSE] subscribe error:", err);
    });
    subscriber.on("message", onMessage);

    const keepAlive = setInterval(() => {
        res.write(`: ping\n\n`);
    }, 25_000);

    req.on("close", () => {
        clearInterval(keepAlive);
        subscriber.unsubscribe(ch);
        subscriber.quit();
    });
};