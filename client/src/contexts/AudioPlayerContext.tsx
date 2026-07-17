import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

export interface PlayerTrack {
  id: number;
  title: string;
  artist?: string | null;
  audioUrl: string;
  audioKey?: string | null; // S3 key — used to generate a fresh proxy URL on every play
  gradient?: string | null;
  moodTags?: string[];
  coverArtUrl?: string | null;
}

/**
 * Returns the audio URL for playback.
 * The S3 bucket is public, so audioUrl is used directly.
 * The /manus-storage/* proxy requires BUILT_IN_FORGE_API_KEY which is
 * a Manus sandbox-only variable and does not exist on Railway.
 */
export function getProxyAudioUrl(track: Pick<PlayerTrack, 'audioUrl' | 'audioKey'>): string {
  return track.audioUrl;
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

  // ── Stop audio only when the tab is closed/navigated away (not on tab switch) ──
  // visibilitychange fires on tab switch too — we do NOT want to pause there.
  // beforeunload fires only when the page is actually unloading.
  useEffect(() => {
    const handleUnload = () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, []);

  // ── Cleanup audio element on React unmount ────────────────────────────────
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
      const { currentTime, duration } = audio;
      setState((s) => ({
        ...s,
        currentTime,
        progress: duration ? (currentTime / duration) * 100 : 0,
      }));

      // ── End-of-track fade-out ─────────────────────────────────────────────
      // Ramp volume to 0 over the last FADE_DURATION seconds so tracks don't
      // hard-cut. Volume is restored to the user's level before the next track.
      const FADE_DURATION = 3; // seconds
      if (duration && duration > FADE_DURATION) {
        const remaining = duration - currentTime;
        if (remaining <= FADE_DURATION && remaining >= 0) {
          // Linear ramp: 1.0 at (duration - FADE_DURATION), 0.0 at duration
          const targetVolume = Math.max(0, remaining / FADE_DURATION) * stateRef.current.volume;
          if (Math.abs(audio.volume - targetVolume) > 0.005) {
            audio.volume = targetVolume;
          }
        }
      }
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
    audio.onerror = (e) => {
      const { queue, queueIndex } = stateRef.current;
      console.warn("[AudioPlayer] Load error — attempting to skip to next track", e);

      // If there's a next track in the queue, skip to it automatically
      if (queue.length > 0 && queueIndex + 1 < queue.length) {
        const nextIndex = queueIndex + 1;
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
        // Restore volume in case fade-out left it at 0
        audio.volume = stateRef.current.volume;
        audio.src = getProxyAudioUrl(nextTrack);
        audio.load();
        audio.play().catch(console.error);
      } else {
        // End of queue or no queue — stop gracefully
        setState((s) => ({ ...s, isPlaying: false, isBuffering: false }));
      }
    };

    audio.onended = () => {
      // Restore volume to user's level before advancing — the fade-out may have
      // brought it to 0, and the next track should start at full volume.
      audio.volume = stateRef.current.volume;
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
          audio.src = getProxyAudioUrl(nextTrack);
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
          audio.src = getProxyAudioUrl(firstTrack);
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
    // Use proxy URL if audioKey is available — this bypasses expired presigned URLs
    audio.src = getProxyAudioUrl(track);
    // Always restore to user's volume level — fade-out may have left it at 0
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

    // Same track already loaded and actively playing (or paused mid-track) — just resume.
    // Only skip reload if:
    //   1. Same track ID
    //   2. Audio has no error (error code 0 = no error, null = no error)
    //   3. Audio has already loaded some data (readyState >= HAVE_CURRENT_DATA = 2)
    //   4. Audio is not at position 0 with duration 0 (i.e. actually loaded, not just src-set)
    // This prevents the case where a presigned URL was never loaded (silent track)
    // from being skipped over on re-click.
    const audioIsLoaded = !audio.error && audio.readyState >= 2 && (audio.currentTime > 0 || audio.duration > 0);
    if (stateRef.current.currentTrack?.id === track.id && audioIsLoaded) {
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
