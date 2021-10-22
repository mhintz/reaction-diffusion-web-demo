export type Point = { x: number; y: number };

export const point = (x: number, y: number) => ({ x, y });

const { abs, min, max, floor } = Math;

export { abs, min, max, floor };

export const fract = (x: number) => x % 1.0;

export const step = (t: number, x: number) => (x < t ? 0 : 1);

export const edge = (a: number, b: number, x: number) => step(a, x) - step(b, x);

export const rect = (
  x: number,
  y: number,
  x0: number,
  y0: number,
  width: number,
  height: number,
  thick: number
) => {
  const outerX = edge(x0 - thick, x0 + width + thick, x);
  const innerX = edge(x0 + thick, x0 + width - thick, x);
  const outerY = edge(y0 - thick, y0 + height + thick, y);
  const innerY = edge(y0 + thick, y0 + height - thick, y);
  return max(outerX - innerX, outerY - innerY);
};

export const loop = <F extends () => void>(fn: F) => {
  fn();
  requestAnimationFrame(() => {
    loop(fn);
  });
};
