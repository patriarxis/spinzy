import type { SoundKey } from "./types";

const SOUND_URLS: Record<SoundKey, string> = {
  buttonHover: "/assets/sounds/button-hover.wav",
  buttonPressed: "/assets/sounds/button-pressed.wav",
  spinButtonPressed: "/assets/sounds/spin-button-pressed.wav",
  spinWheel: "/assets/sounds/spin-wheel.wav",
  win: "/assets/sounds/win.wav",
  lose: "/assets/sounds/lose.wav",
  prizeHover: "/assets/sounds/prize-hover.wav",
  prizePressed: "/assets/sounds/prize-pressed.wav",
  prizeToggle: "/assets/sounds/prize-toggle.wav",
  prizeDrag: "/assets/sounds/prize-drag.wav",
};

/** Small UI sounds — load these first so hover/click work ASAP */
const PRIORITY_SOUNDS: SoundKey[] = [
  "buttonHover",
  "buttonPressed",
  "prizeHover",
  "prizePressed",
  "prizeToggle",
  "prizeDrag",
  "spinButtonPressed",
];

const DEFERRED_SOUNDS: SoundKey[] = ["spinWheel", "win", "lose"];

type AudioContextConstructor = typeof AudioContext;

function getAudioContextConstructor(): AudioContextConstructor {
  const win = window as Window & {
    webkitAudioContext?: AudioContextConstructor;
  };
  return window.AudioContext || win.webkitAudioContext!;
}

export class SoundManager {
  private audioContext: AudioContext;
  private sounds: Partial<Record<SoundKey, AudioBuffer>> = {};
  private loading = new Map<SoundKey, Promise<void>>();
  private unlocked = false;
  private preloadStarted = false;

  constructor() {
    this.audioContext = new (getAudioContextConstructor())();
  }

  private async loadSound(key: SoundKey): Promise<void> {
    const existing = this.loading.get(key);
    if (existing) return existing;
    if (this.sounds[key]) return;

    const url = SOUND_URLS[key];
    const task = (async () => {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        // Copy buffer — decodeAudioData may detach the original
        const audioBuffer = await this.audioContext.decodeAudioData(
          arrayBuffer.slice(0)
        );
        this.sounds[key] = audioBuffer;
      } catch (error) {
        console.error(`Error loading sound ${key}:`, error);
      }
    })();

    this.loading.set(key, task);
    await task;
  }

  /** Start decoding sounds immediately (no user gesture required). */
  startPreload(): void {
    if (this.preloadStarted) return;
    this.preloadStarted = true;

    void (async () => {
      await Promise.all(PRIORITY_SOUNDS.map((key) => this.loadSound(key)));
      void Promise.all(DEFERRED_SOUNDS.map((key) => this.loadSound(key)));
    })();
  }

  /** Browsers block AudioContext until a user gesture — unlock ASAP. */
  unlock(): void {
    if (this.unlocked) {
      if (this.audioContext.state === "suspended") {
        void this.audioContext.resume();
      }
      return;
    }

    this.unlocked = true;
    this.startPreload();
    void this.audioContext.resume();
  }

  play(soundKey: SoundKey, volume = 0.7): void {
    this.unlock();

    const buffer = this.sounds[soundKey];
    if (!buffer) {
      // Kick off load if somehow missing, then no-op this play
      void this.loadSound(soundKey);
      return;
    }

    if (this.audioContext.state === "suspended") {
      void this.audioContext.resume();
    }

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();

    source.buffer = buffer;
    gainNode.gain.value = volume;

    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    source.start(0);
  }
}

export const soundManager = new SoundManager();

export function initializeButtonSounds(): void {
  // Prefetch/decode as soon as the page boots
  soundManager.startPreload();

  const unlock = () => {
    soundManager.unlock();
  };

  // Unlock on the earliest possible gesture (not only after a full click)
  document.addEventListener("pointerdown", unlock, { once: true });
  document.addEventListener("keydown", unlock, { once: true });
  document.addEventListener("touchstart", unlock, { once: true });

  document.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      if (!button.disabled) {
        soundManager.play("buttonPressed");
      }
    });

    button.addEventListener("mouseover", () => {
      if (!button.disabled) {
        soundManager.play("buttonHover");
      }
    });
  });
}

export function initializePrizeSounds(prizeElement: HTMLElement): void {
  prizeElement.addEventListener("mouseenter", () => {
    soundManager.play("prizeHover");
  });

  const checkbox = prizeElement.querySelector<HTMLInputElement>(
    ".ui-checkbox__input"
  );
  checkbox?.addEventListener("change", () => {
    soundManager.play("prizeToggle");
  });

  const colorButton =
    prizeElement.querySelector<HTMLButtonElement>(".prize-color");
  colorButton?.addEventListener("click", () => {
    soundManager.play("prizePressed");
  });
}
