import { vi } from 'vitest';
import type { SoundBrowser } from '../src/lib/sound/engine';

/** A level that remembers what it was told to do, and when. */
export class FakeParam {
  readonly calls: [string, ...number[]][] = [];
  constructor(public value = 1) {}
  setValueAtTime(value: number, at: number): this {
    this.calls.push(['set', value, at]);
    return this;
  }
  linearRampToValueAtTime(value: number, at: number): this {
    this.calls.push(['ramp', value, at]);
    return this;
  }
  cancelScheduledValues(at: number): this {
    this.calls.push(['cancel', at]);
    return this;
  }
}

class FakeNode {
  readonly outputs: unknown[] = [];
  connect<T>(node: T): T {
    this.outputs.push(node);
    return node;
  }
}

export class FakeGain extends FakeNode {
  readonly gain = new FakeParam();
}

class FakeScheduled extends FakeNode {
  readonly starts: number[] = [];
  readonly stops: number[] = [];
  start(at = 0): void {
    this.starts.push(at);
  }
  stop(at = 0): void {
    this.stops.push(at);
  }
}

export class FakeBufferSource extends FakeScheduled {
  buffer: AudioBuffer | null = null;
  readonly playbackRate = new FakeParam();
}

export class FakeOscillator extends FakeScheduled {
  type: OscillatorType = 'sine';
  readonly frequency = new FakeParam(440);
}

export class FakeFilter extends FakeNode {
  type: BiquadFilterType = 'lowpass';
  readonly frequency = new FakeParam(350);
}

export class FakeElementSource extends FakeNode {
  constructor(readonly element: HTMLAudioElement) {
    super();
  }
}

/** A browser's audio, keeping every node it made. */
export class FakeContext {
  state: AudioContextState = 'suspended';
  currentTime = 10;
  readonly destination = new FakeNode();
  readonly made: FakeNode[] = [];
  readonly resume = vi.fn(() => {
    this.state = 'running';
    return Promise.resolve();
  });
  readonly decodeAudioData = vi.fn((data: ArrayBuffer) =>
    Promise.resolve({ length: data.byteLength } as AudioBuffer),
  );

  private make<T extends FakeNode>(node: T): T {
    this.made.push(node);
    return node;
  }
  createGain() {
    return this.make(new FakeGain());
  }
  createBufferSource() {
    return this.make(new FakeBufferSource());
  }
  createOscillator() {
    return this.make(new FakeOscillator());
  }
  createBiquadFilter() {
    return this.make(new FakeFilter());
  }
  createMediaElementSource(element: HTMLAudioElement) {
    return this.make(new FakeElementSource(element));
  }
  /** The nodes made of one kind. */
  all<T extends FakeNode>(kind: new (...args: never[]) => T): T[] {
    return this.made.filter((node): node is T => node instanceof kind);
  }
}

/** A music player that remembers whether it plays. */
export interface FakeAudio {
  src: string;
  loop: boolean;
  play: ReturnType<typeof vi.fn<() => Promise<void>>>;
  pause: ReturnType<typeof vi.fn<() => void>>;
}

/** The browser as the sound engine sees it, with nothing really played. */
export function fakeSoundBrowser() {
  const context = new FakeContext();
  const audios: FakeAudio[] = [];
  const waiting: (() => void)[] = [];
  const fetch = vi.fn((url: string) =>
    Promise.resolve({
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(url.length)),
    } as Response),
  );
  const browser: SoundBrowser = {
    makeContext: vi.fn(() => context as unknown as AudioContext),
    makeAudio: (url) => {
      const audio: FakeAudio = {
        src: url,
        loop: false,
        play: vi.fn(() => Promise.resolve()),
        pause: vi.fn(),
      };
      audios.push(audio);
      return audio as unknown as HTMLAudioElement;
    },
    fetch,
    later: (run) => {
      waiting.push(run);
    },
  };
  return {
    browser,
    context,
    audios,
    fetch,
    /** Runs what was set to happen later. */
    runLater: () => {
      for (const run of waiting.splice(0)) run();
    },
  };
}
