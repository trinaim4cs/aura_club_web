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
    <div className="flex min-h-[75vh] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-sky-400">Security Gate</span>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-white">AURA QR STUDIO</h1>
          <p className="mt-2 text-xs text-slate-400">
            Enter team access key to manage dynamic campaigns and view scan analytics.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">
              Access Key
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password..."
              autoFocus
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-2.5 text-center text-xs text-rose-300 font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full rounded-lg bg-sky-500 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow-lg shadow-sky-500/20 hover:bg-sky-400 transition disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Unlock Studio"}
          </button>
        </form>
      </div>
    </div>
  );
}
