import type { Metadata } from "next";
import { Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Zap, Bell, User } from "lucide-react";
import Link from "next/link";

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VOTE.LIVE",
  description: "Create a poll, share the link, watch votes roll in live.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full antialiased",
        hankenGrotesk.variable,
        jetBrainsMono.variable,
        "font-sans"
      )}
    >
      <body
        className="min-h-dvh flex flex-col"
        style={{ fontFamily: "var(--font-hanken)" }}
      >
        {/* Navigation Bar */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 32px",
            background: "var(--surface-container)",
            borderBottom: "1px solid var(--surface-container-highest)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "64px" }}>
            {/* Logo */}
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
              <Zap style={{ color: "var(--secondary-container)" }} size={24} strokeWidth={3} />
              <span
                style={{
                  fontSize: "20px",
                  fontWeight: 800,
                  letterSpacing: "0.05em",
                  color: "var(--secondary-container)",
                  textTransform: "uppercase",
                }}
              >
                VOTE.LIVE
              </span>
            </Link>

            {/* Nav Links */}
            <nav style={{ display: "flex", alignItems: "center", gap: "32px", fontSize: "14px", fontWeight: 600 }}>
              <span style={{ color: "var(--on-surface-variant)", cursor: "not-allowed" }}>Explore</span>
              <span style={{ color: "var(--on-surface-variant)", cursor: "not-allowed" }}>Trending</span>
              <span style={{ color: "var(--on-surface-variant)", cursor: "not-allowed" }}>History</span>
            </nav>
          </div>

          {/* Right Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "var(--surface-container-high)",
                border: "1px solid var(--surface-container-highest)",
                color: "var(--on-surface)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "not-allowed",
              }}
            >
              <Bell size={18} />
            </button>
            <button
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "var(--surface-container-high)",
                border: "1px solid var(--surface-container-highest)",
                color: "var(--on-surface)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "not-allowed",
              }}
            >
              <User size={18} />
            </button>
            <Link
              href="/"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 24px",
                borderRadius: "9999px",
                background: "var(--primary-container)",
                color: "var(--on-primary-container)",
                fontSize: "14px",
                fontWeight: 700,
                textDecoration: "none",
                transition: "background 0.2s ease",
              }}
            >
              <span style={{ fontSize: "18px", fontWeight: 400, lineHeight: 1 }}>+</span> Create Poll
            </Link>
          </div>
        </header>

        <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
