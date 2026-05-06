/**
 * Cover Art Dimension Inference Engine
 * 
 * Automatically infers all 15 dimension answers from musicGeneration metadata
 * using the three-dimension framework (Energy, Emotion, Culture)
 */

export interface MusicGenerationMetadata {
  vocalSpectrum: number; // 0-100 (archetype slider)
  visualBrief?: string; // AI-generated visual description
  prompt?: string; // Original generation prompt
  moodTags?: string[]; // Mood tags from generation
  genre?: string; // Genre/style
  duration?: number; // Track duration in seconds
  vocalGender?: 'male' | 'female' | 'neutral'; // Vocal gender
  energy?: number; // Energy level 0-100 if captured
}

export interface DimensionAnswers {
  // Energy Dimensions (5)
  energyDirection: 'expansive' | 'compressive' | 'balanced'; // 0-100 scale
  energyShape: 'build' | 'release' | 'pulse' | 'rise' | 'dissolve' | 'tension'; // 0-100 scale
  energyTexture: 'smooth' | 'mechanical' | 'rough' | 'organic' | 'hybrid'; // 0-100 scale
  energyWeight: 'heavy' | 'grounded' | 'balanced' | 'light' | 'suspended'; // 0-100 scale
  energyPace: 'urgent' | 'driven' | 'steady' | 'suspended' | 'meditative'; // 0-100 scale

  // Emotion Dimensions (5)
  emotionStance: 'power' | 'vulnerability' | 'grief' | 'joy' | 'defiance' | 'transcendence'; // 0-100 scale
  emotionResolution: 'resolved' | 'open' | 'ambiguous'; // 0-100 scale
  emotionIntensity: 'subtle' | 'moderate' | 'intense'; // 0-100 scale
  emotionTone: 'warm' | 'cool' | 'neutral'; // 0-100 scale
  emotionMovement: 'ascending' | 'descending' | 'cyclical' | 'static'; // 0-100 scale

  // Culture Dimensions (5)
  culturePosition: 'ahead' | 'alongside' | 'behind'; // 0-100 scale
  cultureAuthenticity: 'raw' | 'polished' | 'hybrid'; // 0-100 scale
  cultureDensity: 'sparse' | 'moderate' | 'dense'; // 0-100 scale
  cultureTemporality: 'timeless' | 'contemporary' | 'retro'; // 0-100 scale
  cultureReference: 'universal' | 'niche' | 'personal'; // 0-100 scale

  // Confidence scores (0.0-1.0)
  confidenceScores: {
    [key: string]: number;
  };

  // Synthesis fingerprint (one paragraph describing what the music expresses)
  synthesisFingerprint: string;
}

/**
 * Infer dimension answers from musicGeneration metadata
 */
export function inferDimensions(metadata: MusicGenerationMetadata): DimensionAnswers {
  const confidence = {
    energyDirection: 0.7,
    energyShape: 0.6,
    energyTexture: 0.65,
    energyWeight: 0.7,
    energyPace: 0.65,
    emotionStance: 0.75,
    emotionResolution: 0.6,
    emotionIntensity: 0.7,
    emotionTone: 0.65,
    emotionMovement: 0.6,
    culturePosition: 0.7,
    cultureAuthenticity: 0.65,
    cultureDensity: 0.6,
    cultureTemporality: 0.75,
    cultureReference: 0.65,
  };

  // Energy Dimensions
  const energyDirection = inferEnergyDirection(metadata);
  const energyShape = inferEnergyShape(metadata);
  const energyTexture = inferEnergyTexture(metadata);
  const energyWeight = inferEnergyWeight(metadata);
  const energyPace = inferEnergyPace(metadata);

  // Emotion Dimensions
  const emotionStance = inferEmotionStance(metadata);
  const emotionResolution = inferEmotionResolution(metadata);
  const emotionIntensity = inferEmotionIntensity(metadata);
  const emotionTone = inferEmotionTone(metadata);
  const emotionMovement = inferEmotionMovement(metadata);

  // Culture Dimensions
  const culturePosition = inferCulturePosition(metadata);
  const cultureAuthenticity = inferCultureAuthenticity(metadata);
  const cultureDensity = inferCultureDensity(metadata);
  const cultureTemporality = inferCultureTemporality(metadata);
  const cultureReference = inferCultureReference(metadata);

  // Generate synthesis fingerprint
  const synthesisFingerprint = generateSynthesisFingerprint({
    energyDirection,
    emotionStance,
    culturePosition,
    metadata,
  });

  return {
    energyDirection,
    energyShape,
    energyTexture,
    energyWeight,
    energyPace,
    emotionStance,
    emotionResolution,
    emotionIntensity,
    emotionTone,
    emotionMovement,
    culturePosition,
    cultureAuthenticity,
    cultureDensity,
    cultureTemporality,
    cultureReference,
    confidenceScores: confidence,
    synthesisFingerprint,
  };
}

