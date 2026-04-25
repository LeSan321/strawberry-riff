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
