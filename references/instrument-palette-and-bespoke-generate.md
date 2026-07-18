# Instrument Palette & Bespoke Generate
## Riff Assistant Knowledge Base — Generation Technology Update

**Document purpose:** To equip the Riff Assistant with accurate, honest knowledge of the Instrument Palette feature, the Bespoke Generate pipeline, and the underlying technology so that Riffy can serve as a genuine creative collaborator in the generation flow — setting honest expectations, crafting better prompts, and guiding users through a system that is genuinely novel and sometimes surprising.

**Last updated:** July 2026  
**Maintained by:** Riff / Manus

---

## Why This Document Exists

Strawberry Riff's generation system has evolved significantly. The platform now integrates two distinct AI music models — MiniMax and Stability AI's Stable Audio — each with different strengths, different inputs, and different creative personalities. Users interacting with the Instrument Palette or Bespoke Generate features are working with a system that no other consumer music platform currently offers. That novelty is exciting, but it also means users may have expectations shaped by simpler tools.

Riffy's role in this context is not to oversell or to hide limitations. It is to be the honest, knowledgeable collaborator who helps users understand what they're working with, set realistic expectations, and get the most out of a genuinely powerful system. The goal is creative success, not technical impressiveness.

---

## Part 1: Understanding the Two Models

### MiniMax Music (Quick Generate)

MiniMax is the platform's primary music generation model, powering the Quick Generate flow. It is a language-first model: it understands text deeply, responds to emotional nuance, genre description, mood, and lyrical content. When a user writes "a melancholic folk ballad about leaving home in winter," MiniMax understands that sentence the way a musician would.

MiniMax excels at generating complete songs with coherent structure — verse, chorus, bridge — with vocals that follow the provided lyrics. It produces full arrangements with drums, bass, melodic instruments, and vocal performance in a single generation pass. For most users most of the time, MiniMax is the right tool.

**What MiniMax cannot do:** MiniMax does not accept audio as input for its text-to-music models (Music 2.6 and Music 3.0). It cannot be given a recording of bagpipes and told to incorporate that sound. Its knowledge of less common instruments — bagpipes, didgeridoo, sitar, shakuhachi, kora, erhu, hurdy-gurdy — is limited by its training data, which skews heavily toward Western popular music. Asking MiniMax for "bagpipes" in a text prompt often produces something that sounds vaguely Celtic but bears little resemblance to actual Highland pipes.

MiniMax does have a cover generation mode (Music-Cover) that accepts audio input, but this model requires the reference audio to contain detectable vocals. It is designed for generating covers of existing songs, not for instrument timbre transfer from isolated samples.

### Stable Audio 2.5 (Bespoke Generate)

Stable Audio 2.5, developed by Stability AI, is an audio-first model. It was purpose-built for instrumental music and sound design, trained on a fully licensed dataset, and designed to work with audio references. Unlike MiniMax, it can accept an existing audio clip and use it as a sonic reference — absorbing the timbre, texture, and character of that sound and incorporating it into a new generation.

This is the model that powers the Instrument Palette. When a user selects "Bagpipes" from the palette, Stable Audio receives a clean, professional recording of actual Highland bagpipes alongside the user's text prompt. It analyzes the sonic character of that recording and generates music that carries that character forward.

Stable Audio also supports **audio inpainting** — the ability to take an existing track and replace specific sections with newly generated content while preserving the surrounding audio. This is the foundation of the planned Bespoke Full Song mode (see Part 3).

**What Stable Audio cannot do:** Stable Audio does not generate vocals. It is an instrumental model. It does not understand lyrics. Its text prompt comprehension is good but less nuanced than MiniMax's — it responds better to sonic descriptions ("warm resonant strings, slow bow strokes, intimate chamber feel") than to emotional or narrative descriptions ("a song about grief"). Stable Audio also does not guarantee that its output will be in the same key or tempo as a separately generated MiniMax track.

---

## Part 2: The Instrument Palette

### What It Is

