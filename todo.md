# Strawberry Riff — Project TODO

## Phase 1: Foundation
- [x] Global theme (pink/purple gradient brand, Space Grotesk font, dark-capable)
- [x] App layout with persistent AppHeader and routing
- [x] Database schema: users, profiles, tracks, friends, playlists, playlist_tracks

## Phase 2: Backend API
- [x] tRPC router: profiles (get, upsert, uploadAvatar)
- [x] tRPC router: tracks (upload, list, getById, update, delete, like, unlike, myLikes, publicFeed, friendFeed)
- [x] tRPC router: friends (follow, unfollow, allUsers, following, followers, friendTracks)
- [x] tRPC router: playlists (create, update, delete, addTrack, removeTrack, list, getTracks)
- [x] S3 upload endpoint (base64 upload via storagePut)

## Phase 3: Auth & Profile
- [x] Sign in / Sign up via Manus OAuth
- [x] Creator profile setup flow (display name, bio, avatar upload)
- [x] AppHeader with nav, auth state, user avatar, mobile menu

## Phase 4: Upload
- [x] Audio upload page with drag-and-drop
- [x] Mood/genre tag selector
- [x] 3-tier visibility selector (private / inner-circle / public)
- [x] S3 file upload + DB metadata save

## Phase 5: Core Pages
- [x] My Riffs page (list, edit metadata, delete, toggle visibility)
- [x] Discover / Home feed (public tracks, browse)
- [x] Persistent audio player (bottom bar with play/pause, progress, volume)

## Phase 6: Social & Extra
- [x] Friends page (follow/unfollow, find people, friend tracks)
- [x] Playlists page (create, manage, add/remove tracks)
- [x] Pricing page (free vs premium tiers)
- [x] Easter egg concert ticket (animated strawberry characters, concert modal)
- [x] About page

## Phase 7: Polish & Tests
- [x] Vitest unit tests for all tRPC routers (35 tests passing)
- [x] Loading states, empty states, error handling throughout
- [x] Mobile responsive layout

## Phase 8: Vercel Styling Integration
- [x] Audit original Vercel app (strawberry-orpin-one.vercel.app)
- [x] Update global CSS — blush pink background, gradient utilities
- [x] Rebuild Home page — original copy, hero, features, testimonials, track cards, CTA
- [x] Rebuild Pricing page — feature comparison table, tipping section, FAQ, CTA
- [x] Rebuild About page — Our Vision, value pillars, Strawberry Jam Session characters, contact accordion
- [x] Update AppHeader — Sign In + Get Started buttons, correct nav order
- [x] Fix profiles.get returning null (not undefined) — resolves tRPC runtime error

## Bug Fixes
- [x] Upload page "failed to fetch" error — root cause: unauthenticated request; fixed CSS @import order; Google Fonts moved to index.html

## Phase 9: Public Discovery & Brand Characters
- [x] Make Discover feed publicly browsable without login — new /discover route, search + mood filter, guest CTA
- [x] Rebuild Easter egg concert ticket modal — trigger button on home page, animated strawberry audience
- [x] Add rotating Strawberry Band Members section — 5 characters (Jam, Melody, Bass, Riff, Chord), auto-rotate, desktop + mobile carousel

## Phase 10: Public Creator Profiles
- [x] Add `getUserByDisplayName` DB helper (case-insensitive lookup by displayName)
- [x] Add `creators.publicProfile` tRPC procedure (public, returns profile + public tracks + follower/following counts)
- [x] Build CreatorProfilePage UI at /creator/:username
- [x] Register /creator/:username route in App.tsx
- [x] Add follow/unfollow from creator page (authenticated users only)
- [x] Add Vitest tests for new creator procedure

## Phase 11: Stripe Subscription Integration
- [x] Add `stripeCustomerId`, `stripeSubscriptionId`, `isPremium`, `premiumSince` fields to users table
- [x] Add `setUserPremium` and `getUserByStripeCustomerId` DB helpers
- [x] Create `server/routers/stripe.ts` with `createCheckoutSession` and `status` procedures
- [x] Register Stripe webhook endpoint at `/api/stripe/webhook` (raw body, before json middleware)
- [x] Update Pricing page with live Upgrade button wired to Stripe checkout
- [x] Create `/premium/success` page for post-checkout landing
- [x] Add Vitest tests for Stripe procedures (44 total tests passing)

