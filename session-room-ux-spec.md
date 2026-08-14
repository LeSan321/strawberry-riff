# Strawberry Riff Session Room UX Specification

**Status:** Direction approved for visual-design preparation; room name remains open  
**Purpose:** Turn the established fusion, lyric, vocal, Match Family, and Blend workflow into an invitation-led creative environment rather than a technical control panel.

> **Design question:** “Who are you when you are given new ways to hear yourself?”

## 1. Product Intent

The Session Room is not a second Generate page and it is not a simplified digital audio workstation. It is a creative room where a person develops a musical possibility through collaboration with responsive intelligences. The creator provides intent, taste, emotion, language, memory, and the willingness to explore. The system provides acoustic knowledge, structural memory, lyric-fit guidance, vocal steering, and the ability to hold several variations open.

The primary outcome is not “another generated track.” It is a **Custom Fusion**: a vocal-ready instrumental bed, a compatible vocal interpretation, and a chosen relationship between them.

## 1.1 Settled Design Decisions

The Session Room is a **self-contained Platinum workspace**. A creator should be able to enter once, create several instrumental fusions, develop multiple vocal interpretations, compare their compatible parts, and save finished Custom Fusions without being required to return to the general Generate page.

The room should offer a **guided but non-linear** experience. A first-time creator sees a suggested path and gentle next-step cues. Once they understand the room, they can move directly among sound world, lyrics, voice, family, and Blend without being trapped in a rigid wizard.

Match Families should use a compact utilitarian code such as `F-01`. The code is a recognizable matching token—similar to a simple system of shared garment tags—rather than a poetic title. Its meaning is always revealed alongside the code in plain language.

> **Build a fusion landscape. Then explore vocal color.**

## 2. Minimum Viable Creative Workflow

The first Session Room build should guide one coherent workflow from an existing or newly created instrumental fusion through a completed Custom Fusion. It should not attempt every future capability at once.

| Stage | Creator decision | System responsibility | Saved result |
|---|---|---|---|
| **1. Begin with a sound world** | Select or create a vocal-ready instrumental fusion | Surface the Instrument Palette, help translate a creative direction into a backing-bed prompt, tag the result as an instrumental fusion | Fusion Instrumental |
| **2. Give the bed a shared shape** | Accept or adjust the musical shape | Create and display a Match Family containing tempo, meter, form, duration window, vocal lane, and lyric-fit invitation | Match Family `F-01` |
| **3. Invite a voice in** | Choose a vocal character, register, accent or regional flavor, and lyric direction | Assemble vocal guidance from the Vocal Bible, selected Match Family, and dialect-informed lyric support | Vocal Take |
| **4. Explore the family** | Compare compatible beds and vocal takes; optionally branch into a new audition | Filter and rank by Match Family; preserve source lineage | Creative family view |
| **5. Commit a relationship** | Choose the pair that feels right | Preview, browser-render, upload, and preserve the lineage of the Custom Fusion | Custom Fusion |

## 3. What Belongs in the First Build Versus Later

| Build now | Defer until the workflow is proven |
|---|---|
| Clear “Begin a Fusion” entry point in Sessions | Automatic audio-derived BPM/key analysis |
| Instrumental fusion selection and explicit `isInstrumentalFusion` tagging | Multi-track timeline editing |
| Match Family card and visible family filter | Advanced per-section arrangement editing |
| Lyric-fit invitation, dialect explanation, and existing vocal steering controls | Full lyric scan / syllable-by-syllable visualizer |
| Compatible vocal/instrumental selection and browser Blend | Automated pitch correction or time stretching |
| Plain-language empty states and next-step handoffs | Complete “Riff This Voice” generation workflow |

The deferred items are not rejected. They are deliberately held until live use shows where creators need more control.

## 4. Room Architecture: Invitation Before Controls

The Session Room should open with a quiet orienting panel rather than a dense tab strip or a grid of technical forms. It should be a complete creation environment for Platinum members: users may create a new fusion bed inside the room, revisit an existing family, or begin by selecting a prior bed.

### Room header

> **Sessions** *(working navigation label)*  
> *Build a fusion landscape. Then explore vocal color.*

A small secondary line can make the value concrete without breaking the poetry:

> *Build a fusion bed, invite in a voice, and keep the versions that sound most like you.*

