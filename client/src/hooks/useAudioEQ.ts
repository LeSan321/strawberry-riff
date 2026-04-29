import { useEffect, useRef, useState } from "react";

export interface EQSettings {
  bass: number;
  mid: number;
  treble: number;
}

interface AudioNode {
  bass: BiquadFilterNode;
  mid: BiquadFilterNode;
  treble: BiquadFilterNode;
}

/**
 * Hook for applying 3-band EQ to audio using Web Audio API
 * Provides real-time preview and processing
 */
export function useAudioEQ() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const filtersRef = useRef<AudioNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Initialize Web Audio API
  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  // Create EQ filters
  const createEQFilters = (audioContext: AudioContext): AudioNode => {
    const bass = audioContext.createBiquadFilter();
    bass.type = "lowshelf";
    bass.frequency.value = 100;
    bass.gain.value = 0;

    const mid = audioContext.createBiquadFilter();
    mid.type = "peaking";
    mid.frequency.value = 1000;
    mid.Q.value = 1;
    mid.gain.value = 0;

    const treble = audioContext.createBiquadFilter();
    treble.type = "highshelf";
    treble.frequency.value = 10000;
    treble.gain.value = 0;

    // Connect filters in series
    bass.connect(mid);
    mid.connect(treble);

    return { bass, mid, treble };
  };

  // Apply EQ settings to filters
  const applyEQSettings = (settings: EQSettings) => {
    if (!filtersRef.current) return;

    filtersRef.current.bass.gain.setValueAtTime(
      settings.bass,
      audioContextRef.current!.currentTime
    );
    filtersRef.current.mid.gain.setValueAtTime(
      settings.mid,
      audioContextRef.current!.currentTime
    );
    filtersRef.current.treble.gain.setValueAtTime(
      settings.treble,
      audioContextRef.current!.currentTime
    );
  };

  // Load audio file and set up processing chain
  const loadAudio = async (audioUrl: string): Promise<AudioBuffer> => {
    const audioContext = initAudioContext();

    const response = await fetch(audioUrl);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    return audioBuffer;
  };

  // Play audio with EQ applied
  const playWithEQ = async (
    audioUrl: string,
    eqSettings: EQSettings
  ): Promise<void> => {
    const audioContext = initAudioContext();

    // Stop existing playback
    if (sourceRef.current) {
      sourceRef.current.stop();
    }

    // Load audio
    const audioBuffer = await loadAudio(audioUrl);

    // Create source
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    sourceRef.current = source;

    // Create filters if not already created
    if (!filtersRef.current) {
      filtersRef.current = createEQFilters(audioContext);
    }

    // Create analyser for visualization
    if (!analyserRef.current) {
      analyserRef.current = audioContext.createAnalyser();
      analyserRef.current.fftSize = 2048;
    }

    // Apply EQ settings
    applyEQSettings(eqSettings);

    // Connect: source → filters → analyser → destination
    source.connect(filtersRef.current.bass);
    filtersRef.current.treble.connect(analyserRef.current);
    analyserRef.current.connect(audioContext.destination);

    // Play
    source.start(0);
    setIsPlaying(true);

    // Update playing state when finished
    source.onended = () => {
      setIsPlaying(false);
    };
  };

  // Stop playback
  const stop = () => {
    if (sourceRef.current) {
      sourceRef.current.stop();
      setIsPlaying(false);
    }
  };

  // Update EQ in real-time (while playing)
  const updateEQ = (settings: EQSettings) => {
    applyEQSettings(settings);
  };

  // Get frequency data for visualization
  const getFrequencyData = (): Uint8Array | null => {
    if (!analyserRef.current) return null;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    return dataArray;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sourceRef.current) {
        try {
          sourceRef.current.stop();
        } catch (e) {
          // Already stopped
        }
      }
    };
  }, []);

  return {
    playWithEQ,
    stop,
    updateEQ,
    getFrequencyData,
    isPlaying,
    audioContext: audioContextRef.current,
  };
}
