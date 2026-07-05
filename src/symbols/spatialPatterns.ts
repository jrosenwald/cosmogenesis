import {
  generateTetrahedronMatrix64,
  getSphereFlowerCenters,
} from "../geometry/spatial";
import {
  getDefaultProjectionAngles,
  projectPoint3,
  rotatePoint3,
} from "../render/projection3d";
import {
  drawConstructionSteps,
  drawPreviewSteps,
  type ConstructionStep,
} from "../render/drawing";
import type { ConstructibleSymbol, SymbolRenderState } from "./types";

const drawProjectedSphereFlower = (
  ctx: CanvasRenderingContext2D,
  state: SymbolRenderState,
): void => {
  const angles = getDefaultProjectionAngles();
  const centers = getSphereFlowerCenters(state.baseRadius * 0.78)
    .map((center) => rotatePoint3(center, angles))
    .sort((a, b) => a.z - b.z);

  for (const center of centers) {
    const projected = projectPoint3(center);
    const alpha = 0.2 + ((center.z + state.baseRadius) / (state.baseRadius * 3.4)) * 0.35;

    ctx.save();
    ctx.globalAlpha = Math.max(0.14, Math.min(0.6, alpha));
    ctx.strokeStyle = "rgba(112, 225, 255, 0.62)";
    ctx.lineWidth = Math.max(0.65, 1 / state.camera.scale);
    ctx.beginPath();
    ctx.arc(
      projected.x,
      projected.y,
      state.baseRadius * 0.52 * projected.scale,
      0,
      Math.PI * 2,
    );
    ctx.stroke();
    ctx.restore();
  }
};

const drawProjectedTetraMatrix = (
  ctx: CanvasRenderingContext2D,
  state: SymbolRenderState,
): void => {
  const matrix = generateTetrahedronMatrix64(state.baseRadius * 0.34);
  const angles = getDefaultProjectionAngles();
  const projected = matrix.vertices.map((vertex) =>
    projectPoint3(rotatePoint3(vertex, angles), 780),
  );

  ctx.save();
  ctx.strokeStyle = "rgba(244, 204, 112, 0.72)";
  ctx.lineWidth = Math.max(0.65, 0.95 / state.camera.scale);

  for (const [start, end] of matrix.edges) {
    const a = projected[start];
    const b = projected[end];
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  if (state.options.showLatticePoints) {
    ctx.fillStyle = "rgba(112, 225, 255, 0.8)";
    for (const point of projected) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, Math.max(1.6, 2.4 / state.camera.scale), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
};

const flowerSteps = (state: SymbolRenderState): ConstructionStep[] =>
  getSphereFlowerCenters(state.baseRadius * 0.78).map((center, index) => ({
    type: "point" as const,
    point: { x: center.x, y: center.y },
    role: index % 3 === 0 ? ("node" as const) : ("lattice" as const),
  }));

const tetraSteps = (state: SymbolRenderState): ConstructionStep[] => {
  const matrix = generateTetrahedronMatrix64(state.baseRadius * 0.34);
  const angles = getDefaultProjectionAngles();
  const projected = matrix.vertices.map((vertex) =>
    projectPoint3(rotatePoint3(vertex, angles), 780),
  );

  return matrix.edges.map(([start, end]) => ({
    type: "line" as const,
    from: projected[start],
    to: projected[end],
    role: "active" as const,
  }));
};

export const spatialPatternSymbols: ConstructibleSymbol[] = [
  {
    id: "sphere-flower-of-life",
    label: "Sphere Flower",
    category: "Lattice patterns",
    description:
      "A sphere-based Flower of Life study using one central hexagonal layer.",
    constructionBasis:
      "Generated from a single ring-two hexagonal lattice layer; use 3D mode to inspect the sphere intersections.",
    prerequisites: ["seed-of-life"],
    timelineIndex: 6,
    geometryModes: ["spheres"],
    related: ["seed-of-life", "tetrahedron-matrix-64"],
    drawIcon(ctx, bounds, state) {
      drawPreviewSteps(
        ctx,
        flowerSteps({ ...state, baseRadius: 36 }),
        bounds,
        190,
      );
    },
    drawMain(ctx, state) {
      drawProjectedSphereFlower(ctx, state);
      drawConstructionSteps(ctx, this.getConstructionSteps(state), {
        ...state,
        options: { ...state.options, showLatticePoints: true },
      });
    },
    getConstructionSteps: flowerSteps,
  },
  {
    id: "tetrahedron-matrix-64",
    label: "64 Tetra Matrix",
    category: "Metatron / line systems",
    description:
      "A procedural 64-cell tetrahedral matrix study: a compact 3D armature related to sphere-packing and Flower-of-Life visual language.",
    constructionBasis:
      "Built explicitly as a 4x4x4 alternating lattice of regular tetrahedra; this is an honest constructible study, not a screenshot or fixed model.",
    prerequisites: ["sphere-flower-of-life"],
    timelineIndex: 11,
    geometryModes: ["spheres"],
    related: ["star-tetrahedron", "sphere-flower-of-life", "seed-of-life"],
    drawIcon(ctx, bounds, state) {
      drawPreviewSteps(
        ctx,
        tetraSteps({ ...state, baseRadius: 36 }),
        bounds,
        150,
      );
    },
    drawMain(ctx, state) {
      drawProjectedTetraMatrix(ctx, state);
    },
    getConstructionSteps: tetraSteps,
  },
];
