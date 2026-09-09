// Copyright 2026 Adam Petcher
// SPDX-License-Identifier: Apache-2.0

"use client";

import { Midi } from "@tonejs/midi";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import * as Tone from "tone";
import { musicCues, type MusicCueId } from "./music-manifest";
import { safeTriggerTime } from "./music-timing";

const SETTINGS_KEY = "leanquest-music-v1";

type ScheduledNote = {
  name: string;
  midi: number;
  duration: number;
  velocity: number;
};

type Voice = {
  trigger: (note: ScheduledNote, time: number) => void;
  dispose: () => void;
};

type MusicSettings = {
  enabled: boolean;
  volume: number;
};

const midiCache = new Map<string, Promise<Midi>>();

function loadMidi(url: string) {
  const cached = midiCache.get(url);
  if (cached) return cached;
  const request = fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error(`Unable to load MIDI ${url}`);
      return response.arrayBuffer();
    })
    .then((buffer) => new Midi(buffer));
  midiCache.set(url, request);
  return request;
}

function synthVoice(
  output: Tone.ToneAudioNode,
  level: number,
  options: ConstructorParameters<typeof Tone.Synth>[0],
): Voice {
  const channel = new Tone.Gain(level).connect(output);
  const synth = new Tone.PolySynth(Tone.Synth, options).connect(channel);
  synth.maxPolyphony = 10;
  return {
    trigger: (entry, time) => synth.triggerAttackRelease(entry.name, entry.duration, time, entry.velocity),
    dispose: () => {
      synth.dispose();
      channel.dispose();
    },
  };
}

function fmVoice(output: Tone.ToneAudioNode, level: number): Voice {
  const channel = new Tone.Gain(level).connect(output);
  const synth = new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: 2,
    modulationIndex: 3.5,
    oscillator: { type: "square" },
    modulation: { type: "triangle" },
    envelope: { attack: 0.01, decay: 0.15, sustain: 0.45, release: 0.3 },
    modulationEnvelope: { attack: 0.01, decay: 0.18, sustain: 0.2, release: 0.2 },
  }).connect(channel);
  synth.maxPolyphony = 10;
  return {
    trigger: (entry, time) => synth.triggerAttackRelease(entry.name, entry.duration, time, entry.velocity),
    dispose: () => {
      synth.dispose();
      channel.dispose();
    },
  };
}

function marimbaVoice(output: Tone.ToneAudioNode): Voice {
  const channel = new Tone.Gain(0.34).connect(output);
  const synth = new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: 3,
    modulationIndex: 1.35,
    oscillator: { type: "triangle" },
    modulation: { type: "square" },
    envelope: { attack: 0.012, decay: 0.3, sustain: 0.38, release: 0.28 },
    modulationEnvelope: { attack: 0.01, decay: 0.24, sustain: 0.16, release: 0.2 },
  }).connect(channel);
  synth.maxPolyphony = 12;
  return {
    trigger: (entry, time) => synth.triggerAttackRelease(entry.name, entry.duration, time, entry.velocity),
    dispose: () => {
      synth.dispose();
      channel.dispose();
    },
  };
}

function softOrganVoice(output: Tone.ToneAudioNode, name: string): Voice {
  const level = name.endsWith("_melody") ? 0.3 : name.endsWith("_bass") ? 0.24 : 0.16;
  const channel = new Tone.Gain(level).connect(output);
  const synth = new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: 2,
    modulationIndex: 0.8,
    oscillator: { type: "triangle" },
    modulation: { type: "square" },
    envelope: { attack: 0.035, decay: 0.08, sustain: 0.78, release: 0.28 },
    modulationEnvelope: { attack: 0.05, decay: 0.14, sustain: 0.18, release: 0.24 },
  }).connect(channel);
  synth.maxPolyphony = 10;
  return {
    trigger: (entry, time) => synth.triggerAttackRelease(entry.name, entry.duration, time, entry.velocity),
    dispose: () => {
      synth.dispose();
      channel.dispose();
    },
  };
}

