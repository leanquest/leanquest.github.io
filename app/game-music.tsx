"use client";

import { Midi } from "@tonejs/midi";
import { useEffect, useRef, useState } from "react";
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

function createVoice(name: string, output: Tone.ToneAudioNode): Voice {
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
  private volume = 0.35;
  private unlocked = false;
  private requestId = 0;

  constructor() {
    this.output.connect(this.compressor);
    this.compressor.connect(this.limiter);
    this.limiter.toDestination();
  }

  async unlock() {
    if (this.unlocked) return;
    await Tone.start();
    this.unlocked = true;
    this.output.gain.rampTo(this.enabled ? this.volume : 0, 0.08);
    if (this.desiredCue) await this.play(this.desiredCue);
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

  private clearPlayback() {
    const transport = Tone.getTransport();
    transport.stop();
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
    for (const midiTrack of midi.tracks) {
      if (!midiTrack.notes.length) continue;
      const voice = createVoice(midiTrack.name, this.output);
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
      transport.scheduleOnce(() => {
        if (this.playingCue === cue) this.clearPlayback();
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
  const [settings, setSettings] = useState<MusicSettings>({ enabled: true, volume: 0.35 });
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
            volume: typeof parsed.volume === "number" ? Math.min(0.8, Math.max(0.05, parsed.volume)) : 0.35,
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
    const unlock = () => {
      void player.unlock()
        .then(() => setUnlocked(true))
        .catch((error) => console.error("Unable to start music", error));
    };
    document.addEventListener("pointerdown", unlock, { once: true });
    document.addEventListener("keydown", unlock, { once: true });
    return () => {
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("keydown", unlock);
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

  return {
    ...settings,
    unlocked,
    cue,
    title: cue ? musicCues[cue].title : "Music paused",
    toggle: () => setSettings((current) => ({ ...current, enabled: !current.enabled })),
    setVolume: (volume: number) => setSettings((current) => ({ ...current, volume })),
  };
}

type MusicControlsProps = ReturnType<typeof useGameMusic>;

export function MusicControls({ enabled, title, toggle }: MusicControlsProps) {
  return (
    <button
      className={`music-toggle ${enabled ? "" : "muted"}`}
      onClick={toggle}
      aria-label={enabled ? `Mute music: ${title}` : `Enable music: ${title}`}
      aria-pressed={enabled}
      title={enabled ? `Mute music · ${title}` : `Enable music · ${title}`}
    >
      <span aria-hidden="true">♫</span>
    </button>
  );
}
