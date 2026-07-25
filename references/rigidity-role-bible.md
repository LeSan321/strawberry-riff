# The Rigidity & Role Bible (R² Framework)
## Strawberry Riff — Generative Fusion Intelligence
### Version 2.0 — Updated July 2026

---

## Why This Exists

Generative music models do not only encode sound. They encode **cultural arrangement priors** — learned expectations about which instruments belong together, which harmonic structures define a genre, and which roles each instrument is expected to play. When a user asks for something that conflicts with these priors (bagpipes in rockabilly, didgeridoo in jazz), the model doesn't fail randomly. It fails *structurally* — it substitutes canonical instruments, collapses harmonic complexity, or produces a repetitive placeholder output.

This framework exists to diagnose that structural tension before generation, apply the minimum necessary interventions, and give users the best possible chance of getting what they actually intended.

This is not a creative constraint system. It is a **structural mediation system**. The goal is to help users engineer novelty through controlled constraint shifts — not to prevent them from attempting difficult fusions.

**Version 2.0 adds four new control variables** discovered through 40+ systematic generation attempts in June 2026: Cultural Schema Override (CSO), Regional Specificity (RS), Spatial Layering Language (SLL), and Double-Reinforcement Structure (DRS). These discoveries significantly expand what is reliably achievable with the Instrument Palette.

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

Low RAC → model guesses → substitution risk increases. High RAC → structural stability increases.

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

## Section 2 — New Control Variables (Version 2.0)

### 2.1 Cultural Schema Override (CSO)

**Definition:** Explicitly reassigning an instrument's default cultural context to match the target genre's cultural tradition.

Every instrument in the Palette carries a default cultural context descriptor (e.g., "heroic martial Celtic procession context" for the Highland Bagpipe). These descriptors are not decorative — they prime MiniMax's schema toward that cultural tradition. By replacing the default cultural context with the target genre's tradition, you can override the instrument's schema associations before genre conflict occurs.

| CSO Applied | Effect |
|-------------|--------|
| No | Instrument's default cultural schema competes with genre schema |
| Yes | Instrument's cultural identity relocates to match genre tradition |

**Example:**
- Original: *"heroic martial Celtic procession context"*
- Override: *"American Southern roots context"*
- Result: Bagpipes integrate into American roots music schema instead of fighting it

**When to apply:** When the instrument's cultural origin is distant from the target genre's tradition (bagpipes = Scottish, rockabilly = American Southern). CSO doesn't change STS numerically, but it reduces the effective cultural distance between instrument and genre, increasing generation stability. Apply a CSO_bonus of −1 to the adjusted STS.

**The hyphenated hybrid technique:** For maximum stability, combine both cultural identities in a single hyphenated dance/style descriptor: *"highland-rockabilly dance"* holds both traditions simultaneously without forcing the model to choose one. This is more effective than stating them separately.

### 2.2 Regional Specificity (RS)

**Definition:** Using geographic or city-specific regional descriptors to activate sub-schemas within a broader genre category.

MiniMax has granular sub-schemas tied to regional musical traditions. Invoking a specific region activates the instrumental textures, rhythmic patterns, and production characteristics associated with that region's music history. Regional context acts as a cultural blending agent — it doesn't just modify the genre, it introduces third elements (Polka influence in Midwest, Native American echoes in Southwest, Cajun textures in Louisiana).

| Regional Context | Musical Characteristics Activated |
|-----------------|-----------------------------------|
| American Southern roots | Rockabilly, country, blues foundation, twang |
| American Appalachian roots | Folk, mountain music, dulcimer/banjo character |
| American Southwest desert roots | Native American influence, desert imagery, Tex-Mex |
| American Midwest heartland roots | Polka influence (German/Eastern European), straightforward Americana |
| American Pacific Northwest roots | Indie folk, alternative, modern/cooler production |
| American Louisiana bayou roots | Cajun/Zydeco, accordion textures, swamp blues |
| Chicago blues roots | Urban electric blues, shuffle rhythm, bent notes |
| Chicago house music roots | Electronic dance, 4/4 kick, live stage performance tradition |
| West African highlife | Horn-section tradition, polyrhythmic percussion, upbeat |