The Instrument Palette is a curated library of 37 professional audio samples, organized into five families, accessible from the Studio sidebar under Resources. Each sample is a clean, isolated recording of a real instrument — no backing tracks, no reverb, no processing — chosen specifically to give Stable Audio the clearest possible sonic signal to work from.

The palette exists because text prompts alone cannot reliably convey the sonic character of less common instruments. "Bagpipes" as text means different things to different people and different models. A 30-second recording of actual Highland pipes is unambiguous.

### The Five Instrument Families

**Strings** — Violin, Viola, Cello, Double Bass, Guitar, Banjo, Mandolin. These are Philharmonia Orchestra recordings: professional musicians playing single instruments in isolation. The string samples tend to produce warm, resonant results with Stable Audio. The violin and cello are particularly reliable for melodic and harmonic content.

**Woodwind** — Flute, Oboe, Cor Anglais, Clarinet, Bass Clarinet, Bassoon, Contrabassoon, Saxophone. Also Philharmonia recordings. Woodwind samples work well for melodic lines and textural color. The oboe and cor anglais have a distinctive reedy quality that comes through clearly. The saxophone tends to produce more jazz-adjacent results even with non-jazz prompts.

**Brass** — Trumpet, Trombone, French Horn, Tuba. Philharmonia recordings. Brass samples produce strong, assertive results. The French Horn is particularly effective for cinematic and orchestral textures. The tuba adds weight and low-end character.

**Percussion** — Snare, Bass Drum, Tam-Tam, Triangle, Tambourine, Sleigh Bells, Wind Chimes, Djembe, Cowbell. Mixed sources (Philharmonia and Freesound CC0). Percussion samples influence rhythmic texture more than melodic content. The djembe and tambourine are effective for adding world-music rhythmic character. The cowbell is included because it was the right thing to do.

**World & Folk** — Bagpipes, Didgeridoo, Sitar, Tabla, Shakuhachi, Steel Drum, Dulcimer, Erhu, Hurdy-Gurdy. These are the instruments that motivated the Instrument Palette's creation. They are sourced from Freesound (CC0 licensed) and Wikimedia Commons (public domain). These samples are the most sonically distinctive and the most likely to produce surprising, memorable results.

### Sample Quality and Honest Expectations

The Philharmonia samples are professional studio recordings. The world instrument samples vary in quality — some are excellent isolated recordings, others are field recordings or community uploads. The quality of the input directly affects the quality of the output: a clean, musical sample gives Stable Audio a clearer signal to work from.

The `strength` parameter controls how heavily the model is influenced by the reference audio. At higher strength (0.7–0.8), the instrument character is prominent and literal. At lower strength (0.3–0.5), it becomes more of a textural influence — the music sounds like it was made *with* that instrument's spirit rather than *featuring* that instrument. For strong, distinctive instruments like bagpipes or didgeridoo, higher strength tends to produce more recognizable results. For subtler instruments like violin or flute, lower strength often sounds more musical.

**The honest truth about bagpipes:** Bagpipes are an acquired taste. They are a drone instrument with a very specific tonal character — a continuous low drone with a chanter melody on top. When Stable Audio generates from a bagpipe reference, the result will carry that drone quality and that tonal character. It will sound distinctly Celtic or Scottish. Whether that is what the user wanted depends entirely on what they were imagining. Riffy should set this expectation before generation, not after.

### How the Instrument Palette Works in Practice

When a user selects an instrument from the palette:

1. The instrument's audio sample URL is stored as the active sonic reference.
2. When the user generates in Bespoke mode, the sample is passed to Stable Audio 2.5 alongside the user's text prompt.
3. Stable Audio generates an instrumental track (no vocals) that incorporates the sonic character of the selected instrument.
4. The result is delivered as a complete instrumental track, typically 30–90 seconds.

The user can preview any instrument sample before selecting it by clicking the Play button on the instrument card. This is important — Riffy should encourage users to preview before generating, because the sonic character of the reference directly shapes the output.

---

## Part 3: Generation Modes

### Quick Generate (MiniMax)

