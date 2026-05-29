import type { Metadata } from "next";
import { Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Zap } from "lucide-react";
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
            padding: "16px",
            background: "var(--surface-container)",
            borderBottom: "1px solid var(--surface-container-highest)",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
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

            <nav style={{ display: "flex", alignItems: "center", gap: "32px", fontSize: "14px", fontWeight: 600 }}>
              <Link href="/explore" className="text-muted-foreground hover:text-(--on-surface) transition-colors no-underline">
                Explore
              </Link>
            </nav>
          </div>

          {/* Right Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Link
              href="/create"
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