**When regional steering fails:**
- When the regional schema is too strong relative to the instrument's character (Chicago blues overpowered bagpipes — urban electric blues is a dominant training category)
- When the regional tradition has no historical precedent for the instrument type (Brazilian samba + rockabilly fusion was too schema-conflicted for bagpipes to persist)

**Cross-cultural regional steering:** West African highlife worked (bagpipes replaced horn section successfully). Brazilian samba did not (samba + rockabilly fusion too strong, bagpipes disappeared). Regional steering works best when the region has musical traditions that accommodate the instrument's role and the regional schema is moderately strong but not overwhelming.

Apply an RS_bonus of −1 to the adjusted STS when regional specificity is applied and the region has traditions compatible with the instrument's role.

### 2.3 Spatial Layering Language (SLL)

**Definition:** Concrete physical/spatial connectors that tell MiniMax how to stack elements in the arrangement.

MiniMax responds better to concrete spatial metaphors than abstract relational descriptions. "Above it" failed where "on top" succeeded because "on top" is a clear physical instruction. The connector word determines the arrangement hierarchy.

| Connector | Function | Best For |
|-----------|----------|---------|
| `on` | Places first element on top of second element | Melodic/lead instruments over rhythm sections |
| `on top` | Explicit vertical stacking | Foundation instruments with supporting layers above |
| `as [role] under` | Inverted hierarchy (foundation first, elements above) | Bass/drone instruments with other elements layered above |

**Examples:**
- Lead instrument: *"Great Highland Bagpipe — [description] on cyber rockabilly rhythm section..."*
- Foundation instrument: *"Didgeridoo bass layer, warm atmospheric synth pads on top"*
- Inverted: *"Didgeridoo as primary foundation with hand percussion as subtle rhythmic layer on top"*

### 2.4 Double-Reinforcement Structure (DRS)

**Definition:** Mentioning the target instrument twice in the prompt — once as standalone identity declaration, once as functional role assignment within the genre context.

This is the most significant structural discovery of the June 2026 research session. By describing the instrument twice, you increase instruction weight — MiniMax has to honor both mentions. Block 1 locks in instrument identity before genre is introduced. Block 2 assigns the instrument a role within the target genre. The two-block structure with a spatial connector between them is the most reliable architecture discovered to date.

**Structure for lead/melodic instruments:**
```
Instrument: [Name] — [full acoustic description including timbre, articulation, resonance] — [cultural context OR regional override]

on [Elasticity Modifier] [Genre] rhythm section with [specific rhythm instrument 1 + behavior], [specific rhythm instrument 2 + behavior], [specific rhythm instrument 3 + behavior] — [Instrument Name] : [reinforced core acoustic properties] replacing [canonical lead role], [explicit musical behavior description] over [harmonic structure], [single BPM]
```

**Structure for bass/foundation/drone instruments:**
```
Instrument: [Name] — [full acoustic description]

[Instrument name] bass layer, [supporting element description] on top, [atmospheric context], [tempo descriptor], [BPM]
```

**Critical rules:**
- **One BPM instruction only** — always in Block 2. Multiple BPM instructions create tempo conflict and cause collapse.
- **Em-dashes in Block 2** preserve instruction hierarchy — commas allow later context to override earlier context.
- **Connector word matters** — "on" for lead instruments, "as [role] under" or "on top" for foundation instruments.
- **Colon notation in Block 2** — `[Instrument Name] : [properties]` reinforces identity within the genre context.

---

## Section 3 — The Structural Tension Score (STS)

### Original Formula
```
STS = (GRS - RFI) + (HMC × DPC / 2) - RAC
```

