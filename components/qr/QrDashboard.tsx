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
    <div className="space-y-8">
      {/* Top Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] font-mono uppercase text-slate-400">Total Campaigns</span>
          <p className="text-2xl font-extrabold text-white mt-1">{qrs.length}</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] font-mono uppercase text-slate-400">Total Scans (All)</span>
          <p className="text-2xl font-extrabold text-sky-400 mt-1">{totalAllScans}</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] font-mono uppercase text-slate-400">Unique Devices (All)</span>
          <p className="text-2xl font-extrabold text-emerald-400 mt-1">{totalAllVisitors}</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase text-slate-400">Campaigns Active</span>
            <p className="text-2xl font-extrabold text-purple-400 mt-1">
              {qrs.filter((q) => q.active).length} / {qrs.length}
            </p>
          </div>
          <button
            onClick={() => {
              setCreateError(null);
              setCreateOpen(true);
            }}
            className="px-3.5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold uppercase tracking-wider shadow-lg shadow-sky-500/20 transition"
          >
            + New QR
          </button>
        </div>
      </div>

      {/* Campaign Management Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden backdrop-blur">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Active Dynamic Campaigns</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Edit destination URLs anytime. Printed QR codes remain permanent.
            </p>
          </div>
          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Search campaigns or slugs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500 font-mono">Loading campaigns from Supabase...</div>
        ) : filteredQrs.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 font-mono">No campaigns match search criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/60 font-mono uppercase text-slate-400 text-[10px]">
                <tr>
                  <th className="py-3 px-4">Campaign & Slug</th>
                  <th className="py-3 px-4">Destination Target</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Total Scans</th>
                  <th className="py-3 px-4 text-right">Unique Devices</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredQrs.map((qr) => {
                  const isSelected = selectedQrId === qr.id;
                  return (
                    <tr
                      key={qr.id}
                      className={`hover:bg-slate-800/40 transition ${
                        isSelected ? "bg-sky-950/20 border-l-2 border-sky-400" : ""
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{qr.name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <code className="text-[11px] font-mono text-sky-400">/r/{qr.code}</code>
                          <button
                            onClick={() => handleCopyLink(qr.code)}
                            title="Copy full scan URL"
                            className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800"
                          >
                            {copiedCode === qr.code ? "Copied!" : "Copy"}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="truncate text-slate-400 font-mono text-[11px]" title={qr.destination_url}>
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
                          className="text-[10px] text-sky-400 hover:underline mt-0.5 block"
                        >
                          Change Target URL
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleActive(qr)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold transition ${
                            qr.active
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20"
                          }`}
                        >
                          {qr.active ? "Active" : "Paused"}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-white">{qr.total_scans}</td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-300">{qr.unique_visitors_est}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedQrId(qr.id)}
                            className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                              isSelected
                                ? "bg-sky-500 text-white"
                                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                            }`}
                          >
                            Analytics
                          </button>
                          {onCustomizeQr && (
                            <button
                              onClick={() => onCustomizeQr(qr)}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-[11px] font-medium"
                            >
                              Style QR
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(qr.id, qr.name)}
                            className="text-slate-500 hover:text-rose-400 p-1"
                            title="Delete QR Code"
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

      {/* Selected Campaign Analytics Drilldown */}
      {selectedQrId && (
        <div className="space-y-6 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono uppercase text-sky-400 tracking-wider">
                Real-Time Campaign Telemetry
              </span>
              <h3 className="text-xl font-extrabold text-white mt-0.5">
                {qrs.find((q) => q.id === selectedQrId)?.name || "Campaign Analytics"}
              </h3>
            </div>
            {summaryLoading && (
              <span className="text-xs font-mono text-slate-400 animate-pulse">Refreshing metrics...</span>
            )}
          </div>

          {summary ? (
            <>
              {/* Campaign KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Total Scans</span>
                  <p className="text-xl font-bold text-white mt-1">{summary.total_scans}</p>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Unique Devices</span>
                  <p className="text-xl font-bold text-emerald-400 mt-1">{summary.unique_visitors_est}</p>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Scans Today</span>
                  <p className="text-xl font-bold text-sky-400 mt-1">{summary.scans_today}</p>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Last 7 Days</span>
                  <p className="text-xl font-bold text-purple-400 mt-1">{summary.scans_this_week}</p>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Bot Scans Filtered</span>
                  <p className="text-xl font-bold text-slate-400 mt-1">{summary.bot_scans}</p>
                </div>
              </div>

              {/* Time Series Activity */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-4">
                  Daily Scan Activity & Unique Visitors
                </h4>
                {summary.scans_over_time.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500 font-mono">
                    No scans registered for this QR code yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {summary.scans_over_time.map((pt) => {
                      const maxScans = Math.max(...summary.scans_over_time.map((p) => p.scans), 1);
                      const widthPercent = Math.max((pt.scans / maxScans) * 100, 4);
                      return (
                        <div key={pt.date} className="flex items-center gap-3 text-xs">
                          <span className="w-20 font-mono text-slate-400 text-[11px]">{pt.date}</span>
                          <div className="flex-1 bg-slate-950 rounded-full h-5 overflow-hidden flex items-center p-0.5">
                            <div
                              className="bg-sky-500 h-full rounded-full transition-all flex items-center justify-end px-2 text-[10px] font-bold text-white"
                              style={{ width: `${widthPercent}%` }}
                            >
                              {pt.scans}
                            </div>
                          </div>
                          <span className="w-24 text-right font-mono text-[11px] text-emerald-400">
                            {pt.unique_visitors} unique
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Distributions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Geo: Countries & Cities */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">
                    Top Geographies
                  </h4>
                  {summary.countries.length === 0 ? (
                    <p className="text-xs text-slate-500 font-mono">No geo data logged.</p>
                  ) : (
                    <div className="space-y-3">
                      {summary.countries.map((c) => (
                        <div key={c.label}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-300">{c.label}</span>
                            <span className="font-mono text-slate-400">
                              {c.count} ({c.percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-sky-400 h-full rounded-full" style={{ width: `${c.percentage}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Operating Systems & Browsers */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">
                    Platforms & Browsers
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1.5">OS</span>
                      <div className="space-y-1.5">
                        {summary.operating_systems.slice(0, 4).map((os) => (
                          <div key={os.label} className="flex justify-between text-xs">
                            <span className="text-slate-300">{os.label}</span>
                            <span className="font-mono text-slate-400">{os.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800">
                      <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1.5">Browsers</span>
                      <div className="space-y-1.5">
                        {summary.browsers.slice(0, 4).map((b) => (
                          <div key={b.label} className="flex justify-between text-xs">
                            <span className="text-slate-300">{b.label}</span>
                            <span className="font-mono text-slate-400">{b.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Device Types & Traffic Sources */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">
                    Devices & Traffic Sources
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1.5">Device Type</span>
                      <div className="space-y-1.5">
                        {summary.device_types.map((d) => (
                          <div key={d.label} className="flex justify-between text-xs">
                            <span className="text-slate-300 capitalize">{d.label}</span>
                            <span className="font-mono text-slate-400">{d.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800">
                      <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1.5">Referrers</span>
                      {summary.referrers.length === 0 ? (
                        <p className="text-xs text-slate-500 font-mono">Direct / Camera scans</p>
                      ) : (
                        <div className="space-y-1.5">
                          {summary.referrers.slice(0, 4).map((r) => (
                            <div key={r.label} className="flex justify-between text-xs truncate">
                              <span className="text-slate-300 truncate mr-2" title={r.label}>
                                {r.label}
                              </span>
                              <span className="font-mono text-slate-400">{r.count}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Scan Audit Log */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-slate-800">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Recent Scan Events (Privacy Preserved)
                  </h4>
                </div>
                {summary.recent_scans.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500 font-mono">No scans recorded yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-800 bg-slate-950/60 font-mono uppercase text-slate-400 text-[10px]">
                        <tr>
                          <th className="py-2.5 px-4">Time (UTC)</th>
                          <th className="py-2.5 px-4">Location</th>
                          <th className="py-2.5 px-4">Device</th>
                          <th className="py-2.5 px-4">Browser & OS</th>
                          <th className="py-2.5 px-4 text-center">Type</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {summary.recent_scans.slice(0, 15).map((s) => (
                          <tr key={s.id} className="hover:bg-slate-800/30">
                            <td className="py-2.5 px-4 font-mono text-[11px] text-slate-400">
                              {new Date(s.scanned_at).toLocaleString()}
                            </td>
                            <td className="py-2.5 px-4">
                              {s.city || s.country ? `${s.city ?? "Unknown"}, ${s.country ?? ""}` : "Unknown"}
                            </td>
                            <td className="py-2.5 px-4 capitalize">{s.device_type}</td>
                            <td className="py-2.5 px-4">
                              {s.browser} • {s.operating_system}
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              {s.is_bot ? (
                                <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-mono">
                                  Bot
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono">
                                  User
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
            <div className="py-12 text-center text-xs text-slate-500 font-mono">Select a campaign to view metrics.</div>
          )}
        </div>
      )}

      {/* CREATE MODAL */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Create New Dynamic QR Campaign</h3>
            <p className="text-xs text-slate-400 mt-1">
              Supports any external destination URL (Luma, Google Forms, Discord, Notion, Event page).
            </p>

            <form onSubmit={handleCreateSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Campaign Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SRM AI Hackathon 2026"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  QR Slug (/r/[code])
                </label>
                <div className="flex items-center rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-400">
                  <span className="font-mono text-slate-500">https://join-aura.vercel.app/r/</span>
                  <input
                    type="text"
                    required
                    placeholder="hackathon2026"
                    value={createForm.code}
                    onChange={(e) =>
                      setCreateForm((p) => ({ ...p, code: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "") }))
                    }
                    className="flex-1 bg-transparent text-white font-mono focus:outline-none ml-1"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Letters, numbers, dashes, and underscores only. Permanent link.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Destination Target URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://lu.ma/srm-ai-hack"
                  value={createForm.destination_url}
                  onChange={(e) => setCreateForm((p) => ({ ...p, destination_url: e.target.value }))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:border-sky-500 focus:outline-none font-mono"
                />
              </div>

              {createError && (
                <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                  {createError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-xs font-semibold text-white shadow-lg shadow-sky-500/20 transition disabled:opacity-50"
                >
                  {createLoading ? "Creating..." : "Save Campaign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Edit Destination Target</h3>
            <p className="text-xs text-slate-400 mt-1">
              Updating destination URL for <code className="text-sky-300">/r/{editModal.code}</code>. Printed QR stays
              valid.
            </p>

            <form onSubmit={handleEditSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Campaign Name
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Destination Target URL
                </label>
                <input
                  type="url"
                  required
                  value={editForm.destination_url}
                  onChange={(e) => setEditForm((p) => ({ ...p, destination_url: e.target.value }))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-sky-500 focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="edit-active"
                  checked={editForm.active}
                  onChange={(e) => setEditForm((p) => ({ ...p, active: e.target.checked }))}
                  className="h-4 w-4 rounded accent-sky-500"
                />
                <label htmlFor="edit-active" className="text-xs text-slate-300">
                  Campaign Active (unchecked returns 404 on scan)
                </label>
              </div>

              {editError && (
                <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                  {editError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditModal(null)}
                  className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-xs font-semibold text-white shadow-lg shadow-sky-500/20 transition disabled:opacity-50"
                >
                  {editLoading ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
