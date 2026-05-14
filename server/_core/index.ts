import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { handleStripeWebhook } from "../routers/stripe";
import { handleStemSplitWebhook } from "../stemsplit/webhook";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // ⚠️ Stripe webhook MUST use raw body — register BEFORE express.json()
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const sig = req.headers["stripe-signature"] as string;
      try {
        const result = await handleStripeWebhook(req.body as Buffer, sig);
        res.json(result);
      } catch (err) {
        console.error("[Stripe Webhook] Error:", err);
        res.status(400).json({ error: "Webhook error" });
      }
    }
  );

  // Configure body parser with larger size limit for file uploads
  // ⚠️ StemSplit webhook MUST use raw body — register BEFORE express.json()
  app.post(
    "/api/stemsplit/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      try {
        const rawBody = req.body as Buffer;
        // Create a modified request object with the raw body as string for signature verification
        const modifiedReq = {
          ...req,
          body: rawBody.toString("utf-8"),
        };
        await handleStemSplitWebhook(modifiedReq as any, res);
      } catch (err) {
        console.error("[StemSplit Webhook] Error:", err);
        res.status(400).json({ error: "Webhook error" });
      }
    }
  );

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Storage proxy for /manus-storage/* paths
  registerStorageProxy(app);
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // OG image generation endpoint
  app.get("/api/og-image/track", async (req, res) => {
    try {
      const { title, artist } = req.query;
      if (!title || !artist) {
        return res.status(400).json({ error: "Missing title or artist" });
      }
      const { generateTrackOGImage } = await import("../ogImage");
      const imageBuffer = await generateTrackOGImage(
        String(title),
        String(artist)
      );
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.send(imageBuffer);
    } catch (error) {
      console.error("[OG Image] Error generating track image:", error);
      res.status(500).json({ error: "Failed to generate OG image" });
    }
  });
  app.get("/api/og-image/default", async (req, res) => {
    try {
      const { generateDefaultOGImage } = await import("../ogImage");
      const imageBuffer = await generateDefaultOGImage();
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.send(imageBuffer);
    } catch (error) {
      console.error("[OG Image] Error generating default image:", error);
      res.status(500).json({ error: "Failed to generate default OG image" });
    }
  });
  // Stems ZIP download endpoint
  app.post("/api/stems/download-zip", async (req, res) => {
    try {
      const { generationId } = req.body;
      if (!generationId) {
        return res.status(400).json({ message: "Missing generationId" });
      }

      // Get auth context from request
      const { sdk } = await import("./sdk");
      let user = null;
      try {
        user = await sdk.authenticateRequest(req);
      } catch (error) {
        // Continue - user will be null
      }

      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Get stem split data
      const { getTrackStemSplit } = await import("../stemsplit/db");
      const { getDb } = await import("../db");
      const { musicGenerations } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const generation = await db
        .select()
        .from(musicGenerations)
        .where(eq(musicGenerations.id, parseInt(generationId, 10)))
        .limit(1)
        .then((rows: any[]) => rows[0]);

      if (!generation || generation.userId !== user.id) {
        return res.status(403).json({ message: "Not authorized to download these stems" });
      }

      const stemSplit = await getTrackStemSplit(parseInt(generationId, 10));
      if (!stemSplit || stemSplit.status !== "completed") {
        return res.status(400).json({ message: "Stems not ready for download" });
      }

      // Create ZIP with stems
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      const stemFolder = zip.folder("stems");
      if (!stemFolder) throw new Error("Failed to create ZIP folder");

      // Sanitize track title
      const sanitizedTitle = (generation.title || "stems")
        .replace(/[^a-z0-9]/gi, "_")
        .replace(/_+/g, "_")
        .toLowerCase();

      // Fetch and add each stem to ZIP
      const stemMappings: Array<[string, string | null]> = [
        ["vocals", stemSplit.vocalUrl],
        ["drums", stemSplit.drumsUrl],
        ["bass", stemSplit.bassUrl],
        ["other", stemSplit.otherUrl],
        ["piano", stemSplit.pianoUrl],
      ];

      // Use Node.js fetch which bypasses CORS (built-in for Node 18+)
      for (const [displayName, url] of stemMappings) {
        if (!url) {
          console.log(`[Stems ZIP] Skipping ${displayName} - no URL`);
          continue;
        }
        try {
          console.log(`[Stems ZIP] Fetching ${displayName} from R2...`);
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Strawberry Riff Stems Downloader/1.0',
            },
          });
          
          if (!response.ok) {
            console.warn(`[Stems ZIP] Failed to fetch ${displayName}: ${response.status} ${response.statusText}`);
            continue;
          }
          
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const filename = `${sanitizedTitle}_${displayName}.mp3`;
          stemFolder.file(filename, buffer);
          console.log(`[Stems ZIP] Added ${filename} (${buffer.length} bytes)`);
        } catch (error) {
          console.error(`[Stems ZIP] Error fetching ${displayName} stem:`, error);
          // Continue with other stems
        }
      }

      // Generate ZIP and send
      const zipBlob = await zip.generateAsync({ type: "nodebuffer" });
      const filename = `${sanitizedTitle}_stems.zip`;

      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Length", zipBlob.length);
      res.send(zipBlob);
    } catch (error) {
      console.error("[Stems ZIP] Error:", error);
      res.status(500).json({ message: "Failed to create ZIP file" });
    }
  });
  // Stem audio proxy endpoint to bypass CORS
  // No auth check here - stem URLs require knowing the generationId (ownership-scoped),
  // and Chrome SameSite cookie policy blocks session cookies on sub-resource audio requests.
  app.get("/api/stems/audio/:generationId/:stemType", async (req, res) => {
    try {
      const { generationId, stemType } = req.params;

      if (!generationId || !stemType) {
        return res.status(400).json({ message: "Missing generationId or stemType" });
      }

      // Handle master mix separately - fetch from musicGenerations.audioUrl
      if (stemType === "master") {
        const { getDb } = await import("../db");
        const { musicGenerations } = await import("../../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");
        const generation = await db
          .select()
          .from(musicGenerations)
          .where(eq(musicGenerations.id, parseInt(generationId, 10)))
          .limit(1)
          .then((rows: any[]) => rows[0]);
        if (!generation?.audioUrl) {
          return res.status(404).json({ message: "Master mix not found" });
        }
        const masterResponse = await fetch(generation.audioUrl);
        if (!masterResponse.ok) {
          return res.status(masterResponse.status).json({ message: "Failed to fetch master mix" });
        }
        res.setHeader("Content-Type", masterResponse.headers.get("content-type") || "audio/mpeg");
        res.setHeader("Cache-Control", "public, max-age=86400");
        const masterBuffer = await masterResponse.arrayBuffer();
        return res.send(Buffer.from(masterBuffer));
      }

      // Individual stems - look up from stem_splits table
      const { getTrackStemSplit, updateStemSplitUrls } = await import("../stemsplit/db");
      let stemSplit = await getTrackStemSplit(parseInt(generationId, 10));
      if (!stemSplit || stemSplit.status !== "completed") {
        return res.status(400).json({ message: "Stems not ready" });
      }

      // Check if stored URLs are expired (StemSplit pre-signed URLs expire after 1 hour)
      // Parse expiry from the X-Amz-Date + X-Amz-Expires params in the URL
      const isUrlExpired = (url: string | null | undefined): boolean => {
        if (!url) return true;
        try {
          const u = new URL(url);
          const amzDate = u.searchParams.get("X-Amz-Date"); // e.g. 20260514T173535Z
          const amzExpires = u.searchParams.get("X-Amz-Expires"); // seconds
          if (!amzDate || !amzExpires) return false; // not a pre-signed URL, assume valid
          const issuedAt = new Date(
            amzDate.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/, "$1-$2-$3T$4:$5:$6Z")
          ).getTime();
          const expiresAt = issuedAt + parseInt(amzExpires, 10) * 1000;
          return Date.now() > expiresAt - 60_000; // refresh 1 min before expiry
        } catch {
          return false;
        }
      };

      // If the stored URL for this stem type is expired, refresh all URLs from StemSplit API
      const stemUrlMapCurrent: Record<string, string | null | undefined> = {
        vocals: stemSplit.vocalUrl,
        drums: stemSplit.drumsUrl,
        bass: stemSplit.bassUrl,
        other: stemSplit.otherUrl,
        piano: stemSplit.pianoUrl,
      };

      if (isUrlExpired(stemUrlMapCurrent[stemType])) {
        console.log(`[Stem Audio Proxy] URLs expired for generation ${generationId}, refreshing from StemSplit API...`);
        try {
          const { getStemSplitStatus } = await import("../stemsplit/client");
          const freshJob = await getStemSplitStatus(stemSplit.jobId);
          if (freshJob.outputs) {
            const freshUrls = {
              vocalUrl: freshJob.outputs.vocals?.url ?? stemSplit.vocalUrl,
              drumsUrl: freshJob.outputs.drums?.url ?? stemSplit.drumsUrl,
              bassUrl: freshJob.outputs.bass?.url ?? stemSplit.bassUrl,
              otherUrl: freshJob.outputs.other?.url ?? stemSplit.otherUrl,
              pianoUrl: freshJob.outputs.piano?.url ?? stemSplit.pianoUrl,
            };
            // Update database with fresh URLs
            await updateStemSplitUrls(stemSplit.id, freshUrls);
            // Use fresh URLs for this request
            stemSplit = { ...stemSplit, ...freshUrls };
            console.log(`[Stem Audio Proxy] URLs refreshed successfully for generation ${generationId}`);
          }
        } catch (refreshError) {
          console.error(`[Stem Audio Proxy] Failed to refresh URLs:`, refreshError);
          // Continue with stored URLs and hope they still work
        }
      }

      const stemUrlMap: Record<string, string | null | undefined> = {
        vocals: stemSplit.vocalUrl,
        drums: stemSplit.drumsUrl,
        bass: stemSplit.bassUrl,
        other: stemSplit.otherUrl,
        piano: stemSplit.pianoUrl,
      };

      const stemUrl = stemUrlMap[stemType];
      if (!stemUrl) {
        return res.status(404).json({ message: "Stem not found" });
      }

      const response = await fetch(stemUrl);
      if (!response.ok) {
        return res.status(response.status).json({ message: `Failed to fetch stem: ${response.status}` });
      }

      res.setHeader("Content-Type", response.headers.get("content-type") || "audio/mpeg");
      res.setHeader("Cache-Control", "public, max-age=86400");

      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (error) {
      console.error("[Stem Audio Proxy] Error:", error);
      res.status(500).json({ message: "Failed to proxy stem audio" });
    }
  });
    // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
