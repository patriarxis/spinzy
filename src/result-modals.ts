import type { Prize } from "./types";
import { PRIZE_MODES } from "./types";
import { soundManager } from "./audio";
import {
  closeContainer,
  createModalBackdrop,
  openContainer,
  removeModalBackdrop,
} from "./modals";

let winningModalBackdrop: HTMLDivElement | null = null;
let tryAgainModalBackdrop: HTMLDivElement | null = null;

function renderWinningPrize(prize: Prize): void {
  const info = document.querySelector(".winning-prize-info");
  if (!info) return;

  while (info.firstChild) {
    info.removeChild(info.firstChild);
  }

  const prizeImg = document.querySelector<HTMLImageElement>(".winning-prize-img");
  if (prizeImg) {
    prizeImg.src = prize.image;
    prizeImg.alt = prize.name;
  }

  const prizeTitle = document.createElement("h2");
  prizeTitle.className = "winning-prize-name";
  prizeTitle.textContent = prize.name;
  info.append(prizeTitle);

  if (prize.description) {
    const prizeDescription = document.createElement("p");
    prizeDescription.className = "winning-prize-description";
    prizeDescription.textContent = prize.description;
    info.append(prizeDescription);
  }
}

export function openWinningModal(prize: Prize): void {
  const winningModalContainer =
    document.querySelector<HTMLElement>(".winning-modal");
  const winningModal =
    winningModalContainer?.querySelector<HTMLElement>(".modal");
  if (!winningModalContainer || !winningModal) return;

  winningModal.classList.add(prize.mode);
  winningModal.setAttribute("role", "dialog");
  winningModal.setAttribute("aria-modal", "true");
  winningModal.setAttribute("aria-label", `You won ${prize.name}`);

  openContainer(winningModalContainer, winningModal, 1000);
  renderWinningPrize(prize);
  soundManager.play("win");
  winningModalBackdrop = createModalBackdrop(closeWinningModal, 999);
}

export function closeWinningModal(): void {
  const winningModalContainer =
    document.querySelector<HTMLElement>(".winning-modal");
  const winningModal =
    winningModalContainer?.querySelector<HTMLElement>(".modal");
  if (!winningModalContainer || !winningModal) return;

  closeContainer(winningModalContainer, winningModal, () => {
    winningModal.classList.remove(
      PRIZE_MODES.default,
      PRIZE_MODES.grandPrize,
      PRIZE_MODES.tryAgain
    );
  });

  removeModalBackdrop(winningModalBackdrop);
  winningModalBackdrop = null;
}

export function openTryAgainModal(prize: Prize): void {
  const tryAgainModalContainer =
    document.querySelector<HTMLElement>(".try-again-modal");
  const tryAgainModal =
    tryAgainModalContainer?.querySelector<HTMLElement>(".modal");
  if (!tryAgainModalContainer || !tryAgainModal) return;

  tryAgainModal.classList.add(prize.mode);
  tryAgainModal.setAttribute("role", "dialog");
  tryAgainModal.setAttribute("aria-modal", "true");
  tryAgainModal.setAttribute("aria-label", "Try again");

  openContainer(tryAgainModalContainer, tryAgainModal, 1100);
  soundManager.play("lose");
  tryAgainModalBackdrop = createModalBackdrop(closeTryAgainModal, 1099);
}

export function closeTryAgainModal(): void {
  const tryAgainModalContainer =
    document.querySelector<HTMLElement>(".try-again-modal");
  const tryAgainModal =
    tryAgainModalContainer?.querySelector<HTMLElement>(".modal");
  if (!tryAgainModalContainer || !tryAgainModal) return;

  closeContainer(tryAgainModalContainer, tryAgainModal, () => {
    tryAgainModal.classList.remove(
      PRIZE_MODES.default,
      PRIZE_MODES.grandPrize,
      PRIZE_MODES.tryAgain
    );
  });

  removeModalBackdrop(tryAgainModalBackdrop);
  tryAgainModalBackdrop = null;
}
