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

## Phase 31: Fix Prompt Length Overflow Issue
- [x] Refactor intensity/refinement to use system message pattern instead of concatenation
- [x] Update MiniMax generation to use system message for guidance
- [x] Update regenerate to pass refinement as system guidance, not append to prompt
- [x] Verify prompt stays under 1000 chars even with multiple refinements
- [x] All tests passing (82 tests), TypeScript clean

## Phase 32: Fix MiniMax API Incompatibility
- [x] Refactor promptTemplates to use brief prefixes instead of system parameter
- [x] Update startMusicGeneration to remove system parameter, use prefixed prompt
- [x] Update routers.ts to build prefixed prompts
- [x] Update tests
- [x] All tests passing (80 tests), TypeScript clean

## Phase 33: Favorite Button & Delete Confirmation
- [x] Add isFavorited column to musicGenerations table in schema
- [x] Create toggleFavorite mutation in routers.ts
- [x] Add strawberry favorite button to GenerationCard (faded outline → full red)
- [x] Add delete confirmation modal with "Are you sure?" dialog
- [x] Write tests for toggleFavorite and delete confirmation
- [x] All tests passing (84 tests), TypeScript clean

## Phase 34: Fix Deployment Failure (Credit Interruption)
- [x] Identified missing isFavorited column on Railway database
- [x] Applied migration to add isFavorited column
- [x] Verified toggleFavorite mutation is registered
- [x] Ready to redeploy to Railway

## Future Feature: Visual Brief Generator
- [ ] After a song is generated (status = complete), auto-generate a "Visual Brief" document using the Music + Visual Stickiness Master Formula (Chapter 9 of Music Prompt Bible)
- [ ] Visual Brief should include: camera direction cues (rises/falls with melody), lighting sync notes (pulse on beat, spotlight on hook), avatar emotion notes (facial expressions matching vocal charge), venue-specific atmosphere notes, and Zeigarnik tension/release moment notes
- [ ] Display Visual Brief as a collapsible panel below the audio player on completed generation cards
- [ ] Add "Copy Visual Brief" button so users can paste it directly into Runway Gen-4.5 or the Cinématique builder
- [ ] Future: Feed Layer 2/3/4 cues from the Visual Brief into Unreal Engine Niagara particles, Lumen lighting, and MetaHuman animations for real-time reactive venues
- [ ] Future: "Enable Music + Visual Stickiness Formula" toggle in Generate UI that auto-builds combined prompt for music gen and passes visual cues to Runway/Cinématique builder
- [ ] Future: 5-layer condensed stickiness form for casual users (Melodic Shape, Rhythmic Energy, Hook Design, Cognitive Tension, Vocal & Mix Clarity)

## Future Feature: Fusion Recipe Library UI

- [ ] Add "Fusion Recipes" inspiration drawer/panel to Generate page — browsable list of all 47 fusions from Chapter 10, organized by tier (Safe/Medium/Experimental/Global/Wildcard), with one-click "Use This" button that pre-fills the prompt field
- [x] Add "Surprise Me 🎲" button to Generate page — randomly picks a fusion from the 47-fusion library, pre-fills the prompt field with the fusion's prompt core, and sets intensity to Balanced. Wired to Generate.tsx with handleSurpriseMe callback and purple dashed UI box. 24 vitest tests passing for fusion library (getRandomFusion, generateRandomWildcard, findFusionByName, tier distribution, prompt length validation, etc.). 108 total tests passing.
- [ ] Add "Smart Refinement" toggle to Generate page — off by default; when enabled, appends the General Safety Net negative prompt from Chapter 11 to the generation request
- [ ] Add advanced negative prompt field for power users — free-text input + clickable chip suggestions (muddy mix, harsh clipping, generic production, etc.) visible when Smart Refinement is toggled on

## Phase 35: AI Lyrics Generator (Writer's Bible Integration)
- [x] Create server/lyricsGenerator.ts — Writer's Bible system prompt + 5-Layer Writer's Formula builder
- [x] Add `lyrics.generate` tRPC procedure (protectedProcedure, invokeLLM with system prompt)
- [x] Add `lyrics.saveDraft`, `lyrics.myDrafts`, `lyrics.getDraft`, `lyrics.deleteDraft`, `lyrics.getOptions` procedures
- [x] Add `lyricsDrafts` table to schema (userId, title, fusion, mood, topic, perspective, hookSeed, structure, writingTeam, generatedLyrics, stickinessAnalysis, createdAt)
- [x] Run migration for lyricsDrafts table
- [x] Build LyricsGenerator.tsx page with 5-Layer Writer's Formula form (Fusion, Mood/Feeling, Topic/Theme, Perspective, Hook Seed)
- [x] Add Writing Team selector (Hook Master, Story Weaver, Poet Visionary, Tone Shifter, Polish Editor)
- [x] Add Structure selector (8 templates: Standard Pop, Verse-Chorus-Bridge, AABA, Electronic/Dance, Folk/Narrative, Jazz/Soul, Ballad, Through-Composed)
- [x] Add "Generate Lyrics" button with loading state and displayed result
- [x] Add "Use in Generate" button — pre-fills lyrics field on Generate page via sessionStorage
- [x] Add "Save Draft" button — saves to lyricsDrafts table with title dialog
- [x] Add Saved Drafts panel showing previous lyrics with load/delete and preview
- [x] Add Stickiness Analysis panel below generated lyrics
- [x] Add Writer's Tips sidebar card
- [x] Register /lyrics route in App.tsx and add Lyrics nav link to AppLayout
- [x] Write Vitest tests for lyricsGenerator helper (128 total tests passing)
- [x] All tests passing

## Phase 36: Style Reference Audio (MiniMax 2.6 Direct API)
- [x] Migrated server/musicGeneration.ts from Replicate to MiniMax Music 2.6 direct API
- [x] Added MINIMAX_API_KEY secret and tested connection
- [x] Added referenceAudioUrl column to music_generations table and ran migration
- [x] Updated musicGeneration.generate tRPC procedure to accept optional referenceAudioUrl
- [x] Built Style Reference Audio upload panel on Generate page (pink dashed card, file picker, filename preview, remove button)
- [x] Wired upload through tracks.getUploadUrl mutation to S3
- [x] Updated Generate page header to reflect MiniMax Music 2.6
- [x] Updated musicGeneration.test.ts with reference audio tests (130 tests passing)
- [x] All tests passing

