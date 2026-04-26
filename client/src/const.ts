export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
// Pass an optional returnPath (e.g. "/creator/alice?welcome=1") to redirect there after login.
export const getLoginUrl = (returnPath?: string) => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  // Encode origin + optional returnPath in state so the server can redirect after login
  const statePayload = returnPath
    ? btoa(JSON.stringify({ redirectUri, returnPath }))
    : btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", statePayload);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