The room is then organized as an evolving **creative thread**, not five isolated tools. The thread is always visible, but each stage remains directly selectable after the user has entered the room.

```text
Sound World  →  Shared Shape  →  Voice & Words  →  Listen Together  →  Keep the Fusion
```

Each stage has a clear, human-readable invitation. Technical controls appear only after the creator understands why they are being asked to choose something. A “Suggested next step” marker may guide newcomers, while all completed or available stages remain clickable.

## 5. Stage-by-Stage UI Design

### Stage 1 — Sound World

**Invitation:**

> **What world should this sound grow up in?**

This is the primary entry for new fusion work. The Instrument Palette must be visible near the top of this stage—not hidden below a generic generation form.

When a creator selects an anchor such as Great Highland bagpipes, the page shows an **Acoustic Blueprint** card. It does not expose raw Instrument Bible tags. Instead it explains the musical opportunity in plain language.

| UI element | Example for bagpipes |
|---|---|
| Acoustic anchor | **Great Highland Bagpipes** |
| What it brings | Sustained drone, bright reedy lift, ceremonial force, rhythmic grace-note energy |
| Creative invitation | “Where do you want these pipes to belong?” |
| Direction choices | *Rooted*, *Cross-pollinated*, *Cinematic*, *Unexpected* |
| Optional free text | “Driving rockabilly rhythm with desert-night swagger” |

The user does **not** need to know how to write “hip hop with bagpipe solo in Great Highland style.” They should be encouraged to describe a feeling, movement, setting, groove, or collision they want to hear. The system assembles the instrument conditioning, arrangement direction, and vocal-space requirement behind the scenes.

### Stage 2 — Shared Shape

**Invitation:**

> **Give this music a shape a voice can live inside.**

When a fusion bed is created or selected, the Session Room shows a Match Family card. It makes the hidden structure useful without turning it into a music-theory lesson.

> **Match Family F-01**  
> *160 BPM · 4/4 · driving form · vocal-ready*  
> *Built for rhythmic, short-to-medium phrases and a clear lead-vocal lane.*

The code is deliberately utilitarian. It tells the creator: **these pieces belong to the same structural family**. The expandable explanation tells them what that family means in practice: pulse, meter, form, lyric capacity, and vocal lane.

The “Why this matters” affordance can expand to explain that matching pieces share a tempo, section shape, and lyric space. The default view remains simple.

### Stage 3 — Voice & Words

**Invitation:**

> **Who could live inside this song?**

This stage combines current Add Vocals capabilities with new explanatory framing. The creator chooses a vocal character and, when wanted, regional flavor. The system should explain the dialect toggle as a creative support rather than an effect.

> **Let the language support the voice.**  
> Small changes in phrasing and regional language can help the singer hold onto the character you chose. We can suggest them, or you can keep your original words.

The lyric area should show a **Lyric Fit invitation**, derived from the selected Match Family:

| Bed invitation | Suggested lyric posture |
|---|---|
| Spacious / intimate | Long vowels, lower word density, room between thoughts |
| Driving / rhythmic | Shorter lines, clear downbeats, stronger cadence |
| Conversational | Flexible phrase endings, talk-sung phrasing, moderate density |
| Lift / sustain | Fewer words in the chorus, open vowels, long held emotional notes |

The creator may write freely, retain existing lyrics, accept suggestions, or intentionally choose an “experimental fit.” The system informs; it does not enforce.

### Stage 4 — The Family Shelf

**Invitation:**

> **Hear what belongs together. Then try what does not.**

This is the place for Match Family exploration. It should be a compact shelf or side panel, not a full library-management experience inside the room.

Default filter:

```text
Showing: Match Family F-01
[Fusion Instrumentals]  [Vocal Takes]  [Custom Fusions]
```

Each card carries a clear role badge and one line of useful context:

| Card type | Example metadata |
|---|---|
| Fusion Instrumental | “F-01 · vocal-ready bed · 160 BPM” |
| Vocal Take | “F-01 · Scottish baritone · rhythmic delivery” |
| Custom Fusion | “F-01 · Bed 01 + Voice 03” |
| Near Match | “F-01B · same pulse, altered bridge” |

The creator may expand the filter to all Match Families. The system should distinguish **Natural Fit**, **Near Match**, and **Experimental Fit** without prohibiting any option.

### Stage 5 — Listen Together

**Invitation:**

> **What happens when these two meet?**