## Phase 37: Voice Reference Audio
- [x] Add voiceReferenceUrl parameter to MiniMax startMusicGeneration (refer_voice for vocal style)
- [x] Add voiceReferenceUrl column to music_generations table and run migration
- [x] Update musicGeneration.generate tRPC procedure to accept optional voiceReferenceUrl
- [x] Build Voice Reference Audio upload panel on Generate page (teal/cyan color scheme, separate from Style Reference)
- [x] Wire upload through tracks.getUploadUrl mutation to S3
- [x] Write Vitest tests for voice reference parameter
- [x] All tests passing

## Phase 38: Studio Mode (Four Cinematic Themes)
- [x] Generate four cinematic studio header images (Forest Studio, Cozy Den, Producer's Workshop, Rock Room)
- [x] Upload all four header images to CDN via manus-upload-file --webdev
- [x] Add studioTheme column to users table and run migration
- [x] Add studio.getPreferences and studio.setTheme tRPC procedures
- [x] Build Studio.tsx — three-panel layout (slim left sidebar / large central canvas / contextual right panel)
- [x] Wire all four header images as selectable theme options in Studio header (Theme Picker Modal)
- [x] Add Studio sidebar with tool navigation (Generate, Lyrics, Fusions, Writer's Bible)
- [x] Embed GeneratePage and LyricsGeneratorPage as tabbed tools in Studio central canvas
- [x] Add right context panel (Pro Tips, Recent Generations, Quick Fusions, Premium upsell)
- [x] Add /studio route to App.tsx (full-screen, outside AppLayout)
- [x] Add "Enter Studio" button to Home page hero and AppLayout nav (desktop + mobile)
- [x] Storage proxy registered for /manus-storage/* paths
- [x] All 130 tests passing

## Phase 39: Fusion Recipes Drawer
- [x] Build FusionRecipesDrawer component — slide-in drawer with all 47 fusions organized by tier
- [x] Add tier tabs (Safe Harbor, Medium Blend, Experimental, Global Fusion, Wildcard)
- [x] Each fusion card shows name, why-it-works, prompt preview, and "Use This" button
- [x] Add "Browse Fusions" button to Generate page form (alongside Surprise Me)
- [x] Wire "Use This" to close drawer and set prompt field (direct callback or sessionStorage for cross-page)
- [x] FusionRecipesDrawer also accessible from Studio sidebar

## Phase 40: Studio & Home Polish (User Feedback Round)
- [x] Home hero: remove/reduce dark overlay so photo reads clearly (from-black/75 → from-black/55)
- [x] Home hero: fix Enter Studio button layout so it sits diagonal to Start Creating on desktop (two-row flex)
- [x] Studio: remove dark overlay on all four themes; deepened base bg colors to compensate
- [x] Studio Forest theme: added raspberry/rose accent touches to Fusions button and sidebar
- [x] Studio Producer's Workshop: dialed down to deep indigo (from bright violet)
- [x] Studio: removed top-right redundant context toggle button (Change Theme only in top-right)
- [x] Studio mobile: right panel converted to bottom sheet with drag handle, backdrop, and visible X close
- [x] Studio mobile: sidebar hidden on mobile, replaced with bottom toolbar (Generate/Lyrics/Fusions/Tips/Theme)
- [x] Studio: injected dark CSS variables so all shadcn Cards/Inputs render in dark mode
- [x] Studio: central canvas pb-16 on mobile to clear bottom toolbar
- [x] All 130 tests passing

## Phase 41: Fix Song Generation Failure
- [x] Identified root cause: MiniMax API v2 changed response format — audio URL now at data.audio (synchronous), status is numeric (2=Success), no task_id returned
- [x] Fixed MiniMaxMusicResponse type to include new data wrapper with audio string and numeric status
- [x] Fixed startMusicGeneration to detect synchronous completion and return SYNC:<url> sentinel
- [x] Fixed pollMusicGeneration to handle SYNC: sentinel (skip polling) and new numeric status codes
- [x] Updated musicGeneration.test.ts mock to use SYNC: format
- [x] All 130 tests passing

## Phase 42: Fix Persistent Generation Failure (Still Failing After Phase 41)
- [x] Root cause: MINIMAX_API_KEY was never set in Railway environment (only in Manus secrets)
- [x] User added MINIMAX_API_KEY to Railway environment variables
- [x] Key updated in Manus secrets system as well
- [x] Confirmed full pipeline works: MiniMax generates, audio downloads, S3 upload succeeds
- [x] All 130 tests passing

## Phase 43: Visual Brief Generator
- [x] Added visualBrief column (TEXT, nullable) to music_generations table and ran migration
- [x] Built server/visualBriefGenerator.ts — LLM helper using Chapter 9 Music+Visual Stickiness Formula with JSON schema response_format
- [x] Wired auto-generation into both background tasks (generate + refine) after audio upload (non-blocking)
- [x] Extended updateMusicGenerationStatus to accept visualBrief field
- [x] Added visualBrief: null to both createMusicGeneration insert calls
- [x] Built VisualBriefPanel.tsx — collapsible dark panel with Camera, Lighting, Color Palette, Emotion Arc, Scene, Director's Note, Pacing badge
- [x] Added Copy Brief button (formats all sections for Runway/Kling/Sora export)
- [x] Added VisualBriefPanel to GenerationCard in Generate page (auto-shows when visualBrief is present)
- [x] 8 Vitest tests for visualBriefGenerator (all passing)
- [x] 138 total tests passing (up from 130)

## Phase 44: UX Polish — Lyrics Editor, Preamble Strip, Premium Gating
- [x] Added stripAIPreamble() to lyricsGenerator.ts — strips conversational preamble by finding first section marker [Verse/Chorus/Bridge etc.] or prose leading lines
- [x] Applied stripAIPreamble to lyrics extraction in generateLyrics() — all downstream uses (display, save draft, carryover) get clean lyrics
- [x] Added inline Edit mode to LyricsGenerator output panel — Pencil button toggles to Textarea with Save/Cancel controls
- [x] handleCopyToGenerate now also sets prefill_prompt (fusion) and prefill_title (hookSeed or topic) in sessionStorage
- [x] Generate.tsx useEffect reads prefill_prompt and prefill_title on mount alongside prefill_lyrics
- [x] Style Reference Audio panel hidden for free users (monthlyUsage?.isPremium guard)
- [x] Voice Reference Audio panel hidden for free users (monthlyUsage?.isPremium guard)
- [x] Surprise Me and Browse Fusions buttons remain visible for all users
- [x] VisualBriefPanel gated behind isPremium in GenerationCard — hidden on Generate page for free users
- [x] isPremium passed from monthlyUsage to GenerationCard at call site
- [x] 138 tests passing (all passing)

## Phase 45: Share Links for All Visibility Levels
- [x] Share button now shows for all visibility levels in MyRiffs (removed public-only guard)
- [x] Added access control to tracks.getById: private = owner only, inner-circle = logged-in followers, public = anyone
- [x] TrackPage shows graceful access denied message with appropriate icon and CTA based on visibility level
- [x] 138 tests passing

## Phase 46: Riff on This Mode
- [x] Riff button added to GenerationCard in Generate.tsx (purple ghost button)
- [x] Pre-fills Generate form with variation prompt (same energy, different mood) + Riff on: title via sessionStorage
- [x] Clears lyrics field for fresh creative direction
- [x] 138 tests passing

## Phase 47: My Style Library (Premium)
- [x] Added style_library table to schema and ran migration
- [x] Added DB helpers: getStyleLibraryByUserId, saveStyleToLibrary, deleteStyleFromLibrary, incrementStyleUsage, updateStyleLibraryEntry
- [x] Added styleLibraryRouter with list, save, delete, use, update procedures wired into appRouter
- [x] Built StyleLibrary.tsx page with saved styles grid, stats bar, Use/Riff/Edit/Delete actions
- [x] Save to Library button on generation cards (Premium only, amber BookMarked icon)
- [x] Save to Library dialog shows style name input and prompt preview
- [x] Style Library link added to AppLayout user dropdown (amber BookMarked icon)
- [x] /style-library route added to App.tsx
- [x] 138 tests passing

## Phase 48 — Inner Circle Bug Fix + Preview Links + Style Library + Premium UX + Pricing

- [x] Fix Inner Circle share link bug — getTrackWithCreator had hardcoded visibility="public" filter
- [x] One-time preview link (3-play limit) for Private/Inner Circle tracks — DB table, toggle UI, preview landing page with Follow CTA
- [x] Move Style Library to Studio sidebar as dedicated "My Styles" tab (remove from AppLayout dropdown)
- [x] Lock Riff Mode and Visual Brief with upgrade prompts for free users (visible but locked)
- [x] Update Pricing page with clean tier breakdown listing all Premium features

## Phase 49 — Follow Confirmation, Generation Counter, Studio Title Edit

- [x] Follow confirmation flow on PreviewPage — after following creator, redirect to creator profile with welcome message
- [x] Generation counter on Generate page — "X of 5 used this month" badge near Generate button (free users)
- [x] Song title editing inside Studio — inline edit without leaving Studio

## Backlog — Analytics (revisit in broader context)
- [ ] Preview link play analytics — "2 of 3 plays used" indicator on MyRiffs card per link
- [ ] Broader creator analytics dashboard — plays, follows, shares, generation usage over time

## Phase 50 — My Riffs Polish & Preview Link UX

- [x] Inline title editing on My Riffs track cards (click-to-rename, parity with Studio)
- [x] Preview link play status badge on My Riffs cards ("🔗 2/3 plays used")
- [x] Post-OAuth redirect for unauthenticated preview followers (getLoginUrl now accepts returnPath, OAuth callback parses and honors it)

## Backlog — Infrastructure Independence (non-urgent, plan when ready)

Current stack is stable and fully functional on Railway. The following items reduce dependency on
Manus-managed services so the site can run entirely independently long-term.

- [ ] **OAuth migration (HIGH)** — Replace Manus OAuth (OAUTH_SERVER_URL) with a standard provider
      (Google, GitHub, or Auth0). Users currently cannot log in if Manus OAuth goes away.
      Code is already abstracted in server/_core/oauth.ts — swap the SDK calls.

- [ ] **File storage migration (MEDIUM)** — Move S3 file storage from BUILT_IN_FORGE_API to
      Cloudflare R2 (recommended: free egress, S3-compatible API, no code rewrite needed).
      Affects: audio uploads, cover art, generated images. Existing files would need a one-time
      migration. Update server/storage.ts with new endpoint + credentials.

- [ ] **LLM API migration (LOWER)** — Replace BUILT_IN_FORGE_API LLM calls with a direct
      OpenAI (or equivalent) API key. The invokeLLM helper in server/_core/llm.ts is already
      abstracted — just swap the endpoint and key. Affects: prompt generation, lyrics assist,
      visual brief generation.

- [ ] **Owner notifications migration (LOWER)** — notifyOwner() uses BUILT_IN_FORGE_API.
      Can be replaced with a simple email (SendGrid/Resend) or webhook when LLM is migrated.

- [ ] **TiDB Cloud — confirm direct ownership** — The DATABASE_URL credentials are root-level
      TiDB Cloud credentials. Confirm the TiDB Cloud account is accessible independently of
      Manus (log in at tidbcloud.com) so the database is never at risk.

## Phase 51 — Style Library Save Button

- [x] Add "Save to Style Library" button on generation cards in Studio/Generate page

## Phase 52 — Studio Layout Fixes

- [x] Remove "Rock Room" title text and descriptor from Studio header
- [x] Remove "Change" button from Studio header top-right (Theme button in sidebar is sufficient)
- [x] Convert Context side panel to a dropdown/collapsible (closed by default)
- [x] Fix triple scrollbar issue — Studio should fill viewport height without nested scroll containers
- [x] Fix empty space at bottom of Studio page
- [x] Move Save Style button to a visible position on all screen sizes (not hidden off-screen on laptop)

## Phase 55: Mobile Horizontal Overflow Fix
- [x] Fix horizontal overflow on Android — generation cards too wide causing left/right scroll
- [x] Add overflow-x-hidden to Studio canvas scroll container
- [x] Add w-full max-w-full overflow-x-hidden to GeneratePage root container
- [x] Add w-full overflow-hidden to GenerationCard, form Card, and Recent Generations Card
- [x] Add w-full max-w-full to motion.div wrapper in Studio

## Phase 56: Dark Theme Polish Pass

- [x] Upload page: mood tags and visibility tags are white — replace with gradient/brand colors
- [x] Friends page: friend names are too dark to read — brighten text to foreground color
- [ ] Friends page: ghost accounts still present from initial setup — investigate and purge (deferred)
- [x] About page: Our Vision body text too faint — make bolder/brighter
- [x] About page: Contact Us section too bright white — tone down to soft plum/card surface
- [x] About page: "You Can Ring Our Bell" heading nearly invisible — fix contrast
- [x] Pricing page: membership status bar and enhanced tags too white — replace with purple + thin gold outline
- [x] Studio: add a Home button so users can navigate back to the main app

## Phase 57: Share Playlist Feature

- [ ] Add playlist_shares table to schema (token, playlist_id, created_by, expires_at nullable)
- [ ] Add DB helpers: createPlaylistShare, getPlaylistShareByToken, revokePlaylistShare
- [ ] Add tRPC procedures: playlists.createShare, playlists.revokeShare, playlists.getShared
- [ ] Add Share button to Playlists page with link display and revoke option
- [ ] Build /playlist/shared/:token page — followers/friends only access gate
- [ ] Add access denied state for non-followers with follow CTA

## Phase 58: Playlist Share UI

- [ ] Add share button to PlaylistCard on Playlists page
- [ ] Build share link copy dialog with beautiful preview
- [ ] Create /shared/playlists/:token page with card preview design
- [ ] Add access control — followers/friends only with follow gate
- [ ] Test share flow end-to-end

## Phase 59: Shared Link Landing Page Redesign (Release Page)

- [x] Add `showLyricsOnShare` and `allowRiffsOnShare` boolean columns to both `tracks` and `playlists` tables (default true)
- [x] Run schema migration for new columns
- [x] Add DB helpers: updateTrackShareSettings, updatePlaylistShareSettings
- [x] Add tRPC procedures: tracks.updateShareSettings, playlists.updateShareSettings
- [ ] Build creator controls panel in My Riffs track cards — small toggle UI for lyrics/riffs visibility
- [ ] Build creator controls panel in Playlists page — small toggle UI for lyrics/riffs visibility
- [x] Redesign SharedPlaylistPage to match release page aesthetic (large centered card, prominent cover art, elegant player)
- [ ] Redesign TrackPage (individual track share link) to match release page aesthetic
- [x] Add "More from [Creator]" section to SharedPlaylistPage — show creator's other playlists/tracks as funnel
- [x] Add "More from [Creator]" section to TrackPage — show creator's other tracks as funnel
- [ ] Implement conditional lyrics display on shared pages based on `showLyricsOnShare` toggle
- [ ] Implement conditional riff button on shared pages based on `allowRiffsOnShare` toggle
- [ ] Test end-to-end: creator controls → shared page respects settings


## Phase 60: Audio Editing Tools - 3-Band EQ & Trimming

- [x] Implement 3-band EQ tool (bass/mid/treble sliders, real-time Web Audio processing)
- [x] Build EQ UI component with waveform display and frequency visualization
- [x] Add tRPC procedures for EQ processing and export
- [ ] Implement audio trimming tool (drag handles on waveform, fade in/out)
- [ ] Build trimming UI component with timeline scrubber
- [ ] Add tRPC procedures for trimming and export
- [x] Integrate both tools into track editor page
- [x] Test end-to-end: upload track → apply EQ → trim → export (EQ complete, 158 tests passing)


## Bug Fix: Playlist Share Links Not Working

- [x] Add visibility enum field to playlists table (private/inner-circle/public, default private)
- [x] Run schema migration to add visibility column
- [x] Update updatePlaylist DB helper to include visibility field
- [x] Add visibility field to playlists.update tRPC procedure
- [x] Add visibility check to playlists.getShared procedure (enforce access rules)
- [x] Add visibility toggle UI to Playlists page edit dialog
- [x] All 158 tests passing


## Phase 61: Vocal Nuances Bible v2 Integration

- [ ] Update vocal generation system prompt with Vocal Nuances Bible content (genre profiles, emotional expression, imperfection guidance)
- [ ] Add 8 core vocal archetypes as presets (Intimate Bedroom, Raw Emotional, Soulful Belter, Gritty Rock, Confident Modern Pop, Lo-fi Whisper, Powerful Anthem, Storyteller Folk)
- [ ] Implement negative prompt master list with automatic inclusion (overly polished, sterile, robotic, perfect pitch, heavy autotune, etc.)
- [ ] Add vocal archetype selector to Generate page UI (dropdown or fusion-style cards)
- [ ] Create negative prompt toggles for fine-tuning (polished, autotune, breath sounds, etc.)
- [ ] Test vocal generation with new presets and compare quality to previous system
- [ ] Build vocal preset library page for creators to browse, listen, and customize
- [ ] Document MiniMax 2.6 prompting tips in internal wiki for future reference


## Bug: Audio Reference Feature Not Working

- [ ] Audio reference uploads successfully but MiniMax API ignores it
- [ ] Generated tracks don't match uploaded reference audio at all
- [ ] Investigate MiniMax API field requirements (refer_music, refer_voice, refer_instrumental)
- [ ] Check if reference audio URLs need specific format or validation
- [ ] Verify S3 URLs are accessible to MiniMax API
- [ ] Review MiniMax API response for error messages about references
- [ ] Test with MiniMax documentation examples
- [ ] Validate audio reference feature end-to-end


## Phase 47: Vocal Spectrum Slider Controls (Premium Feature)
- [x] Add vocalSpectrumValue column (0-100) to music_generations table and run migration
- [x] Create server/vocalSpectrumMapper.ts — maps each vocal archetype to spectrum endpoints (e.g., "Powerful Anthem" = "Smooth Soaring ← → Gritty Belting")
- [x] Update musicGeneration.generate tRPC procedure to accept optional vocalSpectrumValue (0-100)
- [x] Build Vocal Spectrum Slider UI on Generate page (below Vocal Character preset select)
- [x] Slider shows endpoint labels dynamically based on selected preset
- [x] Wire slider value to backend in generate mutation
- [x] Update startMusicGeneration to include spectrum guidance in prompt (e.g., "Smooth soaring tone" at 0, "Gritty belting tone" at 100)
- [x] Write Vitest tests for vocalSpectrumMapper and spectrum integration
- [x] Test with all 8 vocal archetypes to verify spectrum guidance is applied correctly
- [x] All tests passing


## Phase 48: Debug Vocal Gender Selector Not Sending Value
- [x] Add frontend console.log to capture vocalGender state before mutation
- [x] Add backend logging to see what vocalGender value is received
- [x] Deploy to production and test through full pipeline
- [x] Verify vocal gender selector is updating state correctly
- [x] Confirm vocalGender is being sent in mutation payload
- [x] Fix any issues preventing gender selection from working


## Phase 49: Branded Open Graph (OG) Preview Cards
- [x] Create OG image generation endpoint with sharp library
- [x] Design OG image template with deep plum background, strawberry icon, and text layout
- [x] Implement dynamic OG meta tags for track share pages
- [x] Add fallback OG image for homepage and non-track pages
- [x] Test OG previews on Twitter, Facebook, Discord, Slack, and messaging apps
- [x] Verify text rendering and color contrast across platforms
- [x] Fix font rendering issues (switch to system fonts)
- [x] Add strawberry icon in top-left corner like Suno's group icon
- [x] Increase text size and contrast for platform preview compatibility
- [x] Re-test on Signal, X, Facebook Messenger after fixes
- [x] Implement low-tech strawberry emoji solution in OG meta tags
- [x] Add strawberry emoji to og:title, og:description, and og:site_name

## Phase 50: Improved OG Preview Implementation (Grok's Approach)
- [x] Replace complex image generation with album art URLs (Spotify-style)
- [x] Add og:type="music.song" for music-native platform formatting
- [x] Add music-specific metadata tags (music:duration, music:album, music:musician)
- [x] Add Twitter/X card tags for better X compatibility
- [x] Include image dimensions (og:image:width, og:image:height)
- [x] Format duration in description (e.g., "3:45")
- [x] Update vite.ts to pass coverArtUrl and duration to OG tag generator
- [x] Write comprehensive Vitest tests for OG tag generation (9 tests, all passing)
- [x] All 206 tests passing

## Phase 51: Fix Production OG Tag Injection (Critical Bug)
- [x] Identified root cause: production uses serveStatic() which bypasses OG tag injection
- [x] Development uses setupVite() which injects OG tags (works correctly)
- [x] Added OG tag injection middleware to serveStatic() function
- [x] Middleware reads track data, generates OG tags, and injects into HTML before sending
- [x] Tested on dev server: track-specific OG tags now appear in raw HTML
- [x] All 206 tests passing
- [ ] Deploy to production and test with Facebook Sharing Debugger
- [ ] Verify og:url, og:type, music:duration all appear in crawler response

## Phase 52: Cover Art Dimension Inference System
- [x] Build Dimension Inference Engine (15-dimension framework: 5 Energy, 5 Emotion, 5 Culture)
- [x] Create tRPC router with inferDimensionsForTrack and getDimensions procedures
- [x] Write 35 comprehensive Vitest tests for dimension inference
- [x] Wire auto-inference into track publish flow (call inferDimensionsForTrack when track is published)
- [x] Write tests for auto-inference on track publish (8 tests, all passing)
- [x] Apply database migration to add coverArtDimensions and musicGenerationId columns
- [x] Update MINIMAX_API_KEY with fresh account credentials
- [x] Deploy changes via checkpoint
- [x] Manual end-to-end testing: generate music → publish track → verify dimensions stored in DB
- [x] Display synthesis fingerprint in track details (shows what system inferred)
- [x] Add track navigation from Discover to track detail page (CoverArtDimensionsPanel now accessible)
- [ ] (Optional) Build refinement slider UI for users to fine-tune dimensions

## Phase 53: Fix CoverArtDimensionsPanel Text Contrast
- [x] Improved text readability in CoverArtDimensionsPanel component
- [x] Changed dimension names from text-muted-foreground to text-gray-900 for dark, readable text
- [x] Changed dimension values from text-foreground to text-gray-900 for consistent visibility
- [x] Updated synthesis fingerprint preview and footer text to text-gray-700
- [x] Darkened confidence score percentages from text-gray-600 to text-gray-900
- [x] **CRITICAL FIX**: Removed semi-transparent white overlay (`bg-white/60`) from synthesis fingerprint box
- [x] Changed to solid opaque white background (`bg-white`) and solid border (`border-purple-200`)
- [x] Updated synthesis fingerprint text to `text-gray-900` for maximum contrast
- [x] All text now clearly visible against white and light pink/purple backgrounds
- [x] Verified improvements on dev server with live track page


## Backlog — CoverArtDimensionsPanel Visibility Issue (Deferred)
- [ ] Investigate persistent text visibility issue in CoverArtDimensionsPanel despite contrast fixes
- [ ] Check for additional CSS layers, inherited opacity, or theme-related issues
- [ ] May require deeper DOM inspection or browser DevTools debugging
- [ ] Deferred until full token credits available for thorough investigation

## Phase 54: Stem Splitter Feature (In Progress)
- [x] Research StemSplit API vs self-hosted Spleeter vs LALAL.AI
- [x] Evaluate cost/benefit of adding stem separation to Studio
- [x] Set up StemSplit API key (STEMSPLIT_API_KEY)
- [x] Create database schema for stem_splits table with 5 stem columns
- [x] Build StemSplit API client (server/stemsplit/client.ts) with startStemSplit and getStemSplitStatus
- [x] Implement database helpers (server/stemsplit/db.ts) with full CRUD operations
- [x] Write comprehensive vitest tests for database helpers (15 tests passing)
- [x] Add StemSplit webhook signing secret (STEMSPLIT_WEBHOOK_SECRET)
- [x] Implement webhook signature verification with HMAC-SHA256
- [x] Build webhook handler (server/stemsplit/webhook.ts) for completion notifications
- [x] Integrate webhook route at /api/stemsplit/webhook in Express server
- [x] Write comprehensive webhook handler tests (7 tests passing)
- [x] Build tRPC procedures for stem splitting (startStemSplit, getStemSplitStatus, getStemSplits, getTrackStemSplit)
- [x] Design simple UI flow: "Split into Stems" button with progress animation
- [x] Implement mini-mixer UI (mute/solo, basic volume controls, volume sliders, download buttons)
- [x] Create StemMixer component with play/pause, mute, solo, volume, and download controls
- [x] Integrate StemMixer into StemSplitButton with expandable dropdown
- [x] Add "Split Stems" button to Generate page next to refinement controls
- [x] Write 27 comprehensive vitest tests for StemMixer component
- [ ] Add as optional/premium feature to avoid overwhelming core experience
- [ ] Consider using isolated vocal stem as reference for music cover feature


## Phase 70: Dedicated Stems Studio Page

- [x] Add `is_split` boolean flag to music_generations table (default false)
- [x] Run migration to add is_split column
- [x] Create `client/src/pages/StemsStudio.tsx` — full-screen page with theme inheritance
- [x] Implement theme inheritance: fetch user's studioTheme and apply colors/backgrounds
- [x] Build Master Mix player (all stems combined, play/pause, volume, progress)
- [x] Build 5-stem grid layout (Vocals, Drums, Bass, Other, Piano) with individual controls
- [x] Add individual stem controls: play/pause, volume slider, mute/solo, download button
- [ ] Implement "Download All as ZIP" functionality with proper file naming
- [x] Build Past Splits sidebar (collapsible, shows history with dates and track names)
- [ ] Add click-to-load functionality for past splits (load stems into main view)
- [x] Add placeholder containers for future Remix and Stem Pack features
- [x] Add "🚪 Back to Generate" button with door icon
- [ ] Update Generate page to show "✓ Already Split" badge on generations with is_split=true
- [x] Update StemSplitButton to set is_split=true when split completes
- [x] Add route `/stems/:generationId` to App.tsx
- [x] Wire "View Stems" button from Generate page to navigate to StemsStudio
- [ ] Test theme inheritance across all four Studio themes (Forest, Cozy Den, Workshop, Rock Room)
- [ ] Test end-to-end: generate → split → navigate to StemsStudio → verify theme matches
- [ ] All tests passing


## Phase 71: Fix StemSplitButton and Add Track Detail Page

### UI Fixes
- [x] Fix StemSplitButton text truncation — expand button width or use icon-only on small screens
- [x] Query isSplit flag from database on Generate page load to persist "View Stems" button across refreshes
- [x] Add tRPC procedure to fetch musicGeneration by ID with isSplit flag
- [x] Update StemSplitButton to check database isSplit status on mount

### Track Detail Page
- [x] Create `client/src/pages/TrackDetail.tsx` page showing:
  - Full track title and metadata
  - Full lyrics display
  - Music Style Prompt details
  - Playback controls (player from right column)
  - Stems section (if isSplit=true, show StemsStudio-like view)
  - Edit/Re-generate/Publish buttons
  - Share button
- [x] Add route `/track-detail/:generationId` to App.tsx
- [x] Make track title in Generate page clickable → navigate to `/track-detail/:generationId`
- [x] Make track title in right column card clickable → navigate to `/track-detail/:generationId`

### My Stems Sidebar
- [x] Add "My Stems" button to left sidebar (after "My Styles")
- [ ] Create `client/src/pages/MyStemsSidebar.tsx` or modal showing:
  - List of all past splits with dates
  - Track title and thumbnail
  - Quick play button
  - Click to navigate to Stems Studio page
- [ ] Add route `/my-stems` to App.tsx
- [ ] Add tRPC procedure to fetch all musicGenerations where isSplit=true for current user

### Testing
- [ ] Test StemSplitButton persistence after page refresh
- [ ] Test all three access points: right column button, sidebar, track detail
- [ ] Test theme inheritance on Track Detail page
- [ ] Verify isSplit flag updates correctly after split completes


## Phase 72: Download All as ZIP Feature

- [x] Install jszip dependency
- [x] Create `client/src/lib/downloadUtils.ts` with downloadAllStems function
- [x] Add Download All button to Stems Studio page
- [x] Implement handleDownloadAll to bundle all 5 stems into ZIP
- [x] Add proper error handling and toast notifications
- [x] Test ZIP download functionality


## Phase 73: Critical Bug Fixes - CORS and ZIP Download

- [x] Identified CORS issue blocking stem file downloads from Cloudflare R2
- [x] Created server-side ZIP download endpoint at `/api/stems/download-zip`
- [x] Implemented server-side stem fetching to bypass CORS restrictions
- [x] Updated downloadUtils.ts to use server endpoint instead of client-side fetch
- [x] Updated StemsStudio.tsx to call new downloadAllStems with generationId
- [x] Added proper authentication and authorization checks to ZIP endpoint
- [x] Fixed TypeScript errors in stemsplit router and server core
- [ ] Test ZIP download with actual stem files
- [ ] Verify ZIP contains all 5 stems with correct filenames
- [ ] Test on deployed version at strawberryriff.com


## Phase 74: Fix StemSplitButton Dropdown Menu Issue

- [x] Identified issue: Button not updating to "View Stems" after split completes
- [x] Root cause: Component not invalidating generation query after split completes
- [x] Solution: Added `utils.musicGeneration.getById.invalidate()` after split completes
- [x] This forces React Query to re-fetch generation data with updated isSplit flag
- [ ] Test: Generate track → Split stems → Verify button changes to "View Stems" immediately
- [ ] Test: Verify green checkmark appears without page refresh


## Phase 75: StemsStudio Redesign with Waveforms & Retention

- [x] Install wavesurfer.js library
- [x] Redesign StemsStudio layout to match StemSplit design
- [x] Add waveform visualization for Master Mix
- [x] Add individual waveform visualizations for each stem
- [x] Implement timeline scrubbing with proper playback control
- [x] Add volume control for each stem
- [x] Add individual download button for each stem
- [x] Add 30-day retention notice with countdown
- [x] Calculate expiration date from createdAt timestamp
- [x] Show days remaining until automatic deletion
- [ ] Build My Stems Browser with expiration badges
- [ ] Add click-to-load functionality for past splits
- [ ] Test waveform rendering on different stem types
- [ ] Test retention notice displays correctly


## Phase 76: My Stems Browser Implementation

- [x] Create tRPC procedure `getPastSplits` to fetch all past splits for current user
- [x] Build MyStemsBrowser page component with list layout
- [x] Add expiration countdown badges (green/yellow/red based on days remaining)
- [x] Display track title, date, duration, and expiration info
- [x] Add click-to-navigate to Stems Studio page for each split
- [x] Add back button to return to Studio
- [x] Add empty state with link to Generate page
- [x] Add route `/my-stems` to App.tsx
- [ ] Test MyStemsBrowser displays all past splits correctly
- [ ] Test expiration badges show correct countdown
- [ ] Test navigation to Stems Studio page works
- [ ] Test back button returns to Studio

## Custom Mix Export (Isolated Path - v2)

- [x] Install ffmpeg-static and @types/fluent-ffmpeg npm packages
- [x] Create server/mixer/ directory with isolated mixer.ts utility (no imports from stemsplit/)
- [x] Create server/routers/mixer.ts with exportCustomMix procedure (read-only stem URL access)
- [x] Register mixer router in main routers.ts as trpc.mixer.*
- [x] Add custom mix export UI to StemsStudio page (volume sliders per stem + Export button)
- [x] Test custom mix export end-to-end without affecting stem splitting

## Phase 77: StemsStudio UX Polish

- [x] Redesign StemMixer component with dark color-coded per-stem cards (Vocals=pink, Drums=orange, Bass=cyan, Other=green, Piano=purple)
- [x] Add play/pause toggle icon wired to WaveSurfer play/pause events in StemsStudio
- [x] Retry button for failed/stuck stem split jobs (calls startStemSplit again)
- [x] Fix webhook handler tests to match real StemSplit API payload format (job.completed/job.failed)
- [x] Fix webhook STEMSPLIT_WEBHOOK_SECRET to be read lazily (fixes test isolation)
- [x] All webhook handler tests passing (7 tests)

## Phase 78: StemsStudio Bug Fixes

- [x] Replace FFmpeg-based custom mix export with client-side Web Audio API mixing (no system binary needed on Railway)
- [x] Fix missing "Instrumentals" stem in StemMixer (otherUrl field now labeled "Instrumental" in mixer)
- [x] Add WaveSurfer loading skeleton/spinner so Chrome users see feedback during long initialization
- [x] Fix db.test.ts to use generationId instead of trackId (schema field name mismatch)
- [x] Rewrite premium.test.ts as integration tests using real DB (mock approach was incompatible with module caching)
- [x] Fix stemsplit router test to use toMatchObject (startStemSplit now returns extra fields)
- [x] Fix minimax.credentials.test.ts to skip gracefully when API unreachable in sandbox
- [x] All 317 tests passing across 25 test files

## Phase 79: StemsStudio Full 6-Stem Mixer + Lazy Loading + MP3 Export

- [x] Change StemSplit API outputType from FOUR_STEMS to SIX_STEMS (new splits include Piano + Guitar)
- [x] Add guitarUrl column to stem_splits DB schema and run migration
- [x] Update webhook handler, DB helpers, stemsplit router, and audio proxy to handle guitarUrl
- [x] Fix stems array in StemsStudio to correctly show all 6 stems (Vocals, Instrumental, Drums, Bass, Piano, Guitar)
- [x] Update StemMixer props type to include guitarUrl and show Guitar stem (amber color)
- [x] Implement lazy WaveSurfer loading — load waveforms one at a time (staggered queue)
- [x] Add MP3 export option using lamejs (pure-JS encoder, 192kbps) alongside existing WAV download
- [x] Export WAV + Export MP3 buttons side by side in StemMixer footer
- [x] All 317 tests passing (25 test files)

## Phase 80: StemsStudio Polish — Colored Waveforms, More Cowbell, Save to My Riffs

- [x] Color-tint each WaveSurfer waveform to match its stem color (already wired via waveformColor per stem in StemsStudio)
- [x] Add "More Cowbell" 🔔 easter egg button on Drums row in StemMixer — boosts Drums to 150%, bouncing bell icon, SNL-inspired toast
- [x] Add "Save to My Riffs" button in StemMixer — renders mix client-side, uploads WAV to S3, creates track record
- [x] Backend: saveMixToRiffs tRPC procedure in mixer router (accepts base64 WAV, storagePut, createTrack)
- [x] Save button shows loading state, success state ("Saved! View in My Riffs →"), and navigates to /my-riffs on click
- [x] Update mixer.test.ts to test saveMixToRiffs (6 tests covering validation, S3 upload, track creation, isolation)
- [x] All 317 tests passing (25 test files)

## Phase 81: StemsStudio — Guitar Restore, My Stems Page, Save Title Field

- [x] Guitar stem confirmed present in StemMixer (amber, 🎸) — shows for SIX_STEMS splits; old FOUR_STEMS splits need re-split
- [x] Wire My Stems panel into Studio.tsx replacing "coming soon" placeholder (MyStemsPanel component)
- [x] MyStemsPanel shows all split-ready tracks with Open Studio button, expiry badge, and duration
- [x] Add custom mix title text field above Save to My Riffs button in StemMixer
- [x] Title field pre-filled with "[Track Title] (Custom Mix)", editable before saving
- [x] All 317 tests passing (25 test files)

## Phase 82: Search/Filter + Cover Art Auto-Copy

- [x] Add title search input to My Stems panel (filters split-ready tracks by title, client-side)
- [x] Add sort options to My Stems panel (newest first / oldest first / A-Z)
- [x] Add title search input to Generate page Recent Generations panel (client-side filter)
- [x] Add status filter to Generate page (All / Complete / Generating / Failed)
- [x] Auto-copy original track coverArtUrl when saving custom mix to My Riffs via saveMixToRiffs
- [x] All 317 tests passing (25 test files)

## Phase 83: My Stems Server-Side Search, Blend Metadata, Expiry Warnings

- [x] Add server-side `search` parameter to `getPastSplits` tRPC procedure (SQL LIKE filter on title)
- [x] Update getMusicGenerationsByUserId in db.ts to accept optional search string
- [x] Update MyStemsPanel to use server-side search with 300ms debounce + isFetching spinner
- [x] Add `blendDescription` optional field to `saveMixToRiffs` input schema
- [x] Update `saveMixToRiffs` to store blend description in track.description field
- [x] Update StemMixer to build blend description string from active stems + volumes (e.g. "Vocals 80%, Drums 150% 🔔, Bass 100%")
- [x] Add label and name fields to getActiveStemEntries return type
- [x] Add expiry warning badge to My Stems panel cards (yellow "Xd left" for ≤7 days, red "Expired" for expired)
- [x] All 317 tests passing (25 test files)

## Phase 84: Lyrics Page Topic/Theme Field Limit Increase

- [x] Increase Topic/Theme maxLength from 500 to 1500 characters in LyricsGenerator.tsx
- [x] Add character counter helper text below the Topic/Theme field
- [x] Check and update server-side Zod validation for the topic field if needed

## Phase 85: Rewrite Mode, Blend Description in My Riffs, Studio Edit Fix

- [x] Add Rewrite Mode toggle to Lyrics page (dedicated system prompt: preserve spirit, elevate craft)
- [x] Display blend description as badge/subtitle on custom mix cards in My Riffs
- [x] Fix Studio generate panel edit button conflict — replace card click navigation with explicit pencil icon

## Phase 86: Stems Studio — Option B Plum-Indigo Bridge Theme
- [x] Replace slate background/border/text classes in StemsStudio.tsx with plum-indigo palette

## Phase 87: Stems Studio Polish + Lyrics Gradient + Save-First Framing
- [x] Add violet-to-pink accent strip under Stems Studio header
- [x] Apply plum-indigo gradient to Lyrics Generator page
- [x] Add empty-state waveform illustration to Stems Studio no-data card
- [x] Replace download warning banner with save-first framing on Save button + 7-day toast nudge

## Phase 88: Expanded Mood Tags + Generate Publish Dialog
- [x] Create shared/moodTags.ts with ~40 tags across 5 categories
- [x] Update Upload page to use shared MOOD_TAGS constant
- [x] Add mood tag picker to Generate publish dialog
- [x] Verify Discover filter and My Riffs edit dialog work with expanded tags

## Phase 89: Creator-First Features — Language, Track Detail, Analytics
- [x] Discover: update "Vibe:" → "Your vibe:", "Play All" → "Play My Mix" / "Play All Riffs", "Clear" → "Reset my mix", tag-click shortcut on track cards
- [x] Track detail page: add mood tag pills, creator catalog "More from [Creator]" section, "Explore this vibe in Discover →" secondary link
- [x] My Riffs: add "Your Creative Identity" section with top mood tags used across creator's tracks

## Phase 90: Discover & My Riffs Polish
- [x] Increase "Your vibe:" label font size on Discover to match "Search By" heading
- [x] Add jump-to anchor button at top of My Riffs page for Creative Identity panel
- [x] Fix Creative Identity tag font color (too light/unreadable)

## Phase 91: Platform Experience Bible Alignment
- [x] Save Platform Experience Bible as references/platform-experience-bible.md
- [x] Generate form: warm placeholder text ("What is this song carrying?" alongside example)
- [x] Stems Studio: design revelation moment — beat of stillness + waveform animation before controls appear
- [x] Landing page: replace "Everything You Need" with warmer copy
- [x] Landing page: move a Sonic Soulprint near the hero section
- [x] Landing page: fill or remove the empty section
- [ ] About page: rewrite "We're building the future of music creation" subtitle in Riff voice

## Phase 92: Platform Experience Bible — Final Alignment
- [x] About page: rewrite subtitle and key copy in Riff voice
- [x] Stems Studio: update "Stem split complete" toast to match Reveal Stems language
- [x] Lyrics page: tint form cards to bg-[#160b1e]/80 with border-[#2e1a4a] to match Stems Studio

## Phase 93: Landing Page Philosophy Section
- [x] Fill empty landing page section with Riff Philosophy statement (Platform Experience Bible voice)
- [ ] Plan opt-in creator vibe fingerprint: off by default, 8+ tagged tracks threshold, toggle in profile settings

## Phase 94: Waiting Lines & Shareable Quote Card
- [x] Generate page: replace polling indicator with rotating 3-word Riff-voice lines (max 3 words each)
- [x] Landing page: add shareable quote card button to Riff Philosophy section

## Phase 95

- [x] Read and save Storytelling Bible as references/storytelling-bible.md
- [x] Fix Lyrics page post-generation UX: auto-scroll to lyrics output after generation completes
- [x] Fix Lyrics page: reset generate button state after generation (button should not remain highlighted)
- [x] Add rotating 3-word waiting lines to Lyrics Generator generation wait state
- [x] Add "Your track is ready" pulse/glow animation to new track cards on Generate page
- [x] Implement canvas-based share card image for Riff Philosophy quote button (dark plum bg, gradient text, wordmark)
- [x] Investigate and fix X/Twitter OG image issue for track share links

## Phase 95b: Style Bleed Fixes

- [x] Fix Lyrics Generator: remove seeding example phrases ("dusty boots on gravel") from system prompt
- [x] Fix Lyrics Generator: add genre-anchor instruction to every generation (GENRE ANCHOR: stay in {fusion} world)
- [x] Fix Lyrics Generator: add style-bleed failure mode (do NOT default to country/folk/Americana imagery)
- [x] Fix Audio Generator: change default vocal archetype from "intimate-bedroom" to "no preference"
- [x] Fix Audio Generator: add [genre-strict] tag to all prompts via buildPromptWithIntensity
- [x] Add "No preference — let the genre decide" option to Vocal Character selector

## Phase 96 — Strawberry Studios Bridge

- [x] Add STUDIOS_BRIDGE_URL and STUDIOS_BRIDGE_KEY secrets to Riff project
- [x] Add studiosBridgeUrl and studiosBridgeKey to env.ts
- [x] Create server/frequency/router.ts with getDefault, synthesize, save, generateCoverArt, ping procedures
- [x] Wire frequencyRouter into appRouter in routers.ts
- [x] Build FrequencyModal component (8-screen diagnostic flow: existing, q1-q4, reflection, vocabulary, name)
- [x] Add "Your Frequency" entry point to Studio sidebar
- [x] Import and render FrequencyModal in Studio.tsx
- [x] Add Generate Cover Art button to Upload page (calls frequency.generateCoverArt)
- [x] Save Listening Bible (all 9 chapters) as project reference
- [x] Save riff_studios_bridge_handoff.md as project reference
- [x] Validate bridge endpoints — /api/bridge/ping confirmed live, 3 bridge tests passing
## Phase 97 — Stem Splitter Fixes + FrequencyModal Fix
- [x] FrequencyModal: replace render-phase setTimeout with useEffect hooks for all screen transitions
- [x] FrequencyModal: add 3s safety timeout fallback to prevent blank states
- [x] Fix stem splitter toast error: SIX_STEMS requires quality BEST (was BALANCED) — updated server/stemsplit/client.ts
- [x] Fix stem splitter button layout: changed grid-cols-4 to grid-cols-2 in Generate.tsx, added wrapperClassName prop to StemSplitButton, added w-full to button inside wrapper

## Phase 98 — Studios Bridge Fix + Cover Art in Publish Dialog
- [x] Verified Studios bridge synthesize now returns correct arcType enum (erosive_revelatory etc.)
- [x] No defensive mapping needed on Riff side — Studios fix is live
- [x] Added coverArtUrl field to publish mutation input schema
- [x] Wired cover art generation into Generate → Publish dialog (with frequency badge, generate/regenerate, preview)
