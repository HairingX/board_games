import type { Random } from '../random';
import { babble, shift, type Voice } from './babble';

/** Whether music and sound effects play; voices count as effects. */
export interface SoundSettings {
  music: boolean;
  effects: boolean;
}

/** How long music takes to fade in or out, and to give way to other music, in seconds. */
export const musicFade = 1.2;

/** How long switching music or effects on or off takes, in seconds, so it never clicks. */
const switchFade = 0.15;

/** How loud a babbled syllable is at its loudest, before the effects' own volume. */
const syllableVolume = 0.25;

/** How long a syllable takes to swell and to fade, in seconds, so it never clicks. */
const syllableEdge = 0.012;

/** What the engine needs from the browser; the tests give their own. */
export interface SoundBrowser {
  makeContext: () => AudioContext;
  makeAudio: (url: string) => HTMLAudioElement;
  fetch: (url: string) => Promise<Response>;
  later: (run: () => void, seconds: number) => void;
}

const realBrowser: SoundBrowser = {
  makeContext: () => new AudioContext(),
  makeAudio: (url) => new Audio(url),
  fetch: (url) => fetch(url),
  later: (run, seconds) => {
    setTimeout(run, seconds * 1000);
  },
};

interface Playing {
  url: string;
  context: AudioContext;
  element: HTMLAudioElement;
  volume: GainNode;
}

interface Buses {
  context: AudioContext;
  music: GainNode;
  effects: GainNode;
}

/**
 * The app's sound: music that fades from one piece to the next, short effects, and babbling
 * voices. Browsers let sound start only from a tap, so the first call to any of these must come
 * from one; until then nothing is made. An iPhone's silent switch silences it all.
 */
export class SoundEngine {
  private buses?: Buses;
  private settings: SoundSettings = { music: true, effects: true };
  private playing: Playing | undefined;
  private readonly sounds = new Map<string, Promise<AudioBuffer>>();

  constructor(private readonly browser: SoundBrowser = realBrowser) {}

  /** Starts the sound, or wakes it after the phone paused it; call it from a tap. */
  unlock(): Buses {
    if (!this.buses) {
      const context = this.browser.makeContext();
      const music = context.createGain();
      const effects = context.createGain();
      music.gain.value = Number(this.settings.music);
      effects.gain.value = Number(this.settings.effects);
      music.connect(context.destination);
      effects.connect(context.destination);
      this.buses = { context, music, effects };
    }
    if (this.buses.context.state !== 'running') void this.buses.context.resume();
    return this.buses;
  }

  /** Turns music and effects on or off, gently, and remembers it for what plays next. */
  setSettings(settings: SoundSettings): void {
    this.settings = settings;
    if (!this.buses) return;
    const { context, music, effects } = this.buses;
    glide(music.gain, Number(settings.music), context.currentTime, switchFade);
    glide(effects.gain, Number(settings.effects), context.currentTime, switchFade);
  }

  /** Plays a short sound once. */
  async effect(url: string): Promise<void> {
    const { context, effects } = this.unlock();
    if (!this.settings.effects) return;
    const source = context.createBufferSource();
    source.buffer = await this.load(url);
    source.connect(effects);
    source.start();
  }

  /** Fades the music over to this piece, played over and over; the same piece goes on. */
  music(url: string): void {
    const { context, music } = this.unlock();
    if (this.playing?.url === url) return;
    this.stopMusic();
    const element = this.browser.makeAudio(url);
    element.loop = true;
    const volume = context.createGain();
    volume.gain.value = 0;
    context.createMediaElementSource(element).connect(volume);
    volume.connect(music);
    glide(volume.gain, 1, context.currentTime, musicFade);
    void element.play().catch(() => undefined);
    this.playing = { url, context, element, volume };
  }

  /** Fades the music out. */
  stopMusic(): void {
    const playing = this.playing;
    if (!playing) return;
    this.playing = undefined;
    glide(playing.volume.gain, 0, playing.context.currentTime, musicFade);
    this.browser.later(() => {
      playing.element.pause();
    }, musicFade);
  }

  /** Says something without words, in the voice: a few syllables at its pitch and pace. */
  async babble(
    voice: Voice,
    syllables: number,
    clips: readonly string[] = [],
    random?: Random,
  ): Promise<void> {
    const { context, effects } = this.unlock();
    if (!this.settings.effects) return;
    const recorded = await Promise.all(clips.map((url) => this.load(url)));
    const start = context.currentTime + syllableEdge;
    for (const syllable of babble(voice, syllables, random)) {
      const at = start + syllable.at;
      const envelope = context.createGain();
      envelope.gain.setValueAtTime(0, at);
      envelope.gain.linearRampToValueAtTime(syllableVolume, at + syllableEdge);
      envelope.gain.setValueAtTime(syllableVolume, at + syllable.length - syllableEdge);
      envelope.gain.linearRampToValueAtTime(0, at + syllable.length);
      envelope.connect(effects);
      const pitch = shift(voice.pitch, syllable.step);
      if (voice.timbre.kind === 'tone') {
        const tone = context.createOscillator();
        tone.type = voice.timbre.wave;
        tone.frequency.value = pitch;
        const vowel = context.createBiquadFilter();
        vowel.type = 'bandpass';
        vowel.frequency.value = voice.timbre.vowel;
        tone.connect(vowel);
        vowel.connect(envelope);
        tone.start(at);
        tone.stop(at + syllable.length);
      } else {
        const clip = recorded[syllable.clip % recorded.length];
        if (!clip) return;
        const source = context.createBufferSource();
        source.buffer = clip;
        source.playbackRate.value = pitch;
        source.connect(envelope);
        source.start(at);
        source.stop(at + syllable.length);
      }
    }
  }

  /** The sound in the file, fetched and decoded once; tried again next time if it failed. */
  private load(url: string): Promise<AudioBuffer> {
    const known = this.sounds.get(url);
    if (known) return known;
    const { context } = this.unlock();
    const loading = this.browser
      .fetch(url)
      .then((response) => response.arrayBuffer())
      .then((data) => context.decodeAudioData(data));
    loading.catch(() => {
      this.sounds.delete(url);
    });
    this.sounds.set(url, loading);
    return loading;
  }
}

/** Moves a level smoothly from where it is now to the value, over the seconds. */
function glide(level: AudioParam, value: number, now: number, seconds: number): void {
  level.cancelScheduledValues(now);
  level.setValueAtTime(level.value, now);
  level.linearRampToValueAtTime(value, now + seconds);
}

/** The app's one sound engine. */
export const sound = new SoundEngine();
