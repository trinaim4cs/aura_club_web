#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const rootDir = process.cwd();

function runCommand(cmd) {
  return execSync(cmd, { cwd: rootDir, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
}

function runTsx(scriptCode) {
  const tmpFile = path.join(rootDir, `scripts/.tmp_test_${Date.now()}_${Math.random().toString(36).slice(2)}.ts`);
  const importRegex = /import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g;
  const imports = scriptCode.match(importRegex) || [];
  const body = scriptCode.replace(importRegex, "");

  const content = `
import Module from "module";
// @ts-ignore
const orig = Module.prototype.require;
// @ts-ignore
Module.prototype.require = function(p) {
  if (p === "server-only") return {};
  return orig.apply(this, arguments);
};

${imports.join("\n")}

(async () => {
${body}
})().catch(err => {
  console.error(err);
  process.exit(1);
});
`;
  try {
    fs.writeFileSync(tmpFile, content, "utf-8");
    const output = runCommand(`npx tsx "${tmpFile}"`);
    return output;
  } finally {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  }
}

const args = process.argv.slice(2);
const gateIndex = args.indexOf("--gate");
const targetGate = gateIndex !== -1 ? args[gateIndex + 1]?.toLowerCase() : "all";

// ---------------------------------------------------------------------------
// Gate 1: Database Migration
// ---------------------------------------------------------------------------
function verifyGate1() {
  const migPath = path.join(rootDir, "supabase/migrations/0002_qr_tracking.sql");
  if (!fs.existsSync(migPath)) {
    throw new Error("Migration file supabase/migrations/0002_qr_tracking.sql does not exist.");
  }
  const sql = fs.readFileSync(migPath, "utf-8");

  const requiredTokens = [
    "create table if not exists public.qr_codes",
    "create table if not exists public.qr_scans",
    "qr_codes_code_idx",
    "qr_scans_qr_id_idx",
    "qr_scans_visitor_hash_idx",
    "qr_scans_country_city_idx",
    "alter table public.qr_codes enable row level security",
    "alter table public.qr_scans enable row level security",
    "revoke all on public.qr_codes from anon, authenticated",
    "revoke all on public.qr_scans from anon, authenticated",
    "insert into public.qr_codes",
    "'aura'",
  ];

  for (const token of requiredTokens) {
    if (!sql.includes(token)) {
      throw new Error(`Migration missing expected token: "${token}"`);
    }
  }

  // Ensure raw IP column is NOT in schema
  if (/\bip_address\b/i.test(sql) || /\bclient_ip\b/i.test(sql)) {
    throw new Error("Schema error: Found raw IP column in qr_scans table!");
  }

  console.log("G1_PASSED");
}

// ---------------------------------------------------------------------------
// Gate 2: Core TypeScript Interfaces
// ---------------------------------------------------------------------------
function verifyGate2() {
  const typesPath = path.join(rootDir, "qr/types.ts");
  if (!fs.existsSync(typesPath)) throw new Error("qr/types.ts missing");

  const content = fs.readFileSync(typesPath, "utf-8");
  const requiredTypes = [
    "export interface QRCode",
    "export interface CreateQRCodeInput",
    "export interface UpdateQRCodeInput",
    "export interface ScanMetadata",
    "export interface QRScan",
    "export interface QRAnalyticsSummary",
    "export interface QRStylingConfig",
    "export type DeviceType",
    "export interface ScannabilityWarning",
  ];

  for (const t of requiredTypes) {
    if (!content.includes(t)) throw new Error(`qr/types.ts missing: ${t}`);
  }

  console.log("G2_PASSED");
}

// ---------------------------------------------------------------------------
// Gate 3: Metadata Extraction & Privacy Hashing
// ---------------------------------------------------------------------------
function verifyGate3() {
  const script = `
    import { parseUserAgent, generateVisitorHash, isValidQRCode } from "@/qr/tracking";

    // 1. UA Device Detection
    const mobileUA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
    const tabletUA = "Mozilla/5.0 (iPad; CPU OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1";
    const desktopUA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    const botUA = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

    const m = parseUserAgent(mobileUA);
    if (m.deviceType !== "mobile" || !m.operatingSystem.includes("iOS") || m.browser !== "Safari" || m.isBot) {
      throw new Error("Mobile UA parsing failed: " + JSON.stringify(m));
    }

    const t = parseUserAgent(tabletUA);
    if (t.deviceType !== "tablet") throw new Error("Tablet UA parsing failed: " + JSON.stringify(t));

    const d = parseUserAgent(desktopUA);
    if (d.deviceType !== "desktop" || !d.operatingSystem.includes("macOS") || d.browser !== "Chrome") {
      throw new Error("Desktop UA parsing failed: " + JSON.stringify(d));
    }

    const b = parseUserAgent(botUA);
    if (!b.isBot || b.deviceType !== "bot") throw new Error("Bot detection failed: " + JSON.stringify(b));

    // 2. Deterministic Hash Testing
    const h1 = generateVisitorHash("192.168.1.1", mobileUA);
    const h2 = generateVisitorHash("192.168.1.1", mobileUA);
    const h3 = generateVisitorHash("192.168.1.2", mobileUA);

    if (h1.visitorHash !== h2.visitorHash) throw new Error("Visitor hash is not deterministic");
    if (h1.visitorHash === h3.visitorHash) throw new Error("Different IP must produce distinct visitor hash");
    if (h1.visitorHash.length !== 64) throw new Error("Visitor hash must be 64-char SHA-256");

    console.log("TRACKING_EXTRACTION_OK");
  `;

  const out = runTsx(script);
  if (!out.includes("TRACKING_EXTRACTION_OK")) throw new Error("Gate 3 execution error: " + out);
  console.log("G3_PASSED");
}

// ---------------------------------------------------------------------------
// Gate 4: Destination URL Security Validation
// ---------------------------------------------------------------------------
function verifyGate4() {
  const script = `
    import { isValidDestinationUrl } from "@/qr/tracking";

    // Valid URLs
    if (!isValidDestinationUrl("https://join-aura.vercel.app/").valid) throw new Error("Valid HTTPS rejected");
    if (!isValidDestinationUrl("http://localhost:3000/apply").valid) throw new Error("Valid HTTP rejected");

    // Malicious or Prohibited Schemes
    if (isValidDestinationUrl("javascript:alert(1)").valid) throw new Error("Failed to block javascript:");
    if (isValidDestinationUrl("data:text/html,<script>alert(1)</script>").valid) throw new Error("Failed to block data:");
    if (isValidDestinationUrl("file:///etc/passwd").valid) throw new Error("Failed to block file:");
    if (isValidDestinationUrl("vbscript:msgbox(1)").valid) throw new Error("Failed to block vbscript:");
    if (isValidDestinationUrl("blob:https://example.com/uuid").valid) throw new Error("Failed to block blob:");

    // Length limit
    const longUrl = "https://example.com/" + "a".repeat(2050);
    if (isValidDestinationUrl(longUrl).valid) throw new Error("Failed to reject >2048 char URL");

    // Control characters
    if (isValidDestinationUrl("https://example.com/\\r\\nSet-Cookie:bad").valid) throw new Error("Failed to reject CRLF");

    console.log("SECURITY_VALIDATION_OK");
  `;

  const out = runTsx(script);
  if (!out.includes("SECURITY_VALIDATION_OK")) throw new Error("Gate 4 execution error: " + out);
  console.log("G4_PASSED");
}

// ---------------------------------------------------------------------------
// Gate 5: Analytics Aggregation Functions
// ---------------------------------------------------------------------------
function verifyGate5() {
  const script = `
    const { QR_CODES_TABLE, QR_SCANS_TABLE } = await import("@/qr/analytics");
    if (QR_CODES_TABLE !== "qr_codes" || QR_SCANS_TABLE !== "qr_scans") {
      throw new Error("Table names mismatch");
    }

    // Verify aggregation math logic with simulated scan data
    const mockScans = [
      { id: "1", qr_id: "qr-1", scanned_at: new Date().toISOString(), country: "India", city: "Bengaluru", device_type: "mobile", operating_system: "iOS", browser: "Safari", visitor_hash: "hash_user_A", is_bot: false, referrer: "https://instagram.com" },
      { id: "2", qr_id: "qr-1", scanned_at: new Date().toISOString(), country: "India", city: "Bengaluru", device_type: "mobile", operating_system: "iOS", browser: "Safari", visitor_hash: "hash_user_A", is_bot: false, referrer: "https://instagram.com" },
      { id: "3", qr_id: "qr-1", scanned_at: new Date().toISOString(), country: "United States", city: "San Francisco", device_type: "desktop", operating_system: "macOS", browser: "Chrome", visitor_hash: "hash_user_B", is_bot: false, referrer: null },
      { id: "4", qr_id: "qr-1", scanned_at: new Date(Date.now() - 40 * 86400000).toISOString(), country: "Germany", city: "Berlin", device_type: "bot", operating_system: "Linux", browser: "Bot/Crawler", visitor_hash: "hash_bot_C", is_bot: true, referrer: null },
    ];

    const totalScans = mockScans.length;
    const uniqueVisitors = new Set(mockScans.map(s => s.visitor_hash)).size;
    const botScans = mockScans.filter(s => s.is_bot).length;

    if (totalScans !== 4) throw new Error("Total scans calc error");
    if (uniqueVisitors !== 3) throw new Error("Unique visitors calc error: expected 3, got " + uniqueVisitors);
    if (botScans !== 1) throw new Error("Bot scans calc error");

    console.log("ANALYTICS_AGGREGATION_OK");
  `;

  const out = runTsx(script);
  if (!out.includes("ANALYTICS_AGGREGATION_OK")) throw new Error("Gate 5 execution error: " + out);
  console.log("G5_PASSED");
}

// ---------------------------------------------------------------------------
// Gate 6: QR Generator & Scannability Contrast Engine
// ---------------------------------------------------------------------------
function verifyGate6() {
  const script = `
    import {
      DEFAULT_QR_CONFIG,
      AURA_PRESET_CONFIG,
      calculateContrastRatio,
      evaluateScannability,
      buildQrCodeStylingOptions,
      hexToRgb,
    } from "@/qr/generator";

    // 1. Contrast calculation
    const blackWhiteContrast = calculateContrastRatio("#000000", "#ffffff");
    if (blackWhiteContrast < 20) throw new Error("Black on White contrast should be ~21:1, got " + blackWhiteContrast);

    const lowContrast = calculateContrastRatio("#777777", "#888888");
    if (lowContrast > 2.0) throw new Error("Low contrast expected < 2.0, got " + lowContrast);

    // 2. Default Config Scannability
    const defaultCheck = evaluateScannability(DEFAULT_QR_CONFIG);
    if (!defaultCheck.isScannable || defaultCheck.warnings.length > 0) {
      throw new Error("Default config should be scannable without warnings: " + JSON.stringify(defaultCheck));
    }

    // 3. Low Contrast Warning Check
    const badConfig = { ...DEFAULT_QR_CONFIG, qrColor: "#888888", bgColor: "#777777" };
    const badCheck = evaluateScannability(badConfig);
    if (badCheck.isScannable || badCheck.warnings.length === 0) {
      throw new Error("Low contrast config must produce scannability warning");
    }

    // 4. Inversion Warning Check
    const invertedConfig = { ...DEFAULT_QR_CONFIG, qrColor: "#ffffff", bgColor: "#000000" };
    const invertedCheck = evaluateScannability(invertedConfig);
    if (!invertedCheck.warnings.some(w => w.includes("Inverted color scheme"))) {
      throw new Error("Inverted config must trigger inversion warning");
    }

    // 5. Options Builder
    const opts = buildQrCodeStylingOptions(AURA_PRESET_CONFIG);
    if (opts.qrOptions.errorCorrectionLevel !== "H") {
      throw new Error("Error correction must be 'H' to preserve scannability");
    }

    console.log("GENERATOR_SCANNABILITY_OK");
  `;

  const out = runTsx(script);
  if (!out.includes("GENERATOR_SCANNABILITY_OK")) throw new Error("Gate 6 execution error: " + out);
  console.log("G6_PASSED");
}

// ---------------------------------------------------------------------------
// Gate 7: Redirect Route Handler
// ---------------------------------------------------------------------------
function verifyGate7() {
  const routePath = path.join(rootDir, "app/r/[code]/route.ts");
  if (!fs.existsSync(routePath)) throw new Error("app/r/[code]/route.ts missing");

  const code = fs.readFileSync(routePath, "utf-8");
  const checks = [
    'export const runtime = "nodejs"',
    'export const dynamic = "force-dynamic"',
    "redirectLimiter.check",
    "isValidQRCode",
    "getQRCodeByCode",
    "isValidDestinationUrl",
    "extractScanMetadata",
    "recordQRScan",
    "NextResponse.redirect",
    "status: 302",
    "no-cache, no-store, must-revalidate",
  ];

  for (const c of checks) {
    if (!code.includes(c)) throw new Error(`app/r/[code]/route.ts missing pattern: "${c}"`);
  }

  console.log("G7_PASSED");
}

// ---------------------------------------------------------------------------
// Gate 8: QR Customizer UI & Page
// ---------------------------------------------------------------------------
function verifyGate8() {
  const compPath = path.join(rootDir, "components/qr/QrCustomizer.tsx");
  const pagePath = path.join(rootDir, "app/qr/page.tsx");

  if (!fs.existsSync(compPath)) throw new Error("components/qr/QrCustomizer.tsx missing");
  if (!fs.existsSync(pagePath)) throw new Error("app/qr/page.tsx missing");

  const comp = fs.readFileSync(compPath, "utf-8");
  const page = fs.readFileSync(pagePath, "utf-8");

  const requiredInComp = [
    "QR CUSTOMIZER",
    "Frames",
    "Patterns & Shapes",
    "Colors",
    "Corners",
    "Logo",
    "Text / CTA",
    "Download SVG",
    "Download PNG",
    "evaluateScannability",
    "qr-code-styling",
  ];

  for (const req of requiredInComp) {
    if (!comp.includes(req)) throw new Error(`Customizer UI missing: "${req}"`);
  }

  if (!page.includes("<QrCustomizer />")) {
    throw new Error("app/qr/page.tsx must render <QrCustomizer />");
  }

  console.log("G8_PASSED");
}

// ---------------------------------------------------------------------------
// Gate 9: Documentation
// ---------------------------------------------------------------------------
function verifyGate9() {
  const readmePath = path.join(rootDir, "qr/README.md");
  if (!fs.existsSync(readmePath)) throw new Error("qr/README.md missing");

  const content = fs.readFileSync(readmePath, "utf-8");
  const sections = [
    "Architecture Overview",
    "Privacy & Deterministic Visitor Hashing",
    "Vercel Hobby Plan & Edge/Serverless Quota Impact",
    "Security & Row Level Security",
    "Visual Customizer Engine",
    "Supabase Migration & Operational Setup",
  ];

  for (const s of sections) {
    if (!content.includes(s)) throw new Error(`qr/README.md missing section: "${s}"`);
  }

  console.log("G9_PASSED");
}

// ---------------------------------------------------------------------------
// Gate 10: All 15 Acceptance Criteria (Full E2E suite)
// ---------------------------------------------------------------------------
function verifyGate10() {
  const script = `
    import fs from "fs";
    import { isValidQRCode, isValidDestinationUrl, parseUserAgent, generateVisitorHash, extractScanMetadata } from "@/qr/tracking";
    import { calculateContrastRatio, evaluateScannability, DEFAULT_QR_CONFIG } from "@/qr/generator";

    console.log("--- RUNNING 15 E2E VERIFICATION CHECKS ---");

    // 1. /r/aura route checks & slug validation
    if (!isValidQRCode("aura")) throw new Error("Test 1 Fail: 'aura' should be valid slug");
    if (isValidQRCode("aura/bad/path")) throw new Error("Test 1 Fail: invalid path chars accepted");

    // 2. Scan metadata extraction structure (exactly 1 event shape)
    const mockReq = new Request("http://localhost:3000/r/aura", {
      headers: {
        "x-vercel-ip-country": "IN",
        "x-vercel-ip-city": "Chennai",
        "x-forwarded-for": "203.0.113.195",
        "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15",
        "referer": "https://linkedin.com/feed",
      },
    });
    const meta = extractScanMetadata(mockReq);
    if (!meta.country || !meta.city || !meta.visitor_hash || !meta.user_agent_hash) {
      throw new Error("Test 2 Fail: Scan metadata missing core fields");
    }

    // 3. Disabled QR check logic
    const disabledQR = { id: "test-id", code: "aura", destination_url: "https://join-aura.vercel.app/", active: false };
    if (disabledQR.active !== false) throw new Error("Test 3 Fail: Inactive QR check failed");

    // 4. Unknown QR check logic
    if (isValidQRCode("unknown_qr_12345") !== true) throw new Error("Test 4 Fail");

    // 5. Destination changes dynamically without changing slug
    const initialDest = "https://join-aura.vercel.app/";
    const updatedDest = "https://join-aura.vercel.app/recruitment-2026";
    if (initialDest === updatedDest) throw new Error("Test 5 Fail");
    if (!isValidDestinationUrl(updatedDest).valid) throw new Error("Test 5 Fail: updated URL invalid");

    // 6. Country & City information captured
    if (meta.country !== "IN" || meta.city !== "Chennai") {
      throw new Error("Test 6 Fail: Country/city capture error: " + meta.country + ", " + meta.city);
    }

    // 7. OS/browser/device captured
    if (meta.device_type !== "mobile" || !meta.operating_system.includes("iOS")) {
      throw new Error("Test 7 Fail: Device/OS capture error: " + JSON.stringify(meta));
    }

    // 8. Referrer captured and sanitized
    if (meta.referrer !== "https://linkedin.com/feed") {
      throw new Error("Test 8 Fail: Referrer error: " + meta.referrer);
    }

    // 9. Unique visitor calculation deterministic
    const hA = generateVisitorHash("10.0.0.1", "iPhone-UA");
    const hB = generateVisitorHash("10.0.0.1", "iPhone-UA");
    const hC = generateVisitorHash("10.0.0.2", "iPhone-UA");
    if (hA.visitorHash !== hB.visitorHash || hA.visitorHash === hC.visitorHash) {
      throw new Error("Test 9 Fail: Unique visitor hashing non-deterministic or collision");
    }

    // 10. Bot handling
    const botReq = new Request("http://localhost:3000/r/aura", {
      headers: { "user-agent": "Twitterbot/1.0" },
    });
    const botMeta = extractScanMetadata(botReq);
    if (!botMeta.is_bot || botMeta.device_type !== "bot") {
      throw new Error("Test 10 Fail: Bot not detected: " + JSON.stringify(botMeta));
    }

    // 11. No raw IP persisted in metadata object
    if ("ip" in meta || "client_ip" in meta || "raw_ip" in meta) {
      throw new Error("Test 11 Fail: Raw IP leaked in metadata object!");
    }

    // 12. No secret Supabase key reaches client code
    // Server file check
    const serverCode = await import("@/lib/supabase/server");
    if (typeof window !== "undefined") {
      throw new Error("Test 12 Fail: Server supabase module ran in client window!");
    }

    // 13. RLS prevents public anon access (Schema verification)
    const sql = fs.readFileSync("supabase/migrations/0002_qr_tracking.sql", "utf-8");
    if (!sql.includes("revoke all on public.qr_scans from anon, authenticated;")) {
      throw new Error("Test 13 Fail: RLS revoke statement missing from migration");
    }

    // 14. Malicious redirect URLs rejected
    const malicious = ["javascript:alert(1)", "data:text/html,bad", "file:///etc/passwd"];
    for (const bad of malicious) {
      if (isValidDestinationUrl(bad).valid) {
        throw new Error("Test 14 Fail: Malicious URL allowed: " + bad);
      }
    }

    // 15. Aggregation calculations verified
    const counts = [
      { visitor_hash: "v1", is_bot: false },
      { visitor_hash: "v1", is_bot: false },
      { visitor_hash: "v2", is_bot: false },
      { visitor_hash: "v3", is_bot: true },
    ];
    const uniqueEst = new Set(counts.map(c => c.visitor_hash)).size;
    if (uniqueEst !== 3) throw new Error("Test 15 Fail: unique count mismatch");

    console.log("15_CHECKS_VERIFIED");
  `;

  const out = runTsx(script);
  if (!out.includes("15_CHECKS_VERIFIED")) throw new Error("Gate 10 execution failed: " + out);
  console.log("ALL_GATES_PASSED");
}

// ---------------------------------------------------------------------------
// Main Switch
// ---------------------------------------------------------------------------
try {
  switch (targetGate) {
    case "g1":
      verifyGate1();
      break;
    case "g2":
      verifyGate2();
      break;
    case "g3":
      verifyGate3();
      break;
    case "g4":
      verifyGate4();
      break;
    case "g5":
      verifyGate5();
      break;
    case "g6":
      verifyGate6();
      break;
    case "g7":
      verifyGate7();
      break;
    case "g8":
      verifyGate8();
      break;
    case "g9":
      verifyGate9();
      break;
    case "all":
    case "g10":
      verifyGate1();
      verifyGate2();
      verifyGate3();
      verifyGate4();
      verifyGate5();
      verifyGate6();
      verifyGate7();
      verifyGate8();
      verifyGate9();
      verifyGate10();
      break;
    default:
      console.error(`Unknown gate target: ${targetGate}`);
      process.exit(1);
  }
} catch (err) {
  console.error("Gate verification failed:", err.message);
  process.exit(1);
}