## Phase 12: Manage Subscription
- [x] Add `createPortalSession` tRPC procedure to stripe router (Stripe Customer Portal)
- [x] Add Premium status + "Manage Subscription" section to Profile page
- [x] Add Vitest tests for the new procedure

## Phase 13: Track Share Links & Share UX
- [x] Add `tracks.getById` tRPC procedure (public, returns single track + creator info)
- [x] Build `/track/:id` individual track page (player, title, artist, creator profile link)
- [x] Register `/track/:id` route in App.tsx
- [x] Add animated share button to track cards in Discover page
- [x] Add animated share button to track cards in CreatorProfile page
- [x] Add animated share button to track cards in My Riffs page (public tracks only)
- [x] On-brand toast: "Link copied — drop it somewhere good 🍓"
- [x] Move Premium subscription card to bottom of Profile Setup page

## Bug Fix: Stripe Checkout Popup Blocker
- [x] Replace `window.open(url, "_blank")` with `window.location.href = url` in Pricing page checkout mutation (popup blockers were silently blocking the Stripe redirect for some users)
- [x] Same fix applied to the Customer Portal mutation in ProfileSetup page

## Phase 14: Welcome Email, Premium Confirmation & Badge
- [x] Send welcome notification to new users on first sign-up (via notifyOwner + user-facing welcome)
- [x] Upgrade /premium/success page with warm confirmation message and next-step prompts
- [x] Add strawberry-themed premium badge (🍓) to creator names in Discover feed track cards
- [x] Add premium badge to Creator Profile page header
- [x] Add creatorIsPremium field to publicFeed tRPC response

## Phase 15: Home CTA Fixes & SVG Premium Badge
- [x] Replace emoji 🍓 premium badge with SVG icon component (cross-platform rendering)
- [x] Update Discover.tsx to use SVG StrawberryBadge
- [x] Update CreatorProfile.tsx to use SVG StrawberryBadge
- [x] Reroute "Join the Tribe" button on Home page to /pricing
- [x] Add "Discover" button to Home page CTA row

## Phase 16: Sign-In Explainer Modal
- [x] Create SignInExplainerModal component (explains manus.im redirect before it happens)
- [x] Wire modal to "Start Creating" CTA on Home page (logged-out state)
- [x] Wire modal to "Claim Your Sonic Space" CTA on Home page
- [x] Wire modal to nav "Sign In" and "Get Started" buttons in AppLayout

## Phase 17: Hero Section Visual Upgrade
- [x] Upload StrawberryRiffLogo4fixed.png to CDN
- [x] Redesign Home.tsx hero with full-width cinematic background image
- [x] Overlay tagline text on left side with natural negative space
- [x] Ensure hero looks great on mobile and desktop
- [x] Preserve all CTA buttons (Start Creating, Join the Tribe, Discover)

## Bug Fix: Ghost Account Prevention
- [x] Delete 138 null-name ghost accounts from database
- [x] Fix OAuth callback to only create user records when name AND email are present