### Updated Formula (Version 2.0)
```
STS_adjusted = STS - CSO_bonus - RS_bonus
```

Where:
- `CSO_bonus = 1` if cultural context has been explicitly overridden to match target genre
- `RS_bonus = 1` if regional specificity is applied and the region has traditions compatible with the instrument's role

### STS Interpretation Bands

| STS | Status | Action |
|-----|--------|--------|
| ≤ 0 | ✅ Stable | Fusion likely to succeed without modification |
| 1–2 | ⚠ Mild Instability | Add role clarity OR mild elasticity modifier |
| 3–4 | ⚠⚠ Moderate Instability | Add explicit substitution phrasing + reduce HMC OR add elasticity modifier |
| ≥ 5 | 🚨 High Collapse Risk | Reassign role + reduce HMC + lower GRS via modifier |

### Example Calculations

**Bagpipes in Traditional Rockabilly (no interventions):**
- GRS=5, RFI=4, HMC=2, DPC=2, RAC=1
- STS = (5-4) + (2×2/2) - 1 = **2** → ⚠ Mild Instability
- Explains stochastic results: sometimes works, sometimes drifts

**Bagpipes in Cyber Rockabilly with American Southern roots + DRS:**
- GRS=3 (cyber modifier), RFI=4, HMC=2, DPC=2, RAC=2 (DRS provides explicit role)
- STS = (3-4) + (2×2/2) - 2 = **-1**
- CSO_bonus = 1, RS_bonus = 1
- STS_adjusted = -1 - 1 - 1 = **-3** → ✅ Highly Stable
- Matches confirmed repeatable test results

**Didgeridoo as Lead in Bebop Jazz:**
- GRS=5, RFI=2, HMC=5, DPC=2, RAC=1
- STS = (5-2) + (5×2/2) - 1 = **7** → 🚨 High Collapse Risk
- No CSO or RS can rescue this — wrong role assignment entirely

**Didgeridoo as Bass Foundation in Ambient:**
- GRS=1, RFI=2, HMC=1, DPC=2, RAC=2 (SLL applied)
- STS = (1-2) + (1×2/2) - 2 = **-2** → ✅ Stable
- Matches confirmed test results

---

## Section 4 — Elasticity Modifiers

Elasticity modifiers reduce effective GRS. They are schema-softening tokens that shift the model's prior toward a more permissive arrangement space.

| Modifier | GRS Reduction | Examples |
|----------|---------------|---------|
| Mild | −1 | Neo, Modern, Contemporary, Alt |
| Strong | −2 | Fusion, Cyber, Experimental, Post-, Hybrid |
| Extreme | −3 | Avant-garde, Abstract, Deconstructed |

**Rule:** Only apply elasticity modifiers when STS ≥ 2. Unnecessary elasticity reduces genre identity and produces generic output.

---

## Section 5 — Genre Architecture Profiles

### Rockabilly (Traditional 1950s)
- **GRS:** 5 | **HMC:** 2
- **Core Roles:** Lead vocal, lead guitar (twang), rhythm guitar, walking upright bass, shuffle snare
- **Harmonic Behavior:** I–IV–V, blues phrasing
- **Instrumentation Enforcement:** High — American roots string bias
- **Elasticity Strategy:** Add cyber / neo / fusion / alt (−1 to −2 GRS)
- **Optimal BPM for bagpipes:** 155–165 (traditional reel tempo aligns with rockabilly tempo)
- **Failure Modes:** Instrument substitution to fiddle/banjo; genre regression to pure rockabilly

### Bebop Jazz
- **GRS:** 5 | **HMC:** 5
- **Core Roles:** Horn lead, piano comping, walking bass, ride cymbal timekeeping
- **Harmonic Behavior:** High mobility, extended chords, rapid changes
- **Elasticity Strategy:** Modal jazz (−1), Fusion jazz (−2)
- **Failure Modes:** Simplification of harmony; instrument replaced by sax/trumpet

