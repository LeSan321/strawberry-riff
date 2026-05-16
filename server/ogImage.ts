import sharp from "sharp";

const W = 1200;
const H = 630;

/**
 * Escape XML/SVG special characters
 */
function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Wrap text into lines that fit within maxWidth characters (rough estimate for SVG)
 */
function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > maxChars) {
      if (current) lines.push(current.trim());
      current = word;
    } else {
      current = (current + " " + word).trim();
    }
  }
  if (current) lines.push(current.trim());
  return lines;
}

/**
 * Generate a designed OG image for a specific track using Sharp + SVG
 */
export async function generateTrackOGImage(
  trackTitle: string,
  artistName: string
): Promise<Buffer> {
  const titleLines = wrapText(esc(trackTitle), 28);
  const titleY = 260;
  const lineH = 72;

  const titleSvg = titleLines
    .map(
      (line, i) =>
        `<text x="80" y="${titleY + i * lineH}" font-family="'Helvetica Neue', Arial, sans-serif" font-size="64" font-weight="bold" fill="url(#titleGrad)">${line}</text>`
    )
    .join("\n");

  const artistY = titleY + titleLines.length * lineH + 24;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2a0838"/>
      <stop offset="50%" stop-color="#0f0614"/>
      <stop offset="100%" stop-color="#1a0a2e"/>
    </linearGradient>
    <radialGradient id="glow" cx="15%" cy="45%" r="60%">
      <stop offset="0%" stop-color="#4a1468" stop-opacity="0.8"/>
      <stop offset="50%" stop-color="#2a0a3a" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="transparent" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="accentBar" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#7c3aed"/>
      <stop offset="50%" stop-color="#ec4899"/>
      <stop offset="100%" stop-color="#f43f5e"/>
    </linearGradient>
    <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#c084fc"/>
      <stop offset="100%" stop-color="#f472b6"/>
    </linearGradient>
    <linearGradient id="wordmarkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#c084fc"/>
      <stop offset="100%" stop-color="#f472b6"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#bgGrad)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>

  <!-- Accent bar bottom -->
  <rect x="0" y="${H - 6}" width="${W}" height="6" fill="url(#accentBar)"/>

  <!-- Left accent stripe -->
  <rect x="0" y="0" width="6" height="${H}" fill="url(#accentBar)" opacity="0.6"/>

  <!-- Wordmark -->
  <text x="80" y="88" font-family="'Helvetica Neue', Arial, sans-serif" font-size="30" font-weight="bold" fill="url(#wordmarkGrad)">🍓 Strawberry Riff</text>

  <!-- Divider line -->
  <line x1="80" y1="118" x2="${W - 80}" y2="118" stroke="#2e1a4a" stroke-width="1"/>

  <!-- Track title (gradient) -->
  ${titleSvg}

  <!-- Artist name -->
  <text x="80" y="${artistY}" font-family="'Helvetica Neue', Arial, sans-serif" font-size="36" fill="#b89ec8">by ${esc(artistName)}</text>

  <!-- Bottom label -->
  <text x="80" y="${H - 28}" font-family="'Helvetica Neue', Arial, sans-serif" font-size="22" fill="#6b4f7a">strawberryriff.com</text>
</svg>`;

  return await sharp(Buffer.from(svg)).png().toBuffer();
}

/**
 * Generate a branded fallback OG image for homepage and non-track pages
 */
export async function generateDefaultOGImage(): Promise<Buffer> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2a0838"/>
      <stop offset="50%" stop-color="#0f0614"/>
      <stop offset="100%" stop-color="#1a0a2e"/>
    </linearGradient>
    <radialGradient id="glow" cx="15%" cy="45%" r="60%">
      <stop offset="0%" stop-color="#4a1468" stop-opacity="0.8"/>
      <stop offset="50%" stop-color="#2a0a3a" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="transparent" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="accentBar" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#7c3aed"/>
      <stop offset="50%" stop-color="#ec4899"/>
      <stop offset="100%" stop-color="#f43f5e"/>
    </linearGradient>
    <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#c084fc"/>
      <stop offset="100%" stop-color="#f472b6"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#bgGrad)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>

  <!-- Accent bar bottom -->
  <rect x="0" y="${H - 6}" width="${W}" height="6" fill="url(#accentBar)"/>

  <!-- Left accent stripe -->
  <rect x="0" y="0" width="6" height="${H}" fill="url(#accentBar)" opacity="0.6"/>

  <!-- Main wordmark -->
  <text x="80" y="300" font-family="'Helvetica Neue', Arial, sans-serif" font-size="96" font-weight="bold" fill="url(#titleGrad)">🍓 Strawberry Riff</text>

  <!-- Tagline -->
  <text x="80" y="380" font-family="'Helvetica Neue', Arial, sans-serif" font-size="36" fill="#b89ec8">Share Your Vibe. Build Your Tribe.</text>

  <!-- Divider -->
  <line x1="80" y1="420" x2="600" y2="420" stroke="#2e1a4a" stroke-width="1"/>

  <!-- Bottom label -->
  <text x="80" y="${H - 28}" font-family="'Helvetica Neue', Arial, sans-serif" font-size="22" fill="#6b4f7a">strawberryriff.com</text>
</svg>`;

  return await sharp(Buffer.from(svg)).png().toBuffer();
}
