import type { Metadata } from "next";
import QrWorkspace from "@/components/qr/QrWorkspace";
import QrCustomizer from "@/components/qr/QrCustomizer";

export const metadata: Metadata = {
  title: "QR Studio & Analytics | AURA",
  description: "Dynamic QR Code styling studio, campaign manager, and scan analytics for AURA.",
};

export default function QrPage() {
  return (
    <main
      className="qr-studio min-h-screen bg-slate-950 text-slate-100 py-8 px-3 sm:px-6 relative z-10"
      data-no-cursor="true"
    >
      {/* Unified authenticated workspace hosting QR Studio and Campaigns Dashboard */}
      <QrWorkspace />
      {/* <QrCustomizer /> rendered dynamically inside QrWorkspace */}
    </main>
  );
}
