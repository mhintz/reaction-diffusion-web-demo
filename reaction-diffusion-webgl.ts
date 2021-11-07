import { floor, rect, loop } from "./common";
import ndarray from "ndarray";
import fillScreen from "a-big-triangle";
import createShader from "gl-shader";
import createFbo from "gl-fbo";

import passThroughVert from "./v_pass_through.glsl";
import updateReactionFrag from "./f_update_reaction.glsl";
import renderReactionFrag from "./f_render_reaction.glsl";

type Shader = ReturnType<typeof createShader>;

const getContext = (width: number, height: number): WebGLRenderingContext => {
  const canvas = document.querySelector("#main")! as HTMLCanvasElement;

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.width = width;
  canvas.height = height;

  return canvas.getContext("webgl")!;
};

/* config */
const diffusionRateA = 1.0;
const diffusionRateB = 0.5;

const typeAlpha = [0.01, 0.047];
const typeDelta = [0.042, 0.059];
const typeBeta = [0.014, 0.039];
const typeGamma = [0.022, 0.051];
const typeKappa = [0.0545, 0.062];
const typeLambda = [0.034, 0.065];
// optional: 0.0545, 0.062
const typeXi = [0.014, 0.047];
const typePi = [0.062, 0.061];

const [feedRateA, killRateB] = typeXi;

const buildShader = (gl: WebGLRenderingContext, vertexCode: string, fragmentCode: string): Shader | null => {
  try {
    return createShader(gl, vertexCode, fragmentCode);
  } catch (err: any) {
    console.error('Shader compilation error: ', err.longMessage, err);
    return null;
  }
}

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

  const updateShader = buildShader(gl, passThroughVert, updateReactionFrag);
  const renderShader = buildShader(gl, passThroughVert, renderReactionFrag);

  if (updateShader === null || renderShader === null) {
    return;
  }

  updateShader.attributes.position.location = 0;
  renderShader.attributes.position.location = 0;

  let sourceBuffer = createFbo(gl, [width, height], {
    preferFloat: true,
    float: true,
  });
  sourceBuffer.color[0].setPixels(sourceData);

  let destBuffer = createFbo(gl, [width, height], {
    preferFloat: true,
    float: true,
  });

  // run the simulation
  loop(() => {
    for (let iteration = 0; iteration < 30; iteration++) {
      // update the simulation

      destBuffer.bind();

      updateShader.bind();

      updateShader.uniforms.buffer = sourceBuffer.color[0].bind();
      // this one would be nice to have but it breaks the texture for some reason
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