// ============================================================================
// ENERGY DIMENSION INFERENCES
// ============================================================================

function inferEnergyDirection(metadata: MusicGenerationMetadata): 'expansive' | 'compressive' | 'balanced' {
  const spectrum = metadata.vocalSpectrum ?? 50;
  const moodTags = metadata.moodTags ?? [];
  const prompt = (metadata.prompt ?? '').toLowerCase();

  // High spectrum + expansive mood tags = expansive
  if (spectrum > 65 && (moodTags.some(t => ['energetic', 'uplifting', 'bright', 'open'].includes(t.toLowerCase())) || prompt.includes('expansive'))) {
    return 'expansive';
  }

  // Low spectrum + introspective mood tags = compressive
  if (spectrum < 35 && (moodTags.some(t => ['intimate', 'introspective', 'dark', 'closed'].includes(t.toLowerCase())) || prompt.includes('intimate'))) {
    return 'compressive';
  }

  return 'balanced';
}

function inferEnergyShape(metadata: MusicGenerationMetadata): 'build' | 'release' | 'pulse' | 'rise' | 'dissolve' | 'tension' {
  const prompt = (metadata.prompt ?? '').toLowerCase();
  const moodTags = metadata.moodTags ?? [];

  if (prompt.includes('build') || moodTags.some(t => t.toLowerCase().includes('build'))) return 'build';
  if (prompt.includes('release') || moodTags.some(t => t.toLowerCase().includes('release'))) return 'release';
  if (prompt.includes('pulse') || moodTags.some(t => t.toLowerCase().includes('pulse'))) return 'pulse';
  if (prompt.includes('rise') || moodTags.some(t => t.toLowerCase().includes('rise'))) return 'rise';
  if (prompt.includes('dissolve') || moodTags.some(t => t.toLowerCase().includes('dissolve'))) return 'dissolve';
  if (prompt.includes('tension') || moodTags.some(t => t.toLowerCase().includes('tension'))) return 'tension';

  // Default based on spectrum
  return metadata.vocalSpectrum ?? 50 > 60 ? 'build' : 'pulse';
}

function inferEnergyTexture(metadata: MusicGenerationMetadata): 'smooth' | 'mechanical' | 'rough' | 'organic' | 'hybrid' {
  const prompt = (metadata.prompt ?? '').toLowerCase();
  const genre = (metadata.genre ?? '').toLowerCase();

  if (prompt.includes('smooth') || prompt.includes('polished')) return 'smooth';
  if (prompt.includes('mechanical') || prompt.includes('digital') || genre.includes('electronic')) return 'mechanical';
  if (prompt.includes('rough') || prompt.includes('raw') || genre.includes('grunge')) return 'rough';
  if (prompt.includes('organic') || prompt.includes('natural') || genre.includes('acoustic')) return 'organic';

  return 'hybrid';
}

function inferEnergyWeight(metadata: MusicGenerationMetadata): 'heavy' | 'grounded' | 'balanced' | 'light' | 'suspended' {
  const spectrum = metadata.vocalSpectrum ?? 50;
  const genre = (metadata.genre ?? '').toLowerCase();

  if (genre.includes('metal') || genre.includes('heavy') || spectrum < 20) return 'heavy';
  if (genre.includes('ambient') || genre.includes('ethereal') || spectrum > 80) return 'suspended';
  if (spectrum > 60) return 'light';
  if (spectrum < 40) return 'grounded';

  return 'balanced';
}

function inferEnergyPace(metadata: MusicGenerationMetadata): 'urgent' | 'driven' | 'steady' | 'suspended' | 'meditative' {
  const prompt = (metadata.prompt ?? '').toLowerCase();
  const genre = (metadata.genre ?? '').toLowerCase();

  if (prompt.includes('urgent') || prompt.includes('fast') || genre.includes('drum')) return 'urgent';
  if (prompt.includes('driven') || prompt.includes('energetic')) return 'driven';
  if (prompt.includes('meditative') || prompt.includes('slow') || genre.includes('ambient')) return 'meditative';
  if (prompt.includes('suspended') || prompt.includes('floating')) return 'suspended';

  return 'steady';
}

