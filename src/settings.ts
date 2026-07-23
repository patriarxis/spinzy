import dragula, { type Drake } from "dragula";
import type { Prize, PrizeMode } from "./types";
import { PRIZE_MODES } from "./types";
import { availablePrizes, savePrizes } from "./prizes";
import { validateProbabilities } from "./probability";
import { initializePrizeSounds, soundManager } from "./audio";
import {
  closeContainer,
  createModalBackdrop,
  openContainer,
  removeModalBackdrop,
} from "./modals";
import { drawWheel, setWheelPrizes } from "./wheel";
import { refreshPacman } from "./pacman";
import { createCheckbox } from "./ui/checkbox";
import { createSelect, closeAllSelects } from "./ui/select";
import {
  createNumberField,
  closeAllNumberSuggestions,
} from "./ui/number-field";

const PROBABILITY_SUGGESTIONS = [
  "100",
  "75",
  "50",
  "25",
  "10",
  "5",
  "2",
  "1",
  "0.1",
  "0.01",
  "0",
];

let tempPrizes: Prize[] = [];
let settingsModalBackdrop: HTMLDivElement | null = null;
let drake: Drake | null = null;
let onPrizesApplied: ((prizes: Prize[]) => void) | null = null;

export function setSettingsCallbacks(
  applyCallback: (prizes: Prize[]) => void
): void {
  onPrizesApplied = applyCallback;
}

export function openSettingsModal(currentPrizes: Prize[]): void {
  const settings = document.querySelector<HTMLElement>(".settings-menu");
  const settingsModal = settings?.querySelector<HTMLElement>(".modal");
  if (!settings || !settingsModal) return;

  settingsModal.setAttribute("role", "dialog");
  settingsModal.setAttribute("aria-modal", "true");
  settingsModal.setAttribute("aria-label", "Prize settings");

  openContainer(settings, settingsModal, 1200);
  settingsModalBackdrop = createModalBackdrop(closeSettingsModal, 1199);

  tempPrizes = structuredClone(currentPrizes);
  renderSettings();
}

export function closeSettingsModal(): void {
  const settings = document.querySelector<HTMLElement>(".settings-menu");
  const settingsModal = settings?.querySelector<HTMLElement>(".modal");
  if (!settings || !settingsModal) return;

  closeAllSelects();
  closeAllNumberSuggestions();
  closeContainer(settings, settingsModal);
  removeModalBackdrop(settingsModalBackdrop);
  settingsModalBackdrop = null;
}

export function cancelSettings(): void {
  closeSettingsModal();
}

export function applySettings(): void {
  if (!validateProbabilities(tempPrizes)) {
    return;
  }

  const nextPrizes = structuredClone(tempPrizes);
  savePrizes(nextPrizes);
  setWheelPrizes(nextPrizes);
  closeSettingsModal();
  drawWheel(nextPrizes);
  refreshPacman(nextPrizes);
  onPrizesApplied?.(nextPrizes);
}

function enablePrize(prizeElement: HTMLElement): void {
  prizeElement.classList.add("active");
  prizeElement.classList.remove("inactive");
}

function disablePrize(prizeElement: HTMLElement): void {
  prizeElement.classList.remove("active");
  prizeElement.classList.add("inactive");
}

function updatePrizeMode(prizeId: number, mode: PrizeMode): void {
  const prizeIndex = tempPrizes.findIndex((p) => p.id === prizeId);
  if (prizeIndex === -1) return;

  tempPrizes[prizeIndex].mode = mode;
  const prizeElement = document.querySelector<HTMLElement>(
    `.prize-item[data-id="${prizeId}"]`
  );
  if (!prizeElement) return;

  prizeElement.className = `prize-item ${
    tempPrizes[prizeIndex].active ? "active" : "inactive"
  } ${mode}`;
}

function cycleMode(prizeId: number): void {
  const prizeIndex = tempPrizes.findIndex((p) => p.id === prizeId);
  if (prizeIndex === -1) return;

  const modes = Object.values(PRIZE_MODES);
  const currentModeIndex = modes.findIndex(
    (mode) => mode === tempPrizes[prizeIndex].mode
  );
  const nextModeIndex = (currentModeIndex + 1) % modes.length;
  tempPrizes[prizeIndex].mode = modes[nextModeIndex];
  updatePrizeMode(prizeId, tempPrizes[prizeIndex].mode);
}

function updatePrizeCheck(prizeId: number, checked: boolean): void {
  const prizeIndex = tempPrizes.findIndex((p) => p.id === prizeId);
  if (prizeIndex === -1) return;

  tempPrizes[prizeIndex].active = checked;
  const prizeElement = document.querySelector<HTMLElement>(
    `.prize-item[data-id="${prizeId}"]`
  );
  if (!prizeElement) return;

  if (checked) {
    enablePrize(prizeElement);
  } else {
    disablePrize(prizeElement);
  }
}

function updatePrizeProbability(prizeId: number, probability: string): void {
  const prizeIndex = tempPrizes.findIndex((p) => p.id === prizeId);
  if (prizeIndex === -1) return;
  tempPrizes[prizeIndex].probability = probability;
}

function removePrize(prizeId: number): void {
  if (tempPrizes.length <= 1) {
    alert("You must have at least one prize.");
    return;
  }

  tempPrizes = tempPrizes.filter((prize) => prize.id !== prizeId);
  renderSettings();
}

export function addNewPrize(): void {
  const randomPrize =
    availablePrizes[Math.floor(Math.random() * availablePrizes.length)];

  const newPrize: Prize = {
    id:
      tempPrizes.length > 0
        ? Math.max(...tempPrizes.map((p) => p.id)) + 1
        : 1,
    name: randomPrize.name,
    type: randomPrize.type,
    image: randomPrize.image,
    wheelImage: randomPrize.wheelImage,
    probability: randomPrize.probability,
    mode: randomPrize.mode,
    active: true,
  };

  tempPrizes.push(newPrize);
  renderSettings();
}

