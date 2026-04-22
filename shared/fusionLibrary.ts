/**
 * Fusion Recipe Library for Strawberry Riff
 * All 47 fusions organized by tier with ready-to-paste prompt cores
 * Based on Chapter 10 of the Music Prompt Bible v1.3
 */

export interface Fusion {
  name: string;
  tier: "safe" | "medium" | "experimental" | "global" | "wildcard";
  promptCore: string;
  whyItWorks?: string;
  visualSynergy?: string;
}

export const FUSIONS: Fusion[] = [
  // Tier 1: Safe Starters
  {
    name: "Lo-fi Hip Hop + Dreamy Jazz",
    tier: "safe",
    promptCore:
      "dreamy lo-fi hip hop infused with warm jazz harmonies, soft brushed drums, Rhodes piano, gentle blue-note leaps, 88 BPM",
    whyItWorks:
      "Warm Rhodes + dusty drums + gentle blue-note leaps = instant sing-along chill",
    visualSynergy: "Soft velvet lighting, slow swaying avatars in the Jazz Club",
  },
  {
    name: "Indie Folk + Shimmering Electronic",
    tier: "safe",
    promptCore:
      "indie folk meets shimmering electronic, fingerpicked acoustic guitar over warm synth pads, subtle four-on-the-floor pulse, 112 BPM",
    whyItWorks:
      "Acoustic warmth + pulsing synths creates emotional contrast and rhythmic drive",
    visualSynergy:
      "Candlelit acoustic stage transitioning to pulsing neon — Acoustic Stage with electronic lighting",
  },
  {
    name: "Cinematic Orchestral + Chill Trap",
    tier: "safe",
    promptCore:
      "cinematic orchestral fused with laid-back trap, soaring strings over deep 808s and subtle hi-hats, emotional build, 90 BPM",
    whyItWorks:
      "Grand strings grounded by a slow trap pulse creates emotional weight without overwhelming",
  },
  {
    name: "R&B + Lo-fi House",
    tier: "safe",
    promptCore:
      "smooth R&B vocals fused with lo-fi house, soulful melodies over warm deep house grooves and vinyl crackle, 118 BPM",
    whyItWorks:
      "Soulful melody + warm house groove = the feeling of a late-night city drive",
  },
  {
    name: "Indie Pop + Afrobeat",
    tier: "safe",
    promptCore:
      "indie pop fused with vibrant Afrobeat rhythms, catchy hooks over polyrhythmic percussion and joyful horns, 115 BPM",
    whyItWorks:
      "Catchy pop hooks over polyrhythmic percussion creates irresistible forward momentum",
  },

  // Tier 2: Medium-Wild
  {
    name: "ABBA-style Disco + Dark Synthwave",
    tier: "medium",
    promptCore:
      "ABBA-style glittering disco fused with dark 80s synthwave, lush female harmonies, pulsing arpeggios, driving bassline, 126 BPM",
    whyItWorks:
      "Bright, repetitive hooks + retro-futuristic coldness = massive Zeigarnik tension",
    visualSynergy:
      "Mirror ball reflections over cold blue neon — Neon Warehouse with vintage disco lighting",
  },
  {
    name: "Jazz Club Swing + Reggaeton/Dembow",
    tier: "medium",
    promptCore:
      "smooth jazz club swing fused with reggaeton dembow, sultry saxophone over tight dembow percussion and warm brass stabs, 98 BPM",
    whyItWorks:
      "Swing + dembow rhythm creates irresistible body movement with jazz sophistication",
    visualSynergy:
      "Velvet Strawberry Jazz Club with tropical lighting and slow-motion avatar movement",
  },
  {
    name: "Cinematic Orchestral + Hyperpop",
    tier: "medium",
    promptCore:
      "cinematic orchestral fused with hyperpop, soaring strings and choir over glitchy 808s and supersaw leads, dramatic build-drop, 140 BPM",
    whyItWorks:
      "Epic strings + glitchy hyperpop drops = huge emotional peaks and surprising leaps",
    visualSynergy:
      "Grand concert hall with glitch-art lighting — Unreal Engine Sequencer cinematic cuts",
  },
  {
    name: "Country Twang + Future Bass",
    tier: "medium",
    promptCore:
      "warm country acoustic guitar and pedal steel fused with shimmering future bass, heartfelt vocals over supersaw chords and rolling basslines, 130 BPM",
    whyItWorks:
      "Heartfelt storytelling vocals + supersaw chords = emotional contrast that hits harder",
  },
  {
    name: "Psychedelic 60s Rock + Vaporwave",
    tier: "medium",
    promptCore:
      "psychedelic 60s rock with fuzzy guitars and organ fused with vaporwave, warped tape echoes and slowed city-pop chords, 95 BPM",
    whyItWorks:
      "Both genres share a love of warped, dreamy textures — nostalgic twice over",
  },
  {
    name: "Gospel Choir + Minimal Techno",
    tier: "medium",
    promptCore:
      "soulful gospel choir fused with hypnotic minimal techno, layered vocal harmonies over pulsing four-on-the-floor and razor-sharp hi-hats, 128 BPM",
    whyItWorks:
      "Sacred communal energy + hypnotic mechanical pulse = transcendent and unstoppable",
  },
  {
    name: "Swing Jazz + Nightcore/Hyperpop",
    tier: "medium",
    promptCore:
      "big-band swing jazz fused with nightcore hyperpop energy, walking bass and brass hits over glitched vocals and chopped samples, 170 BPM",
    whyItWorks:
      "Walking bass and brass are already rhythmically infectious; chopping at nightcore speed creates unhinged energy",
  },
  {
    name: "Flamenco + Cyberpunk Synthwave",
    tier: "medium",
    promptCore:
      "passionate flamenco guitar and handclaps fused with retro-futuristic synthwave, fiery Spanish runs over pulsating arpeggios, 120 BPM",
    whyItWorks:
      "Passionate, fiery guitar shares dramatic intensity with synthwave — ancient and futuristic",
  },
  {
    name: "Bluegrass + Dubstep",
    tier: "medium",
    promptCore:
      "high-energy bluegrass fiddle and banjo fused with filthy dubstep, lightning-fast acoustic runs over wobbly bass drops and massive reese bass, 140 BPM",
    whyItWorks:
      "Lightning-fast runs and wobbly bass share love of showing off technical extremes",
  },
  {
    name: "Bollywood + Lo-fi Hip Hop",
    tier: "medium",
    promptCore:
      "vibrant Bollywood strings and tablas fused with dreamy lo-fi hip hop, ornate Indian melodies over warm vinyl crackle and jazzy chords, 92 BPM",
    whyItWorks:
      "Ornate Indian melodies over vinyl crackle creates warm, cinematic nostalgia across cultures",
  },

  // Tier 3: Truly Experimental
  {
    name: "Baroque Classical + Breakbeat Drum & Bass",
    tier: "experimental",
    promptCore:
      "baroque harpsichord and strings fused with high-energy breakbeat drum & bass, intricate classical counterpoint over rolling amen breaks and sub bass, 170 BPM",
  },
  {
    name: "Bossa Nova + Djent Metal",
    tier: "experimental",
    promptCore:
      "smooth bossa nova nylon-string guitar fused with heavy djent metal, gentle percussion over crushing 7-string riffs and polyrhythms, 110 BPM",
  },
  {
    name: "Medieval Folk + Trap/Drill",
    tier: "experimental",
    promptCore:
      "medieval lute and recorder fused with dark trap and drill, haunting folk melodies over 808 slides and rapid hi-hat rolls, 140 BPM",
  },
  {
    name: "Opera Soprano + Glitch Hop",
    tier: "experimental",
    promptCore:
      "dramatic operatic soprano fused with glitch hop, soaring classical vocals chopped and glitched over heavy 808s and wonky bass, 135 BPM",
  },
  {
    name: "Gregorian Chant + Modern Trap",
    tier: "experimental",
    promptCore:
      "haunting Gregorian chant fused with dark trap, layered monastic vocals over deep 808s and atmospheric pads, 90 BPM",
  },
  {
    name: "Kawaii Metal (J-pop + Heavy Metal)",
    tier: "experimental",
    promptCore:
      "cute J-pop idol vocals fused with intense heavy metal, sugary melodies over crushing riffs and double-kick drums, 160 BPM",
  },
  {
    name: "Horror Soundtrack + Hyperpop",
    tier: "experimental",
    promptCore:
      "creepy horror orchestral fused with hyperpop, eerie strings and stabs over glitchy supersaws and chopped screams, 145 BPM",
  },
  {
    name: "Viking Folk Metal + Barbiecore Pop",
    tier: "experimental",
    promptCore:
      "epic Viking folk metal fused with bubbly Barbiecore pop, warrior chants over glittery synths and heavy guitars, 130 BPM",
  },
  {
    name: "Plunderphonics + Spoken Word Poetry",
    tier: "experimental",
    promptCore:
      "plunderphonics collage fused with spoken word poetry, chopped vintage samples over rhythmic spoken delivery and abstract beats, 95 BPM",
  },
  {
    name: "Dungeon Synth + Drill",
    tier: "experimental",
    promptCore:
      "dark dungeon synth fused with aggressive drill, atmospheric 80s pads over rapid hi-hats and sliding 808s, 140 BPM",
  },

  // Tier 4: Global & Cultural Mashups
  {
    name: "Afrobeats + Cinematic Orchestral",
    tier: "global",
    promptCore:
      "vibrant Afrobeats percussion fused with cinematic orchestral, energetic grooves over soaring strings and choir, 120 BPM",
  },
  {
    name: "Amapiano + Indie Rock",
    tier: "global",
    promptCore:
      "soulful amapiano log drums fused with indie rock guitars, catchy piano melodies over driving rock drums, 115 BPM",
  },
  {
    name: "Reggaeton + Psychedelic Rock",
    tier: "global",
    promptCore:
      "reggaeton dembow fused with psychedelic rock, tight percussion over fuzzy guitars and trippy organ solos, 98 BPM",
  },
  {
    name: "K-Pop + Country",
    tier: "global",
    promptCore:
      "polished K-pop production fused with heartfelt country, catchy hooks and harmonies over acoustic guitar and pedal steel, 125 BPM",
  },
  {
    name: "Latin Salsa + Techno",
    tier: "global",
    promptCore:
      "fiery Latin salsa brass and percussion fused with hypnotic techno, energetic horns over pulsing four-on-the-floor, 128 BPM",
  },
  {
    name: "Indian Classical + Future Bass",
    tier: "global",
    promptCore:
      "intricate Indian classical sitar and tabla fused with shimmering future bass, ornate melodies over supersaw chords and rolling bass, 130 BPM",
  },
  {
    name: "Celtic Folk + UK Garage",
    tier: "global",
    promptCore:
      "haunting Celtic folk fiddle and harp fused with UK garage, traditional melodies over bouncy 2-step beats and warm bass, 130 BPM",
  },
  {
    name: "Middle Eastern Maqam + Trap",
    tier: "global",
    promptCore:
      "exotic Middle Eastern maqam scales fused with dark trap, oud and vocal melismas over 808s and atmospheric pads, 95 BPM",
  },
  {
    name: "Afro House + Baroque",
    tier: "global",
    promptCore:
      "groovy Afro house fused with baroque elegance, polyrhythmic percussion over harpsichord and string arrangements, 122 BPM",
  },
  {
    name: "Tango + Drum & Bass",
    tier: "global",
    promptCore:
      "dramatic Argentine tango accordion and bandoneon fused with high-energy drum & bass, passionate melodies over rolling breaks, 170 BPM",
  },

  // Tier 5: Bonus Wildcards
  {
    name: "Pluggnb + Medieval Gregorian",
    tier: "wildcard",
    promptCore:
      "dreamy pluggnb fused with medieval Gregorian chant, melodic plugg elements over layered monastic vocals, 140 BPM",
  },
  {
    name: "Rockabilly + Cyberpunk Synthwave",
    tier: "wildcard",
    promptCore:
      "energetic rockabilly guitar and slap bass fused with cyberpunk synthwave, retro riffs over pulsing arpeggios and neon bass, 160 BPM",
  },
  {
    name: "Funk + Horror Industrial",
    tier: "wildcard",
    promptCore:
      "groovy 70s funk fused with dark horror industrial, slap bass and horns over grinding synths and mechanical percussion, 110 BPM",
  },
  {
    name: "Emo Rap + Big Band Swing",
    tier: "wildcard",
    promptCore:
      "emotional emo rap fused with big-band swing, heartfelt auto-tuned vocals over walking bass, brass hits and jazzy drums, 95 BPM",
  },
  {
    name: "Drill + Opera",
    tier: "wildcard",
    promptCore:
      "aggressive UK drill fused with dramatic opera, rapid flows and dark beats over soaring soprano vocals, 140 BPM",
  },
  {
    name: "Phonk + Classical Piano",
    tier: "wildcard",
    promptCore:
      "memphis phonk cowbell and chopped samples fused with classical piano, dark phonk beats over intricate piano runs, 150 BPM",
  },
  {
    name: "Ska + Witch House",
    tier: "wildcard",
    promptCore:
      "upbeat ska horns and guitar fused with dark witch house, energetic off-beat rhythms over occult synths and slow reverb, 120 BPM",
  },
  {
    name: "Motown Soul + IDM/Glitch",
    tier: "wildcard",
    promptCore:
      "classic Motown soul vocals fused with intelligent dance music glitch, warm harmonies over complex broken beats and warped samples, 105 BPM",
  },
  {
    name: "Grime + Flamenco",
    tier: "wildcard",
    promptCore:
      "raw UK grime fused with passionate flamenco, aggressive flows over fiery guitar runs and handclaps, 140 BPM",
  },
  {
    name: "Ambient Drone + Hyperpop",
    tier: "wildcard",
    promptCore:
      "ethereal ambient drone fused with explosive hyperpop, long atmospheric pads over glitchy supersaws and chopped vocals, 160 BPM",
  },
  {
    name: "Storytelling Metal + Lo-fi Chill",
    tier: "wildcard",
    promptCore:
      "epic storytelling metal fused with lo-fi chill, heavy riffs and growls over warm vinyl crackle and soft beats, 95 BPM",
  },
  {
    name: "Baile Funk + Baroque Harpsichord",
    tier: "wildcard",
    promptCore:
      "energetic Brazilian baile funk fused with baroque harpsichord, heavy bass and percussion over intricate classical lines, 130 BPM",
  },
];

