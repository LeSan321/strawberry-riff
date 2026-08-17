# Riffy as a Fusion Plan Translation Partner

**Status:** Design direction for discussion before Fusion Plan v2 implementation  
**Purpose:** Help a creator turn a vague, rich, or verbose musical idea into the established character-disciplined fusion prompt structure without displacing the creator’s authorship.

---

## 1. The Design Problem

Strawberry Riff’s fusion workflow now has a demonstrated constraint: MiniMax Music 3.0 responds more reliably when the instruction is a compact musical architecture rather than a loose style phrase. The prompt needs to preserve an acoustic anchor, a specific musical role for that anchor, a world or context, a rhythm and harmonic relationship, a future vocal relationship, and one tempo.

Most creators will not arrive with that grammar. They may arrive with a feeling, a location, a memory, a genre collision, a short phrase, or a long paragraph. None of those forms is inferior. They simply require translation into the prompt’s available structure.

> **Riffy’s responsibility is to preserve the creator’s meaning while making the music-generation instruction legible to the model.**

Riffy is therefore not the hidden author of a prompt. Riffy is the partner who helps a person hear what they have already said, condense it, and decide whether the resulting musical plan still feels like theirs.

---

## 2. The Boundary Between Riffy and the Compiler

The compiler and Riffy have different jobs. Keeping that boundary firm protects both output reliability and human authorship.

| Layer | Owner | Responsibility | Must not do |
|---|---|---|---|
| **Instrument Bible** | System | Preserve the anchor’s acoustic identity | Guess the creator’s story or aesthetic intent |
| **Fusion Plan Compiler** | System | Enforce the double-reinforcement prompt form and character budget | Invent cultural framing or replace creator choices |
| **Riffy** | Collaboration partner | Listen, reflect, condense, and propose creator-editable plan fields | Silently overwrite the creator’s idea or write unrestricted final prompts |
| **Creator** | Human | Choose what the music means, revise the proposal, and approve the plan | Learn MiniMax prompt syntax |

The compiler remains deterministic. Once the creator approves a structured plan, the same inputs produce the same prompt shape. Riffy may help form the plan, but cannot bypass its structural safeguards.

---

## 3. Riffy’s Four-Move Interaction

Riffy should not begin as a permanent chat panel. The first implementation should be a short, stage-aware exchange embedded in the Fusion Plan card.

### Move 1 — Listen

The creator may type anything into an optional invitation field:

> **What are you reaching for?**  
> A feeling, place, contradiction, sound, memory, or fully formed musical idea is enough.

Riffy retains the original text unchanged as a private creation note. It does not treat word count or lack of technical vocabulary as a deficiency.

### Move 2 — Reflect

Riffy gives one compact reflection, not a lecture:

> *I hear a rowdy Highland dance pulled into an American Southern night—bright bagpipe calls over a hard-driving, playful rhythm section.*

The reflection demonstrates listening. It makes any misunderstanding visible before a prompt is assembled.

### Move 3 — Condense into a Plan Draft

Riffy presents an editable structured plan—not hidden text—such as:

| Plan field | Draft | Creator control |
|---|---|---|
| **Cultural / regional lens** | American Southern roots | Edit, keep, or remove |
| **Musical world** | Festive Highland-rockabilly dance | Edit in plain language |
| **Rhythm & harmony** | Cyber-rockabilly shuffle, walking upright bass, I–IV–V motion | Edit or choose a simpler rhythm card |
| **Anchor’s job** | Lead-guitar replacement: calls, fills, and solo breaks | Select from role cards |
| **Voice relationship** | Open phrases for a later singer | Select from relationship cards |
| **Tempo** | 160 BPM | Edit directly |

### Move 4 — Ask for Approval

Riffy asks a real authorship question:

> **Does this still sound like what you meant?**

The creator can choose **Keep this plan**, **Tune it**, or **Start again**. Generation does not occur from an unapproved Riffy draft.

---

## 4. Prompt-Budget Discipline

The final MiniMax instruction has a tight budget. Riffy therefore works in fields, not prose accumulation.