### Blues (Traditional Delta/Chicago)
- **GRS:** 4 | **HMC:** 2
- **Note:** Chicago blues schema is particularly dominant — bagpipes failed to persist here
- **Elasticity Strategy:** Psychedelic blues, electric blues (−1)

### Country (Traditional)
- **GRS:** 4 | **HMC:** 2
- **Core Roles:** Lead vocal, acoustic guitar, fiddle, pedal steel, bass, drums
- **Elasticity Strategy:** Alt-country, outlaw country (−1)

### Hip-Hop (Classic Boom Bap)
- **GRS:** 3 | **HMC:** 2
- **Core Roles:** Drum machine, bass line, sampled melody, vocal
- **Elasticity Strategy:** Experimental hip-hop, jazz rap (−1)

### Electronic / Techno / Industrial
- **GRS:** 2 | **HMC:** 1–3
- **Core Roles:** Kick, bass synth, synth lead, atmospheric pads
- **Instrumentation Enforcement:** Low — synthesizer-agnostic
- **Confirmed working:** Erhu as lead instrument over industrial techno foundation

### Ambient Drone
- **GRS:** 1 | **HMC:** 1
- **Core Roles:** Texture layers only
- **Instrumentation Enforcement:** Minimal
- **Confirmed working:** Didgeridoo bass layer + synth pads; didgeridoo + hand percussion

### Indie Rock
- **GRS:** 3 | **HMC:** 3
- **Core Roles:** Vocal, guitar layer(s), bass, drums
- **Instrumentation Enforcement:** Moderate

### Celtic / Folk (Traditional)
- **GRS:** 4 | **HMC:** 2–3
- **Core Roles:** Fiddle/pipes lead, rhythm guitar/bodhrán, bass
- **Instrumentation Enforcement:** High — cultural instrument bias

### Orchestral / Cinematic
- **GRS:** 3 | **HMC:** 3–4
- **Core Roles:** Strings, brass, woodwinds, percussion, piano
- **Instrumentation Enforcement:** Moderate — role-based not instrument-specific

### West African Highlife
- **GRS:** 3 | **HMC:** 3
- **Core Roles:** Horn section lead, polyrhythmic percussion, bass
- **Confirmed working:** Bagpipes replaced horn section successfully
- **Why it works:** Highlife uses horns as lead; bagpipes can occupy that role

---

## Section 6 — Instrument Role Profiles

### Great Highland Bagpipe
- **RFI:** 4 | **DPC:** 2
- **Primary Roles:** Lead melody, ceremonial fanfare, high-energy solo
- **Default Cultural Schema:** Celtic/Scottish martial tradition
- **Successful CSO overrides:** American Southern roots, American Appalachian roots, West African highlife
- **Failed contexts:** Brazilian samba (schema too conflicted), Chicago blues (blues schema too dominant)
- **Optimal BPM range:** 155–165 BPM
- **Key discovery:** "American context" + "highland-rockabilly dance" (hyphenated hybrid) balances both cultural identities without collapse
- **Confirmed working:** Cyber rockabilly with DRS + CSO + RS (repeatable)

### Uilleann Pipes
- **RFI:** 4 | **DPC:** 1
- **Primary Roles:** Lead melody, lyrical solo
- **Default Cultural Schema:** Irish traditional
- **Stabilization Strategy:** Same as Highland Bagpipe; slightly lower drone pressure

