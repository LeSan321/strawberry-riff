/**
 * Instrument Palette Catalog
 *
 * Curated reference audio samples for MiniMax's song_file parameter.
 * Sources:
 *   - Philharmonia Orchestra (philharmonia.co.uk) — CC BY-SA 3.0, professional recordings
 *   - Wikimedia Commons — CC0 / Public Domain
 *   - Freesound.org — CC0 (Creative Commons Zero)
 *
 * All samples are 30-second normalized MP3s hosted on S3.
 * They are passed as the `referenceAudioUrl` / `song_file` parameter to MiniMax,
 * which uses the sonic character as a style guide for generation.
 */

export interface InstrumentSample {
  id: string;
  name: string;
  family: string;
  description: string;
  audioPath: string;
  source: string;
  tags: string[];
}

export const INSTRUMENT_FAMILIES = [
  "Strings",
  "Woodwind",
  "Brass",
  "Percussion",
  "World & Folk",
] as const;

export type InstrumentFamily = (typeof INSTRUMENT_FAMILIES)[number];

export const INSTRUMENT_CATALOG: InstrumentSample[] = [
  // ── Strings ──────────────────────────────────────────────────────────────
  {
    id: "violin",
    name: "Violin",
    family: "Strings",
    description: "Bright, singing tone — the voice of the orchestra",
    audioPath: "https://t3.storageapi.dev/systematic-holder-7d6b-vj5e4e/instrument-samples/violin.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["strings", "classical", "orchestral", "bowed"],
  },
  {
    id: "viola",
    name: "Viola",
    family: "Strings",
    description: "Warm, slightly darker tone than violin",
    audioPath: "https://t3.storageapi.dev/systematic-holder-7d6b-vj5e4e/instrument-samples/viola.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["strings", "classical", "orchestral", "bowed"],
  },
  {
    id: "cello",
    name: "Cello",
    family: "Strings",
    description: "Rich, resonant low-mid strings — deeply expressive",
    audioPath: "https://t3.storageapi.dev/systematic-holder-7d6b-vj5e4e/instrument-samples/cello.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["strings", "classical", "orchestral", "bowed", "deep"],
  },
  {
    id: "double-bass",
    name: "Double Bass",
    family: "Strings",
    description: "Deep, foundational bass strings",
    audioPath: "https://t3.storageapi.dev/systematic-holder-7d6b-vj5e4e/instrument-samples/double-bass.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["strings", "classical", "orchestral", "bowed", "bass"],
  },
  {
    id: "guitar",
    name: "Guitar",
    family: "Strings",
    description: "Acoustic guitar — plucked warmth and resonance",
    audioPath: "https://t3.storageapi.dev/systematic-holder-7d6b-vj5e4e/instrument-samples/guitar.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["strings", "acoustic", "plucked", "folk"],
  },
  {
    id: "banjo",
    name: "Banjo",
    family: "Strings",
    description: "Bright, twangy plucked strings — folk and bluegrass",
    audioPath: "https://t3.storageapi.dev/systematic-holder-7d6b-vj5e4e/instrument-samples/banjo.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["strings", "folk", "bluegrass", "plucked", "americana"],
  },
  {
    id: "mandolin",
    name: "Mandolin",
    family: "Strings",
    description: "Bright, shimmering plucked strings — folk and classical",
    audioPath: "https://t3.storageapi.dev/systematic-holder-7d6b-vj5e4e/instrument-samples/mandolin.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["strings", "folk", "plucked", "bright"],
  },

  // ── Woodwind ─────────────────────────────────────────────────────────────
  {
    id: "flute",
    name: "Flute",
    family: "Woodwind",
    description: "Clear, airy tone — light and expressive",
    audioPath: "https://t3.storageapi.dev/systematic-holder-7d6b-vj5e4e/instrument-samples/flute.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["woodwind", "classical", "orchestral", "airy"],
  },
  {
    id: "oboe",
    name: "Oboe",
    family: "Woodwind",
    description: "Nasal, penetrating tone — highly distinctive",
    audioPath: "https://t3.storageapi.dev/systematic-holder-7d6b-vj5e4e/instrument-samples/oboe.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["woodwind", "classical", "orchestral", "reedy"],
  },
  {
    id: "cor-anglais",
    name: "Cor Anglais",
    family: "Woodwind",
    description: "English horn — deeper, more melancholic than oboe",
    audioPath: "https://t3.storageapi.dev/systematic-holder-7d6b-vj5e4e/instrument-samples/cor-anglais.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["woodwind", "classical", "orchestral", "reedy", "deep"],
  },
  {
    id: "clarinet",
    name: "Clarinet",
    family: "Woodwind",
    description: "Smooth, versatile tone — jazz and classical",
    audioPath: "https://t3.storageapi.dev/systematic-holder-7d6b-vj5e4e/instrument-samples/clarinet.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["woodwind", "classical", "jazz", "smooth"],
  },
  {
    id: "bass-clarinet",
    name: "Bass Clarinet",
    family: "Woodwind",
    description: "Dark, rich low clarinet tone",
    audioPath: "https://t3.storageapi.dev/systematic-holder-7d6b-vj5e4e/instrument-samples/bass-clarinet.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["woodwind", "classical", "dark", "bass"],
  },
  {
    id: "bassoon",
    name: "Bassoon",
    family: "Woodwind",
    description: "Deep, reedy bass woodwind — expressive and warm",
    audioPath: "https://t3.storageapi.dev/systematic-holder-7d6b-vj5e4e/instrument-samples/bassoon.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["woodwind", "classical", "orchestral", "bass", "reedy"],
  },
  {
    id: "contrabassoon",
    name: "Contrabassoon",
    family: "Woodwind",
    description: "The deepest woodwind — dark, rumbling bass",
    audioPath: "https://t3.storageapi.dev/systematic-holder-7d6b-vj5e4e/instrument-samples/contrabassoon.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["woodwind", "classical", "bass", "deep", "dark"],
  },
  {
    id: "saxophone",
    name: "Saxophone",
    family: "Woodwind",
    description: "Warm, expressive tone — jazz, soul, and beyond",
    audioPath: "https://t3.storageapi.dev/systematic-holder-7d6b-vj5e4e/instrument-samples/saxophone.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["woodwind", "jazz", "soul", "expressive"],
  },

  // ── Brass ─────────────────────────────────────────────────────────────────
  {
    id: "trumpet",
    name: "Trumpet",
    family: "Brass",
    description: "Bright, piercing brass — fanfares and jazz",
    audioPath: "https://t3.storageapi.dev/systematic-holder-7d6b-vj5e4e/instrument-samples/trumpet.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["brass", "classical", "jazz", "bright", "fanfare"],
  },
  {
    id: "trombone",
    name: "Trombone",
    family: "Brass",
    description: "Warm, rich brass — powerful and versatile",
    audioPath: "https://t3.storageapi.dev/systematic-holder-7d6b-vj5e4e/instrument-samples/trombone.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["brass", "classical", "jazz", "warm"],
  },
  {
    id: "french-horn",
    name: "French Horn",
    family: "Brass",
    description: "Mellow, noble brass — cinematic and hunting calls",
    audioPath: "https://t3.storageapi.dev/systematic-holder-7d6b-vj5e4e/instrument-samples/french-horn.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["brass", "classical", "orchestral", "cinematic", "mellow"],
  },
  {
    id: "tuba",
    name: "Tuba",
    family: "Brass",
    description: "Deep, powerful bass brass — foundational and majestic",
    audioPath: "https://t3.storageapi.dev/systematic-holder-7d6b-vj5e4e/instrument-samples/tuba.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["brass", "classical", "bass", "deep", "powerful"],
  },

  // ── Percussion ────────────────────────────────────────────────────────────
  {
    id: "snare-drum",
    name: "Snare Drum",
    family: "Percussion",
    description: "Crisp, sharp percussion — marches and rhythmic drive",
    audioPath: "https://t3.storageapi.dev/systematic-holder-7d6b-vj5e4e/instrument-samples/snare-drum.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["percussion", "drums", "rhythmic", "crisp"],
  },
  {
    id: "bass-drum",
    name: "Bass Drum",
    family: "Percussion",
    description: "Deep, booming impact — orchestral power",
    audioPath: "https://t3.storageapi.dev/systematic-holder-7d6b-vj5e4e/instrument-samples/bass-drum.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["percussion", "drums", "deep", "impact"],
  },
  {
    id: "tam-tam",
    name: "Tam-Tam (Gong)",
    family: "Percussion",
    description: "Resonant, shimmering gong — dramatic and ceremonial",
    audioPath: "https://t3.storageapi.dev/systematic-holder-7d6b-vj5e4e/instrument-samples/tam-tam.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["percussion", "gong", "dramatic", "resonant", "ceremonial"],
  },
  {
    id: "triangle",
    name: "Triangle",
    family: "Percussion",
    description: "Pure, ringing metallic tone — delicate and bright",
    audioPath: "https://t3.storageapi.dev/systematic-holder-7d6b-vj5e4e/instrument-samples/triangle.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["percussion", "metallic", "bright", "delicate"],
  },
  {
    id: "tambourine",
    name: "Tambourine",
    family: "Percussion",
    description: "Jingle and thump — folk, pop, and world music",
    audioPath: "https://t3.storageapi.dev/systematic-holder-7d6b-vj5e4e/instrument-samples/tambourine.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["percussion", "folk", "pop", "jingle"],
  },
  {
    id: "sleigh-bells",
    name: "Sleigh Bells",
    family: "Percussion",
    description: "Bright, festive jingle — seasonal and celebratory",
    audioPath: "https://t3.storageapi.dev/systematic-holder-7d6b-vj5e4e/instrument-samples/sleigh-bells.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["percussion", "festive", "bright", "jingle"],
  },
  {
    id: "wind-chimes",
    name: "Wind Chimes",
    family: "Percussion",
    description: "Ethereal, shimmering tones — meditative and ambient",
    audioPath: "https://t3.storageapi.dev/systematic-holder-7d6b-vj5e4e/instrument-samples/wind-chimes.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["percussion", "ambient", "ethereal", "meditative"],
  },
  {
    id: "cowbell",
    name: "Cowbell",
    family: "Percussion",
    description: "Iconic metallic percussion — needs more of it, always",
    audioPath: "https://t3.storageapi.dev/systematic-holder-7d6b-vj5e4e/instrument-samples/cowbell.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["percussion", "metallic", "rhythmic", "iconic", "cowbell"],
  },
  {
    id: "djembe",
    name: "Djembe",
    family: "Percussion",
    description: "West African hand drum — earthy, rhythmic energy",
    audioPath: "https://t3.storageapi.dev/systematic-holder-7d6b-vj5e4e/instrument-samples/djembe.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["percussion", "world", "african", "rhythmic", "hand drum"],
  },

  // ── World & Folk ──────────────────────────────────────────────────────────
  {
    id: "bagpipes",
    name: "Bagpipes",
    family: "World & Folk",
    description: "Scottish Highland pipes — drone and chanter",
    audioPath: "https://t3.storageapi.dev/systematic-holder-7d6b-vj5e4e/instrument-samples/bagpipes.mp3",
    source: "Freesound.org (CC0)",
    tags: ["world", "folk", "celtic", "scottish", "drone"],
  },
  {
    id: "didgeridoo",
    name: "Didgeridoo",
    family: "World & Folk",
    description: "Australian Aboriginal wind instrument — deep drone",
    audioPath: "https://t3.storageapi.dev/systematic-holder-7d6b-vj5e4e/instrument-samples/didgeridoo.mp3",
    source: "Freesound.org (CC0)",
    tags: ["world", "folk", "aboriginal", "australian", "drone", "deep"],
  },
  {
    id: "sitar",
    name: "Sitar",
    family: "World & Folk",
    description: "North Indian plucked strings — meditative and hypnotic",
    audioPath: "https://t3.storageapi.dev/systematic-holder-7d6b-vj5e4e/instrument-samples/sitar.mp3",
    source: "Wikimedia Commons (CC0)",
    tags: ["world", "indian", "classical", "plucked", "meditative"],
  },
  {
    id: "tabla",
    name: "Tabla",
    family: "World & Folk",
    description: "Indian hand drums — intricate rhythmic patterns",
    audioPath: "https://t3.storageapi.dev/systematic-holder-7d6b-vj5e4e/instrument-samples/tabla.mp3",
    source: "Wikimedia Commons (CC0)",
    tags: ["world", "indian", "percussion", "rhythmic", "hand drum"],
  },
  {
    id: "shakuhachi",
    name: "Shakuhachi",
    family: "World & Folk",
    description: "Japanese bamboo flute — breathy, meditative tone",
    audioPath: "https://t3.storageapi.dev/systematic-holder-7d6b-vj5e4e/instrument-samples/shakuhachi.mp3",
    source: "Wikimedia Commons (CC0)",
    tags: ["world", "japanese", "flute", "meditative", "breathy"],
  },
  {
    id: "steel-drum",
    name: "Steel Drum",
    family: "World & Folk",
    description: "Caribbean steel pan — bright, melodic percussion",
    audioPath: "https://t3.storageapi.dev/systematic-holder-7d6b-vj5e4e/instrument-samples/steel-drum.mp3",
    source: "Wikimedia Commons (CC0)",
    tags: ["world", "caribbean", "percussion", "melodic", "bright"],
  },
  {
    id: "dulcimer",
    name: "Dulcimer",
    family: "World & Folk",
    description: "Appalachian mountain dulcimer — folk and Americana",
    audioPath: "https://t3.storageapi.dev/systematic-holder-7d6b-vj5e4e/instrument-samples/dulcimer.mp3",
    source: "Wikimedia Commons (CC0)",
    tags: ["world", "folk", "americana", "appalachian", "plucked"],
  },
  {
    id: "erhu",
    name: "Erhu",
    family: "World & Folk",
    description: "Chinese two-string fiddle — expressive and mournful",
    audioPath: "https://t3.storageapi.dev/systematic-holder-7d6b-vj5e4e/instrument-samples/erhu.mp3",
    source: "Wikimedia Commons (CC0)",
    tags: ["world", "chinese", "bowed", "expressive", "mournful"],
  },
  {
    id: "hurdy-gurdy",
    name: "Hurdy-Gurdy",
    family: "World & Folk",
    description: "Medieval drone instrument — haunting and hypnotic",
    audioPath: "https://t3.storageapi.dev/systematic-holder-7d6b-vj5e4e/instrument-samples/hurdy-gurdy.mp3",
    source: "Wikimedia Commons (CC0)",
    tags: ["world", "folk", "medieval", "drone", "haunting"],
  },
];

/**
 * Returns the full catalog grouped by instrument family.
 */
export function getCatalogByFamily(): Record<string, InstrumentSample[]> {
  const grouped: Record<string, InstrumentSample[]> = {};
  for (const family of INSTRUMENT_FAMILIES) {
    grouped[family] = INSTRUMENT_CATALOG.filter((i) => i.family === family);
  }
  return grouped;
}
