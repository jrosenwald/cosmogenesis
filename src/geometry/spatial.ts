import { generateHexLattice, getSeedOfLifeCenters, getTripodOfLifeCenters } from "./lattice";
import type { Point } from "./vector";

export interface Point3 {
  x: number;
  y: number;
  z: number;
}

export interface TetraCell {
  vertices: [number, number, number, number];
}

export interface TetraMatrix {
  vertices: Point3[];
  cells: TetraCell[];
  edges: [number, number][];
}

export interface TetraMatrixValidation {
  valid: boolean;
  errors: string[];
}

export interface PolyhedronGeometry {
  vertices: Point3[];
  faces: [number, number, number][];
  edges: [number, number][];
  circumsphereRadius: number;
}

export interface TetraModule {
  vertices: [Point3, Point3, Point3, Point3];
  sphereCenter: Point3;
  sphereRadius: number;
}

const SQRT_3 = Math.sqrt(3);

const toPoint3 = (point: Point, z = 0): Point3 => ({
  x: point.x,
  y: point.y,
  z,
});

export const getSphereCentersForSymbol = (
  symbolId: string,
  spacing: number,
): Point3[] => {
  if (symbolId === "void") {
    return [];
  }

  if (symbolId === "point") {
    return [{ x: 0, y: 0, z: 0 }];
  }

  if (symbolId === "circle") {
    return [{ x: 0, y: 0, z: 0 }];
  }

  if (symbolId === "vesica-piscis") {
    return [
      { x: -spacing / 2, y: 0, z: 0 },
      { x: spacing / 2, y: 0, z: 0 },
    ];
  }

  if (symbolId === "tripod-of-life") {
    return getTripodOfLifeCenters(spacing).map((center) => toPoint3(center));
  }

  if (symbolId === "seed-of-life") {
    return getSeedOfLifeCenters(spacing).map((center) => toPoint3(center));
  }

  if (symbolId === "sphere-flower-of-life") {
    return getSphereFlowerCenters(spacing);
  }

  return [{ x: 0, y: 0, z: 0 }];
};

export const getSphereFlowerCenters = (spacing: number): Point3[] => {
  return generateHexLattice(spacing, 2).map((center) => toPoint3(center, 0));
};

export const getCenterConnectionSegmentsForSymbol = (
  symbolId: string,
  spacing: number,
): [Point3, Point3][] => {
  if (symbolId === "vesica-piscis") {
    const centers = getSphereCentersForSymbol(symbolId, spacing);

    return [[centers[0], centers[1]]];
  }

  if (symbolId === "tripod-of-life") {
    const centers = getSphereCentersForSymbol(symbolId, spacing);

    return [
      [centers[0], centers[1]],
      [centers[1], centers[2]],
      [centers[2], centers[0]],
    ];
  }

  if (symbolId === "seed-of-life") {
    const centers = getSphereCentersForSymbol(symbolId, spacing);
    const center = centers[0];
    const ring = centers.slice(1);
    const spokes = ring.map((point) => [center, point] as [Point3, Point3]);
    const perimeter = ring.map(
      (point, index) => [point, ring[(index + 1) % ring.length]] as [Point3, Point3],
    );

    return [...spokes, ...perimeter];
  }

  return [];
};

export const createTetrahedronGeometry = (radius: number): PolyhedronGeometry => {
  const vertices = normalizePointCloudToRadius(
    [
      { x: 1, y: 1, z: 1 },
      { x: 1, y: -1, z: -1 },
      { x: -1, y: 1, z: -1 },
      { x: -1, y: -1, z: 1 },
    ],
    radius,
  );
  const faces: [number, number, number][] = [
    [0, 1, 2],
    [0, 3, 1],
    [0, 2, 3],
    [1, 3, 2],
  ];

  return {
    vertices,
    faces,
    edges: getEdgesFromFaces(faces),
    circumsphereRadius: radius,
  };
};

export const createStarTetrahedronGeometry = (
  radius: number,
): PolyhedronGeometry => {
  const vertices = normalizePointCloudToRadius(
    [
      { x: 1, y: 1, z: 1 },
      { x: 1, y: -1, z: -1 },
      { x: -1, y: 1, z: -1 },
      { x: -1, y: -1, z: 1 },
      { x: -1, y: -1, z: -1 },
      { x: -1, y: 1, z: 1 },
      { x: 1, y: -1, z: 1 },
      { x: 1, y: 1, z: -1 },
    ],
    radius,
  );
  const faces: [number, number, number][] = [
    [0, 1, 2],
    [0, 3, 1],
    [0, 2, 3],
    [1, 3, 2],
    [4, 6, 5],
    [4, 7, 6],
    [4, 5, 7],
    [5, 6, 7],
  ];

  return {
    vertices,
    faces,
    edges: getEdgesFromFaces(faces),
    circumsphereRadius: radius,
  };
};

