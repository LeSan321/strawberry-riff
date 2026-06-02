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

      // Parse state to extract returnPath and optional finalOrigin (for cross-domain relay)
      let returnPath = "/";
      let finalOrigin: string | undefined;
      try {
        const decoded = Buffer.from(state, "base64").toString("utf-8");
        if (decoded.startsWith("{")) {
          const parsed = JSON.parse(decoded) as { redirectUri?: string; returnPath?: string; finalOrigin?: string };
          if (parsed.returnPath && parsed.returnPath.startsWith("/")) {
            returnPath = parsed.returnPath;
          }
          // finalOrigin is set when this callback is acting as an OAuth relay for a different domain
          // (e.g. strawriff-frnnwu2p.manus.space relaying for strawberryriff.com)
          if (parsed.finalOrigin && parsed.finalOrigin.startsWith("https://")) {
            finalOrigin = parsed.finalOrigin;
          }
        }
        // Otherwise it's the legacy btoa(redirectUri) format — stay at "/"
      } catch {
        // Malformed state — fall back to home
      }

      if (finalOrigin) {
        // Cross-domain relay: redirect to the final origin's token-handoff endpoint
        // The session token is passed as a query param so the final domain can set its own cookie
        const handoffUrl = new URL(`${finalOrigin}/api/oauth/token-handoff`);
        handoffUrl.searchParams.set("token", sessionToken);
        handoffUrl.searchParams.set("returnPath", returnPath);
        console.log(`[OAuth] Cross-domain relay: redirecting to ${finalOrigin}`);
        res.redirect(302, handoffUrl.toString());
      } else {
        // Normal flow: set cookie on this domain and redirect
        const cookieOptions = getSessionCookieOptions(req);
        res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        res.redirect(302, returnPath);
      }
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
