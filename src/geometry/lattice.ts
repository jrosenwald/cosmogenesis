import type { Point } from "./vector";

const SQRT_3 = Math.sqrt(3);

export interface AxialCoordinate {
  q: number;
  r: number;
}

export const axialToPoint = (
  coordinate: AxialCoordinate,
  spacing: number,
): Point => ({
  x: spacing * (coordinate.q + coordinate.r / 2),
  y: spacing * ((SQRT_3 / 2) * coordinate.r),
});

export const generateHexRing = (
  spacing: number,
  ringCount: number,
): Point[] => {
  if (ringCount <= 0) {
    return [{ x: 0, y: 0 }];
  }

  const points: Point[] = [];
  const directions: AxialCoordinate[] = [
    { q: 1, r: 0 },
    { q: 1, r: -1 },
    { q: 0, r: -1 },
    { q: -1, r: 0 },
    { q: -1, r: 1 },
    { q: 0, r: 1 },
  ];

  let coordinate: AxialCoordinate = { q: -ringCount, r: ringCount };

  for (const direction of directions) {
    for (let step = 0; step < ringCount; step += 1) {
      points.push(axialToPoint(coordinate, spacing));
      coordinate = {
        q: coordinate.q + direction.q,
        r: coordinate.r + direction.r,
      };
    }
  }

  return points;
};

export const generateHexLattice = (
  spacing: number,
  ringCount: number,
): Point[] => {
  const points: Point[] = [{ x: 0, y: 0 }];

  for (let ring = 1; ring <= ringCount; ring += 1) {
    points.push(...generateHexRing(spacing, ring));
  }

  return points;
};

export const getSeedOfLifeCenters = (radius: number): Point[] => [
  { x: 0, y: 0 },
  ...generateHexRing(radius, 1),
];

export const getTripodOfLifeCenters = (radius: number): Point[] => {
  const centers: Point[] = [
    { x: 0, y: 0 },
    { x: radius, y: 0 },
    { x: radius / 2, y: (SQRT_3 / 2) * radius },
  ];

  const centroid = {
    x: radius / 2,
    y: (SQRT_3 / 6) * radius,
  };

  return centers.map((center) => ({
    x: center.x - centroid.x,
    y: center.y - centroid.y,
  }));
};
