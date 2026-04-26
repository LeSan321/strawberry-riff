import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { notifyOwner } from "./notification";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      // Reject bot/crawler hits: require at least a name or email to create a real account
      if (!userInfo.name && !userInfo.email) {
        console.warn("[OAuth] Blocked anonymous callback with no name or email (likely bot/crawler)");
        res.status(400).json({ error: "User identity could not be verified" });
        return;
      }

      const { isNew } = await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      // Fire a welcome notification to the owner when a brand-new user joins
      if (isNew) {
        const displayName = userInfo.name || "Someone";
        const email = userInfo.email ? ` (${userInfo.email})` : "";
        notifyOwner({
          title: "🍓 New Strawberry Riff member!",
          content: `${displayName}${email} just joined the community. Say hi!`,
        }).catch((err) => console.warn("[OAuth] Welcome notification failed:", err));
        console.log(`[OAuth] New user signed up: ${displayName}${email}`);
      }

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Parse returnPath from state if present (encoded as JSON { redirectUri, returnPath })
      let redirectTo = "/";
      try {
        const decoded = Buffer.from(state, "base64").toString("utf-8");
        // Try JSON format first (new format with returnPath)
        if (decoded.startsWith("{")) {
          const parsed = JSON.parse(decoded) as { redirectUri?: string; returnPath?: string };
          if (parsed.returnPath && parsed.returnPath.startsWith("/")) {
            redirectTo = parsed.returnPath;
          }
        }
        // Otherwise it's the legacy btoa(redirectUri) format — stay at "/"
      } catch {
        // Malformed state — fall back to home
      }

      res.redirect(302, redirectTo);
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
