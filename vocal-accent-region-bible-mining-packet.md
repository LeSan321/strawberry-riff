# Vocal Accent & Region Bible — Knowledge Mining Packet

**Version:** 0.1 — Research and extraction framework  
**Purpose:** Build a structured, culturally careful, technically actionable knowledge base for steering vocal accent, regional identity, singing delivery, dialectal lyric signals, and accent-aware prompt construction in Strawberry Riff.

---

## 1. Why This Bible Exists

The Vocal Nuance Bible answers questions of character, emotional delivery, register, breath, tone, strain, confidence, and intimacy. The Vocal Accent & Region Bible answers a related but distinct question:

> **How can a singer carry the lived sound of a place, linguistic community, or regional musical tradition without reducing that sound to costume?**

This is not a catalogue of accents. It is a system for understanding how accent and regional identity are carried through singing: vowel shape, consonant treatment, phrase-final movement, timing, register, lyric choice, local genre memory, and the interaction between a voice and its musical world.

The first Celtic tests established an important proof point: MiniMax can respond to a coordinated three-signal structure—genre frame, phonetic descriptors, and dialect-aware lyrics. This Bible is intended to turn that discovery into a reliable, modular framework rather than a collection of one-off prompt experiments.

---

## 2. Scope and Boundaries

| In scope | Out of scope |
|---|---|
| Singing accent and regional vocal color | Claiming that one “correct” voice represents a whole people or region |
| Phonetic and prosodic cues that survive melody | Treating accent as a novelty effect or impersonation device |
| Dialectal lyric signals used as model guardrails | Prescribing dialect spellings without cultural and contextual care |
| Interactions among register, tempo, genre, and accent audibility | Diagnosing or correcting a real person’s accent |
| Prompt language, common model failures, and validation tests | Guaranteeing a model can render a regional tradition faithfully |
| Creator-facing explanation and consent | Hiding culturally specific steering from the creator |

Every profile must distinguish among **linguistic accent**, **regional musical style**, **individual vocal character**, and **genre convention**. They overlap, but they are not interchangeable.

---

## 3. Extraction Goal and Success Criteria

The mining process should produce enough deep knowledge to answer five practical questions for every profile.

1. **What does the profile sound like in singing, not just speech?**
2. **Which signals remain audible at different registers, tempos, and emotional intensities?**
3. **What lyric and dialect choices reinforce the profile without overwhelming intelligibility or dignity?**
4. **What musical contexts support it, and what contexts cause a model to collapse into a nearby default genre?**
5. **What exact prompt language and validation test can Riff use to make the profile operational?**

A profile is ready for integration only when it has a clear answer to each question, a documented confidence level, and at least one proposed test plan.

---

## 4. Recommended Expert Source

Use a specialist AI or human expert with demonstrated knowledge across **sociolinguistics, vocal pedagogy, singing phonetics, regional music traditions, and contemporary production**. A source that knows only linguistic accent will be insufficient; a source that knows only musical genre will also be insufficient.

The source brief should explain that the task is not an imitation engine. It is a creator-facing music system that needs culturally respectful, technically specific guidance for generated singing.

### Source Opening Brief

Paste this once at the beginning of the expert conversation:

```text
We are building the Vocal Accent & Region Bible for Strawberry Riff, an AI-assisted music creation platform. The system helps creators generate original vocal takes for unusual instrumental fusions. We need to understand how regional vocal identity is carried through singing—phonetics, prosody, register, timing, lyric language, musical context, and emotional delivery—and how to represent that knowledge in prompts and creator-facing guidance.

This is not a request to reduce living communities to stereotypes, create celebrity impersonations, or claim a single voice is “authentic” for an entire region. We need technically specific, culturally careful knowledge that helps a creator make informed choices and helps an AI model avoid collapsing into generic or adjacent genres.

Please answer with depth, distinguish evidence from generalization, flag uncertainty and variation within each profile, and explain what a music-generation model is likely to misunderstand.
```

---

## 5. Department Architecture

Mine one department at a time. Do not paste every question block into one message. After each department response, follow every offered depth thread before moving on.

