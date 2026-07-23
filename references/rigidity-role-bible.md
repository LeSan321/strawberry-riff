# The Rigidity & Role Bible (R² Framework)
## Strawberry Riff — Generative Fusion Intelligence

---

## Why This Exists

Generative music models do not only encode sound. They encode **cultural arrangement priors** — learned expectations about which instruments belong together, which harmonic structures define a genre, and which roles each instrument is expected to play. When a user asks for something that conflicts with these priors (bagpipes in rockabilly, didgeridoo in jazz), the model doesn't fail randomly. It fails *structurally* — it substitutes canonical instruments, collapses harmonic complexity, or produces a repetitive placeholder output.

This framework exists to diagnose that structural tension before generation, apply the minimum necessary interventions, and give users the best possible chance of getting what they actually intended.

This is not a creative constraint system. It is a **structural mediation system**. The goal is to help users engineer novelty through controlled constraint shifts — not to prevent them from attempting difficult fusions.

---

## Section 1 — Core Variables

### 1.1 Genre Rigidity Score (GRS)
Measures how strongly a genre enforces its canonical instrumentation, arrangement structure, harmonic grammar, and cultural identity.

| Score | Description | Behavior |
|-------|-------------|----------|
| 5 | Highly rigid | Actively substitutes non-canonical instruments |
| 4 | Structured | Allows limited substitution |
| 3 | Moderately elastic | Accepts hybridization with modifiers |
| 2 | Elastic | Instrument identity can dominate |
| 1 | Highly elastic | Texture-based, minimal enforcement |

### 1.2 Role Flexibility Index (RFI)
Measures how many structural roles an instrument can plausibly occupy.

Roles include: lead melody, harmonic support, bass foundation, rhythmic engine, textural layer.

| Score | Description |
|-------|-------------|
| 5 | Can occupy most roles |
| 4 | Strong lead/support flexibility |
| 3 | Role-constrained but adaptable |
| 2 | Narrow structural function |
| 1 | Highly fixed functional role |

### 1.3 Role Assignment Clarity (RAC)
Measures how explicitly the prompt defines where the instrument sits and what job it performs.

| Score | Description |
|-------|-------------|
| 0 | No explicit role — model guesses |
| 1 | Implied role |
| 2 | Explicit substitution or function stated |

Low RAC → model guesses → substitution risk increases.
High RAC → structural stability increases.

### 1.4 Harmonic Mobility Coefficient (HMC)
Measures how harmonically mobile the genre is.

| Score | Description |
|-------|-------------|
| 1 | Modal/static harmony |
| 3 | Moderate chord changes |
| 5 | Dense / extended harmonic movement |

### 1.5 Drone Pressure Coefficient (DPC)
Measures whether the instrument has fixed-pitch drone behavior that conflicts with harmonic movement.

| Score | Description |
|-------|-------------|
| 0 | No fixed drone |
| 1 | Partial drone behavior |
| 2 | Constant tonic drone |

---

## Section 2 — The Structural Tension Score (STS)

**Formula:**
```
STS = (GRS - RFI) + (HMC × DPC / 2) - RAC
```

**Interpretation:**
- `(GRS - RFI)` → Instrument vs genre rigidity mismatch
- `(HMC × DPC / 2)` → Harmonic conflict pressure from drone instruments
- `-RAC` → Role clarity reduces tension

### STS Interpretation Bands

| STS | Status | Action |
|-----|--------|--------|
| ≤ 0 | ✅ Stable | Fusion likely to succeed without modification |
| 1–2 | ⚠ Mild Instability | Add role clarity OR mild elasticity modifier |
| 3–4 | ⚠⚠ Moderate Instability | Add explicit substitution phrasing + reduce HMC OR add elasticity modifier |
| ≥ 5 | 🚨 High Collapse Risk | Reassign role + reduce HMC + lower GRS via modifier |

### Example Calculations

