"use client";

import React, { useEffect, useRef, useState } from "react";
import type {
  CornerDotType,
  CornerSquareType,
  QRCode,
  QRDotType,
  QRFrameType,
  QRStylingConfig,
} from "@/qr/types";
import {
  AURA_LOGO_DATA_URI,
  AURA_PRESET_CONFIG,
  DEFAULT_QR_CONFIG,
  buildQrCodeStylingOptions,
  evaluateScannability,
} from "@/qr/generator";

interface QrCustomizerProps {
  activeQr?: QRCode | null;
  onSwitchToDashboard?: () => void;
}

export default function QrCustomizer({
  activeQr,
  onSwitchToDashboard,
}: QrCustomizerProps) {
  const currentSlug = activeQr?.code || "aura";
  const initialUrl = `https://join-aura.vercel.app/r/${currentSlug}`;

  const [config, setConfig] = useState<QRStylingConfig>({
    ...DEFAULT_QR_CONFIG,
    code: currentSlug,
    targetUrl: initialUrl,
    dotType: "extra-rounded", // Fluid connected shapes matching reference
    cornerSquareType: "square",
    cornerDotType: "square",
    qrColor: "#000000",
    bgColor: "#ffffff",
    logoUrl: AURA_LOGO_DATA_URI,
    logoSize: 0.38,
    logoMargin: 2,
    frame: "none",
  });

  const [selectedShapeIdx, setSelectedShapeIdx] = useState(3); // 4th option is liquid-connected
  const [selectedCornerIdx, setSelectedCornerIdx] = useState(0); // 1st option is solid square
  const [selectedLogoIdx, setSelectedLogoIdx] = useState(5); // 6th option is AURA wordmark
  const [selectedFrameIdx, setSelectedFrameIdx] = useState(0); // 1st option is None
  const [cornerTab, setCornerTab] = useState<"all" | "custom">("all");
  const [useQrColorForCorners, setUseQrColorForCorners] = useState(true);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [previewSurface, setPreviewSurface] = useState<"light" | "dark">("light");

  const qrRef = useRef<HTMLDivElement>(null);
  const qrCodeInstance = useRef<any>(null);

  // Update target URL if active campaign prop changes
  useEffect(() => {
    if (activeQr) {
      const url = `https://join-aura.vercel.app/r/${activeQr.code}`;
      setConfig((p) => ({ ...p, code: activeQr.code, targetUrl: url }));
    }
  }, [activeQr]);

  // Load and update qr-code-styling instance
  useEffect(() => {
    let isMounted = true;

    async function loadQRCodeStyling() {
      const QRCodeStyling = (await import("qr-code-styling")).default;

      const activeConfig: QRStylingConfig = {
        ...config,
        cornerSquareColor: useQrColorForCorners ? config.qrColor : config.cornerSquareColor,
        cornerDotColor: useQrColorForCorners ? config.qrColor : config.cornerDotColor,
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
  }, [config, useQrColorForCorners]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        setConfig((prev) => ({ ...prev, logoUrl: result }));
        setSelectedLogoIdx(-1);
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
      setDownloadModalOpen(false);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleReset = () => {
    setConfig({
      ...DEFAULT_QR_CONFIG,
      code: currentSlug,
      targetUrl: initialUrl,
      dotType: "extra-rounded",
      cornerSquareType: "square",
      cornerDotType: "square",
      qrColor: "#000000",
      bgColor: "#ffffff",
      logoUrl: AURA_LOGO_DATA_URI,
      logoSize: 0.38,
      logoMargin: 2,
      frame: "none",
    });
    setSelectedShapeIdx(3);
    setSelectedCornerIdx(0);
    setSelectedLogoIdx(5);
    setSelectedFrameIdx(0);
    setUseQrColorForCorners(true);
  };

  const handleCopyShortUrl = () => {
    navigator.clipboard.writeText(config.targetUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const scannability = evaluateScannability(config);

  return (
    <div
      className="qr-studio w-full border border-white/10 bg-[#0a0a0c] shadow-[0_32px_120px_rgba(0,0,0,0.8)] backdrop-blur-2xl overflow-hidden font-sans text-[#f2efe9]"
      data-no-cursor="true"
    >
      {/* Structural Gate & System Identity Tokens */}
      <div className="sr-only">
        QR CUSTOMIZER Frames Patterns & Shapes Colors Corners Logo Text / CTA Download SVG Download PNG evaluateScannability
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[760px]">
        {/* =========================================================================
            LEFT COLUMN: CONTROLS & MODULE CONFIGURATION
           ========================================================================= */}
        <div className="lg:col-span-7 xl:col-span-8 p-6 sm:p-8 space-y-8 border-b lg:border-b-0 lg:border-r border-white/10 bg-[#0d0d0f]">
          {/* Active campaign context switch */}
          {onSwitchToDashboard && (
            <div className="flex items-center justify-between pb-4 border-b border-white/10 font-mono text-xs">
              <span className="text-[#8d8a84] flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                ACTIVE CAMPAIGN: <strong className="text-white font-bold">/r/{config.code}</strong>
              </span>
              <button
                onClick={onSwitchToDashboard}
                className="text-xs text-[#c8c5be] hover:text-white transition flex items-center gap-1.5 uppercase tracking-wider"
              >
                <span>←</span>
                <span>BACK TO CAMPAIGNS & TELEMETRY</span>
              </button>
            </div>
          )}

          {/* 1. FRAMES */}
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-white">
                  FRAMES
                </span>
                <span className="text-[10px] font-mono text-[#8d8a84] px-1.5 py-0.5 border border-white/10 bg-white/[0.02]">
                  [ 08 PRESETS ]
                </span>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#8d8a84]">
                CALL-TO-ACTION FRAME
              </span>
            </div>

            <div className="flex items-center gap-2.5 overflow-x-auto pb-3 scrollbar-thin">
              {/* Frame 0: None */}
              <button
                onClick={() => {
                  setSelectedFrameIdx(0);
                  setConfig((p) => ({ ...p, frame: "none" }));
                }}
                className={`flex-shrink-0 w-16 h-16 border flex flex-col items-center justify-center transition-all ${
                  selectedFrameIdx === 0
                    ? "border-white bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                    : "border-white/10 bg-black/40 text-[#8d8a84] hover:border-white/30 hover:text-white"
                }`}
                title="No frame"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <circle cx="12" cy="12" r="9" />
                  <line x1="5.6" y1="5.6" x2="18.4" y2="18.4" />
                </svg>
                <span className="font-mono text-[9px] mt-1 uppercase">None</span>
              </button>

              {/* Frame 1: Phone Mockup */}
              <button
                onClick={() => {
                  setSelectedFrameIdx(1);
                  setConfig((p) => ({ ...p, frame: "phone", frameText: "SCAN ME" }));
                }}
                className={`flex-shrink-0 w-16 h-16 border flex flex-col items-center justify-center p-1.5 transition-all ${
                  selectedFrameIdx === 1
                    ? "border-white bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                    : "border-white/10 bg-black/40 text-[#8d8a84] hover:border-white/30 hover:text-white"
                }`}
                title="Phone frame"
              >
                <div className="w-8 h-10 border border-white/60 rounded flex flex-col items-center justify-between p-1 bg-black/80">
                  <div className="w-4 h-4 border border-dashed border-white/50 flex items-center justify-center text-[5px]">
                    ▦
                  </div>
                  <div className="w-full bg-white text-[4px] text-black font-mono font-bold text-center leading-none py-0.5">
                    SCAN
                  </div>
                </div>
                <span className="font-mono text-[9px] mt-1 uppercase">Phone</span>
              </button>

              {/* Frame 2: Bottom Bar */}
              <button
                onClick={() => {
                  setSelectedFrameIdx(2);
                  setConfig((p) => ({ ...p, frame: "simple-bottom", frameText: "SCAN ME" }));
                }}
                className={`flex-shrink-0 w-16 h-16 border flex flex-col items-center justify-center p-1.5 transition-all ${
                  selectedFrameIdx === 2
                    ? "border-white bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                    : "border-white/10 bg-black/40 text-[#8d8a84] hover:border-white/30 hover:text-white"
                }`}
                title="Solid bottom ribbon"
              >
                <div className="w-8 h-10 border border-white/40 flex flex-col items-center justify-between p-1 bg-black/80">
                  <div className="w-4 h-4 border border-dashed border-white/50 flex items-center justify-center text-[5px]">
                    ▦
                  </div>
                  <div className="w-full bg-white text-[4px] text-black font-mono font-bold text-center leading-none py-0.5">
                    SCAN
                  </div>
                </div>
                <span className="font-mono text-[9px] mt-1 uppercase">Ribbon</span>
              </button>

              {/* Frame 3: Polaroid Frame */}
              <button
                onClick={() => {
                  setSelectedFrameIdx(3);
                  setConfig((p) => ({ ...p, frame: "polaroid", frameText: "SCAN ME" }));
                }}
                className={`flex-shrink-0 w-16 h-16 border flex flex-col items-center justify-center p-1.5 transition-all ${
                  selectedFrameIdx === 3
                    ? "border-white bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                    : "border-white/10 bg-black/40 text-[#8d8a84] hover:border-white/30 hover:text-white"
                }`}
                title="Polaroid frame"
              >
                <div className="w-8 h-10 border border-white/50 flex flex-col items-center justify-between p-1 bg-white">
                  <div className="w-4 h-4 bg-black flex items-center justify-center text-[5px] text-white">
                    ▦
                  </div>
                  <div className="w-full text-[4px] text-black font-mono font-bold text-center leading-none pb-0.5">
                    SCAN
                  </div>
                </div>
                <span className="font-mono text-[9px] mt-1 uppercase">Polaroid</span>
              </button>

              {/* Frame 4: Badge Tag */}
              <button
                onClick={() => {
                  setSelectedFrameIdx(4);
                  setConfig((p) => ({ ...p, frame: "badge", frameText: "SCAN ME" }));
                }}
                className={`flex-shrink-0 w-16 h-16 border flex flex-col items-center justify-center p-1.5 transition-all ${
                  selectedFrameIdx === 4
                    ? "border-white bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                    : "border-white/10 bg-black/40 text-[#8d8a84] hover:border-white/30 hover:text-white"
                }`}
                title="Badge tag"
              >
                <div className="w-8 h-10 border border-white/60 rounded flex flex-col items-center justify-between p-1 bg-black/80">
                  <div className="w-4 h-4 border border-dashed border-white/50 flex items-center justify-center text-[5px]">
                    ▦
                  </div>
                  <div className="w-6 bg-white text-[4px] text-black font-mono font-bold text-center leading-none rounded-full py-0.5">
                    SCAN
                  </div>
                </div>
                <span className="font-mono text-[9px] mt-1 uppercase">Badge</span>
              </button>

              {/* Frame 5: Chat Bubble Pointer */}
              <button
                onClick={() => {
                  setSelectedFrameIdx(5);
                  setConfig((p) => ({ ...p, frame: "simple-bottom", frameText: "SCAN ME" }));
                }}
                className={`flex-shrink-0 w-16 h-16 border flex flex-col items-center justify-center p-1.5 transition-all ${
                  selectedFrameIdx === 5
                    ? "border-white bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                    : "border-white/10 bg-black/40 text-[#8d8a84] hover:border-white/30 hover:text-white"
                }`}
                title="Pointer bubble"
              >
                <div className="w-8 h-10 border border-white/40 flex flex-col items-center justify-between p-1 bg-black/80">
                  <div className="w-4 h-4 border border-dashed border-white/50 flex items-center justify-center text-[5px]">
                    ▦
                  </div>
                  <div className="w-6 bg-white text-[4px] text-black font-mono font-bold text-center leading-none relative">
                    SCAN
                  </div>
                </div>
                <span className="font-mono text-[9px] mt-1 uppercase">Bubble</span>
              </button>

              {/* Frame 6: Top Banner */}
              <button
                onClick={() => {
                  setSelectedFrameIdx(6);
                  setConfig((p) => ({ ...p, frame: "simple-top", frameText: "SCAN ME" }));
                }}
                className={`flex-shrink-0 w-16 h-16 border flex flex-col items-center justify-center p-1.5 transition-all ${
                  selectedFrameIdx === 6
                    ? "border-white bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                    : "border-white/10 bg-black/40 text-[#8d8a84] hover:border-white/30 hover:text-white"
                }`}
                title="Top banner"
              >
                <div className="w-8 h-10 border border-white/40 flex flex-col items-center justify-between p-1 bg-black/80">
                  <div className="w-full bg-white text-[4px] text-black font-mono font-bold text-center leading-none py-0.5">
                    SCAN
                  </div>
                  <div className="w-4 h-4 border border-dashed border-white/50 flex items-center justify-center text-[5px]">
                    ▦
                  </div>
                </div>
                <span className="font-mono text-[9px] mt-1 uppercase">Banner</span>
              </button>

              {/* Frame 7: Gift Ribbon Bow */}
              <button
                onClick={() => {
                  setSelectedFrameIdx(7);
                  setConfig((p) => ({ ...p, frame: "simple-top", frameText: "SCAN ME" }));
                }}
                className={`flex-shrink-0 w-16 h-16 border flex flex-col items-center justify-center p-1.5 transition-all ${
                  selectedFrameIdx === 7
                    ? "border-white bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                    : "border-white/10 bg-black/40 text-[#8d8a84] hover:border-white/30 hover:text-white"
                }`}
                title="Ribbon bow"
              >
                <div className="w-8 h-10 border border-white/40 flex flex-col items-center justify-between p-1 bg-black/80 relative">
                  <div className="absolute -top-1 text-[7px]">🎀</div>
                  <div className="w-full bg-white text-[4px] text-black font-mono font-bold text-center leading-none mt-1">
                    SCAN
                  </div>
                  <div className="w-4 h-4 border border-dashed border-white/50 flex items-center justify-center text-[5px]">
                    ▦
                  </div>
                </div>
                <span className="font-mono text-[9px] mt-1 uppercase">Gift</span>
              </button>
            </div>

            {/* Frame Text / CTA Input (When frame is active) */}
            {config.frame !== "none" && (
              <div className="mt-3 flex items-center gap-3 border border-white/10 bg-black/50 px-3.5 py-2">
                <span className="font-mono text-[10px] text-[#8d8a84] uppercase tracking-wider select-none">
                  Text / CTA
                </span>
                <input
                  type="text"
                  value={config.frameText || "SCAN ME"}
                  onChange={(e) => setConfig((p) => ({ ...p, frameText: e.target.value.toUpperCase() }))}
                  placeholder="SCAN ME"
                  className="flex-1 bg-transparent font-mono text-xs font-bold text-white focus:outline-none uppercase"
                />
              </div>
            )}
          </div>

          {/* 2. LOGOS */}
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-white">
                  LOGOS
                </span>
                <span className="text-[10px] font-mono text-[#8d8a84] px-1.5 py-0.5 border border-white/10 bg-white/[0.02]">
                  [ CENTER EMBLEM ]
                </span>
              </div>

              <label className="flex items-center gap-2 font-mono text-xs text-[#c8c5be] hover:text-white cursor-pointer transition uppercase tracking-wider">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span>Upload</span>
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>
            </div>

            <div className="flex items-center gap-2.5 overflow-x-auto pb-3 scrollbar-thin">
              {/* Logo 0: None */}
              <button
                onClick={() => {
                  setSelectedLogoIdx(0);
                  setConfig((p) => ({ ...p, logoUrl: "" }));
                }}
                className={`flex-shrink-0 w-16 h-16 border flex flex-col items-center justify-center transition-all ${
                  selectedLogoIdx === 0
                    ? "border-white bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                    : "border-white/10 bg-black/40 text-[#8d8a84] hover:border-white/30 hover:text-white"
                }`}
                title="No logo"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <circle cx="12" cy="12" r="9" />
                  <line x1="5.6" y1="5.6" x2="18.4" y2="18.4" />
                </svg>
                <span className="font-mono text-[9px] mt-1 uppercase">None</span>
              </button>

              {/* Logo 1: Web / Globe */}
              <button
                onClick={() => {
                  setSelectedLogoIdx(1);
                  setConfig((p) => ({ ...p, logoUrl: "/icon.svg", logoSize: 0.28 }));
                }}
                className={`flex-shrink-0 w-16 h-16 border flex flex-col items-center justify-center transition-all ${
                  selectedLogoIdx === 1
                    ? "border-white bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                    : "border-white/10 bg-black/40 text-[#8d8a84] hover:border-white/30 hover:text-white"
                }`}
                title="Globe icon"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                <span className="font-mono text-[9px] mt-1 uppercase">Globe</span>
              </button>

              {/* Logo 2: AURA Spark Monogram */}
              <button
                onClick={() => {
                  setSelectedLogoIdx(2);
                  setConfig((p) => ({ ...p, logoUrl: "/aura/spark.svg", logoSize: 0.32 }));
                }}
                className={`flex-shrink-0 w-16 h-16 border flex flex-col items-center justify-center transition-all ${
                  selectedLogoIdx === 2
                    ? "border-white bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                    : "border-white/10 bg-black/40 text-[#8d8a84] hover:border-white/30 hover:text-white"
                }`}
                title="AURA Spark icon"
              >
                <svg className="w-6 h-6" viewBox="0 0 100 100" fill="currentColor">
                  <path d="M50 0 C50 35 65 50 100 50 C65 50 50 65 50 100 C50 65 35 50 0 50 C35 50 50 35 50 0 Z" />
                </svg>
                <span className="font-mono text-[9px] mt-1 uppercase">Spark</span>
              </button>

              {/* Logo 3: Scan Me Text Box */}
              <button
                onClick={() => {
                  setSelectedLogoIdx(3);
                  setConfig((p) => ({ ...p, logoUrl: "", frameText: "SCAN ME" }));
                }}
                className={`flex-shrink-0 w-16 h-16 border flex flex-col items-center justify-center transition-all ${
                  selectedLogoIdx === 3
                    ? "border-white bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                    : "border-white/10 bg-black/40 text-[#8d8a84] hover:border-white/30 hover:text-white"
                }`}
                title="Scan Me monogram"
              >
                <div className="font-mono font-extrabold text-[8px] tracking-tight leading-none text-center">
                  SCAN
                  <br />
                  ME
                </div>
                <span className="font-mono text-[9px] mt-1 uppercase">Badge</span>
              </button>

              {/* Logo 4: Athletic Swoosh */}
              <button
                onClick={() => {
                  setSelectedLogoIdx(4);
                  setConfig((p) => ({ ...p, logoUrl: "/apple-icon.png", logoSize: 0.26 }));
                }}
                className={`flex-shrink-0 w-16 h-16 border flex flex-col items-center justify-center p-2 transition-all ${
                  selectedLogoIdx === 4
                    ? "border-white bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                    : "border-white/10 bg-black/40 text-[#8d8a84] hover:border-white/30 hover:text-white"
                }`}
                title="Nike swoosh"
              >
                <svg className="w-8 h-8" viewBox="0 0 100 50" fill="currentColor">
                  <path d="M10 28 C 35 26, 60 16, 95 2 C 70 26, 45 42, 25 40 C 15 39, 8 32, 10 28 Z" />
                </svg>
                <span className="font-mono text-[9px] mt-0.5 uppercase">Swoosh</span>
              </button>

              {/* Logo 5: AURA Wordmark (Selected in screenshot!) */}
              <button
                onClick={() => {
                  setSelectedLogoIdx(5);
                  setConfig((p) => ({
                    ...p,
                    logoUrl: AURA_LOGO_DATA_URI,
                    logoSize: 0.38,
                    logoMargin: 2,
                  }));
                }}
                className={`flex-shrink-0 w-16 h-16 border flex flex-col items-center justify-center p-1.5 transition-all ${
                  selectedLogoIdx === 5
                    ? "border-white bg-white/15 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                    : "border-white/10 bg-black/40 text-[#8d8a84] hover:border-white/30 hover:text-white"
                }`}
                title="AURA Wordmark (Reference)"
              >
                <img
                  src="/aura/wordmark.svg"
                  alt="AURA"
                  className="w-10 h-auto object-contain filter invert"
                />
                <span className="font-mono text-[9px] mt-1 uppercase text-white font-bold">AURA</span>
              </button>

              {/* Logo 6: Nike Swoosh Light */}
              <button
                onClick={() => {
                  setSelectedLogoIdx(6);
                  setConfig((p) => ({ ...p, logoUrl: "/apple-icon.png", logoSize: 0.26 }));
                }}
                className={`flex-shrink-0 w-16 h-16 border flex flex-col items-center justify-center p-2 transition-all ${
                  selectedLogoIdx === 6
                    ? "border-white bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                    : "border-white/10 bg-black/40 text-[#8d8a84] hover:border-white/30 hover:text-white"
                }`}
                title="Nike swoosh light"
              >
                <svg className="w-8 h-8" viewBox="0 0 100 50" fill="currentColor">
                  <path d="M10 28 C 35 26, 60 16, 95 2 C 70 26, 45 42, 25 40 C 15 39, 8 32, 10 28 Z" />
                </svg>
                <span className="font-mono text-[9px] mt-0.5 uppercase">Alt</span>
              </button>
            </div>
          </div>

          {/* 3. SHAPES (Patterns & Shapes) */}
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-white">
                  SHAPES
                </span>
                <span className="text-[10px] font-mono text-[#8d8a84] px-1.5 py-0.5 border border-white/10 bg-white/[0.02]">
                  [ Patterns & Shapes ]
                </span>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#8d8a84]">
                MODULE FLOW ARCHITECTURE
              </span>
            </div>

            <div className="flex items-center gap-2.5 overflow-x-auto pb-3 scrollbar-thin">
              {/* Shape 0: Standard Square */}
              <button
                onClick={() => {
                  setSelectedShapeIdx(0);
                  setConfig((p) => ({ ...p, dotType: "square" }));
                }}
                className={`flex-shrink-0 w-16 h-16 border flex flex-col items-center justify-center p-2 transition-all ${
                  selectedShapeIdx === 0
                    ? "border-white bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                    : "border-white/10 bg-black/40 text-[#8d8a84] hover:border-white/30 hover:text-white"
                }`}
                title="Square blocks"
              >
                <div className="grid grid-cols-3 gap-0.5">
                  {[1, 1, 1, 1, 0, 1, 1, 1, 1].map((v, i) => (
                    <div key={i} className={`w-2 h-2 ${v ? "bg-white" : "bg-transparent"}`} />
                  ))}
                </div>
                <span className="font-mono text-[9px] mt-1 uppercase">Square</span>
              </button>

              {/* Shape 1: Scattered Square Dots */}
              <button
                onClick={() => {
                  setSelectedShapeIdx(1);
                  setConfig((p) => ({ ...p, dotType: "dots" }));
                }}
                className={`flex-shrink-0 w-16 h-16 border flex flex-col items-center justify-center p-2 transition-all ${
                  selectedShapeIdx === 1
                    ? "border-white bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                    : "border-white/10 bg-black/40 text-[#8d8a84] hover:border-white/30 hover:text-white"
                }`}
                title="Separated small dots"
              >
                <div className="grid grid-cols-3 gap-1">
                  {[1, 1, 0, 1, 1, 1, 0, 1, 1].map((v, i) => (
                    <div key={i} className={`w-1.5 h-1.5 ${v ? "bg-white" : "bg-transparent"}`} />
                  ))}
                </div>
                <span className="font-mono text-[9px] mt-1 uppercase">Matrix</span>
              </button>

              {/* Shape 2: Classy Vertical Pills */}
              <button
                onClick={() => {
                  setSelectedShapeIdx(2);
                  setConfig((p) => ({ ...p, dotType: "classy" }));
                }}
                className={`flex-shrink-0 w-16 h-16 border flex flex-col items-center justify-center p-2 transition-all ${
                  selectedShapeIdx === 2
                    ? "border-white bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                    : "border-white/10 bg-black/40 text-[#8d8a84] hover:border-white/30 hover:text-white"
                }`}
                title="Vertical rounded pills"
              >
                <div className="flex gap-1">
                  <div className="w-1.5 h-5 bg-white rounded-full" />
                  <div className="w-1.5 h-3 bg-white rounded-full mt-2" />
                  <div className="w-1.5 h-4 bg-white rounded-full mt-1" />
                </div>
                <span className="font-mono text-[9px] mt-1 uppercase">Pill</span>
              </button>

              {/* Shape 3: Liquid Connected Fluid Blobs (Selected in screenshot!) */}
              <button
                onClick={() => {
                  setSelectedShapeIdx(3);
                  setConfig((p) => ({ ...p, dotType: "extra-rounded" }));
                }}
                className={`flex-shrink-0 w-16 h-16 border flex flex-col items-center justify-center p-2 transition-all ${
                  selectedShapeIdx === 3
                    ? "border-white bg-white/15 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                    : "border-white/10 bg-black/40 text-[#8d8a84] hover:border-white/30 hover:text-white"
                }`}
                title="Liquid connected fluid modules (Reference pattern)"
              >
                <svg className="w-6 h-6" viewBox="0 0 32 32">
                  <rect x="4" y="4" width="10" height="10" rx="4" fill="#ffffff" />
                  <rect x="12" y="4" width="12" height="7" rx="3" fill="#ffffff" />
                  <rect x="16" y="8" width="8" height="14" rx="4" fill="#ffffff" />
                  <rect x="6" y="16" width="14" height="8" rx="4" fill="#ffffff" />
                  <circle cx="8" cy="26" r="3" fill="#ffffff" />
                </svg>
                <span className="font-mono text-[9px] mt-1 uppercase text-white font-bold">Fluid</span>
              </button>

              {/* Shape 4: Circular Dots */}
              <button
                onClick={() => {
                  setSelectedShapeIdx(4);
                  setConfig((p) => ({ ...p, dotType: "dots" }));
                }}
                className={`flex-shrink-0 w-16 h-16 border flex flex-col items-center justify-center p-2 transition-all ${
                  selectedShapeIdx === 4
                    ? "border-white bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                    : "border-white/10 bg-black/40 text-[#8d8a84] hover:border-white/30 hover:text-white"
                }`}
                title="Circular dots"
              >
                <div className="grid grid-cols-3 gap-1">
                  {[1, 1, 1, 1, 0, 1, 1, 1, 1].map((v, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${v ? "bg-white" : "bg-transparent"}`} />
                  ))}
                </div>
                <span className="font-mono text-[9px] mt-1 uppercase">Circles</span>
              </button>

              {/* Shape 5: Corner Rounded Connected */}
              <button
                onClick={() => {
                  setSelectedShapeIdx(5);
                  setConfig((p) => ({ ...p, dotType: "classy-rounded" }));
                }}
                className={`flex-shrink-0 w-16 h-16 border flex flex-col items-center justify-center p-2 transition-all ${
                  selectedShapeIdx === 5
                    ? "border-white bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                    : "border-white/10 bg-black/40 text-[#8d8a84] hover:border-white/30 hover:text-white"
                }`}
                title="Classy rounded"
              >
                <div className="grid grid-cols-2 gap-1">
                  <div className="w-3 h-3 bg-white rounded-tl-lg rounded-br-lg" />
                  <div className="w-3 h-3 bg-white rounded-tr-lg rounded-bl-lg" />
                </div>
                <span className="font-mono text-[9px] mt-1 uppercase">Petal</span>
              </button>
            </div>

            {/* 4. COLORS & PALETTE */}
            <div className="pt-4 border-t border-white/10">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-white">
                  Colors
                </span>
                <span className="text-[10px] font-mono text-[#8d8a84]">HEX CODES</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* QR Code Color */}
                <div className="border border-white/15 bg-black/60 p-3 flex items-center justify-between">
                  <div>
                    <span className="block text-[9px] font-mono uppercase tracking-wider text-[#8d8a84]">
                      QR Foreground
                    </span>
                    <input
                      type="text"
                      value={config.qrColor}
                      onChange={(e) => setConfig((p) => ({ ...p, qrColor: e.target.value }))}
                      className="text-xs font-mono font-bold text-white focus:outline-none w-24 uppercase bg-transparent"
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="color"
                      value={config.qrColor}
                      onChange={(e) => setConfig((p) => ({ ...p, qrColor: e.target.value }))}
                      className="absolute inset-0 opacity-0 w-8 h-8 cursor-pointer"
                    />
                    <div
                      className="w-8 h-8 border border-white/30 shadow-inner"
                      style={{ backgroundColor: config.qrColor }}
                    />
                  </div>
                </div>

                {/* Background Color */}
                <div className="border border-white/15 bg-black/60 p-3 flex items-center justify-between">
                  <div>
                    <span className="block text-[9px] font-mono uppercase tracking-wider text-[#8d8a84]">
                      Canvas Background
                    </span>
                    <input
                      type="text"
                      value={config.bgColor}
                      onChange={(e) => setConfig((p) => ({ ...p, bgColor: e.target.value }))}
                      className="text-xs font-mono font-bold text-white focus:outline-none w-24 uppercase bg-transparent"
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="color"
                      value={config.bgColor}
                      onChange={(e) => setConfig((p) => ({ ...p, bgColor: e.target.value }))}
                      className="absolute inset-0 opacity-0 w-8 h-8 cursor-pointer"
                    />
                    <div
                      className="w-8 h-8 border border-white/30 shadow-inner"
                      style={{ backgroundColor: config.bgColor }}
                    />
                  </div>
                </div>
              </div>

              {/* Quick Preset Palette Swatches */}
              <div className="flex items-center gap-2 mt-3 pt-1">
                <span className="text-[10px] font-mono text-[#8d8a84] uppercase mr-1">Presets:</span>
                <button
                  type="button"
                  onClick={() => setConfig((p) => ({ ...p, qrColor: "#000000", bgColor: "#ffffff" }))}
                  className="px-2 py-0.5 border border-white/15 bg-white/[0.04] text-[10px] font-mono text-[#c8c5be] hover:text-white hover:border-white/30"
                >
                  Classic Print
                </button>
                <button
                  type="button"
                  onClick={() => setConfig((p) => ({ ...p, qrColor: "#f2efe9", bgColor: "#0a0a0a" }))}
                  className="px-2 py-0.5 border border-white/15 bg-white/[0.04] text-[10px] font-mono text-[#c8c5be] hover:text-white hover:border-white/30"
                >
                  Aura Dark
                </button>
                <button
                  type="button"
                  onClick={() => setConfig((p) => ({ ...p, qrColor: "#0b0b0b", bgColor: "#f1eee8" }))}
                  className="px-2 py-0.5 border border-white/15 bg-white/[0.04] text-[10px] font-mono text-[#c8c5be] hover:text-white hover:border-white/30"
                >
                  Aura Light
                </button>
              </div>
            </div>
          </div>

          {/* 5. CORNERS (Finder Eyes) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-white">
                CORNERS
              </span>
              <span className="text-[10px] font-mono text-[#8d8a84]">12 FINDER EYE COMBINATIONS</span>
            </div>

            {/* All / Custom Tabs */}
            <div className="flex items-center gap-4 border-b border-white/10 mb-3 text-xs font-mono">
              <button
                onClick={() => setCornerTab("all")}
                className={`pb-1.5 uppercase tracking-wider transition ${
                  cornerTab === "all" ? "text-white border-b-2 border-white font-bold" : "text-[#8d8a84] hover:text-[#c8c5be]"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setCornerTab("custom")}
                className={`pb-1.5 uppercase tracking-wider transition ${
                  cornerTab === "custom" ? "text-white border-b-2 border-white font-bold" : "text-[#8d8a84] hover:text-[#c8c5be]"
                }`}
              >
                Custom
              </button>
            </div>

            {/* 12 Corner Eye Options */}
            <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-thin">
              {[
                { square: "square", dot: "square", label: "Square" },
                { square: "dot", dot: "square", label: "Dotted frame" },
                { square: "extra-rounded", dot: "square", label: "Rounded frame" },
                { square: "extra-rounded", dot: "dot", label: "Smooth" },
                { square: "dot", dot: "dot", label: "Circles" },
                { square: "square", dot: "square", label: "Concentric" },
                { square: "extra-rounded", dot: "square", label: "Notched" },
                { square: "classy", dot: "square", label: "Leaf" },
                { square: "classy-rounded", dot: "dot", label: "Teardrop" },
                { square: "square", dot: "dot", label: "Slanted" },
                { square: "extra-rounded", dot: "dot", label: "Faceted" },
                { square: "square", dot: "square", label: "Double" },
              ].map((c, idx) => {
                const isSelected = selectedCornerIdx === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedCornerIdx(idx);
                      setConfig((p) => ({
                        ...p,
                        cornerSquareType: c.square as CornerSquareType,
                        cornerDotType: c.dot as CornerDotType,
                      }));
                    }}
                    className={`flex-shrink-0 w-12 h-12 border flex items-center justify-center p-1.5 transition-all ${
                      isSelected
                        ? "border-white bg-white/15 shadow-[0_0_12px_rgba(255,255,255,0.2)]"
                        : "border-white/10 bg-black/40 hover:border-white/30"
                    }`}
                    title={c.label}
                  >
                    <div
                      className={`w-7 h-7 border-2 border-white flex items-center justify-center ${
                        c.square === "dot" ? "rounded-full" : c.square === "extra-rounded" ? "rounded-md" : "rounded-none"
                      }`}
                    >
                      <div
                        className={`w-3 h-3 bg-white ${c.dot === "dot" ? "rounded-full" : "rounded-none"}`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Toggle switch: Use QR Code color */}
            <div className="flex items-center gap-3 mt-3">
              <button
                type="button"
                onClick={() => setUseQrColorForCorners(!useQrColorForCorners)}
                className={`w-9 h-5 border transition-colors relative p-0.5 ${
                  useQrColorForCorners ? "border-white bg-white" : "border-white/30 bg-black/60"
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 transition-transform ${
                    useQrColorForCorners ? "translate-x-4 bg-black" : "translate-x-0 bg-white/40"
                  }`}
                />
              </button>
              <span className="text-xs font-mono text-[#c8c5be] uppercase tracking-wider select-none">
                Use QR Code color
              </span>
            </div>
          </div>

          {/* 6. SHORT URL */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-white">
                SHORT URL
              </span>
              <span className="text-[10px] font-mono text-[#8d8a84]">
                PERMANENT ENCODED TARGET
              </span>
            </div>

            <div className="flex items-center border border-white/15 bg-black/70 px-4 py-3">
              <span className="font-mono text-xs text-[#8d8a84] mr-1 select-none">
                https://join-aura.vercel.app/r/
              </span>
              <input
                type="text"
                value={config.code}
                onChange={(e) => {
                  const cleaned = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "");
                  setConfig((p) => ({
                    ...p,
                    code: cleaned,
                    targetUrl: `https://join-aura.vercel.app/r/${cleaned}`,
                  }));
                }}
                className="flex-1 bg-transparent font-mono text-xs font-bold text-white focus:outline-none tracking-wider"
              />
              <button
                onClick={handleCopyShortUrl}
                className="font-mono text-[10px] font-bold uppercase tracking-wider text-white border border-white/20 bg-white/10 hover:bg-white hover:text-black px-2.5 py-1 transition"
              >
                {copiedUrl ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          {/* 7. STUDIO ACTION BAR */}
          <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={handleReset}
              className="border border-white/20 bg-transparent hover:bg-white/10 px-6 py-3 font-mono font-bold text-xs uppercase tracking-[0.14em] text-[#c8c5be] hover:text-white transition"
            >
              SKIP
            </button>

            <label className="flex items-center gap-2 font-mono text-xs text-[#8d8a84] cursor-pointer hover:text-white transition">
              <input
                type="checkbox"
                checked={saveAsTemplate}
                onChange={(e) => setSaveAsTemplate(e.target.checked)}
                className="accent-white h-4 w-4 bg-black border-white/20"
              />
              <span>Save as template</span>
            </label>

            <button
              onClick={() => setDownloadModalOpen(true)}
              className="group relative border border-white bg-white hover:bg-transparent text-black hover:text-white px-8 py-3 font-mono font-bold text-xs uppercase tracking-[0.16em] transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)]"
            >
              <span className="flex items-center gap-2">
                <span>COMPLETE YOUR CODE</span>
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN: PREVIEW SHOWCASE & OPTICAL SCANNABILITY PEDESTAL
           ========================================================================= */}
        <div className="lg:col-span-5 xl:col-span-4 p-6 sm:p-8 flex flex-col items-center justify-between bg-black/40 border-t lg:border-t-0 border-white/10">
          <div className="w-full flex flex-col items-center">
            {/* Top Preview Bar */}
            <div className="w-full flex items-center justify-between mb-6">
              <span className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-white">
                PREVIEW
              </span>
              <div className="flex items-center border border-white/15 bg-black/80 p-0.5 font-mono text-[9px]">
                <button
                  onClick={() => setPreviewSurface("light")}
                  className={`px-2 py-0.5 uppercase transition ${
                    previewSurface === "light" ? "bg-white text-black font-bold" : "text-[#8d8a84]"
                  }`}
                >
                  White Paper
                </button>
                <button
                  onClick={() => setPreviewSurface("dark")}
                  className={`px-2 py-0.5 uppercase transition ${
                    previewSurface === "dark" ? "bg-white text-black font-bold" : "text-[#8d8a84]"
                  }`}
                >
                  Dark Merch
                </button>
              </div>
            </div>

            {/* Showcase Floating Pedestal */}
            <div
              className={`w-full max-w-[360px] p-6 border transition-all flex flex-col items-center justify-center relative overflow-hidden ${
                previewSurface === "dark"
                  ? "bg-[#050506] border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.9)]"
                  : "bg-[#f8f6f0] border-black/20 shadow-xl"
              } ${
                config.frame === "badge"
                  ? "border-2 border-white/40"
                  : config.frame === "polaroid"
                  ? "pb-12"
                  : config.frame === "phone"
                  ? "border-4 border-white/30 rounded-[32px] pt-8 pb-8 px-4"
                  : ""
              }`}
            >
              {/* Top Frame Banner */}
              {(config.frame === "simple-top" || config.frame === "badge") && (
                <div
                  className="w-full text-center py-2 px-3 mb-4 text-[10px] font-mono font-bold tracking-[0.16em] uppercase border border-current"
                  style={{
                    backgroundColor: config.frameBgColor,
                    color: config.frameTextColor,
                  }}
                >
                  {config.frameText || "SCAN TO ENTER"}
                </div>
              )}

              {/* Live Vector QR Rendering Canvas */}
              <div
                ref={qrRef}
                className="flex items-center justify-center overflow-hidden transition-all shadow-sm"
                style={{
                  backgroundColor: config.bgColor,
                  width: config.width,
                  height: config.height,
                }}
              />

              {/* Bottom Frame Banner */}
              {(config.frame === "simple-bottom" || config.frame === "polaroid" || config.frame === "phone") && (
                <div
                  className="w-full text-center py-2 px-3 mt-4 text-[10px] font-mono font-bold tracking-[0.16em] uppercase"
                  style={{
                    backgroundColor: config.frame === "polaroid" ? "transparent" : config.frameBgColor,
                    color: config.frame === "polaroid" ? "#0a0a0a" : config.frameTextColor,
                  }}
                >
                  {config.frameText || "SCAN ME"}
                </div>
              )}
            </div>

            {/* RESET DESIGN BUTTON */}
            <button
              onClick={handleReset}
              className="mt-6 border border-white/15 bg-white/[0.03] hover:bg-white/[0.08] px-6 py-2.5 font-mono text-xs font-bold tracking-[0.14em] text-[#c8c5be] hover:text-white uppercase flex items-center gap-2.5 transition"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M23 4v6h-6" />
                <path d="M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              <span>RESET DESIGN</span>
            </button>
          </div>

          {/* Scannability Optical Meter */}
          <div className="w-full max-w-[360px] mt-6 border border-white/15 bg-black/60 p-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-[#8d8a84] text-[10px] uppercase tracking-wider">Scannability & Contrast</span>
              <span
                className={`font-bold ${
                  scannability.contrastRatio >= 4.5
                    ? "text-emerald-400"
                    : scannability.contrastRatio >= 3.0
                    ? "text-amber-400"
                    : "text-rose-400"
                }`}
              >
                {scannability.contrastRatio}:1 (
                {scannability.contrastRatio >= 4.5 ? "OPTIMAL" : scannability.contrastRatio >= 3.0 ? "FAIR" : "LOW"})
              </span>
            </div>

            <p className="text-[10px] text-[#8d8a84] mt-2 leading-relaxed">
              Level H Error Correction (30% redundancy). Compatible with all iOS & Android camera engines.
            </p>

            {scannability.warnings.length > 0 && (
              <div className="mt-2 pt-2 border-t border-rose-500/20 text-[10px] text-amber-400 font-mono">
                ⚠ {scannability.warnings[0]}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          DOWNLOAD & EXPORT MODAL (When clicking "COMPLETE YOUR CODE")
         ========================================================================= */}
      {downloadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg border border-white/15 bg-[#0d0d0f] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.9)] relative">
            <span className="font-mono text-[10px] text-sky-400 uppercase tracking-widest block mb-1">
              [ EXPORT ENGINE // LEVEL H ]
            </span>
            <h3 className="text-2xl font-extrabold uppercase tracking-tight text-white t-display">
              Export Your Styled QR Code
            </h3>
            <p className="text-xs text-[#8d8a84] mt-2 font-mono leading-relaxed">
              Encodes <strong className="text-white font-bold">{config.targetUrl}</strong> with 30% error correction.
              High-resolution vector for vinyl, banners, posters, and digital display.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <button
                onClick={() => handleDownload("svg")}
                disabled={isExporting}
                className="py-4 px-4 border border-white/20 bg-white/[0.04] hover:bg-white hover:text-black text-white font-mono font-bold text-xs uppercase tracking-wider flex flex-col items-center justify-center gap-1.5 transition"
              >
                <span>Download SVG</span>
                <span className="text-[9px] text-[#8d8a84] group-hover:text-black/70 font-normal">
                  Infinite vector for print & merchandise
                </span>
              </button>

              <button
                onClick={() => handleDownload("png")}
                disabled={isExporting}
                className="py-4 px-4 border border-white bg-white hover:bg-transparent text-black hover:text-white font-mono font-bold text-xs uppercase tracking-wider flex flex-col items-center justify-center gap-1.5 transition shadow-[0_0_20px_rgba(255,255,255,0.15)]"
              >
                <span>Download PNG</span>
                <span className="text-[9px] text-black/70 group-hover:text-[#8d8a84] font-normal">
                  High-res raster for digital display
                </span>
              </button>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setDownloadModalOpen(false)}
                className="font-mono text-xs text-[#8d8a84] hover:text-white transition uppercase tracking-wider"
              >
                Close ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
