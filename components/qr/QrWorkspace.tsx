"use client";

import React, { useEffect, useState } from "react";
import type { QRCode } from "@/qr/types";
import { QrAuthLock } from "./QrAuthLock";
import QrCustomizer from "./QrCustomizer";
import { QrDashboard } from "./QrDashboard";

export default function QrWorkspace() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<"studio" | "dashboard">("studio");
  const [selectedQr, setSelectedQr] = useState<QRCode | null>(null);

  // Check auth session on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/qr/auth");
        const data = await res.json();
        setIsAuthenticated(Boolean(data.ok && data.authenticated));
      } catch {
        setIsAuthenticated(false);
      }
    }
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/qr/auth", { method: "DELETE" });
    } finally {
      setIsAuthenticated(false);
    }
  };

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center font-mono text-xs text-slate-400">
        Verifying security clearance...
      </div>
    );
  }

  // Password Lock Screen (Requires password 'aura')
  if (!isAuthenticated) {
    return <QrAuthLock onSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="qr-studio w-full max-w-7xl mx-auto space-y-6" data-no-cursor="true">
      {/* Top Workspace Header & Navigation */}
      <header className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl px-6 py-4 shadow-xl backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 font-extrabold text-sm font-mono">
            QR
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight text-white">AURA QR SYSTEM</h1>
              <span className="rounded bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.5 text-[10px] font-mono text-sky-400 uppercase">
                Authorized
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Dynamic redirects, privacy scan telemetry & pixel-perfect styling
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center rounded-xl bg-slate-950 p-1 border border-slate-800">
          <button
            onClick={() => setActiveTab("studio")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
              activeTab === "studio"
                ? "bg-sky-500 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>🎨</span>
            <span>QR Studio</span>
          </button>
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
              activeTab === "dashboard"
                ? "bg-sky-500 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>📊</span>
            <span>Campaigns & Analytics</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleLogout}
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-mono text-slate-400 hover:border-slate-700 hover:text-rose-400 transition"
          >
            Lock Studio
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      {activeTab === "studio" ? (
        <QrCustomizer
          activeQr={selectedQr}
          onSwitchToDashboard={() => setActiveTab("dashboard")}
        />
      ) : (
        <QrDashboard
          onCustomizeQr={(qr) => {
            setSelectedQr(qr);
            setActiveTab("studio");
          }}
        />
      )}
    </div>
  );
}