**Bagpipes in Traditional Rockabilly (no modifier):**
- GRS=5, RFI=4, HMC=2, DPC=2, RAC=1
- STS = (5-4) + (2×2/2) - 1 = 1 + 2 - 1 = **2** → ⚠ Mild Instability
- Explains why it sometimes worked, sometimes drifted

**Bagpipes in Cyber Rockabilly (explicit lead replacement):**
- GRS=3 (modifier applied), RFI=4, HMC=2, DPC=2, RAC=2
- STS = (3-4) + (2×2/2) - 2 = -1 + 2 - 2 = **-1** → ✅ Stable
- Matches confirmed test result

**Didgeridoo as Lead in Bebop Jazz:**
- GRS=5, RFI=2, HMC=5, DPC=2, RAC=1
- STS = (5-2) + (5×2/2) - 1 = 3 + 5 - 1 = **7** → 🚨 High Collapse Risk
- System should reassign to bass foundation, reduce HMC, add modal modifier

---

## Section 3 — Elasticity Modifiers

Elasticity modifiers reduce effective GRS. They are not cosmetic adjectives — they are **schema-softening tokens** that shift the model's prior toward a more permissive arrangement space.

| Modifier | GRS Reduction | Examples |
|----------|---------------|---------|
| Mild | −1 | Neo, Modern, Contemporary, Alt |
| Strong | −2 | Fusion, Cyber, Experimental, Post-, Hybrid |
| Extreme | −3 | Avant-garde, Abstract, Deconstructed |

**Rule:** Only apply elasticity modifiers when STS ≥ 2. Unnecessary elasticity reduces genre identity and produces generic output.

**Adjusted GRS formula:**
```
GRS_effective = GRS - modifier_value
```
Then recalculate STS with GRS_effective before finalizing the prompt.

---

## Section 4 — Genre Architecture Profiles

### Rockabilly (Traditional 1950s)
- **GRS:** 5 | **HMC:** 2
- **Core Roles:** Lead vocal, lead guitar (twang), rhythm guitar, walking upright bass, shuffle snare
- **Rhythmic Engine:** Driving swing feel, bass-led propulsion
- **Harmonic Behavior:** I–IV–V, blues phrasing
- **Instrumentation Enforcement:** High — American roots string bias
- **Elasticity Strategy:** Add cyber / neo / fusion / alt (−1 to −2 GRS)
- **Failure Modes:** Instrument substitution to fiddle/banjo; genre regression to pure rockabilly

### Bebop Jazz
- **GRS:** 5 | **HMC:** 5
- **Core Roles:** Horn lead, piano comping, walking bass, ride cymbal timekeeping
- **Harmonic Behavior:** High mobility, extended chords, rapid changes
- **Elasticity Strategy:** Modal jazz (−1), Fusion jazz (−2)
- **Failure Modes:** Simplification of harmony; instrument replaced by sax/trumpet

### Blues (Traditional Delta/Chicago)
- **GRS:** 4 | **HMC:** 2
- **Core Roles:** Lead guitar/harmonica, rhythm guitar, bass, drums
- **Harmonic Behavior:** I–IV–V, call and response
- **Elasticity Strategy:** Psychedelic blues, electric blues (−1)
- **Failure Modes:** Harmonica/guitar substitution

### Country (Traditional)
- **GRS:** 4 | **HMC:** 2
- **Core Roles:** Lead vocal, acoustic guitar, fiddle, pedal steel, bass, drums
- **Elasticity Strategy:** Alt-country, outlaw country (−1)
- **Failure Modes:** Instrument substitution to fiddle/banjo/steel

### Hip-Hop (Classic Boom Bap)
- **GRS:** 3 | **HMC:** 2
- **Core Roles:** Drum machine, bass line, sampled melody, vocal
- **Instrumentation Enforcement:** Moderate — beat-centric
- **Elasticity Strategy:** Experimental hip-hop, jazz rap (−1)

