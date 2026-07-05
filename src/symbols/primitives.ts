import { getVesicaPiscisCircles } from "../geometry/circles";
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
  worldExtent = 4.2,
): void => {
  const iconRadius = 48;
  drawPreviewSteps(
    ctx,
    symbol.getConstructionSteps(previewState(iconRadius, state)),
    bounds,
    iconRadius * worldExtent,
  );
};

const voidSteps = (state: SymbolRenderState): ConstructionStep[] => [
  {
    type: "point",
    point: { x: 0, y: 0 },
    role: "node",
    label: "void",
  },
  {
    type: "circle",
    center: { x: 0, y: 0 },
    radius: state.baseRadius * 0.12,
    role: "construction",
  },
];

const pointSteps = (): ConstructionStep[] => [
  {
    type: "point",
    point: { x: 0, y: 0 },
    role: "node",
    label: "origin",
  },
];

const circleSteps = (state: SymbolRenderState): ConstructionStep[] => [
  ...pointSteps(),
  {
    type: "circle",
    center: { x: 0, y: 0 },
    radius: state.baseRadius,
    role: "active",
    label: "circle",
  },
];

const vesicaSteps = (state: SymbolRenderState): ConstructionStep[] => {
  const centerConnections = state.options.connectCenters
    ? getCenterConnectionSegmentsForSymbol("vesica-piscis", state.baseRadius).map(
        ([from, to]) => ({
          type: "line" as const,
          from,
          to,
          role: "active" as const,
        }),
      )
    : [];

  return [
    ...getVesicaPiscisCircles(state.baseRadius).map((circle, index) => ({
      type: "circle" as const,
      center: circle.center,
      radius: circle.radius,
      role: "active" as const,
      label: index === 0 ? "circle A" : "circle B",
    })),
    ...centerConnections,
    {
      type: "point",
      point: { x: -state.baseRadius / 2, y: 0 },
      role: "node",
    },
    {
      type: "point",
      point: { x: state.baseRadius / 2, y: 0 },
      role: "node",
    },
  ];
};

export const primitiveSymbols: ConstructibleSymbol[] = [
  {
    id: "void",
    label: "Void",
    category: "Origins / primitives",
    description: "The unmarked field before construction begins.",
    constructionBasis:
      "Represented as an empty origin with only the faintest center reference.",
    prerequisites: [],
    timelineIndex: 0,
    related: ["point", "circle"],
    drawIcon(ctx, bounds, state) {
      drawStepsIcon(this, ctx, bounds, state, 1.2);
    },
    drawMain(ctx, state) {
      drawConstructionSteps(ctx, this.getConstructionSteps(state), state);
    },
    getConstructionSteps: voidSteps,
  },
  {
    id: "point",
    label: "Point",
    category: "Origins / primitives",
    description: "The first marked position: a precise center in the field.",
    constructionBasis: "A single coordinate at the world origin.",
    prerequisites: ["void"],
    timelineIndex: 1,
    related: ["circle", "vesica-piscis"],
    drawIcon(ctx, bounds, state) {
      drawStepsIcon(this, ctx, bounds, state, 1.2);
    },
    drawMain(ctx, state) {
      drawConstructionSteps(ctx, this.getConstructionSteps(state), state);
    },
    getConstructionSteps: pointSteps,
  },
  {
    id: "circle",
    label: "Circle",
    category: "Circle constructions",
    description: "A single radius swept around one center.",
    constructionBasis:
      "One center point and one base radius define the first complete boundary.",
    prerequisites: ["point"],
    timelineIndex: 2,
    related: ["vesica-piscis", "tripod-of-life", "seed-of-life"],
    drawIcon(ctx, bounds, state) {
      drawStepsIcon(this, ctx, bounds, state, 2.8);
    },
    drawMain(ctx, state) {
      drawConstructionSteps(ctx, this.getConstructionSteps(state), state);
    },
    getConstructionSteps: circleSteps,
  },
  {
    id: "vesica-piscis",
    label: "Vesica Piscis",
    category: "Circle constructions",
    description:
      "Two equal-radius circles, each centered on the other circle's circumference.",
    constructionBasis:
      "Two centers are separated by exactly one base radius, producing the first relational lens.",
    prerequisites: ["circle"],
    timelineIndex: 3,
    related: ["tripod-of-life", "seed-of-life"],
    drawIcon(ctx, bounds, state) {
      drawStepsIcon(this, ctx, bounds, state, 3.2);
    },
    drawMain(ctx, state) {
      drawConstructionSteps(ctx, this.getConstructionSteps(state), state);
    },
    getConstructionSteps: vesicaSteps,
  },
];
