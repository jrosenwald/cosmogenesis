export interface Point {
  x: number;
  y: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const point = (x = 0, y = 0): Point => ({ x, y });

export const add = (a: Point, b: Point): Point => ({
  x: a.x + b.x,
  y: a.y + b.y,
});

export const subtract = (a: Point, b: Point): Point => ({
  x: a.x - b.x,
  y: a.y - b.y,
});

export const scale = (value: Point, scalar: number): Point => ({
  x: value.x * scalar,
  y: value.y * scalar,
});

export const rotate = (value: Point, radians: number): Point => {
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  return {
    x: value.x * cos - value.y * sin,
    y: value.x * sin + value.y * cos,
  };
};

export const distance = (a: Point, b: Point): number => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;

  return Math.hypot(dx, dy);
};

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const lerp = (start: number, end: number, amount: number): number =>
  start + (end - start) * amount;

export const centerOf = (points: Point[]): Point => {
  if (points.length === 0) {
    return point();
  }

  const total = points.reduce(
    (sum, item) => ({
      x: sum.x + item.x,
      y: sum.y + item.y,
    }),
    point(),
  );

  return scale(total, 1 / points.length);
};
