import React, { createContext, useCallback, useContext, useRef, useState } from "react";

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

  const loadAndPlay = useCallback((track: PlayerTrack) => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const audio = audioRef.current;
    audio.pause();
    audio.src = track.audioUrl;
    audio.volume = stateRef.current.volume;

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
      const { queue, queueIndex, repeat, shuffle } = stateRef.current;

      if (repeat === "one") {
        // Replay same track
        audio.currentTime = 0;
        audio.play().catch(console.error);
        setState((s) => ({ ...s, progress: 0, currentTime: 0 }));
        return;
      }

      if (queue.length > 0) {
        const nextIndex = queueIndex + 1;
        if (nextIndex < queue.length) {
          // Advance to next
          const nextTrack = queue[nextIndex];
          setState((s) => ({
            ...s,
            currentTrack: nextTrack,
            queueIndex: nextIndex,
            isPlaying: true,
            progress: 0,
            currentTime: 0,
          }));
          audio.src = nextTrack.audioUrl;
          audio.play().catch(console.error);
        } else if (repeat === "all") {
          // Loop back to start (re-shuffle if shuffle is on)
          const newQueue = shuffle ? shuffleArray(queue) : queue;
          const firstTrack = newQueue[0];
          setState((s) => ({
            ...s,
            queue: newQueue,
            currentTrack: firstTrack,
            queueIndex: 0,
            isPlaying: true,
            progress: 0,
            currentTime: 0,
          }));
          audio.src = firstTrack.audioUrl;
          audio.play().catch(console.error);
        } else {
          // End of queue, stop
          setState((s) => ({ ...s, isPlaying: false, progress: 0, currentTime: 0 }));
        }
      } else {
        setState((s) => ({ ...s, isPlaying: false, progress: 0, currentTime: 0 }));
      }
    };

    audio.play().catch(console.error);
  }, []);

  /**
   * play(track) — play a single track (no queue context)
   * play(track, queue) — play track within a queue; queue is the full ordered list
   */
  const play = useCallback((track: PlayerTrack, queue?: PlayerTrack[]) => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const audio = audioRef.current;

    // Same track already loaded — just resume
    if (stateRef.current.currentTrack?.id === track.id && audio.src) {
      audio.play().catch(console.error);
      setState((s) => ({ ...s, isPlaying: true }));
      return;
    }

    let resolvedQueue: PlayerTrack[] = queue ?? stateRef.current.queue;
    let resolvedIndex = resolvedQueue.findIndex((t) => t.id === track.id);

    // If shuffle is on and a new queue is being loaded, shuffle it keeping the
    // selected track first
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
      progress: 0,
      currentTime: 0,
      queue: resolvedQueue,
      queueIndex: resolvedIndex,
    }));
  }, [loadAndPlay]);

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

  const next = useCallback(() => {
    const { queue, queueIndex, repeat } = stateRef.current;
    if (queue.length === 0) return;

    let nextIndex = queueIndex + 1;
    if (nextIndex >= queue.length) {
      if (repeat === "all") {
        nextIndex = 0;
      } else {
        return; // nothing to skip to
      }
    }

    const nextTrack = queue[nextIndex];
    loadAndPlay(nextTrack);
    setState((s) => ({
      ...s,
      currentTrack: nextTrack,
      queueIndex: nextIndex,
      isPlaying: true,
      progress: 0,
      currentTime: 0,
    }));
  }, [loadAndPlay]);

  const previous = useCallback(() => {
    const { queue, queueIndex, currentTime } = stateRef.current;

    // If more than 3s in, restart current track
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
      progress: 0,
      currentTime: 0,
    }));
  }, [loadAndPlay]);

  const toggleShuffle = useCallback(() => {
    setState((s) => {
      if (!s.shuffle && s.queue.length > 1) {
        // Turning shuffle ON — reshuffle keeping current track first
        const current = s.currentTrack;
        const others = s.queue.filter((t) => t.id !== current?.id);
        const newQueue = current ? [current, ...shuffleArray(others)] : shuffleArray(s.queue);
        return { ...s, shuffle: true, queue: newQueue, queueIndex: 0 };
      } else if (s.shuffle) {
        // Turning shuffle OFF — restore original order isn't tracked, so just
        // keep current queue unsorted (user can re-play playlist to reset)
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