// ============================================================================
// EMOTION DIMENSION INFERENCES
// ============================================================================

function inferEmotionStance(metadata: MusicGenerationMetadata): 'power' | 'vulnerability' | 'grief' | 'joy' | 'defiance' | 'transcendence' {
  const prompt = (metadata.prompt ?? '').toLowerCase();
  const moodTags = metadata.moodTags ?? [];

  if (prompt.includes('powerful') || moodTags.some(t => t.toLowerCase().includes('power'))) return 'power';
  if (prompt.includes('vulnerable') || moodTags.some(t => t.toLowerCase().includes('vulnerable'))) return 'vulnerability';
  if (prompt.includes('grief') || prompt.includes('sad') || moodTags.some(t => t.toLowerCase().includes('grief'))) return 'grief';
  if (prompt.includes('joy') || prompt.includes('happy') || moodTags.some(t => t.toLowerCase().includes('joy'))) return 'joy';
  if (prompt.includes('defiant') || moodTags.some(t => t.toLowerCase().includes('defiant'))) return 'defiance';
  if (prompt.includes('transcendent') || prompt.includes('spiritual') || moodTags.some(t => t.toLowerCase().includes('transcend'))) return 'transcendence';

  return 'joy'; // Default positive stance
}

function inferEmotionResolution(metadata: MusicGenerationMetadata): 'resolved' | 'open' | 'ambiguous' {
  const prompt = (metadata.prompt ?? '').toLowerCase();

  if (prompt.includes('resolved') || prompt.includes('conclusive')) return 'resolved';
  if (prompt.includes('open') || prompt.includes('unresolved')) return 'open';

  return 'ambiguous';
}

function inferEmotionIntensity(metadata: MusicGenerationMetadata): 'subtle' | 'moderate' | 'intense' {
  const spectrum = metadata.vocalSpectrum ?? 50;
  const prompt = (metadata.prompt ?? '').toLowerCase();

  if (prompt.includes('intense') || spectrum > 75) return 'intense';
  if (prompt.includes('subtle') || spectrum < 30) return 'subtle';

  return 'moderate';
}

function inferEmotionTone(metadata: MusicGenerationMetadata): 'warm' | 'cool' | 'neutral' {
  const prompt = (metadata.prompt ?? '').toLowerCase();
  const moodTags = metadata.moodTags ?? [];

  if (prompt.includes('warm') || moodTags.some(t => ['cozy', 'intimate', 'comforting'].includes(t.toLowerCase()))) return 'warm';
  if (prompt.includes('cool') || moodTags.some(t => ['cold', 'distant', 'detached'].includes(t.toLowerCase()))) return 'cool';

  return 'neutral';
}

function inferEmotionMovement(metadata: MusicGenerationMetadata): 'ascending' | 'descending' | 'cyclical' | 'static' {
  const prompt = (metadata.prompt ?? '').toLowerCase();

  if (prompt.includes('ascending') || prompt.includes('rising')) return 'ascending';
  if (prompt.includes('descending') || prompt.includes('falling')) return 'descending';
  if (prompt.includes('cyclical') || prompt.includes('loop')) return 'cyclical';
  if (prompt.includes('static') || prompt.includes('still')) return 'static';

  return 'cyclical'; // Default
}

// ============================================================================
// CULTURE DIMENSION INFERENCES
// ============================================================================

function inferCulturePosition(metadata: MusicGenerationMetadata): 'ahead' | 'alongside' | 'behind' {
  const prompt = (metadata.prompt ?? '').toLowerCase();
  const genre = (metadata.genre ?? '').toLowerCase();

  // Experimental/avant-garde = ahead
  if (prompt.includes('experimental') || prompt.includes('avant-garde') || genre.includes('experimental')) return 'ahead';

  // Retro/vintage = behind
  if (prompt.includes('retro') || prompt.includes('vintage') || genre.includes('80s') || genre.includes('90s')) return 'behind';

  return 'alongside';
}

function inferCultureAuthenticity(metadata: MusicGenerationMetadata): 'raw' | 'polished' | 'hybrid' {
  const prompt = (metadata.prompt ?? '').toLowerCase();

  if (prompt.includes('raw') || prompt.includes('unpolished') || prompt.includes('lo-fi')) return 'raw';
  if (prompt.includes('polished') || prompt.includes('professional') || prompt.includes('hi-fi')) return 'polished';

  return 'hybrid';
}