function churchOrganVoice(output: Tone.ToneAudioNode): Voice {
  const channel = new Tone.Gain(0.075).connect(output);
  const synth = new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: 2,
    modulationIndex: 0.8,
    oscillator: { type: "triangle" },
    modulation: { type: "square" },
    envelope: { attack: 0.04, decay: 0.08, sustain: 0.78, release: 0.3 },
    modulationEnvelope: { attack: 0.055, decay: 0.14, sustain: 0.18, release: 0.26 },
  }).connect(channel);
  synth.maxPolyphony = 12;
  return {
    trigger: (entry, time) => synth.triggerAttackRelease(entry.name, entry.duration, time, entry.velocity),
    dispose: () => {
      synth.dispose();
      channel.dispose();
    },
  };
}

function timpaniVoice(output: Tone.ToneAudioNode): Voice {
  const channel = new Tone.Gain(0.44).connect(output);
  const synth = new Tone.PolySynth(Tone.MembraneSynth, {
    pitchDecay: 0.12,
    octaves: 0.7,
    oscillator: { type: "triangle" },
    envelope: { attack: 0.015, decay: 0.48, sustain: 0.28, release: 0.42 },
  }).connect(channel);
  synth.maxPolyphony = 8;
  return {
    trigger: (entry, time) => synth.triggerAttackRelease(entry.name, entry.duration, time, entry.velocity),
    dispose: () => {
      synth.dispose();
      channel.dispose();
    },
  };
}

function drumVoice(output: Tone.ToneAudioNode): Voice {
  const channel = new Tone.Gain(0.34).connect(output);
  const kick = new Tone.MembraneSynth({
    pitchDecay: 0.035,
    octaves: 4,
    envelope: { attack: 0.001, decay: 0.16, sustain: 0, release: 0.08 },
  }).connect(channel);
  const snare = new Tone.NoiseSynth({
    noise: { type: "brown" },
    envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.04 },
  }).connect(channel);
  const hat = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.001, decay: 0.025, sustain: 0, release: 0.015 },
  }).connect(channel);
  let lastKickTime: number | null = null;
  let lastSnareTime: number | null = null;
  let lastHatTime: number | null = null;
  return {
    trigger: (entry, time) => {
      if (entry.midi === 36) {
        const startTime = safeTriggerTime(time, Tone.immediate(), lastKickTime);
        lastKickTime = startTime;
        kick.triggerAttackRelease("C1", Math.min(0.16, entry.duration), startTime, entry.velocity);
      } else if (entry.midi === 38) {
        const startTime = safeTriggerTime(time, Tone.immediate(), lastSnareTime);
        lastSnareTime = startTime;
        snare.triggerAttackRelease(Math.min(0.12, entry.duration), startTime, entry.velocity);
      } else {
        const startTime = safeTriggerTime(time, Tone.immediate(), lastHatTime);
        lastHatTime = startTime;
        hat.triggerAttackRelease(Math.min(0.04, entry.duration), startTime, entry.velocity * 0.7);
      }
    },
    dispose: () => {
      kick.dispose();
      snare.dispose();
      hat.dispose();
      channel.dispose();
    },
  };
}

function createVoice(
  name: string,
  output: Tone.ToneAudioNode,
  assignedVoice?: "marimba" | "timpani" | "church-organ",
): Voice {
  if (assignedVoice === "marimba") return marimbaVoice(output);
  if (assignedVoice === "timpani") return timpaniVoice(output);
  if (assignedVoice === "church-organ") return churchOrganVoice(output);
  if (name.startsWith("soft_organ_")) return softOrganVoice(output, name);
  if (name === "pixel_drums") return drumVoice(output);
  if (name === "crystal_bell" || name === "fm_brass") return fmVoice(output, name === "crystal_bell" ? 0.22 : 0.3);
  if (name === "triangle_bass") {
    return synthVoice(output, 0.48, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.006, decay: 0.1, sustain: 0.62, release: 0.12 },
    });
  }
  if (name === "square_arp") {
    return synthVoice(output, 0.2, {
      oscillator: { type: "square" },
      envelope: { attack: 0.002, decay: 0.06, sustain: 0.24, release: 0.05 },
    });
  }
  if (name.includes("harmony")) {
    return synthVoice(output, name === "dark_harmony" ? 0.2 : 0.24, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.04, decay: 0.2, sustain: 0.45, release: 0.45 },
    });
  }
  if (name === "breath_lead") {
    return synthVoice(output, 0.3, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.035, decay: 0.12, sustain: 0.55, release: 0.3 },
    });
  }
  return synthVoice(output, name === "fanfare_lead" ? 0.36 : 0.3, {
    oscillator: { type: "square" },
    envelope: { attack: 0.008, decay: 0.1, sustain: 0.5, release: 0.18 },
  });
}

