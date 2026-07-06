import * as THREE from "three";
import { generateHexLattice, generateHexRing, getTripodOfLifeCenters } from "../geometry/lattice";
import {
  createStarTetrahedronModules,
  generateTetrahedronMatrix64,
  validateTetrahedronMatrix64,
  type TetraMatrix,
} from "../geometry/spatial";
import type { Point } from "../geometry/vector";
import type { SymbolRenderState } from "../symbols/types";
import type { CanvasMetrics } from "./canvas";

export interface ThreeViewState {
  yaw: number;
  pitch: number;
  zoom: number;
  panX: number;
  panY: number;
}

interface Point3 {
  x: number;
  y: number;
  z: number;
}

type PlanarFlowerOverlayStep =
  | "flower"
  | "fruit"
  | "metatron"
  | "tetrahedron"
  | "cube"
  | "octahedron"
  | "dodecahedron"
  | "icosahedron"
  | "star-tetrahedron";

const tetraEdges: [number, number][] = [
  [0, 1],
  [0, 2],
  [0, 3],
  [1, 2],
  [1, 3],
  [2, 3],
];

export class ThreeScene {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(42, 1, 1, 5000);
  private readonly rootGroup = new THREE.Group();
  private readonly aetherFog = new THREE.FogExp2(0x020308, 0.00075);
  private currentBuildKey = "";

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    this.renderer.setClearColor(0x020308, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    const ambient = new THREE.AmbientLight(0x9fc7ff, 1.35);
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(260, 360, 520);
    const fill = new THREE.DirectionalLight(0x70e1ff, 0.82);
    fill.position.set(-340, -140, 260);

    this.scene.add(ambient, key, fill, this.rootGroup);
  }

  render(
    symbolId: string,
    state: SymbolRenderState,
    view: ThreeViewState,
    metrics: CanvasMetrics,
    planarFlowerStep: PlanarFlowerOverlayStep = "flower",
    jitterbugProgress = 0,
  ): void {
    this.renderer.setPixelRatio(metrics.dpr);
    this.renderer.setSize(metrics.width, metrics.height, false);
    this.camera.aspect = metrics.width / metrics.height;
    this.camera.fov = symbolId === "aether-3d" ? 58 : 42;
    this.camera.far = symbolId === "aether-3d" ? 9000 : 5000;
    this.scene.fog = symbolId === "aether-3d" ? this.aetherFog : null;

    if (symbolId === "aether-3d") {
      const x = view.panX * 1.15;
      const y = -view.panY * 1.15;
      this.camera.position.set(x, y, 420 / Math.max(0.38, view.zoom));
      this.camera.lookAt(x, y, -680);
    } else {
      this.camera.position.set(
        view.panX * 0.55,
        -view.panY * 0.55,
        920 / Math.max(0.42, view.zoom),
      );
      this.camera.lookAt(view.panX * 0.16, -view.panY * 0.16, 0);
    }
    this.camera.updateProjectionMatrix();

    const key = [
      symbolId,
      state.options.connectCenters,
      state.options.faceColor,
      state.options.lineColor,
      state.options.lineOpacity.toFixed(3),
      state.options.sphereColor,
      state.options.sphereScale.toFixed(3),
      state.options.sphereOpacity.toFixed(3),
      state.options.sphereGridOpacity.toFixed(3),
      state.options.showMatrixWireframe,
      state.options.showMatrixFaces,
      state.options.showMatrixNodes,
      state.options.showMatrixSpheres,
      state.options.showMatrixProjection,
      symbolId === "flower-3d" ? planarFlowerStep : "",
      symbolId === "vector-equilibrium-3d" ? jitterbugProgress.toFixed(3) : "",
    ].join(":");

    if (key !== this.currentBuildKey) {
      this.currentBuildKey = key;
      this.rebuild(symbolId, state, planarFlowerStep, jitterbugProgress);
    }

    this.rootGroup.rotation.x = view.pitch;
    this.rootGroup.rotation.y = view.yaw;
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.renderer.dispose();
  }

  private rebuild(
    symbolId: string,
    state: SymbolRenderState,
    planarFlowerStep: PlanarFlowerOverlayStep,
    jitterbugProgress: number,
  ): void {
    this.clearGroup();

    const radius = state.baseRadius;

    if (symbolId === "tetra-matrix-64-3d") {
      this.addTetrahedronMatrix64(radius, state);
      return;
    }

    if (symbolId === "aether-3d") {
      this.addAetherField(radius, state);
      return;
    }

    if (symbolId === "star-tetra-3d") {
      this.addStarTetrahedronModules(radius, state);
      return;
    }

    if (symbolId === "flower-3d") {
      this.addPlanarFlower(radius, state, planarFlowerStep);
      return;
    }

    if (symbolId === "vector-equilibrium-3d") {
      this.addVectorEquilibriumJitterbug(radius, state, jitterbugProgress);
      return;
    }

    const sphereRadius = radius * state.options.sphereScale;
    const centers = getCentersFor3dSymbol(symbolId, radius, planarFlowerStep);
    this.addSpheres(centers, sphereRadius, state);

    if (!state.options.connectCenters) {
      return;
    }

    const edges = getCenterEdgesFor3dSymbol(symbolId, centers, radius, planarFlowerStep);
    this.addCenterConnections(
      edges,
      Math.max(3, radius * 0.02),
      state.options.lineColor,
      0.97 * state.options.lineOpacity,
    );
  }

