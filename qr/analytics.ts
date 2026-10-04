import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type {
  CreateQRCodeInput,
  DeviceType,
  MetricCount,
  QRCode,
  QRCodeWithStats,
  QRAnalyticsSummary,
  RecentScan,
  ScanMetadata,
  TimeSeriesPoint,
  UpdateQRCodeInput,
} from "./types";
import { isValidDestinationUrl, isValidQRCode } from "./tracking";

export const QR_CODES_TABLE = "qr_codes";
export const QR_SCANS_TABLE = "qr_scans";

/**
 * Retrieves a dynamic QR code record by its public slug.
 */
export async function getQRCodeByCode(code: string): Promise<QRCode | null> {
  if (!isValidQRCode(code)) return null;

  const db = getSupabaseAdmin();
  if (!db) return null;

  const { data, error } = await db
    .from(QR_CODES_TABLE)
    .select("id, code, name, destination_url, active, created_at, updated_at")
    .eq("code", code.trim().toLowerCase())
    .single();

  if (error || !data) return null;
  return data as QRCode;
}

/**
 * Retrieves a QR record by primary UUID.
 */
export async function getQRCodeById(id: string): Promise<QRCode | null> {
  const db = getSupabaseAdmin();
  if (!db) return null;

  const { data, error } = await db
    .from(QR_CODES_TABLE)
    .select("id, code, name, destination_url, active, created_at, updated_at")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as QRCode;
}

/**
 * Creates a new dynamic QR code record.
 */
export async function createQRCode(input: CreateQRCodeInput): Promise<{ qr: QRCode | null; error?: string }> {
  const code = input.code.trim().toLowerCase();
  if (!isValidQRCode(code)) {
    return { qr: null, error: "Invalid QR code format. Use 1-64 alphanumeric characters, dashes, or underscores." };
  }

  const urlCheck = isValidDestinationUrl(input.destination_url);
  if (!urlCheck.valid) {
    return { qr: null, error: urlCheck.error };
  }

  const db = getSupabaseAdmin();
  if (!db) return { qr: null, error: "Database not configured." };

  const { data, error } = await db
    .from(QR_CODES_TABLE)
    .insert({
      code,
      name: input.name.trim(),
      destination_url: input.destination_url.trim(),
      active: input.active ?? true,
    })
    .select("id, code, name, destination_url, active, created_at, updated_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { qr: null, error: `QR code '${code}' already exists.` };
    }
    return { qr: null, error: error.message };
  }

  return { qr: data as QRCode };
}

/**
 * Updates a dynamic QR code destination URL or status.
 */
export async function updateQRCode(
  id: string,
  input: UpdateQRCodeInput,
): Promise<{ qr: QRCode | null; error?: string }> {
  const updates: Record<string, unknown> = {};

  if (input.name !== undefined) {
    updates.name = input.name.trim();
  }
  if (input.destination_url !== undefined) {
    const urlCheck = isValidDestinationUrl(input.destination_url);
    if (!urlCheck.valid) {
      return { qr: null, error: urlCheck.error };
    }
    updates.destination_url = input.destination_url.trim();
  }
  if (input.active !== undefined) {
    updates.active = input.active;
  }

  if (Object.keys(updates).length === 0) {
    return { qr: null, error: "No fields provided to update." };
  }

  const db = getSupabaseAdmin();
  if (!db) return { qr: null, error: "Database not configured." };

  const { data, error } = await db
    .from(QR_CODES_TABLE)
    .update(updates)
    .eq("id", id)
    .select("id, code, name, destination_url, active, created_at, updated_at")
    .single();

  if (error) return { qr: null, error: error.message };
  return { qr: data as QRCode };
}

/**
 * Lists all registered dynamic QR codes.
 */
