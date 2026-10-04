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
      <div className="flex min-h-[65vh] flex-col items-center justify-center gap-3 font-mono text-xs text-[#8d8a84]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
          <span>VERIFYING SECURITY CLEARANCE...</span>
        </div>
      </div>
    );
  }

  // Password Lock Screen (Requires password 'aura')
  if (!isAuthenticated) {
    return <QrAuthLock onSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="qr-studio w-full space-y-8" data-no-cursor="true">
      {/* Top Editorial Dock Header */}
      <header className="relative flex flex-wrap items-center justify-between gap-4 border border-white/10 bg-[#0d0d0f]/90 p-4 sm:p-5 backdrop-blur-xl shadow-2xl">
        {/* Left Branding & Live Status */}
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center border border-white/15 bg-white/[0.04] text-white">
            <svg className="h-6 w-6" viewBox="0 0 100 100" fill="currentColor">
              <path d="M50 0 C50 35 65 50 100 50 C65 50 50 65 50 100 C50 65 35 50 0 50 C35 50 50 35 50 0 Z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-sm font-extrabold tracking-[-0.02em] uppercase text-[#f2efe9] t-display">
                AURA QR PROTOCOL
              </h1>
              <span className="flex items-center gap-1.5 border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-mono tracking-wider text-emerald-400 uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ONLINE
              </span>
            </div>
            <p className="text-[11px] text-[#8d8a84] font-mono mt-0.5 hidden sm:block">
              DYNAMIC DISPATCH ENGINE & PRIVACY SCAN TELEMETRY
            </p>
          </div>
        </div>

        {/* Center: Brutalist Mode Switcher */}
        <div className="flex items-center border border-white/15 bg-black/60 p-1">
          <button
            onClick={() => setActiveTab("studio")}
            className={`flex items-center gap-2 px-4 py-2 font-mono text-xs uppercase tracking-wider transition-all ${
              activeTab === "studio"
                ? "bg-[#f2efe9] text-[#070708] font-bold shadow-md"
                : "text-[#8d8a84] hover:text-[#f2efe9]"
            }`}
          >
            <span>[ 01 ]</span>
            <span>QR STUDIO</span>
          </button>
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-2 px-4 py-2 font-mono text-xs uppercase tracking-wider transition-all ${
              activeTab === "dashboard"
                ? "bg-[#f2efe9] text-[#070708] font-bold shadow-md"
                : "text-[#8d8a84] hover:text-[#f2efe9]"
            }`}
          >
            <span>[ 02 ]</span>
            <span>CAMPAIGNS & TELEMETRY</span>
          </button>
        </div>

        {/* Right: Technical Badges & Lock Action */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex flex-col items-end font-mono text-[9px] text-[#8d8a84] leading-tight">
            <span>SESSION: 30D HMAC</span>
            <span className="text-[#c8c5be]">EDGE: ACTIVE</span>
          </div>

          <button
            onClick={handleLogout}
            className="border border-white/15 bg-white/[0.02] hover:bg-white/[0.08] hover:border-white/30 px-3.5 py-2 font-mono text-xs tracking-wider text-[#8d8a84] hover:text-white transition uppercase"
            title="Lock workspace session"
          >
            LOCK ⌁
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <section className="relative min-h-[600px]">
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
      </section>
    </div>
  );
}
