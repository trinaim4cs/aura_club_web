"use client";

import React, { useEffect, useState } from "react";
import type { QRCode, QRCodeWithStats, QRAnalyticsSummary } from "@/qr/types";

interface QrDashboardProps {
  onCustomizeQr?: (qr: QRCode) => void;
}

export function QrDashboard({ onCustomizeQr }: QrDashboardProps) {
  const [qrs, setQrs] = useState<QRCodeWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQrId, setSelectedQrId] = useState<string | null>(null);
  const [summary, setSummary] = useState<QRAnalyticsSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", code: "", destination_url: "" });
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);

  const [editModal, setEditModal] = useState<QRCodeWithStats | null>(null);
  const [editForm, setEditForm] = useState({ name: "", destination_url: "", active: true });
  const [editError, setEditError] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const fetchQrs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/qr");
      const data = await res.json();
      if (data.ok && Array.isArray(data.qrs)) {
        setQrs(data.qrs);
        // Default select first QR if none selected
        if (!selectedQrId && data.qrs.length > 0) {
          setSelectedQrId(data.qrs[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch QRs:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async (id: string) => {
    try {
      setSummaryLoading(true);
      const res = await fetch(`/api/qr/${id}/analytics`);
      const data = await res.json();
      if (data.ok && data.summary) {
        setSummary(data.summary);
      }
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    fetchQrs();
  }, []);

  useEffect(() => {
    if (selectedQrId) {
      fetchAnalytics(selectedQrId);
    }
  }, [selectedQrId]);

  const handleCopyLink = (code: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://join-aura.vercel.app";
    const url = `${origin}/r/${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleActive = async (qr: QRCodeWithStats) => {
    try {
      const res = await fetch(`/api/qr/${qr.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !qr.active }),
      });
      const data = await res.json();
      if (data.ok) {
        setQrs((prev) => prev.map((q) => (q.id === qr.id ? { ...q, active: !q.active } : q)));
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? All associated scan history will be permanently erased.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/qr/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok) {
        setQrs((prev) => prev.filter((q) => q.id !== id));
        if (selectedQrId === id) {
          const remaining = qrs.filter((q) => q.id !== id);
          setSelectedQrId(remaining.length > 0 ? remaining[0].id : null);
          setSummary(null);
        }
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateLoading(true);

    try {
      const res = await fetch("/api/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setCreateError(data.error || "Failed to create QR code.");
        return;
      }

      setCreateOpen(false);
      setCreateForm({ name: "", code: "", destination_url: "" });
      await fetchQrs();
      setSelectedQrId(data.qr.id);
    } catch {
      setCreateError("Network error while creating QR code.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal) return;
    setEditError(null);
    setEditLoading(true);

    try {
      const res = await fetch(`/api/qr/${editModal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setEditError(data.error || "Failed to update QR code.");
        return;
      }

      setEditModal(null);
      await fetchQrs();
      if (selectedQrId === editModal.id) {
        fetchAnalytics(editModal.id);
      }
    } catch {
      setEditError("Network error while updating QR code.");
    } finally {
      setEditLoading(false);
    }
  };

  const filteredQrs = qrs.filter(
    (q) =>
      q.name.toLowerCase().includes(search.toLowerCase()) ||
      q.code.toLowerCase().includes(search.toLowerCase()) ||
      q.destination_url.toLowerCase().includes(search.toLowerCase()),
  );

  const totalAllScans = qrs.reduce((acc, q) => acc + q.total_scans, 0);
  const totalAllVisitors = qrs.reduce((acc, q) => acc + q.unique_visitors_est, 0);

  return (
    <div className="space-y-8 font-sans text-[#f2efe9]">
      {/* =========================================================================
          TOP METRIC STRIP: BRUTALIST KPI BLOCKS
         ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Campaigns */}
        <div className="border border-white/10 bg-[#0d0d0f]/90 p-5 shadow-lg backdrop-blur relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8d8a84]">
              [ 01 // Total Campaigns ]
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
          </div>
          <p className="text-4xl font-extrabold uppercase text-[#f2efe9] t-display mt-2 tracking-tight">
            {qrs.length}
          </p>
          <span className="font-mono text-[9px] text-[#8d8a84] uppercase mt-1 block">
            REGISTERED DISPATCH TARGETS
          </span>
        </div>

        {/* KPI 2: Total Scans */}
        <div className="border border-white/10 bg-[#0d0d0f]/90 p-5 shadow-lg backdrop-blur relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8d8a84]">
              [ 02 // Total Scans ]
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
          </div>
          <p className="text-4xl font-extrabold uppercase text-white t-display mt-2 tracking-tight">
            {totalAllScans}
          </p>
          <span className="font-mono text-[9px] text-[#8d8a84] uppercase mt-1 block">
            ALL-TIME AGGREGATE TRAFFIC
          </span>
        </div>

        {/* KPI 3: Unique Devices */}
        <div className="border border-white/10 bg-[#0d0d0f]/90 p-5 shadow-lg backdrop-blur relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8d8a84]">
              [ 03 // Unique Devices ]
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
          <p className="text-4xl font-extrabold uppercase text-emerald-400 t-display mt-2 tracking-tight">
            {totalAllVisitors}
          </p>
          <span className="font-mono text-[9px] text-[#8d8a84] uppercase mt-1 block">
            SALTED SHA-256 IDENTIFIERS
          </span>
        </div>

        {/* KPI 4: Active Nodes + New QR Action */}
        <div className="border border-white/10 bg-[#0d0d0f]/90 p-5 shadow-lg backdrop-blur flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8d8a84]">
                [ 04 // ACTIVE NODES ]
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            </div>
            <p className="text-3xl font-extrabold uppercase text-white t-display mt-1">
              {qrs.filter((q) => q.active).length} / {qrs.length}
            </p>
          </div>

          <button
            onClick={() => {
              setCreateError(null);
              setCreateOpen(true);
            }}
            className="group relative border border-white bg-white hover:bg-transparent text-black hover:text-white mt-3 py-2 px-4 font-mono font-bold text-xs uppercase tracking-[0.14em] transition-all shadow-[0_0_15px_rgba(255,255,255,0.15)] flex items-center justify-center gap-2"
          >
            <span>+ New QR</span>
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          CAMPAIGN MANAGEMENT TABLE
         ========================================================================= */}
      <div className="border border-white/10 bg-[#0d0d0f]/90 shadow-2xl backdrop-blur overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-white t-display">
                Active Dynamic Campaigns
              </h2>
              <span className="border border-white/15 bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-[#8d8a84]">
                LIVE DISPATCH TABLE
              </span>
            </div>
            <p className="font-mono text-xs text-[#8d8a84] mt-1">
              Edit destination URLs anytime. Printed QR codes remain permanent.
            </p>
          </div>

          {/* Search Bar */}
          <div className="w-full sm:w-72">
            <div className="relative">
              <input
                type="text"
                placeholder="SEARCH CAMPAIGNS OR SLUGS..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-white/15 bg-black/60 px-3.5 py-2 font-mono text-xs text-white placeholder-[#8d8a84]/60 focus:border-white focus:outline-none uppercase tracking-wider"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#8d8a84]">
                ⌕
              </span>
            </div>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="py-16 text-center text-xs text-[#8d8a84] font-mono tracking-widest uppercase">
            CONNECTING TO SUPABASE TELEMETRY ENGINE...
          </div>
        ) : filteredQrs.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#8d8a84] font-mono tracking-widest uppercase">
            NO CAMPAIGNS MATCH FILTER CRITERIA.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="border-b border-white/10 bg-black/50 uppercase text-[#8d8a84] text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Campaign & Slug</th>
                  <th className="py-3.5 px-5">Destination Target</th>
                  <th className="py-3.5 px-5 text-center">Status</th>
                  <th className="py-3.5 px-5 text-right">Total Scans</th>
                  <th className="py-3.5 px-5 text-right">Unique Devices</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-[#c8c5be]">
                {filteredQrs.map((qr) => {
                  const isSelected = selectedQrId === qr.id;
                  return (
                    <tr
                      key={qr.id}
                      className={`hover:bg-white/[0.03] transition-colors ${
                        isSelected ? "bg-white/[0.04] border-l-2 border-white" : ""
                      }`}
                    >
                      {/* Name & Slug */}
                      <td className="py-4 px-5">
                        <div className="font-bold text-white text-sm tracking-tight">{qr.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-[11px] text-sky-400 font-mono tracking-wider">
                            /r/{qr.code}
                          </code>
                          <button
                            onClick={() => handleCopyLink(qr.code)}
                            title="Copy full scan URL"
                            className="border border-white/15 bg-white/[0.04] hover:bg-white hover:text-black px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-[#8d8a84] transition"
                          >
                            {copiedCode === qr.code ? "COPIED ✓" : "COPY"}
                          </button>
                        </div>
                      </td>

                      {/* Destination URL */}
                      <td className="py-4 px-5 max-w-sm">
                        <div className="truncate text-[#8d8a84] text-[11px]" title={qr.destination_url}>
                          {qr.destination_url}
                        </div>
                        <button
                          onClick={() => {
                            setEditModal(qr);
                            setEditForm({
                              name: qr.name,
                              destination_url: qr.destination_url,
                              active: qr.active,
                            });
                            setEditError(null);
                          }}
                          className="text-[10px] text-white/70 hover:text-white uppercase tracking-wider underline underline-offset-2 mt-1 block"
                        >
                          Change Target URL →
                        </button>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5 text-center">
                        <button
                          onClick={() => handleToggleActive(qr)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 border text-[10px] uppercase tracking-wider font-bold transition ${
                            qr.active
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                              : "border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              qr.active ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                            }`}
                          />
                          <span>{qr.active ? "Active" : "Paused"}</span>
                        </button>
                      </td>

                      {/* Total Scans */}
                      <td className="py-4 px-5 text-right font-bold text-white text-sm">
                        {qr.total_scans}
                      </td>

                      {/* Unique Devices */}
                      <td className="py-4 px-5 text-right text-emerald-400 text-sm">
                        {qr.unique_visitors_est}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedQrId(qr.id)}
                            className={`px-3 py-1.5 border text-[10px] uppercase tracking-wider transition ${
                              isSelected
                                ? "border-white bg-white text-black font-bold"
                                : "border-white/15 bg-white/[0.04] text-[#c8c5be] hover:text-white hover:border-white/30"
                            }`}
                          >
                            Analytics
                          </button>

                          {onCustomizeQr && (
                            <button
                              onClick={() => onCustomizeQr(qr)}
                              className="px-3 py-1.5 border border-white/15 bg-white/[0.04] text-[#c8c5be] hover:text-white hover:border-white/30 text-[10px] uppercase tracking-wider transition"
                            >
                              Style QR
                            </button>
                          )}

                          <button
                            onClick={() => handleDelete(qr.id, qr.name)}
                            className="p-1.5 text-[#8d8a84] hover:text-rose-400 transition"
                            title="Delete Campaign"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =========================================================================
          SELECTED CAMPAIGN ANALYTICS DRILLDOWN
         ========================================================================= */}
      {selectedQrId && (
        <div className="space-y-6 pt-6 border-t border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="font-mono text-[10px] uppercase text-sky-400 tracking-[0.16em]">
                Real-Time Campaign Telemetry
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold uppercase text-white t-display mt-0.5">
                {qrs.find((q) => q.id === selectedQrId)?.name || "Campaign Analytics"}
              </h3>
            </div>
            {summaryLoading && (
              <span className="font-mono text-xs text-[#8d8a84] animate-pulse">
                POLLING EDGE TELEMETRY...
              </span>
            )}
          </div>

          {summary ? (
            <>
              {/* Campaign KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="border border-white/10 bg-[#0d0d0f]/80 p-4">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#8d8a84] block">
                    Total Scans
                  </span>
                  <p className="text-2xl font-extrabold text-white t-display mt-1">
                    {summary.total_scans}
                  </p>
                </div>

                <div className="border border-white/10 bg-[#0d0d0f]/80 p-4">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#8d8a84] block">
                    Unique Devices
                  </span>
                  <p className="text-2xl font-extrabold text-emerald-400 t-display mt-1">
                    {summary.unique_visitors_est}
                  </p>
                </div>

                <div className="border border-white/10 bg-[#0d0d0f]/80 p-4">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#8d8a84] block">
                    Scans Today
                  </span>
                  <p className="text-2xl font-extrabold text-white t-display mt-1">
                    {summary.scans_today}
                  </p>
                </div>

                <div className="border border-white/10 bg-[#0d0d0f]/80 p-4">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#8d8a84] block">
                    Last 7 Days
                  </span>
                  <p className="text-2xl font-extrabold text-white t-display mt-1">
                    {summary.scans_this_week}
                  </p>
                </div>

                <div className="border border-white/10 bg-[#0d0d0f]/80 p-4">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#8d8a84] block">
                    Bot Scans Filtered
                  </span>
                  <p className="text-2xl font-extrabold text-[#8d8a84] t-display mt-1">
                    {summary.bot_scans}
                  </p>
                </div>
              </div>

              {/* Time Series Activity Bar Chart */}
              <div className="border border-white/10 bg-[#0d0d0f]/90 p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-white">
                    Daily Scan Activity
                  </h4>
                  <span className="font-mono text-[10px] text-[#8d8a84]">
                    TRAFFIC VELOCITY (UTC)
                  </span>
                </div>

                {summary.scans_over_time.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[#8d8a84] font-mono tracking-widest uppercase">
                    NO SCAN ACTIVITY LOGGED FOR THIS SLUG YET.
                  </div>
                ) : (
                  <div className="space-y-3 font-mono">
                    {summary.scans_over_time.map((pt) => {
                      const maxScans = Math.max(...summary.scans_over_time.map((p) => p.scans), 1);
                      const widthPercent = Math.max((pt.scans / maxScans) * 100, 4);
                      return (
                        <div key={pt.date} className="flex items-center gap-4 text-xs">
                          <span className="w-24 text-[#8d8a84] text-[11px]">{pt.date}</span>
                          <div className="flex-1 bg-black/60 h-6 border border-white/10 flex items-center p-0.5">
                            <div
                              className="bg-white h-full transition-all flex items-center justify-end px-2 text-[10px] font-bold text-black"
                              style={{ width: `${widthPercent}%` }}
                            >
                              {pt.scans}
                            </div>
                          </div>
                          <span className="w-24 text-right text-[11px] text-emerald-400">
                            {pt.unique_visitors} unique
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Distributions Grid (3 Columns) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Geographies */}
                <div className="border border-white/10 bg-[#0d0d0f]/90 p-5 font-mono">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                      Top Geographies
                    </h4>
                    <span className="text-[10px] text-[#8d8a84]">LOC</span>
                  </div>

                  {summary.countries.length === 0 ? (
                    <p className="text-xs text-[#8d8a84]">No geo data logged.</p>
                  ) : (
                    <div className="space-y-3">
                      {summary.countries.map((c) => (
                        <div key={c.label}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-[#c8c5be]">{c.label}</span>
                            <span className="text-[#8d8a84]">
                              {c.count} ({c.percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-black/60 h-1.5 border border-white/10 overflow-hidden">
                            <div className="bg-white h-full" style={{ width: `${c.percentage}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Platforms & OS */}
                <div className="border border-white/10 bg-[#0d0d0f]/90 p-5 font-mono">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                      Platforms & Browsers
                    </h4>
                    <span className="text-[10px] text-[#8d8a84]">CLIENT</span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <span className="text-[9px] uppercase text-[#8d8a84] block mb-1.5">
                        OPERATING SYSTEM
                      </span>
                      <div className="space-y-1.5">
                        {summary.operating_systems.slice(0, 4).map((os) => (
                          <div key={os.label} className="flex justify-between text-xs">
                            <span className="text-[#c8c5be]">{os.label}</span>
                            <span className="text-[#8d8a84]">{os.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/10">
                      <span className="text-[9px] uppercase text-[#8d8a84] block mb-1.5">
                        BROWSER ENGINE
                      </span>
                      <div className="space-y-1.5">
                        {summary.browsers.slice(0, 4).map((b) => (
                          <div key={b.label} className="flex justify-between text-xs">
                            <span className="text-[#c8c5be]">{b.label}</span>
                            <span className="text-[#8d8a84]">{b.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Devices & Referrers */}
                <div className="border border-white/10 bg-[#0d0d0f]/90 p-5 font-mono">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                      Devices & Traffic Sources
                    </h4>
                    <span className="text-[10px] text-[#8d8a84]">SOURCE</span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <span className="text-[9px] uppercase text-[#8d8a84] block mb-1.5">
                        HARDWARE PROFILE
                      </span>
                      <div className="space-y-1.5">
                        {summary.device_types.map((d) => (
                          <div key={d.label} className="flex justify-between text-xs">
                            <span className="text-[#c8c5be] capitalize">{d.label}</span>
                            <span className="text-[#8d8a84]">{d.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/10">
                      <span className="text-[9px] uppercase text-[#8d8a84] block mb-1.5">
                        HTTP REFERRER
                      </span>
                      {summary.referrers.length === 0 ? (
                        <p className="text-xs text-[#8d8a84]">Direct Camera Scanner</p>
                      ) : (
                        <div className="space-y-1.5">
                          {summary.referrers.slice(0, 4).map((r) => (
                            <div key={r.label} className="flex justify-between text-xs truncate">
                              <span className="text-[#c8c5be] truncate mr-2" title={r.label}>
                                {r.label}
                              </span>
                              <span className="text-[#8d8a84]">{r.count}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Scan Audit Log */}
              <div className="border border-white/10 bg-[#0d0d0f]/90 overflow-hidden font-mono">
                <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-white">
                    Recent Scan Events
                  </h4>
                  <span className="text-[10px] text-[#8d8a84]">
                    PRIVACY AUDIT TRAIL // RAW IP ZEROIZED
                  </span>
                </div>

                {summary.recent_scans.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#8d8a84]">
                    NO SCANS RECORDED IN CURRENT AUDIT BUFFER.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-white/10 bg-black/50 uppercase text-[#8d8a84] text-[10px] tracking-wider">
                        <tr>
                          <th className="py-3 px-5">Time (UTC)</th>
                          <th className="py-3 px-5">Location</th>
                          <th className="py-3 px-5">Device</th>
                          <th className="py-3 px-5">Browser & OS</th>
                          <th className="py-3 px-5 text-center">Type</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.06] text-[#c8c5be]">
                        {summary.recent_scans.slice(0, 15).map((s) => (
                          <tr key={s.id} className="hover:bg-white/[0.03] transition-colors">
                            <td className="py-3 px-5 text-[#8d8a84] text-[11px]">
                              {new Date(s.scanned_at).toLocaleString()}
                            </td>
                            <td className="py-3 px-5">
                              {s.city || s.country ? `${s.city ?? "Unknown"}, ${s.country ?? ""}` : "Unknown"}
                            </td>
                            <td className="py-3 px-5 capitalize">{s.device_type}</td>
                            <td className="py-3 px-5">
                              {s.browser} • {s.operating_system}
                            </td>
                            <td className="py-3 px-5 text-center">
                              {s.is_bot ? (
                                <span className="border border-amber-500/30 bg-amber-500/10 text-amber-400 px-2 py-0.5 text-[9px] uppercase tracking-wider">
                                  Bot
                                </span>
                              ) : (
                                <span className="border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 px-2 py-0.5 text-[9px] uppercase tracking-wider">
                                  Verified
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-xs text-[#8d8a84] font-mono tracking-widest uppercase">
              SELECT A CAMPAIGN FROM THE MATRIX ABOVE TO AUDIT METRICS.
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          CREATE MODAL
         ========================================================================= */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg border border-white/15 bg-[#0d0d0f] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.9)] relative">
            <span className="font-mono text-[10px] text-sky-400 uppercase tracking-widest block mb-1">
              [ DISPATCH ENGINE // NEW CAMPAIGN ]
            </span>
            <h3 className="text-2xl font-extrabold uppercase tracking-tight text-white t-display">
              Create New Dynamic QR Campaign
            </h3>
            <p className="text-xs text-[#8d8a84] mt-2 font-mono leading-relaxed">
              Supports any external destination URL (Luma, Google Forms, Discord, Notion, Event page).
            </p>

            <form onSubmit={handleCreateSubmit} className="mt-6 space-y-5">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-[#c8c5be] mb-1.5">
                  Campaign Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SRM AI Hackathon 2026"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full border border-white/15 bg-black/60 px-3.5 py-2.5 text-xs text-white placeholder-[#8d8a84]/50 focus:border-white focus:outline-none font-mono tracking-wide"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-[#c8c5be] mb-1.5">
                  QR Slug (/r/[code])
                </label>
                <div className="flex items-center border border-white/15 bg-black/60 px-3.5 py-2 text-xs font-mono">
                  <span className="text-[#8d8a84]">https://join-aura.vercel.app/r/</span>
                  <input
                    type="text"
                    required
                    placeholder="hackathon2026"
                    value={createForm.code}
                    onChange={(e) =>
                      setCreateForm((p) => ({ ...p, code: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "") }))
                    }
                    className="flex-1 bg-transparent text-white font-mono focus:outline-none ml-1 tracking-wider"
                  />
                </div>
                <span className="text-[10px] font-mono text-[#8d8a84] mt-1 block">
                  Letters, numbers, dashes, and underscores only. Permanent encoded link.
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-[#c8c5be] mb-1.5">
                  Destination Target URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://lu.ma/srm-ai-hack"
                  value={createForm.destination_url}
                  onChange={(e) => setCreateForm((p) => ({ ...p, destination_url: e.target.value }))}
                  className="w-full border border-white/15 bg-black/60 px-3.5 py-2.5 text-xs text-white placeholder-[#8d8a84]/50 focus:border-white focus:outline-none font-mono"
                />
              </div>

              {createError && (
                <div className="border border-rose-500/30 bg-rose-950/20 p-3 text-xs text-rose-300 font-mono">
                  ✕ {createError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10 font-mono">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="px-4 py-2.5 text-xs text-[#8d8a84] hover:text-white uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="border border-white bg-white text-black hover:bg-transparent hover:text-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition disabled:opacity-40"
                >
                  {createLoading ? "Creating..." : "Save Campaign →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          EDIT MODAL
         ========================================================================= */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg border border-white/15 bg-[#0d0d0f] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.9)] relative">
            <span className="font-mono text-[10px] text-sky-400 uppercase tracking-widest block mb-1">
              [ DISPATCH TARGET // UPDATE ]
            </span>
            <h3 className="text-2xl font-extrabold uppercase tracking-tight text-white t-display">
              Edit Destination Target
            </h3>
            <p className="text-xs text-[#8d8a84] mt-2 font-mono leading-relaxed">
              Updating destination URL for <code className="text-white font-bold">/r/{editModal.code}</code>. Printed QR stays valid.
            </p>

            <form onSubmit={handleEditSubmit} className="mt-6 space-y-5">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-[#c8c5be] mb-1.5">
                  Campaign Name
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full border border-white/15 bg-black/60 px-3.5 py-2.5 text-xs text-white focus:border-white focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-[#c8c5be] mb-1.5">
                  Destination Target URL
                </label>
                <input
                  type="url"
                  required
                  value={editForm.destination_url}
                  onChange={(e) => setEditForm((p) => ({ ...p, destination_url: e.target.value }))}
                  className="w-full border border-white/15 bg-black/60 px-3.5 py-2.5 text-xs text-white focus:border-white focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="edit-active"
                  checked={editForm.active}
                  onChange={(e) => setEditForm((p) => ({ ...p, active: e.target.checked }))}
                  className="h-4 w-4 bg-black border-white/20 accent-white"
                />
                <label htmlFor="edit-active" className="text-xs text-[#c8c5be] font-mono">
                  Campaign Active (unchecked returns 404 on scan)
                </label>
              </div>

              {editError && (
                <div className="border border-rose-500/30 bg-rose-950/20 p-3 text-xs text-rose-300 font-mono">
                  ✕ {editError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10 font-mono">
                <button
                  type="button"
                  onClick={() => setEditModal(null)}
                  className="px-4 py-2.5 text-xs text-[#8d8a84] hover:text-white uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="border border-white bg-white text-black hover:bg-transparent hover:text-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition disabled:opacity-40"
                >
                  {editLoading ? "Updating..." : "Save Changes →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
