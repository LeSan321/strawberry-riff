# Vocal Accent & Region Bible: Sample Materials Assessment

## Executive Assessment

The three sampled documents are **not a dead end** and do not justify starting over. They contain a strong, coherent foundation and two profile-level drafts that are already materially useful. The problem is not that there is too little knowledge; it is that the knowledge exists at **three different levels of abstraction** and has not yet been separated for its different jobs.

> **Recommendation:** Selectively salvage the material. Keep the foundation document as the conceptual ontology, normalize the profile documents into a smaller canonical profile schema, and derive compact, tested runtime prompt blocks only after validation. Do not feed the long-form documents directly into MiniMax or the live prompt builder.

## What the Samples Contain

| Sample | Best role | Strengths | Do not use it as |
|---|---|---|---|
| `Musical-Linguistic Vocal Instrument Bible pass 1` | **Foundational doctrine and controlled-vocabulary reference** | It correctly distinguishes speech accent from sung identity; maps phonetics, prosody, timbre, groove, lyrics, context, neutralization, and production; provides useful vocabulary and schema thinking. | A runtime prompt library or one profile per user choice. Its 12 layers are too broad and token-heavy for direct injection. |
| `Pass 2.3 Irish English Folk / Electronic Vocal Instrument` | **Parent-profile source material** | It has clear scope, respectful non-caricature constraints, variation policy, lyric policy, accent audibility guidance, register considerations, and practical prompt language. | A universal “Celtic” profile or proof that every claim is ready for production. It must be distilled and tested. |
| `German L1 English General Electronic / Pop Vocal Instrument` | **Parent-profile source material** | It separates L1 background from sung language, foregrounds timing and consonant behavior, guards against stereotype, and names genre-specific neutralization risks. | A replacement for all German regional or genre identities. It should remain a broad parent, not an over-generalized endpoint. |

## The Most Valuable Findings to Preserve

The material already contains several insights that directly fit Strawberry Riff’s tested approach.

| Knowledge element | Why it matters in Riff | Destination |
|---|---|---|
| **Singing neutralizes some speech markers** | This matches live testing: accent audibility changes with register, tempo, sustained notes, and production. | `singingSignals.registerGuidance`, validation tests |
| **Identity must be rendered through multiple signals** | This supports the existing three-signal model: musical frame, phonetic delivery, and dialectal lyric support. | Compact prompt blocks and lyric policy |
| **Readable lyrics should be preserved by default** | This prevents caricature; dialectal lyric substitutions should be creator-approved and purposeful. | `lyricSignals` and Riffy guidance |
| **Region is not a single sound** | Training, genre, migration, L1/L2 context, register, and production alter what remains audible. | `scopeNote`, variation notes, clarification questions |
| **Avoid lists are substantive safeguards** | “Not stage-Irish,” “not villain voice,” and similar constraints are valuable collapse-prevention data. | Negative constraints |

## The Structural Problem to Correct

The drafts combine at least four things that should be related but not fused into one deployable record:

1. **Regional / language identity** — for example, Irish English or German L1 English.
2. **Genre and scene behavior** — for example, folk-electronic, synthpop, dark pop, or ambient.
3. **Voice-as-instrument choices** — register, timbre, phrase movement, rhythmic placement, and recording treatment.
4. **Model strategy** — compact prompt wording, negative gates, lyric support, and validation evidence.

If every combination becomes its own full document, the collection will grow combinatorially and become difficult to maintain. Instead, the Bible should have a modular relationship:

```text
Parent identity profile
      + genre / scene modifier
      + vocal archetype and register
      + lyric-support level
      = compact tested runtime accent plan
```

For example, **Irish English** should be a parent identity profile. **Folk-electronic** should be a compatible scene modifier. **Low storytelling baritone** or **mid-register intimate mezzo** should be vocal choices. The runtime result can then be precise without creating a separate encyclopedic profile for every combination.

## Relationship to the Target Accent & Region Schema

The mining packet’s `AccentRegionProfile` is a better runtime target than the 12-layer foundation. The current samples map into it well.

