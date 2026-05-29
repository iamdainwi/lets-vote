import { Redis } from "ioredis";

export const redis = new Redis(process.env.UPSTASH_REDIS_REST_URL as string, {
    lazyConnect: true,
});

redis.on("error", (err: Error) => console.error("[Redis] client error:", err));

export async function connectRedis() {
    await redis.connect();
    console.log("[Redis] connected");
}