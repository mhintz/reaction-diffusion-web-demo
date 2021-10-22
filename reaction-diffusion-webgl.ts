import { Point, point, floor, rect, loop } from "./common";
import createTexture from "gl-texture2d";
import ndarray from "ndarray";
import fillScreen from "a-big-triangle";
import createShader from "gl-shader";
import createFbo from "gl-fbo";

import passThroughVert from "./v_pass_through.glsl";
import updateReactionFrag from "./f_update_reaction.glsl";
import renderReactionFrag from "./f_render_reaction.glsl";

const getContext = (width: number, height: number): WebGLRenderingContext => {
  const canvas = document.querySelector("#main")! as HTMLCanvasElement;

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.width = width;
  canvas.height = height;

  return canvas.getContext("webgl")!;
};

// const drawRDBuffer = (
//   ctx: CanvasRenderingContext2D,
//   buffer: RDBuffer,
//   width: number,
//   height: number
// ) => {
//   const img = new Uint8ClampedArray(buffer.length * 4);
//   for (let idx = 0; idx < buffer.length; idx++) {
//     const bufValue = buffer.getAt(idx);
//     const pixValue = Math.floor(bufValue.y * 255);

//     const pixel = idx * 4;
//     img[pixel] = pixValue;
//     img[pixel + 1] = pixValue;
//     img[pixel + 2] = pixValue;
//     img[pixel + 3] = 255;
//   }

//   const imageData = new ImageData(img, width, height);
//   ctx.putImageData(imageData, 0, 0);
// };

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
): number => {
  return (
    0.05 * ul +
    0.2 * u +
    0.05 * ur +
    0.2 * l +
    -1 * c +
    0.2 * r +
    0.05 * bl +
    0.2 * b +
    0.05 * br
  );
};

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

  const numCells = width * height;
  const sourceData = ndarray(new Float32Array(width * height * 4), [
    width,
    height,
    4,
  ]);

  // paint the source buffer
  for (let idx = 0; idx < numCells; idx++) {
    const posX = idx % width;
    const posY = floor(idx / width);

    const bValue = rect(posX / width, posY / height, 0.2, 0.2, 0.6, 0.6, 0.05);

    sourceData.set(posX, posY, 0, 1.0 - bValue);
    sourceData.set(posX, posY, 1, bValue);
  }

  const gl = getContext(width, height);

  gl.disable(gl.DEPTH_TEST);
  gl.clearColor(1, 0, 1, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  const updateShader = createShader(gl, passThroughVert, updateReactionFrag);
  updateShader.attributes.position.location = 0;

  const renderShader = createShader(gl, passThroughVert, renderReactionFrag);
  renderShader.attributes.position.location = 0;

  let sourceBuffer = createFbo(gl, [width, height]);
  sourceBuffer.color[0].setPixels(sourceData);

  let destBuffer = createFbo(gl, [width, height]);

  // run the simulation
  loop(() => {
    for (let iteration = 0; iteration < 30; iteration++) {
      // update the simulation

      destBuffer.bind();

      updateShader.bind();

      updateShader.uniforms.buffer = sourceBuffer.color[0].bind();
      // sourceBuffer.color[0].wrap = [gl.REPEAT, gl.REPEAT];

      updateShader.uniforms.dims = [width, height];
      updateShader.uniforms.feedRateA = feedRateA;
      updateShader.uniforms.killRateB = killRateB;

      fillScreen(gl);

      // swap buffers
      const srcRef = sourceBuffer;
      sourceBuffer = destBuffer;
      destBuffer = srcRef;
    }

    // draw the simulation

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    renderShader.bind();
    renderShader.uniforms.buffer = destBuffer.color[0].bind();
    renderShader.uniforms.dims = [width, height];

    fillScreen(gl);
  });
};

main();