The existing generation flow. The user provides a text prompt, optional lyrics, and optional style settings. MiniMax generates a complete song with vocals and full arrangement. This is the right mode for most users most of the time — it is fast (2–3 minutes), reliable, and produces complete songs.

**When Riffy should recommend Quick Generate:** When the user wants a full song with vocals and lyrics. When the user's prompt is primarily about mood, genre, or narrative. When the user has not selected an instrument from the palette. When the user wants to iterate quickly.

### Bespoke Instrumental (Stable Audio)

Available when the user has selected an instrument from the Instrument Palette. Generates a pure instrumental track — no vocals — using the selected instrument's audio sample as a sonic reference. The user's text prompt guides the style, mood, and feel; the instrument sample guides the timbre and character.

**Generation time:** Approximately 15–30 seconds. Significantly faster than MiniMax because Stable Audio 2.5 is a synchronous model that returns audio directly.

**Output:** A 30–90 second instrumental track. No vocals, no lyrics. Suitable as a backing track, a demo, a sonic sketch, or a standalone piece.

**When Riffy should recommend Bespoke Instrumental:** When the user wants to explore an instrument's character without committing to a full song. When the user is a singer-songwriter who wants a backing track to record over. When the user is curious about what a particular instrument sounds like in a generated context. When the user's primary goal is the sonic texture rather than a complete song.

**Honest expectation to set:** The output will not have vocals. The instrument character will be present but may be more textural than literal — especially at lower strength settings. Results vary and iteration is normal. The first generation is a starting point, not a final product.

### Bespoke Full Song (Coming Soon — Phase 2)

The planned next evolution of the Bespoke pipeline. This mode will:

1. Generate a complete vocal song using MiniMax (Quick Generate pass)
2. Identify the instrumental sections of that song (verses, bridges, outros)
3. Use Stable Audio's inpainting feature to replace those instrumental sections with content influenced by the selected palette instrument
4. Return the result as a complete song with MiniMax's vocal performance and Stable Audio's instrument character woven into the arrangement

This approach avoids the alignment problem that would arise from trying to merge two independently generated tracks. Because Stable Audio is inpainting *within* the MiniMax track's structure, the timing, key, and overall shape of the song are preserved.

**Why this is not built yet:** Audio inpainting requires detecting the boundaries of instrumental sections in the MiniMax output — a non-trivial signal processing task. The team is building this carefully to ensure the crossfades and transitions are musical, not jarring. It is the right architecture and it will be built.

**What Riffy should say about this:** When users ask about getting a full song with bagpipes and vocals, Riffy should explain that this is coming, describe what it will do, and suggest that in the meantime they can use Bespoke Instrumental for the sonic exploration and Quick Generate for the full song — then layer them manually if they have the tools to do so.

### Reimagine (MiniMax Cover — Coming Soon)

A planned mode that uses MiniMax's Music-Cover model to generate a new version of an existing song in a different style. The user provides an existing track (one of their own generated songs or uploads) as a reference, along with a style prompt. MiniMax generates a cover that preserves the melodic and structural character of the original while reimagining the arrangement and style.

**Important constraint:** MiniMax's cover model requires the reference audio to contain detectable vocals. It cannot be used with pure instrumental tracks or instrument samples. This is a model-level constraint, not a platform limitation.

---

## Part 4: Riffy's Role in the Generation Flow

### The Creative Director Posture

When a user is in the Generate or Studio page with an instrument selected from the palette, Riffy's posture shifts to what might be called Creative Director — a collaborator who understands the technical system deeply enough to translate the user's creative intent into parameters that will produce the best possible result.

This is different from the Collaborator posture Riffy takes for general generation help. The Creative Director posture is more specific: it involves knowing what each instrument tends to produce, how to craft prompts that work well with Stable Audio, and how to set honest expectations before the user commits to a generation.

### Prompt Craft for Stable Audio

Stable Audio responds differently to prompts than MiniMax does. The key differences:

MiniMax responds to emotional and narrative language: "a melancholic ballad about leaving home." Stable Audio responds better to sonic and textural language: "slow, intimate, warm acoustic texture, minor key, sparse arrangement."

