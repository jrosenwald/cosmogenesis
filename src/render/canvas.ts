import { rotate, type Point } from "../geometry/vector";

export interface Camera {
  scale: number;
  offsetX: number;
  offsetY: number;
  rotation: number;
}

export interface CanvasMetrics {
  width: number;
  height: number;
  dpr: number;
}

export const createDefaultCamera = (): Camera => ({
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  rotation: 0,
});

export const resizeCanvasToDisplaySize = (
  canvas: HTMLCanvasElement,
): CanvasMetrics => {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, rect.width);
  const height = Math.max(1, rect.height);
  const nextWidth = Math.round(width * dpr);
  const nextHeight = Math.round(height * dpr);

  if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
    canvas.width = nextWidth;
    canvas.height = nextHeight;
  }

  return { width, height, dpr };
};

export const applyScreenSpace = (
  ctx: CanvasRenderingContext2D,
  metrics: CanvasMetrics,
): void => {
  ctx.setTransform(metrics.dpr, 0, 0, metrics.dpr, 0, 0);
};

export const applyWorldSpace = (
  ctx: CanvasRenderingContext2D,
  metrics: CanvasMetrics,
  camera: Camera,
): void => {
  applyScreenSpace(ctx, metrics);
  ctx.translate(metrics.width / 2 + camera.offsetX, metrics.height / 2 + camera.offsetY);
  ctx.rotate(camera.rotation);
  ctx.scale(camera.scale, camera.scale);
};

export const screenToWorld = (
  point: Point,
  metrics: CanvasMetrics,
  camera: Camera,
): Point => {
  const translated = {
    x: point.x - metrics.width / 2 - camera.offsetX,
    y: point.y - metrics.height / 2 - camera.offsetY,
  };
  const unrotated = rotate(translated, -camera.rotation);

  return {
    x: unrotated.x / camera.scale,
    y: unrotated.y / camera.scale,
  };
};

export const worldToScreen = (
  point: Point,
  metrics: CanvasMetrics,
  camera: Camera,
): Point => {
  const rotated = rotate(
    {
      x: point.x * camera.scale,
      y: point.y * camera.scale,
    },
    camera.rotation,
  );

  return {
    x: metrics.width / 2 + camera.offsetX + rotated.x,
    y: metrics.height / 2 + camera.offsetY + rotated.y,
  };
};

export const zoomCameraAtPoint = (
  camera: Camera,
  metrics: CanvasMetrics,
  screenPoint: Point,
  zoomFactor: number,
): Camera => {
  const worldPoint = screenToWorld(screenPoint, metrics, camera);
  const nextScale = Math.min(4, Math.max(0.35, camera.scale * zoomFactor));
  const rotated = rotate(
    {
      x: worldPoint.x * nextScale,
      y: worldPoint.y * nextScale,
    },
    camera.rotation,
  );

  return {
    ...camera,
    scale: nextScale,
    offsetX: screenPoint.x - metrics.width / 2 - rotated.x,
    offsetY: screenPoint.y - metrics.height / 2 - rotated.y,
  };
};