### Didgeridoo
- **RFI:** 2 | **DPC:** 2
- **Primary Roles:** Drone foundation, rhythmic overtone pulse
- **Weak Roles:** Melodic lead, harmonic modulation — do not attempt
- **Frequency Domain:** Deep sub-bass to low-mid
- **Default Cultural Schema:** Indigenous Australian, world music, ambient
- **Only works in architecturally minimal contexts:** Ambient, cinematic, soundscape, ritual/ceremonial
- **Cannot coexist with:** Defined bass lines, complex rhythm sections, HMC ≥ 3
- **Supporting elements that work:** Synth pads (textural, non-competing), hand percussion (sparse, non-driving)
- **Supporting elements that fail:** Tribal percussion (activates competing rhythmic schema), jazz rhythm section (too architecturally complex)
- **Optimal tempo:** 50–80 BPM — any faster and MiniMax activates movement-based schemas
- **Confirmed working:** Didgeridoo bass layer + warm atmospheric synth pads on top (60 BPM); didgeridoo as primary foundation + hand percussion on top (70 BPM)

### Hurdy-Gurdy
- **RFI:** 3 | **DPC:** 2
- **Primary Roles:** Drone foundation, melodic lead (limited range)
- **Default Cultural Schema:** Medieval European, folk
- **Confirmed working:** Medieval/folk contexts with hand percussion on top
- **Note:** Generated output tends to be cleaner/more polished than real hurdy-gurdy — lacks mechanical noise, bow friction, and buzzing overtones of the acoustic instrument

### Erhu (Chinese Two-String Fiddle)
- **RFI:** 4 | **DPC:** 0
- **Primary Roles:** Lead melody, expressive solo, emotional foreground
- **Frequency Domain:** Mid-high, vocal-like
- **Default Cultural Schema:** Chinese traditional, East Asian
- **Conflict Risk:** Low — melodic lead role is clear and flexible
- **Why it works:** Erhu's role as melodic lead doesn't conflict with electronic rhythm sections — it occupies a distinct frequency and expressive register
- **Confirmed working:** Lead instrument over industrial techno foundation (Test 6, repeatable)

### Sitar
- **RFI:** 4 | **DPC:** 1
- **Primary Roles:** Lead melody, ornamental solo
- **Default Cultural Schema:** Indian classical, psychedelic, world fusion
- **Conflict Risk:** Moderate — strong cultural schema
- **Next phase:** Systematic testing with confirmed DRS formula

### Kora (West African Harp-Lute)
- **RFI:** 4 | **DPC:** 0
- **Primary Roles:** Lead melody, harmonic arpeggio, textural foundation
- **Default Cultural Schema:** West African, world music
- **Conflict Risk:** Low in elastic genres; moderate in rigid Western genres
- **Estimated STS for drum and bass:** ~0 (stable without modification)
- **Next phase:** Systematic testing with confirmed DRS formula

### Shakuhachi (Japanese Bamboo Flute)
- **RFI:** 4 | **DPC:** 0
- **Primary Roles:** Lead melody, atmospheric solo, meditative foreground
- **Default Cultural Schema:** Japanese traditional, Zen, ambient
- **Conflict Risk:** Low — melodic role is clear
- **Next phase:** Systematic testing with confirmed DRS formula

### Duduk (Armenian Oboe)
- **RFI:** 4 | **DPC:** 0
- **Primary Roles:** Lead melody, mournful solo, emotional foreground
- **Default Cultural Schema:** Armenian, Middle Eastern, cinematic
- **Conflict Risk:** Low — strong melodic identity

### Oud
- **RFI:** 4 | **DPC:** 0
- **Primary Roles:** Lead melody, harmonic accompaniment, rhythmic strumming
- **Default Cultural Schema:** Arabic, Turkish, Middle Eastern
- **Conflict Risk:** Moderate in rigid Western genres
- **Next phase:** Systematic testing with confirmed DRS formula

### Mbira (Thumb Piano)
- **RFI:** 3 | **DPC:** 0
- **Primary Roles:** Melodic ostinato, textural layer, rhythmic foundation
- **Default Cultural Schema:** Zimbabwean, African traditional
- **Conflict Risk:** Moderate — may be absorbed into percussion role