class MidiMusicEngine {
  private output = new Tone.Gain(0);
  private compressor = new Tone.Compressor(-18, 4);
  private limiter = new Tone.Limiter(-2);
  private voices: Voice[] = [];
  private parts: Tone.Part<[number, ScheduledNote]>[] = [];
  private desiredCue: MusicCueId | null = null;
  private playingCue: MusicCueId | null = null;
  private enabled = true;
  private volume = 0.5;
  private unlocked = false;
  private requestId = 0;

  constructor() {
    this.output.connect(this.compressor);
    this.compressor.connect(this.limiter);
    this.limiter.toDestination();
  }

  async unlock() {
    if (this.unlocked && Tone.getContext().state === "running") return true;
    await Tone.start();
    if (Tone.getContext().state !== "running") return false;
    this.unlocked = true;
    this.output.gain.rampTo(this.enabled ? this.volume : 0, 0.08);
    if (this.desiredCue && !this.playingCue) await this.play(this.desiredCue);
    return true;
  }

  setSettings({ enabled, volume }: MusicSettings) {
    this.enabled = enabled;
    this.volume = volume;
    this.output.gain.rampTo(this.unlocked && enabled ? volume : 0, 0.08);
    if (enabled && this.unlocked && this.desiredCue && !this.playingCue) {
      void this.play(this.desiredCue);
    }
  }

  setCue(cue: MusicCueId | null) {
    this.desiredCue = cue;
    if (!cue) {
      this.stop();
    } else if (this.unlocked && this.enabled && cue !== this.playingCue) {
      void this.play(cue);
    }
  }

  private clearPlayback(stopTime?: number) {
    const transport = Tone.getTransport();
    transport.stop(stopTime);
    transport.cancel(0);
    this.parts.forEach((part) => part.dispose());
    this.voices.forEach((voice) => voice.dispose());
    this.parts = [];
    this.voices = [];
    this.playingCue = null;
  }

  stop() {
    this.requestId += 1;
    this.clearPlayback();
  }

  private async play(cue: MusicCueId) {
    const requestId = ++this.requestId;
    const config = musicCues[cue];
    let midi: Midi;
    try {
      midi = await loadMidi(config.url);
    } catch (error) {
      console.error(error);
      return;
    }
    if (requestId !== this.requestId || cue !== this.desiredCue || !this.enabled || !this.unlocked) return;

    this.clearPlayback();
    this.playingCue = cue;
    const transport = Tone.getTransport();
    transport.seconds = 0;
    const audibleTracks = midi.tracks.filter((track) => track.notes.length);
    for (const [trackIndex, midiTrack] of audibleTracks.entries()) {
      const voice = createVoice(
        midiTrack.name,
        this.output,
        config.trackVoices?.[trackIndex],
      );
      const events: [number, ScheduledNote][] = midiTrack.notes.map((entry) => [entry.time, {
        name: entry.name,
        midi: entry.midi,
        duration: Math.max(0.03, entry.duration),
        velocity: entry.velocity,
      }]);
      const part = new Tone.Part<[number, ScheduledNote]>((time, entry) => voice.trigger(entry, time), events).start(0);
      if (config.loop) {
        part.loop = true;
        part.loopEnd = config.loopSeconds;
      }
      this.voices.push(voice);
      this.parts.push(part);
    }
    if (!config.loop) {
      transport.scheduleOnce((time) => {
        if (this.playingCue === cue) this.clearPlayback(time);
      }, midi.duration + 0.15);
    }
    transport.start("+0.04");
  }

  dispose() {
    this.stop();
    this.output.dispose();
    this.compressor.dispose();
    this.limiter.dispose();
  }
}