  private addSpheres(
    centers: Point3[],
    radius: number,
    state: SymbolRenderState,
  ): void {
    const sphereGeometry = new THREE.SphereGeometry(radius, 64, 32);
    const sphereMaterial = new THREE.MeshStandardMaterial({
      color: state.options.sphereColor,
      transparent: true,
      opacity: state.options.sphereOpacity,
      roughness: 0.26,
      metalness: 0.08,
      depthWrite: false,
      side: THREE.FrontSide,
    });
    const centerGeometry = new THREE.SphereGeometry(Math.max(3.4, radius * 0.032), 18, 12);
    const centerMaterial = new THREE.MeshStandardMaterial({
      color: state.options.lineColor,
      emissive: state.options.lineColor,
      emissiveIntensity: 0.45,
      roughness: 0.22,
      transparent: true,
      opacity: state.options.lineOpacity,
    });

    for (const center of centers) {
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      sphere.position.set(center.x, center.y, center.z);
      this.rootGroup.add(sphere);

      if (state.options.sphereGridOpacity > 0) {
        this.rootGroup.add(
          createSphereGrid(
            center,
            radius * 1.002,
            state.options.sphereColor,
            state.options.sphereGridOpacity,
          ),
        );
      }

      const node = new THREE.Mesh(centerGeometry, centerMaterial);
      node.position.copy(sphere.position);
      this.rootGroup.add(node);
    }
  }

  private addVectorEquilibriumJitterbug(
    baseRadius: number,
    state: SymbolRenderState,
    progress: number,
  ): void {
    const clampedProgress = Math.max(0, Math.min(1, progress));
    const centers = getVectorEquilibriumJitterbugCenters(baseRadius, clampedProgress);
    this.addSpheres(centers, baseRadius * state.options.sphereScale, state);

    if (!state.options.connectCenters) {
      return;
    }

    this.addCenterConnections(
      getVectorEquilibriumEdgeIndices().map(([from, to]) => [centers[from], centers[to]]),
      Math.max(2.8, baseRadius * 0.019),
      state.options.lineColor,
      0.95 * state.options.lineOpacity,
    );

    if (clampedProgress > 0.02) {
      this.addCenterConnections(
        getOctahedronDoubleCoverPairEdges(centers),
        Math.max(1.8, baseRadius * 0.012),
        state.options.sphereColor,
        0.42 * clampedProgress * state.options.lineOpacity,
      );
    }
  }

