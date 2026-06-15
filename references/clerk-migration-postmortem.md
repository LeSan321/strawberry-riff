# Clerk Migration & Cover Art Pipeline — Debugging Post-Mortem

**Date:** June 2026  
**Scope:** Strawberry Riff + Strawberry Studios (cross-service)  
**Duration:** Multiple sessions across several days  
**Outcome:** Full resolution — Frequency flow, cover art generation, and audio playback all working in production

---

## Overview

What appeared to be a simple API key swap (replacing Manus OAuth with Clerk) turned out to be a ten-layer distributed systems debugging exercise. This document records every issue discovered, its root cause, and the fix applied — so that future maintainers have a map if anything breaks again.

---

## Layer 1 — Clerk Migration Itself

**Symptom:** After switching from Manus OAuth to Clerk, users could not authenticate.

**Root cause:** Clerk requires two separate keys:
- `VITE_CLERK_PUBLISHABLE_KEY` — frontend (browser), must have `VITE_` prefix for Vite to expose it
- `CLERK_SECRET_KEY` — server-side only, no prefix

Both must be from the **same Clerk instance**. Mixing `pk_test_` with `sk_live_` (or vice versa) causes silent verification failures.

**Fix:** Ensure both keys are present in Railway environment variables for each service (Riff and Studios separately).

**Key lesson:** Clerk's publishable key is not optional on the server — `verifyToken()` requires it to validate the JWT audience. Without it, every token verification silently returns null.

---

## Layer 2 — Ghost User Accumulation

**Symptom:** Database had 20,700+ user records from the old Manus OAuth system.

**Root cause:** Every Manus OAuth login created a new user row. After the migration, these orphaned rows remained and caused confusion in user lookups.

**Fix:** Bulk-deleted rows where `openId` matched the old Manus OAuth pattern (non-Clerk format). Kept rows with Clerk-format `openId` (`user_` prefix).

**Key lesson:** Always audit the users table after an auth provider migration. Old provider IDs and new provider IDs have different formats — use that to safely identify and clean up orphaned records.

---

## Layer 3 — Cross-Service Token Forwarding

**Symptom:** Riff's server could authenticate users, but calls to Studios' bridge API returned 401/UNAUTHORIZED.

**Root cause:** Clerk tokens are issued per-domain. The browser sends a token to Riff's server, but when Riff's server makes a server-to-server call to Studios, it needs to forward that same Bearer token explicitly. The token does not travel automatically.

**Fix:** Added `authHeader` extraction to Riff's tRPC context (`server/_core/context.ts`). Every `protectedProcedure` now has access to `ctx.authHeader`. The frequency router extracts the raw Bearer token and passes it as the `Authorization` header on every Studios bridge call.

**Key lesson:** In a multi-service architecture, server-to-server calls require explicit token forwarding. Session cookies do not cross domains. Only Bearer tokens in the `Authorization` header work for cross-service auth.

**Pattern to follow:**
```ts
// In context.ts — capture the raw header
const authHeader = req.headers.authorization;

// In router — forward it to downstream services
const clerkToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : undefined;
const res = await fetch(`${STUDIOS_BRIDGE_URL}/api/bridge/...`, {
  headers: { Authorization: `Bearer ${clerkToken}` }
});
```

---

## Layer 4 — Missing `CLERK_PUBLISHABLE_KEY` on Studios (Without `VITE_` Prefix)

**Symptom:** Studios returned "Please login (10001)" for every request, even with a valid Clerk token.

**Root cause:** Studios' Railway environment had `VITE_CLERK_PUBLISHABLE_KEY` (for the frontend) but was missing `CLERK_PUBLISHABLE_KEY` (without the prefix) for the server-side `clerkMiddleware`. The middleware silently failed to initialize, `req.auth` was never populated, and every `getAuth(req).userId` returned null.

**Fix (Studios side):** Added `CLERK_PUBLISHABLE_KEY` (no `VITE_` prefix) to Studios' Railway environment variables.

**Key lesson:** Clerk requires the publishable key on the server too — not just the frontend. Railway environment variables are case-sensitive and prefix-sensitive. `VITE_CLERK_PUBLISHABLE_KEY` and `CLERK_PUBLISHABLE_KEY` are two different variables serving two different purposes.

---

## Layer 5 — Studios Bridge Routes Not Deployed