| Department | Primary output |
|---|---|
| **A. Accent Identity & Variation** | What the profile is and is not; internal variation; regional and musical context |
| **B. Singing Phonetics & Prosody** | Vowels, consonants, rhythm, phrase-final movement, and register behavior |
| **C. Vocal Technique & Presence** | Breath, resonance, vibrato, onset, dynamics, placement, and emotional delivery |
| **D. Lyrics & Dialect Signals** | Lexicon, contractions, syllable behavior, intelligibility, and guardrail language |
| **E. Genre, Arrangement & Collapse Risks** | Supporting musical worlds, incompatible frames, and model-default failure patterns |
| **F. Prompt Engineering & Product Translation** | Prompt blocks, signal order, UI explanations, and validation examples |
| **G. Cultural Care & Creator Agency** | Consent, attribution, uncertainty, and what the system should never claim |

---

## 6. Department Question Blocks

### Department A — Accent Identity & Variation

```text
After those opening questions, I want to move to the Accent Identity & Variation Department.

1. Define this vocal accent / regional profile for singing. What is the smallest accurate description, and what would be an overgeneralization?
2. What internal variation matters most—generation, locality, class, diaspora, genre, gender presentation, or personal style?
3. Which aspects are linguistic accent, which are regional musical convention, and which are merely common production associations?
4. What musical histories or local genre relationships shape how this profile is heard by listeners?
5. What neighboring accent or genre does an AI model most likely collapse into, and why?
6. What would a respectful creator-facing label sound like? What labels should Riff avoid?
```

### Department B — Singing Phonetics & Prosody

```text
After those questions, I want to move to the Singing Phonetics & Prosody Department.

1. Which vowel qualities are most audible in sustained singing, and which disappear under melody?
2. Which consonant treatments, rhoticity patterns, reductions, or lenitions survive singing reliably?
3. How do phrase-final intonation, pitch scoops, slide-ins, or melodic cadences contribute to the profile?
4. How does the profile change at low, mid, and high registers? Where does it become harder to hear?
5. How do fast tempo, dense lyrics, melisma, belt, whisper, and high-energy delivery alter the audible accent?
6. Provide prompt-ready phonetic descriptors, but explain the risk of overloading a generation prompt with technical terms.
```

### Department C — Vocal Technique & Presence

```text
After those questions, I want to move to the Vocal Technique & Presence Department.

1. What resonance placement, onset, breath behavior, vibrato, and dynamic contour commonly support this profile in singing?
2. How does the profile carry authority, intimacy, grief, joy, defiance, humor, or restraint differently from a neutral default voice?
3. Which vocal registers tend to preserve the profile best, and which registers tend to neutralize it?
4. What roles can the voice play in an arrangement: narrator, lead melody, call-and-response partner, communal voice, storyteller, or rhythmic engine?
5. Which production or arrangement choices help the profile remain legible without exaggerating it?
```

### Department D — Lyrics & Dialect Signals

```text
After those questions, I want to move to the Lyrics & Dialect Signals Department.

1. Which lexical choices, contractions, grammar patterns, or syllable reductions can function as gentle model guardrails for this profile?
2. Which dialectal features are safe to use sparingly, and which would be distracting, stigmatizing, or culturally careless when written phonetically?
3. How should lyric density and phrase length change if the creator wants the accent to remain audible?
4. What lyric subjects, images, or rhetorical rhythms belong naturally to this musical context without becoming costume?
5. Give three tiers of dialect adaptation: light touch, moderate support, and strong stylization. Explain when each is appropriate.
6. What should Riffy say to a creator before applying lyric dialect adaptation?
```

### Department E — Genre, Arrangement & Collapse Risks

```text
After those questions, I want to move to the Genre, Arrangement & Collapse-Risk Department.

1. Which rhythmic, harmonic, instrumental, and production contexts support this vocal profile?
2. Which contexts invite productive fusion, and which ones make the voice collapse into a generic nearby genre?
3. What happens when this profile is placed over dense rock, sparse acoustic music, electronic rhythm, samba-like motion, blues form, or cinematic arrangement?
4. Which instrument / vocal relationships make the profile more believable: lead, answer, drone, ornament, break, or call-and-response?
5. What exact negative constraints help prevent the most common collapse without forcing the model into a narrow cliché?
6. Give one worked fusion example that tests this profile outside its most familiar genre frame.
```

