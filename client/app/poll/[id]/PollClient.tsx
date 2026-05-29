"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { castVote, getStreamUrl, Poll, PollOption } from "@/lib/api";
import { Copy, Plus, Lock } from "lucide-react";
import Link from "next/link";

function useCountdown(expiresAt: number) {
  const [remaining, setRemaining] = useState(() => Math.max(0, expiresAt - Date.now()));
  
  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => setRemaining(Math.max(0, expiresAt - Date.now())), 1000);
    return () => clearInterval(id);
  }, [expiresAt, remaining]);
  
  const d = Math.floor(remaining / 86400000);
  const h = Math.floor((remaining % 86400000) / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  
  let display = "";
  if (d > 0) {
    display = `${d}d ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`;
  } else if (h > 0) {
    display = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  } else {
    display = `${String(m).padStart(2, "0")} : ${String(s).padStart(2, "0")}`;
  }
  
  return {
    expired: remaining <= 0,
    display,
  };
}

function CountUp({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  
  useEffect(() => {
    if (prev.current !== value) {
      prev.current = value;
      setDisplay(value);
    }
  }, [value]);
  
  return <span>{display.toLocaleString()}</span>;
}

interface Props { poll: Poll; }

export default function PollClient({ poll: initialPoll }: Props) {
  const [poll, setPoll] = useState<Poll>(initialPoll);
  const [votes, setVotes] = useState<Record<string, number>>(initialPoll.votes);
  const [votedFor, setVotedFor] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const { expired, display: countdown } = useCountdown(poll.expiresAt);
  const isExpired = expired || poll.expired;

  useEffect(() => {
    const s = localStorage.getItem(`voted:${poll.id}`);
    if (s) setVotedFor(s);
  }, [poll.id]);

  useEffect(() => {
    if (isExpired) return;
    const es = new EventSource(getStreamUrl(poll.id));
    es.onmessage = (e) => {
      try {
        const m = JSON.parse(e.data);
        if (m.type === "init") { setPoll(m.poll); setVotes(m.poll.votes); }
        if (m.type === "vote") { setVotes(m.votes); }
      } catch { /* noop */ }
    };
    return () => es.close();
  }, [poll.id, isExpired]);

  const total = Object.values(votes).reduce((a, b) => a + b, 0);
  
  const getPct = useCallback((id: string) => {
    return total === 0 ? 0 : Number(((votes[id] ?? 0) / total * 100).toFixed(1));
  }, [votes, total]);

  const leader = poll.options.reduce<PollOption | null>((best, opt) =>
    !best || (votes[opt.id] ?? 0) > (votes[best.id] ?? 0) ? opt : best, null);

  const handleVote = async () => {
    if (!selectedOption || votedFor || isExpired || voting) return;
    setVoting(true);
    try {
      const d = await castVote(poll.id, selectedOption);
      setVotes(d.votes);
      setVotedFor(selectedOption);
      localStorage.setItem(`voted:${poll.id}`, selectedOption);
    } catch (err: unknown) {
      console.error("Vote failed", err);
    } finally {
      setVoting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasVoted = !!votedFor;

  // STATE 1: VOTING (Not expired, hasn't voted)
  if (!isExpired && !hasVoted) {
    return (
      <div style={{ flex: 1, padding: "48px 32px", maxWidth: "800px", margin: "0 auto", width: "100%" }}>
        {/* Badges */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "32px" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            background: "rgba(244, 63, 94, 0.15)", border: "1px solid rgba(244, 63, 94, 0.3)",
            padding: "4px 12px", borderRadius: "999px",
            fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 600, color: "var(--error)", letterSpacing: "0.05em"
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--error)" }} />
            LIVE
          </span>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            border: "1px solid var(--outline-variant)",
            padding: "4px 12px", borderRadius: "999px",
            fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 600, color: "var(--on-surface-variant)", letterSpacing: "0.05em"
          }}>
            ⏱ ENDS IN {countdown}
          </span>
        </div>

        <h1 style={{ fontSize: "48px", fontWeight: 800, lineHeight: 1.1, marginBottom: "48px", color: "var(--on-surface)", letterSpacing: "-0.02em" }}>
          {poll.question}
        </h1>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "48px" }}>
          {poll.options.map((opt) => {
            const isSelected = selectedOption === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setSelectedOption(opt.id)}
                style={{
                  width: "100%", textAlign: "left", padding: "24px 32px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid " + (isSelected ? "var(--primary)" : "var(--surface-container-highest)"),
                  background: isSelected ? "rgba(46, 91, 255, 0.05)" : "var(--surface-container)",
                  display: "flex", alignItems: "center", gap: "24px",
                  cursor: "pointer", transition: "all 0.2s",
                }}
              >
                <div style={{
                  width: 24, height: 24, borderRadius: "50%",
                  border: "2px solid " + (isSelected ? "var(--primary)" : "var(--outline-variant)"),
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  {isSelected && <div style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--primary)" }} />}
                </div>
                <span style={{ fontSize: "20px", color: "var(--on-surface)" }}>{opt.text}</span>
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={handleVote}
            disabled={!selectedOption || voting}
            style={{
              padding: "16px 48px", borderRadius: "999px",
              background: selectedOption ? "var(--surface-bright)" : "var(--surface-container-high)",
              color: selectedOption ? "var(--on-surface)" : "var(--outline-variant)",
              fontSize: "14px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase",
              fontFamily: "var(--font-mono)",
              border: "none", cursor: selectedOption && !voting ? "pointer" : "not-allowed",
              transition: "all 0.2s",
            }}
          >
            {voting ? "Submitting..." : "Submit Vote"}
          </button>
        </div>
      </div>
    );
  }

  // STATE 3: EXPIRED
  if (isExpired) {
    return (
      <div style={{ flex: 1, padding: "48px 32px", display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          border: "1px solid var(--outline-variant)",
          padding: "6px 16px", borderRadius: "999px",
          fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 600, color: "var(--on-surface-variant)", letterSpacing: "0.05em",
          marginBottom: "32px"
        }}>
          <Lock size={14} /> POLL CLOSED
        </div>
        
        <h1 style={{ fontSize: "48px", fontWeight: 800, lineHeight: 1.1, marginBottom: "32px", textAlign: "center", maxWidth: "800px", color: "var(--on-surface)", letterSpacing: "-0.02em" }}>
          {poll.question}
        </h1>

        <div style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          border: "1px solid var(--surface-container-highest)", background: "var(--surface-container-low)",
          padding: "12px 24px", borderRadius: "var(--radius-md)",
          fontFamily: "var(--font-sans)", fontSize: "16px", color: "var(--on-surface-variant)",
          marginBottom: "64px"
        }}>
          👥 Final Count: <strong style={{ color: "var(--secondary-fixed)" }}><CountUp value={total} /></strong> votes
        </div>

        <div style={{
          width: "100%", maxWidth: "800px",
          background: "var(--surface-container-low)",
          border: "1px solid var(--surface-container-high)",
          borderRadius: "var(--radius-xl)", padding: "40px",
          marginBottom: "64px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "40px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: 700, color: "var(--on-surface)" }}>Final Results</h2>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--on-surface-variant)" }}>Closed</span>
          </div>

          <div style={{ height: "1px", background: "var(--surface-container-highest)", marginBottom: "40px" }} />

          <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
            {poll.options.map((opt) => {
              const p = getPct(opt.id);
              const isWin = leader?.id === opt.id && total > 0;
              const color = isWin ? "var(--secondary-fixed)" : "var(--surface-bright)";
              const textColor = isWin ? "var(--on-surface)" : "var(--on-surface-variant)";
              
              return (
                <div key={opt.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <div style={{ fontSize: "20px", fontWeight: 700, color: textColor, display: "flex", alignItems: "center", gap: "12px" }}>
                      {isWin && <span style={{ color: "var(--secondary-fixed)" }}>🏆</span>}
                      {opt.text}
                    </div>
                    <div style={{ fontSize: "32px", fontWeight: 800, color: color, fontFamily: "var(--font-sans)" }}>
                      {p}%
                    </div>
                  </div>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", height: "48px" }}>
                    <div style={{
                      flex: 1, height: "100%", background: "var(--surface-container-highest)", borderRadius: "999px", overflow: "hidden", position: "relative"
                    }}>
                      <div style={{
                        height: "100%", background: color, width: `${p}%`, borderRadius: "999px", transition: "width 1s cubic-bezier(0.34, 1.56, 0.64, 1)"
                      }} />
                    </div>
                    <div style={{ width: "120px", textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "14px", color: "var(--on-surface-variant)" }}>
                      <CountUp value={votes[opt.id] ?? 0} /> votes
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p style={{ fontSize: "18px", color: "var(--on-surface-variant)", marginBottom: "32px", textAlign: "center" }}>
          The debate doesn't stop here. Start your own live poll and see<br/>what the world thinks right now.
        </p>

        <Link
          href="/"
          style={{
            display: "inline-flex", alignItems: "center", gap: "12px",
            padding: "16px 32px", borderRadius: "999px",
            background: "var(--primary-container)", color: "var(--on-primary-container)",
            fontSize: "18px", fontWeight: 700, textDecoration: "none",
          }}
        >
          <Plus size={20} /> Create Your Own Poll
        </Link>
      </div>
    );
  }

  // STATE 2: LIVE RESULTS (Not expired, has voted)
  return (
    <div style={{ flex: 1, padding: "48px 32px", display: "flex", gap: "48px", maxWidth: "1280px", margin: "0 auto", width: "100%" }}>
      {/* Left Sidebar */}
      <div style={{ width: "320px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "24px" }}>
        <div style={{
          background: "var(--surface-container-low)", border: "1px solid var(--surface-container-high)",
          borderRadius: "var(--radius-xl)", padding: "32px",
        }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "32px" }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              background: "rgba(54, 255, 196, 0.15)", border: "1px solid rgba(54, 255, 196, 0.3)",
              padding: "4px 12px", borderRadius: "999px",
              fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 600, color: "var(--secondary-fixed)", letterSpacing: "0.05em"
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--secondary-fixed)" }} />
              LIVE
            </span>
          </div>

          <div style={{ marginBottom: "32px" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 600, color: "var(--on-surface-variant)", letterSpacing: "0.05em", marginBottom: "8px", textTransform: "uppercase" }}>
              Time Remaining
            </div>
            <div style={{ fontSize: "48px", fontWeight: 800, color: "var(--on-surface)", fontFamily: "var(--font-sans)", letterSpacing: "-0.02em" }}>
              {countdown}
            </div>
          </div>

          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 600, color: "var(--on-surface-variant)", letterSpacing: "0.05em", marginBottom: "8px", textTransform: "uppercase" }}>
              Total Votes
            </div>
            <div style={{ fontSize: "40px", fontWeight: 800, color: "var(--primary-fixed-dim)", fontFamily: "var(--font-sans)", letterSpacing: "-0.02em" }}>
              <CountUp value={total} />
            </div>
          </div>
        </div>

        <div style={{
          background: "var(--surface-container-low)", border: "1px solid var(--surface-container-high)",
          borderRadius: "var(--radius-xl)", padding: "32px",
        }}>
          <h3 style={{ fontSize: "20px", fontWeight: 700, color: "var(--on-surface)", marginBottom: "16px" }}>Share Poll</h3>
          <p style={{ fontSize: "16px", color: "var(--on-surface-variant)", marginBottom: "24px", lineHeight: 1.5 }}>
            Invite others to participate before time runs out.
          </p>
          <div style={{ display: "flex", gap: "8px" }}>
            <div style={{
              flex: 1, background: "var(--surface-container-highest)", border: "1px solid var(--outline-variant)",
              borderRadius: "var(--radius-md)", padding: "12px 16px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--on-surface-variant)", display: "flex", alignItems: "center"
            }}>
              {typeof window !== "undefined" ? window.location.href : ""}
            </div>
            <button
              onClick={handleCopy}
              style={{
                display: "flex", alignItems: "center", gap: "8px", padding: "0 24px",
                background: "var(--primary-container)", color: "var(--on-primary-container)",
                border: "none", borderRadius: "var(--radius-md)", cursor: "pointer",
                fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: 600,
              }}
            >
              <Copy size={16} /> {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      </div>

      {/* Right Content */}
      <div style={{ flex: 1, background: "var(--surface-container-low)", border: "1px solid var(--surface-container-high)", borderRadius: "var(--radius-xl)", padding: "48px" }}>
        <h1 style={{ fontSize: "36px", fontWeight: 800, lineHeight: 1.2, marginBottom: "48px", color: "var(--on-surface)", letterSpacing: "-0.02em" }}>
          {poll.question}
        </h1>

        <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
          {poll.options.map((opt) => {
            const p = getPct(opt.id);
            const isWin = leader?.id === opt.id && total > 0;
            const color = isWin ? "var(--secondary-fixed)" : "var(--primary-fixed)";
            const barColor = isWin ? "var(--secondary-fixed)" : "var(--primary-fixed-dim)";
            
            return (
              <div key={opt.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div style={{ fontSize: "20px", fontWeight: 700, color: color, display: "flex", alignItems: "center", gap: "12px" }}>
                    {opt.text}
                    {votedFor === opt.id && <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", padding: "2px 8px", background: "var(--primary)", color: "var(--on-primary)", borderRadius: "999px" }}>You</span>}
                  </div>
                  <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--on-surface)" }}>
                    {p}%
                  </div>
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: "16px", height: "16px" }}>
                  <div style={{
                    flex: 1, height: "100%", background: "var(--surface-container-highest)", borderRadius: "999px", overflow: "hidden", position: "relative"
                  }}>
                    <div style={{
                      height: "100%", background: barColor, width: `${p}%`, borderRadius: "999px", transition: "width 1s cubic-bezier(0.34, 1.56, 0.64, 1)"
                    }} />
                  </div>
                  <div style={{ width: "100px", textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--on-surface-variant)" }}>
                    <CountUp value={votes[opt.id] ?? 0} /> votes
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div style={{ marginTop: "48px", paddingTop: "24px", borderTop: "1px solid var(--surface-container-highest)", display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--on-surface-variant)" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: 8, height: 8, border: "2px solid currentColor", borderRadius: "50%", display: "inline-block", position: "relative" }}>
               <span style={{ position: "absolute", top: 1, left: 1, right: 1, bottom: 1, border: "1px solid currentColor", borderRadius: "50%" }} />
            </span>
            Connected via WebSocket
          </span>
          <span>Last updated: Just now</span>
        </div>
      </div>
    </div>
  );
}
