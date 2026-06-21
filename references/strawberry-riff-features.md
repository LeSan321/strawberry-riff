# Strawberry Riff — Platform Features Reference

**Document purpose:** A comprehensive, plain-language inventory of every feature on the Strawberry Riff platform, written for use as training material for the Riff Assistant and as a reference for the soul.md synthesis process. Each feature is described in terms of what it does, who can use it, how it is accessed, and how it connects to other features.

**Last updated:** June 2026  
**Maintained by:** Riff / Manus

---

## Platform Philosophy (Context for All Features)

Strawberry Riff is not a streaming service, a social network, or a production tool in isolation. It is a **creative ecosystem** built on the belief that authentic expression — however unpolished, however AI-assisted — deserves a stage and a community. Every feature exists to serve one of three purposes: helping creators make something real, helping them share it on their own terms, and helping listeners find what they need.

Ownership is non-negotiable: everything a user uploads or generates belongs to them, permanently and completely. The platform is the stage, not the label.

---

## 1. Authentication and Identity

### Sign In / Sign Out
Users authenticate via **Manus OAuth**, a single-sign-on system that handles all credential management externally. There is no username/password form on Strawberry Riff itself. After signing in, a session cookie is issued and persists across visits. Sign-out clears the session immediately.

**Access:** Public (anyone can sign in). The sign-in button appears in the top navigation when no session is active.

### Profile Setup
After first sign-in, users are prompted to complete their profile. This includes:
- **Display name** — shown on track cards, creator profiles, and the Friends list
- **Bio** — a short free-text description of the creator
- **Avatar** — uploaded image, stored in S3 and served via CDN

Profile information is editable at any time. The avatar upload accepts standard image formats and is processed server-side before storage.

**Interaction with other features:** The display name and avatar appear on every track card, on the Creator Profile page, and in the Friends / Following lists. An incomplete profile (no avatar) shows an initial-based placeholder generated from the username.

---

## 2. Track Management

Tracks are the core unit of content on Strawberry Riff. A track is any audio file — a voice memo, a full produced song, an AI-generated piece, a demo, an experiment — combined with metadata that describes it.

### Upload
Users upload audio files directly from their device. The upload flow accepts MP3, WAV, and other common audio formats. During upload, users provide:
- **Title** — required
- **Mood tags** — optional free-text tags describing the emotional character of the track (e.g., "melancholic," "euphoric," "tense")
- **Cover art** — optional; can be uploaded manually or generated via the Visual Universe pipeline (see Section 9)
- **Visibility** — Private, Inner Circle, or Public (see Section 3)
- **Lyrics** — optional; stored and displayed on the track detail page when present

The upload page also accepts tracks that were generated via the Generate feature (see Section 6), which pre-populates the metadata fields.

**Interaction with other features:** Uploaded tracks appear in My Riffs, the Discover feed (if public), and the Friends feed (if inner-circle or public). They can be added to Playlists and shared via Preview Links.

### My Riffs
The personal track library. Shows all tracks owned by the signed-in user, regardless of visibility setting. Each track card displays the title, cover art, mood tags, play count, like count, and visibility badge. From My Riffs, users can:
- Play any track in the inline audio player
- Edit track metadata (title, mood tags, lyrics, visibility)
- Delete a track
- Generate or update cover art
- Access the EQ and Trim tools
- Create or manage Preview Links
- View share settings

**Interaction with other features:** My Riffs is the primary management surface for all tracks. Changes made here (visibility, metadata, cover art) propagate immediately to the Discover feed, Creator Profile, and any shared Playlists.

### Track Detail Page (TrackPage)
A dedicated public-facing page for each track, accessible at `/track/:id`. Displays:
- Cover art (full-width)
- Title, creator name, and avatar
- Mood tags
- Waveform visualization
- Audio player with play/pause, seek, and volume controls
- Like button
- Lyrics (if the creator has enabled "Show Lyrics on Share")
- Share button

The Track Detail page is the destination for all external links and Preview Links. It respects visibility settings: private tracks show an access-denied state to non-owners; inner-circle tracks are visible only to followers of the creator.

