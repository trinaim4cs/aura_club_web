import type {
  QRStylingConfig,
  ScannabilityWarning,
} from "./types";

/**
 * Pre-inlined SVG Data URI for AURA logo: eliminates HTTP requests to CDN on QR canvas updates.
 */
export const AURA_LOGO_DATA_URI =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9Ii0xMjAgLTgwIDE3MDIuNyA2NDguMyI+CiAgPHJlY3QgeD0iLTEyMCIgeT0iLTgwIiB3aWR0aD0iMTcwMi43IiBoZWlnaHQ9IjY0OC4zIiByeD0iNzAiIGZpbGw9IiNmZmZmZmYiLz4KICA8ZyBmaWxsPSIjMDAwMDAwIj4KICAgIDxwYXRoIGQ9Ik0yNjMuMCAxNy4zIEwyNjAuMyAxNy4wIEwxMzEuNyA5NS4wIEwxMzEuNyA5Ny43IEwxOTIuMCAxNjYuMyBMMTk0LjAgMTcwLjcgTDE5Mi43IDE3NC43IEwxMzAuMCAyODAuNyBMMTI2LjMgMjgzLjAgTDY2LjMgMjc4LjMgTDU4LjMgMjc2LjcgTDQxLjAgMjc2LjAgTDIyLjAgMjczLjMgTDE1LjcgMjczLjMgTDE0LjAgMjc0LjcgTDAuMCAzNjEuNyBMMC43IDM2NS4wIEwxMy43IDM2NS4wIEwxOC4wIDM2My43IEw0MC43IDM2Mi4wIEw0Ni4zIDM2MC4zIEw2OS4wIDM1OC43IEw3NC43IDM1Ny4wIEw4MS4wIDM1Ny4wIEw4My4wIDM1OC43IEw4My4wIDM2MC43IEwxNS4wIDQ3Ni4wIEwxNS4wIDQ3OS4zIEwyMTEuMCA0NzkuNyBMMjEzLjAgNDc2LjMgTDIxMS4zIDQwNC4zIEwyMTAuMCAzODcuNyBMMjA5LjcgMzQ0LjMgTDIxMi4wIDM0Mi4wIEwyMTUuMyAzNDEuMCBMMzMyLjAgMzI4LjMgTDMzNy4zIDMzMi4zIEw0NjguMCA0ODIuMyBMNDc1LjAgNDg4LjMgTDQ3My43IDQ4My4zIEw0MDEuMyAzMjMuMyBMNDAzLjMgMzE5LjcgTDQzOC4zIDMxNS43IEw0MzkuMyAzMTQuMCBMNDM4LjMgMzEyLjMgTDQzMy4wIDMxMS4zIEw0MDMuMCAzMDkuMyBMMzk1LjcgMzA3LjcgTDM5My4wIDMwNS4wWk0yMDUuNyAxODUuNyBMMjA4LjMgMTg1LjcgTDMwNC4wIDI5NC4zIEwzMDUuMCAyOTYuMCBMMzA0LjAgMjk5LjAgTDI5OS4zIDI5OS43IEwyNTYuMyAyOTUuMCBMMjM5LjcgMjk0LjMgTDIyMS4wIDI5MS43IEwyMTMuMCAyOTEuNyBMMjA4LjMgMjg4LjcgTDIwNi43IDI2Ny43IEwyMDYuMyAyMTAuMyBMMjA0LjcgMTg3LjNaIi8+CiAgICA8cGF0aCBkPSJNNjkwLjAgNTUuMyBMNjg3LjcgNTUuNyBMNjI5LjcgMTA1LjMgTDYwNS4wIDEyOC43IEw2MDMuMCAxMzIuMyBMNjY2LjcgMzU4LjMgTDY2Ny4zIDM2NC43IEw2NjQuMCAzNjguMCBMNTk2LjcgMzc2LjcgTDU4My4zIDM3OS4zIEw1NzAuNyAzODAuMyBMNTY4LjcgMzc5LjcgTDU2Ni4wIDM3Ni4zIEw0ODMuNyAxNDIuMCBMNDgwLjcgMTM2LjcgTDM1MS4wIDg5LjMgTDM0OS4wIDkwLjMgTDQ0MS4wIDMwNi43IEw0NDEuMyAzMTAuNyBMNDM5LjAgMzEyLjMgTDQ0MC4wIDMxNS4zIEw0NzEuMyAzMTIuMyBMNDc0LjAgMzEyLjcgTDQ3NS4wIDMxNC4wIEw0NzIuMCAzMTcuMCBMNDQ5LjMgMzI0LjcgTDQ0OS4wIDMyNy4wIEw1MTUuNyA0ODIuNyBMNTE5LjAgNDg3LjMgTDc0OC43IDQ4NS4wIEw3NTAuMyA0ODMuMCBMNzQ5LjMgNDcxLjAgTDc0OC4wIDQ2OC43IEw3NDUuMyA0NjcuNyBMNzQzLjcgNDUwLjAgTDc0MS43IDQ0MS43IEw3MTguMCAyNTcuMyBMNzEzLjAgMjI2LjMgTDY5Ni43IDk2LjMgTDY5MS4wIDU2LjdaIi8+CiAgICA8cGF0aCBkPSJNNzQyLjMgNDQuMyBMNzQxLjcgNDcuNyBMNzQzLjAgNjUuMyBMNzQ1LjAgNzUuMyBMNzQ2LjcgOTkuMyBMNzQ4LjMgOTkuMCBMNzQ5LjcgMTAxLjAgTDc1MS4wIDEwNy4zIEw3NTIuNyAxMzQuMCBMNzU0LjMgMTQxLjAgTDc1Ni4wIDE2OC4wIEw3NTcuMyAxNzIuMyBMNzU5LjAgMTk4LjMgTDc2Ny4wIDI3Mi4zIEw3ODYuNyA0ODEuNyBMNzg3LjcgNDgzLjcgTDc5MS43IDQ4NC43IEw4MTYuMCA0ODMuMCBMODg1LjAgNDgyLjMgTDg4OC43IDQ4MC4zIEw4ODUuMyA0NDIuMCBMODc5LjMgMzkyLjcgTDg3OC43IDM3OC4zIEw4NzMuMCAzMzMuMyBMODczLjAgMzI4LjMgTDg3NC43IDMyNi4wIEw4NzkuMyAzMjguNyBMOTU3LjcgNDA3LjMgTDEwMjcuMyA0NzUuMyBMMTEzNy4wIDQ3NC43IEwxMTUyLjAgNDczLjMgTDEyMDcuMCA0NzIuNyBMMTIxMC43IDQ3MS4zIEwxMjAzLjAgNDY1LjAgTDkzMC43IDI4NC43IEw5MjMuNyAyNzguNyBMOTI0LjcgMjc1LjcgTDEwNDMuNyAxNDAuNyBMMTA0NS4wIDEzNi4zIEw3NDkuMCA0NC4zWk04MjEuMCAxNTMuMCBMODIyLjMgMTUyLjAgTDgyNS4zIDE1Mi43IEw5MDAuMCAxOTguMyBMODk5LjcgMjAxLjcgTDgzNy4wIDI0MS4zIEw4MzAuNyAyNDMuNyBMODI4LjcgMjQwLjMgTDgyNi43IDIyNC43IEw4MjQuNyAxOTYuMyBMODIwLjAgMTU3LjdaIi8+CiAgICA8cGF0aCBkPSJNMTExOC43IDc4LjMgTDExMTkuNyA4MS43IEwxMTgwLjcgMTUxLjMgTDExODEuNyAxNTQuNyBMMTEzMi4wIDIzOS43IEwxMTI4LjMgMjQzLjcgTDExMTguMCAyNDQuMCBMMTExMi4wIDI0Mi4zIEwxMDg2LjcgMjQwLjcgTDEwODIuMCAyMzkuMCBMMTA2NC4wIDIzNy43IEwxMDYwLjAgMjM5LjAgTDEwNDUuNyAzMjUuNyBMMTA0Ni4wIDMyOS4zIEwxMDQ5LjAgMzMwLjAgTDEwNzcuMyAzMjYuMyBMMTA3OC43IDMyOC4wIEwxMDc4LjcgMzMwLjMgTDEwNzEuNyAzNDIuMCBMMTA3MS43IDM0NS4zIEwxMTk2LjMgNDE4LjMgTDExOTguMCA0MTguMyBMMTE5OS4zIDQxNi43IEwxMTk5LjMgNDAzLjAgTDExOTguMCAzODkuNyBMMTE5Ny4wIDMxMi4wIEwxMjAyLjAgMzA5LjMgTDEyOTkuMyAyOTYuMyBMMTMwNy4zIDI5Ni43IEwxNDUxLjAgNDYwLjMgTDE0NjIuNyA0NzIuMCBMMTQ2MC43IDQ2NS4zIEwxMzgxLjAgMjg5LjMgTDEzODEuNyAyODYuMyBMMTM4NC4wIDI4NS4wIEwxNDI1LjAgMjgwLjMgTDE0MzQuNyAyNzcuNyBMMTQwNS4zIDI3My43IEwxMzc4LjMgMjcxLjcgTDEzNzMuNyAyNzAuMCBMMTM3MC43IDI2Ni43IEwxMjUxLjAgMS4zIEwxMjQ5LjAgMC4wIEwxMjQ2LjcgMC43Wk0xMTk0LjcgMTY5LjMgTDExOTkuMCAxNzIuMCBMMTI3MS43IDI1NS4wIEwxMjcyLjMgMjU4LjAgTDEyNzAuNyAyNTkuNyBMMTE5OC4wIDI1Mi4wIEwxMTk1LjMgMjUwLjAgTDExOTQuMCAyMzguMCBMMTE5My4wIDE3MS4zWiIvPgogIDwvZz4KPC9zdmc+";

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
  logoUrl: AURA_LOGO_DATA_URI,
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
