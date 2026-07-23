import type { Prize } from "./types";

const GAP_MS = 3000;
const RESET_STAGGER_MS = 80;

let pacmanEl: HTMLImageElement | null = null;
let dotsContainer: HTMLElement | null = null;
let dots: HTMLImageElement[] = [];
let collisionFrameId: number | null = null;
let gapTimeoutId: number | null = null;
let resetTimeoutIds: number[] = [];
let nextDotIndex = 0;
let running = false;
let reducedMotion = false;

function clearResetTimeouts(): void {
  resetTimeoutIds.forEach((id) => clearTimeout(id));
  resetTimeoutIds = [];
}

function clearGapTimeout(): void {
  if (gapTimeoutId !== null) {
    clearTimeout(gapTimeoutId);
    gapTimeoutId = null;
  }
}

function stopCollisionLoop(): void {
  if (collisionFrameId !== null) {
    cancelAnimationFrame(collisionFrameId);
    collisionFrameId = null;
  }
}

function getDotCapacity(): number {
  if (!dotsContainer) return 12;

  const styles = getComputedStyle(dotsContainer);
  const gap = parseFloat(styles.columnGap || styles.gap) || 8;
  const paddingLeft = parseFloat(styles.paddingLeft) || 0;
  const width = dotsContainer.clientWidth - paddingLeft;
  const sampleSize =
    parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue(
        "--pacman-dot-size"
      )
    ) || 24;

  return Math.max(6, Math.floor(width / (sampleSize + gap)));
}

/**
 * Pacman only moves left → right, so we only ever test the next uneaten dots.
 * Avoids 45× getBoundingClientRect every frame.
 */
function startCollisionLoop(): void {
  stopCollisionLoop();
  nextDotIndex = 0;

  const step = (): void => {
    if (!pacmanEl || !running) return;

    const pacmanRect = pacmanEl.getBoundingClientRect();
    // Eat as the front of the SUV reaches the dot (so it fades under the car)
    const eatX = pacmanRect.left + pacmanRect.width * 0.28;

    while (nextDotIndex < dots.length) {
      const dot = dots[nextDotIndex];
      if (dot.classList.contains("eaten")) {
        nextDotIndex += 1;
        continue;
      }

      const dotRect = dot.getBoundingClientRect();
      if (eatX >= dotRect.left) {
        dot.classList.add("eaten");
        nextDotIndex += 1;
      } else {
        break;
      }
    }

    if (nextDotIndex < dots.length) {
      collisionFrameId = requestAnimationFrame(step);
    } else {
      collisionFrameId = null;
    }
  };

  collisionFrameId = requestAnimationFrame(step);
}

function resetDots(): void {
  clearResetTimeouts();
  dots.forEach((dot, index) => {
    const id = window.setTimeout(() => {
      dot.classList.remove("eaten");
    }, index * RESET_STAGGER_MS);
    resetTimeoutIds.push(id);
  });
}

function onAnimationEnd(event: AnimationEvent): void {
  if (event.animationName !== "slide") return;
  if (!pacmanEl || !running) return;

  pacmanEl.classList.remove("pacman-animation");
  // Force reflow so the next add restarts the CSS animation cleanly
  void pacmanEl.offsetWidth;
  stopCollisionLoop();
  resetDots();

  clearGapTimeout();
  gapTimeoutId = window.setTimeout(() => {
    gapTimeoutId = null;
    if (!running || document.hidden || reducedMotion) return;
    startPass();
  }, GAP_MS);
}

function startPass(): void {
  if (!pacmanEl || !running || reducedMotion) return;

  clearResetTimeouts();
  dots.forEach((dot) => dot.classList.remove("eaten"));
  nextDotIndex = 0;

  pacmanEl.classList.remove("pacman-animation");
  void pacmanEl.offsetWidth;
  pacmanEl.classList.add("pacman-animation");
  startCollisionLoop();
}

function onVisibilityChange(): void {
  if (document.hidden) {
    stopCollisionLoop();
    pacmanEl?.classList.remove("pacman-animation");
  } else if (running && !reducedMotion) {
    startPass();
  }
}

export function destroyPacman(): void {
  running = false;
  stopCollisionLoop();
  clearResetTimeouts();
  clearGapTimeout();

  if (pacmanEl) {
    pacmanEl.classList.remove("pacman-animation");
    pacmanEl.removeEventListener("animationend", onAnimationEnd);
  }

  document.removeEventListener("visibilitychange", onVisibilityChange);

  dotsContainer?.replaceChildren();
  dots = [];
  pacmanEl = null;
  dotsContainer = null;
}

export function renderPacman(prizes: Prize[]): void {
  destroyPacman();

  const activePrizes = prizes.filter((prize) => prize.active);
  if (activePrizes.length === 0) return;

  pacmanEl = document.querySelector<HTMLImageElement>(".pacman");
  dotsContainer = document.querySelector<HTMLElement>(".dots");
  if (!pacmanEl || !dotsContainer) return;

  reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const capacity = getDotCapacity();
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < capacity; i++) {
    const prize = activePrizes[i % activePrizes.length];
    const dot = document.createElement("img");
    dot.src = prize.image;
    dot.alt = "";
    dot.decoding = "async";
    dot.loading = "lazy";
    dot.classList.add("dot");
    fragment.appendChild(dot);
    dots.push(dot);
  }

  dotsContainer.appendChild(fragment);

  if (reducedMotion) {
    pacmanEl.style.opacity = "0";
    return;
  }

  running = true;
  pacmanEl.addEventListener("animationend", onAnimationEnd);
  document.addEventListener("visibilitychange", onVisibilityChange);
  startPass();
}

export function refreshPacman(prizes: Prize[]): void {
  renderPacman(prizes);
}