/**
 * Wildcard Generator columns for the "Surprise Me" button
 * Randomly pick one from Column A and one from Column B
 */
export const WILDCARD_GENERATOR = {
  columnA: [
    "Lo-fi",
    "Jazz",
    "Indie Folk",
    "Cinematic Orchestral",
    "ABBA Disco",
    "Gospel",
    "Baroque",
    "Bossa Nova",
    "Psychedelic Rock",
    "Swing",
    "Afrobeats",
    "Indian Classical",
    "Celtic Folk",
    "Bollywood",
    "Flamenco",
  ],
  columnB: [
    "Trap",
    "Hyperpop",
    "Drum & Bass",
    "Synthwave",
    "Reggaeton",
    "Metal",
    "Vaporwave",
    "Techno",
    "Dubstep",
    "Nightcore",
    "Drill",
    "Future Bass",
    "Glitch Hop",
    "UK Garage",
    "Hyperpop",
  ],
};

/**
 * Helper function to pick a random fusion from the library
 */
export function getRandomFusion(): Fusion {
  return FUSIONS[Math.floor(Math.random() * FUSIONS.length)];
}

/**
 * Helper function to generate a random wildcard combination
 * Returns a descriptive string like "Baroque + Hyperpop"
 */
export function generateRandomWildcard(): string {
  const baseIdx = Math.floor(Math.random() * WILDCARD_GENERATOR.columnA.length);
  const twistIdx = Math.floor(Math.random() * WILDCARD_GENERATOR.columnB.length);
  return `${WILDCARD_GENERATOR.columnA[baseIdx]} + ${WILDCARD_GENERATOR.columnB[twistIdx]}`;
}

/**
 * Helper function to find a fusion by name (case-insensitive)
 * Used to map wildcard combinations to actual fusion prompt cores
 */
export function findFusionByName(name: string): Fusion | undefined {
  return FUSIONS.find(
    (f) => f.name.toLowerCase().includes(name.toLowerCase())
  );
}