  private addCenterConnections(
    edges: [Point3, Point3][],
    radius: number,
    color: string,
    opacity: number,
  ): void {
    if (edges.length === 0) {
      return;
    }

    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthTest: false,
      depthWrite: false,
    });

    for (const [from, to] of edges) {
      this.rootGroup.add(createConnectionStrut(from, to, radius, material));
    }
  }

  private addPlanarFlower(
    baseRadius: number,
    state: SymbolRenderState,
    planarFlowerStep: PlanarFlowerOverlayStep,
  ): void {
    const centers =
      planarFlowerStep === "flower"
        ? generateHexLattice(baseRadius, 2).map(toPoint3)
        : getFruitCenters3d(baseRadius);
    this.addSpheres(centers, baseRadius * state.options.sphereScale, state);

    if (!state.options.connectCenters) {
      return;
    }

    if (
      planarFlowerStep === "flower" ||
      planarFlowerStep === "fruit" ||
      planarFlowerStep === "metatron"
    ) {
      this.addCenterConnections(
        getPlanarFlowerBaseEdges(baseRadius, planarFlowerStep),
        Math.max(2.2, baseRadius * 0.017),
        state.options.lineColor,
        0.92 * state.options.lineOpacity,
      );
      return;
    }

    this.addCenterConnections(
      getPlanarFlowerBaseEdges(baseRadius, "metatron"),
      Math.max(0.9, baseRadius * 0.007),
      state.options.sphereColor,
      0.18 * state.options.lineOpacity,
    );
    this.addCenterConnections(
      getPlanarFlowerHighlightEdges(baseRadius, planarFlowerStep),
      Math.max(3.4, baseRadius * 0.026),
      state.options.lineColor,
      0.98 * state.options.lineOpacity,
    );
  }

  private addAetherField(baseRadius: number, state: SymbolRenderState): void {
    const dimension = 16;
    const spacing = baseRadius * 0.72;
    const centers = getAetherCenters(dimension, spacing);
    const gridOpacity = state.options.sphereGridOpacity;
    const sphereRadius = spacing * 0.46 * state.options.sphereScale;
    const sphereGeometry = new THREE.SphereGeometry(sphereRadius, 22, 12);
    const sphereMaterial = new THREE.MeshStandardMaterial({
      color: state.options.sphereColor,
      transparent: true,
      opacity: Math.min(0.13, state.options.sphereOpacity * 0.62),
      roughness: 0.34,
      metalness: 0.02,
      depthWrite: false,
      side: THREE.FrontSide,
    });
    const spheres = new THREE.InstancedMesh(sphereGeometry, sphereMaterial, centers.length);
    const transform = new THREE.Object3D();

    centers.forEach((center, index) => {
      transform.position.set(center.x, center.y, center.z);
      transform.updateMatrix();
      spheres.setMatrixAt(index, transform.matrix);
    });
    spheres.instanceMatrix.needsUpdate = true;
    this.rootGroup.add(spheres);

    if (!state.options.connectCenters) {
      return;
    }

    this.rootGroup.add(
      createAetherConnections(
        dimension,
        spacing,
        state.options.lineColor,
        Math.min(0.92, (0.1 + gridOpacity * 0.74) * state.options.lineOpacity),
      ),
    );
    this.rootGroup.add(
      createAetherNodes(
        centers,
        Math.max(2, spacing * (0.026 + gridOpacity * 0.026)),
        state.options.lineColor,
        Math.min(0.95, (0.18 + gridOpacity * 0.64) * state.options.lineOpacity),
      ),
    );
  }

  private addStarTetrahedronModules(baseRadius: number, state: SymbolRenderState): void {
    const modules = createStarTetrahedronModules(baseRadius * 1.45);
    const sphereGeometry = new THREE.SphereGeometry(
      modules[0].sphereRadius * state.options.sphereScale,
      48,
      24,
    );
    const sphereMaterial = new THREE.MeshStandardMaterial({
      color: state.options.sphereColor,
      transparent: true,
      opacity: state.options.sphereOpacity,
      roughness: 0.3,
      metalness: 0.04,
      depthWrite: false,
      side: THREE.FrontSide,
    });

    for (const module of modules) {
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      sphere.position.set(module.sphereCenter.x, module.sphereCenter.y, module.sphereCenter.z);
      this.rootGroup.add(sphere);

      if (state.options.sphereGridOpacity > 0) {
        this.rootGroup.add(
          createSphereGrid(
            module.sphereCenter,
            module.sphereRadius * state.options.sphereScale * 1.002,
            state.options.sphereColor,
            state.options.sphereGridOpacity,
          ),
        );
      }
    }

    const vertices = getStarTetraVerticesByEdge(baseRadius);
    this.rootGroup.add(createMatrixNodes(vertices, baseRadius * 0.035, state.options.lineColor, state.options.lineOpacity));

    if (state.options.connectCenters) {
      this.addCenterConnections(
        getCenterEdgesFor3dSymbol("star-tetra-3d", vertices, baseRadius, "flower"),
        Math.max(3, baseRadius * 0.02),
        state.options.lineColor,
        0.97 * state.options.lineOpacity,
      );
    }
  }

  private addTetrahedronMatrix64(baseRadius: number, state: SymbolRenderState): void {
    const edgeLength = baseRadius * 0.58;
    const matrix = generateTetrahedronMatrix64(edgeLength);
    const validation = validateTetrahedronMatrix64(matrix, edgeLength);

    if (!validation.valid) {
      console.warn("Invalid 64 Tetrahedron Grid geometry", validation.errors);
    }

    if (state.options.showMatrixProjection) {
      this.rootGroup.add(
        createMatrixFlowerProjectionOverlay(
          matrix,
          state.options.sphereScale,
          state.options.sphereColor,
          state.options.lineOpacity,
        ),
      );
    }

    if (state.options.showMatrixSpheres) {
      this.addMatrixCircumspheres(matrix, state);
    }

    if (state.options.showMatrixFaces) {
      this.rootGroup.add(createMatrixFaces(matrix, state.options.faceColor));
    }

    if (state.options.showMatrixWireframe) {
      this.addMatrixConnections(
        matrix.edges.map(([from, to]) => [matrix.vertices[from], matrix.vertices[to]]),
        Math.max(1.3, edgeLength * 0.022),
        state.options.lineColor,
        0.86 * state.options.lineOpacity,
      );
      this.addMatrixConnections(
        getOuterMatrixEdges(matrix).map(([from, to]) => [matrix.vertices[from], matrix.vertices[to]]),
        Math.max(2.1, edgeLength * 0.034),
        state.options.lineColor,
        0.98 * state.options.lineOpacity,
      );
    }

    if (state.options.showMatrixNodes) {
      this.rootGroup.add(
        createMatrixNodes(
          matrix.vertices,
          edgeLength * 0.04,
          state.options.lineColor,
          state.options.lineOpacity,
        ),
      );
    }
  }

  private addMatrixConnections(
    edges: [Point3, Point3][],
    radius: number,
    color: string,
    opacity: number,
  ): void {
    if (edges.length === 0) {
      return;
    }

    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthTest: false,
      depthWrite: false,
    });

    for (const [from, to] of edges) {
      this.rootGroup.add(createConnectionStrut(from, to, radius, material));
    }
  }

  private addMatrixCircumspheres(matrix: TetraMatrix, state: SymbolRenderState): void {
    const circumspheres = getMatrixCircumspheres(matrix);

    if (circumspheres.length === 0) {
      return;
    }

    const baseRadius = circumspheres[0].radius * state.options.sphereScale;
    const sphereGeometry = new THREE.SphereGeometry(baseRadius, 48, 24);
    const sphereMaterial = new THREE.MeshStandardMaterial({
      color: state.options.sphereColor,
      transparent: true,
      opacity: Math.min(0.16, state.options.sphereOpacity),
      roughness: 0.3,
      metalness: 0.04,
      depthWrite: false,
      side: THREE.FrontSide,
    });

    for (const sphereData of circumspheres) {
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      sphere.position.set(sphereData.center.x, sphereData.center.y, sphereData.center.z);
      this.rootGroup.add(sphere);

      if (state.options.sphereGridOpacity > 0) {
        this.rootGroup.add(
          createSphereGrid(
            sphereData.center,
            sphereData.radius * state.options.sphereScale * 1.002,
            state.options.sphereColor,
            state.options.sphereGridOpacity,
          ),
        );
      }
    }
  }

  private clearGroup(): void {
    for (const child of this.rootGroup.children) {
      child.traverse((object) => {
        const mesh = object as THREE.Mesh;
        const geometry = mesh.geometry as THREE.BufferGeometry | undefined;
        const material = mesh.material as
          | THREE.Material
          | THREE.Material[]
          | undefined;

        geometry?.dispose();

        if (Array.isArray(material)) {
          material.forEach((item) => item.dispose());
        } else {
          material?.dispose();
        }
      });
    }

    this.rootGroup.clear();
  }
}

