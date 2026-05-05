import sharp from "sharp";

/**
 * Generate Open Graph preview image for track shares
 * Deep plum background with strawberry branding, track title, and artist name
 */
export async function generateTrackOGImage(
  trackTitle: string,
  artistName: string
): Promise<Buffer> {
  const width = 1200;
  const height = 630;
  const deepPlum = "#2D1B3D"; // Deep plum brand color
  const accentPink = "#FF6B9D"; // Strawberry pink accent
  const textWhite = "#FFFFFF";

  // Create SVG with text content - using Helvetica/Arial for better cross-platform rendering
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <!-- Deep plum background -->
      <rect width="${width}" height="${height}" fill="${deepPlum}"/>
      
      <!-- Gradient overlay for depth -->
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#3D2B4D;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1D0B2D;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#bgGradient)"/>
      
      <!-- Strawberry icon in top-left corner with subtle background circle -->
      <circle cx="80" cy="80" r="50" fill="${accentPink}" opacity="0.15"/>
      <text x="80" y="105" font-size="70" text-anchor="middle" dominant-baseline="middle">🍓</text>
      
      <!-- Strawberry Riff branding (next to icon) -->
      <text x="200" y="85" font-family="Helvetica, Arial, sans-serif" font-size="44" font-weight="bold" fill="${accentPink}" text-anchor="start">
        Strawberry Riff
      </text>
      
      <!-- Track title (larger and more prominent) -->
      <text x="100" y="280" font-family="Helvetica, Arial, sans-serif" font-size="68" font-weight="bold" fill="${textWhite}" text-anchor="start">
        <tspan x="100" dy="0">${escapeXml(trackTitle.substring(0, 30))}</tspan>
        ${trackTitle.length > 30 ? `<tspan x="100" dy="85">${escapeXml(trackTitle.substring(30, 60))}</tspan>` : ""}
      </text>
      
      <!-- Artist name (more prominent) -->
      <text x="100" y="450" font-family="Helvetica, Arial, sans-serif" font-size="42" font-weight="600" fill="${accentPink}" text-anchor="start">
        by ${escapeXml(artistName)}
      </text>
      
      <!-- Tagline -->
      <text x="100" y="550" font-family="Helvetica, Arial, sans-serif" font-size="30" fill="${textWhite}" opacity="0.9" text-anchor="start">
        Share Your Vibe. Build Your Tribe.
      </text>
      
      <!-- Decorative accent line -->
      <line x1="100" y1="600" x2="1100" y2="600" stroke="${accentPink}" stroke-width="4" opacity="0.7"/>
    </svg>
  `;

  try {
    const buffer = await sharp(Buffer.from(svg))
      .png()
      .toBuffer();
    return buffer;
  } catch (error) {
    console.error("[OG Image] Failed to generate image:", error);
    throw error;
  }
}

/**
 * Generate fallback OG image for homepage and non-track pages
 */
export async function generateDefaultOGImage(): Promise<Buffer> {
  const width = 1200;
  const height = 630;
  const deepPlum = "#2D1B3D";
  const accentPink = "#FF6B9D";
  const textWhite = "#FFFFFF";

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <!-- Deep plum background -->
      <rect width="${width}" height="${height}" fill="${deepPlum}"/>
      
      <!-- Gradient overlay -->
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#3D2B4D;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1D0B2D;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#bgGradient)"/>
      
      <!-- Strawberry icon with background circle -->
      <circle cx="600" cy="150" r="70" fill="${accentPink}" opacity="0.15"/>
      <text x="600" y="180" font-size="100" text-anchor="middle" dominant-baseline="middle">🍓</text>
      
      <!-- Main heading -->
      <text x="600" y="340" font-family="Helvetica, Arial, sans-serif" font-size="80" font-weight="bold" fill="${textWhite}" text-anchor="middle">
        Strawberry Riff
      </text>
      
      <!-- Tagline -->
      <text x="600" y="440" font-family="Helvetica, Arial, sans-serif" font-size="44" fill="${accentPink}" text-anchor="middle">
        Share Your Vibe. Build Your Tribe.
      </text>
      
      <!-- Subtext -->
      <text x="600" y="520" font-family="Helvetica, Arial, sans-serif" font-size="32" fill="${textWhite}" opacity="0.8" text-anchor="middle">
        Music made by us. Not markets.
      </text>
    </svg>
  `;

  try {
    const buffer = await sharp(Buffer.from(svg))
      .png()
      .toBuffer();
    return buffer;
  } catch (error) {
    console.error("[OG Image] Failed to generate default image:", error);
    throw error;
  }
}

/**
 * Escape XML special characters to prevent SVG injection
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