**Interaction with other features:** The Track Detail page is the landing destination from Discover, My Riffs, Creator Profile, Playlists, and Preview Links. It is also the page that generates the Open Graph image for social sharing (see Section 11).

### EQ (Equalizer)
A three-band equalizer (bass, mid, treble) accessible from the track detail view in My Riffs. Adjustments are stored as settings metadata (±12 dB per band) and applied client-side via the Web Audio API during playback. The EQ is non-destructive — it does not modify the original audio file.

**Access:** Track owners only.

### Trim
A trim tool that allows creators to set a start time, end time, fade-in duration, and fade-out duration for a track. Like the EQ, trim settings are stored as metadata and applied client-side during playback. The original file is preserved.

**Access:** Track owners only.

### Share Settings
Per-track toggles that control what is visible when the track is shared externally:
- **Show Lyrics on Share** — when enabled, lyrics appear on the Track Detail page for all visitors
- **Allow Riffs on Share** — controls whether other users can create variations (Riff Mode, see Section 7)

**Access:** Track owners only.

---

## 3. Visibility and Privacy

Every track and playlist on Strawberry Riff has one of three visibility levels. This is a core architectural principle, not a secondary feature.

| Level | Who Can See It | Feed Behavior |
|---|---|---|
| **Private** | Owner only | Never appears in any feed |
| **Inner Circle** | Owner + followers | Appears in the Friends feed for followers; chronological order preserved |
| **Public** | Everyone | Appears in the Discover feed; subject to shuffle and anti-dominance logic |

Visibility can be changed at any time from My Riffs. Bulk visibility updates are supported (change multiple tracks at once).

**Interaction with other features:** Visibility is the gating mechanism for the Discover feed, the Friends feed, and the Track Detail page access control. Preview Links (Section 10) provide a way to share private or inner-circle tracks with specific people without changing the visibility setting.

---

## 4. Discover Feed

The public discovery surface of the platform. Shows all public tracks from all creators, presented in a shuffled order to ensure no single creator dominates the experience.

### Feed Behavior
- **Default order:** Shuffled on every page load. There is no chronological default for the public feed.
- **Re-shuffle:** A "Re-shuffle" button allows users to request a new random ordering without reloading the page.
- **Anti-dominance cap (conditional):** Once the platform reaches 20 or more distinct public creators AND 200 or more public tracks, the feed automatically limits any single creator to a maximum of 3 tracks per page of 50 results. This cap is dormant below those thresholds and activates automatically when the platform grows into it. It is a display-diversity mechanism only — it does not limit how many tracks a creator can publish.
- **Page size:** 50 tracks per load (maximum 100).

### Filtering and Search
Users can filter the Discover feed by mood tag. A search bar allows filtering by title or creator name.

**Interaction with other features:** The Discover feed links to Track Detail pages. Track cards in Discover show the like button, play button, and a link to the creator's profile. Signed-in users can like tracks directly from the feed.

---

## 5. Friends and Social Layer

### Follow / Unfollow
Users can follow other creators. Following is one-directional (like Twitter/Instagram, not mutual like Facebook friends). Following a creator gives you access to their inner-circle tracks in the Friends feed.

### Friends Feed
A dedicated feed showing tracks from creators you follow. Inner-circle and public tracks from followed creators appear here in **chronological order** (newest first), preserving the creator's posting timeline for their audience.

### Creator Profile
A public-facing profile page for each creator, accessible at `/creators/:username`. Displays:
- Avatar, display name, bio
- Follower and following counts
- All public tracks from that creator (and inner-circle tracks if the viewer is a follower)
- Track cards with the same dark styling as the rest of the platform
- Follow / Unfollow button

Track cards on the Creator Profile are clickable and navigate to the Track Detail page.

**Interaction with other features:** The Creator Profile is linked from track cards throughout the platform (Discover, My Riffs, Friends feed). It is the primary way listeners discover more from a creator they like.

### Friends List
A browsable list of all users on the platform, showing who you follow and who follows you. From this list you can follow/unfollow directly.

---

## 6. Music Generation (Generate)

The AI music creation engine, powered by **MiniMax Music 2.6**. This is the primary tool for creating new tracks from scratch using AI.

