/**
 * Instrument Bible — Conditioning Tags for Stable Audio 2.5
 *
 * Each entry maps a catalog instrument ID to a compact conditioning tag
 * derived from the full Instrument Bible (seven-dimension acoustic schema).
 *
 * These tags are prepended to the user's prompt in Bespoke Instrumental
 * generation to anchor the model to the instrument's acoustic identity:
 * mechanism → spectral → envelope → emotional → context.
 *
 * Sources: Strawberry Studios Instrument Bible (2025), compiled from
 * structured acoustic analysis using the Universal Rare Instrument Schema.
 */

export const INSTRUMENT_BIBLE: Record<string, string> = {
  // ─── STRINGS ────────────────────────────────────────────────────────────────

  violin:
    "Instrument: Violin — high bowed string with brilliant upper harmonics, agile articulation and expressive vibrato, soaring emotional lead voice.",

  viola:
    "Instrument: Viola — midrange bowed string with warm velvety tone and rich lower mids, introspective and blending harmonic voice.",

  cello:
    "Instrument: Cello — low bowed string with rich resonant body and singing tenor range, warm expressive sustain and human-like lyrical depth.",

  "double-bass":
    "Instrument: Double Bass — lowest bowed string with dark woody resonance and strong fundamental emphasis, foundational harmonic depth.",

  guitar:
    "Instrument: Guitar — plucked or strummed chordophone with steel or nylon strings, warm midrange body with bright attack transient, versatile harmonic rhythm and melodic voice across folk, pop, and classical contexts.",

  banjo:
    "Instrument: Banjo — plucked drum-resonator string instrument with metallic bright attack and fast decay, twangy upper-mid presence, driving rhythmic energy in Appalachian bluegrass and folk contexts.",

  mandolin:
    "Instrument: Mandolin — plucked double-course string instrument with bright sharp attack and fast decay, clear upper-mid chop and tremolo shimmer, folk and bluegrass melodic voice.",

  // ─── WOODWIND ───────────────────────────────────────────────────────────────

  flute:
    "Instrument: Flute — edge-blown cylindrical aerophone with clear airy tone, light harmonic shimmer and agile high register brilliance, pastoral and graceful character.",

  oboe:
    "Instrument: Oboe — double-reed conical woodwind with focused nasal midrange tone and expressive vibrato, lyrical and melancholic solo voice.",

  "cor-anglais":
    "Instrument: Cor Anglais (English Horn) — double-reed conical woodwind pitched a fifth below oboe, darker and more veiled nasal tone with haunting melancholic warmth, expressive pastoral and longing character.",

  clarinet:
    "Instrument: Clarinet — single-reed cylindrical woodwind with dark woody low register, smooth midrange and bright upper altissimo, expressive and agile tonal shapeshifter.",

  "bass-clarinet":
    "Instrument: Bass Clarinet — single-reed cylindrical woodwind an octave below clarinet, deep dark chalumeau register with hollow woody resonance, brooding and atmospheric low-register character.",

  bassoon:
    "Instrument: Bassoon — low double-reed conical woodwind with warm woody resonance and subtle reedy buzz, expressive bass voice with lyrical and comic potential.",

  contrabassoon:
    "Instrument: Contrabassoon — very large double-reed conical woodwind an octave below bassoon, massive dark low-frequency resonance with slow speaking response, foundational orchestral depth and gravitas.",

  saxophone:
    "Instrument: Saxophone — single-reed conical metal woodwind with warm full-bodied midrange tone and expressive dynamic range, versatile between smooth lyrical phrasing and bright cutting projection, jazz and classical character.",

  harp:
    "Instrument: Harp — large plucked string instrument with pedal-controlled chromatic range, bright shimmering attack and long resonant decay, ethereal arpeggiated harmonic texture and orchestral color.",

  // ─── BRASS ──────────────────────────────────────────────────────────────────

  trumpet:
    "Instrument: Trumpet — cylindrical-bore lip-vibrated brass with brilliant focused projection, strong upper harmonics and sharp articulate attack, heroic and declarative lead voice.",

  trombone:
    "Instrument: Trombone — slide brass with broad low-mid resonance, powerful rounded attack and natural glissando capability, bold and dramatic weight.",

  "french-horn":
    "Instrument: French Horn — conical-bore brass with warm blended midrange tone, smooth attack and noble cinematic presence, enveloping harmonic warmth.",

  tuba:
    "Instrument: Tuba — large conical-bore brass with deep fundamental emphasis and rounded low-frequency bloom, foundational orchestral gravity.",

  // ─── PERCUSSION ─────────────────────────────────────────────────────────────

  "snare-drum":
    "Instrument: Snare Drum — struck double-headed drum with vibrating metal snare wires, sharp crack transient and noisy rattle decay, rhythmic backbone presence.",

  "bass-drum":
    "Instrument: Bass Drum — large orchestral drum with deep low-frequency thump and rounded bloom, dramatic air-moving impact.",

  "tam-tam":
    "Instrument: Tam-Tam — large non-pitched suspended gong with inharmonic metallic swell and massive long decay wash.",

  triangle:
    "Instrument: Triangle — small suspended steel idiophone with bright high-frequency ping and long shimmering ring.",

  tambourine:
    "Instrument: Tambourine — frame drum with metal jingles, sharp skin strike and sustained shimmering jingle texture.",

  "sleigh-bells":
    "Instrument: Sleigh Bells — clustered small metal bells with bright festive jingle shimmer and rhythmic shake texture.",

  "wind-chimes":
    "Instrument: Wind Chimes — suspended metal tubes producing random airy bell tones with long delicate decay and ambient shimmer.",

  cowbell:
    "Instrument: Cowbell — hollow metal bell with dry midrange clank and short metallic decay, rhythmic groove accent.",

  djembe:
    "Instrument: Djembe — rope-tuned West African goblet drum with deep bass hits, ringing open tones, and sharp slaps, earthy communal rhythm energy.",

  // ─── WORLD & FOLK ───────────────────────────────────────────────────────────

  bagpipes:
    "Instrument: Great Highland Bagpipe — mouth-blown conical chanter with three fixed tonic drones, bright reedy overtone-dense spectrum, continuous sustain with grace-note articulation, high-volume narrow dynamics, heroic martial Celtic procession context.",

  didgeridoo:
    "Instrument: Didgeridoo — lip-driven low fundamental drone with circular breathing, sub-heavy earthy spectrum with moving vocal formants and rhythmic tongue pulses, continuous sustain, trance-inducing Indigenous Australian ritual context.",

  sitar:
    "Instrument: Sitar — long-necked plucked string instrument with sympathetic resonating strings, bright attack with extended shimmering decay and microtonal meend bends, rich overtone cascade, Hindustani classical raga context.",

  tabla:
    "Instrument: Tabla — paired tuned hand drums (dayan and pitch-bending bayan) with harmonic syahi resonance, crisp finger transients alternating ringing and muted strokes, bass glides, intricate Hindustani rhythmic cycle context.",

  shakuhachi:
    "Instrument: Shakuhachi — end-blown bamboo flute with breath-rich airy tone, flexible microtonal pitch bends via head angle, soft swell attack and natural breath decay, meditative Zen Japanese solo context.",

  "steel-drum":
    "Instrument: Steel Drum (Steel Pan) — struck tuned concave metal idiophone with harmonically aligned bell-like overtones, rounded mallet attack and long smooth decay, bright warm midrange shimmer, Caribbean calypso and festive tropical context.",

  dulcimer:
    "Instrument: Appalachian Dulcimer — fretted drone zither with warm plucked melody over sustained drone strings, soft woody midrange tone, diatonic modal tuning, intimate Appalachian folk storytelling context.",

  erhu:
    "Instrument: Erhu — two-stringed bowed spike fiddle with silk or metal strings, expressive nasal midrange tone with continuous bow sustain and microtonal portamento slides, deeply lyrical and melancholic Chinese folk and classical context.",

  "hurdy-gurdy":
    "Instrument: Hurdy-Gurdy — wheel-bowed string instrument with continuous drones and keyed melody string, nasal midrange harmonic stack with mechanical friction texture, sustained legato envelope with optional rhythmic buzzing bridge, medieval European folk dance context.",
};

/**
 * Returns the conditioning tag for a given instrument ID, or null if not found.
 * The tag should be prepended to the user's prompt before sending to Stable Audio 2.5.
 */
export function getInstrumentConditioningTag(instrumentId: string): string | null {
  return INSTRUMENT_BIBLE[instrumentId] ?? null;
}

/**
 * Builds the full conditioned prompt for Bespoke generation:
 * [Instrument conditioning tag] + [Performance context] + [User prompt]
 */
export function buildBespokePrompt(
  instrumentId: string,
  userPrompt: string
): string {
  const tag = getInstrumentConditioningTag(instrumentId);
  if (!tag) return userPrompt;
  return `${tag} ${userPrompt}`;
}
