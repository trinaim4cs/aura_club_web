import type { Metadata } from "next";
import QrCustomizer from "@/components/qr/QrCustomizer";

export const metadata: Metadata = {
  title: "QR Customizer | AURA",
  description: "Dynamic QR Code styling studio and export engine for AURA.",
};

export default function QrCustomizerPage() {
  return (
    <main className="qr-studio min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 relative z-10" data-no-cursor="true">
      <QrCustomizer />
    </main>
  );
}