const getCentersFor3dSymbol = (
  symbolId: string,
  radius: number,
  planarFlowerStep: PlanarFlowerOverlayStep,
): Point3[] => {
  if (symbolId === "vesica-3d") {
    return [
      { x: -radius / 2, y: 0, z: 0 },
      { x: radius / 2, y: 0, z: 0 },
    ];
  }

  if (symbolId === "tripod-3d") {
    return getTripodOfLifeCenters(radius).map(toPoint3);
  }

  if (symbolId === "tetra-spheres") {
    return getTetraVerticesByEdge(radius);
  }

  if (symbolId === "star-tetra-3d") {
    return getStarTetraVerticesByEdge(radius);
  }

  if (symbolId === "vector-equilibrium-3d") {
    return getVectorEquilibriumCenters(radius);
  }

  if (symbolId === "flower-3d") {
    if (planarFlowerStep !== "flower") {
      return getFruitCenters3d(radius);
    }

    return generateHexLattice(radius, 2).map(toPoint3);
  }

  return [{ x: 0, y: 0, z: 0 }];
};

const getCenterEdgesFor3dSymbol = (
  symbolId: string,
  centers: Point3[],
  radius: number,
  planarFlowerStep: PlanarFlowerOverlayStep,
): [Point3, Point3][] => {
  if (symbolId === "vesica-3d") {
    return [[centers[0], centers[1]]];
  }

  if (symbolId === "tripod-3d") {
    return [
      [centers[0], centers[1]],
      [centers[1], centers[2]],
      [centers[2], centers[0]],
    ];
  }

  if (symbolId === "tetra-spheres") {
    return tetraEdges.map(([from, to]) => [centers[from], centers[to]]);
  }

  if (symbolId === "star-tetra-3d") {
    return [
      ...tetraEdges.map(([from, to]) => [centers[from], centers[to]] as [Point3, Point3]),
      ...tetraEdges.map(([from, to]) => [centers[from + 4], centers[to + 4]] as [Point3, Point3]),
    ];
  }

  if (symbolId === "vector-equilibrium-3d") {
    return getAdjacentEdges3d(centers, radius);
  }

  if (symbolId === "flower-3d") {
    return getPlanarFlowerBaseEdges(radius, planarFlowerStep);
  }

  return [];
};

