import "./styles/spin-wheel.css";
import "./styles/ui-controls.css";
import "dragula/dist/dragula.min.css";

import type { Prize } from "./types";
import { createDefaultPrizes, getStoredPrizes } from "./prizes";
import { initializeButtonSounds } from "./audio";
import {
  drawWheel,
  fitStageIntoParentContainer,
  setWheelPrizes,
  spinWheel,
} from "./wheel";
import { renderPacman } from "./pacman";
import {
  addNewPrize,
  applySettings,
  cancelSettings,
  closeSettingsModal,
  openSettingsModal,
  setSettingsCallbacks,
} from "./settings";
import { closeTryAgainModal, closeWinningModal } from "./result-modals";

let prizes: Prize[] = createDefaultPrizes();

function syncPrizes(next: Prize[]): void {
  prizes = next;
  setWheelPrizes(prizes);
}

function bindUi(): void {
  const settingsButton =
    document.querySelector<HTMLButtonElement>(".settings-button");
  const spinButton =
    document.querySelector<HTMLButtonElement>(".spin-button");

  settingsButton?.addEventListener("click", () => openSettingsModal(prizes));
  spinButton?.addEventListener("click", () => spinWheel());

  document
    .querySelector<HTMLButtonElement>(".settings-menu .close-modal-btn")
    ?.addEventListener("click", () => closeSettingsModal());

  document
    .querySelector<HTMLButtonElement>(".settings-cancel")
    ?.addEventListener("click", () => cancelSettings());

  document
    .querySelector<HTMLButtonElement>(".settings-apply")
    ?.addEventListener("click", () => applySettings());

  document
    .querySelector<HTMLButtonElement>(".add-prize-button")
    ?.addEventListener("click", () => addNewPrize());

  document
    .querySelector<HTMLButtonElement>(".winning-modal .close-modal-btn")
    ?.addEventListener("click", () => closeWinningModal());

  document
    .querySelector<HTMLButtonElement>(".try-again-modal .close-modal-btn")
    ?.addEventListener("click", () => closeTryAgainModal());

  document
    .querySelector<HTMLButtonElement>(".retry-button")
    ?.addEventListener("click", () => closeTryAgainModal());

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    const settings = document.querySelector<HTMLElement>(".settings-menu");
    const winning = document.querySelector<HTMLElement>(".winning-modal");
    const tryAgain = document.querySelector<HTMLElement>(".try-again-modal");

    if (settings?.dataset.state === "open") {
      closeSettingsModal();
    } else if (winning?.dataset.state === "open") {
      closeWinningModal();
    } else if (tryAgain?.dataset.state === "open") {
      closeTryAgainModal();
    }
  });
}

function boot(): void {
  const stored = getStoredPrizes();
  if (stored) {
    prizes = stored;
  }

  setWheelPrizes(prizes);
  setSettingsCallbacks(syncPrizes);
  bindUi();

  drawWheel(prizes);
  window.addEventListener("resize", fitStageIntoParentContainer);
  renderPacman(prizes);
  initializeButtonSounds();
}

boot();
