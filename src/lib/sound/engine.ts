import type { Random } from '../random';
import { babble, shift, type Voice } from './babble';
import type { Chime } from './chimes';

/**
 * How loud music and sound effects play, each from 0 (off) to 1 (as mixed); voices and chimes
 * count as effects.
 */
export interface SoundSettings {
  music: number;
  effects: number;
}

/** How long music takes to fade in or out, and to give way to other music, in seconds. */
export const musicFade = 1.2;

/** How long switching music or effects on or off takes, in seconds, so it never clicks. */
const switchFade = 0.15;

/** How loud a babbled syllable is at its loudest, before the effects' own volume. */
const syllableVolume = 0.25;

/** How long a syllable takes to swell and to fade, in seconds, so it never clicks. */
const syllableEdge = 0.012;

/** How long a chime's note takes to swell, in seconds; then it dies away, as a bell does. */
const strike = 0.005;

/** How far, in semitones, a chime may sound higher or lower, so it never grows tiresome. */
const chimeSpread = 0.3;

/** The level a dying note fades to; a fade can never reach nothing itself. */
const silence = 0.0001;

/**
 * How the music gives way while an answer's chime plays, as games duck their music under what
 * matters: down to this share of its level (about 8 dB lower), quickly, held, and back gently.
 */
export const ducking = { level: 0.4, down: 0.04, hold: 0.5, back: 0.6 } as const;

/** What the engine needs from the browser; the tests give their own. */
export interface SoundBrowser {
  makeContext: () => AudioContext;
  makeAudio: (url: string) => HTMLAudioElement;
  fetch: (url: string) => Promise<Response>;
  /** An address in memory for the file's content, for the music player to read. */
  objectUrl: (file: Blob) => string;
  later: (run: () => void, seconds: number) => void;
}

const realBrowser: SoundBrowser = {
  makeContext: () => new AudioContext(),
  makeAudio: (url) => new Audio(url),
  fetch: (url) => fetch(url),
  objectUrl: (file) => URL.createObjectURL(file),
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
  /** The music's level as set; its ducking follows it, on its own level. */
  music: GainNode;
  ducked: GainNode;
  effects: GainNode;
}

/**
 * The app's sound: music that fades from one piece to the next, short effects, and babbling
 * voices. Browsers let sound start only from a tap, so the first call to any of these must come
 * from one; until then nothing is made. An iPhone's silent switch silences it all.
 */
export class SoundEngine {
  private buses?: Buses;
  private settings: SoundSettings = { music: 1, effects: 1 };
  private playing: Playing | undefined;
  private readonly sounds = new Map<string, Promise<AudioBuffer>>();
  /** Music read into memory, by its address, so it plays without the internet. */
  private readonly prepared = new Map<string, string>();
  private readonly preparing = new Set<string>();

  constructor(private readonly browser: SoundBrowser = realBrowser) {}

  /** Starts the sound, or wakes it after the phone paused it; call it from a tap. */
  unlock(): Buses {
    const buses = this.prepare();
    if (buses.context.state !== 'running') void buses.context.resume();
    return buses;
  }

  /**
   * The sound's parts, made if they are not yet, without starting the sound: a browser lets
   * them be made, and sounds be decoded, before any tap, only not be heard.
   */
  private prepare(): Buses {
    if (!this.buses) {
      const context = this.browser.makeContext();
      const music = context.createGain();
      const ducked = context.createGain();
      const effects = context.createGain();
      music.gain.value = this.settings.music;
      effects.gain.value = this.settings.effects;
      music.connect(ducked);
      ducked.connect(context.destination);
      effects.connect(context.destination);
      this.buses = { context, music, ducked, effects };
    }
    return this.buses;
  }

  /**
   * Fetches and decodes sounds before they are needed, so the first time one plays it does so
   * at once, not after the moment it takes to fetch and decode it. Call it when a screen with
   * sounds opens; it never fails: a sound that fails, or a browser without sound, is tried again
   * when it plays.
   */
  async prepareEffects(urls: readonly string[]): Promise<void> {
    await Promise.all(
      urls.map(async (url) => {
        try {
          await this.load(url);
        } catch {
          // Tried again when the sound plays.
        }
      }),
    );
  }

  /** Sets how loud music and effects play, gently, and remembers it for what plays next. */
  setSettings(settings: SoundSettings): void {
    this.settings = settings;
    if (!this.buses) return;
    const { context, music, effects } = this.buses;
    glide(music.gain, settings.music, context.currentTime, switchFade);
    glide(effects.gain, settings.effects, context.currentTime, switchFade);
  }

  /**
   * Plays a short sound once, at `volume`: the gain that evens its loudness out with the
   * other sounds' (measured once for each file), before the effects' own level; `after`
   * seconds from now, so it can meet a moment in the scene exactly.
   */
  async effect(url: string, volume = 1, after = 0): Promise<void> {
    const { context, effects } = this.unlock();
    if (this.settings.effects === 0) return;
    const source = context.createBufferSource();
    source.buffer = await this.load(url);
    const level = context.createGain();
    level.gain.value = volume;
    source.connect(level);
    level.connect(effects);
    source.start(after > 0 ? context.currentTime + after : 0);
  }

