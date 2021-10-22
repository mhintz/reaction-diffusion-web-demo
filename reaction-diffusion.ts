type Point = { x: number; y: number };

const point = (x: number, y: number) => ({ x, y });

class RDBuffer {
  length: number;
  width: number;
  height: number;
  storage: Float32Array;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.length = width * height;
    this.storage = new Float32Array(this.length * 2);
  }

  private pix(x: number, y: number) {
    const wrapX = (this.width + x) % this.width;
    const wrapY = (this.height + y) % this.height;
    return (wrapY * this.width + wrapX) * 2;
  }

  get(pt: Point, offX: number = 0, offY: number = 0): Point {
    const pix = this.pix(pt.x + offX, pt.y + offY);
    return point(this.storage[pix], this.storage[pix + 1]);
  }

  getXY(x: number, y: number): Point {
    const pix = this.pix(x, y);
    return point(this.storage[pix], this.storage[pix + 1]);
  }

  getAt(index: number): Point {
    const pix = index * 2;
    return point(this.storage[pix], this.storage[pix + 1]);
  }

  set(pt: Point, val: Point) {
    const pix = this.pix(pt.x, pt.y);
    this.storage[pix] = val.x;
    this.storage[pix + 1] = val.y;
  }
}

const getContext = (
  width: number,
  height: number
): CanvasRenderingContext2D => {
  const canvas = document.querySelector("#main")! as HTMLCanvasElement;

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.width = width;
  canvas.height = height;

  return canvas.getContext("2d")!;
};

const loop = <F extends () => void>(fn: F) => {
  fn();
  requestAnimationFrame(() => {
    loop(fn);
  });
};

const drawRDBuffer = (
  ctx: CanvasRenderingContext2D,
  buffer: RDBuffer,
  width: number,
  height: number
) => {
  const img = new Uint8ClampedArray(buffer.length * 4);
  for (let idx = 0; idx < buffer.length; idx++) {
    const bufValue = buffer.getAt(idx);
    const pixValue = Math.floor(bufValue.y * 255);

    const pixel = idx * 4;
    img[pixel] = pixValue;
    img[pixel + 1] = pixValue;
    img[pixel + 2] = pixValue;
    img[pixel + 3] = 255;
  }

  const imageData = new ImageData(img, width, height);
  ctx.putImageData(imageData, 0, 0);
};

const { abs, min, max, floor } = Math;

const fract = (x: number) => x % 1.0;

const step = (t: number, x: number) => (x < t ? 0 : 1);

const edge = (a: number, b: number, x: number) => step(a, x) - step(b, x);

const rect = (
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

const convolute = (
  ul: number,
  u: number,
  ur: number,
  l: number,
  c: number,
  r: number,
  bl: number,
  b: number,
  br: number
) =>
  0.05 * ul +
  0.2 * u +
  0.05 * ur +
  0.2 * l +
  -1 * c +
  0.2 * r +
  0.05 * bl +
  0.2 * b +
  0.05 * br;

/* config */
const diffusionRateA = 1.0;
const diffusionRateB = 0.5;

const typeAlpha = [0.01, 0.047];
const typeDelta = [0.042, 0.059];
const typeBeta = [0.014, 0.039];
const typeGamma = [0.022, 0.051];
const typeKappa = [0.0545, 0.062];

const [feedRateA, killRateB] = typeKappa;

const main = () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  const ctx = getContext(width, height);
  ctx.clearRect(0, 0, width, height);

  let sourceBuffer = new RDBuffer(width, height);
  let destBuffer = new RDBuffer(width, height);

  // paint the source buffer
  const loc = point(0, 0);
  const value = point(0, 0);
  for (let idx = 0; idx < sourceBuffer.length; idx++) {
    loc.x = idx % width;
    loc.y = floor(idx / width);

    const bValue = rect(
      loc.x / width,
      loc.y / height,
      0.2,
      0.2,
      0.6,
      0.6,
      0.05
    );
    value.x = 1.0 - bValue;
    value.y = bValue;
    sourceBuffer.set(loc, value);
  }

  // run the simulation
  loop(() => {
    const pos = point(0, 0);
    const val = point(0, 0);
    for (let iteration = 0; iteration < 30; iteration++) {
      for (let idx = 0; idx < sourceBuffer.length; idx++) {
        pos.x = idx % width;
        pos.y = floor(idx / width);

        const ul = sourceBuffer.get(pos, -1, -1);
        const u = sourceBuffer.get(pos, 0, -1);
        const ur = sourceBuffer.get(pos, 1, -1);
        const l = sourceBuffer.get(pos, -1, 0);
        const c = sourceBuffer.get(pos, 0, 0);
        const r = sourceBuffer.get(pos, 1, 0);
        const bl = sourceBuffer.get(pos, -1, 1);
        const b = sourceBuffer.get(pos, 0, 1);
        const br = sourceBuffer.get(pos, 1, 1);

        const curA = c.x;
        const curB = c.y;

        const abb = curA * curB * curB;

        const diffA =
          diffusionRateA *
          convolute(ul.x, u.x, ur.x, l.x, c.x, r.x, bl.x, b.x, br.x);
        const diffB =
          diffusionRateB *
          convolute(ul.y, u.y, ur.y, l.y, c.y, r.y, bl.y, b.y, br.y);

        const newA = curA + (diffA - abb + feedRateA * (1.0 - curA));
        const newB = curB + (diffB + abb - (feedRateA + killRateB) * curB);

        val.x = newA;
        val.y = newB;

        destBuffer.set(pos, val);
      }

      // swap buffers
      const srcRef = sourceBuffer;
      sourceBuffer = destBuffer;
      destBuffer = srcRef;
    }

    drawRDBuffer(ctx, destBuffer, width, height);
  });
};

main();
