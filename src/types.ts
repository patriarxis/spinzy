export const PRIZE_MODES = {
  default: "default",
  grandPrize: "grand-prize",
  tryAgain: "try-again",
} as const;

export type PrizeMode = (typeof PRIZE_MODES)[keyof typeof PRIZE_MODES];

export interface PrizeCatalogItem {
  name: string;
  type: string;
  image: string;
  wheelImage: string;
  probability: string;
  mode: PrizeMode;
  active: boolean;
  description?: string;
}

export interface Prize extends PrizeCatalogItem {
  id: number;
}

export interface StoredPrizes {
  value: Prize[];
  expiry: number;
}

export type SoundKey =
  | "buttonHover"
  | "buttonPressed"
  | "spinButtonPressed"
  | "spinWheel"
  | "win"
  | "lose"
  | "prizeHover"
  | "prizePressed"
  | "prizeToggle"
  | "prizeDrag";
