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
    audioPath: "/manus-storage/violin_4f5f717f.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["strings", "classical", "orchestral", "bowed"],
  },
  {
    id: "viola",
    name: "Viola",
    family: "Strings",
    description: "Warm, slightly darker tone than violin",
    audioPath: "/manus-storage/viola_a0be04bc.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["strings", "classical", "orchestral", "bowed"],
  },
  {
    id: "cello",
    name: "Cello",
    family: "Strings",
    description: "Rich, resonant low-mid strings — deeply expressive",
    audioPath: "/manus-storage/cello_22b522e0.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["strings", "classical", "orchestral", "bowed", "deep"],
  },
  {
    id: "double-bass",
    name: "Double Bass",
    family: "Strings",
    description: "Deep, foundational bass strings",
    audioPath: "/manus-storage/double-bass_7f06b0b1.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["strings", "classical", "orchestral", "bowed", "bass"],
  },
  {
    id: "guitar",
    name: "Guitar",
    family: "Strings",
    description: "Acoustic guitar — plucked warmth and resonance",
    audioPath: "/manus-storage/guitar_a3aeea7e.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["strings", "acoustic", "plucked", "folk"],
  },
  {
    id: "banjo",
    name: "Banjo",
    family: "Strings",
    description: "Bright, twangy plucked strings — folk and bluegrass",
    audioPath: "/manus-storage/banjo_92b71dab.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["strings", "folk", "bluegrass", "plucked", "americana"],
  },
  {
    id: "mandolin",
    name: "Mandolin",
    family: "Strings",
    description: "Bright, shimmering plucked strings — folk and classical",
    audioPath: "/manus-storage/mandolin_c80b5655.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["strings", "folk", "plucked", "bright"],
  },

  // ── Woodwind ─────────────────────────────────────────────────────────────
  {
    id: "flute",
    name: "Flute",
    family: "Woodwind",
    description: "Clear, airy tone — light and expressive",
    audioPath: "/manus-storage/flute_45776a60.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["woodwind", "classical", "orchestral", "airy"],
  },
  {
    id: "oboe",
    name: "Oboe",
    family: "Woodwind",
    description: "Nasal, penetrating tone — highly distinctive",
    audioPath: "/manus-storage/oboe_524fb0ef.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["woodwind", "classical", "orchestral", "reedy"],
  },
  {
    id: "cor-anglais",
    name: "Cor Anglais",
    family: "Woodwind",
    description: "English horn — deeper, more melancholic than oboe",
    audioPath: "/manus-storage/cor-anglais_eb7b4216.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["woodwind", "classical", "orchestral", "reedy", "deep"],
  },
  {
    id: "clarinet",
    name: "Clarinet",
    family: "Woodwind",
    description: "Smooth, versatile tone — jazz and classical",
    audioPath: "/manus-storage/clarinet_608fe362.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["woodwind", "classical", "jazz", "smooth"],
  },
  {
    id: "bass-clarinet",
    name: "Bass Clarinet",
    family: "Woodwind",
    description: "Dark, rich low clarinet tone",
    audioPath: "/manus-storage/bass-clarinet_8acddca7.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["woodwind", "classical", "dark", "bass"],
  },
  {
    id: "bassoon",
    name: "Bassoon",
    family: "Woodwind",
    description: "Deep, reedy bass woodwind — expressive and warm",
    audioPath: "/manus-storage/bassoon_76e98d7f.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["woodwind", "classical", "orchestral", "bass", "reedy"],
  },
  {
    id: "contrabassoon",
    name: "Contrabassoon",
    family: "Woodwind",
    description: "The deepest woodwind — dark, rumbling bass",
    audioPath: "/manus-storage/contrabassoon_0210488f.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["woodwind", "classical", "bass", "deep", "dark"],
  },
  {
    id: "saxophone",
    name: "Saxophone",
    family: "Woodwind",
    description: "Warm, expressive tone — jazz, soul, and beyond",
    audioPath: "/manus-storage/saxophone_15346744.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["woodwind", "jazz", "soul", "expressive"],
  },

  // ── Brass ─────────────────────────────────────────────────────────────────
  {
    id: "trumpet",
    name: "Trumpet",
    family: "Brass",
    description: "Bright, piercing brass — fanfares and jazz",
    audioPath: "/manus-storage/trumpet_851d8bc6.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["brass", "classical", "jazz", "bright", "fanfare"],
  },
  {
    id: "trombone",
    name: "Trombone",
    family: "Brass",
    description: "Warm, rich brass — powerful and versatile",
    audioPath: "/manus-storage/trombone_c89f4137.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["brass", "classical", "jazz", "warm"],
  },
  {
    id: "french-horn",
    name: "French Horn",
    family: "Brass",
    description: "Mellow, noble brass — cinematic and hunting calls",
    audioPath: "/manus-storage/french-horn_7508ec3a.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["brass", "classical", "orchestral", "cinematic", "mellow"],
  },
  {
    id: "tuba",
    name: "Tuba",
    family: "Brass",
    description: "Deep, powerful bass brass — foundational and majestic",
    audioPath: "/manus-storage/tuba_13f0911f.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["brass", "classical", "bass", "deep", "powerful"],
  },

  // ── Percussion ────────────────────────────────────────────────────────────
  {
    id: "snare-drum",
    name: "Snare Drum",
    family: "Percussion",
    description: "Crisp, sharp percussion — marches and rhythmic drive",
    audioPath: "/manus-storage/snare-drum_6c017f60.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["percussion", "drums", "rhythmic", "crisp"],
  },
  {
    id: "bass-drum",
    name: "Bass Drum",
    family: "Percussion",
    description: "Deep, booming impact — orchestral power",
    audioPath: "/manus-storage/bass-drum_0227771e.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["percussion", "drums", "deep", "impact"],
  },
  {
    id: "tam-tam",
    name: "Tam-Tam (Gong)",
    family: "Percussion",
    description: "Resonant, shimmering gong — dramatic and ceremonial",
    audioPath: "/manus-storage/tam-tam_a97c043a.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["percussion", "gong", "dramatic", "resonant", "ceremonial"],
  },
  {
    id: "triangle",
    name: "Triangle",
    family: "Percussion",
    description: "Pure, ringing metallic tone — delicate and bright",
    audioPath: "/manus-storage/triangle_2d64cea6.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["percussion", "metallic", "bright", "delicate"],
  },
  {
    id: "tambourine",
    name: "Tambourine",
    family: "Percussion",
    description: "Jingle and thump — folk, pop, and world music",
    audioPath: "/manus-storage/tambourine_db95547e.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["percussion", "folk", "pop", "jingle"],
  },
  {
    id: "sleigh-bells",
    name: "Sleigh Bells",
    family: "Percussion",
    description: "Bright, festive jingle — seasonal and celebratory",
    audioPath: "/manus-storage/sleigh-bells_467051de.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["percussion", "festive", "bright", "jingle"],
  },
  {
    id: "wind-chimes",
    name: "Wind Chimes",
    family: "Percussion",
    description: "Ethereal, shimmering tones — meditative and ambient",
    audioPath: "/manus-storage/wind-chimes_d46be54a.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["percussion", "ambient", "ethereal", "meditative"],
  },
  {
    id: "djembe",
    name: "Djembe",
    family: "Percussion",
    description: "West African hand drum — earthy, rhythmic energy",
    audioPath: "/manus-storage/djembe_7e23059c.mp3",
    source: "Philharmonia Orchestra (CC BY-SA 3.0)",
    tags: ["percussion", "world", "african", "rhythmic", "hand drum"],
  },

  // ── World & Folk ──────────────────────────────────────────────────────────
  {
    id: "bagpipes",
    name: "Bagpipes",
    family: "World & Folk",
    description: "Scottish Highland pipes — drone and chanter",
    audioPath: "/manus-storage/bagpipes_1bf70488.mp3",
    source: "Freesound.org (CC0)",
    tags: ["world", "folk", "celtic", "scottish", "drone"],
  },
  {
    id: "didgeridoo",
    name: "Didgeridoo",
    family: "World & Folk",
    description: "Australian Aboriginal wind instrument — deep drone",
    audioPath: "/manus-storage/didgeridoo_da5e38f0.mp3",
    source: "Freesound.org (CC0)",
    tags: ["world", "folk", "aboriginal", "australian", "drone", "deep"],
  },
  {
    id: "sitar",
    name: "Sitar",
    family: "World & Folk",
    description: "North Indian plucked strings — meditative and hypnotic",
    audioPath: "/manus-storage/sitar_3800dc1f.mp3",
    source: "Wikimedia Commons (CC0)",
    tags: ["world", "indian", "classical", "plucked", "meditative"],
  },
  {
    id: "tabla",
    name: "Tabla",
    family: "World & Folk",
    description: "Indian hand drums — intricate rhythmic patterns",
    audioPath: "/manus-storage/tabla_edb7f0a0.mp3",
    source: "Wikimedia Commons (CC0)",
    tags: ["world", "indian", "percussion", "rhythmic", "hand drum"],
  },
  {
    id: "shakuhachi",
    name: "Shakuhachi",
    family: "World & Folk",
    description: "Japanese bamboo flute — breathy, meditative tone",
    audioPath: "/manus-storage/shakuhachi_4ae0dfe3.mp3",
    source: "Wikimedia Commons (CC0)",
    tags: ["world", "japanese", "flute", "meditative", "breathy"],
  },
  {
    id: "steel-drum",
    name: "Steel Drum",
    family: "World & Folk",
    description: "Caribbean steel pan — bright, melodic percussion",
    audioPath: "/manus-storage/steel-drum_39bf8952.mp3",
    source: "Wikimedia Commons (CC0)",
    tags: ["world", "caribbean", "percussion", "melodic", "bright"],
  },
  {
    id: "dulcimer",
    name: "Dulcimer",
    family: "World & Folk",
    description: "Appalachian mountain dulcimer — folk and Americana",
    audioPath: "/manus-storage/dulcimer_4e32a351.mp3",
    source: "Wikimedia Commons (CC0)",
    tags: ["world", "folk", "americana", "appalachian", "plucked"],
  },
  {
    id: "erhu",
    name: "Erhu",
    family: "World & Folk",
    description: "Chinese two-string fiddle — expressive and mournful",
    audioPath: "/manus-storage/erhu_c3e16124.mp3",
    source: "Wikimedia Commons (CC0)",
    tags: ["world", "chinese", "bowed", "expressive", "mournful"],
  },
  {
    id: "hurdy-gurdy",
    name: "Hurdy-Gurdy",
    family: "World & Folk",
    description: "Medieval drone instrument — haunting and hypnotic",
    audioPath: "/manus-storage/hurdy-gurdy_89a576e9.mp3",
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
