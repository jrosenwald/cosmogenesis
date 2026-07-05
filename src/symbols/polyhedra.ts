import {
  createStarTetrahedronGeometry,
  createTetrahedronGeometry,
} from "../geometry/spatial";
import {
  getDefaultProjectionAngles,
  projectPoint3,
  rotatePoint3,
} from "../render/projection3d";
import { drawPreviewSteps, type ConstructionStep } from "../render/drawing";
import type { ConstructibleSymbol, SymbolRenderState } from "./types";

const projectedEdges = (
  geometry: ReturnType<typeof createTetrahedronGeometry>,
): ConstructionStep[] => {
  const angles = getDefaultProjectionAngles();
  const projected = geometry.vertices.map((vertex) =>
    projectPoint3(rotatePoint3(vertex, angles), 720),
  );

  return geometry.edges.map(([start, end]) => ({
    type: "line" as const,
    from: projected[start],
    to: projected[end],
    role: "active" as const,
  }));
};

const tetraSteps = (state: SymbolRenderState): ConstructionStep[] =>
  projectedEdges(createTetrahedronGeometry(state.baseRadius * 0.74));

const starSteps = (state: SymbolRenderState): ConstructionStep[] =>
  projectedEdges(createStarTetrahedronGeometry(state.baseRadius * 0.78));

const drawIconSteps = (
  ctx: CanvasRenderingContext2D,
  bounds: { x: number; y: number; width: number; height: number },
  steps: ConstructionStep[],
  extent = 150,
): void => {
  drawPreviewSteps(ctx, steps, bounds, extent);
};

export const polyhedronSymbols: ConstructibleSymbol[] = [
  {
    id: "tetrahedron",
    label: "Tetrahedron",
    category: "Platonic solids",
    description:
      "A regular tetrahedron: four vertices, six equal edges, and four triangular faces.",
    constructionBasis:
      "Generated from four alternate cube corners, normalized onto one circumsphere.",
    prerequisites: ["seed-of-life"],
    timelineIndex: 8,
    geometryModes: ["spheres"],
    related: ["tetrahedron-sphere", "star-tetrahedron"],
    drawIcon(ctx, bounds, state) {
      drawIconSteps(ctx, bounds, tetraSteps({ ...state, baseRadius: 70 }));
    },
    drawMain() {},
    getConstructionSteps: tetraSteps,
  },
  {
    id: "tetrahedron-sphere",
    label: "Tetra + Sphere",
    category: "Platonic solids",
    description:
      "The tetrahedron with its circumsphere: all four vertices lie on the same spherical envelope.",
    constructionBasis:
      "Uses the regular tetrahedron vertices as radius points on a shared sphere.",
    prerequisites: ["tetrahedron"],
    timelineIndex: 9,
    geometryModes: ["spheres"],
    related: ["tetrahedron", "star-tetrahedron"],
    drawIcon(ctx, bounds, state) {
      drawIconSteps(ctx, bounds, tetraSteps({ ...state, baseRadius: 70 }));
    },
    drawMain() {},
    getConstructionSteps: tetraSteps,
  },
  {
    id: "star-tetrahedron",
    label: "Star Tetrahedron",
    category: "Platonic solids",
    description:
      "A modular star built from eight regular tetrahedra around a central octahedral core.",
    constructionBasis:
      "Each octahedron face receives one outward regular tetrahedron; each tetrahedral module has its own circumsphere.",
    prerequisites: ["tetrahedron-sphere"],
    timelineIndex: 10,
    geometryModes: ["spheres"],
    related: ["tetrahedron", "tetrahedron-sphere", "tetrahedron-matrix-64"],
    drawIcon(ctx, bounds, state) {
      drawIconSteps(ctx, bounds, starSteps({ ...state, baseRadius: 70 }), 168);
    },
    drawMain() {},
    getConstructionSteps: starSteps,
  },
];
