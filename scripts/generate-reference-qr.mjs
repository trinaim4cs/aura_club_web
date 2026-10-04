import fs from "fs";
import path from "path";
import QRCode from "qrcode";

const rootDir = process.cwd();
const targetUrl = "https://join-aura.vercel.app/r/aura";

async function generateSvg() {
  const qr = QRCode.create(targetUrl, { errorCorrectionLevel: "H" });
  const size = qr.modules.size; // 37
  const data = qr.modules.data; // Uint8Array

  const moduleSize = 20;
  const marginModules = 3;
  const viewBoxSize = (size + marginModules * 2) * moduleSize;

  // Center logo cutout bounds (in module coordinates)
  // Center is ~18.5. Width ~18 modules, Height ~8 modules
  const logoStartCol = 8;
  const logoEndCol = size - 9; // 28
  const logoStartRow = 14;
  const logoEndRow = 22;

  function isEye(r, c) {
    // Top-left: 0..6, 0..6 (plus separator 0..7, 0..7)
    if (r <= 7 && c <= 7) return true;
    // Top-right: 0..7, size-8..size-1
    if (r <= 7 && c >= size - 8) return true;
    // Bottom-left: size-8..size-1, 0..7
    if (r >= size - 8 && c <= 7) return true;
    return false;
  }

  function isLogoArea(r, c) {
    return r >= logoStartRow && r <= logoEndRow && c >= logoStartCol && c <= logoEndCol;
  }

  function isDark(r, c) {
    if (r < 0 || r >= size || c < 0 || c >= size) return false;
    return data[r * size + c] === 1;
  }

  let pathsSvg = "";

  // 1. Draw corner eyes (Position patterns)
  const eyeCoords = [
    [0, 0],
    [0, size - 7],
    [size - 7, 0],
  ];

  for (const [er, ec] of eyeCoords) {
    const x = (ec + marginModules) * moduleSize;
    const y = (er + marginModules) * moduleSize;

    // Outer 7x7 black frame with clean square corners
    // Frame outer: 7 modules, inner cutout: 5 modules -> wall thickness 1 module
    pathsSvg += `<rect x="${x}" y="${y}" width="${7 * moduleSize}" height="${7 * moduleSize}" fill="#000000" />\n`;
    pathsSvg += `<rect x="${x + moduleSize}" y="${y + moduleSize}" width="${5 * moduleSize}" height="${5 * moduleSize}" fill="#ffffff" />\n`;
    // Center 3x3 black square
    pathsSvg += `<rect x="${x + 2 * moduleSize}" y="${y + 2 * moduleSize}" width="${3 * moduleSize}" height="${3 * moduleSize}" fill="#000000" />\n`;
  }

  // 2. Draw data modules with smooth fluid rounded shapes
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (isEye(r, c) || isLogoArea(r, c)) continue;
      if (!isDark(r, c)) continue;

      const x = (c + marginModules) * moduleSize;
      const y = (r + marginModules) * moduleSize;

      // Check adjacent neighbors to create connected smooth shapes
      const top = isDark(r - 1, c) && !isEye(r - 1, c) && !isLogoArea(r - 1, c);
      const bottom = isDark(r + 1, c) && !isEye(r + 1, c) && !isLogoArea(r + 1, c);
      const left = isDark(r, c - 1) && !isEye(r, c - 1) && !isLogoArea(r, c - 1);
      const right = isDark(r, c + 1) && !isEye(r, c + 1) && !isLogoArea(r, c + 1);

      // Connected modules overlap slightly with rounded rects
      const radius = moduleSize * 0.44;
      pathsSvg += `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" rx="${radius}" ry="${radius}" fill="#000000" />\n`;

      // Bridge connections between adjacent modules for liquid/connected feel
      if (right) {
        pathsSvg += `<rect x="${x + moduleSize * 0.5}" y="${y + moduleSize * 0.1}" width="${moduleSize}" height="${moduleSize * 0.8}" fill="#000000" />\n`;
      }
      if (bottom) {
        pathsSvg += `<rect x="${x + moduleSize * 0.1}" y="${y + moduleSize * 0.5}" width="${moduleSize * 0.8}" height="${moduleSize}" fill="#000000" />\n`;
      }
    }
  }

  // 3. Center Logo cutout and overlay
  const logoX = (logoStartCol + marginModules) * moduleSize - 4;
  const logoY = (logoStartRow + marginModules) * moduleSize - 4;
  const logoWidth = (logoEndCol - logoStartCol + 1) * moduleSize + 8;
  const logoHeight = (logoEndRow - logoStartRow + 1) * moduleSize + 8;

  // Read wordmark paths
  const wordmarkSvg = fs.readFileSync(path.join(rootDir, "public/aura/wordmark.svg"), "utf-8");
  // Extract <g> or <path>
  const match = wordmarkSvg.match(/<g fill="#000">([\s\S]*?)<\/g>/);
  const pathsContent = match ? match[1] : "";

  const finalSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxSize} ${viewBoxSize}" width="100%" height="100%">
  <!-- White Background -->
  <rect width="${viewBoxSize}" height="${viewBoxSize}" fill="#ffffff" />

  <!-- QR Pattern -->
  ${pathsSvg}

  <!-- Center White Cutout -->
  <rect x="${logoX}" y="${logoY}" width="${logoWidth}" height="${logoHeight}" rx="${moduleSize * 0.7}" fill="#ffffff" />

  <!-- AURA Angular Wordmark -->
  <svg x="${logoX + 8}" y="${logoY + 4}" width="${logoWidth - 16}" height="${logoHeight - 8}" viewBox="0 0 1462.7 488.3" preserveAspectRatio="xMidYMid meet">
    <g fill="#000000">
      ${pathsContent}
    </g>
  </svg>
</svg>
`;

  const outPath = path.join(rootDir, "public/aura-qr.svg");
  fs.writeFileSync(outPath, finalSvg, "utf-8");
  console.log("Generated:", outPath);
}

generateSvg().catch(console.error);
