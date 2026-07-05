import { getSeedOfLifeCenters, getTripodOfLifeCenters } from "../geometry/lattice";
import { getCenterConnectionSegmentsForSymbol } from "../geometry/spatial";
import { drawConstructionSteps, drawPreviewSteps, type ConstructionStep } from "../render/drawing";
import type { ConstructibleSymbol, SymbolRenderState } from "./types";

const previewState = (baseRadius: number, state: SymbolRenderState): SymbolRenderState => ({
  ...state,
  baseRadius,
  progress: 1,
});

const drawStepsIcon = (
  symbol: ConstructibleSymbol,
  ctx: CanvasRenderingContext2D,
  bounds: { x: number; y: number; width: number; height: number },
  state: SymbolRenderState,
  worldExtent = 4.6,
): void => {
  const iconRadius = 42;
  drawPreviewSteps(
    ctx,
    symbol.getConstructionSteps(previewState(iconRadius, state)),
    bounds,
    iconRadius * worldExtent,
  );
};

const tripodSteps = (state: SymbolRenderState): ConstructionStep[] => {
  const centers = getTripodOfLifeCenters(state.baseRadius);
  const centerConnections = state.options.connectCenters
    ? getCenterConnectionSegmentsForSymbol("tripod-of-life", state.baseRadius).map(
        ([from, to]) => ({
          type: "line" as const,
          from,
          to,
          role: "active" as const,
        }),
      )
    : [];

  return [
    ...centers.map((center, index) => ({
      type: "circle" as const,
      center,
      radius: state.baseRadius,
      role: "active" as const,
      label: index === 0 ? "origin" : undefined,
    })),
    ...centerConnections,
    ...centers.map((center) => ({
      type: "point" as const,
      point: center,
      role: "node" as const,
    })),
  ];
};

const seedSteps = (state: SymbolRenderState): ConstructionStep[] => {
  const centers = getSeedOfLifeCenters(state.baseRadius);
  const centerConnections = state.options.connectCenters
    ? getCenterConnectionSegmentsForSymbol("seed-of-life", state.baseRadius).map(
        ([from, to]) => ({
          type: "line" as const,
          from,
          to,
          role: "active" as const,
        }),
      )
    : [];

  return [
    ...centers.map((center, index) => ({
      type: "circle" as const,
      center,
      radius: state.baseRadius,
      role: "active" as const,
      label: index === 0 ? "center" : undefined,
    })),
    ...centerConnections,
    ...centers.map((center) => ({
      type: "point" as const,
      point: center,
      role: "node" as const,
    })),
  ];
};

export const lifePatternSymbols: ConstructibleSymbol[] = [
  {
    id: "tripod-of-life",
    label: "Tripod of Life",
    category: "Life patterns",
    description:
      "Three equal circles arranged from an equilateral triangular relation.",
    constructionBasis:
      "Three circle centers form an equilateral triangle with side length equal to the base radius.",
    prerequisites: ["vesica-piscis"],
    timelineIndex: 4,
    related: ["circle", "seed-of-life"],
    drawIcon(ctx, bounds, state) {
      drawStepsIcon(this, ctx, bounds, state);
    },
    drawMain(ctx, state) {
      drawConstructionSteps(ctx, this.getConstructionSteps(state), state);
    },
    getConstructionSteps: tripodSteps,
  },
  {
    id: "seed-of-life",
    label: "Seed of Life",
    category: "Life patterns",
    description:
      "A central circle surrounded by six equal circles on a hexagonal ring.",
    constructionBasis:
      "Generated from the center plus the first ring of a triangular/hexagonal lattice.",
    prerequisites: ["tripod-of-life"],
    timelineIndex: 5,
    related: ["vesica-piscis", "tripod-of-life"],
    drawIcon(ctx, bounds, state) {
      drawStepsIcon(this, ctx, bounds, state, 5.1);
    },
    drawMain(ctx, state) {
      drawConstructionSteps(ctx, this.getConstructionSteps(state), state);
    },
    getConstructionSteps: seedSteps,
  },
];
