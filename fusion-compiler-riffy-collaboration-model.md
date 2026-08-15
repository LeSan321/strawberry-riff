# Fusion Plan Compiler & Riffy: A Collaboration Model

## The Design Question

The Fusion Plan Compiler must be reliable enough to stop MiniMax from losing a selected instrument, flattening a fusion into a default genre, or erasing the structural conditions needed for later matching. It must not become a form that dictates the song before the creator has a chance to discover it.

Riffy's presence in the Session Room is connected to the same question. A generic assistant waits for a user to formulate a question. A music collaboration partner notices the creative moment, holds the musical context, offers a useful reflection, and helps a person make the next meaningful choice without taking authorship away.

## The Compiler Is a Guardrail, Not an Auteur

The compiler should be rigid only where the model has repeatedly proven unreliable. It should preserve the musical contracts that make a generated bed testable and reusable; it should not prescribe genre, mood, imagery, lyrical point of view, or surprise.

| Layer | Degree of rigidity | Why |
|---|---|---|
| **Instrument identity** | Fixed after creator selects an anchor | The system must preserve the acoustic anchor the creator chose. |
| **Double reinforcement** | Fixed structural rule for elastic / lead-capable instruments | The model needs identity once and a concrete role once. |
| **Instrument role** | Creator chooses; compiler renders precisely | “Lead guitar replacement,” “counterline,” “foundation,” and “texture” are creative choices, but each needs a valid structural syntax. |
| **One BPM instruction** | Fixed validation rule | Multiple tempo signals cause collapse. |
| **Rhythm / harmony placeholders** | Required when the chosen role needs them; values remain creator-led | An elastic fusion needs somewhere specific for the anchor to live. |
| **Vocal relationship** | Creator-led choice from a small meaningful set | A future singer can be spacious, rhythmic, call-and-response, or absent; the compiler must not use one generic lane instruction for all cases. |
| **Genre, imagery, emotional posture** | Open | This is the creator’s territory, including deliberate tension, unexpected combinations, and discovery. |
| **Exploration level** | Optional creative choice | Grounded, Exploratory, or Wild Card should change how freely the system cross-pollinates—not remove the anchor contract. |

The principle is simple:

> **The system protects the instrument’s right to remain itself. The creator decides what that self encounters.**

## A Flexible Fusion Plan

The creator never needs to fill in a technical configuration form. The room can begin with an ordinary invitation:

> **What world should this instrument enter?**

Behind that invitation, the plan holds a small number of musically meaningful choices.

```text
Acoustic Anchor:      Great Highland Bagpipe
Musical World:        Cyber rockabilly with samba percussion
Anchor Job:           Lead-guitar replacement / recurring melodic fills
Motion:               Driving, festive, high-energy
Foundation:           Walking upright bass, slapback snare, palm-muted guitar
Harmonic Ground:      I–IV–V
Tempo:                160 BPM
Vocal Relationship:   Clear verse space; bagpipe-led instrumental breaks
Exploration:          Grounded / Exploratory / Wild Card
```

The compiler turns this plan into the tested two-block prompt shape. The creator should see the plan in natural language, not be forced to edit the raw model prompt. An optional “Show the musical translation” disclosure can satisfy advanced users and make the process auditable.

## Riffy in the Session Room

Riffy should be present as the room’s **listening collaborator**, not a floating help button or a generic chat drawer.

### What Changes

| On-call assistant | Collaboration partner |
|---|---|
| Waits in a corner until summoned | Lives in the current creative stage and knows what has been chosen |
| Answers “How do I do this?” | Asks “What should the bagpipes be doing here?” |
| Offers a generic response | Responds to the anchor, Match Family, lyric direction, and previous choices |
| Generates a paragraph of advice | Builds or revises a concise Fusion Plan with the creator |
| Is optional support | Is an optional but visible co-presence in the room |

This does not mean Riffy speaks constantly. In fact, restraint is part of the posture. Riffy should surface only at moments where an attentive musical partner would be useful:

1. **After anchor selection:** “Do you hear this as a lead voice, a rhythmic spark, or an atmosphere?”
2. **After a world is named:** “This could hold together as a driving dance track. Should the bagpipes own the breaks or trade with the rhythm section?”
3. **Before generation:** “Here is the shape we have built. Does it still feel like yours?”
4. **After listening:** “The anchor came through as texture rather than lead. Do you want to reinforce its job, or follow what the track discovered?”
5. **When choosing vocals:** “This bed leaves room for short rhythmic phrases. Do you want a singer who rides that pocket, or someone who opens the space up?”

## Recommended UI Presence

Riffy should not first appear as a chatbot panel. The first expression should be a small, stage-specific **Listening Note** attached to the Fusion Plan card.

```text
RIFFY IS LISTENING
Bagpipes can lead this world without filling every bar.

Choose their job:
[ Carry the hook ] [ Trade phrases ] [ Haunt the edges ]

Or: “Tell me what you hear.”
```

The first three choices are role cards that create valid compiler values. “Tell me what you hear” opens a conversation when a creator needs language rather than a predefined path. The collaboration remains optional, but no longer invisible.

## What Must Be Built Before This Is Honest

1. The compiler must support a structured Fusion Plan and render the Double-Reinforcement Structure deterministically.
2. The live Instrument Palette and assistant knowledge must describe the current MiniMax path, not the retired Stable Audio assumptions.
3. Riffy needs a dedicated `session` context, including selected anchor, Fusion Plan state, active Match Family, and current creative stage.
4. Riffy’s responses should return constrained plan edits as well as prose, so the room can apply a creator-approved change rather than asking the user to manually paste a paragraph into a prompt field.
5. The exact plan and final prompt must be stored with each fusion bed for listening, learning, and later refinement.

## Recommended Implementation Order

First, build the compiler and a non-conversational Fusion Plan card. Use a small set of role choices with the proven prompt rules. Test several anchors and confirm the final prompt is structurally correct every time.

Second, add Riffy as an unobtrusive listening note that can recommend or explain the existing role choices. This makes the partner visible without making the generation path dependent on an LLM conversation.

Third, allow a creator to open a richer conversation and have Riffy propose plan edits. Riffy should never silently overwrite the plan; every change remains visible and creator-approved.

This order gives Strawberry Riff the posture of a collaboration partner while keeping the technical system trustworthy. The room does not ask the creator to learn prompt engineering. It asks better musical questions, preserves the answers, and lets the creator decide when surprise is welcome.
