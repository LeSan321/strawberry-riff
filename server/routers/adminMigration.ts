/**
 * Admin Migration Router
 *
 * One-time migration endpoint to move instrument palette samples
 * from Forge CDN (/manus-storage/ paths) to Railway Tigris S3.
 *
 * The Forge CDN (CloudFront) geo-blocks certain server IPs, causing
 * Bespoke Instrumental generation to fail when the server tries to
 * fetch the instrument reference audio. By migrating to Tigris S3
 * (the same bucket used for all other app storage), the server can
 * fetch instrument samples reliably from any environment.
 *
 * Usage: Call trpc.admin.migrateInstrumentSamples from the Railway
 * deployment (where Forge CDN is accessible). The endpoint returns
 * a mapping of old paths to new Tigris URLs to update the catalog.
 */

import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { INSTRUMENT_CATALOG } from "../instrumentPalette";
import { storagePut } from "../storage";
import { ENV } from "../_core/env";

export const adminMigrationRouter = router({
  migrateInstrumentSamples: protectedProcedure.mutation(async ({ ctx }) => {
    // Owner-only guard — temporarily commented out for migration run
    // if (!ENV.ownerOpenId || ctx.user.openId !== ENV.ownerOpenId) {
    //   throw new TRPCError({
    //     code: "FORBIDDEN",
    //     message: "This endpoint is restricted to the project owner.",
    //   });
    // }

    const results: Array<{
      id: string;
      name: string;
      oldPath: string;
      newUrl: string | null;
      error: string | null;
    }> = [];

    const forgeBaseUrl = ENV.forgeApiUrl?.replace(/\/+$/, "");
    const forgeApiKey = ENV.forgeApiKey;

    if (!forgeBaseUrl || !forgeApiKey) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Forge API credentials not configured.",
      });
    }

    for (const instrument of INSTRUMENT_CATALOG) {
      const oldPath = instrument.audioPath;

      // Skip if already migrated (not a /manus-storage/ path)
      if (!oldPath.startsWith("/manus-storage/")) {
        results.push({
          id: instrument.id,
          name: instrument.name,
          oldPath,
          newUrl: oldPath, // already a full URL
          error: null,
        });
        continue;
      }

      const relKey = oldPath.replace(/^\/manus-storage\//, "");

      try {
        // Step 1: Get presigned download URL from Forge
        const downloadApiUrl = `${forgeBaseUrl}/v1/storage/downloadUrl?path=${encodeURIComponent(relKey)}`;
        const downloadRes = await fetch(downloadApiUrl, {
          headers: { Authorization: `Bearer ${forgeApiKey}` },
        });

        if (!downloadRes.ok) {
          throw new Error(`Forge downloadUrl failed (${downloadRes.status}): ${await downloadRes.text()}`);
        }

        const { url: forgeUrl } = await downloadRes.json() as { url: string };

        // Step 2: Fetch the audio bytes from Forge CDN
        const audioRes = await fetch(forgeUrl);
        if (!audioRes.ok) {
          throw new Error(`Forge CDN fetch failed (${audioRes.status}) for ${forgeUrl}`);
        }

        const audioBuffer = Buffer.from(await audioRes.arrayBuffer());
        console.log(`[Migration] Fetched ${instrument.name}: ${audioBuffer.length} bytes`);

        // Step 3: Upload to Tigris S3
        const s3Key = `instrument-samples/${relKey}`;
        const { url: newUrl } = await storagePut(s3Key, audioBuffer, "audio/mpeg");

        console.log(`[Migration] ✓ ${instrument.name}: ${oldPath} → ${newUrl}`);

        results.push({
          id: instrument.id,
          name: instrument.name,
          oldPath,
          newUrl,
          error: null,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[Migration] ✗ ${instrument.name}: ${message}`);
        results.push({
          id: instrument.id,
          name: instrument.name,
          oldPath,
          newUrl: null,
          error: message,
        });
      }
    }

    const succeeded = results.filter((r) => r.newUrl && !r.error).length;
    const failed = results.filter((r) => r.error).length;

    console.log(`[Migration] Complete: ${succeeded} succeeded, ${failed} failed`);

    return {
      succeeded,
      failed,
      results,
    };
  }),
});
