import type { Bounds } from "../geometry/vector";
import type { Camera } from "../render/canvas";
import type { ConstructionStep } from "../render/drawing";

export type SymbolCategory =
  | "Origins / primitives"
  | "Circle constructions"
  | "Life patterns"
  | "Lattice patterns"
  | "Metatron / line systems"
  | "Platonic solids"
  | "Optional symbolic overlays";

export type GeometryMode = "circles" | "spheres";

export interface RenderOptions {
  geometryMode: GeometryMode;
  faceColor: string;
  lineColor: string;
  lineOpacity: number;
  sphereColor: string;
  sphereScale: number;
  sphereOpacity: number;
  sphereGridOpacity: number;
  showMatrixWireframe: boolean;
  showMatrixFaces: boolean;
  showMatrixNodes: boolean;
  showMatrixSpheres: boolean;
  showMatrixProjection: boolean;
  showLabels: boolean;
  showConstructionCircles: boolean;
  showLatticePoints: boolean;
  connectCenters: boolean;
  animation: boolean;
  autoRotate3d: boolean;
}

export interface SymbolRenderState {
  baseRadius: number;
  time: number;
  progress: number;
  mode: "construct" | "inspect";
  camera: Camera;
  options: RenderOptions;
}

export interface ConstructibleSymbol {
  id: string;
  label: string;
  category: SymbolCategory;
  description: string;
  constructionBasis: string;
  prerequisites: string[];
  timelineIndex?: number;
  geometryModes?: GeometryMode[];
  related: string[];
  drawIcon: (
    ctx: CanvasRenderingContext2D,
    bounds: Bounds,
    state: SymbolRenderState,
  ) => void;
  drawMain: (ctx: CanvasRenderingContext2D, state: SymbolRenderState) => void;
  getConstructionSteps: (state: SymbolRenderState) => ConstructionStep[];
}
