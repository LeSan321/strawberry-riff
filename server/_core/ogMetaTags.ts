/**
 * Generate dynamic OG meta tags for track share pages
 * These tags are injected into the HTML when sharing a track link
 */
export function generateTrackOGMetaTags(
  trackTitle: string,
  artistName: string,
  trackId: number
): string {
  const origin = process.env.VITE_FRONTEND_URL || "https://strawberryriff.com";
  const ogImageUrl = `${origin}/api/og-image/track?title=${encodeURIComponent(
    trackTitle
  )}&artist=${encodeURIComponent(artistName)}`;
  const trackUrl = `${origin}/track/${trackId}`;

  return `
    <meta property="og:title" content="${escapeHtml(trackTitle)}" />
    <meta property="og:description" content="by ${escapeHtml(
      artistName
    )} • Strawberry Riff - Share Your Vibe. Build Your Tribe." />
    <meta property="og:image" content="${ogImageUrl}" />
    <meta property="og:url" content="${trackUrl}" />
    <meta property="og:site_name" content="Strawberry Riff" />
    <meta property="og:type" content="music.song" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(trackTitle)}" />
    <meta name="twitter:description" content="by ${escapeHtml(
      artistName
    )} • Strawberry Riff" />
    <meta name="twitter:image" content="${ogImageUrl}" />
  `;
}

/**
 * Generate default OG meta tags for homepage
 */
export function generateDefaultOGMetaTags(): string {
  const origin = process.env.VITE_FRONTEND_URL || "https://strawberryriff.com";
  const ogImageUrl = `${origin}/api/og-image/default`;

  return `
    <meta property="og:title" content="Strawberry Riff" />
    <meta property="og:description" content="Share Your Vibe. Build Your Tribe. Music made by us. Not markets." />
    <meta property="og:image" content="${ogImageUrl}" />
    <meta property="og:site_name" content="Strawberry Riff" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Strawberry Riff" />
    <meta name="twitter:description" content="Share Your Vibe. Build Your Tribe." />
    <meta name="twitter:image" content="${ogImageUrl}" />
  `;
}

/**
 * Escape HTML special characters to prevent injection
 */
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}