### Core Parameters
Every generation requires:
- **Title** — the name of the track being created
- **Style Prompt** — a free-text description of the sonic character, mood, instrumentation, and feel. This is the most important creative input.
- **Lyrics** — the words to be sung (required unless Instrumental mode is on)

### Advanced Parameters
- **Fusion** — a genre/style blend descriptor (e.g., "lo-fi hip hop with jazz piano," "cinematic orchestral with electronic elements")
- **Intensity** — three levels: Subtle, Balanced, Aggressive. Controls the overall energy and production density.
- **Vocal Archetype** — shapes the tone and delivery of the generated vocals. Options: Intimate Bedroom, Raw Emotional, Soulful Belter, Gritty Rock, Confident Pop, Lo-Fi Whisper, Powerful Anthem, Storyteller Folk.
- **Vocal Gender** — Male, Female, or Neutral.
- **Vocal Spectrum** — a 0–100 slider that fine-tunes the vocal character within the selected archetype.

### Instrumental Mode
When the **Instrumental** toggle is enabled, the lyrics field is hidden and the generation request sends `is_instrumental: true` to MiniMax. This produces a fully instrumental track — no vocals, no lyrics required. The style prompt and fusion fields carry all the creative direction. This mode is ideal for beatmakers, ambient composers, film-score-style pieces, and anyone who wants music without vocals.

### Reference Audio
Two types of reference audio can be uploaded to guide the generation:
- **Style Reference** — an existing song (.wav or .mp3, minimum 15 seconds). MiniMax analyzes the vibe, instrumentation, and energy of the reference and uses it to shape the output. The reference audio is not sampled or reproduced; it is used as a stylistic guide only.
- **Voice Reference** — a vocal recording. MiniMax attempts to match the vocal style, tone, and delivery of the reference voice. This is a vocal style clone, not a voice clone of a specific person.

**Access:** Style Reference and Voice Reference are **Premium-only** features.

### Usage Limits
- **Free tier:** 5 AI generations per calendar month.
- **Premium tier:** Unlimited generations.

The monthly usage counter is visible on the Generate page. When the limit is reached, the Generate button is disabled and a prompt to upgrade appears.

### Generation History
All past generations are stored and accessible from the Studio (see Section 8). Each generation record includes the title, prompt, and a link to the generated audio. Generations can be published directly to My Riffs from the history view.

### Regenerate
From the generation history, users can regenerate a track using the same parameters with a new random seed, producing a variation of the original.

**Interaction with other features:** Generated tracks can be published directly to My Riffs via the "Publish to Riffs" action. The style prompt from a generation can be saved to the Style Library (see Section 8.3). The Generate page is embedded inside the Studio environment (see Section 8).

---

## 7. Riff Mode (Variations)