  /**
   * Plays a chime, made of tones in the phone, so it needs nothing fetched; each time a shade
   * higher or lower, so it never grows tiresome.
   */
  chime(chime: Chime, random: Random = Math.random): void {
    const { context, effects, ducked } = this.unlock();
    if (this.settings.effects === 0) return;
    duck(ducked.gain, context.currentTime);
    const start = context.currentTime + syllableEdge;
    const shade = (random() * 2 - 1) * chimeSpread;
    for (const note of chime.notes) {
      const at = start + note.at;
      const envelope = context.createGain();
      envelope.gain.setValueAtTime(0, at);
      envelope.gain.linearRampToValueAtTime(chime.volume, at + strike);
      envelope.gain.exponentialRampToValueAtTime(silence, at + note.length);
      envelope.connect(effects);
      const tone = context.createOscillator();
      tone.type = chime.wave;
      const pitch = shift(chime.pitch, note.step + shade);
      tone.frequency.value = pitch;
      if (note.slide !== undefined) {
        tone.frequency.setValueAtTime(pitch, at);
        tone.frequency.exponentialRampToValueAtTime(shift(pitch, note.slide), at + note.length);
      }
      tone.connect(envelope);
      tone.start(at);
      tone.stop(at + note.length);
    }
  }

  /**
   * Reads music into memory before it is played. An iPhone's music player asks for a file in
   * pieces, which the app's offline store cannot give, but it plays from memory, with or
   * without the internet. Call it when a screen with music opens; music not yet read plays
   * from its address, which needs the internet.
   */
  async prepareMusic(urls: readonly string[]): Promise<void> {
    await Promise.all(
      urls
        .filter((url) => !this.prepared.has(url) && !this.preparing.has(url))
        .map(async (url) => {
          this.preparing.add(url);
          try {
            const file = await (await this.browser.fetch(url)).blob();
            this.prepared.set(url, this.browser.objectUrl(file));
          } catch {
            // Not read now; it plays from its address, and is tried again next time.
          } finally {
            this.preparing.delete(url);
          }
        }),
    );
  }

  /**
   * Fades the music over to this piece, played over and over, at `volume`: the gain that sets
   * the piece's loudness in the mix. The same piece goes on.
   */
  music(url: string, volume = 1): void {
    const { context, music } = this.unlock();
    if (this.playing?.url === url) {
      // The phone may have kept it paused after the app was away; a tap starts it again.
      if (this.playing.element.paused) void this.playing.element.play().catch(() => undefined);
      return;
    }
    this.stopMusic();
    const element = this.browser.makeAudio(this.prepared.get(url) ?? url);
    element.loop = true;
    const gain = context.createGain();
    gain.gain.value = 0;
    context.createMediaElementSource(element).connect(gain);
    gain.connect(music);
    glide(gain.gain, volume, context.currentTime, musicFade);
    void element.play().catch(() => undefined);
    this.playing = { url, context, element, volume: gain };
  }

  /**
   * Pauses all sound while the app is out of sight, rather than letting the music play on
   * silenced, which keeps the phone showing it as playing and spends its battery.
   */
  sleep(): void {
    this.playing?.element.pause();
    if (this.buses?.context.state === 'running') void this.buses.context.suspend();
  }

  /**
   * Starts the sound again as the app comes back on screen, with the music where it paused.
   * Should the phone want a tap first, the next sound or piece of music played starts it.
   */
  wake(): void {
    if (this.buses?.context.state === 'suspended') void this.buses.context.resume();
    if (this.playing?.element.paused) void this.playing.element.play().catch(() => undefined);
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

  /**
   * Says something without words, in the voice: a few syllables at its pitch and pace, `after`
   * seconds from now.
   */
  babble(voice: Voice, syllables: number, random?: Random, after = 0): void {
    const { context, effects } = this.unlock();
    if (this.settings.effects === 0) return;
    const start = context.currentTime + syllableEdge + after;
    for (const syllable of babble(voice, syllables, random)) {
      const at = start + syllable.at;
      const envelope = context.createGain();
      envelope.gain.setValueAtTime(0, at);
      envelope.gain.linearRampToValueAtTime(syllableVolume, at + syllableEdge);
      envelope.gain.setValueAtTime(syllableVolume, at + syllable.length - syllableEdge);
      envelope.gain.linearRampToValueAtTime(0, at + syllable.length);
      envelope.connect(effects);
      const tone = context.createOscillator();
      tone.type = voice.wave;
      tone.frequency.value = shift(voice.pitch, syllable.step);
      const vowel = context.createBiquadFilter();
      vowel.type = 'bandpass';
      vowel.frequency.value = voice.vowel;
      tone.connect(vowel);
      vowel.connect(envelope);
      tone.start(at);
      tone.stop(at + syllable.length);
    }
  }

  /** The sound in the file, fetched and decoded once; tried again next time if it failed. */
  private load(url: string): Promise<AudioBuffer> {
    const known = this.sounds.get(url);
    if (known) return known;
    const { context } = this.prepare();
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

/** Dips the music under a chime: quickly down, held, and gently back. */
function duck(level: AudioParam, now: number): void {
  level.cancelScheduledValues(now);
  level.setValueAtTime(level.value, now);
  level.linearRampToValueAtTime(ducking.level, now + ducking.down);
  level.setValueAtTime(ducking.level, now + ducking.down + ducking.hold);
  level.linearRampToValueAtTime(1, now + ducking.down + ducking.hold + ducking.back);
}

/** Moves a level smoothly from where it is now to the value, over the seconds. */
function glide(level: AudioParam, value: number, now: number, seconds: number): void {
  level.cancelScheduledValues(now);
  level.setValueAtTime(level.value, now);
  level.linearRampToValueAtTime(value, now + seconds);
}

/** The app's one sound engine. */
export const sound = new SoundEngine();