### Department F — Prompt Engineering & Product Translation

```text
After those questions, I want to move to the Prompt Engineering & Product Translation Department.

1. Write the ideal three-signal prompt structure for this profile: musical frame, phonetic / delivery descriptors, and lyric dialect signals.
2. Which signal should appear first, which must be repeated, and which should remain concise because of prompt-budget limits?
3. Provide a short prompt, a full production prompt, and an intentionally bad prompt that demonstrates a predictable failure mode.
4. What creator-facing choices should be offered in Riff’s UI, and which technical details should remain behind the scenes?
5. What information should be stored with a generated vocal take for later Match Family and Riffy use?
6. Design a controlled A/B test that would demonstrate whether this profile is actually steering the model.
```

### Department G — Cultural Care & Creator Agency

```text
After those questions, I want to move to the Cultural Care & Creator Agency Department.

1. What does this profile require from a system that wants to be respectful rather than extractive?
2. What language could Riff use to invite exploration without claiming to deliver an essential or authoritative version of a community?
3. Where should the system name uncertainty, variation, or regional specificity rather than present a monolithic preset?
4. What kinds of prompt requests should Riffy redirect, clarify, or decline?
5. How can the platform distinguish inspiration, lived connection, research, and imitation without interrogating a creator’s identity?
```

---

## 7. Depth and Clarification Prompts

Use these immediately whenever the source offers to elaborate or gives a generic answer.

```text
Yes — please go deeper on all [N] areas you identified. Take each one as far as you can go technically, especially in relation to singing rather than speech.
```

```text
Give me the technical specifics, not the general description. I need to know what survives melody, what disappears at high register, and what a generation model is likely to misread.
```

```text
Separate what is broadly reliable from what varies by person, locality, musical tradition, or production context.
```

```text
Translate that into: (1) creator-facing language, (2) hidden prompt language, (3) lyric guidance, and (4) a measurable validation test.
```

---

## 8. World-Specific Integration Brief

After the departments are complete, send this synthesis prompt to the source:

```text
I want to apply everything you know to a specific creation system.

Strawberry Riff helps a person create original instrumental fusions, then develop compatible vocal takes and blend them. The platform uses a Fusion Plan that preserves acoustic anchor identity, a cultural / regional lens, rhythmic and harmonic context, a repeated anchor role, a vocal relationship, and a tempo. It also uses Match Families so a fusion bed and later vocal takes can share structural context.

Write a complete Vocal Accent & Region Bible integration brief for this system. Explain how an accent profile should be selected, how Riffy should listen and make recommendations, how the three-signal prompt is assembled, how dialectal lyrics should be offered with creator approval, what should be stored in metadata, and how we should test whether the profile genuinely improves output rather than merely adding stereotypes.
```

---

## 9. Structured Accent Profile Schema

Use this schema for each profile after mining. The first version can be Markdown and JSON-compatible; a production data module can follow once profiles are validated.

```ts
type AccentRegionProfile = {
  id: string;                    // stable machine ID, e.g. "celtic-highland-v1"
  version: string;               // semantic or dated version
  creatorLabel: string;          // respectful UI label
  scopeNote: string;             // what this profile represents and does not represent
  confidence: "exploratory" | "tested" | "validated";

  identity: {
    regionalLens: string[];
    musicalContexts: string[];
    variationNotes: string[];
    avoidLabels: string[];
  };

  singingSignals: {
    vowelShape: string[];
    consonantTreatment: string[];
    prosody: string[];
    phraseEndings: string[];
    registerGuidance: {
      strongest: string[];
      caution: string[];
    };
    delivery: string[];
  };

  lyricSignals: {
    lightTouch: string[];
    moderateSupport: string[];
    strongStylization: string[];
    avoid: string[];
    densityGuidance: string;
  };

  promptBlocks: {
    musicalFrame: string;
    phoneticDelivery: string;
    lyricGuidance: string;
    negativeConstraints: string[];
    compactVariant: string;
  };

  fusionContext: {
    supportiveRhythms: string[];
    supportiveArrangements: string[];
    productiveTensions: string[];
    collapseRisks: Array<{
      risk: string;
      prevention: string;
    }>;
  };

  riffyGuidance: {
    listeningClues: string[];
    clarificationQuestions: string[];
    creatorExplanation: string;
    culturalCare: string[];
  };

  validation: {
    baselinePrompt: string;
    profilePrompt: string;
    testLyrics: string[];
    listeningCriteria: string[];
    knownResults: string[];
  };

  sources: Array<{
    type: "specialist-ai" | "human-expert" | "creator-test" | "research";
    description: string;
    date: string;
  }>;
};
```

