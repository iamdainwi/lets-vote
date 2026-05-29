import { fetchPoll } from "@/lib/api";
import { notFound } from "next/navigation";
import PollClient from "./PollClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const poll = await fetchPoll(id);
    return {
      title: `${poll.question} — LetsVote`,
      description: `Vote and see live results: ${poll.question}`,
    };
  } catch {
    return { title: "Poll — LetsVote" };
  }
}

export default async function PollPage({ params }: Props) {
  const { id } = await params;

  let poll;
  try {
    poll = await fetchPoll(id);
  } catch {
    notFound();
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
      {/* Back link */}
      <div className="w-full max-w-lg mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Create a new poll
        </Link>
      </div>

      <PollClient poll={poll} />
    </main>
  );
}
