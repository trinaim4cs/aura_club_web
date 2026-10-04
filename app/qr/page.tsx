import type { Metadata } from "next";
import QrWorkspace from "@/components/qr/QrWorkspace";
import QrCustomizer from "@/components/qr/QrCustomizer";

export const metadata: Metadata = {
  title: "QR Matrix & Studio // AURA",
  description: "Dynamic QR Code styling studio, campaign manager, and real-time scan analytics for AURA.",
};

export default function QrPage() {
  return (
    <main className="qr-studio relative min-h-screen bg-[#070708] text-[#f2efe9] overflow-x-hidden selection:bg-[#f2efe9] selection:text-[#070708]" data-no-cursor="true">
      {/* Structural AURA Background: Film Grain & Hairline Grid */}
      <div className="aura-bg fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div className="aura-grain absolute inset-[-50%] opacity-[0.07] invert" />
        <div className="aura-grid absolute inset-0 grid grid-cols-4 px-[var(--gut)] border-x border-white/[0.04]">
          <span className="border-l border-white/[0.04]" />
          <span className="border-l border-white/[0.04]" />
          <span className="border-l border-white/[0.04]" />
          <span className="border-l border-white/[0.04] border-r border-white/[0.04]" />
        </div>
        {/* Ambient atmospheric glow */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[340px] bg-gradient-to-b from-sky-500/10 via-purple-500/5 to-transparent blur-[120px] rounded-full pointer-events-none" />
      </div>

      {/* Main Workspace Container */}
      <div className="aura-content relative z-10 w-full min-h-screen flex flex-col justify-between py-6 px-3 sm:px-6 md:px-10">
        <div className="w-full max-w-[1400px] mx-auto flex-1">
          {/* Unified authenticated workspace hosting QR Studio and Campaigns Dashboard */}
          <QrWorkspace />
          {/* <QrCustomizer /> rendered dynamically inside QrWorkspace */}
        </div>

        {/* Studio Technical Footer Metadata */}
        <footer className="w-full max-w-[1400px] mx-auto pt-10 pb-4 mt-8 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-4 font-mono text-[10px] tracking-wider text-[#8d8a84] uppercase">
          <div className="flex items-center gap-3">
            <span className="text-[#f2efe9] font-bold">AURA // QR PROTOCOL MATRIX</span>
            <span className="text-white/20">|</span>
            <span>VERCEL EDGE DISPATCH & PRIVACY TELEMETRY</span>
          </div>
          <div className="flex items-center gap-4">
            <span>SHA-256 SALT PRESERVED</span>
            <span className="text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              SYSTEM 100% OPERATIONAL
            </span>
          </div>
        </footer>
      </div>
    </main>
  );
}
