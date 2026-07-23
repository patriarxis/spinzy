import type { Prize } from "./types";

export function calculateTotalWeight(prizes: Prize[]): number {
  return prizes
    .filter((prize) => prize.active)
    .reduce((sum, prize) => sum + parseFloat(prize.probability), 0);
}

export function validateProbabilities(prizes: Prize[]): boolean {
  const activePrizes = prizes.filter((prize) => prize.active);
  const totalWeight = calculateTotalWeight(prizes);

  if (activePrizes.length === 0) {
    alert("At least one prize must be active.");
    return false;
  }

  if (totalWeight === 0 || Number.isNaN(totalWeight)) {
    alert("Total probability cannot be 0. Please set valid probabilities.");
    return false;
  }

  if (activePrizes.some((prize) => parseFloat(prize.probability) < 0)) {
    alert("Probabilities cannot be negative.");
    return false;
  }

  return true;
}

export function selectPrizeByProbability(prizes: Prize[]): Prize | null {
  const activePrizes = prizes.filter((prize) => prize.active);
  if (activePrizes.length === 0) return null;

  const totalWeight = calculateTotalWeight(prizes);
  if (totalWeight <= 0 || Number.isNaN(totalWeight)) return null;

  let random = Math.random() * totalWeight;

  for (const prize of activePrizes) {
    random -= parseFloat(prize.probability);
    if (random <= 0) {
      return prize;
    }
  }

  return activePrizes[activePrizes.length - 1] ?? null;
}

export function calculateTargetRotation(
  prizes: Prize[],
  selectedPrize: Prize,
  currentRotation: number
): number {
  const activePrizes = prizes.filter((prize) => prize.active);
  const prizeIndex = activePrizes.findIndex((p) => p.id === selectedPrize.id);
  const sectorAngle = 360 / activePrizes.length;

  const baseRotation = sectorAngle * prizeIndex + sectorAngle / 2;
  const actualRotation = 360 - baseRotation - currentRotation;

  const maxOffset = sectorAngle * 0.9;
  const randomOffset = (Math.random() - 0.5) * maxOffset;

  const fullSpins = 5;
  return 360 * fullSpins + actualRotation + randomOffset;
}