## Bug Fix: Add Tracks to Playlists
- [x] Create reusable AddToPlaylistButton component (dropdown, shows user's playlists, check mark on add)
- [x] Add AddToPlaylistButton to My Riffs track cards
- [x] Add AddToPlaylistButton to Discover track cards
- [x] Add AddToPlaylistButton to TrackPage (individual track detail)
- [x] Add AddToPlaylistButton to CreatorProfile track cards
- [x] Write Vitest tests for playlists.addTrack, removeTrack, getTracks, list (55 total tests passing)

## Phase 18: Audio Player Queue, Shuffle & Repeat
- [x] Extend AudioPlayerContext with queue state, shuffle mode, repeat mode (off/one/all), next, previous
- [x] Update player bar UI with next/prev skip buttons, shuffle toggle, repeat toggle
- [x] Wire playlist play to load full playlist as queue (playing any track in a playlist loads the rest)
- [x] Auto-advance to next track when current track ends
- [x] Shuffle randomizes queue order; toggling off restores original order

## Phase 19: Friends Feed Queue
- [x] Wire Friends feed track play buttons to load all feed tracks as a queue
- [x] Playing any track in the Friends feed auto-advances through the rest of the feed

## Phase 20: Discover Mood Tag Filter & Shuffle
- [x] Add backend: filter discover tracks by selected mood tags, expose all available tags
- [x] Build tag cloud filter panel at top of Discover (multi-select, instant update)
- [x] Add shuffle button to randomize current results (filtered or unfiltered)
- [x] No popularity signals — results in random order by default

## Phase 21: Discover Play All & Saved Vibe Presets
- [x] Add Play All button to Discover that queues the full current view (filtered or shuffled)
- [x] Add vibe_presets table to schema and run migration
- [x] Backend: savePreset, listPresets, deletePreset procedures (protected)
- [x] UI: save current tag filter as a named vibe preset, load/delete presets from Discover

## Phase 22: Cover Art & Mood Tag Images
- [x] Add coverArtUrl field to playlists table and tracks table, run migration
- [x] Backend: uploadCoverArt procedure for playlists, update track upload/edit to accept coverArtUrl
- [x] Playlist cards: show cover art image, fallback to gradient; upload UI on hover/edit
- [x] Track cards: show cover art image, fallback to gradient
- [x] Player bar: show cover art thumbnail next to track title
- [x] Upload page: cover art upload field alongside audio upload

## Phase 23: Cover Art Consistency
- [x] TrackPage hero: show cover art image over gradient when available
- [x] Discover track cards: show cover art image over gradient when available
- [x] Friends feed thumbnail: show cover art image over gradient when available
- [x] MyRiffs Edit dialog: add cover art upload/replace field

## Phase 24: Cover Art Final Polish
- [x] CreatorProfile track cards: show cover art over gradient
- [x] Playlists: verify cover art upload is wired to uploadCoverArt for playlists
- [x] Now Playing glow: pulsing ring/glow on cover art thumbnail when track is active

## Phase 25: Generate Page - Polling & Publish to My Riffs
- [x] Add 5-second status polling on Generate page so status updates automatically from "generating" to "complete"
- [x] Add "Publish to My Riffs" button that appears when generation is complete
- [x] Backend: publishGeneration procedure that creates a track record from a completed music generation

## Phase 26: Generate Page - Re-generate Button
- [x] Add Re-generate button to completed and failed generation cards
- [x] Clicking it scrolls to and pre-fills the form with original title, prompt, lyrics, and duration

## Phase 27: Playlist Drag-to-Reorder
- [x] Install @dnd-kit/core and @dnd-kit/sortable
- [x] Add drag handles to playlist track rows
- [x] Optimistic reorder on drag end, persist new order to database via reorderTracks procedure

## Phase 28: MiniMax Music 2.5 Migration
- [x] Rewrite server/musicGeneration.ts to use MiniMax Music 2.5 via Replicate API (startMusicGeneration + pollMusicGeneration + fetchAudioBytes + validateMusicGenerationParams)
- [x] Add countGenerationsThisMonth helper to server/db.ts
- [x] Fix server/routers.ts: update imports, remove duration param, add monthly limit check (5 free/month, unlimited for premium), add monthlyUsage procedure
- [x] Update Generate.tsx: remove duration selector, add MonthlyUsageBanner with progress bar, update prompts for MiniMax style
- [x] Update musicGeneration.test.ts: mock startMusicGeneration/pollMusicGeneration, add tests for monthly limit and premium bypass
- [x] Update publish mutation description from ACE-Step to MiniMax Music 2.5
- [x] All 68 tests passing

## Phase 29: Generate Page Fixes
- [x] Add billing credit to Replicate account (402 error)
- [x] Add delete button to generation cards
- [x] Sanitize error messages — show user-friendly text, not raw API errors

## Phase 30: Prompt Templates & Refinement Controls
- [x] Add intensity levels (Subtle, Balanced, Aggressive) to server
- [x] Add refinement modifiers (More Aggressive, Less Busy, Different Vibe) to server
- [x] Update Generate.tsx with intensity selector dropdown
- [x] Add refinement buttons to generation cards
- [x] Write tests for prompt template logic
- [x] All tests passing (80 tests), TypeScript clean
