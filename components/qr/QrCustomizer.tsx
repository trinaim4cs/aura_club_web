"use client";

import React, { useEffect, useRef, useState } from "react";
import type {
  CornerDotType,
  CornerSquareType,
  QRDotType,
  QRFrameType,
  QRStylingConfig,
} from "@/qr/types";
import {
  AURA_PRESET_CONFIG,
  DEFAULT_QR_CONFIG,
  buildQrCodeStylingOptions,
  evaluateScannability,
} from "@/qr/generator";

export default function QrCustomizer() {
  const [config, setConfig] = useState<QRStylingConfig>(DEFAULT_QR_CONFIG);
  const [activeTab, setActiveTab] = useState<"frame" | "shape" | "colors" | "corners" | "logo" | "text">("frame");
  const [useGradient, setUseGradient] = useState(false);
  const [gradientEndColor, setGradientEndColor] = useState("#2563eb");
  const [isExporting, setIsExporting] = useState(false);

  const qrRef = useRef<HTMLDivElement>(null);
  const qrCodeInstance = useRef<any>(null);

  // Initialize and update qr-code-styling instance
  useEffect(() => {
    let isMounted = true;

    async function loadQRCodeStyling() {
      const QRCodeStyling = (await import("qr-code-styling")).default;

      const gradientConfig = useGradient
        ? {
            type: "linear" as const,
            rotation: 45,
            colorStops: [
              { offset: 0, color: config.qrColor },
              { offset: 1, color: gradientEndColor },
            ],
          }
        : null;

      const activeConfig: QRStylingConfig = {
        ...config,
        gradient: gradientConfig,
      };

      const options = buildQrCodeStylingOptions(activeConfig);

      if (!qrCodeInstance.current) {
        qrCodeInstance.current = new QRCodeStyling(options);
        if (qrRef.current && isMounted) {
          qrRef.current.innerHTML = "";
          qrCodeInstance.current.append(qrRef.current);
        }
      } else {
        qrCodeInstance.current.update(options);
      }
    }

    loadQRCodeStyling();

    return () => {
      isMounted = false;
    };
  }, [config, useGradient, gradientEndColor]);

  // Handle logo file upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        setConfig((prev) => ({ ...prev, logoUrl: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = async (format: "svg" | "png") => {
    if (!qrCodeInstance.current) return;
    setIsExporting(true);
    try {
      await qrCodeInstance.current.download({
        name: `aura-qr-${config.code}`,
        extension: format,
      });
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const scannability = evaluateScannability(config);

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8 text-slate-100">
      <div className="mb-8 border-b border-slate-800 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-sky-400 font-mono">Dynamic QR Subsystem</span>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mt-1">QR CUSTOMIZER</h1>
            <p className="text-sm text-slate-400 mt-1 font-mono">
              Encoding: <span className="text-sky-300 font-semibold">{config.targetUrl}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setConfig(AURA_PRESET_CONFIG);
                setUseGradient(false);
              }}
              className="px-3 py-1.5 rounded text-xs font-mono bg-sky-950 text-sky-300 border border-sky-800 hover:bg-sky-900 transition"
            >
              AURA Preset
            </button>
            <button
              onClick={() => {
                setConfig(DEFAULT_QR_CONFIG);
                setUseGradient(false);
              }}
              className="px-3 py-1.5 rounded text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition"
            >
              Reset Default
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Customization Controls */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-xl p-6 backdrop-blur">
          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-800 pb-3">
            {[
              { id: "frame", label: "Frames" },
              { id: "shape", label: "Patterns & Shapes" },
              { id: "colors", label: "Colors" },
              { id: "corners", label: "Corners" },
              { id: "logo", label: "Logo" },
              { id: "text", label: "Text / CTA" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  activeTab === tab.id
                    ? "bg-sky-500 text-white shadow-sm shadow-sky-500/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: FRAMES */}
          {activeTab === "frame" && (
            <div className="space-y-4">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Select Frame Style
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { id: "none", label: "None / Raw" },
                  { id: "simple-top", label: "Banner Top" },
                  { id: "simple-bottom", label: "Banner Bottom" },
                  { id: "badge", label: "Club Badge" },
                  { id: "polaroid", label: "Polaroid Card" },
                  { id: "phone", label: "Mobile Mockup" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setConfig((p) => ({ ...p, frame: f.id as QRFrameType }))}
                    className={`p-3 rounded-lg border text-left text-xs font-medium transition ${
                      config.frame === f.id
                        ? "border-sky-500 bg-sky-950/40 text-sky-200"
                        : "border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700 hover:text-white"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: PATTERNS & SHAPES */}
          {activeTab === "shape" && (
            <div className="space-y-4">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Dot Pattern Style
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { id: "square", label: "Square (Standard)" },
                  { id: "dots", label: "Circular Dots" },
                  { id: "rounded", label: "Rounded" },
                  { id: "classy", label: "Classy" },
                  { id: "classy-rounded", label: "Classy Rounded" },
                  { id: "extra-rounded", label: "Extra Rounded" },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setConfig((p) => ({ ...p, dotType: s.id as QRDotType }))}
                    className={`p-3 rounded-lg border text-left text-xs font-medium transition ${
                      config.dotType === s.id
                        ? "border-sky-500 bg-sky-950/40 text-sky-200"
                        : "border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700 hover:text-white"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-800">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Margin (Quiet Zone)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="4"
                    max="32"
                    value={config.margin}
                    onChange={(e) => setConfig((p) => ({ ...p, margin: Number(e.target.value) }))}
                    className="w-full accent-sky-400 cursor-pointer"
                  />
                  <span className="text-xs font-mono text-slate-300 w-12 text-right">{config.margin}px</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COLORS */}
          {activeTab === "colors" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    QR Foreground Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={config.qrColor}
                      onChange={(e) => setConfig((p) => ({ ...p, qrColor: e.target.value }))}
                      className="w-10 h-10 rounded border border-slate-700 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={config.qrColor}
                      onChange={(e) => setConfig((p) => ({ ...p, qrColor: e.target.value }))}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono text-white"
                    />
                  </div>
                </div>

                <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Background Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={config.bgColor}
                      onChange={(e) => setConfig((p) => ({ ...p, bgColor: e.target.value }))}
                      className="w-10 h-10 rounded border border-slate-700 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={config.bgColor}
                      onChange={(e) => setConfig((p) => ({ ...p, bgColor: e.target.value }))}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Gradient Toggle */}
              <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Enable Dual Gradient
                  </span>
                  <input
                    type="checkbox"
                    checked={useGradient}
                    onChange={(e) => setUseGradient(e.target.checked)}
                    className="h-4 w-4 rounded accent-sky-400 cursor-pointer"
                  />
                </div>
                {useGradient && (
                  <div className="flex items-center gap-3 pt-2">
                    <input
                      type="color"
                      value={gradientEndColor}
                      onChange={(e) => setGradientEndColor(e.target.value)}
                      className="w-10 h-10 rounded border border-slate-700 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={gradientEndColor}
                      onChange={(e) => setGradientEndColor(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono text-white"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: CORNERS */}
          {activeTab === "corners" && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Eye Frame (Outer Corner)
                </label>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {[
                    { id: "square", label: "Square" },
                    { id: "dot", label: "Circle" },
                    { id: "extra-rounded", label: "Extra Rounded" },
                  ].map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setConfig((p) => ({ ...p, cornerSquareType: c.id as CornerSquareType }))}
                      className={`p-2.5 rounded-lg border text-center text-xs font-medium transition ${
                        config.cornerSquareType === c.id
                          ? "border-sky-500 bg-sky-950/40 text-sky-200"
                          : "border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={config.cornerSquareColor || config.qrColor}
                    onChange={(e) => setConfig((p) => ({ ...p, cornerSquareColor: e.target.value }))}
                    className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                  />
                  <span className="text-xs text-slate-400">Eye Frame Color</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Eye Ball (Inner Corner Dot)
                </label>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {[
                    { id: "square", label: "Square Dot" },
                    { id: "dot", label: "Circular Dot" },
                  ].map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setConfig((p) => ({ ...p, cornerDotType: d.id as CornerDotType }))}
                      className={`p-2.5 rounded-lg border text-center text-xs font-medium transition ${
                        config.cornerDotType === d.id
                          ? "border-sky-500 bg-sky-950/40 text-sky-200"
                          : "border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={config.cornerDotColor || config.qrColor}
                    onChange={(e) => setConfig((p) => ({ ...p, cornerDotColor: e.target.value }))}
                    className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                  />
                  <span className="text-xs text-slate-400">Eye Ball Color</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: LOGO */}
          {activeTab === "logo" && (
            <div className="space-y-5">
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Center Logo
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setConfig((p) => ({ ...p, logoUrl: "" }))}
                    className={`px-3 py-1.5 rounded border text-xs ${
                      !config.logoUrl ? "border-sky-500 bg-sky-950/50 text-white" : "border-slate-800 text-slate-400"
                    }`}
                  >
                    None
                  </button>
                  <button
                    onClick={() => setConfig((p) => ({ ...p, logoUrl: "/aura/qr-logo.svg", logoSize: 0.36 }))}
                    className={`px-3 py-1.5 rounded border text-xs ${
                      config.logoUrl === "/aura/qr-logo.svg"
                        ? "border-sky-500 bg-sky-950/50 text-white"
                        : "border-slate-800 text-slate-400"
                    }`}
                  >
                    AURA Wordmark (Reference)
                  </button>
                  <button
                    onClick={() => setConfig((p) => ({ ...p, logoUrl: "/apple-icon.png", logoSize: 0.22 }))}
                    className={`px-3 py-1.5 rounded border text-xs ${
                      config.logoUrl === "/apple-icon.png"
                        ? "border-sky-500 bg-sky-950/50 text-white"
                        : "border-slate-800 text-slate-400"
                    }`}
                  >
                    AURA Emblem
                  </button>
                  <label className="px-3 py-1.5 rounded border border-slate-700 bg-slate-800 text-xs text-slate-200 cursor-pointer hover:bg-slate-700 transition">
                    Upload Custom Image
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {config.logoUrl && (
                <div className="space-y-4 pt-3 border-t border-slate-800">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">
                      Logo Size ({Math.round(config.logoSize * 100)}%)
                    </label>
                    <input
                      type="range"
                      min="0.10"
                      max="0.35"
                      step="0.02"
                      value={config.logoSize}
                      onChange={(e) => setConfig((p) => ({ ...p, logoSize: parseFloat(e.target.value) }))}
                      className="w-full accent-sky-400 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Logo Margin</label>
                    <input
                      type="range"
                      min="0"
                      max="12"
                      value={config.logoMargin}
                      onChange={(e) => setConfig((p) => ({ ...p, logoMargin: parseInt(e.target.value) }))}
                      className="w-full accent-sky-400 cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: TEXT / CTA */}
          {activeTab === "text" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Call to Action Banner Text
                </label>
                <input
                  type="text"
                  value={config.frameText}
                  onChange={(e) => setConfig((p) => ({ ...p, frameText: e.target.value }))}
                  placeholder="e.g. SCAN ME • JOIN AURA"
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Banner Background</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.frameBgColor}
                      onChange={(e) => setConfig((p) => ({ ...p, frameBgColor: e.target.value }))}
                      className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={config.frameBgColor}
                      onChange={(e) => setConfig((p) => ({ ...p, frameBgColor: e.target.value }))}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">Banner Text Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.frameTextColor}
                      onChange={(e) => setConfig((p) => ({ ...p, frameTextColor: e.target.value }))}
                      className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={config.frameTextColor}
                      onChange={(e) => setConfig((p) => ({ ...p, frameTextColor: e.target.value }))}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Frame Preview & Download Bar */}
        <div className="lg:col-span-5 flex flex-col items-center">
          {/* Frame Container */}
          <div
            className={`transition-all duration-300 rounded-2xl flex flex-col items-center justify-center p-6 shadow-2xl ${
              config.frame === "badge"
                ? "bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-sky-500/50"
                : config.frame === "polaroid"
                ? "bg-white text-slate-950 shadow-white/5 pb-10"
                : config.frame === "phone"
                ? "border-8 border-slate-700 bg-slate-950 rounded-[40px] pt-8 pb-8 px-4"
                : "bg-slate-900/90 border border-slate-800"
            }`}
            style={{
              backgroundColor: config.frame === "polaroid" ? "#ffffff" : undefined,
            }}
          >
            {/* Top Frame Banner */}
            {(config.frame === "simple-top" || config.frame === "badge") && (
              <div
                className="w-full text-center py-2 px-4 rounded-lg mb-4 text-xs font-bold tracking-widest uppercase"
                style={{
                  backgroundColor: config.frameBgColor,
                  color: config.frameTextColor,
                }}
              >
                {config.frameText || "SCAN TO ENTER"}
              </div>
            )}

            {/* QR Rendering Canvas container */}
            <div
              ref={qrRef}
              className="rounded-xl overflow-hidden shadow-inner flex items-center justify-center"
              style={{
                backgroundColor: config.bgColor,
                width: config.width,
                height: config.height,
              }}
            />

            {/* Bottom Frame Banner */}
            {(config.frame === "simple-bottom" || config.frame === "polaroid" || config.frame === "phone") && (
              <div
                className="w-full text-center py-2 px-4 rounded-lg mt-4 text-xs font-bold tracking-widest uppercase font-mono"
                style={{
                  backgroundColor: config.frame === "polaroid" ? "transparent" : config.frameBgColor,
                  color: config.frame === "polaroid" ? "#0f172a" : config.frameTextColor,
                }}
              >
                {config.frameText || "SCAN ME"}
              </div>
            )}
          </div>

          {/* Scannability Warning & Contrast Analysis */}
          <div className="w-full max-w-[340px] mt-6 bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-400 font-mono">Contrast Ratio:</span>
              <span
                className={`font-bold font-mono ${
                  scannability.contrastRatio >= 4.5
                    ? "text-emerald-400"
                    : scannability.contrastRatio >= 3.0
                    ? "text-amber-400"
                    : "text-rose-400"
                }`}
              >
                {scannability.contrastRatio}:1 (
                {scannability.contrastRatio >= 4.5 ? "Optimal" : scannability.contrastRatio >= 3.0 ? "Fair" : "Low"})
              </span>
            </div>

            {scannability.warnings.length > 0 && (
              <div className="space-y-1 mt-2 pt-2 border-t border-slate-800/80">
                {scannability.warnings.map((w, idx) => (
                  <p key={idx} className="text-[11px] text-amber-300/90 leading-tight">
                    ⚠ {w}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Action Export Buttons */}
          <div className="w-full max-w-[340px] mt-4 grid grid-cols-2 gap-3">
            <button
              onClick={() => handleDownload("svg")}
              disabled={isExporting}
              className="w-full py-2.5 px-3 rounded-lg text-xs font-semibold tracking-wider uppercase bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition flex items-center justify-center gap-1.5 shadow"
            >
              Download SVG
            </button>
            <button
              onClick={() => handleDownload("png")}
              disabled={isExporting}
              className="w-full py-2.5 px-3 rounded-lg text-xs font-semibold tracking-wider uppercase bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/20 transition flex items-center justify-center gap-1.5"
            >
              Download PNG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
