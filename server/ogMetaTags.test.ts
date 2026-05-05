import { describe, it, expect } from "vitest";
import { generateTrackOGMetaTags, generateDefaultOGMetaTags } from "./_core/ogMetaTags";

describe("OG Meta Tags Generation", () => {
  describe("generateTrackOGMetaTags", () => {
    it("should generate track OG tags with all metadata", () => {
      const tags = generateTrackOGMetaTags(
        "My Song",
        "Artist Name",
        123,
        "https://example.com/cover.jpg",
        180
      );

      expect(tags).toContain('og:title" content="My Song 🍓"');
      expect(tags).toContain('og:description" content="by Artist Name • 3:00 🍓 Strawberry Riff"');
      expect(tags).toContain('og:image" content="https://example.com/cover.jpg"');
      expect(tags).toContain('og:type" content="music.song"');
      expect(tags).toContain('music:duration" content="180"');
      expect(tags).toContain('music:album" content="Strawberry Riff"');
      expect(tags).toContain('music:musician" content="Artist Name"');
      expect(tags).toContain('twitter:card" content="summary_large_image"');
    });

    it("should fallback to default image when coverArtUrl is not provided", () => {
      const tags = generateTrackOGMetaTags(
        "My Song",
        "Artist Name",
        123,
        undefined,
        180
      );

      expect(tags).toContain('og:image" content="https://strawberryriff.com/api/og-image/default"');
    });

    it("should handle missing duration gracefully", () => {
      const tags = generateTrackOGMetaTags(
        "My Song",
        "Artist Name",
        123,
        "https://example.com/cover.jpg"
      );

      expect(tags).toContain('og:description" content="by Artist Name 🍓 Strawberry Riff"');
      expect(tags).toContain('music:duration" content="180"'); // defaults to 180
    });

    it("should escape HTML special characters in title and artist", () => {
      const tags = generateTrackOGMetaTags(
        'Song with "quotes" & <brackets>',
        'Artist & Co. <Ltd>',
        123,
        undefined,
        180
      );

      expect(tags).toContain('&quot;');
      expect(tags).toContain('&amp;');
      expect(tags).toContain('&lt;');
      expect(tags).toContain('&gt;');
      expect(tags).not.toContain('<brackets>');
    });

    it("should format duration correctly in description", () => {
      const tags = generateTrackOGMetaTags(
        "My Song",
        "Artist Name",
        123,
        undefined,
        225 // 3:45
      );

      expect(tags).toContain("3:45");
    });

    it("should include Twitter/X card tags", () => {
      const tags = generateTrackOGMetaTags(
        "My Song",
        "Artist Name",
        123,
        undefined,
        180
      );

      expect(tags).toContain('twitter:card" content="summary_large_image"');
      expect(tags).toContain('twitter:title" content="My Song 🍓"');
      expect(tags).toContain('twitter:site" content="@strawberryriff"');
    });

    it("should include image dimensions", () => {
      const tags = generateTrackOGMetaTags(
        "My Song",
        "Artist Name",
        123,
        undefined,
        180
      );

      expect(tags).toContain('og:image:width" content="1200"');
      expect(tags).toContain('og:image:height" content="630"');
    });
  });

  describe("generateDefaultOGMetaTags", () => {
    it("should generate default OG tags for homepage", () => {
      const tags = generateDefaultOGMetaTags();

      expect(tags).toContain('og:title" content="Strawberry Riff 🍓"');
      expect(tags).toContain('og:description" content="Share Your Vibe. Build Your Tribe. 🍓');
      expect(tags).toContain('og:type" content="website"');
      expect(tags).toContain('twitter:card" content="summary_large_image"');
    });

    it("should include image dimensions for default image", () => {
      const tags = generateDefaultOGMetaTags();

      expect(tags).toContain('og:image:width" content="1200"');
      expect(tags).toContain('og:image:height" content="630"');
    });
  });
});
