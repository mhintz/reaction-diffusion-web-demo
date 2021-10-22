precision highp float;

uniform sampler2D buffer;
uniform vec2 dims;

const float diffusionRateA = 1.0;
const float diffusionRateB = 0.5;

uniform float feedRateA;
uniform float killRateB;

varying vec2 uv;

float convolute(float ul, float u, float ur, float l, float c, float r, float bl, float b, float br) {
  return (
    0.05 * ul +
    0.2 * u +
    0.05 * ur +
    0.2 * l +
    -1. * c +
    0.2 * r +
    0.05 * bl +
    0.2 * b +
    0.05 * br
  );
}

// texture sampling with wrapping in x and y, so the texture "repeats" if you sample outside its bounds
vec4 sampleTexWrap(sampler2D buffer, vec2 uv) {
  return texture2D(buffer, fract(uv + 1.0));
}

void main() {
  float xinc = 1.0 / dims.x;
  float yinc = 1.0 / dims.y;

  vec4 ul = sampleTexWrap(buffer, uv + vec2(-xinc, -yinc));
  vec4 u = sampleTexWrap(buffer, uv + vec2(0, -yinc));
  vec4 ur = sampleTexWrap(buffer, uv + vec2(xinc, -yinc));
  vec4 l = sampleTexWrap(buffer, uv + vec2(-xinc, 0));
  vec4 cur = sampleTexWrap(buffer, uv + vec2(0, 0));
  vec4 r = sampleTexWrap(buffer, uv + vec2(xinc, 0));
  vec4 bl = sampleTexWrap(buffer, uv + vec2(-xinc, yinc));
  vec4 b = sampleTexWrap(buffer, uv + vec2(0, yinc));
  vec4 br = sampleTexWrap(buffer, uv + vec2(xinc, yinc));

  float curA = cur.x;
  float curB = cur.y;

  float ABB = curA * curB * curB;

  float diffA = diffusionRateA * convolute(ul.x, u.x, ur.x, l.x, curA, r.x, bl.x, b.x, br.x);
  float diffB = diffusionRateB * convolute(ul.y, u.y, ur.y, l.y, curB, r.y, bl.y, b.y, br.y);

  float newA = clamp(curA + (diffA - ABB + feedRateA * (1.0 - curA)), 0.0, 1.0);
  float newB = clamp(curB + (diffB + ABB - (feedRateA + killRateB) * curB), 0.0, 1.0);

  gl_FragColor = vec4(newA, newB, 0.0, 1.0);
}