const getTetraVerticesByEdge = (edgeLength: number): Point3[] => {
  const scale = edgeLength / (2 * Math.sqrt(2));
  return [
    { x: 1, y: 1, z: 1 },
    { x: 1, y: -1, z: -1 },
    { x: -1, y: 1, z: -1 },
    { x: -1, y: -1, z: 1 },
  ].map((point) => scalePoint(point, scale));
};

const getStarTetraVerticesByEdge = (edgeLength: number): Point3[] => {
  const scale = edgeLength / (2 * Math.sqrt(2));
  return [
    { x: 1, y: 1, z: 1 },
    { x: 1, y: -1, z: -1 },
    { x: -1, y: 1, z: -1 },
    { x: -1, y: -1, z: 1 },
    { x: -1, y: -1, z: -1 },
    { x: -1, y: 1, z: 1 },
    { x: 1, y: -1, z: 1 },
    { x: 1, y: 1, z: -1 },
  ].map((point) => scalePoint(point, scale));
};

const getVectorEquilibriumCenters = (edgeLength: number): Point3[] => {
  const coordinate = edgeLength / Math.sqrt(2);
  const signs = [-1, 1];
  const centers: Point3[] = [];

  for (const sx of signs) {
    for (const sy of signs) {
      centers.push({ x: sx * coordinate, y: sy * coordinate, z: 0 });
      centers.push({ x: sx * coordinate, y: 0, z: sy * coordinate });
      centers.push({ x: 0, y: sx * coordinate, z: sy * coordinate });
    }
  }

  return centers;
};

const getVectorEquilibriumJitterbugCenters = (
  edgeLength: number,
  progress: number,
): Point3[] => {
  const initial = getVectorEquilibriumCenters(edgeLength);
  const targets = getVectorEquilibriumOctaTargets(edgeLength);
  const easedProgress = easeInOut(progress);

  return initial.map((point, index) =>
    spiralToward(point, targets[index], easedProgress, index % 2 === 0 ? 1 : -1),
  );
};

const getVectorEquilibriumOctaTargets = (edgeLength: number): Point3[] => {
  const targetRadius = edgeLength * 0.62;
  const targetByKey: Record<string, Point3> = {
    px: { x: targetRadius, y: 0, z: 0 },
    nx: { x: -targetRadius, y: 0, z: 0 },
    py: { x: 0, y: targetRadius, z: 0 },
    ny: { x: 0, y: -targetRadius, z: 0 },
    pz: { x: 0, y: 0, z: targetRadius },
    nz: { x: 0, y: 0, z: -targetRadius },
  };

  return getVectorEquilibriumCenters(edgeLength).map((point) => {
    const key = getVectorEquilibriumTargetKey(point);
    return targetByKey[key];
  });
};

const getVectorEquilibriumTargetKey = (point: Point3): "px" | "nx" | "py" | "ny" | "pz" | "nz" => {
  if (point.z === 0) {
    if (point.x > 0 && point.y > 0) {
      return "px";
    }
    if (point.x > 0 && point.y < 0) {
      return "ny";
    }
    if (point.x < 0 && point.y > 0) {
      return "py";
    }
    return "nx";
  }

  if (point.y === 0) {
    if (point.x > 0 && point.z > 0) {
      return "px";
    }
    if (point.x > 0 && point.z < 0) {
      return "nz";
    }
    if (point.x < 0 && point.z > 0) {
      return "pz";
    }
    return "nx";
  }

  if (point.y > 0 && point.z > 0) {
    return "py";
  }
  if (point.y > 0 && point.z < 0) {
    return "nz";
  }
  if (point.y < 0 && point.z > 0) {
    return "pz";
  }
  return "ny";
};

const getVectorEquilibriumEdgeIndices = (): [number, number][] => {
  const centers = getVectorEquilibriumCenters(1);
  const edges: [number, number][] = [];

  for (let i = 0; i < centers.length; i += 1) {
    for (let j = i + 1; j < centers.length; j += 1) {
      if (Math.abs(distance3(centers[i], centers[j]) - 1) < 0.08) {
        edges.push([i, j]);
      }
    }
  }

  return edges;
};

const getOctahedronDoubleCoverPairEdges = (centers: Point3[]): [Point3, Point3][] => {
  return getOctahedronDoubleCoverPairIndices().map(([from, to]) => [centers[from], centers[to]]);
};

const getOctahedronDoubleCoverPairIndices = (): [number, number][] => {
  const buckets = new Map<string, number[]>();

  getVectorEquilibriumCenters(1).forEach((point, index) => {
    const key = getVectorEquilibriumTargetKey(point);
    buckets.set(key, [...(buckets.get(key) ?? []), index]);
  });

  return [...buckets.values()]
    .filter((bucket) => bucket.length === 2)
    .map((bucket) => [bucket[0], bucket[1]]);
};

