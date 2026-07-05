import { revealForStep } from "./animation";
import type { Point } from "../geometry/vector";
import type { SymbolRenderState } from "../symbols/types";

export type StepRole = "construction" | "active" | "node" | "lattice";

export type ConstructionStep =
  | {
      type: "circle";
      center: Point;
      radius: number;
      role: StepRole;
      label?: string;
    }
  | {
      type: "point";
      point: Point;
      role: StepRole;
      label?: string;
    }
  | {
      type: "line";
      from: Point;
      to: Point;
      role: StepRole;
      label?: string;
    };

export interface DrawStyle {
  stroke?: string;
  fill?: string;
  lineWidth?: number;
  alpha?: number;
}

const palette = {
  construction: "rgba(126, 199, 255, 0.34)",
  active: "rgba(247, 244, 232, 0.96)",
  gold: "rgba(244, 204, 112, 0.95)",
  cyan: "rgba(112, 225, 255, 0.92)",
  label: "rgba(226, 235, 244, 0.82)",
};

export const clearCanvas = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void => {
  const gradient = ctx.createRadialGradient(
    width * 0.52,
    height * 0.44,
    0,
    width * 0.52,
    height * 0.44,
    Math.max(width, height),
  );

  gradient.addColorStop(0, "#0d1828");
  gradient.addColorStop(0.56, "#050912");
  gradient.addColorStop(1, "#020308");

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
};

export const drawCircle = (
  ctx: CanvasRenderingContext2D,
  center: Point,
  radius: number,
  style: DrawStyle = {},
): void => {
  ctx.save();
  ctx.globalAlpha = style.alpha ?? 1;
  ctx.strokeStyle = style.stroke ?? palette.construction;
  ctx.lineWidth = style.lineWidth ?? 1;
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
};

export const drawCircleProgress = (
  ctx: CanvasRenderingContext2D,
  center: Point,
  radius: number,
  progress: number,
  style: DrawStyle = {},
): void => {
  const amount = Math.max(0, Math.min(1, progress));

  if (amount <= 0) {
    return;
  }

  ctx.save();
  ctx.globalAlpha = style.alpha ?? 1;
  ctx.strokeStyle = style.stroke ?? palette.construction;
  ctx.lineWidth = style.lineWidth ?? 1;
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * amount);
  ctx.stroke();
  ctx.restore();
};

export const drawLineProgress = (
  ctx: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  progress: number,
  style: DrawStyle = {},
): void => {
  const amount = Math.max(0, Math.min(1, progress));

  if (amount <= 0) {
    return;
  }

  ctx.save();
  ctx.globalAlpha = style.alpha ?? 1;
  ctx.strokeStyle = style.stroke ?? palette.active;
  ctx.lineWidth = style.lineWidth ?? 1;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(from.x + (to.x - from.x) * amount, from.y + (to.y - from.y) * amount);
  ctx.stroke();
  ctx.restore();
};

export const drawPoint = (
  ctx: CanvasRenderingContext2D,
  point: Point,
  radius: number,
  style: DrawStyle = {},
): void => {
  ctx.save();
  ctx.globalAlpha = style.alpha ?? 1;
  ctx.fillStyle = style.fill ?? palette.gold;
  ctx.shadowColor = style.fill ?? palette.gold;
  ctx.shadowBlur = radius * 2.4;
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

export const drawLabel = (
  ctx: CanvasRenderingContext2D,
  text: string,
  point: Point,
): void => {
  ctx.save();
  ctx.fillStyle = palette.label;
  ctx.font = "11px Inter, ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, point.x, point.y);
  ctx.restore();
};

export const drawConstructionSteps = (
  ctx: CanvasRenderingContext2D,
  steps: ConstructionStep[],
  state: SymbolRenderState,
): void => {
  const totalSteps = Math.max(1, steps.length);

  steps.forEach((step, index) => {
    const progress = state.options.animation
      ? revealForStep(index, totalSteps, state.progress)
      : 1;
    const lineWidth = Math.max(0.7, 1.15 / state.camera.scale);

    if (step.role === "construction" && !state.options.showConstructionCircles) {
      return;
    }

    if (step.role === "lattice" && !state.options.showLatticePoints) {
      return;
    }

    if (step.type === "circle") {
      const stroke =
        step.role === "active" ? palette.active : step.role === "lattice" ? palette.cyan : palette.construction;
      const alpha = step.role === "active" ? 0.96 : 0.72;
      drawCircleProgress(ctx, step.center, step.radius, progress, {
        stroke,
        lineWidth: step.role === "active" ? lineWidth * 1.25 : lineWidth,
        alpha,
      });
    }

    if (step.type === "line") {
      drawLineProgress(ctx, step.from, step.to, progress, {
        stroke: step.role === "active" ? palette.active : palette.cyan,
        lineWidth,
        alpha: step.role === "active" ? 0.94 : 0.5,
      });
    }

    if (step.type === "point") {
      drawPoint(ctx, step.point, Math.max(2.2, 3.8 / state.camera.scale), {
        fill: step.role === "lattice" ? palette.cyan : palette.gold,
        alpha: progress,
      });
    }

    if (state.options.showLabels && step.label && progress > 0.88) {
      drawLabel(ctx, step.label, {
        x: step.type === "circle" ? step.center.x : step.type === "line" ? (step.from.x + step.to.x) / 2 : step.point.x,
        y:
          step.type === "circle"
            ? step.center.y - step.radius - 18 / state.camera.scale
            : step.type === "line"
              ? (step.from.y + step.to.y) / 2
              : step.point.y - 18 / state.camera.scale,
      });
    }
  });
};

export const drawPreviewSteps = (
  ctx: CanvasRenderingContext2D,
  steps: ConstructionStep[],
  bounds: { x: number; y: number; width: number; height: number },
  worldExtent: number,
): void => {
  const scale = Math.min(bounds.width, bounds.height) / worldExtent;

  ctx.save();
  ctx.translate(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  ctx.scale(scale, scale);

  steps.forEach((step) => {
    if (step.type === "circle") {
      drawCircle(ctx, step.center, step.radius, {
        stroke: step.role === "active" ? palette.active : palette.construction,
        lineWidth: 1.2 / scale,
        alpha: step.role === "active" ? 0.95 : 0.55,
      });
    }

    if (step.type === "point") {
      drawPoint(ctx, step.point, 2.6 / scale, {
        fill: step.role === "lattice" ? palette.cyan : palette.gold,
        alpha: 0.9,
      });
    }

    if (step.type === "line") {
      drawLineProgress(ctx, step.from, step.to, 1, {
        stroke: step.role === "active" ? palette.active : palette.cyan,
        lineWidth: 1.1 / scale,
        alpha: 0.8,
      });
    }
  });

  ctx.restore();
};
