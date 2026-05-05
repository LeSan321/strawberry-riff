/**
 * Generate dynamic OG meta tags for track share pages
 * Uses album art directly (no image generation) + music-specific metadata
 */
export function generateTrackOGMetaTags(
  trackTitle: string,
  artistName: string,
  trackId: number,
  coverArtUrl?: string,
  duration?: number
): string {
  const origin = process.env.VITE_FRONTEND_URL || "https://strawberryriff.com";
  const trackUrl = `${origin}/track/${trackId}`;
  const strawberry = "🍓";

  // Use provided cover art, or fallback to a default branded image
  const ogImageUrl = coverArtUrl || `${origin}/api/og-image/default`;

  // Format duration for display (e.g., "3:45")
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const durationStr = formatDuration(duration);
  const durationDisplay = durationStr ? ` • ${durationStr}` : "";

  return `
    <!-- Open Graph Tags (Primary Social Sharing) -->
    <meta property="og:title" content="${escapeHtml(trackTitle)} ${strawberry}" />
    <meta property="og:description" content="by ${escapeHtml(artistName)}${durationDisplay} ${strawberry} Strawberry Riff" />
    <meta property="og:image" content="${ogImageUrl}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:url" content="${trackUrl}" />
    <meta property="og:site_name" content="Strawberry Riff ${strawberry}" />
    <meta property="og:type" content="music.song" />

    <!-- Music-Specific Metadata (for music-aware platforms) -->
    <meta property="music:duration" content="${duration || 180}" />
    <meta property="music:album" content="Strawberry Riff" />
    <meta property="music:musician" content="${escapeHtml(artistName)}" />

    <!-- Twitter/X Card Tags (X has separate crawler) -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(trackTitle)} ${strawberry}" />
    <meta name="twitter:description" content="by ${escapeHtml(artistName)}${durationDisplay} ${strawberry}" />
    <meta name="twitter:image" content="${ogImageUrl}" />
    <meta name="twitter:site" content="@strawberryriff" />
  `;
}

/**
 * Generate default OG meta tags for homepage
 */
export function generateDefaultOGMetaTags(): string {
  const origin = process.env.VITE_FRONTEND_URL || "https://strawberryriff.com";
  const ogImageUrl = `${origin}/api/og-image/default`;
  const strawberry = "🍓";

  return `
    <!-- Open Graph Tags (Primary Social Sharing) -->
    <meta property="og:title" content="Strawberry Riff ${strawberry}" />
    <meta property="og:description" content="Share Your Vibe. Build Your Tribe. ${strawberry} Music made by us. Not markets." />
    <meta property="og:image" content="${ogImageUrl}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:site_name" content="Strawberry Riff ${strawberry}" />
    <meta property="og:type" content="website" />

    <!-- Twitter/X Card Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Strawberry Riff ${strawberry}" />
    <meta name="twitter:description" content="Share Your Vibe. Build Your Tribe. ${strawberry}" />
    <meta name="twitter:image" content="${ogImageUrl}" />
    <meta name="twitter:site" content="@strawberryriff" />
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