const getAetherCenters = (dimension: number, spacing: number): Point3[] => {
  const centers: Point3[] = [];
  const offset = ((dimension - 1) * spacing) / 2;

  for (let x = 0; x < dimension; x += 1) {
    for (let y = 0; y < dimension; y += 1) {
      for (let z = 0; z < dimension; z += 1) {
        centers.push({
          x: x * spacing - offset,
          y: y * spacing - offset,
          z: z * spacing - offset,
        });
      }
    }
  }

  return centers;
};

const getAetherPoint = (
  x: number,
  y: number,
  z: number,
  dimension: number,
  spacing: number,
): Point3 => {
  const offset = ((dimension - 1) * spacing) / 2;

  return {
    x: x * spacing - offset,
    y: y * spacing - offset,
    z: z * spacing - offset,
  };
};

const getAdjacentEdges3d = (
  centers: Point3[],
  spacing: number,
): [Point3, Point3][] => {
  const edges: [Point3, Point3][] = [];

  for (let i = 0; i < centers.length; i += 1) {
    for (let j = i + 1; j < centers.length; j += 1) {
      const distance = distance3(centers[i], centers[j]);
      if (Math.abs(distance - spacing) < spacing * 0.08) {
        edges.push([centers[i], centers[j]]);
      }
    }
  }

  return edges;
};

const getFruitCenters3d = (radius: number): Point3[] => [
  { x: 0, y: 0, z: 0 },
  ...generateHexRing(radius, 2).map(toPoint3),
];

const getCompleteEdges3d = (centers: Point3[]): [Point3, Point3][] => {
  const edges: [Point3, Point3][] = [];

  for (let i = 0; i < centers.length; i += 1) {
    for (let j = i + 1; j < centers.length; j += 1) {
      edges.push([centers[i], centers[j]]);
    }
  }

  return edges;
};

const getProjectedOctahedronEdges3d = (ring: Point3[]): [Point3, Point3][] => {
  const vertices = ring.filter((_, index) => index % 2 === 0);
  const edges: [Point3, Point3][] = [];

  for (let i = 0; i < vertices.length; i += 1) {
    for (let j = i + 1; j < vertices.length; j += 1) {
      const separation = (j - i + vertices.length) % vertices.length;
      const isOppositePair = separation === vertices.length / 2;

      if (!isOppositePair) {
        edges.push([vertices[i], vertices[j]]);
      }
    }
  }

  return edges;
};

const getPlanarFlowerBaseEdges = (
  radius: number,
  step: PlanarFlowerOverlayStep,
): [Point3, Point3][] => {
  if (step === "flower") {
    return getAdjacentEdges3d(generateHexLattice(radius, 2).map(toPoint3), radius);
  }

  const centers = getFruitCenters3d(radius);
  const ring = centers.slice(1);

  if (step === "fruit") {
    return getAdjacentEdges3d(centers, radius * 2);
  }

  if (step === "metatron") {
    return getCompleteEdges3d(centers);
  }

  return [];
};

const getPlanarFlowerHighlightEdges = (
  radius: number,
  step: PlanarFlowerOverlayStep,
): [Point3, Point3][] => {
  const centers = getFruitCenters3d(radius);
  const center = centers[0];
  const ring = centers.slice(1);
  const triangleA = [ring[0], ring[4], ring[8]];
  const triangleB = [ring[2], ring[6], ring[10]];
  const cubeVertices = [ring[0], ring[2], ring[4], ring[6], ring[8], ring[10]];
  const edgesByStep: Record<PlanarFlowerOverlayStep, [Point3, Point3][]> = {
    flower: [],
    fruit: [],
    metatron: [],
    tetrahedron: [
      ...getLoopEdges3d(triangleA),
      ...triangleA.map((point) => [center, point] as [Point3, Point3]),
    ],
    cube: [
      ...getLoopEdges3d(cubeVertices),
      [cubeVertices[0], cubeVertices[3]],
      [cubeVertices[1], cubeVertices[4]],
      [cubeVertices[2], cubeVertices[5]],
    ],
    octahedron: getProjectedOctahedronEdges3d(ring),
    dodecahedron: [],
    icosahedron: [],
    "star-tetrahedron": [
      ...getLoopEdges3d(triangleA),
      ...getLoopEdges3d(triangleB),
      ...triangleA.map((point) => [center, point] as [Point3, Point3]),
      ...triangleB.map((point) => [center, point] as [Point3, Point3]),
    ],
  };

  return edgesByStep[step];
};

const getLoopEdges3d = (vertices: Point3[]): [Point3, Point3][] =>
  vertices.map((point, index) => [point, vertices[(index + 1) % vertices.length]]);

