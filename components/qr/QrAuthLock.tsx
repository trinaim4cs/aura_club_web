"use client";

import React, { useState } from "react";

interface QrAuthLockProps {
  onSuccess: () => void;
}

export function QrAuthLock({ onSuccess }: QrAuthLockProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/qr/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Incorrect access key.");
        return;
      }

      onSuccess();
    } catch {
      setError("Unable to connect to authentication server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[78vh] items-center justify-center p-4">
      <div className="relative w-full max-w-lg border border-white/10 bg-[#0d0d0f]/90 p-8 sm:p-12 shadow-[0_24px_80px_rgba(0,0,0,0.8)] backdrop-blur-2xl overflow-hidden">
        {/* Decorative corner accents */}
        <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white/40" />
        <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white/40" />
        <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white/40" />
        <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white/40" />

        {/* Ambient top light */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-24 bg-sky-500/20 blur-3xl pointer-events-none" />

        <div className="text-center relative z-10">
          {/* Animated AURA Spark Logo */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center border border-white/10 bg-white/[0.03] text-white">
            <svg
              className="h-9 w-9 animate-[pulse_3s_ease-in-out_infinite]"
              viewBox="0 0 100 100"
              fill="currentColor"
            >
              <path d="M50 0 C50 35 65 50 100 50 C65 50 50 65 50 100 C50 65 35 50 0 50 C35 50 50 35 50 0 Z" />
            </svg>
          </div>

          <div className="inline-flex items-center gap-2 px-2.5 py-1 border border-white/10 bg-white/[0.04] text-[10px] font-mono tracking-[0.16em] uppercase text-[#8d8a84] mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
            [ SECURITY CLEARANCE // LEVEL 04 ]
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-[-0.04em] uppercase text-[#f2efe9] t-display">
            AURA QR STUDIO
          </h1>

          <p className="mt-3 text-xs sm:text-sm text-[#8d8a84] max-w-sm mx-auto font-sans leading-relaxed">
            Enter team access key to manage dynamic campaigns and view scan analytics.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5 relative z-10">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[11px] font-mono uppercase tracking-[0.12em] text-[#c8c5be]">
                Access Key
              </label>
              <span className="text-[10px] font-mono text-[#8d8a84]">HMAC-SHA256 SESSION</span>
            </div>

            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                autoFocus
                className="w-full border border-white/15 bg-black/60 px-4 py-3.5 text-sm text-[#f2efe9] placeholder-[#8d8a84]/50 focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition font-mono tracking-wider"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-[10px] text-[#8d8a84]">
                KEY
              </span>
            </div>
          </div>

          {error && (
            <div className="border border-rose-500/30 bg-rose-950/20 p-3 text-center text-xs text-rose-300 font-mono tracking-wide flex items-center justify-center gap-2">
              <span>✕</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="group relative w-full overflow-hidden border border-white bg-[#f2efe9] py-3.5 px-6 text-xs font-mono font-bold tracking-[0.16em] uppercase text-[#0a0a0a] transition-all hover:bg-transparent hover:text-[#f2efe9] disabled:opacity-40 disabled:pointer-events-none"
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              <span>{loading ? "AUTHENTICATING CIPHER..." : "UNLOCK STUDIO"}</span>
              <span className="transition-transform duration-300 group-hover:translate-x-1.5">
                →
              </span>
            </span>
          </button>

          <div className="text-center pt-2">
            <span className="font-mono text-[9px] tracking-widest text-[#8d8a84]/60 uppercase">
              NODE: AURA-EDGE-GATE // AUTHORIZED PERSONNEL ONLY
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