export function useGameMusic(cue: MusicCueId | null) {
  const [settings, setSettings] = useState<MusicSettings>({ enabled: true, volume: 0.5 });
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const engine = useRef<MidiMusicEngine | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const stored = localStorage.getItem(SETTINGS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<MusicSettings>;
          setSettings({
            enabled: parsed.enabled !== false,
            volume: typeof parsed.volume === "number" ? Math.min(0.8, Math.max(0.05, parsed.volume)) : 0.5,
          });
        }
      } catch {
        // Invalid local settings should never prevent the game from loading.
      }
      setSettingsLoaded(true);
    });
  }, []);

  useEffect(() => {
    const player = new MidiMusicEngine();
    engine.current = player;
    let disposed = false;
    const removeGestureListeners = () => {
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("touchend", unlock);
      document.removeEventListener("click", unlock);
      document.removeEventListener("keydown", unlock);
    };
    const unlock = () => {
      void player.unlock()
        .then((started) => {
          if (!started || disposed) return;
          setUnlocked(true);
          removeGestureListeners();
        })
        .catch((error) => console.error("Unable to start music", error));
    };
    const resumeWhenVisible = () => {
      if (document.visibilityState === "visible") unlock();
    };
    document.addEventListener("pointerdown", unlock);
    document.addEventListener("touchend", unlock, { passive: true });
    document.addEventListener("click", unlock);
    document.addEventListener("keydown", unlock);
    document.addEventListener("visibilitychange", resumeWhenVisible);
    window.addEventListener("pageshow", unlock);
    return () => {
      disposed = true;
      removeGestureListeners();
      document.removeEventListener("visibilitychange", resumeWhenVisible);
      window.removeEventListener("pageshow", unlock);
      player.dispose();
      engine.current = null;
    };
  }, []);

  useEffect(() => engine.current?.setCue(cue), [cue]);
  useEffect(() => engine.current?.setSettings(settings), [settings]);

  useEffect(() => {
    if (!settingsLoaded) return;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings, settingsLoaded]);

  const requestUnlock = () => {
    const player = engine.current;
    if (!player) return;
    void player.unlock()
      .then((started) => {
        if (started && engine.current === player) setUnlocked(true);
      })
      .catch((error) => console.error("Unable to start music", error));
  };

  return {
    ...settings,
    unlocked,
    cue,
    title: cue ? musicCues[cue].title : "Music paused",
    requestUnlock,
    toggle: () => setSettings((current) => ({ ...current, enabled: !current.enabled })),
    setVolume: (volume: number) => setSettings((current) => volume <= 0
      ? { ...current, enabled: false }
      : { enabled: true, volume: Math.min(0.8, Math.max(0.05, volume)) }),
  };
}

type MusicControlsProps = ReturnType<typeof useGameMusic>;

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 9v6h4l5 4V5L7 9H3Z" />
      {muted ? (
        <path className="speaker-waves" d="m15.5 9.5 5 5m0-5-5 5" />
      ) : (
        <path className="speaker-waves" d="M15 8.5a5 5 0 0 1 0 7M17.5 6a8.5 8.5 0 0 1 0 12" />
      )}
    </svg>
  );
}

export function MusicControls({ enabled, volume, title, requestUnlock, toggle, setVolume }: MusicControlsProps) {
  const [open, setOpen] = useState(false);
  const controls = useRef<HTMLDivElement>(null);
  const displayedVolume = enabled ? volume : 0;
  const volumePercent = Math.round(displayedVolume * 100);
  const volumeStyle = {
    "--music-volume": `${(displayedVolume / 0.8) * 100}%`,
  } as CSSProperties;

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!controls.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className="music-controls" ref={controls}>
      <button
        className={`music-toggle ${enabled ? "" : "muted"}`}
        onClick={() => {
          requestUnlock();
          setOpen((current) => !current);
        }}
        aria-label={`Music controls: ${title}`}
        aria-expanded={open}
        aria-controls="music-volume-panel"
        title={`Music controls · ${title}`}
      >
        <span aria-hidden="true">♫</span>
      </button>
      {open && (
        <div className="music-volume-panel pixel-frame" id="music-volume-panel" role="group" aria-label="Music volume controls">
          <button
            className={`music-mute-button ${enabled ? "" : "muted"}`}
            onClick={() => {
              requestUnlock();
              toggle();
            }}
            aria-label={enabled ? "Mute music" : "Unmute music"}
            aria-pressed={!enabled}
            title={enabled ? "Mute music" : "Unmute music"}
          >
            <SpeakerIcon muted={!enabled} />
          </button>
          <input
            className="music-volume"
            type="range"
            min="0"
            max="0.8"
            step="0.05"
            value={displayedVolume}
            onChange={(event) => {
              requestUnlock();
              setVolume(Number(event.target.value));
            }}
            aria-label="Music volume"
            aria-valuetext={`${volumePercent}%`}
            title={`Music volume · ${volumePercent}%`}
            style={volumeStyle}
          />
        </div>
      )}
    </div>
  );
}