### Electric Guitar
- **RFI:** 5 | **DPC:** 0
- **Conflict Risk:** Very low

### Violin / Fiddle
- **RFI:** 5 | **DPC:** 0
- **Conflict Risk:** Very low

### Cello
- **RFI:** 4 | **DPC:** 0
- **Conflict Risk:** Low

### Trumpet
- **RFI:** 4 | **DPC:** 0
- **Conflict Risk:** Low — confirmed working in multiple fusion contexts

### Saxophone (Alto/Tenor)
- **RFI:** 5 | **DPC:** 0
- **Conflict Risk:** Very low

---

## Section 7 — Confirmed Prompt Templates

### Template A: Lead/Melodic Instruments (Bagpipes, Erhu, Sitar, etc.)

```
Instrument: [Name] — [full acoustic description including timbre, articulation, resonance] — [cultural context OR regional override]

on [Elasticity Modifier] [Genre] rhythm section with [specific rhythm instrument 1 + behavior], [specific rhythm instrument 2 + behavior], [specific rhythm instrument 3 + behavior] — [Instrument Name] : [reinforced core acoustic properties] replacing [canonical lead role], [explicit musical behavior description] over [harmonic structure], [single BPM]
```

**Confirmed example — Bagpipes in Cyber Rockabilly:**
```
Instrument: Great Highland Bagpipe — mouth-blown conical chanter with three fixed tonic drones, bright reedy overtone-dense spectrum, continuous sustain with grace-note articulation, high-volume narrow dynamics, American Southern roots context. Upbeat reel, festive highland-rockabilly dance, aggressive and energetic,

on cyber rockabilly rhythm section with walking upright bass, slapback snare shuffle, twangy rhythm guitar — Great Highland Bagpipe: conical chanter with three fixed tonic drones producing continuous reedy overtone-dense sustain, grace-note ornamentation, high-volume projection replacing lead guitar, playing high-energy melodic fills and solo breaks with grace-note articulation over steady I–IV–V progression, 160 BPM
```

### Template B: Bass/Foundation/Drone Instruments (Didgeridoo, Hurdy-Gurdy, etc.)

```
Instrument: [Name] — [full acoustic description]

[Instrument name] bass layer, [supporting element description] on top, [atmospheric context], [tempo descriptor], [BPM]
```

**Confirmed example — Didgeridoo + Synth Pads:**
```
Instrument: Didgeridoo — lip-driven low fundamental drone with circular breathing, sub-heavy earthy spectrum with moving vocal formants and rhythmic tongue pulses, continuous sustain

Didgeridoo bass layer, warm atmospheric synth pads on top, dark spacious environment, slow immersive tempo, 60 BPM
```

**Confirmed example — Didgeridoo + Percussion:**
```
Instrument: Didgeridoo — lip-driven low fundamental drone with circular breathing, sub-heavy earthy spectrum with moving vocal formants and rhythmic tongue pulses, continuous sustain

Didgeridoo as primary foundation with hand percussion as subtle rhythmic layer on top, earthy ceremonial atmosphere, slow deliberate tempo, 70 BPM
```

---

## Section 8 — The Mediation Decision Tree

**Step 1 — Identify Genre GRS and HMC**

**Step 2 — Identify Instrument RFI and DPC**

**Step 3 — Compute baseline STS**
```
STS = (GRS - RFI) + (HMC × DPC / 2) - RAC
```

**Step 4 — Apply CSO if cultural distance is high**
- Is the instrument's default cultural context distant from the target genre's tradition?
- If yes: apply CSO (cultural schema override), subtract 1 from STS

**Step 5 — Apply RS if regional sub-schemas are available**
- Does the target genre have strong regional sub-schemas?
- If yes: apply RS (regional specificity), subtract 1 from STS

**Step 6 — Check Drone Conflict**
If DPC ≥ 1: avoid HMC ≥ 4; favor modal structures; reduce chord density

