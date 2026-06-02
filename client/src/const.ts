export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
// Pass an optional returnPath (e.g. "/creator/alice?welcome=1") to redirect there after login.
//
// OAuth domain handoff:
// If VITE_OAUTH_CALLBACK_ORIGIN is set (e.g. https://strawriff-frnnwu2p.manus.space),
// the OAuth redirect URI uses that whitelisted origin instead of the current window origin.
// After login, the callback on that origin will redirect back to the current window origin
// via /api/oauth/token-handoff?token=<jwt>&returnPath=<path>.
export const getLoginUrl = (returnPath?: string) => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const callbackOriginOverride = import.meta.env.VITE_OAUTH_CALLBACK_ORIGIN;

  // Use override origin (whitelisted relay) if set, otherwise use current window origin
  const callbackOrigin = callbackOriginOverride || window.location.origin;
  const redirectUri = `${callbackOrigin}/api/oauth/callback`;

  // Encode state: include finalOrigin so the relay callback knows where to send the user
  const statePayload = btoa(JSON.stringify({
    redirectUri,
    returnPath: returnPath || "/",
    // If using a relay origin, tell the callback where to ultimately redirect the user
    finalOrigin: callbackOriginOverride ? window.location.origin : undefined,
  }));

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", statePayload);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
