# Strawberry Riff — Sessions Page UX Specification
## Version 1.0 — August 2026

---

## Preamble: What Sessions Actually Is

Sessions is not a feature set. It is a **creative identity studio** — the place where a Platinum user discovers, develops, and expresses who they are as a creator across any musical form. The tools inside Sessions (fusions, vocal steering, structure matching, accent profiles) are the means. The end is something that has never existed before: a multi-genre creative identity that belongs entirely to the person who made it.

This distinction matters for every design decision in this document. When we ask "where does this control go?" the answer is always "wherever it serves the creative act, not wherever it's technically convenient." When we ask "what should the user see first?" the answer is always "whatever helps them understand what they're making and why."

---

## The Conceptual Moat

Most AI music tools are built around a productivity framing: make music faster, make it easier, make more of it. The Riff is built around a different question entirely: **who are you as a creator, and how does that identity express itself across every musical form available to you?**

This is a new question. It has never been answerable before because making music across genres required either years of technical skill in each form, or the resources to commission musicians who had it. Both constraints forced creative people into narrow lanes — you were "a country artist" or "a jazz musician" because those were the only containers available. Musical identity collapsed into genre identity.

AI-assisted creation removes that constraint. A person can now express the same underlying creative sensibility in Celtic folk, cyber cowboy, jazz, ambient, and anything else — and when they do that across enough tracks, something emerges that has never existed before: a creative fingerprint that transcends genre. Not "I am a Celtic folk artist" but "I am someone whose sensibility expresses itself in Celtic folk, and also in jazz, and also in something that has no name yet, and the thing that connects all of them is *me*."

Sessions is the studio where that fingerprint gets made. The Frequency ID is where it gets visualized. Together they form the Platinum value proposition — not more tools, not more generations, but **a new way to understand who you are as a creator**.

---

## Tier Reframing

The current tier structure evolved organically. The following reframing aligns it with the actual value being delivered.

| Tier | What It Actually Is | Core Question | Generation Limit |
|---|---|---|---|
| **Free** | Taste | "Can AI make music that sounds like me?" | 5/month |
| **Premium** | Library | "I can make music regularly and share it with people I choose" | 50/month |
| **Platinum** | Identity | "I can discover and express who I am across any musical form" | Unlimited |

The generation limit on Premium should be set generously (50/month is more than sufficient for most users) but not unlimited. The distinction between Premium and Platinum is not about volume — it is about depth. Premium users build a library. Platinum users build an identity. That distinction justifies the tier separation more clearly than raw generation count.

The tools that belong exclusively to Platinum are the ones that serve the identity work: custom fusions, accent-steered vocal generation, structural fingerprint matching, the full Frequency ID, and the custom fusion badge system. These are not features that Premium users are locked out of because of cost — they are features that only make sense once a user has enough creative history to work with.

---

## Sessions Navigation — Proposed Structure

The current Sessions sidebar has too many items, several of which are placeholders or redundant. The proposed structure reduces to seven destinations, each with a clear purpose.

| Tab | New Name | Purpose | Status |
|---|---|---|---|
| Generate | **Create** | Full fusion workflow: instrumental → vocal → structure → layer → save | Rebuild |
| Add Vocals | **Vocals** | Dedicated vocal generation with structure matching and accent steering | Rebuild |
| Lyrics | **Lyrics** | Write/generate, dialect rewrite, structure fit indicator | Enhance |
| — | **Fusions** | Instrument palette + fusion recipe browser, surfaced as a named feature | Promote from drawer |
| My Stems | **Stems** | Split stems, download, manage | Keep as-is |
| My Styles | **Styles** | Saved style library | Keep as-is |
| Your Frequency | **Frequency** | Visual identity — follows the user | Keep as-is |

**Remove entirely:** Blend tab (absorbed into Create workflow), all Coming Soon placeholders (Saved Sessions, Concerts, Lyrics Vault). App stores flag placeholder navigation items and they dilute the clarity of the page.

The Resources section (Fusions drawer, Frequency modal, Instrument Palette drawer) should be promoted to first-class navigation items rather than secondary drawers. These are core Platinum features, not supplementary resources.

---

## The Create Workflow (Full Pipeline)

The Create tab is the primary Platinum experience — the place where a custom fusion is made from start to finish without leaving the page. The current Generate tab is a starting point; this is the destination.

The workflow is linear and progressive: each step reveals the next one. The user never needs to navigate away. The full sequence:

### Step 1 — Instrumental Foundation

The user selects an existing track from their library or creates a new fusion. If creating new, the Instrument Palette is available inline (not as a drawer). The selected track's **structural fingerprint** is displayed immediately: BPM, section sequence (Intro → Verse → Chorus → Bridge → Outro), total bars, and energy shape. This fingerprint is the anchor for everything that follows.

**Filter logic:** The library is filtered to show only tracks with a structural fingerprint (i.e., tracks generated with a structure block, or tracks that have been analyzed). Tracks without fingerprints are shown in a secondary "unanalyzed" section. This is the first appearance of structure-aware filtering.

