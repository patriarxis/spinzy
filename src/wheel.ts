import Konva from "konva";
import type { Prize } from "./types";
import { PRIZE_MODES } from "./types";
import { prizeBgColors, prizeColors } from "./prizes";
import {
  calculateTargetRotation,
  selectPrizeByProbability,
  validateProbabilities,
} from "./probability";
import { soundManager } from "./audio";
import { openTryAgainModal, openWinningModal } from "./result-modals";

const RADIUS = 1000;
const SCENE_WIDTH = RADIUS * 2;
const SCENE_HEIGHT = RADIUS * 2;

let stage: Konva.Stage | null = null;
let wheelGroup: Konva.Group | null = null;
let layer: Konva.Layer | null = null;
let isSpinning = false;
let rotation = 0;
let currentPrizes: Prize[] = [];

function createCurvedText(
  text: string,
  textRadius: number,
  options: {
    fontSize?: number;
    fontStyle?: string;
    fill?: string;
    startAngle?: number;
    verticalAlign?: string;
  } = {}
): Konva.Group {
  const {
    fontSize = 24,
    fontStyle = "800",
    fill = "#000",
    startAngle = 0,
    verticalAlign = "middle",
  } = options;

  const group = new Konva.Group();
  const textPath = new Konva.TextPath({
    x: 0,
    y: 0,
    text,
    fontSize,
    fontStyle,
    fill,
    data: `M-${textRadius},0 A${textRadius},${textRadius} 0 0,1 ${textRadius},0`,
    align: "center",
    verticalAlign,
    rotation: startAngle + 90,
  });

  group.add(textPath);
  return group;
}

export function setWheelPrizes(prizes: Prize[]): void {
  currentPrizes = prizes;
}

export function getWheelPrizes(): Prize[] {
  return currentPrizes;
}

export function enableSpinButton(): void {
  const button = document.querySelector<HTMLButtonElement>(".spin-button");
  if (button) button.disabled = false;
}

export function disableSpinButton(): void {
  const button = document.querySelector<HTMLButtonElement>(".spin-button");
  if (button) button.disabled = true;
}

export function fitStageIntoParentContainer(): void {
  if (!stage) return;

  const container = document.querySelector<HTMLElement>("#wheel-stage");
  if (!container) return;

  const scale = container.offsetWidth / SCENE_WIDTH;
  stage.width(SCENE_WIDTH * scale);
  stage.height(SCENE_HEIGHT * scale);
  stage.scale({ x: scale, y: scale });
}

export function drawWheel(prizes: Prize[]): void {
  currentPrizes = prizes;

  if (stage) {
    stage.destroy();
    stage = null;
    wheelGroup = null;
    layer = null;
  }

  const activePrizes = prizes.filter((prize) => prize.active);
  if (activePrizes.length === 0) {
    console.warn("Cannot draw wheel: no active prizes");
    return;
  }

  stage = new Konva.Stage({
    container: "wheel-stage",
    width: SCENE_WIDTH,
    height: SCENE_HEIGHT,
  });

  layer = new Konva.Layer();
  stage.add(layer);

  wheelGroup = new Konva.Group({
    x: SCENE_WIDTH / 2,
    y: SCENE_HEIGHT / 2,
  });
  layer.add(wheelGroup);

  const sectorAngle = 360 / activePrizes.length;

  activePrizes.forEach((prize, index) => {
    const angle = sectorAngle * index;
    const sectorGroup = new Konva.Group({ rotation: angle });

    const wedge = new Konva.Wedge({
      angle: sectorAngle,
      radius: RADIUS,
      fill: prizeBgColors[prize.mode],
      stroke: "#b5b3b3",
      strokeWidth: 1,
    });

    const textRadius = RADIUS * 0.9;
    const imageRadius = RADIUS * 0.6;
    const bisectorAngle = sectorAngle / 2;
    const imageX = imageRadius * Math.cos((bisectorAngle * Math.PI) / 180);
    const imageY = imageRadius * Math.sin((bisectorAngle * Math.PI) / 180);

    const text = createCurvedText(prize.name, textRadius, {
      fontSize: 48,
      fontStyle: "800",
      fill: prizeColors[prize.mode],
      startAngle: sectorAngle / 2,
      verticalAlign: "middle",
    });

    const imageObj = new Image();
    imageObj.onload = () => {
      if (!layer) return;
      const imageSize = RADIUS * 0.38;
      const image = new Konva.Image({
        image: imageObj,
        width: imageSize,
        height: imageSize * 1.4,
        x: imageX,
        y: imageY,
        offsetX: imageSize / 2,
        offsetY: imageSize / 2 + 40,
        rotation: sectorAngle / 2 + 90,
      });
      sectorGroup.add(image);
      layer.batchDraw();
    };
    imageObj.src = prize.wheelImage;

    sectorGroup.add(wedge, text);
    wheelGroup!.add(sectorGroup);
  });

  wheelGroup.add(
    new Konva.Circle({
      x: 0,
      y: 0,
      radius: RADIUS,
      stroke: "#b5b3b3",
      strokeWidth: 2,
    })
  );

  fitStageIntoParentContainer();
}

function startArrowJiggle(): void {
  const arrow = document.querySelector<HTMLElement>(".wheel-arrow");
  if (!arrow) return;

  let startTime: number | null = null;

  function jiggleAnimationStep(timestamp: number): void {
    if (!arrow) return;
    if (startTime === null) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const totalDuration = 5000;
    const progress = Math.min(elapsed / totalDuration, 1);
    const decayFactor = Math.pow(1 - progress, 3);
    const maxBottomAngle = 35;
    const initialFrequency = 10;
    const finalFrequency = 1;
    const currentFrequency =
      initialFrequency * (1 - progress) + finalFrequency * progress;
    const bottomAngle =
      maxBottomAngle *
      decayFactor *
      Math.sin((currentFrequency * elapsed) / 50);

    arrow.style.transformOrigin = "top center";
    arrow.style.transform = `translateX(-50%) rotate(${bottomAngle}deg)`;

    if (progress < 1) {
      requestAnimationFrame(jiggleAnimationStep);
    } else {
      arrow.style.transform = "translateX(-50%) rotate(0deg)";
    }
  }

  requestAnimationFrame(jiggleAnimationStep);
}

export function spinWheel(): void {
  if (isSpinning || !wheelGroup || !layer) return;

  if (!validateProbabilities(currentPrizes)) {
    return;
  }

  const selectedPrize = selectPrizeByProbability(currentPrizes);
  if (!selectedPrize) {
    alert("Unable to select a prize. Check active prizes and probabilities.");
    return;
  }

  const prize = selectedPrize;

  isSpinning = true;
  soundManager.play("spinButtonPressed");
  disableSpinButton();
  startArrowJiggle();
  soundManager.play("spinWheel");

  const targetRotation = calculateTargetRotation(
    currentPrizes,
    prize,
    rotation
  );
  const spinDuration = 5100;
  const startRotation = rotation;
  const startTime = Date.now();

  function animate(): void {
    if (!wheelGroup || !layer) return;

    const elapsedTime = Date.now() - startTime;
    const progress = Math.min(elapsedTime / spinDuration, 1);
    const easeProgress = 1 - Math.pow(1 - progress, 3);

    rotation = startRotation + targetRotation * easeProgress;
    wheelGroup.rotation(rotation);
    layer.batchDraw();

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      isSpinning = false;
      enableSpinButton();

      if (prize.mode === PRIZE_MODES.tryAgain) {
        openTryAgainModal(prize);
      } else {
        openWinningModal(prize);
      }
      rotation %= 360;
    }
  }

  animate();
}