const createConnectionStrut = (
  from: Point3,
  to: Point3,
  radius: number,
  material: THREE.Material,
): THREE.Mesh => {
  const start = new THREE.Vector3(from.x, from.y, from.z);
  const end = new THREE.Vector3(to.x, to.y, to.z);
  const midpoint = start.clone().add(end).multiplyScalar(0.5);
  const direction = end.clone().sub(start);
  const length = direction.length();
  const geometry = new THREE.CylinderGeometry(radius, radius, length, 14);
  const mesh = new THREE.Mesh(geometry, material);

  mesh.position.copy(midpoint);
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.normalize(),
  );
  mesh.renderOrder = 10;

  return mesh;
};

const createSphereGrid = (
  center: Point3,
  radius: number,
  color: string,
  opacity: number,
): THREE.Group => {
  const group = new THREE.Group();
  group.position.set(center.x, center.y, center.z);

  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    depthTest: false,
  });

  for (let index = 0; index < 8; index += 1) {
    const meridian = createGreatCircle(radius, material);
    meridian.rotation.y = (Math.PI / 8) * index;
    group.add(meridian);
  }

  return group;
};

const createAetherConnections = (
  dimension: number,
  spacing: number,
  color: string,
  opacity: number,
): THREE.LineSegments => {
  const positions: number[] = [];
  const directions: [number, number, number][] = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];

  for (let x = 0; x < dimension; x += 1) {
    for (let y = 0; y < dimension; y += 1) {
      for (let z = 0; z < dimension; z += 1) {
        const from = getAetherPoint(x, y, z, dimension, spacing);

        for (const [dx, dy, dz] of directions) {
          const nextX = x + dx;
          const nextY = y + dy;
          const nextZ = z + dz;

          if (nextX >= dimension || nextY >= dimension || nextZ >= dimension) {
            continue;
          }

          const to = getAetherPoint(nextX, nextY, nextZ, dimension, spacing);
          positions.push(from.x, from.y, from.z, to.x, to.y, to.z);
        }
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    depthTest: false,
  });

  return new THREE.LineSegments(geometry, material);
};

const createAetherNodes = (
  centers: Point3[],
  radius: number,
  color: string,
  opacity: number,
): THREE.InstancedMesh => {
  const geometry = new THREE.SphereGeometry(radius, 10, 6);
  const material = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.28,
    roughness: 0.28,
    transparent: true,
    opacity,
    depthWrite: false,
  });
  const nodes = new THREE.InstancedMesh(geometry, material, centers.length);
  const transform = new THREE.Object3D();

  centers.forEach((center, index) => {
    transform.position.set(center.x, center.y, center.z);
    transform.updateMatrix();
    nodes.setMatrixAt(index, transform.matrix);
  });
  nodes.instanceMatrix.needsUpdate = true;

  return nodes;
};

const createMatrixFaces = (
  matrix: TetraMatrix,
  color: string,
): THREE.Group => {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color,
    transparent: true,
    opacity: 0.12,
    roughness: 0.34,
    metalness: 0.04,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  for (const cell of matrix.cells) {
    const [a, b, c, d] = cell.vertices;
    const faces: [number, number, number][] = [
      [a, b, c],
      [a, d, b],
      [a, c, d],
      [b, d, c],
    ];

    for (const face of faces) {
      const geometry = new THREE.BufferGeometry().setFromPoints(
        face.map((index) => toVector3(matrix.vertices[index])),
      );
      geometry.setIndex([0, 1, 2]);
      geometry.computeVertexNormals();
      group.add(new THREE.Mesh(geometry, material));
    }
  }

  return group;
};

const createMatrixNodes = (
  vertices: Point3[],
  radius: number,
  color: string,
  opacity: number,
): THREE.Group => {
  const group = new THREE.Group();
  const geometry = new THREE.SphereGeometry(radius, 16, 10);
  const material = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.46,
    roughness: 0.24,
    transparent: true,
    opacity,
  });

  for (const vertex of vertices) {
    const node = new THREE.Mesh(geometry, material);
    node.position.set(vertex.x, vertex.y, vertex.z);
    group.add(node);
  }

  return group;
};

const getMatrixCircumspheres = (
  matrix: TetraMatrix,
): { center: Point3; radius: number }[] =>
  matrix.cells.map((cell) => {
    const vertices = cell.vertices.map((index) => matrix.vertices[index]);
    const center = vertices.reduce(
      (sum, vertex) => ({
        x: sum.x + vertex.x / vertices.length,
        y: sum.y + vertex.y / vertices.length,
        z: sum.z + vertex.z / vertices.length,
      }),
      { x: 0, y: 0, z: 0 },
    );

    return {
      center,
      radius: distance3(center, vertices[0]),
    };
  });