Riff Mode allows **Premium users** to create one-click variations of an existing track. When viewing a track (your own or another creator's, if they have enabled "Allow Riffs on Share"), a "Riff It" button appears. This sends the track's existing prompt and parameters back to the generation pipeline with a new seed, producing a variation that shares the same creative DNA but sounds different.

**Access:** Premium only. The track owner must have "Allow Riffs on Share" enabled for other users to Riff their tracks.

**Interaction with other features:** Riff Mode is the social creative loop — it allows the community to build on each other's work while respecting the creator's sharing preferences. Riffed tracks are new tracks in the creator's library, independent of the original.

---

## 8. Studio

The Studio is the immersive creative environment — a unified workspace that brings together the Generate, Lyrics, Style Library, and Stems tools under a single themed interface. It is accessible via the "Enter Studio" button in the navigation.

### Studio Themes
Users can choose from four visual environments that set the aesthetic of the Studio workspace:
- **Forest Studio** — floor-to-ceiling glass walls opening to an ancient forest; emerald and teal palette
- **Cozy Den** — warm cabin studio with amber light and forest window; amber and orange palette
- **Producer's Workshop** — tropical jungle studio with waterfall view; deep indigo palette
- **Rock Room** — a fourth environment with its own distinct character

The selected theme is saved to the user's profile and persists across sessions.

### Studio Tabs
The Studio workspace has four tabs:
1. **Generate** — the full music generation interface (see Section 6), embedded within the Studio environment
2. **Lyrics** — the Lyrics Generator (see Section 9), embedded within the Studio environment
3. **My Styles** — the Style Library (see Section 8.3), accessible to Premium users
4. **My Stems** — the Stems browser (see Section 12), showing all past stem splits

### Generation History Panel
A sidebar panel within the Studio showing the four most recent generations, with title, prompt snippet, and a link to publish or view each one.

### Fusion Recipes Drawer
A curated collection of fusion style combinations — pre-written prompts that blend genres in interesting ways. Accessible from a button in the Studio. Clicking a recipe pre-fills the style prompt field in Generate, giving users a starting point when they don't know what to ask for.

### Frequency / Visual Universe Button
A button in the Studio that opens the Frequency / Visual Universe modal (see Section 10).

---

## 8.3. Style Library

A personal library of saved generation styles. When a generation produces a sound the creator wants to replicate or build on, they can save the style prompt (with a name and optional notes) to their Style Library. Saved styles can be browsed, applied to new generations with one click, renamed, annotated, and deleted.

**Access:** Premium only.

**Interaction with other features:** The Style Library is the memory layer for the generation workflow. It allows creators to develop a consistent sonic identity across multiple tracks by reusing and refining their best-performing prompts. Usage counts are tracked per style entry.

---

## 9. Lyrics Generator

An AI-powered lyrics writing tool, accessible from the Studio (Lyrics tab) or directly from the navigation. The Lyrics Generator uses Claude (Anthropic) as its language model.

### Core Parameters
- **Fusion** — the genre/style context for the lyrics (e.g., "indie folk," "dark R&B," "electronic pop")
- **Topic / Theme** — the subject matter, emotional core, or narrative of the song
- **Mood** — the emotional register (e.g., "melancholic longing," "defiant joy," "quiet grief")
- **Structure** — the song structure template. Available templates: Standard Pop, Verse-Chorus-Bridge, AABA (Tin Pan Alley), Electronic/Dance, Folk/Narrative, Jazz/Soul, Ballad, Through-Composed.

### Rewrite Mode
A toggle that switches the tool from "generate new lyrics" to "rewrite my existing lyrics." When enabled, the user pastes their existing lyrics into the topic field and the AI rewrites them while preserving the emotional intent. The output heading changes to "Re-Visioned Lyrics" to make clear that the output is a rewrite, not a fresh generation. If the rewrite fails (e.g., due to a network error), a persistent error card appears in the output panel rather than silently leaving the original text in place.

### Lyrics Draft Saving
Users can save lyrics drafts at any stage. Drafts are stored per-user and can be retrieved, continued, and published. A draft includes the fusion, topic, mood, structure, and the generated lyrics text.

### Lyrics Options
A "Get Options" endpoint returns the available structure templates and other configuration values, ensuring the frontend always reflects the current set of supported structures.

**Interaction with other features:** Generated lyrics can be copied directly into the Lyrics field of the Generate page to create a track from the written words. The Lyrics Generator is embedded in the Studio (Lyrics tab) and also accessible as a standalone page.

---

## 10. Frequency / Visual Universe

The Frequency feature is the bridge between a creator's emotional identity and the visual presentation of their music. It is one of the most philosophically significant features on the platform, connecting the Listening Bible's framework for emotional self-knowledge to the practical output of AI-generated cover art.

### How It Works
1. The user answers a series of **Frequency Questions** — a structured introspective questionnaire designed to surface the creator's emotional and sonic identity. These questions were developed from the deep psychological and philosophical work in the Listening Bible and Founding Document.
2. The answers are sent to **Strawberry Studios** via the bridge API, where an LLM synthesizes them into a **Visual Universe** — a personal vocabulary of visual language that describes how the creator's music looks and feels.
3. The synthesis returns:
   - A **reflection** — a written description of the creator's visual identity
   - A **frequency name** — a poetic name for the creator's visual universe
   - An **arc type** — one of six emotional arc categories: Expansive Mythic, Witnessing Lateral, Intimate Relational, Sustained Ambient, Erosive Revelatory, Cyclical Return
   - A **vocabulary** — a set of visual descriptors, color language, and spatial metaphors

4. The creator reviews and saves their frequency. It is stored on the Studios side and referenced by Riff for cover art generation.

### Cover Art Generation
Once a frequency is saved, users can generate AI cover art for any track. The generation uses:
- The creator's personal Visual Universe vocabulary as the primary visual language
- The track's lyrics (if present) as emotional context
- If no frequency exists, a platform-default vocabulary called the **Blooming Frontier** is used as a fallback

Cover art is generated via the Studios bridge, stored in S3, and attached to the track record. It appears on track cards, the Track Detail page, and in social sharing previews.

### Cover Art Dimensions
A separate inference system analyzes the track's emotional character and suggests the appropriate visual dimensions (aspect ratio, compositional weight, spatial orientation) for the cover art. This is powered by the Studios cover art dimensions pipeline.

**Access:** Frequency setup and cover art generation are available to all signed-in users. The Blooming Frontier fallback ensures that users without a saved frequency can still generate cover art.

**Interaction with other features:** The Visual Universe is the connective tissue between the Lyrics Generator (emotional content), the Generate tool (sonic identity), and the visual presentation of tracks across the platform. It is the feature most directly rooted in the platform's founding philosophy.

---

## 11. Playlists

Users can organize tracks into playlists. Playlists support:
- **Create, rename, and delete**
- **Add and remove tracks** (from any track you have access to)
- **Reorder tracks** via drag-and-drop
- **Visibility settings** — Private, Inner Circle, or Public (same three-level system as tracks)
- **Shared playlist links** — a shareable URL that gives external viewers read-only access to the playlist, respecting the visibility setting

### Shared Playlist Page
A public-facing page for shared playlists, showing the playlist name, track list, and an inline player. Visitors can play tracks without signing in (for public playlists).

**Interaction with other features:** Playlists draw from the full track library — your own tracks and any public tracks from other creators. The playlist share link generates a unique token that can be revoked at any time.

---

## 12. Stem Splitting

Stem splitting separates an audio track into its individual components — typically vocals, drums, bass, and other instruments — as separate audio files. This is powered by an external stem-splitting API (StemSplit).

### How It Works
1. The user selects a track from their library and initiates a stem split.
2. The request is sent to the StemSplit API, which processes the audio asynchronously.
3. The user can check the status of the split and will see the results when processing is complete.
4. Individual stems are available for download as a ZIP archive.

### My Stems Browser
A panel (accessible from the Studio's "My Stems" tab and from the standalone My Stems page) showing all past stem splits, their status, and download links. Favorite stems can be starred for quick access. Stems can be renamed.

**Interaction with other features:** Stems are a creative input for the generation workflow — a vocal stem can be used as a Voice Reference in the Generate tool, and an instrumental stem can be used as a Style Reference. The Stems panel is embedded in the Studio for this reason.

---

## 13. Preview Links

A mechanism for sharing private or inner-circle tracks with specific people without changing the track's visibility setting.

### How It Works
A creator generates a **Preview Link** for a track. The link contains a unique token and is valid for **3 plays**. When a recipient opens the link, they land on a special preview version of the Track Detail page. Each play decrements the counter. After 3 plays, the link expires and the track is no longer accessible via that link.

Creators can:
- Generate multiple preview links for the same track
- View all active links for a track (with remaining play counts)
- View all active links across all their tracks (for My Riffs badge display)
- Revoke a link at any time

**Access:** Available to all signed-in users (both Free and Premium).

**Interaction with other features:** Preview Links are the tool for sharing work-in-progress with collaborators, sending tracks to labels or sync agents, or letting a specific listener hear something before it's public. They are the privacy-preserving sharing mechanism that complements the three-tier visibility system.

---

## 14. Open Graph / Social Sharing

When a track URL is shared on social media (Twitter/X, Facebook, iMessage, etc.), the platform generates a rich preview card using **Open Graph metadata**. The preview card includes:
- The track's cover art as the card image
- The track title as the card title
- The creator's name and a short description

The OG image is generated server-side on demand, using the track's cover art and title. This ensures that shared links look professional and enticing in social contexts.

**Interaction with other features:** The OG image pipeline depends on cover art being present. Tracks without cover art fall back to a platform default image. The OG image is the first visual impression a non-user gets of a creator's work.

---

## 15. Vibe Presets

A lightweight tagging system that allows users to save named collections of mood tags as reusable presets. A vibe preset is a named set of tags (e.g., "Late Night Drive" = ["melancholic," "atmospheric," "driving"]) that can be applied to a track in one click rather than re-entering tags manually.

**Interaction with other features:** Vibe presets accelerate the track upload and metadata workflow. They are particularly useful for creators who work consistently within a specific emotional register and want to tag tracks quickly without repetition.

---

## 16. Pricing and Subscription

Strawberry Riff operates on a **Free / Premium** two-tier model, managed via **Stripe**.

| Feature | Free | Premium |
|---|---|---|
| AI Generations | 5 per month | Unlimited |
| Music Generation | Full access | Full access |
| Visibility levels | All three | All three |
| Playlists | Yes | Yes |
| Creator Profile | Yes | Yes |
| Discover & Follow | Yes | Yes |
| Preview Share Links | Yes (3-play limit) | Yes (3-play limit) |
| Studio Mode | Generate + Lyrics | Generate + Lyrics + My Styles |
| Riff Mode (variations) | No | Yes |
| Style Library | No | Yes |
| Visual Brief (Frequency) | No | Yes |
| Style Reference Audio | No | Yes |
| Voice Reference | No | Yes |

### Subscription Management
Premium subscribers can manage their subscription (upgrade, downgrade, view billing history) via the Stripe Customer Portal, accessible from the Pricing page. Payments are processed securely by Stripe and support all major credit/debit cards, Apple Pay, and Google Pay.

### Ownership Guarantee
Regardless of subscription tier, users retain full ownership of all music they upload or generate. Strawberry Riff does not claim any rights to user content. This is stated explicitly in the FAQ and is a non-negotiable platform principle.

---

## 17. Feature Interaction Map

The following describes the key creative workflows and how features connect within them:

**The full creation arc (Generate → Publish → Discover):**
A creator opens the Studio, uses the Lyrics Generator to write words, copies them into the Generate tool, selects a vocal archetype and fusion style, generates a track, publishes it to My Riffs with a cover art generated from their Visual Universe, sets visibility to Public, and the track enters the Discover feed where it is shuffled into other listeners' sessions.

**The reference-guided generation arc:**
A creator uploads a reference song they love as a Style Reference, uploads a vocal recording as a Voice Reference, writes a prompt describing the emotional direction, and generates a track that matches the vibe of the reference while using their vocal style. The resulting style prompt is saved to the Style Library for future use.

**The private sharing arc:**
A creator generates a track, keeps it Private, generates a Preview Link, sends it to a collaborator or industry contact. The recipient gets 3 plays. The creator can revoke the link at any time. The track never enters the public feed.

**The visual identity arc:**
A creator completes the Frequency Questions, receives their Visual Universe synthesis from Studios, saves their frequency, and from that point forward every cover art they generate reflects their personal visual language — creating a coherent visual identity across their entire catalog.

**The social discovery arc:**
A listener browses the Discover feed, finds a track they love, likes it, visits the creator's profile, follows them, and from that point sees the creator's inner-circle tracks in their Friends feed — a private channel between creator and audience that exists outside the public feed.

---

## 18. What the Platform Does Not Do

Understanding the boundaries is as important as understanding the features. Strawberry Riff does not:

- **Stream music commercially** — it is not Spotify or Apple Music. There are no royalty payments, no editorial playlists, no algorithmic recommendation engine.
- **Claim ownership of user content** — ever, under any circumstances.
- **Process audio destructively** — EQ and Trim are non-destructive; the original file is always preserved.
- **Store file bytes in the database** — all audio and image files are stored in S3; the database holds only metadata and references.
- **Expose user data between accounts** — private tracks are invisible to everyone except the owner; inner-circle tracks are visible only to followers.
- **Act as a general AI assistant** — the platform's AI features (Generate, Lyrics, Frequency synthesis) are scoped to music creation. The forthcoming Riff Assistant will be similarly scoped to the platform's domain.

---

*This document reflects the platform as of June 2026. Features are actively being developed; this document should be updated as new capabilities are added.*