export const createStarTetrahedronModules = (
  radius: number,
): TetraModule[] => {
  const octaRadius = radius / SQRT_3;
  const moduleSphereRadius = radius / 2;
  const signs = [-1, 1];
  const modules: TetraModule[] = [];

  for (const sx of signs) {
    for (const sy of signs) {
      for (const sz of signs) {
        const apex: Point3 = {
          x: sx * octaRadius,
          y: sy * octaRadius,
          z: sz * octaRadius,
        };
        const baseX: Point3 = { x: sx * octaRadius, y: 0, z: 0 };
        const baseY: Point3 = { x: 0, y: sy * octaRadius, z: 0 };
        const baseZ: Point3 = { x: 0, y: 0, z: sz * octaRadius };

        modules.push({
          vertices: [apex, baseX, baseY, baseZ],
          sphereCenter: {
            x: sx * octaRadius * 0.5,
            y: sy * octaRadius * 0.5,
            z: sz * octaRadius * 0.5,
          },
          sphereRadius: moduleSphereRadius,
        });
      }
    }
  }

  return modules;
};

export const generateTetrahedronMatrix64 = (edgeLength: number): TetraMatrix => {
  const latticeRange = 4;
  const scale = edgeLength / Math.sqrt(2);
  const latticePoints: Point3[] = [];
  const vertices: Point3[] = [];
  const adjacency: Set<number>[] = [];
  const vertexMap = new Map<string, number>();

  for (let x = -latticeRange; x <= latticeRange; x += 1) {
    for (let y = -latticeRange; y <= latticeRange; y += 1) {
      for (let z = -latticeRange; z <= latticeRange; z += 1) {
        if ((x + y + z) % 2 === 0) {
          latticePoints.push({ x, y, z });
          adjacency.push(new Set<number>());
        }
      }
    }
  }

  for (let i = 0; i < latticePoints.length; i += 1) {
    for (let j = i + 1; j < latticePoints.length; j += 1) {
      const distanceSquared =
        (latticePoints[i].x - latticePoints[j].x) ** 2 +
        (latticePoints[i].y - latticePoints[j].y) ** 2 +
        (latticePoints[i].z - latticePoints[j].z) ** 2;

      if (distanceSquared === 2) {
        adjacency[i].add(j);
        adjacency[j].add(i);
      }
    }
  }

  const tetrahedra: {
    vertices: [number, number, number, number];
    centroid: Point3;
    radius: number;
    octant: string;
  }[] = [];
  const seenCells = new Set<string>();

  for (let i = 0; i < latticePoints.length; i += 1) {
    const neighbors = [...adjacency[i]].filter((index) => index > i);

    for (let a = 0; a < neighbors.length; a += 1) {
      for (let b = a + 1; b < neighbors.length; b += 1) {
        for (let c = b + 1; c < neighbors.length; c += 1) {
          const j = neighbors[a];
          const k = neighbors[b];
          const l = neighbors[c];

          if (!adjacency[j].has(k) || !adjacency[j].has(l) || !adjacency[k].has(l)) {
            continue;
          }

          const cell = [i, j, k, l].sort((from, to) => from - to) as [
            number,
            number,
            number,
            number,
          ];
          const key = cell.join(":");

          if (seenCells.has(key)) {
            continue;
          }

          seenCells.add(key);

          const centroid = cell.reduce(
            (sum, index) => ({
              x: sum.x + latticePoints[index].x / 4,
              y: sum.y + latticePoints[index].y / 4,
              z: sum.z + latticePoints[index].z / 4,
            }),
            { x: 0, y: 0, z: 0 },
          );
          const octant = `${centroid.x >= 0 ? "+" : "-"}${centroid.y >= 0 ? "+" : "-"}${
            centroid.z >= 0 ? "+" : "-"
          }`;

          tetrahedra.push({
            vertices: cell,
            centroid,
            radius: Math.hypot(centroid.x, centroid.y, centroid.z),
            octant,
          });
        }
      }
    }
  }

  const selectedCells = tetrahedra
    .filter((cell) =>
      [cell.centroid.x, cell.centroid.y, cell.centroid.z].every((coordinate) => {
        const absolute = Math.abs(coordinate);
        return Math.abs(absolute - 0.5) < 0.00001 || Math.abs(absolute - 1.5) < 0.00001;
      }),
    )
    .map((cell) => cell.vertices);

  const addVertex = (point: Point3): number => {
    const scaledPoint = {
      x: point.x * scale,
      y: point.y * scale,
      z: point.z * scale,
    };
    const key = `${scaledPoint.x.toFixed(5)}:${scaledPoint.y.toFixed(5)}:${scaledPoint.z.toFixed(5)}`;
    const existing = vertexMap.get(key);

    if (typeof existing === "number") {
      return existing;
    }

    const index = vertices.length;
    vertexMap.set(key, index);
    vertices.push(scaledPoint);

    return index;
  };

  const cells = selectedCells.map((cell) => ({
    vertices: cell.map((index) => addVertex(latticePoints[index])) as [
      number,
      number,
      number,
      number,
    ],
  }));

  const centeredVertices = centerPointCloud(vertices);

  return {
    vertices: centeredVertices,
    cells,
    edges: getUniqueTetraEdges(cells),
  };
};