const createMatrixFlowerProjectionOverlay = (
  matrix: TetraMatrix,
  sphereScale: number,
  color: string,
  lineOpacity: number,
): THREE.Group => {
  const maxZ = matrix.vertices.reduce((max, vertex) => Math.max(max, Math.abs(vertex.z)), 1);
  const maxPlanarRadius = matrix.vertices.reduce(
    (max, vertex) => Math.max(max, Math.hypot(vertex.x, vertex.y)),
    1,
  );
  const projectionZ = -maxZ * 1.86;
  const flowerRadius = (maxPlanarRadius / 3) * sphereScale;
  const latticeRotation = Math.PI / 6;
  const group = new THREE.Group();
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.44 * lineOpacity,
    depthTest: false,
    depthWrite: false,
  });

  for (const center of generateHexLattice(flowerRadius, 2)) {
    const projectedCenter = rotatePoint2(center, latticeRotation);
    const points = createCirclePoints(flowerRadius, 160).map(
      (point) => new THREE.Vector3(projectedCenter.x + point.x, projectedCenter.y + point.y, projectionZ),
    );
    const circle = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points), material);
    circle.renderOrder = 4;
    group.add(circle);
  }

  return group;
};

const rotatePoint2 = (point: Point, angle: number): Point => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
  };
};

const getOuterMatrixEdges = (matrix: TetraMatrix): [number, number][] => {
  const maxRadius = matrix.vertices.reduce(
    (max, vertex) => Math.max(max, Math.hypot(vertex.x, vertex.y, vertex.z)),
    0,
  );
  const threshold = maxRadius * 0.72;

  return matrix.edges.filter(([from, to]) => {
    const a = matrix.vertices[from];
    const b = matrix.vertices[to];
    return Math.hypot(a.x, a.y, a.z) >= threshold && Math.hypot(b.x, b.y, b.z) >= threshold;
  });
};

const createGreatCircle = (
  radius: number,
  material: THREE.Material,
): THREE.LineLoop => {
  const points = createCirclePoints(radius, 128).map((point) =>
    new THREE.Vector3(point.x, point.y, 0),
  );
  const line = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points), material);
  line.rotation.x = Math.PI / 2;

  return line;
};

const createCirclePoints = (radius: number, segments: number): THREE.Vector2[] => {
  const points: THREE.Vector2[] = [];

  for (let index = 0; index < segments; index += 1) {
    const angle = (Math.PI * 2 * index) / segments;
    points.push(new THREE.Vector2(Math.cos(angle) * radius, Math.sin(angle) * radius));
  }

  return points;
};

const toPoint3 = (point: Point): Point3 => ({ x: point.x, y: point.y, z: 0 });

const toVector3 = (point: Point3): THREE.Vector3 =>
  new THREE.Vector3(point.x, point.y, point.z);

const scalePoint = (point: Point3, scale: number): Point3 => ({
  x: point.x * scale,
  y: point.y * scale,
  z: point.z * scale,
});

const addPoint = (a: Point3, b: Point3): Point3 => ({
  x: a.x + b.x,
  y: a.y + b.y,
  z: a.z + b.z,
});

const subtractPoint = (a: Point3, b: Point3): Point3 => ({
  x: a.x - b.x,
  y: a.y - b.y,
  z: a.z - b.z,
});

const dotPoint = (a: Point3, b: Point3): number =>
  a.x * b.x + a.y * b.y + a.z * b.z;

const crossPoint = (a: Point3, b: Point3): Point3 => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});

const normalizePoint = (point: Point3): Point3 => {
  const length = Math.hypot(point.x, point.y, point.z);

  if (length === 0) {
    return { x: 0, y: 0, z: 1 };
  }

  return scalePoint(point, 1 / length);
};

const rotateAroundAxis = (point: Point3, axis: Point3, angle: number): Point3 => {
  const normalizedAxis = normalizePoint(axis);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const axial = scalePoint(normalizedAxis, dotPoint(normalizedAxis, point) * (1 - cos));

  return addPoint(
    addPoint(scalePoint(point, cos), scalePoint(crossPoint(normalizedAxis, point), sin)),
    axial,
  );
};

const spiralToward = (
  from: Point3,
  to: Point3,
  progress: number,
  direction: 1 | -1,
): Point3 => {
  const axis = normalizePoint(to);
  const fromAxial = scalePoint(axis, dotPoint(from, axis));
  const fromRadial = subtractPoint(from, fromAxial);
  const angle = direction * progress * Math.PI * 0.86;
  const axial = addPoint(scalePoint(fromAxial, 1 - progress), scalePoint(to, progress));
  const radial = scalePoint(rotateAroundAxis(fromRadial, axis, angle), 1 - progress);

  return addPoint(axial, radial);
};

const easeInOut = (value: number): number =>
  value * value * (3 - 2 * value);

const distance3 = (a: Point3, b: Point3): number =>
  Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