When helping a user craft a prompt for Bespoke Instrumental, Riffy should translate their emotional intent into sonic description. "I want something sad" becomes "slow tempo, minor key, sparse arrangement, long sustained notes." "I want it to feel ancient" becomes "modal harmonics, drone-based, minimal percussion, reverberant space."

**Prompt templates by instrument family:**

For **string instruments** (violin, cello, viola): lean into bowing technique descriptions — "long bow strokes," "pizzicato texture," "tremolo strings." Describe the register — "high violin melody," "deep cello drone." These instruments respond well to classical and cinematic prompts.

For **woodwind instruments** (flute, oboe, clarinet): describe the breath quality — "breathy flute," "reedy oboe," "warm clarinet tone." These instruments work well with folk, classical, and ambient prompts. The saxophone benefits from jazz-adjacent language even if the user wants something non-jazz.

For **brass instruments** (trumpet, trombone, French horn): describe the articulation — "bright trumpet fanfare," "muted trumpet," "warm French horn swell." Brass responds well to cinematic and orchestral prompts. The tuba benefits from explicit low-end descriptions.

For **world instruments** (bagpipes, didgeridoo, sitar, tabla, shakuhachi): be specific about the cultural and musical context. "Scottish highland bagpipes, pentatonic chanter melody, low drone, Celtic folk reel" will produce a better result than just "bagpipes." For the didgeridoo: "Australian Aboriginal drone, circular breathing texture, rhythmic overtone patterns." For the sitar: "Indian classical raga, plucked strings, resonant sympathetic strings, meditative." For the shakuhachi: "Japanese bamboo flute, breathy tone, pentatonic scale, meditative and sparse."

### Setting Honest Expectations

Before a user generates in Bespoke mode, Riffy should briefly set expectations — not as a disclaimer, but as useful information that helps the user interpret the result:

- The output will be instrumental (no vocals)
- The instrument character will be present but may be more textural than literal
- Results vary; iteration is normal and encouraged
- The first generation is a starting point
- If the instrument character feels too strong or too subtle, that can be adjusted

After a generation, if the result is not what the user expected, Riffy should help them understand why and suggest adjustments. "The bagpipes are very prominent — if you want them more subtle, try describing them as 'distant' or 'atmospheric' in your prompt" is more useful than "I'm sorry that didn't work."

### Curveball Handling

Users will ask for things that push the edges of what the system can do. Common curveballs and how to handle them:

**"I want bagpipes only in the chorus"** — The current Bespoke Instrumental mode generates a complete track with the instrument character throughout. Section-specific instrument placement is a Phase 2 capability (Bespoke Full Song with inpainting). For now, suggest generating the full instrumental and noting that chorus-specific placement is coming.

**"Can you blend two instruments?"** — The palette currently supports one instrument reference per generation. Blending two references is not yet supported. Suggest generating two separate instrumentals and noting which one has the character they want, then using that as the basis for further iterations.

**"I want the sitar but I also want it to sound like jazz"** — This is a prompt craft challenge, not a system limitation. Help the user write a prompt that describes both: "Indian sitar with jazz harmonic sensibility, chromatic melody, swing rhythm, warm acoustic texture." The result may surprise them.

**"Why doesn't it sound exactly like the sample I chose?"** — Stable Audio uses the sample as a *reference* for sonic character, not as a literal template. It generates new music inspired by that character. The output will carry the timbre and texture of the instrument but will not reproduce the sample itself. This is by design — it is generating new music, not remixing the sample.

**"Can I use my own audio as a reference?"** — The manual audio upload feature in Studio allows users to upload their own reference clips. This works the same way as the palette — the uploaded audio is passed to Stable Audio as a sonic reference. The quality and character of the result depends on the quality and clarity of the uploaded clip. Clean, isolated recordings work best.

---

## Part 5: The Bigger Picture

### Why This Matters

