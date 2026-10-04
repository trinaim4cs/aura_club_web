/**
 * Core type definitions for dynamic QR redirect and analytics subsystem.
 */

export type DeviceType = "mobile" | "tablet" | "desktop" | "bot" | "unknown";

export interface QRCode {
  id: string;
  code: string;
  name: string;
  destination_url: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QRCodeWithStats extends QRCode {
  total_scans: number;
  unique_visitors_est: number;
  last_scanned_at: string | null;
}

export interface CreateQRCodeInput {
  code: string;
  name: string;
  destination_url: string;
  active?: boolean;
}

export interface UpdateQRCodeInput {
  name?: string;
  destination_url?: string;
  active?: boolean;
}

export interface ScanMetadata {
  country: string | null;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  postal_code: string | null;
  device_type: DeviceType;
  operating_system: string;
  browser: string;
  referrer: string | null;
  user_agent_hash: string;
  visitor_hash: string;
  is_bot: boolean;
}

export interface QRScan extends ScanMetadata {
  id: string;
  qr_id: string;
  scanned_at: string;
}

export interface MetricCount {
  label: string;
  count: number;
  percentage?: number;
}

export interface TimeSeriesPoint {
  date: string; // YYYY-MM-DD
  scans: number;
  unique_visitors: number;
}

export interface RecentScan {
  id: string;
  scanned_at: string;
  country: string | null;
  city: string | null;
  device_type: DeviceType;
  operating_system: string;
  browser: string;
  is_bot: boolean;
  referrer: string | null;
}

export interface QRAnalyticsSummary {
  qr_id: string;
  qr_code: string;
  destination_url: string;
  total_scans: number;
  unique_visitors_est: number; // Disclaimed as estimated unique devices, not human identities
  scans_today: number;
  scans_this_week: number;
  scans_this_month: number;
  bot_scans: number;
  scans_over_time: TimeSeriesPoint[];
  countries: MetricCount[];
  cities: MetricCount[];
  operating_systems: MetricCount[];
  browsers: MetricCount[];
  device_types: MetricCount[];
  referrers: MetricCount[];
  recent_scans: RecentScan[];
}

// ---------------------------------------------------------------------------
// QR Customizer & Styling Models
// ---------------------------------------------------------------------------

export type QRDotType =
  | "square"
  | "dots"
  | "rounded"
  | "classy"
  | "classy-rounded"
  | "extra-rounded";

export type CornerSquareType = "square" | "dot" | "extra-rounded";
export type CornerDotType = "square" | "dot";

export type QRFrameType =
  | "none"
  | "simple-top"
  | "simple-bottom"
  | "badge"
  | "polaroid"
  | "phone";

export interface QRGradient {
  type: "linear" | "radial";
  rotation?: number;
  colorStops: { offset: number; color: string }[];
}

export interface QRStylingConfig {
  code: string;
  targetUrl: string;
  width: number;
  height: number;
  margin: number;
  dotType: QRDotType;
  qrColor: string;
  bgColor: string;
  gradient?: QRGradient | null;
  cornerSquareType: CornerSquareType;
  cornerSquareColor: string;
  cornerDotType: CornerDotType;
  cornerDotColor: string;
  logoUrl?: string;
  logoSize: number; // 0.1 to 0.4 of QR size
  logoMargin: number;
  frame: QRFrameType;
  frameText: string;
  frameTextColor: string;
  frameBgColor: string;
}

export interface ScannabilityWarning {
  isScannable: boolean;
  contrastRatio: number;
  warnings: string[];
}