**Symptom:** Calls to `/api/bridge/frequency/default`, `/synthesize`, and `/save` returned the Studios SPA HTML page (React app's `index.html`) instead of JSON.

**Root cause:** The Express routes for these endpoints were not registered before the SPA catch-all route (`app.get('*', ...)`) in Studios' server. Any unmatched route fell through to the React app.

**Diagnosis method:** `curl -s https://strawberry-studios-production.up.railway.app/api/bridge/frequency/default` — if it returns HTML, the route doesn't exist or is ordered incorrectly.

**Fix (Studios side):** Registered the frequency bridge routes before the catch-all.

**Key lesson:** Always test bridge endpoints with `curl` before assuming they exist. A 200 response that returns HTML is just as broken as a 404 — it just fails silently in JSON-parsing code.

---

## Layer 6 — Field Name Mismatches (Synthesize Payload)

**Symptom:** Studios returned `400 — {"error":"Invalid input","details":{"fieldErrors":{"q1":["Invalid input: expected string, received undefined"]}}}`.

**Root cause:** Riff was sending `{ q1_sound_space, q2_light_color, q3_world_texture, q4_arc_time }` but Studios expected `{ q1, q2, q3, q4 }`.

**Fix:** One-line mapping in `server/frequency/router.ts`:
```ts
body: JSON.stringify({ q1: answers.q1_sound_space, q2: answers.q2_light_color, q3: answers.q3_world_texture, q4: answers.q4_arc_time })
```

**Key lesson:** When two services are developed independently, field naming conventions diverge. Always test the actual HTTP payload against the receiving service's schema before assuming the contract is correct.

---

## Layer 7 — Synthesize Response Shape Mismatch

**Symptom:** `TypeError: Cannot read properties of undefined (reading 'frequencyName')` after a successful synthesis.

**Root causes (multiple):**
1. Studios returns `suggestedName` not `frequencyName`
2. Studios returns vocabulary terms as objects `{ term: "...", instruction: "..." }` not plain strings
3. Studios returns `vocabularyJson` (a JSON-encoded string) in some responses, not a parsed object

**Fix:** Added a `flattenTerms()` helper that extracts `.term` from objects, and normalised the response to handle both `suggestedName` and `frequencyName`, and both `vocabulary` (object) and `vocabularyJson` (string).

**Key lesson:** Never assume the shape of a cross-service response. Log the raw response body on the server (`console.log(JSON.stringify(parsed))`) before trying to destructure it. Add null-coalescing and type guards for every field.

---

## Layer 8 — Save Sending JSON String Instead of Parsed Object

**Symptom:** Studios returned `400 — {"error":"Invalid input","details":{"fieldErrors":{"vocabulary":["Invalid input: expected record, received undefined"]}}}` on every save attempt.

**Root cause:** Riff was sending `vocabularyJson: JSON.stringify(vocabulary)` — a JSON-encoded string. Studios' save endpoint expects `vocabulary` as a parsed JavaScript object/record, not a string.

**Fix:** Parse `vocabularyJson` before sending, and use the key name `vocabulary`:
```ts
const vocabObj = typeof input.vocabularyJson === "string" 
  ? JSON.parse(input.vocabularyJson) 
  : input.vocabularyJson;
body: JSON.stringify({ ..., vocabulary: vocabObj })
```

**Key lesson:** When a service stores data as a JSON string (for database compatibility) and another service expects a parsed object, the serialization/deserialization boundary must be explicit. Never pass a JSON string where an object is expected.

---

## Layer 9 — Cloudflare Geo-Block (Turkey → United States)

**Symptom:** Cover art generation failed with a generic 500. Studios' logs showed Claude API calls returning 403.

**Root cause:** The Manus platform sandbox has its data center in Turkey. Anthropic's Claude API is US-based. Cloudflare's geo-blocking rules blocked outbound API calls from Turkey to Anthropic's US endpoints.

**Fix:** Moved all Claude API calls out of the Manus sandbox and onto Railway (US-based). Studios' `ANTHROPIC_API_KEY` was added to Railway environment variables. All LLM calls now run on Railway, not in the Manus sandbox.

**Key lesson:** The Manus sandbox is a development/testing environment, not a production runtime. API calls that work in a US-based environment may fail from the sandbox due to geo-restrictions. Always test production API integrations on the actual deployment platform (Railway), not just in the sandbox.

**Affected services:** Anthropic Claude, potentially other US-based APIs. If a new API integration works in the browser but fails on the server in the sandbox, geo-blocking is a likely cause.

---

## Layer 10 — Audio Player 401 Errors (Expired Presigned URLs)

**Symptom:** 60+ `401` errors in the browser console on `dnznrvs05pmza.cloudf...` URLs when trying to play tracks.

**Root cause:** When a track is generated, `storagePut()` returns a presigned CloudFront URL with an expiry (typically 1 hour). This URL was stored directly in the `tracks.audioUrl` database column. After the URL expired, the audio player tried to load it and received a 401.

**Fix:** Updated the audio player (`AudioPlayerContext.tsx`) to route all playback through the server-side storage proxy (`/manus-storage/{audioKey}`) instead of the stored presigned URL. The proxy generates a fresh presigned URL on every request.

```ts
// In PlayerTrack type — added audioKey
audioKey?: string;

// In loadAndPlay — use proxy URL when audioKey is available
const src = track.audioKey ? `/manus-storage/${track.audioKey}` : track.audioUrl;
audio.src = src;
```

**Key lesson:** Never store presigned URLs in the database as permanent references. Store the S3/storage key instead, and generate fresh URLs on demand via a proxy. Presigned URLs have a finite lifetime and will always eventually expire.

---

## Diagnostic Toolkit

When something breaks in the Riff ↔ Studios pipeline, use this checklist:

### 1. Check Railway Deploy Logs (not HTTP Logs)
The HTTP Logs tab shows proxy-level data (status codes, durations). The **Deploy Logs** tab shows application-level console output — this is where `[Auth]`, `[Frequency]`, and `[generateCoverArt]` log lines appear.

### 2. Test Bridge Endpoints with curl
```bash
# Test if a bridge route exists (should return JSON, not HTML)
curl -s https://strawberry-studios-production.up.railway.app/api/bridge/frequency/default \
  -H "Authorization: Bearer fake_token"
# Expected: {"error":"Invalid or expired token"}
# Bad: HTML page content (route doesn't exist)
```

### 3. Auth Diagnostic Log Lines
When auth is working, Railway logs show:
```
[Auth] Verifying token. secretKey prefix: sk_test_mHmF, tokenLen: 837
[Auth] Token verified OK. clerkUserId: user_3EbVWbR4l4YyhQHiMTO3vvvafF5
[Auth] User resolved: id=1 openId=user_3EbVWbR4l4YyhQHiMTO3vvvafF5
```
If you see `[Auth] Token verification failed:` — check that `CLERK_SECRET_KEY` and `VITE_CLERK_PUBLISHABLE_KEY` are both set on Railway and are from the same Clerk instance.

### 4. Check Clerk Key Consistency
Both Riff and Studios must use keys from the **same Clerk instance**:
- `sk_test_*` pairs with `pk_test_*`
- `sk_live_*` pairs with `pk_live_*`
- Mismatched prefixes = silent auth failure

### 5. Frequency Flow End-to-End Test
1. Open browser DevTools → Network tab
2. Go to Studio → click "Your Frequency"
3. Watch for: `frequency.getDefault` (200), `frequency.synthesize` (200, ~10s), `frequency.save` (200)
4. If any return 500, check Railway Deploy Logs for the `[Frequency]` log lines

---

## Environment Variables Reference

### Riff (Railway)
| Variable | Purpose | Notes |
|---|---|---|
| `CLERK_SECRET_KEY` | Server-side Clerk token verification | Must be `sk_test_*` or `sk_live_*` |
| `VITE_CLERK_PUBLISHABLE_KEY` | Frontend Clerk initialization | Must match secret key instance |
| `STUDIOS_BRIDGE_URL` | Base URL for Studios bridge calls | e.g. `https://strawberry-studios-production.up.railway.app` |
| `STUDIOS_BRIDGE_KEY` | Auth key for Studios bridge (if applicable) | |
| `ANTHROPIC_API_KEY` | Claude API for lyric generation | Must be set on Railway, not just sandbox |

### Studios (Railway)
| Variable | Purpose | Notes |
|---|---|---|
| `CLERK_SECRET_KEY` | Server-side Clerk token verification | Same key as Riff |
| `CLERK_PUBLISHABLE_KEY` | Server-side middleware (no `VITE_` prefix!) | Critical — missing this breaks all auth |
| `VITE_CLERK_PUBLISHABLE_KEY` | Frontend Clerk initialization | |
| `ANTHROPIC_API_KEY` | Claude for lyric phrase extraction + synthesis | Must be on Railway (geo-block in sandbox) |

---

## Key Architectural Principles Learned

1. **Bearer tokens, not cookies, for cross-service auth.** Cookies are domain-scoped. Bearer tokens in `Authorization` headers work across services.

2. **Log raw response bodies before parsing.** `console.log(JSON.stringify(rawBody))` on the server saves hours of guessing about response shapes.

3. **Test bridge endpoints with curl before writing client code.** A route that returns HTML is broken, even if it returns 200.

4. **Store storage keys, not presigned URLs.** Keys are permanent; presigned URLs expire.

5. **Railway is not the sandbox.** Geo-restrictions, environment variables, and cold starts all behave differently. Test on Railway for any production issue.

6. **Both Clerk keys are required everywhere.** The publishable key is needed server-side too — not just in the browser.

7. **Validate cross-service contracts with real payloads.** Field names, types, and nesting levels diverge when two teams build independently. Log and verify before assuming.
