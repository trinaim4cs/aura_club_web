import type {
  QRStylingConfig,
  ScannabilityWarning,
} from "./types";

/**
 * Standard default configuration matching AURA branding and high scannability.
 */
export const DEFAULT_QR_CONFIG: QRStylingConfig = {
  code: "aura",
  targetUrl: "https://join-aura.vercel.app/r/aura",
  width: 340,
  height: 340,
  margin: 10,
  dotType: "classy-rounded",
  qrColor: "#000000",
  bgColor: "#ffffff",
  gradient: null,
  cornerSquareType: "square",
  cornerSquareColor: "#000000",
  cornerDotType: "square",
  cornerDotColor: "#000000",
  logoUrl: "/aura/qr-logo.svg",
  logoSize: 0.36,
  logoMargin: 2,
  frame: "none",
  frameText: "SCAN TO ENTER",
  frameTextColor: "#ffffff",
  frameBgColor: "#000000",
};

/**
 * High contrast AURA Signature preset matching reference.
 */
export const AURA_PRESET_CONFIG: QRStylingConfig = {
  ...DEFAULT_QR_CONFIG,
};

/**
 * Converts hex color (#ffffff or #fff) to RGB values.
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  if (!hex || typeof hex !== "string") return null;
  let clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    clean = clean
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (clean.length !== 6) return null;
  const num = parseInt(clean, 16);
  if (isNaN(num)) return null;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Calculates WCAG 2.1 relative luminance for an sRGB component.
 */
function channelLuminance(c: number): number {
  const norm = c / 255;
  return norm <= 0.03928 ? norm / 12.92 : Math.pow((norm + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(rgb: { r: number; g: number; b: number }): number {
  return 0.2126 * channelLuminance(rgb.r) + 0.7152 * channelLuminance(rgb.g) + 0.0722 * channelLuminance(rgb.b);
}

/**
 * Computes WCAG contrast ratio between two hex colors. (Range 1:1 to 21:1)
 */
export function calculateContrastRatio(fgHex: string, bgHex: string): number {
  const fgRgb = hexToRgb(fgHex) || { r: 0, g: 0, b: 0 };
  const bgRgb = hexToRgb(bgHex) || { r: 255, g: 255, b: 255 };

  const l1 = relativeLuminance(fgRgb);
  const l2 = relativeLuminance(bgRgb);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100;
}

/**
 * Evaluates scannability of a QR configuration.
 * Warns against low contrast, inverted palettes, and oversized center logos.
 */
export function evaluateScannability(config: QRStylingConfig): ScannabilityWarning {
  const warnings: string[] = [];
  const contrast = calculateContrastRatio(config.qrColor, config.bgColor);

  const fgRgb = hexToRgb(config.qrColor) || { r: 0, g: 0, b: 0 };
  const bgRgb = hexToRgb(config.bgColor) || { r: 255, g: 255, b: 255 };
  const fgLum = relativeLuminance(fgRgb);
  const bgLum = relativeLuminance(bgRgb);

  // 1. Contrast ratio check
  if (contrast < 2.5) {
    warnings.push("Extremely low contrast. QR readers will likely fail to scan this code.");
  } else if (contrast < 4.0) {
    warnings.push("Moderate contrast. Camera scanners in low lighting may struggle.");
  }

  // 2. Inversion check: Light foreground on dark background
  if (fgLum > bgLum) {
    warnings.push("Inverted color scheme (light QR on dark background). Many native phone camera apps reject inverted QR codes.");
  }

  // 3. Logo size vs error correction (Level H supports up to 35-38% width for wide aspect wordmarks)
  if (config.logoUrl && config.logoSize > 0.38) {
    warnings.push("Large center logo may obstruct data modules. Recommend size under 38%.");
  }

  // 4. Margin check
  if (config.margin < 4) {
    warnings.push("Very small quiet zone (margin). Scanning near busy backgrounds may be hindered.");
  }

  return {
    isScannable: contrast >= 2.5 && warnings.length === 0,
    contrastRatio: contrast,
    warnings,
  };
}

/**
 * Transforms QRStylingConfig into options accepted by qr-code-styling.
 * Always maintains Error Correction Level 'H' (30% redundancy) for maximum resilience.
 */
export function buildQrCodeStylingOptions(config: QRStylingConfig) {
  const dotsOptions: Record<string, unknown> = {
    type: config.dotType,
    color: config.qrColor,
  };

  if (config.gradient) {
    dotsOptions.gradient = {
      type: config.gradient.type,
      rotation: config.gradient.rotation ?? 0,
      colorStops: config.gradient.colorStops,
    };
  }

  return {
    width: config.width,
    height: config.height,
    data: config.targetUrl,
    margin: config.margin,
    qrOptions: {
      typeNumber: 0 as any,
      mode: "Byte" as const,
      errorCorrectionLevel: "H" as const, // High 30% error tolerance ensures logo & styling do not break scan
    },
    image: config.logoUrl || undefined,
    imageOptions: {
      hideBackgroundDots: true,
      imageSize: config.logoSize,
      margin: config.logoMargin,
      crossOrigin: "anonymous",
    },
    dotsOptions,
    cornersSquareOptions: {
      type: config.cornerSquareType,
      color: config.cornerSquareColor || config.qrColor,
    },
    cornersDotOptions: {
      type: config.cornerDotType,
      color: config.cornerDotColor || config.qrColor,
    },
    backgroundOptions: {
      color: config.bgColor,
    },
  };
}