---

## 10. Integration Targets in Strawberry Riff

| System area | What the Bible contributes |
|---|---|
| **Fusion Listening Framework** | Context clues that help Riffy hear a creator’s regional or vocal intention |
| **Riffy translation flow** | Clarification questions, explanation language, and cultural-care boundaries |
| **Fusion Plan** | Regional lens and vocal-relationship choices that shape the instrumental bed |
| **Voice & Words** | Accent profile selection, register guidance, lyric-fit suggestions, and dialect preview |
| **Lyrics workflow** | Creator-approved dialectal adaptation at light, moderate, or strong levels |
| **Prompt compiler** | Three-signal accent block assembled only after structural music planning is complete |
| **Match Family** | Accent profile ID, register, lyric-fit information, and test provenance |
| **Validation reports** | Baseline versus profile comparisons, creator listening notes, and confidence upgrades |

---

## 11. Validation Protocol

Every profile should be tested as a small controlled experiment, not accepted because it sounds plausible in prose.

| Test | Constant | Variable | Listening question |
|---|---|---|---|
| **Baseline** | Same musical frame, lyrics, register, and tempo | No profile signals | What neutral/default voice does the model produce? |
| **Prompt-only** | Same frame and lyrics | Musical + phonetic profile block | Does delivery shift without dialect lyrics? |
| **Three-signal** | Same frame, register, and tempo | Add creator-approved dialect lyrics | Does the accent become more stable? |
| **Register test** | Same profile and lyrics | Low / mid / high register | Where is the profile most audible? |
| **Genre-tension test** | Same profile | A familiar and unfamiliar fusion frame | Does the profile survive outside its default genre? |
| **Lyric-density test** | Same profile and arrangement | Sparse vs. dense lyric version | Does fast or dense text erase the intended delivery? |

The creator’s listening notes are evidence. A profile should not be marked **validated** until it performs across more than one song, role, and test condition.

---

## 12. Capture Protocol

1. Mine one department at a time.
2. Save the full source response immediately after every department.
3. Mark direct source statements separately from Riff’s interpretation or implementation decisions.
4. Add each result to the correct section of the master Bible; do not keep key knowledge only in chat history.
5. After each two departments, write a short “what changed in our understanding” synthesis.
6. Save a project checkpoint after each completed profile or major knowledge batch.
7. Do not implement a profile in the user UI until its prompt block, lyric guidance, and validation test are complete.

---

## 13. First Mining Session Checklist

Before opening the specialist source, prepare:

- [ ] The chosen first profile and why it matters to the Riff’s immediate tests.
- [ ] Known creator observations, including the Celtic accent proof and register findings.
- [ ] A sample Fusion Plan / instrumental bed the source can use as a concrete application case.
- [ ] Two lyric versions: neutral and dialect-supported.
- [ ] The department question blocks from this packet.
- [ ] A destination file for capture: `vocal-accent-region-bible-v0.1.md`.
- [ ] A clear distinction between source knowledge, creator test results, and unvalidated hypotheses.

---

## Closing Principle

> **A regional vocal identity is not an effect added after a song exists. It is a relationship among language, body, history, musical context, and the person or character allowed to speak through the song.**

The Bible should help creators approach that relationship with more possibility, more specificity, and more care—not with less.
