# Instrument Palette to MiniMax: Pipeline Audit and Redesign Recommendation

## Purpose

This document records how an Instrument Palette selection currently becomes a MiniMax bespoke generation prompt, why the present system drifted away from the proven Double-Reinforcement Structure, and how a revised workflow can make the translation from creator intent to model instruction visible, reliable, and collaborative.

## What Happens Today

The current path is functional, but too thin for the musical responsibility it carries.

```text
Creator selects Bagpipes in Instrument Palette
        ↓
Drawer stores sample URL, ID, name, family, description, and tags
        ↓
Generate / Session receive that context and offer Quick or Bespoke mode
        ↓
Creator enters front-facing Art Direction text
        ↓
generateBespoke sends the raw Art Direction and palette instrument ID to server
        ↓
buildBespokePrompt creates:
    [Instrument Bible identity] + [raw creator Art Direction] + [generic vocal-lane instruction]
        ↓
MiniMax receives the assembled text prompt and the palette sample as an instrumental reference
```

The crucial prompt builder currently has no notion of the anchor instrument's **role** in the target fusion. It does not construct a second structural mention of the instrument, choose a canonical role to replace, apply rhythmic and harmonic scaffolding, or validate that the final prompt contains one clear BPM and an explicit anchor job.

## Why the Bagpipe-Samba Prompt Drifted

The current template supplied a strong identity declaration for the bagpipe, but then appended a broad creator description followed by a generic instruction to leave the melodic top line open. This does not invoke the established Double-Reinforcement Structure.

The proven structure requires two blocks:

```text
Block 1 — Identity
Instrument: Great Highland Bagpipe — acoustic identity, articulation, resonance, cultural or regional framing.

Block 2 — Function
on [specific rhythm section] — Great Highland Bagpipe: [reinforced acoustic properties] replacing [canonical lead role], [explicit musical behavior] over [harmonic structure], [one BPM].
```

This is materially different from mentioning a bagpipe once, adding a genre phrase, and then globally restricting melodic foreground. In the earlier proven bagpipe-rockabilly prompt, the second block tells MiniMax exactly what the bagpipe must *do*: replace lead guitar, play high-energy fills and solo breaks, and live over a named harmonic structure.

## Concrete Pipeline Gaps

| Layer | Current behavior | Missing contract |
|---|---|---|
| Instrument Palette catalog | Provides sample, ID, name, description, family, and tags | Role templates, role families, canonical lead replacement, and fusion-safe structural hooks |
| Front-facing Art Direction | Accepts one free-form text field | A visible distinction between the creator's world / groove idea and the system's structural translation |
| Prompt builder | Concatenates identity, free text, and a generic vocal-lane sentence | Double reinforcement, instrument role assignment, single-BPM validation, harmonic and rhythmic assembly |
| Session workflow | Carries the selected instrument into bespoke creation | A moment where the creator can see and shape the musical job before a generation is spent |
| Riffy | Generic conversational assistant with an instrument-palette knowledge base | Session context, structured fusion-plan output, prompt approval, and awareness of the live MiniMax pipeline |
| Audit trail | Stores the final conditioned prompt in generation metadata | A named structured plan and a readable assembled-prompt review view |

The Riff Assistant knowledge base also still describes the older Stable Audio Bespoke model, while live code sends a MiniMax Music 2.6 request. This mismatch must be corrected before Riffy can responsibly guide creators through the live workflow.

## Recommendation: A Hybrid, Not an Either/Or Decision

Riffy should not replace the deterministic prompt compiler. The compiler must own the musical invariants that proved reliable in testing. Riffy should make the translation process legible, responsive, and collaborative.

```text
Creator's language
        ↓
Riffy translation conversation or quick plan card
        ↓
Structured Fusion Plan (constrained fields)
        ↓
Deterministic prompt compiler
        ↓
Stored assembled prompt + MiniMax request
```

### The Deterministic Prompt Compiler Must Guarantee

1. The selected Instrument Bible identity becomes Block 1.
2. The selected instrument receives a concrete role in Block 2.
3. The role matches the instrument family: lead, melodic counterline, foundation, drone, pulse, or texture.
4. There is one explicit BPM, only in Block 2.
5. The rhythmic section and harmonic behavior are explicit where the instrument is elastic enough to require it.
6. The vocal-space instruction is role-aware. It must preserve a later singer's lane without erasing the anchor instrument's audible identity.
7. The exact structured plan and final assembled prompt are stored with the generation.

### Riffy's Proper Role

Riffy can ask the questions a fixed template cannot answer without making the creator learn prompt engineering:

* “Should the bagpipes lead, trade phrases with the rhythm section, or haunt the track as an atmosphere?”
* “Do you want the samba to feel street-parade bright, cinematic and coastal, or dark and percussive?”
* “Should the eventual singer have a spacious melodic lane, a rhythmic pocket, or a call-and-response relationship with the bagpipes?”

Riffy should return a constrained **Fusion Plan**, not an opaque paragraph:

| Fusion Plan field | Example |
|---|---|
| Acoustic anchor | Great Highland Bagpipe |
| Target world | Cyber rockabilly with samba percussion |
| Anchor role | Lead-guitar replacement; recurring fills and solo breaks |
| Rhythm section | Walking upright bass, slapback snare shuffle, palm-muted guitar, samba hand percussion |
| Harmonic frame | Steady I–IV–V progression |
| Tempo | 160 BPM |
| Vocal relationship | Leave verses open after bagpipe calls; preserve instrumental breaks for bagpipe solos |

The deterministic compiler then renders that plan into the proven two-block MiniMax prompt. The creator sees a readable version of the plan and can revise it before spending a generation. Advanced creators can optionally open the final prompt for inspection; they should never have to depend on it.

## Proposed Creator Flow

```text
1. Choose an acoustic anchor from the Instrument Palette.
2. State the musical world in ordinary language.
3. Choose a quick role card or ask Riffy to help translate it.
4. Review the short Fusion Plan: anchor, role, groove, tempo, vocal relationship.
5. Generate the fusion bed.
6. Save the full plan and assembled prompt with the Match Family.
7. Continue into Voice & Words, where the same plan guides lyrics and vocal-fit choices.
```

This keeps the front-facing experience human and collaborative while making the backend prompt path inspectable and reproducible.

## Recommended Next Build Milestone

Do not begin with a full conversational Riffy redesign. First build a **Fusion Plan Compiler** with one or two simple role choices per instrument family and the proven Double-Reinforcement Structure. Store the plan and rendered prompt beside every fusion bed. Then use that stable contract to give Riffy a Session-aware plan-review role.

That sequencing reduces risk: the system becomes reliable before it becomes conversational, and Riffy gains a real structure to help creators shape rather than improvising a hidden prompt on their behalf.