**Step 7 — Apply Elasticity Modifier if STS_adjusted ≥ 2**
Only when structural tension remains after CSO and RS. Unnecessary modifiers reduce genre identity.

**Step 8 — Apply DRS (always for unusual instrument fusions)**
Use Template A or Template B. Mention the instrument twice. One BPM only, in Block 2.

**Step 9 — Validate Spatial Layering Language**
Lead instruments: use "on." Foundation instruments: use "on top" or "as [role] under."

**Step 10 — Check Tempo Alignment**
Is there a conflict between the instrument's traditional range and the genre's typical range? Align BPM to the overlap zone (e.g., 160 BPM for bagpipes + rockabilly).

---

## Section 9 — Prompt Construction Rules

### The Correct Prompt Order
1. Genre context with any elasticity modifier applied
2. Core structural roles of the genre (rhythm, harmony, bass)
3. Role substitution statement for the featured instrument
4. Acoustic description of the featured instrument (after role is established)

**Note:** In DRS Template A, Block 1 front-loads instrument identity before genre — this is intentional because Block 2 then re-establishes the instrument within the genre context. The two-block structure is different from the single-block prompt order rule.

### The Em-Dash Rule
Use em-dashes (—) rather than commas to separate major structural clauses. Em-dashes preserve both instruction blocks and force synthesis. Commas allow later context to override earlier context.

### Words to Avoid
Never use production method words that trigger false schema associations:
- "mouth-blown" → triggers vocal/chant schemas *(exception: appears in confirmed working bagpipe template — use with caution)*
- "hand-crafted" → triggers folk schemas
- "traditional" → triggers cultural rigidity schemas
Use acoustic property language instead: "continuous airflow," "sustained resonance," "overtone-rich."

### The One-BPM Rule
Never include more than one BPM instruction in a prompt. Multiple BPM instructions create tempo conflict and cause collapse. Always place the single BPM instruction at the end of Block 2.

---

## Section 10 — Riffy's Consultation Role

When a user is experiencing generation failures or wants to attempt a structurally ambitious fusion, Riffy operates as a **music production consultant**, not a generation interface.

### New Diagnostic Questions (Version 2.0)
When a user is attempting a fusion, ask:

1. Is the instrument's default cultural context distant from the target genre's tradition? → If yes, apply CSO
2. Does the target genre have strong regional sub-schemas? → If yes, apply RS to steer toward the most compatible tradition
3. Is the instrument a lead/melodic role or a bass/foundation role? → Use the correct SLL connector ("on" vs. "on top" vs. "as foundation under")
4. Is there a tempo conflict between the instrument's traditional range and the genre's typical range? → Align BPM to the overlap zone
5. What regional tradition were you imagining for this fusion? → Use that to construct the corrected prompt

### Updated User-Facing Guidance

**When a user selects bagpipes and wants them in rockabilly:**

Old approach: *"Bagpipes in rockabilly is structurally challenging because rockabilly has a rigid genre schema and bagpipes have a strong Celtic cultural association. You can try adding an elasticity modifier like 'cyber' or 'fusion' to soften the genre rigidity."*

New approach: *"Bagpipes in rockabilly works best when you override the bagpipes' Celtic context with an American regional identity. Try 'American Southern roots context' or 'American Appalachian roots context' in the cultural descriptor, and use a hyphenated dance style like 'highland-rockabilly dance' to blend both traditions. The BPM sweet spot is 155–165. Want me to build that prompt for you?"*

### Consultation Trigger Phrases
- "It didn't include the [instrument]"
- "The [instrument] disappeared"
- "It just gave me [genre] without the [instrument]"
- "I want [instrument] in [genre] but it's not working"
- "How do I get [instrument] to show up?"

### Creative Override
If a user explicitly wants to attempt something the framework classifies as high-risk, warn once and proceed. User ownership of the creative intent is always preserved.

---

## Section 11 — Open Research Questions

