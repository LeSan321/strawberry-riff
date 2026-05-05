import { Jimp } from "jimp";

/**
 * Generate Open Graph preview image for track shares using Jimp
 * Deep plum background with accent bar - simple and reliable
 */
export async function generateTrackOGImage(
  trackTitle: string,
  artistName: string
): Promise<Buffer> {
  const width = 1200;
  const height = 630;

  // Create image with deep plum background
  const image = new Jimp({
    width,
    height,
    color: 0x2d1b3dff, // Deep plum
  });

  // Add a pink accent bar at the bottom
  for (let y = 550; y < 630; y++) {
    for (let x = 0; x < width; x++) {
      image.setPixelColor(0xff6b9dff, x, y); // Accent pink
    }
  }

  // Add a darker gradient at the top
  for (let y = 0; y < 100; y++) {
    const alpha = Math.floor(255 * (1 - y / 100) * 0.3);
    const color = (0x1d0b2d << 8) | alpha;
    for (let x = 0; x < width; x++) {
      image.setPixelColor(color, x, y);
    }
  }

  return await image.getBuffer("image/png");
}

/**
 * Generate fallback OG image for homepage and non-track pages
 */
export async function generateDefaultOGImage(): Promise<Buffer> {
  const width = 1200;
  const height = 630;

  // Create image with deep plum background
  const image = new Jimp({
    width,
    height,
    color: 0x2d1b3dff, // Deep plum
  });

  // Add a pink accent bar at the bottom
  for (let y = 550; y < 630; y++) {
    for (let x = 0; x < width; x++) {
      image.setPixelColor(0xff6b9dff, x, y); // Accent pink
    }
  }

  // Add a darker gradient at the top
  for (let y = 0; y < 100; y++) {
    const alpha = Math.floor(255 * (1 - y / 100) * 0.3);
    const color = (0x1d0b2d << 8) | alpha;
    for (let x = 0; x < width; x++) {
      image.setPixelColor(color, x, y);
    }
  }

  return await image.getBuffer("image/png");
}