### Electronic / Techno
- **GRS:** 2 | **HMC:** 1–3
- **Core Roles:** Kick, bass synth, synth lead, atmospheric pads
- **Instrumentation Enforcement:** Low — synthesizer-agnostic
- **Failure Modes:** Rare — high substitution tolerance

### Ambient Drone
- **GRS:** 1 | **HMC:** 1
- **Core Roles:** Texture layers only
- **Instrumentation Enforcement:** Minimal
- **Failure Modes:** None — maximum elasticity

### Indie Rock
- **GRS:** 3 | **HMC:** 3
- **Core Roles:** Vocal, guitar layer(s), bass, drums
- **Instrumentation Enforcement:** Moderate
- **Elasticity Strategy:** Not usually required

### Celtic / Folk (Traditional)
- **GRS:** 4 | **HMC:** 2–3
- **Core Roles:** Fiddle/pipes lead, rhythm guitar/bodhrán, bass
- **Instrumentation Enforcement:** High — cultural instrument bias
- **Failure Modes:** Substitution to fiddle/tin whistle

### Orchestral / Cinematic
- **GRS:** 3 | **HMC:** 3–4
- **Core Roles:** Strings, brass, woodwinds, percussion, piano
- **Instrumentation Enforcement:** Moderate — role-based not instrument-specific
- **Elasticity Strategy:** Hybrid orchestral, neo-classical (−1)

---

## Section 5 — Instrument Role Profiles

### Great Highland Bagpipe
- **RFI:** 4 | **DPC:** 2
- **Primary Roles:** Lead melody, ceremonial fanfare, high-energy solo
- **Secondary Roles:** Textural drone layer
- **Weak Roles:** Bass foundation, subtle background pad
- **Frequency Domain:** Mid-high dominant
- **Cultural Encoding:** Celtic, martial, ceremonial
- **Conflict Risk:** High harmonic mobility genres; dense chord changes
- **Stabilization Strategy:** Reduce harmonic complexity; assign clear substitution role; use elasticity modifier if genre rigid

### Uilleann Pipes
- **RFI:** 4 | **DPC:** 1
- **Primary Roles:** Lead melody, lyrical solo
- **Secondary Roles:** Textural layer
- **Cultural Encoding:** Irish traditional
- **Conflict Risk:** Same as Highland Bagpipe but slightly lower drone pressure
- **Stabilization Strategy:** Same as Highland Bagpipe

### Didgeridoo
- **RFI:** 2 | **DPC:** 2
- **Primary Roles:** Drone foundation, rhythmic overtone pulse
- **Weak Roles:** Melodic lead, harmonic modulation
- **Frequency Domain:** Deep sub-bass to low-mid
- **Cultural Encoding:** Indigenous Australian, world music, ambient
- **Conflict Risk:** High-chord mobility genres; lead dominance framing
- **Stabilization Strategy:** Assign bass replacement role; reduce chord changes; increase atmospheric context; favor modal structures

### Hurdy-Gurdy
- **RFI:** 3 | **DPC:** 2
- **Primary Roles:** Drone foundation, melodic lead (limited range)
- **Secondary Roles:** Textural layer
- **Cultural Encoding:** Medieval European, folk
- **Conflict Risk:** High harmonic mobility; modern genre schemas
- **Stabilization Strategy:** Modal or medieval framing; explicit role assignment

### Erhu (Chinese Two-String Fiddle)
- **RFI:** 4 | **DPC:** 0
- **Primary Roles:** Lead melody, expressive solo, emotional foreground
- **Secondary Roles:** Lyrical countermelody
- **Frequency Domain:** Mid-high, vocal-like
- **Cultural Encoding:** Chinese traditional, East Asian
- **Conflict Risk:** Low — melodic lead role is clear and flexible
- **Confirmed Working:** Lead instrument over industrial techno (Test 6 confirmed)

### Sitar
- **RFI:** 4 | **DPC:** 1
- **Primary Roles:** Lead melody, ornamental solo
- **Secondary Roles:** Textural layer
- **Cultural Encoding:** Indian classical, psychedelic, world fusion
- **Conflict Risk:** Moderate — strong cultural schema

