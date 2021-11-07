precision highp float;

uniform sampler2D buffer;
uniform vec2 dims;

varying vec2 uv;

#define NUM_COLOR_STOPS 5

vec3 interpColorScheme(float t) {
  vec3 colors[NUM_COLOR_STOPS];
  colors[0] = vec3(0.0, 0.0, 0.0); // black
  colors[1] = vec3(1.0, 1.0, 0.702); // yellow
  // vec3(0.011, 0.427, 0.407), // dark turquoise
  colors[2] = vec3(0.188, 0.835, 0.784); // turquoise
  colors[3] = vec3(0, 0, 0.515); // blue
  colors[4] = vec3(1.0, 1.0, 1.0); // white

  float stops[NUM_COLOR_STOPS];
  stops[0] = 0.0;
  stops[1] = 0.09;
  stops[2] = 0.19;
  stops[3] = 0.45;
  stops[4] = 1.0;

  vec3 color = colors[0];
  for (int idx = 1; idx < NUM_COLOR_STOPS; idx++) {
    color = mix(color, colors[idx], smoothstep(stops[idx - 1], stops[idx], t));
  }
  return color;
}

void main() {
  vec2 val = texture2D(buffer, uv).xy;
  vec3 interpolated = interpColorScheme(val.y);
  gl_FragColor = vec4(interpolated, 1);
}
