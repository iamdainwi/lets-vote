const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface PollOption {
    id: string;
    text: string;
}

export interface Poll {
    id: string;
    question: string;
    options: PollOption[];
    expiresAt: number;
    votes: Record<string, number>;
    expired: boolean;
}

export interface PollSummary {
    id: string;
    question: string;
    totalVotes: number;
    expiresAt: number;
}

export async function createPoll(
    question: string,
    options: string[],
    duration: number
): Promise<{ id: string }> {
    const res = await fetch(`${API_BASE}/api/polls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, options, duration }),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create poll");
    }
    return res.json();
}

export async function listActivePolls(): Promise<PollSummary[]> {
    const res = await fetch(`${API_BASE}/api/polls`, {
        cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch active polls");
    return res.json();
}

export async function fetchPoll(id: string): Promise<Poll> {
    const res = await fetch(`${API_BASE}/api/polls/${id}`, {
        cache: "no-store",
    });
    if (!res.ok) throw new Error("Poll not found");
    return res.json();
}

export async function castVote(
    pollId: string,
    optionId: string
): Promise<{ votes: Record<string, number> }> {
    const res = await fetch(`${API_BASE}/api/polls/${pollId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to vote");
    return data;
}

export function getStreamUrl(pollId: string) {
    return `${API_BASE}/api/polls/${pollId}/stream`;
}