| Target field | Sample-material source | Assessment action |
|---|---|---|
| `identity` | Profile identity blocks, aliases, regional variation policy, non-caricature notes | Preserve and normalize |
| `singingSignals` | Accent/pronunciation, prosody, register, neutralization sections | Distill to the 3–6 cues that are most audible in singing |
| `lyricSignals` | Orthography, code-switching, and dialect guidance | Preserve policy; derive only carefully approved substitutions |
| `promptBlocks` | Model-facing descriptions plus role-specific phrasing | Rewrite into compact three-signal blocks |
| `fusionContext` | Genre-context and “avoid genre confusion” sections | Preserve as collapse risks and supportive contexts |
| `riffyGuidance` | User-intent parsing, ambiguities, cultural-care notes | Preserve; this is exceptionally useful for Riffy |
| `validation` | Not yet sufficiently developed in the samples | Add through controlled Music 3.0 tests |

## What Requires Caution

The documents are rich, but not every attractive statement should become live runtime data. The specialist assistant’s prose should be tagged as **candidate knowledge** until a profile has passed the validation protocol.

| Risk | Why it matters | Safeguard |
|---|---|---|
| Broad regional labels | A country or language community contains many distinct varieties. | Keep a clear `scopeNote`; default to broad, moderate rendering unless the creator asks for a more specific tested profile. |
| Accent + genre conflation | “German” is not inherently robotic, and “Irish” is not inherently folk or fantasy. | Keep identity, genre modifier, and vocal archetype separate. |
| Token overload | MiniMax prompt budgets are tight and the new Fusion Plan already has structural obligations. | Extract only high-yield singing cues; retain the long form as reference data. |
| Eye-dialect / caricature | Phonetic spelling can become parody or make lyrics unusable. | Default to readable lyrics; use creator-approved dialect support only where testing shows it helps. |
| Unverified specificity | Some technical descriptions may be plausible but not survive actual singing or model behavior. | Label source confidence and validate through baseline, prompt-only, three-signal, register, and genre-tension tests. |

## Recommended Selective-Salvage Workflow

### 1. Triage the 18 documents by function

Do not process them all as equal profiles. Build a one-line inventory with four categories:

| Category | Keep as | Example |
|---|---|---|
| Foundation / ontology | Reference chapter | The 12-layer Musical-Linguistic foundation |
| Parent identity profile | Canonical profile candidate | Irish English; German L1 English |
| Child or scene modifier | Composable modifier candidate | Irish folk-electronic; German dark-pop |
| Test / exploration note | Validation evidence or research appendix | A comparison, partial pass, or abandoned line of inquiry |

### 2. Extract a one-page candidate card per parent profile

For each parent profile, pull only the following fields:

```text
Scope and non-scope
High-yield singing signals
Register guidance
Lyric-support policy
Genre / collapse risks
Compact prompt candidate
Riffy clarification questions
Source confidence
```

### 3. Keep the full prose as the source archive

The original documents remain valuable. They give Riffy nuance and provide an audit trail for why a compact profile contains a particular cue. They simply should not be copied wholesale into live prompts.

### 4. Validate before promoting

Start with a deliberately small first cohort:

1. **Celtic / Highland** — already has creator-test evidence and a live profile.
2. **Irish English** — the strongest profile candidate in the samples.
3. **German L1 English** — a useful contrast because it tests L1 influence in electronic-pop contexts.

For each, compare baseline, prompt-only, three-signal lyric support, low/mid/high register, familiar/unfamiliar fusion, and sparse/dense lyric versions.

## Recommendation on the Remaining Fifteen Documents

Do **not** start the mining process over. Do **not** upload all fifteen at once either. First send a simple title list, or share one representative item from each functional category above. Then we can create the inventory and determine which documents deserve careful extraction, which collapse into a parent profile, and which are better treated as test notes.

The productive next move is a **salvage pass**, not a restart:

> Preserve the intellectual work. Separate the ontology from the profile data. Distill profile data into compact runtime candidates. Let creator listening tests—not the volume of prose—determine what graduates into the live Bible.