The Instrument Palette and Bespoke Generate represent something genuinely new in consumer music creation. No other platform currently offers a seamless "pick an instrument from a curated library → generate music with that instrument's authentic sonic character" experience backed by professional-grade audio samples and a purpose-built audio model.

This is not a gimmick. It exists because the team discovered that text prompts alone cannot reliably convey the sonic character of less common instruments — and that the right solution was not to work around that limitation but to address it directly with real audio references. The result is a system that can produce music with authentic bagpipe character, real sitar resonance, and genuine didgeridoo drone — things that were simply not achievable with text-only generation.

### The Honest Limitation

The system cannot currently produce a complete vocal song with a specific instrument prominently featured in the arrangement. That requires the Bespoke Full Song mode (Phase 2), which is in development. Users who want bagpipes *and* vocals are working at the frontier of what the platform can do. Riffy should acknowledge this honestly, explain what is coming, and help them get the most out of what is available today.

### The Stability AI Partnership

Stable Audio 2.5 is developed by Stability AI, a company whose ownership model aligns with Strawberry Riff's values: creators own their outputs, commercial rights are clear and persistent, and the training data is fully licensed. This is not incidental — the team chose Stability AI specifically because their approach to creator ownership matches the platform's founding commitment.

---

## Quick Reference: Generation Mode Decision Guide

| User wants | Recommended mode | Notes |
|---|---|---|
| A complete song with vocals and lyrics | Quick Generate (MiniMax) | The default and most reliable path |
| An instrumental with a specific instrument's character | Bespoke Instrumental (Stable Audio) | Requires palette selection |
| A complete song with a specific instrument in the arrangement | Bespoke Full Song | Coming in Phase 2 |
| A new version of an existing song in a different style | Reimagine (MiniMax Cover) | Coming soon; requires vocal reference |
| A backing track to record over | Bespoke Instrumental | Ideal use case |
| To explore what an instrument sounds like in a generated context | Bespoke Instrumental | Encourage previewing the sample first |

---

## Quick Reference: Instrument Character Guide

| Instrument | Sonic character | Best prompt language | Typical result |
|---|---|---|---|
| Violin | Bright, expressive, melodic | "singing violin melody, lyrical, expressive bowing" | Melodic, emotional, classical or folk feel |
| Cello | Warm, deep, resonant | "deep cello, long bow strokes, warm low register" | Rich, intimate, often melancholic |
| Flute | Airy, light, breathy | "breathy flute, light and airy, floating melody" | Delicate, pastoral, often peaceful |
| Oboe | Reedy, penetrating, expressive | "reedy oboe, expressive melody, pastoral" | Distinctive, slightly melancholic, classical feel |
| Trumpet | Bright, assertive, clear | "bright trumpet, clear articulation, bold" | Energetic, fanfare-like, or jazz-adjacent |
| French Horn | Warm, round, cinematic | "warm French horn, swelling, cinematic" | Orchestral, epic, emotionally expansive |
| Bagpipes | Droning, modal, distinctly Celtic | "Highland bagpipes, low drone, chanter melody, Celtic folk" | Unmistakably Scottish/Celtic; an acquired taste |
| Didgeridoo | Deep drone, rhythmic, ancient | "didgeridoo drone, circular breathing, Aboriginal texture" | Primal, meditative, distinctly Australian |
| Sitar | Resonant, plucked, meditative | "Indian sitar, raga melody, resonant sympathetic strings" | Indian classical feel, meditative, warm |
| Shakuhachi | Breathy, sparse, contemplative | "Japanese bamboo flute, breathy, pentatonic, meditative" | Sparse, contemplative, distinctly Japanese |
| Tabla | Rhythmic, percussive, intricate | "tabla percussion, Indian rhythm, intricate patterns" | Rhythmic texture, Indian classical feel |
| Erhu | Plaintive, expressive, Chinese | "Chinese erhu, two-string fiddle, expressive melody" | Distinctive, often melancholic, East Asian feel |
| Cowbell | Iconic, metallic, rhythmic | "cowbell percussion, driving rhythm, classic rock feel" | Exactly what you'd expect. More is more. |
