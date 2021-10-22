precision highp float;

uniform sampler2D buffer;
uniform vec2 dims;

varying vec2 uv;

void main() {
  float val = texture2D(buffer, uv).y;
  gl_FragColor = vec4(val, val, val, 1);
}