export const validateTetrahedronMatrix64 = (
  matrix: TetraMatrix,
  edgeLength: number,
): TetraMatrixValidation => {
  const errors: string[] = [];
  const tolerance = edgeLength * 0.0001;

  if (matrix.cells.length !== 64) {
    errors.push(`Expected 64 tetrahedral cells, received ${matrix.cells.length}.`);
  }

  for (const [cellIndex, cell] of matrix.cells.entries()) {
    const uniqueVertices = new Set(cell.vertices);

    if (uniqueVertices.size !== 4) {
      errors.push(`Cell ${cellIndex} does not contain 4 unique vertices.`);
      continue;
    }

    const pairs: [number, number][] = [
      [cell.vertices[0], cell.vertices[1]],
      [cell.vertices[0], cell.vertices[2]],
      [cell.vertices[0], cell.vertices[3]],
      [cell.vertices[1], cell.vertices[2]],
      [cell.vertices[1], cell.vertices[3]],
      [cell.vertices[2], cell.vertices[3]],
    ];

    for (const [from, to] of pairs) {
      const a = matrix.vertices[from];
      const b = matrix.vertices[to];

      if (!a || !b) {
        errors.push(`Cell ${cellIndex} references a missing vertex.`);
        continue;
      }

      const distance = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
      if (Math.abs(distance - edgeLength) > tolerance) {
        errors.push(
          `Cell ${cellIndex} has edge length ${distance.toFixed(5)} instead of ${edgeLength.toFixed(5)}.`,
        );
      }
    }
  }

  const duplicateEdges = new Set<string>();
  for (const [from, to] of matrix.edges) {
    const key = from < to ? `${from}:${to}` : `${to}:${from}`;

    if (duplicateEdges.has(key)) {
      errors.push(`Duplicate matrix edge ${key}.`);
    }

    duplicateEdges.add(key);
  }

  const center = matrix.vertices.reduce(
    (sum, vertex) => ({
      x: sum.x + vertex.x,
      y: sum.y + vertex.y,
      z: sum.z + vertex.z,
    }),
    { x: 0, y: 0, z: 0 },
  );

  if (matrix.vertices.length > 0) {
    center.x /= matrix.vertices.length;
    center.y /= matrix.vertices.length;
    center.z /= matrix.vertices.length;
  }

  if (Math.hypot(center.x, center.y, center.z) > tolerance) {
    errors.push("Matrix vertices are not centered around the origin.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

const getUniqueTetraEdges = (cells: TetraCell[]): [number, number][] => {
  const pairs: [number, number][] = [];
  const seen = new Set<string>();

  for (const cell of cells) {
    const [a, b, c, d] = cell.vertices;
    const cellPairs: [number, number][] = [
      [a, b],
      [a, c],
      [a, d],
      [b, c],
      [b, d],
      [c, d],
    ];

    for (const [start, end] of cellPairs) {
      const key = start < end ? `${start}:${end}` : `${end}:${start}`;

      if (!seen.has(key)) {
        seen.add(key);
        pairs.push(start < end ? [start, end] : [end, start]);
      }
    }
  }

  return pairs;
};

const getEdgesFromFaces = (faces: [number, number, number][]): [number, number][] => {
  const seen = new Set<string>();
  const edges: [number, number][] = [];

  for (const [a, b, c] of faces) {
    for (const [start, end] of [
      [a, b],
      [b, c],
      [c, a],
    ] as [number, number][]) {
      const key = start < end ? `${start}:${end}` : `${end}:${start}`;

      if (!seen.has(key)) {
        seen.add(key);
        edges.push(start < end ? [start, end] : [end, start]);
      }
    }
  }

  return edges;
};

const normalizePointCloudToRadius = (
  points: Point3[],
  radius: number,
): Point3[] => {
  const centered = centerPointCloud(points);
  const maxRadius = centered.reduce(
    (max, point) => Math.max(max, Math.hypot(point.x, point.y, point.z)),
    1,
  );

  return centered.map((point) => ({
    x: (point.x / maxRadius) * radius,
    y: (point.y / maxRadius) * radius,
    z: (point.z / maxRadius) * radius,
  }));
};

const centerPointCloud = <T extends Point3>(points: T[]): T[] => {
  if (points.length === 0) {
    return points;
  }

  const center = points.reduce(
    (sum, point) => ({
      x: sum.x + point.x,
      y: sum.y + point.y,
      z: sum.z + point.z,
    }),
    { x: 0, y: 0, z: 0 },
  );
  center.x /= points.length;
  center.y /= points.length;
  center.z /= points.length;

  return points.map((point) => ({
    ...point,
    x: point.x - center.x,
    y: point.y - center.y,
    z: point.z - center.z,
  }));
};
