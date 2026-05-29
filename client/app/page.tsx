"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPoll } from "@/lib/api";
import { Plus, Rocket, Trash2 } from "lucide-react";

const DURATION_PRESETS = [
  { label: "15m", value: 15 },
  { label: "1h", value: 60 },
  { label: "1d", value: 1440 },
  { label: "7d", value: 10080 },
];

export default function Home() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [duration, setDuration] = useState(60);
  const [error, setError] = useState("");

  const addOption = () => {
    if (options.length < 6) setOptions([...options, ""]);
  };

  const updateOption = (i: number, v: string) => {
    const n = [...options];
    n[i] = v;
    setOptions(n);
  };

  const removeOption = (i: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, idx) => idx !== i));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const clean = options.map((o) => o.trim()).filter(Boolean);
    if (!question.trim()) return setError("Please enter a question.");
    if (clean.length < 2) return setError("Add at least 2 options.");
    startTransition(async () => {
      try {
        const { id } = await createPoll(question.trim(), clean, duration);
        router.push(`/poll/${id}`);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  };

  const readyToSubmit = question.trim().length > 0 && options.filter((o) => o.trim()).length >= 2;

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px",
        background: "var(--background)",
      }}
    >
      <form
        onSubmit={handleSubmit}
        noValidate
        style={{
          width: "100%",
          maxWidth: "680px",
          background: "var(--surface-container-low)",
          borderRadius: "var(--radius-xl)",
          padding: "32px",
          border: "1px solid var(--surface-container-high)",
          boxShadow: "0 24px 48px -12px rgba(0, 0, 0, 0.4)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
          <div>
            <h1 style={{ fontSize: "32px", fontWeight: 800, marginBottom: "8px", letterSpacing: "-0.02em" }}>
              Launch New Poll
            </h1>
            <p style={{ color: "var(--on-surface-variant)", fontSize: "16px" }}>
              Configure your real-time question and options.
            </p>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(54, 255, 196, 0.1)",
              border: "1px solid rgba(54, 255, 196, 0.2)",
              padding: "4px 12px",
              borderRadius: "999px",
              color: "var(--secondary-container)",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--secondary-container)" }} />
            READY
          </div>
        </div>

        {/* Question */}
        <div style={{ marginBottom: "32px" }}>
          <label
            htmlFor="question"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--on-surface-variant)",
              marginBottom: "12px",
              textTransform: "uppercase",
            }}
          >
            <span style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 16, height: 16, borderRadius: "50%", border: "1px solid currentColor", fontSize: 10
            }}>?</span>
            Poll Question
          </label>
          <input
            id="question"
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What do you want to ask your audience?"
            style={{
              width: "100%",
              background: "var(--surface-container-high)",
              border: "1px solid var(--surface-container-highest)",
              borderRadius: "var(--radius-md)",
              padding: "20px 24px",
              fontSize: "20px",
              fontWeight: 600,
              color: "var(--on-surface)",
              outline: "none",
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--primary)";
              e.currentTarget.style.boxShadow = "0 0 0 2px rgba(46, 91, 255, 0.2)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--surface-container-highest)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>

        {/* Options */}
        <div style={{ marginBottom: "32px" }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--on-surface-variant)",
              marginBottom: "12px",
              textTransform: "uppercase",
            }}
          >
            <span style={{
              display: "flex", flexDirection: "column", gap: 2
            }}>
              <span style={{ width: 12, height: 2, background: "currentColor" }} />
              <span style={{ width: 12, height: 2, background: "currentColor" }} />
              <span style={{ width: 12, height: 2, background: "currentColor" }} />
            </span>
            Options
          </label>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {options.map((opt, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: "var(--surface-container-highest)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700,
                  color: "var(--on-surface-variant)", flexShrink: 0
                }}>
                  {i + 1}
                </div>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => updateOption(i, e.target.value)}
                  placeholder={`Option ${i + 1}`}
                  style={{
                    flex: 1,
                    background: "var(--surface-container-high)",
                    border: "1px solid var(--surface-container-highest)",
                    borderRadius: "var(--radius-md)",
                    padding: "16px",
                    fontSize: "18px",
                    color: "var(--on-surface)",
                    outline: "none",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--primary)";
                    e.currentTarget.style.boxShadow = "0 0 0 2px rgba(46, 91, 255, 0.2)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--surface-container-highest)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(i)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--outline-variant)",
                      cursor: "pointer",
                      padding: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--error)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--outline-variant)")}
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {options.length < 6 && (
            <button
              type="button"
              onClick={addOption}
              style={{
                marginTop: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--primary-fixed-dim)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "8px 0",
              }}
            >
              <Plus size={16} /> Add Another Option
            </button>
          )}
        </div>

        <div style={{ height: 1, background: "var(--surface-container-highest)", margin: "32px 0" }} />

        {/* Time to Live */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--on-surface-variant)",
                textTransform: "uppercase",
              }}
            >
              <span style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 14, height: 14, borderRadius: "50%", border: "1.5px solid currentColor", position: "relative"
              }}>
                <span style={{ position: "absolute", top: 2, left: 5, width: 1.5, height: 4, background: "currentColor" }} />
                <span style={{ position: "absolute", top: 5, left: 5, width: 4, height: 1.5, background: "currentColor" }} />
              </span>
              Time to Live (Duration)
            </label>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 600, color: "var(--on-surface-variant)", textTransform: "uppercase" }}>
              Redis TTL
            </span>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
            {DURATION_PRESETS.map((p) => {
              const active = duration === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setDuration(p.value)}
                  style={{
                    padding: "16px 0",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid " + (active ? "var(--primary-container)" : "var(--surface-container-highest)"),
                    background: active ? "var(--primary-container)" : "var(--surface-container-high)",
                    color: active ? "var(--on-primary-container)" : "var(--on-surface-variant)",
                    fontSize: "16px",
                    fontWeight: active ? 700 : 500,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div style={{ marginBottom: "24px", color: "var(--error)", fontSize: "14px", fontWeight: 500, padding: "12px 16px", background: "var(--error-container)", borderRadius: "8px" }}>
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending || !readyToSubmit}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            padding: "20px",
            borderRadius: "var(--radius-md)",
            background: "var(--primary)",
            color: "var(--on-primary)",
            fontSize: "20px",
            fontWeight: 800,
            cursor: isPending || !readyToSubmit ? "not-allowed" : "pointer",
            border: "none",
            opacity: isPending || !readyToSubmit ? 0.5 : 1,
            transition: "all 0.2s",
            boxShadow: readyToSubmit && !isPending ? "0 4px 24px rgba(46, 91, 255, 0.4)" : "none",
          }}
          onMouseEnter={(e) => {
            if (readyToSubmit && !isPending) e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            if (readyToSubmit && !isPending) e.currentTarget.style.transform = "none";
          }}
        >
          {isPending ? (
            <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⏳</span>
          ) : (
            <Rocket size={24} />
          )}
          Deploy Live Poll
        </button>
      </form>
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
