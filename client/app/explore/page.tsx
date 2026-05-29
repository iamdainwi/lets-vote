import { listActivePolls } from "@/lib/api";
import Link from "next/link";
import { Users, Clock, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const polls = await listActivePolls();
  // eslint-disable-next-line
  const now = Date.now();

  return (
    <div className="flex-1 p-6 sm:p-12 max-w-[1280px] mx-auto w-full">
      <div className="mb-12">
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 text-(--on-surface) tracking-tight">
          Explore Active Polls
        </h1>
        <p className="text-muted-foreground text-lg">
          Discover what people are voting on right now. Jump in and cast your vote before time runs out.
        </p>
      </div>

      {polls.length === 0 ? (
        <div className="p-12 text-center border border-(--surface-container-highest) rounded-2xl bg-(--surface-container-low)">
          <p className="text-xl text-muted-foreground font-semibold mb-6">
            No active polls found.
          </p>
          <Link
            href="/create"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent text-accent-foreground font-bold transition-all hover:-translate-y-0.5"
          >
            Create the first one
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {polls.map((poll) => {
            const remainingMs = Math.max(0, poll.expiresAt - now);
            const hours = Math.floor(remainingMs / 3600000);
            const minutes = Math.floor((remainingMs % 3600000) / 60000);
            const timeDisplay = remainingMs > 0
              ? (hours > 0 ? `${hours}h ${minutes}m left` : `${minutes}m left`)
              : "Closing soon";

            return (
              <div
                key={poll.id}
                className="flex flex-col border border-(--surface-container-highest) rounded-2xl bg-(--surface-container-low) p-6 transition-all hover:border-(--primary) hover:shadow-[0_0_0_1px_rgba(46,91,255,0.2)]"
              >
                <div className="flex items-center gap-3 mb-6">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(244,63,94,0.15)] border border-[rgba(244,63,94,0.3)] text-destructive text-[10px] uppercase font-bold tracking-widest font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                    Live
                  </span>
                </div>

                <h2 className="text-2xl font-bold text-(--on-surface) mb-8 line-clamp-3 leading-tight flex-1">
                  {poll.question}
                </h2>

                <div className="flex items-center justify-between mt-auto pt-6 border-t border-(--surface-container-highest)">
                  <div className="flex items-center gap-4 text-sm font-mono text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Users size={16} className="text-(--primary-fixed-dim)" />
                      {poll.totalVotes}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={16} className="text-(--secondary-fixed)" />
                      {timeDisplay}
                    </div>
                  </div>

                  <Link
                    href={`/poll/${poll.id}`}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-input text-(--on-surface) transition-colors hover:bg-(--primary) hover:text-white"
                  >
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
