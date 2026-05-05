import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      
      // Inject dynamic OG tags for track shares
      const trackMatch = url.match(/\/track\/(\d+)/);
      if (trackMatch) {
        try {
          const trackId = parseInt(trackMatch[1]);
          const { getTrackById } = await import("../db");
          const track = await getTrackById(trackId);
          if (track) {
            const { generateTrackOGMetaTags } = await import("./ogMetaTags");
            const ogTags = generateTrackOGMetaTags(
              track.title,
              track.artist || "Unknown Artist",
              trackId,
              track.coverArtUrl || undefined,
              track.duration || undefined
            );
            template = template.replace("</head>", `${ogTags}</head>`);
          }
        } catch (error) {
          console.error("[OG Tags] Error injecting track OG tags:", error);
        }
      }
      
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  // Serve hashed assets (JS/CSS) with long-term caching
  app.use(express.static(distPath, {
    setHeaders: (res, filePath) => {
      // index.html must never be cached so browsers always fetch the latest entry point
      if (filePath.endsWith("index.html")) {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
      }
    },
  }));

  // Inject dynamic OG tags for track shares in production
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    const trackMatch = url.match(/\/track\/(\d+)/);
    
    if (trackMatch) {
      try {
        const trackId = parseInt(trackMatch[1]);
        const { getTrackById } = await import("../db");
        const track = await getTrackById(trackId);
        if (track) {
          const indexPath = path.resolve(distPath, "index.html");
          let html = await fs.promises.readFile(indexPath, "utf-8");
          
          const { generateTrackOGMetaTags } = await import("./ogMetaTags");
          const ogTags = generateTrackOGMetaTags(
            track.title,
            track.artist || "Unknown Artist",
            trackId,
            track.coverArtUrl || undefined,
            track.duration || undefined
          );
          
          // Replace default OG tags with track-specific ones
          html = html.replace(
            /(<meta property="og:[^"]*"[^>]*>\s*)*<meta property="og:title"/,
            ogTags.trim() + '\n    <meta property="og:title"'
          );
          
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
          res.setHeader("Pragma", "no-cache");
          res.setHeader("Expires", "0");
          res.setHeader('Content-Type', 'text/html');
          return res.send(html);
        }
      } catch (error) {
        console.error("[OG Tags] Error injecting track OG tags in production:", error);
        // Fall through to default behavior on error
      }
    }
    
    next();
  });

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