function inferCultureDensity(metadata: MusicGenerationMetadata): 'sparse' | 'moderate' | 'dense' {
  const spectrum = metadata.vocalSpectrum ?? 50;
  const prompt = (metadata.prompt ?? '').toLowerCase();

  if (prompt.includes('sparse') || spectrum < 30) return 'sparse';
  if (prompt.includes('dense') || spectrum > 75) return 'dense';

  return 'moderate';
}

function inferCultureTemporality(metadata: MusicGenerationMetadata): 'timeless' | 'contemporary' | 'retro' {
  const prompt = (metadata.prompt ?? '').toLowerCase();
  const genre = (metadata.genre ?? '').toLowerCase();

  if (prompt.includes('timeless') || prompt.includes('eternal')) return 'timeless';
  if (prompt.includes('contemporary') || prompt.includes('modern') || prompt.includes('2020s')) return 'contemporary';
  if (prompt.includes('retro') || prompt.includes('vintage') || genre.includes('80s') || genre.includes('90s')) return 'retro';

  return 'contemporary'; // Default
}

function inferCultureReference(metadata: MusicGenerationMetadata): 'universal' | 'niche' | 'personal' {
  const prompt = (metadata.prompt ?? '').toLowerCase();

  if (prompt.includes('universal') || prompt.includes('mainstream')) return 'universal';
  if (prompt.includes('niche') || prompt.includes('underground')) return 'niche';
  if (prompt.includes('personal') || prompt.includes('introspective')) return 'personal';

  return 'universal'; // Default
}

// ============================================================================
// SYNTHESIS FINGERPRINT
// ============================================================================

interface SynthesisInput {
  energyDirection: string;
  emotionStance: string;
  culturePosition: string;
  metadata: MusicGenerationMetadata;
}

function generateSynthesisFingerprint(input: SynthesisInput): string {
  const { energyDirection, emotionStance, culturePosition, metadata } = input;

  // Generate a one-paragraph synthesis that captures the essence
  const genre = metadata.genre || 'music';
  const vocalGender = metadata.vocalGender || 'neutral';

  const fingerprints: { [key: string]: string } = {
    'expansive-power-ahead': `This is forward-thinking, ambitious ${genre} that pushes boundaries. The ${vocalGender} vocal presence is bold and commanding, creating space that feels both powerful and pioneering. The music expands outward with confidence, inviting listeners into a vision of what's possible.`,

    'expansive-power-alongside': `This is contemporary ${genre} with commanding presence. The ${vocalGender} vocals anchor a sound that feels both confident and connected to current culture. The energy moves outward with purpose, speaking to shared experience and collective momentum.`,

    'expansive-vulnerability-alongside': `This is modern ${genre} that balances openness with authenticity. The ${vocalGender} voice carries emotional truth while the arrangement creates space for connection. The music expands gently, inviting intimacy without losing its contemporary edge.`,

    'compressive-vulnerability-behind': `This is introspective, timeless ${genre} with intimate depth. The ${vocalGender} vocals draw listeners inward, creating a sense of personal revelation. The sound feels both nostalgic and emotionally raw, suggesting wisdom earned through reflection.`,

    'balanced-joy-alongside': `This is accessible, joyful ${genre} that feels both grounded and uplifting. The ${vocalGender} presence is warm and inviting, creating a sense of shared celebration. The music maintains equilibrium between energy and ease, making space for both movement and rest.`,
  };

  // Try to find a matching fingerprint, otherwise generate a generic one
  const key = `${energyDirection}-${emotionStance}-${culturePosition}`;
  if (fingerprints[key]) {
    return fingerprints[key];
  }

  // Generic fallback
  return `This ${genre} expresses ${emotionStance} energy with a ${energyDirection} quality, positioned ${culturePosition} of contemporary culture. The ${vocalGender} vocal presence anchors the sound, creating a listening experience that feels both intentional and emotionally resonant.`;
}

/**
 * Convert dimension answers to a JSON string for storage
 */
export function serializeDimensions(dimensions: DimensionAnswers): string {
  return JSON.stringify(dimensions);
}

/**
 * Parse dimension answers from stored JSON
 */
export function deserializeDimensions(json: string): DimensionAnswers {
  return JSON.parse(json);
}
