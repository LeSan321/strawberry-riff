import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { generateTrackOGImage, generateDefaultOGImage } from "../ogImage";

export const ogImageRouter = router({
  /**
   * Generate OG image for a track share
   * Returns PNG buffer that can be served as og:image
   */
  trackImage: publicProcedure
    .input(
      z.object({
        trackTitle: z.string().min(1).max(100),
        artistName: z.string().min(1).max(100),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const imageBuffer = await generateTrackOGImage(
          input.trackTitle,
          input.artistName
        );
        // Return as base64 for easy transmission
        return {
          success: true,
          data: imageBuffer.toString("base64"),
          mimeType: "image/png",
        };
      } catch (error) {
        console.error("[OG Image] Track image generation failed:", error);
        return {
          success: false,
          error: "Failed to generate OG image",
        };
      }
    }),

  /**
   * Generate default OG image for homepage
   */
  defaultImage: publicProcedure.mutation(async () => {
    try {
      const imageBuffer = await generateDefaultOGImage();
      return {
        success: true,
        data: imageBuffer.toString("base64"),
        mimeType: "image/png",
      };
    } catch (error) {
      console.error("[OG Image] Default image generation failed:", error);
      return {
        success: false,
        error: "Failed to generate default OG image",
      };
    }
  }),
});