export async function listQRCodes(): Promise<QRCode[]> {
  const db = getSupabaseAdmin();
  if (!db) return [];

  const { data, error } = await db
    .from(QR_CODES_TABLE)
    .select("id, code, name, destination_url, active, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as QRCode[];
}

/**
 * Deletes a dynamic QR code and cascades to its scan logs.
 */
export async function deleteQRCode(id: string): Promise<{ ok: boolean; error?: string }> {
  const db = getSupabaseAdmin();
  if (!db) return { ok: false, error: "Database not configured." };

  const { error } = await db.from(QR_CODES_TABLE).delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Lists all registered dynamic QR codes along with aggregated scan counters.
 */
export async function listQRCodesWithStats(): Promise<QRCodeWithStats[]> {
  const db = getSupabaseAdmin();
  if (!db) return [];

  const { data: qrs, error: qrErr } = await db
    .from(QR_CODES_TABLE)
    .select("id, code, name, destination_url, active, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (qrErr || !qrs) return [];

  const { data: scans, error: scanErr } = await db
    .from(QR_SCANS_TABLE)
    .select("qr_id, scanned_at, visitor_hash");

  const scanStats = new Map<string, { total: number; visitors: Set<string>; latest: string | null }>();

  if (!scanErr && scans) {
    for (const s of scans) {
      if (!scanStats.has(s.qr_id)) {
        scanStats.set(s.qr_id, { total: 0, visitors: new Set(), latest: null });
      }
      const st = scanStats.get(s.qr_id)!;
      st.total++;
      if (s.visitor_hash) st.visitors.add(s.visitor_hash);
      if (!st.latest || new Date(s.scanned_at) > new Date(st.latest)) {
        st.latest = s.scanned_at;
      }
    }
  }

  return qrs.map((q) => {
    const st = scanStats.get(q.id);
    return {
      ...(q as QRCode),
      total_scans: st?.total ?? 0,
      unique_visitors_est: st?.visitors.size ?? 0,
      last_scanned_at: st?.latest ?? null,
    };
  });
}

/**
 * Records a single scan event with privacy-preserving metadata.
 * Executes server-side with service role to bypass RLS.
 */
export async function recordQRScan(
  qrId: string,
  metadata: ScanMetadata,
): Promise<{ ok: boolean; scanId?: string; error?: string }> {
  const db = getSupabaseAdmin();
  if (!db) return { ok: false, error: "Database connection unavailable." };

  const row = {
    qr_id: qrId,
    country: metadata.country,
    region: metadata.region,
    city: metadata.city,
    latitude: metadata.latitude,
    longitude: metadata.longitude,
    postal_code: metadata.postal_code,
    device_type: metadata.device_type,
    operating_system: metadata.operating_system,
    browser: metadata.browser,
    referrer: metadata.referrer,
    user_agent_hash: metadata.user_agent_hash,
    visitor_hash: metadata.visitor_hash,
    is_bot: metadata.is_bot,
  };

  const { data, error } = await db.from(QR_SCANS_TABLE).insert(row).select("id").single();

  if (error) {
    console.error("[qr-scan] Failed to insert scan event:", error);
    return { ok: false, error: error.message };
  }

  return { ok: true, scanId: data?.id };
}

/**
 * Helper to compute category breakdown counts sorted descending.
 */
function aggregateBreakdown(items: (string | null | undefined)[], topN = 10): MetricCount[] {
  const counts = new Map<string, number>();
  let total = 0;

  for (const item of items) {
    const key = item && item.trim() !== "" ? item.trim() : "Unknown";
    counts.set(key, (counts.get(key) ?? 0) + 1);
    total++;
  }

  return Array.from(counts.entries())
    .map(([label, count]) => ({
      label,
      count,
      percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
}

/**
 * Comprehensive analytics aggregation engine for a QR code.
 * Computes totals, unique visitor estimates, time-series intervals, and breakdown distributions.
 */
export async function getQRAnalyticsSummary(
  qrId: string,
  options?: { from?: Date; to?: Date },
): Promise<QRAnalyticsSummary | null> {
  const qr = await getQRCodeById(qrId);
  if (!qr) return null;

  const db = getSupabaseAdmin();
  if (!db) return null;

  let query = db
    .from(QR_SCANS_TABLE)
    .select(
      "id, scanned_at, country, city, device_type, operating_system, browser, referrer, visitor_hash, is_bot",
    )
    .eq("qr_id", qrId)
    .order("scanned_at", { ascending: false });

  if (options?.from) query = query.gte("scanned_at", options.from.toISOString());
  if (options?.to) query = query.lte("scanned_at", options.to.toISOString());

  const { data: rawScans, error } = await query;
  if (error || !rawScans) {
    console.error("[qr-analytics] Error fetching scan data:", error);
    return null;
  }

  const totalScans = rawScans.length;

  // Distinct visitor hashes for unique visitor estimate
  const uniqueVisitorHashes = new Set<string>();
  let botScans = 0;

  const now = new Date();
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).getTime();
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

  let scansToday = 0;
  let scansThisWeek = 0;
  let scansThisMonth = 0;

  // Daily map for time series
  const dailyScans = new Map<string, { scans: number; visitors: Set<string> }>();

  for (const scan of rawScans) {
    if (scan.visitor_hash) uniqueVisitorHashes.add(scan.visitor_hash);
    if (scan.is_bot) botScans++;

    const scanTime = new Date(scan.scanned_at).getTime();
    if (scanTime >= startOfToday) scansToday++;
    if (scanTime >= sevenDaysAgo) scansThisWeek++;
    if (scanTime >= thirtyDaysAgo) scansThisMonth++;

    const dateKey = scan.scanned_at.slice(0, 10);
    if (!dailyScans.has(dateKey)) {
      dailyScans.set(dateKey, { scans: 0, visitors: new Set<string>() });
    }
    const day = dailyScans.get(dateKey)!;
    day.scans++;
    if (scan.visitor_hash) day.visitors.add(scan.visitor_hash);
  }

  // Format time series sorted chronologically
  const scansOverTime: TimeSeriesPoint[] = Array.from(dailyScans.entries())
    .map(([date, d]) => ({
      date,
      scans: d.scans,
      unique_visitors: d.visitors.size,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Category distributions
  const countries = aggregateBreakdown(rawScans.map((s) => s.country));
  const cities = aggregateBreakdown(
    rawScans.map((s) => (s.city ? `${s.city}${s.country ? `, ${s.country}` : ""}` : null)),
  );
  const operatingSystems = aggregateBreakdown(rawScans.map((s) => s.operating_system));
  const browsers = aggregateBreakdown(rawScans.map((s) => s.browser));
  const deviceTypes = aggregateBreakdown(rawScans.map((s) => s.device_type));
  const referrers = aggregateBreakdown(rawScans.map((s) => s.referrer));

  // Recent 50 scans anonymized
  const recentScans: RecentScan[] = rawScans.slice(0, 50).map((s) => ({
    id: s.id,
    scanned_at: s.scanned_at,
    country: s.country,
    city: s.city,
    device_type: s.device_type as DeviceType,
    operating_system: s.operating_system,
    browser: s.browser,
    is_bot: s.is_bot,
    referrer: s.referrer,
  }));

  return {
    qr_id: qr.id,
    qr_code: qr.code,
    destination_url: qr.destination_url,
    total_scans: totalScans,
    unique_visitors_est: uniqueVisitorHashes.size,
    scans_today: scansToday,
    scans_this_week: scansThisWeek,
    scans_this_month: scansThisMonth,
    bot_scans: botScans,
    scans_over_time: scansOverTime,
    countries,
    cities,
    operating_systems: operatingSystems,
    browsers,
    device_types: deviceTypes,
    referrers,
    recent_scans: recentScans,
  };
}
