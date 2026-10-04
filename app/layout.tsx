import type { Metadata, Viewport } from "next";
import { Archivo, Geist, Geist_Mono } from "next/font/google";
import { AuraProvider } from "@/components/aura/AuraProvider";
import { site } from "@/data/site";
import "./globals.css";

const display = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-display",
  display: "swap",
});
const sans = Geist({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

const siteUrl = "https://join-aura.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: `${site.name} — ${site.expansion}`,
  description: `${site.name} is the AI-native builders' club at ${site.institution}. Hackathons, projects, open learning and a way in.`,
  applicationName: site.name,
  keywords: [
    "AURA",
    "AI",
    "SRMIST",
    "Builders Club",
    "Artificial Intelligence",
    "Hackathons",
    "SRM Institute of Science and Technology",
    "Real World Applications",
    "AI Native",
  ],
  authors: [{ name: "AURA", url: siteUrl }],
  creator: "AURA",
  publisher: "AURA",
  alternates: {
    canonical: siteUrl,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: `${site.name} — ${site.expansion}`,
    description: `${site.name} is the AI-native builders' club at ${site.institution}. Hackathons, projects, open learning and a way in.`,
    url: siteUrl,
    siteName: site.name,
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1733,
        height: 907,
        alt: `${site.name} — ${site.expansion}`,
        type: "image/png",
      },
      {
        url: "/aura/og-image.png",
        width: 1733,
        height: 907,
        alt: `${site.name} — ${site.expansion}`,
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — ${site.expansion}`,
    description: `${site.name} is the AI-native builders' club at ${site.institution}. Hackathons, projects, open learning and a way in.`,
    images: ["/og.png"],
    creator: "@aura_srmist",
  },
  other: {
    "og:local": "en_US",
    "theme-color": "#f1eee8",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f1eee8" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

// Runs before first paint: apply the saved (or system) theme and mark JS as available,
// so scripted reveals never flash their final state first.
const bootstrap = `(function(){var d=document.documentElement;try{var t=localStorage.getItem('aura-theme');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}d.dataset.theme=t}catch(e){d.dataset.theme='light'}d.dataset.js='1'})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <meta itemProp="name" content={`${site.name} — ${site.expansion}`} />
        <meta
          itemProp="description"
          content={`${site.name} is the AI-native builders' club at ${site.institution}. Hackathons, projects, open learning and a way in.`}
        />
        <meta itemProp="image" content={`${siteUrl}/og.png`} />
        <meta name="theme-color" content="#f1eee8" />
        <script dangerouslySetInnerHTML={{ __html: bootstrap }} />
        <noscript>
          <style>{`[data-hide],.ln-i,[data-intro-text],[data-intro-cue]{opacity:1!important;visibility:visible!important;transform:none!important}`}</style>
        </noscript>
      </head>
      <body>
        <AuraProvider>{children}</AuraProvider>
      </body>
    </html>
  );
}