The following areas remain untested or partially tested as of July 2026:

**Lyrics integration:** When lyrics are added to a bagpipes + rockabilly prompt, the generation collapses to hard rock — no pipes, no rockabilly character. The hypothesis is that the vocal schema overrides the instrumental arrangement priors. Untested: whether DRS + CSO applied to the lyrical content (not just the instrumental block) can hold the fusion. Potential approach: include "highland-rockabilly dance" language in the lyric style descriptor, not just in the instrumental block.

**Cross-instrument stacking:** Can we reliably generate tracks with two unusual instruments (e.g., bagpipes + didgeridoo, erhu + sitar)? What is the maximum complexity before the model collapses?

**Global regional steering boundaries:** West African highlife worked, Brazilian samba did not. What determines which non-American regional contexts can accommodate Western instruments?

**Intensity parameter interaction:** Does the MiniMax "intensity" setting (subtle/balanced/aggressive) interact with instrument persistence? Hypothesis: "subtle" gives drones more space. Untested systematically.

**Voice reference + unusual instruments:** If Bespoke mode is used with a vocal reference and an instrument from the palette, does the vocal reference stabilize or destabilize the fusion?

**Next phase instruments:** Systematic testing of sitar, shakuhachi, kora, and oud using the confirmed DRS formula to validate generalization.

---

## Section 12 — Confirmed Test Results

| Test | Instrument | Genre/Context | Result | Formula Used |
|------|-----------|---------------|--------|-------------|
| ✅ Confirmed | Great Highland Bagpipe | Cyber Rockabilly | Repeatable success | DRS + CSO (American Southern) + RS + cyber modifier |
| ✅ Confirmed | Great Highland Bagpipe | Traditional Rockabilly | Stochastic (sometimes works) | No DRS — STS = 2 |
| ✅ Confirmed | Erhu | Industrial Techno | Repeatable success | Lead instrument formula |
| ✅ Confirmed | Didgeridoo | Ambient + Synth Pads | Repeatable success | DRS Template B, 60 BPM |
| ✅ Confirmed | Didgeridoo | Ambient + Hand Percussion | Repeatable success | DRS Template B, 70 BPM |
| ✅ Confirmed | Great Highland Bagpipe | West African Highlife | Success | CSO to highlife horn role |
| ❌ Failed | Great Highland Bagpipe | Brazilian Samba + Rockabilly | Collapse | Schema conflict too strong |
| ❌ Failed | Great Highland Bagpipe | Chicago Blues | Collapse | Blues schema too dominant |
| ⚠ In Progress | Bagpipes + Lyrics | Cyber Rockabilly | Collapse to hard rock | Lyrics override instrumental fusion |
| 🔬 Pending | Sitar | Various | TBD | Next phase |
| 🔬 Pending | Shakuhachi | Various | TBD | Next phase |
| 🔬 Pending | Kora | Drum and Bass | TBD | Estimated STS ≈ 0 |
| 🔬 Pending | Oud | Various | TBD | Next phase |

---

## Platform Implications

**For the Instrument Palette:**
Each instrument's entry should include a list of compatible regional contexts based on role flexibility and cultural distance. The palette UI could offer regional steering suggestions when a user selects an instrument + genre combination with high STS.

**For Bespoke Generate:**
Regional specificity should be a discoverable field — a dropdown or autocomplete — separate from the main style prompt. Examples: "American Southern roots," "West African highlife," "Chicago house music," "Brazilian samba." This makes the regional rudder available to users who would never find it through trial and error.

**For the Riff Assistant:**
When diagnosing a failed generation, Riffy should explicitly ask: "What regional tradition were you imagining for this fusion?" Regional steering should be presented as a creative choice, not a technical workaround.

---

*This document is a living reference. Version 2.0 updated July 2026 with discoveries from 40+ systematic generation attempts. Update with new test results as they are confirmed.*