### Kora (West African Harp-Lute)
- **RFI:** 4 | **DPC:** 0
- **Primary Roles:** Lead melody, harmonic arpeggio, textural foundation
- **Cultural Encoding:** West African, world music
- **Conflict Risk:** Low in elastic genres; moderate in rigid Western genres

### Shakuhachi (Japanese Bamboo Flute)
- **RFI:** 4 | **DPC:** 0
- **Primary Roles:** Lead melody, atmospheric solo, meditative foreground
- **Cultural Encoding:** Japanese traditional, Zen, ambient
- **Conflict Risk:** Low — melodic role is clear

### Duduk (Armenian Oboe)
- **RFI:** 4 | **DPC:** 0
- **Primary Roles:** Lead melody, mournful solo, emotional foreground
- **Cultural Encoding:** Armenian, Middle Eastern, cinematic
- **Conflict Risk:** Low — strong melodic identity

### Oud
- **RFI:** 4 | **DPC:** 0
- **Primary Roles:** Lead melody, harmonic accompaniment, rhythmic strumming
- **Cultural Encoding:** Arabic, Turkish, Middle Eastern
- **Conflict Risk:** Moderate in rigid Western genres

### Mbira (Thumb Piano)
- **RFI:** 3 | **DPC:** 0
- **Primary Roles:** Melodic ostinato, textural layer, rhythmic foundation
- **Cultural Encoding:** Zimbabwean, African traditional
- **Conflict Risk:** Moderate — may be absorbed into percussion role

### Gamelan (Ensemble)
- **RFI:** 2 | **DPC:** 1
- **Primary Roles:** Textural layer, atmospheric foundation
- **Conflict Risk:** High in melodically active genres — ensemble nature resists lead role assignment

### Electric Guitar
- **RFI:** 5 | **DPC:** 0
- **Primary Roles:** Lead, rhythm, texture, bass (in some contexts)
- **Conflict Risk:** Very low

### Violin / Fiddle
- **RFI:** 5 | **DPC:** 0
- **Primary Roles:** Lead melody, harmonic support, rhythmic drive
- **Conflict Risk:** Very low

### Cello
- **RFI:** 4 | **DPC:** 0
- **Primary Roles:** Bass foundation, melodic lead, harmonic support
- **Conflict Risk:** Low

### Trumpet
- **RFI:** 4 | **DPC:** 0
- **Primary Roles:** Lead melody, fanfare, harmonic punctuation
- **Conflict Risk:** Low — confirmed working in multiple fusion contexts

### Saxophone (Alto/Tenor)
- **RFI:** 5 | **DPC:** 0
- **Primary Roles:** Lead melody, harmonic support, rhythmic texture
- **Conflict Risk:** Very low

---

## Section 6 — The Mediation Decision Tree

**Step 1 — Identify Genre GRS and HMC**
- GRS ≥ 4 → High enforcement
- GRS ≤ 3 → Moderate/low enforcement

**Step 2 — Identify Instrument RFI and DPC**
- RFI ≥ 4 → Flexible
- RFI ≤ 3 → Role constrained

**Step 3 — Compare (before RAC)**

| Case | Condition | Action |
|------|-----------|--------|
| A | RFI ≥ GRS | Direct substitution viable — maintain genre purity |
| B | RFI = GRS − 1 | Add explicit role clarity; consider mild elasticity modifier |
| C | RFI ≤ GRS − 2 | High instability — reassign role + reduce HMC + add elasticity modifier |

**Step 4 — Check Drone Conflict**
If DPC ≥ 1:
- Avoid high harmonic mobility (HMC ≥ 4)
- Favor modal structures
- Reduce chord density

**Step 5 — Apply Elasticity Modifier if STS ≥ 2**
Only when structural tension is predicted. Unnecessary modifiers reduce genre identity.

**Step 6 — Validate Role Assignment Clarity**
If RAC = 0 or 1, add explicit structural role before generation.

