import type { Point } from "./vector";

export interface CircleGeometry {
  center: Point;
  radius: number;
}

export const createCircle = (
  center: Point,
  radius: number,
): CircleGeometry => ({
  center,
  radius,
});

export const getVesicaPiscisCircles = (radius: number): CircleGeometry[] => [
  createCircle({ x: -radius / 2, y: 0 }, radius),
  createCircle({ x: radius / 2, y: 0 }, radius),
];
