export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// With Clerk, sign-in is handled by Clerk's hosted UI or embedded components.
// This function is kept for backward compatibility with components that still call it,
// but it now returns a no-op path — the actual sign-in is triggered by Clerk's
// <SignInButton> or openSignIn() from useClerk().
//
// Components should be updated to use Clerk's sign-in directly.
// For now, returning "#sign-in" as a safe no-op that won't navigate away.
export const getLoginUrl = (_returnPath?: string): string => {
  // This is a compatibility shim — Clerk sign-in is handled by the UI components
  return "#sign-in";
};
