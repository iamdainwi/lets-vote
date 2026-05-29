import { redis } from "../lib/redis.js";
import { nanoid } from "nanoid";

export interface PollOption {
    id: string;
    text: string;
}

export interface Poll {
    id: string;
    question: string;
    options: PollOption[];
    expiresAt: number; // unix ms
    votes: Record<string, number>; // optionId -> count
    expired: boolean;
}

// Keys
const metaKey = (id: string) => `poll:${id}:meta`;
const votesKey = (id: string) => `poll:${id}:votes`;
const votersKey = (id: string) => `poll:${id}:voters`;
const channel = (id: string) => `poll:${id}`;

export const createPoll = async (
    question: string,
    options: string[],
    ttlSeconds: number
): Promise<Poll> => {
    const id = nanoid(10);
    const expiresAt = Date.now() + ttlSeconds * 1000;

    const pollOptions: PollOption[] = options.map((text) => ({
        id: nanoid(6),
        text,
    }));

    const pipeline = redis.pipeline();

    // Store meta as a hash: question, expiresAt, options (JSON)
    pipeline.hset(metaKey(id), {
        question,
        expiresAt: String(expiresAt),
        options: JSON.stringify(pollOptions),
    });
    pipeline.expire(metaKey(id), ttlSeconds);

    // Initialize votes hash with 0 for each option
    for (const opt of pollOptions) {
        pipeline.hset(votesKey(id), opt.id, 0);
    }
    pipeline.expire(votesKey(id), ttlSeconds);

    // Initialize voters set with TTL
    pipeline.del(votersKey(id));
    pipeline.expire(votersKey(id), ttlSeconds);

    await pipeline.exec();

    return {
        id,
        question,
        options: pollOptions,
        expiresAt,
        votes: Object.fromEntries(pollOptions.map((o) => [o.id, 0])),
        expired: false,
    };
};

export const getPoll = async (id: string): Promise<Poll | null> => {
    const meta = await redis.hgetall(metaKey(id));
    if (!meta || !meta.question) return null;

    const votes = await redis.hgetall(votesKey(id));
    const options: PollOption[] = JSON.parse(meta.options);
    const expiresAt = parseInt(meta.expiresAt, 10);

    return {
        id,
        question: meta.question,
        options,
        expiresAt,
        votes: Object.fromEntries(
            Object.entries(votes).map(([k, v]) => [k, parseInt(v, 10)])
        ),
        expired: Date.now() > expiresAt,
    };
};

export const castVote = async (
    pollId: string,
    optionId: string,
    voterIp: string
): Promise<{ success: boolean; reason?: string; votes?: Record<string, number> }> => {
    // Check poll exists
    const meta = await redis.hgetall(metaKey(pollId));
    if (!meta || !meta.question) {
        return { success: false, reason: "poll_not_found" };
    }

    // Check expired
    const expiresAt = parseInt(meta.expiresAt, 10);
    if (Date.now() > expiresAt) {
        return { success: false, reason: "poll_expired" };
    }

    // Check valid option
    const options: PollOption[] = JSON.parse(meta.options);
    if (!options.find((o) => o.id === optionId)) {
        return { success: false, reason: "invalid_option" };
    }

    // Dedup by IP — SADD returns 1 if added, 0 if already exists
    const added = await redis.sadd(votersKey(pollId), voterIp);
    if (added === 0) {
        return { success: false, reason: "already_voted" };
    }

    // Increment vote
    await redis.hincrby(votesKey(pollId), optionId, 1);

    // Fetch fresh votes
    const rawVotes = await redis.hgetall(votesKey(pollId));
    const votes = Object.fromEntries(
        Object.entries(rawVotes).map(([k, v]) => [k, parseInt(v, 10)])
    );

    // Publish to SSE subscribers
    await redis.publish(channel(pollId), JSON.stringify({ type: "vote", votes }));

    return { success: true, votes };
};

export const getPollVotes = async (pollId: string): Promise<Record<string, number>> => {
    const raw = await redis.hgetall(votesKey(pollId));
    return Object.fromEntries(
        Object.entries(raw).map(([k, v]) => [k, parseInt(v, 10)])
    );
};

export const pollChannel = channel;