function createPrizeElement(prize: Prize): HTMLLIElement {
  const prizeElement = document.createElement("li");
  prizeElement.className = `prize-item ${
    prize.active ? "active" : "inactive"
  } ${prize.mode}`;
  prizeElement.setAttribute("data-id", String(prize.id));
  prizeElement.setAttribute("data-type", prize.type);

  const checkboxWrapper = document.createElement("div");
  checkboxWrapper.className = "prize-checkbox-wrapper";
  checkboxWrapper.appendChild(
    createCheckbox({
      id: `prize-checkbox-${prize.id}`,
      checked: prize.active,
      ariaLabel: `Enable ${prize.name}`,
      onChange: (checked) => updatePrizeCheck(prize.id, checked),
    })
  );

  const nameWrapper = document.createElement("div");
  nameWrapper.className = "prize-name-wrapper";
  nameWrapper.appendChild(
    createSelect({
      id: `prize-type-select-${prize.id}`,
      value: prize.type,
      ariaLabel: `Prize type for ${prize.name}`,
      options: availablePrizes.map((availablePrize) => ({
        value: availablePrize.type,
        label: availablePrize.name,
      })),
      onChange: (selectedPrizeType) => {
        const defaultPrize = availablePrizes.find(
          (p) => p.type === selectedPrizeType
        );

        if (defaultPrize) {
          const prizeIndex = tempPrizes.findIndex((p) => p.id === prize.id);
          if (prizeIndex !== -1) {
            tempPrizes[prizeIndex] = {
              ...defaultPrize,
              id: prize.id,
              active: prize.active,
            };
          }
        }

        renderSettings();
      },
    })
  );

  const probabilityWrapper = document.createElement("div");
  probabilityWrapper.className = "prize-probability-wrapper";
  probabilityWrapper.appendChild(
    createNumberField({
      id: `prize-probability-${prize.id}`,
      value: prize.probability,
      ariaLabel: `Probability weight for ${prize.name}`,
      suggestions: PROBABILITY_SUGGESTIONS,
      min: 0,
      step: "any",
      onChange: (value) => updatePrizeProbability(prize.id, value),
    })
  );

  const colorWrapper = document.createElement("div");
  colorWrapper.className = "prize-color-wrapper";

  const colorButton = document.createElement("button");
  colorButton.type = "button";
  colorButton.className = "prize-color";
  colorButton.setAttribute("aria-label", `Cycle type for ${prize.name}`);
  colorButton.onclick = () => cycleMode(prize.id);
  colorWrapper.appendChild(colorButton);

  const rearrangeWrapper = document.createElement("div");
  rearrangeWrapper.className = "prize-rearrange-wrapper";

  const rearrangeSpan = document.createElement("span");
  rearrangeSpan.className = "prize-rearrange";
  rearrangeSpan.textContent = "☰";
  rearrangeSpan.setAttribute("aria-hidden", "true");
  rearrangeWrapper.appendChild(rearrangeSpan);

  const removeWrapper = document.createElement("div");
  removeWrapper.className = "prize-remove-wrapper";

  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.className = "prize-remove-button";
  removeButton.textContent = "✕";
  removeButton.setAttribute("aria-label", `Remove ${prize.name}`);
  removeButton.onclick = () => removePrize(prize.id);
  removeWrapper.appendChild(removeButton);

  prizeElement.appendChild(checkboxWrapper);
  prizeElement.appendChild(nameWrapper);
  prizeElement.appendChild(probabilityWrapper);
  prizeElement.appendChild(colorWrapper);
  prizeElement.appendChild(rearrangeWrapper);
  prizeElement.appendChild(removeWrapper);

  initializePrizeSounds(prizeElement);
  return prizeElement;
}

function renderPrizes(): void {
  const prizesList = document.querySelector(".prizes");
  if (!prizesList) return;

  prizesList.replaceChildren();
  tempPrizes.forEach((prize) => {
    prizesList.appendChild(createPrizeElement(prize));
  });
}

function enableDragAndDrop(): void {
  const settingsMenu = document.querySelector(".settings-menu");
  const settingsContent =
    settingsMenu?.querySelector<HTMLElement>(".modal-content");
  const prizesList = settingsMenu?.querySelector<HTMLElement>(".prizes");
  if (!prizesList || !settingsContent) return;

  if (!drake) {
    drake = dragula([prizesList], {
      moves: (_el, _source, handle) =>
        !!handle &&
        (handle as HTMLElement).classList.contains("prize-rearrange"),
    });

    drake.on("drag", () => {
      soundManager.play("prizeDrag");
      settingsContent.style.overflow = "hidden";
    });

    drake.on("drop", () => {
      soundManager.play("prizeDrag");
      const prizeElements = Array.from(
        prizesList.querySelectorAll<HTMLElement>(".prize-item")
      );

      const reorderedPrizes: Prize[] = [];
      prizeElements.forEach((element) => {
        const prizeId = parseInt(element.dataset.id ?? "", 10);
        const prize = tempPrizes.find((p) => p.id === prizeId);
        if (prize) {
          reorderedPrizes.push({ ...prize });
        }
      });

      tempPrizes = reorderedPrizes;
      settingsContent.style.overflow = "auto";
    });

    drake.on("cancel", () => {
      settingsContent.style.overflow = "auto";
    });
  }
}

function renderSettings(): void {
  closeAllSelects();
  closeAllNumberSuggestions();
  renderPrizes();
  enableDragAndDrop();
}
