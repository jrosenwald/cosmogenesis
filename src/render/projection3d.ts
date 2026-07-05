import type { Point } from "../geometry/vector";
import type { Point3 } from "../geometry/spatial";

export interface ProjectionAngles {
  yaw: number;
  pitch: number;
  roll: number;
}

export const rotatePoint3 = (
  point: Point3,
  angles: ProjectionAngles,
): Point3 => {
  const cosY = Math.cos(angles.yaw);
  const sinY = Math.sin(angles.yaw);
  const yawed = {
    x: point.x * cosY + point.z * sinY,
    y: point.y,
    z: -point.x * sinY + point.z * cosY,
  };
  const cosX = Math.cos(angles.pitch);
  const sinX = Math.sin(angles.pitch);
  const pitched = {
    x: yawed.x,
    y: yawed.y * cosX - yawed.z * sinX,
    z: yawed.y * sinX + yawed.z * cosX,
  };
  const cosZ = Math.cos(angles.roll);
  const sinZ = Math.sin(angles.roll);

  return {
    x: pitched.x * cosZ - pitched.y * sinZ,
    y: pitched.x * sinZ + pitched.y * cosZ,
    z: pitched.z,
  };
};

export const projectPoint3 = (
  point: Point3,
  distance = 900,
): Point & { depth: number; scale: number } => {
  const scale = distance / (distance - point.z);

  return {
    x: point.x * scale,
    y: point.y * scale,
    depth: point.z,
    scale,
  };
};

export const getDefaultProjectionAngles = (): ProjectionAngles => ({
  yaw: -0.62,
  pitch: -0.72,
  roll: 0.08,
});