The existing Blend experience belongs here, but it should present pairing as listening rather than mixing engineering. Use waveform visual feedback, clear play controls, and simple relationship language.

| Existing technical control | Invitation-led presentation |
|---|---|
| Vocal volume | “Let the voice step forward” |
| Instrumental volume | “Let the world around the voice breathe” |
| Blend button | “Hear them together” |
| Save result | “Keep this fusion” |

The Custom Fusion result card must preserve lineage: which fusion bed and which vocal take met, plus the Match Family they share.

## 6. Exploration Without “Weirdness”

The creator should be able to choose how firmly the system holds the original ingredients without encountering a vague or gimmicky “weirdness” slider.

| Creative posture | Front-facing language | Behind-the-scenes intent |
|---|---|---|
| **Grounded** | “Honor my ingredients clearly.” | Strong adherence to selected instrument, rhythm, structure, and vocal direction |
| **Exploratory** | “Surprise me, but stay in this world.” | More latitude for supporting texture, phrasing, and cross-pollination |
| **Wild Card** | “Show me a possibility I would not have thought to ask for.” | Wider variation while retaining the selected Match Family where possible |

This control should be introduced only after the core workflow works reliably. It belongs under an “Explore” disclosure, not in the first-screen experience.

## 7. Language Rules

The Session Room should consistently prefer invitations over operations.

| Avoid | Prefer |
|---|---|
| Generate instrumental | Build a fusion bed |
| Select vocal model | Invite a voice in |
| Apply dialect transformation | Let the language support the voice |
| Compatibility score | Natural fit / near match / experimental fit |
| Re-generate | Audition another interpretation |
| Save output | Keep this fusion |
| Parameter / configuration | Direction / choice / invitation |

The interface should be clear, not coy. Poetry has to be paired with a plain explanation when a user needs to understand the next consequence of a choice.

## 8. Build Sequence

### Phase A — Make the room legible

1. Reframe the current Sessions header and tabs as a visible, directly navigable creative sequence.
2. Add an empty-state / start card that explains the Fusion Bed → Voice → Blend path.
3. Add Match Family placeholders and source-role badges, even before fully automatic fingerprinting exists.
4. Place Instrument Palette access and fusion-bed creation inside Sessions; retain an optional “Open in Sessions” handoff from general Generate for creators who begin there.

### Phase B — Make the structure useful

1. Persist and assign Match Families when a fusion bed is created.
2. Inherit Match Family when a vocal is created for a selected bed.
3. Add family-based filtering and ranking in the Session shelf and Blend selector.
4. Reveal Lyric Fit invitations based on the selected bed’s structure.

### Phase C — Make exploration graceful

1. Add Natural / Near / Experimental fit language.
2. Add optional Grounded / Exploratory / Wild Card posture controls.
3. Design “Riff This Voice” as a source-preserving vocal audition flow.
4. Add visible lineage across beds, voices, and saved Custom Fusions.

## 9. Decisions Needed Before UI Implementation

1. **Open:** Should the navigation label remain **Sessions**, become **The Session Room**, or use another distinct name that avoids confusion with the existing premium Studio? The working recommendation is to retain **Sessions** in navigation and use **The Session Room** as the full-page title.
2. **Decided:** Users create fusion beds inside the Session Room. General Generate retains an optional “Open in Sessions” handoff.
3. **Decided:** Match Family labels use utilitarian codes such as `F-01`, with an expandable plain-language explanation of the shared structure.
4. **Decided:** The room guides newcomers with progress and suggested next steps while allowing direct jumping at any time.
5. **Decided:** The first public-facing explanation balances practical clarity and invitation: **“Build a fusion landscape. Then explore vocal color.”**

## 10. Success Criterion

A newcomer who enters the room with no knowledge of Instrument Bibles, structural fingerprints, or dialectal lyric steering should be able to answer these questions without outside help:

1. **What can I make here?** A custom instrumental world, a voice for it, and a fusion that belongs to me.
2. **What do I do first?** Begin with a sound world or choose a fusion bed I already made.
3. **Why is the system asking me this?** Each choice helps the music make room for the voice and helps future versions find one another.
4. **What can I do when I like something?** Keep it, audition a different voice, revisit its Match Family, or blend it into a Custom Fusion.

> **The room succeeds when it helps a person feel more articulate, more curious, and more like themselves—not more technically competent merely for having survived the interface.**