**Step 7 — Validate Prompt Order**
Correct order: **Genre architecture → Role assignment → Acoustic specificity**
Wrong order: Acoustic description → genre name (front-loads instrument schema, increases conflict)

---

## Section 7 — Prompt Construction Rules

### The Correct Prompt Order
1. Genre context with any elasticity modifier applied
2. Core structural roles of the genre (rhythm, harmony, bass)
3. Role substitution statement for the featured instrument
4. Acoustic description of the featured instrument (after role is established)

**Example — Bagpipes in Cyber Rockabilly:**
> *Cyber rockabilly — driving shuffle rhythm, twang guitar texture, walking bass propulsion, I–IV–V harmonic movement — lead melody performed by Great Highland Bagpipe replacing lead guitar — continuous high-register tonal stream with dense harmonic overtones, sustained airflow timbre*

**Example — Didgeridoo in Modal Jazz:**
> *Modal jazz — sparse harmonic movement, sustained tonal centers, brushed percussion, spacious arrangement — bass foundation performed by didgeridoo replacing upright bass — deep sub-bass continuous drone with rhythmic overtone pulses, woody resonant timbre*

### The Em-Dash Rule
Use em-dashes (—) rather than commas to separate major structural clauses. Em-dashes preserve both instruction blocks and force synthesis. Commas allow later context to override earlier context.

### Words to Avoid
Never use production method words that trigger false schema associations:
- "mouth-blown" → triggers vocal/chant schemas
- "hand-crafted" → triggers folk schemas
- "traditional" → triggers cultural rigidity schemas
Use acoustic property language instead: "continuous airflow," "sustained resonance," "overtone-rich."

---

## Section 8 — Riffy's Consultation Role

When a user is experiencing generation failures or wants to attempt a structurally ambitious fusion, Riffy operates as a **music production consultant**, not a generation interface.

**Riffy's job in consultation mode:**
1. Understand what the user wants to *feel and hear* — not just the genre and instrument labels
2. Diagnose the structural tension using the R² framework (compute STS mentally or explicitly)
3. Identify the minimum necessary interventions (elasticity modifier, role reassignment, prompt reordering)
4. Produce a generation-ready prompt using the correct construction order
5. Explain the reasoning briefly if the user wants to understand why

**Riffy does not:**
- Generate music directly
- Apply interventions the user hasn't asked for
- Override a user's explicit intent to attempt a high-STS fusion
- Treat the framework as a rulebook that prevents experimentation

**Creative Override:** If a user explicitly wants to attempt something the framework classifies as high-risk, Riffy warns once and proceeds. User ownership of the creative intent is always preserved.

**Consultation trigger phrases** (when Riffy should shift into R² diagnostic mode):
- "It didn't include the [instrument]"
- "The [instrument] disappeared"
- "It just gave me [genre] without the [instrument]"
- "I want [instrument] in [genre] but it's not working"
- "How do I get [instrument] to show up?"

---

## Section 9 — Known Test Results

These are empirically confirmed outcomes from structured testing:

| Test | Instrument | Genre | Result | Notes |
|------|-----------|-------|--------|-------|
| Confirmed | Great Highland Bagpipe | Cyber Rockabilly | ✅ Success | STS = -1, explicit lead replacement |
| Confirmed | Great Highland Bagpipe | Traditional Rockabilly | ⚠ Inconsistent | STS = 2, stochastic — sometimes works |
| Confirmed | Erhu | Industrial Techno | ✅ Success | STS ≈ 0, erhu preserved as lead |
| Confirmed | Erhu | Industrial Techno | ✅ Success | "Dark and emotional" — erhu not overridden |
| In Progress | Didgeridoo | Jazz (various) | ⚠ Difficult | STS = 7 in bebop; role substitution approach being tested |
| Pending | Didgeridoo | Modal Jazz (bass role) | TBD | STS ≈ 1 if role assigned correctly |

---

*This document is a living reference. Update with new test results as they are confirmed.*
