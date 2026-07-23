import type { Prize, PrizeCatalogItem, PrizeMode, StoredPrizes } from "./types";
import { PRIZE_MODES } from "./types";

const STORAGE_KEY = "prizes";
const EXPIRATION_DAYS = 7;

export const prizeBgColors: Record<PrizeMode, string> = {
  [PRIZE_MODES.default]: "#e7e7e7",
  [PRIZE_MODES.grandPrize]: "#e90037",
  [PRIZE_MODES.tryAgain]: "#464342",
};

export const prizeColors: Record<PrizeMode, string> = {
  [PRIZE_MODES.default]: "#464342",
  [PRIZE_MODES.grandPrize]: "white",
  [PRIZE_MODES.tryAgain]: "white",
};

export const availablePrizes: PrizeCatalogItem[] = [
  {
    name: "SUV",
    type: "suv",
    image: "/assets/images/prizes/suv.webp",
    wheelImage: "/assets/images/wheel-prizes/suv.webp",
    probability: "0.1",
    mode: PRIZE_MODES.grandPrize,
    active: true,
  },
  {
    name: "Try Again",
    type: "try-again",
    image: "/assets/images/prizes/try-again.webp",
    wheelImage: "/assets/images/wheel-prizes/try-again.webp",
    probability: "50",
    mode: PRIZE_MODES.tryAgain,
    active: true,
  },
  {
    name: "Tote Bag",
    type: "tote-bag",
    image: "/assets/images/prizes/tote-bag.webp",
    wheelImage: "/assets/images/wheel-prizes/tote-bag.webp",
    probability: "5",
    mode: PRIZE_MODES.default,
    active: true,
  },
  {
    name: "Keychain",
    type: "keychain",
    image: "/assets/images/prizes/keychain.webp",
    wheelImage: "/assets/images/wheel-prizes/keychain.webp",
    probability: "70",
    mode: PRIZE_MODES.default,
    active: true,
  },
  {
    name: "Tickets",
    type: "tickets",
    image: "/assets/images/prizes/tickets.webp",
    wheelImage: "/assets/images/wheel-prizes/tickets.webp",
    probability: "15",
    mode: PRIZE_MODES.default,
    active: true,
  },
  {
    name: "OSFP Gifts",
    type: "osfp-gifts",
    image: "/assets/images/prizes/olympiacos-gifts.webp",
    wheelImage: "/assets/images/wheel-prizes/olympiacos-gifts.webp",
    probability: "10",
    mode: PRIZE_MODES.default,
    active: true,
  },
  {
    name: "Mystery",
    type: "mystery",
    image: "/assets/images/prizes/mystery-box.webp",
    wheelImage: "/assets/images/wheel-prizes/mystery-box.webp",
    probability: "5",
    mode: PRIZE_MODES.default,
    active: true,
  },
  {
    name: "Cup",
    type: "cup",
    image: "/assets/images/prizes/cup.webp",
    wheelImage: "/assets/images/wheel-prizes/cup.webp",
    probability: "10",
    mode: PRIZE_MODES.default,
    active: true,
  },
  {
    name: "Air Freshener",
    type: "air-freshener",
    image: "/assets/images/prizes/air-freshener.webp",
    wheelImage: "/assets/images/wheel-prizes/air-freshener.webp",
    probability: "10",
    mode: PRIZE_MODES.default,
    active: true,
  },
  {
    name: "Voucher",
    type: "voucher",
    image: "/assets/images/prizes/voucher.webp",
    wheelImage: "/assets/images/wheel-prizes/voucher.webp",
    probability: "10",
    mode: PRIZE_MODES.default,
    active: true,
  },
];

export function createDefaultPrizes(): Prize[] {
  return availablePrizes.map((prize, index) => ({
    ...prize,
    id: index + 1,
  }));
}

function isPrize(value: unknown): value is Prize {
  if (!value || typeof value !== "object") return false;
  const prize = value as Record<string, unknown>;
  return (
    typeof prize.id === "number" &&
    typeof prize.name === "string" &&
    typeof prize.type === "string" &&
    typeof prize.image === "string" &&
    typeof prize.wheelImage === "string" &&
    typeof prize.probability === "string" &&
    typeof prize.mode === "string" &&
    typeof prize.active === "boolean"
  );
}

function isStoredPrizes(value: unknown): value is StoredPrizes {
  if (!value || typeof value !== "object") return false;
  const stored = value as Record<string, unknown>;
  return (
    typeof stored.expiry === "number" &&
    Array.isArray(stored.value) &&
    stored.value.every(isPrize)
  );
}

export function getStoredPrizes(): Prize[] | null {
  const storedData = localStorage.getItem(STORAGE_KEY);
  if (!storedData) return null;

  try {
    const parsed: unknown = JSON.parse(storedData);
    if (!isStoredPrizes(parsed)) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    if (Date.now() < parsed.expiry) {
      return parsed.value;
    }

    localStorage.removeItem(STORAGE_KEY);
    return null;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function savePrizes(prizes: Prize[]): void {
  const dataToStore: StoredPrizes = {
    value: prizes,
    expiry: Date.now() + EXPIRATION_DAYS * 24 * 60 * 60 * 1000,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
}