### Step 2 — Lyrics

The lyrics editor appears inline, showing the structural fingerprint from Step 1 as a guide. The editor indicates whether the current lyrics fit the structure — specifically whether the syllable count and phrase length in each section matches the bar counts in the fingerprint. This is not a hard constraint but a guide: "Your chorus has 24 syllables across 8 bars — this fits well" or "Your verse is long for 8 bars — consider shortening or expanding to 16."

The user can write lyrics manually, generate them via the Lyrics generator (which is aware of the structure), or paste existing lyrics. The dialect rewrite toggle is available here, not on a separate tab.

### Step 3 — Vocal Character

The vocal accent selector appears. This is a **free-text field with suggestions**, not a fixed grid of 6 cards. The user can type any accent ("Scottish Highland," "American Northeast," "Cajun," "Jamaican patois," "Russian folk") and the system builds the phonetic descriptor set from the Vocal Bible principles. The preset profiles (Celtic, Blues/South, British RP, Bossa Nova, Jazz, Country) appear as quick-select suggestions below the field.

The register selector (bass male / mezzo-soprano female / tenor male / soprano female) is shown with the register hierarchy from the Vocal Bible — lower registers are marked as more accent-steerable. The user can override this.

The dialect rewrite toggle (from Step 2) is shown here as a reminder with a preview of the transformed lyrics.

### Step 4 — Generate

A single Generate button assembles the three-signal prompt automatically and fires the generation. The assembled prompt is shown in a collapsible "Advanced" section for users who want to see or edit it. The generation status is shown inline — no page navigation.

### Step 5 — Stem Split (Automatic)

When generation completes, stem splitting begins automatically. The user sees a progress indicator: "Splitting stems — vocal stem will be ready in ~30 seconds." The full vocal track is saved to the library silently with a toast: "Full vocal track saved to My Riffs." The user's attention stays on the vocal stem.

### Step 6 — Vocal Stem Review

The vocal stem is presented with a waveform display and playback controls. The user can listen, scrub, and decide whether to proceed to layering or regenerate. If regenerating, the prompt is pre-filled with the previous settings for quick adjustment.

### Step 7 — Layer

The instrumental from Step 1 and the vocal stem from Step 6 are shown side by side. Volume controls for each. A single "Layer & Save" button runs the ffmpeg mix server-side and saves the result. The user names the track here.

### Step 8 — Custom Fusion Badge

The saved track receives a **Custom Fusion badge** — a small visual indicator on the track card in My Riffs and on the Discover feed (if public). The badge marks the track as a human-steered creation: custom instrumental + custom vocal + intentional layering. This is the artifact of the creative identity work, made visible.

The badge design should be minimal and distinctive — not a large label but a small icon or color accent that a knowledgeable user recognizes. A small waveform-and-mic icon in the track card corner, in the session theme accent color, is the current proposal.

---

## The Vocals Tab (Standalone)

The Vocals tab is for users who want to generate a vocal track without going through the full Create pipeline — for example, generating a vocal stem to use with an existing instrumental they've already made.

The layout is the same as the Create workflow Steps 1–6, but without the layering step at the end. The result is a vocal stem saved to Stems. This tab is simpler and faster for users who already have their instrumental and just need the vocal.

The key difference from the current Add Vocals tab: the instrumental picker is a **searchable dropdown** (not a card grid), filtered by structural compatibility with the lyrics the user has entered. The accent selector is the free-text field, not the fixed card grid.

---

## The Lyrics Tab (Enhanced)

The Lyrics tab gains two new capabilities:

**Structure fit indicator:** When the user has a track selected (from a previous step or from the library), the lyrics editor shows the structural fingerprint and indicates how well the current lyrics fit. This is a guide, not a gate.

**Dialect rewrite:** The dialect rewrite toggle and preview are available here as well as in the Create and Vocals workflows. A user can write lyrics, apply a dialect rewrite, review the result, and save the dialect version as a separate lyrics draft.

The Lyrics tab does not need a structure filter in the same way as the Vocals tab — it is a writing tool first. The structure awareness is a guide for writers who want it, not a required step.

---

## The Fusions Tab (Promoted)

The Fusions tab is the current Fusion Recipes drawer promoted to a first-class destination. It contains:

- The full Instrument Palette (currently accessible only via a drawer)
- The 47 fusion recipes (currently in the Fusions drawer)
- A "My Fusions" section showing the user's custom fusion tracks (those with the Custom Fusion badge)
- A structural browser: filter fusions by BPM range, section sequence, or energy shape

This tab is where the user discovers what's possible before they go to Create to make it. It is the inspiration layer, not the creation layer.

---

## Accent Library — Architecture

The fixed 6-card accent grid is replaced with a **free-text accent field with LLM-assisted descriptor generation**. The architecture:

