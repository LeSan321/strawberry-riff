import React, { createContext, useCallback, useContext, useRef, useState } from "react";

export interface PlayerTrack {
  id: number;
  title: string;
  artist?: string | null;
  audioUrl: string;
  gradient?: string | null;
  moodTags?: string[];
}

interface AudioPlayerState {
  currentTrack: PlayerTrack | null;
  isPlaying: boolean;
  progress: number; // 0–100
  duration: number; // seconds
  currentTime: number; // seconds
  volume: number; // 0–1
}

interface AudioPlayerContextValue extends AudioPlayerState {
  play: (track: PlayerTrack) => void;
  pause: () => void;
  resume: () => void;
  seek: (pct: number) => void;
  setVolume: (v: number) => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null);

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<AudioPlayerState>({
    currentTrack: null,
    isPlaying: false,
    progress: 0,
    duration: 0,
    currentTime: 0,
    volume: 0.8,
  });

  const play = useCallback((track: PlayerTrack) => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const audio = audioRef.current;

    // If same track, just resume
    if (state.currentTrack?.id === track.id) {
      audio.play().catch(console.error);
      setState((s) => ({ ...s, isPlaying: true }));
      return;
    }

    audio.pause();
    audio.src = track.audioUrl;
    audio.volume = state.volume;

    audio.ontimeupdate = () => {
      setState((s) => ({
        ...s,
        currentTime: audio.currentTime,
        progress: audio.duration ? (audio.currentTime / audio.duration) * 100 : 0,
      }));
    };
    audio.ondurationchange = () => {
      setState((s) => ({ ...s, duration: audio.duration || 0 }));
    };
    audio.onended = () => {
      setState((s) => ({ ...s, isPlaying: false, progress: 0, currentTime: 0 }));
    };

    audio.play().catch(console.error);
    setState((s) => ({ ...s, currentTrack: track, isPlaying: true, progress: 0, currentTime: 0 }));
  }, [state.currentTrack?.id, state.volume]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setState((s) => ({ ...s, isPlaying: false }));
  }, []);

  const resume = useCallback(() => {
    audioRef.current?.play().catch(console.error);
    setState((s) => ({ ...s, isPlaying: true }));
  }, []);

  const seek = useCallback((pct: number) => {
    if (!audioRef.current || !audioRef.current.duration) return;
    audioRef.current.currentTime = (pct / 100) * audioRef.current.duration;
  }, []);

  const setVolume = useCallback((v: number) => {
    if (audioRef.current) audioRef.current.volume = v;
    setState((s) => ({ ...s, volume: v }));
  }, []);

  return (
    <AudioPlayerContext.Provider value={{ ...state, play, pause, resume, seek, setVolume, audioRef }}>
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx) throw new Error("useAudioPlayer must be used within AudioPlayerProvider");
  return ctx;
}
