import { clamp } from "../geometry/vector";

export const easeOutCubic = (value: number): number => {
  const normalized = clamp(value, 0, 1);

  return 1 - Math.pow(1 - normalized, 3);
};

export const revealForStep = (
  index: number,
  totalSteps: number,
  progress: number,
): number => {
  if (totalSteps <= 1) {
    return clamp(progress, 0, 1);
  }

  const paddedProgress = progress * (totalSteps + 0.6);
  return easeOutCubic(paddedProgress - index);
};