1. User types an accent name (any accent, any specificity)
2. The system checks the Vocal Bible accent profiles for an exact or close match
3. If a match exists, it uses the pre-built phonetic descriptor set
4. If no match exists, it calls the LLM with the accent name and the Vocal Bible principles to generate a phonetic descriptor set on the fly
5. The generated descriptor set is shown to the user for review before generation
6. If the user generates successfully with a custom accent, the descriptor set is saved as a new accent profile in their personal library (starred accents)

This architecture means the accent library grows with use. The 6 pre-built profiles are the seed. Every successful custom accent generation adds to the user's personal library. Over time, the platform accumulates a community accent library from successful generations across all users.

---

## Structural Fingerprint — Implementation Path

The structural fingerprint is the connective tissue for the matching and filtering features described above. The implementation path:

**Phase 1 (immediate):** Store the structure block from the prompt as the fingerprint at generation time. Every track generated with a structure block in the prompt has a fingerprint automatically. This covers all future Bespoke/vocal-mode generations.

**Phase 2 (near-term):** For tracks without a fingerprint (generated without a structure block, or uploaded), run a background audio analysis job using a lightweight beat/section detection library (Librosa or equivalent) to extract BPM, section boundaries, and energy shape. Store the result as the fingerprint.

**Phase 3 (future):** Surface the fingerprint in the track detail view. Build the compatibility matching algorithm (compare shape_hash strings, BPM within ±5 tolerance). Add the structure browser to the Fusions tab.

---

## What Stays, What Changes, What's New

| Element | Status | Notes |
|---|---|---|
| Session themes (Midnight Studio, Golden Hour, etc.) | Keep | Core identity of the page |
| Sidebar navigation | Rebuild | 7 items, no placeholders |
| Generate tab | Rename → Create, rebuild workflow | Full pipeline, not just generation |
| Add Vocals tab | Rename → Vocals, rebuild | Searchable dropdown, free-text accent |
| Blend tab | Remove | Absorbed into Create Step 7 |
| Lyrics tab | Keep, enhance | Add structure fit indicator and dialect rewrite |
| My Styles tab | Keep | No changes needed |
| My Stems tab | Keep | No changes needed |
| Fusions drawer | Promote → Fusions tab | First-class destination |
| Frequency modal | Keep, promote to sidebar | Already complete |
| Instrument Palette drawer | Inline in Create + Fusions tab | Not a drawer |
| Coming Soon items | Remove | App store compliance |
| Custom Fusion badge | New | Small icon on track cards |
| Structural fingerprint display | New | In Create Step 1 and Vocals picker |
| Free-text accent field | New | Replaces fixed card grid |

---

## Open Questions for Review

The following questions have been resolved. Decisions are recorded here for implementation reference.

1. **Custom Fusion badge design — RESOLVED:** Small waveform-and-mic icon in the session accent color, positioned in the track card corner. Should appear on the Discover feed for public tracks. Distinctive without being visually competitive with the track artwork.

2. **Stem split — RESOLVED: Opt-in, not automatic.** After generation completes, the user listens to the full vocal track and decides whether to proceed. If they want to use it as a fusion vocal, they initiate stem splitting from a "Split & Continue" button. If they want to keep it as a standalone song, they save to library as-is. Rationale: avoids wasting tokens on stems for tracks the user doesn't want to use for fusion; respects that the full vocal track has value as a song on its own.

3. **Accent descriptor review — RESOLVED: Summary only.** The user sees a readable summary (e.g., "Celtic/Scottish Highland — rolled R consonants, open back vowels, rising intonation") not the full phonetic descriptor string. The full descriptor is assembled server-side and never exposed. Rationale: cleaner UX for non-technical users; protects the Vocal Bible descriptor vocabulary as proprietary research.

4. **Premium generation limit — RESOLVED: 100/month.** Generous enough that active users never feel constrained; creates a clear distinction from Platinum's unlimited without creating friction. Framing: "welcome guest" not "customer we're extracting from."

5. **Fusions tab naming — DEFERRED.** Cannot be decided until the full layout is visible. Revisit after Sprint 1 implementation is complete and the nav structure can be evaluated in context.

---

## Implementation Sequence

**Sprint 1 (current):** Structural fingerprint display in Create Step 1 (instrumental picker as searchable dropdown showing BPM and section sequence); opt-in stem split step after vocal generation. These are the foundational pieces — test the pipeline before building further.

**Sprint 2:** Navigation restructure (7 tabs, remove placeholders, promote Fusions); Blend absorbed into Create workflow; Coming Soon items removed.

**Sprint 3:** Free-text accent field with LLM-assisted descriptor generation; personal starred accents library; accent summary display.

**Sprint 4:** Custom Fusion badge on track cards and Discover feed; Premium generation limit set to 100/month.

**Sprint 5:** Structural fingerprint background analysis for existing tracks (Phase 2 of fingerprint implementation); structure-aware lyrics fit indicator in Lyrics tab.

---

*Document version 1.0 — for review and discussion before implementation. No code should be written against this spec until it has been reviewed and approved.*
