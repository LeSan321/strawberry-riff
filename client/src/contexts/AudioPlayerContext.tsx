import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

export interface PlayerTrack {
  id: number;
  title: string;
  artist?: string | null;
  audioUrl: string;
  gradient?: string | null;
  moodTags?: string[];
  coverArtUrl?: string | null;
}

export type RepeatMode = "off" | "one" | "all";

interface AudioPlayerState {
  currentTrack: PlayerTrack | null;
  isPlaying: boolean;
  isBuffering: boolean;  // true while waiting for data after stall/seek
  progress: number;      // 0–100
  duration: number;      // seconds
  currentTime: number;   // seconds
  volume: number;        // 0–1
  queue: PlayerTrack[];           // ordered list of tracks
  queueIndex: number;             // index of currentTrack in queue (-1 if not in queue)
  shuffle: boolean;
  repeat: RepeatMode;
}

interface AudioPlayerContextValue extends AudioPlayerState {
  play: (track: PlayerTrack, queue?: PlayerTrack[]) => void;
  pause: () => void;
  resume: () => void;
  seek: (pct: number) => void;
  setVolume: (v: number) => void;
  next: () => void;
  previous: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null);

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [state, setState] = useState<AudioPlayerState>({
    currentTrack: null,
    isPlaying: false,
    isBuffering: false,
    progress: 0,
    duration: 0,
    currentTime: 0,
    volume: 0.8,
    queue: [],
    queueIndex: -1,
    shuffle: false,
    repeat: "off",
  });

  // Keep a stable ref to state for use inside audio event callbacks
  const stateRef = useRef(state);
  stateRef.current = state;

  // ── Pause when tab is hidden, resume when visible again ──────────────────
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab hidden — pause playback to prevent ghost audio
        if (audioRef.current && !audioRef.current.paused) {
          audioRef.current.pause();
          setState((s) => ({ ...s, isPlaying: false }));
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // ── Cleanup audio element on unmount ─────────────────────────────────────
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current.load(); // abort pending network requests
        audioRef.current = null;
      }
    };
  }, []);

  const getOrCreateAudio = useCallback((): HTMLAudioElement => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      // Set preload to auto so the browser buffers aggressively
      audioRef.current.preload = "auto";
    }
    return audioRef.current;
  }, []);

  const attachEventHandlers = useCallback((audio: HTMLAudioElement) => {
    // Remove old handlers first to avoid stacking
    audio.ontimeupdate = null;
    audio.ondurationchange = null;
    audio.onended = null;
    audio.onwaiting = null;
    audio.onplaying = null;
    audio.onstalled = null;
    audio.onerror = null;

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

    // Buffering indicators
    audio.onwaiting = () => {
      setState((s) => ({ ...s, isBuffering: true }));
    };
    audio.onstalled = () => {
      setState((s) => ({ ...s, isBuffering: true }));
    };
    audio.onplaying = () => {
      setState((s) => ({ ...s, isBuffering: false, isPlaying: true }));
    };
    audio.onerror = () => {
      setState((s) => ({ ...s, isPlaying: false, isBuffering: false }));
    };

    audio.onended = () => {
      const { queue, queueIndex, repeat, shuffle } = stateRef.current;

      if (repeat === "one") {
        audio.currentTime = 0;
        audio.play().catch(console.error);
        setState((s) => ({ ...s, progress: 0, currentTime: 0 }));
        return;
      }

      if (queue.length > 0) {
        const nextIndex = queueIndex + 1;
        if (nextIndex < queue.length) {
          const nextTrack = queue[nextIndex];
          setState((s) => ({
            ...s,
            currentTrack: nextTrack,
            queueIndex: nextIndex,
            isPlaying: true,
            isBuffering: true,
            progress: 0,
            currentTime: 0,
          }));
          audio.src = nextTrack.audioUrl;
          audio.load();
          audio.play().catch(console.error);
        } else if (repeat === "all") {
          const newQueue = shuffle ? shuffleArray(queue) : queue;
          const firstTrack = newQueue[0];
          setState((s) => ({
            ...s,
            queue: newQueue,
            currentTrack: firstTrack,
            queueIndex: 0,
            isPlaying: true,
            isBuffering: true,
            progress: 0,
            currentTime: 0,
          }));
          audio.src = firstTrack.audioUrl;
          audio.load();
          audio.play().catch(console.error);
        } else {
          setState((s) => ({ ...s, isPlaying: false, isBuffering: false, progress: 0, currentTime: 0 }));
        }
      } else {
        setState((s) => ({ ...s, isPlaying: false, isBuffering: false, progress: 0, currentTime: 0 }));
      }
    };
  }, []);

  const loadAndPlay = useCallback((track: PlayerTrack) => {
    const audio = getOrCreateAudio();
    audio.pause();
    audio.src = track.audioUrl;
    audio.volume = stateRef.current.volume;
    // Call load() to reset the element and start buffering from the new src
    audio.load();
    attachEventHandlers(audio);
    // Play — the browser will buffer and fire onplaying when ready
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        // AbortError is expected when src changes quickly; ignore it
        if (err.name !== "AbortError") {
          console.error("[AudioPlayer] play() failed:", err);
          setState((s) => ({ ...s, isPlaying: false, isBuffering: false }));
        }
      });
    }
  }, [getOrCreateAudio, attachEventHandlers]);

  /**
   * play(track) — play a single track (no queue context)
   * play(track, queue) — play track within a queue; queue is the full ordered list
   */
  const play = useCallback((track: PlayerTrack, queue?: PlayerTrack[]) => {
    const audio = getOrCreateAudio();

    // Same track already loaded — just resume
    if (stateRef.current.currentTrack?.id === track.id && audio.src) {
      audio.play().catch(console.error);
      setState((s) => ({ ...s, isPlaying: true }));
      return;
    }

    let resolvedQueue: PlayerTrack[] = queue ?? stateRef.current.queue;
    let resolvedIndex = resolvedQueue.findIndex((t) => t.id === track.id);

    if (queue && stateRef.current.shuffle) {
      const others = queue.filter((t) => t.id !== track.id);
      resolvedQueue = [track, ...shuffleArray(others)];
      resolvedIndex = 0;
    }

    loadAndPlay(track);
    setState((s) => ({
      ...s,
      currentTrack: track,
      isPlaying: true,
      isBuffering: true,
      progress: 0,
      currentTime: 0,
      queue: resolvedQueue,
      queueIndex: resolvedIndex,
    }));
  }, [loadAndPlay, getOrCreateAudio]);

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
    setState((s) => ({ ...s, isBuffering: true }));
  }, []);

  const setVolume = useCallback((v: number) => {
    if (audioRef.current) audioRef.current.volume = v;
    setState((s) => ({ ...s, volume: v }));
  }, []);

  const next = useCallback(() => {
    const { queue, queueIndex, repeat } = stateRef.current;
    if (queue.length === 0) return;

    let nextIndex = queueIndex + 1;
    if (nextIndex >= queue.length) {
      if (repeat === "all") {
        nextIndex = 0;
      } else {
        return;
      }
    }

    const nextTrack = queue[nextIndex];
    loadAndPlay(nextTrack);
    setState((s) => ({
      ...s,
      currentTrack: nextTrack,
      queueIndex: nextIndex,
      isPlaying: true,
      isBuffering: true,
      progress: 0,
      currentTime: 0,
    }));
  }, [loadAndPlay]);

  const previous = useCallback(() => {
    const { queue, queueIndex, currentTime } = stateRef.current;

    if (currentTime > 3) {
      if (audioRef.current) audioRef.current.currentTime = 0;
      setState((s) => ({ ...s, progress: 0, currentTime: 0 }));
      return;
    }

    if (queue.length === 0 || queueIndex <= 0) {
      if (audioRef.current) audioRef.current.currentTime = 0;
      setState((s) => ({ ...s, progress: 0, currentTime: 0 }));
      return;
    }

    const prevIndex = queueIndex - 1;
    const prevTrack = queue[prevIndex];
    loadAndPlay(prevTrack);
    setState((s) => ({
      ...s,
      currentTrack: prevTrack,
      queueIndex: prevIndex,
      isPlaying: true,
      isBuffering: true,
      progress: 0,
      currentTime: 0,
    }));
  }, [loadAndPlay]);

  const toggleShuffle = useCallback(() => {
    setState((s) => {
      if (!s.shuffle && s.queue.length > 1) {
        const current = s.currentTrack;
        const others = s.queue.filter((t) => t.id !== current?.id);
        const newQueue = current ? [current, ...shuffleArray(others)] : shuffleArray(s.queue);
        return { ...s, shuffle: true, queue: newQueue, queueIndex: 0 };
      } else if (s.shuffle) {
        return { ...s, shuffle: false };
      }
      return { ...s, shuffle: !s.shuffle };
    });
  }, []);

  const toggleRepeat = useCallback(() => {
    setState((s) => {
      const next: RepeatMode = s.repeat === "off" ? "all" : s.repeat === "all" ? "one" : "off";
      return { ...s, repeat: next };
    });
  }, []);

  return (
    <AudioPlayerContext.Provider
      value={{
        ...state,
        play,
        pause,
        resume,
        seek,
        setVolume,
        next,
        previous,
        toggleShuffle,
        toggleRepeat,
        audioRef,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx) throw new Error("useAudioPlayer must be used within AudioPlayerProvider");
  return ctx;
}