```text
[Anchor identity: system-owned Instrument Bible block]
+ [Creator-owned cultural / regional lens]
+ [Creator-owned musical world]
+ [Creator-owned rhythm and harmonic context]
— [System-shaped repeated anchor role]
+ [Creator-approved vocal relationship]
+ [Single tempo]
```

The compiler should retain a configurable hard ceiling below the provider’s prompt limit. It should measure the final instruction before generation and explain any compression in ordinary language. For example:

> *Your plan is a little long for a reliable generation prompt. I kept the bagpipe role, Southern context, shuffle rhythm, and tempo; I shortened two descriptive phrases. Review the compressed plan before continuing.*

Riffy should prioritize meaning-bearing information in this order:

1. The named acoustic anchor and its repeated musical job.
2. The creator’s selected cultural or regional lens.
3. The rhythmic and harmonic relationship that defines the fusion.
4. The later vocal relationship, if the bed is intended for a voice.
5. Extra imagery, mood adjectives, and supporting references.

This prevents decorative language from evicting the musical facts MiniMax needs to hold onto.

---

## 5. Three Creator Paths

The same interaction must respect different levels of readiness.

| Creator starting point | Riffy response | Result |
|---|---|---|
| **Vague impulse** | Asks one narrow musical question only if needed: “Should the bagpipe lead, answer, or color the edges?” | A small usable plan without demanding expertise |
| **Verbose, thoughtful idea** | Reflects the core meaning, separates it into plan fields, and preserves a private source note | The creator’s complexity is condensed rather than discarded |
| **Already has a full fusion brief** | Offers an advanced “Import a full brief” path, parses it into fields, and shows what it retained | Experienced creators stay in control without needing to rewrite the compiler’s grammar |

The third path is important. A skilled user should be able to author a detailed direction, but the system should still parse and validate it rather than blindly concatenate it with another complete structural block.

---

## 6. Guardrails for Trust

Riffy should follow these constraints from the first implementation:

1. **No silent authorship.** Every proposed interpretation is visible and editable.
2. **No invented cultural identity.** Riffy may clarify a user’s named context but must not attach regional, ethnic, or historical labels the creator did not supply or approve.
3. **No generic flattening.** “Cinematic,” “vibey,” and “uplifting” cannot replace the concrete rhythm, role, or regional information the creator gave.
4. **No model-grammar burden.** The creator never has to learn why the prompt uses a repeated anchor role; the plan presents musical choices instead.
5. **No forced conversation.** The creator may ignore Riffy, complete the plan manually, or use an advanced authored brief.
6. **Full audit trail.** Store the original creator note, Riffy’s draft fields, creator revisions, and exact compiled prompt with the generation.

---

## 7. The First UI Expression

The Session Room should not suddenly turn into a chat application. Riffy’s presence can be quiet and embodied:

```text
Fusion Plan
──────────────────────────────────────────────────────
What are you reaching for?                         [optional]
[Creator note........................................]

Riffy heard: “A rowdy Highland dance in a Southern night.”
                                              [Tune this read]

Your musical plan
[Regional lens] [Musical world] [Rhythm & harmony]
[Anchor job]    [Voice relationship] [Tempo]

[Preview plan]                         [Generate fusion bed]
```

The phrase **“Riffy heard”** is more relational than **“AI summary,”** but it remains modest. It signals attention, not authority.

The full compiled prompt can remain behind an **Inspect the musical plan** disclosure. Users should see the components and outcomes first; advanced creators can inspect the exact model instruction when they choose.

---

## 8. Recommended Build Order

1. Build **Fusion Plan v2** fields and deterministic prompt-budget validation with no Riffy generation yet.
2. Add a compact **Riffy reflection + draft-plan** endpoint that returns structured, editable fields.
3. Store original notes, drafts, revisions, and compiled prompts for generation history.
4. Use the new Music 3.0 comparison route to evaluate whether Riffy-assisted plans preserve anchors and fusion roles more reliably than manual direction alone.
5. Only then consider richer conversational or iterative Riffy interaction.

This order makes Riffy’s helpfulness measurable. The assistant becomes more valuable because there is a reliable musical structure for it to help the creator inhabit.
