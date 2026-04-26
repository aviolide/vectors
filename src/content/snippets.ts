/**
 * Centralized GLSL snippets reused across tasks. Keeping them here means we
 * can teach a concept once and link to a single source of truth.
 *
 * The runner injects iResolution / iTime / iMouse and wraps the source with a
 * `#version 300 es` preamble — task code only needs to declare `void main()`
 * and helper functions.
 */

export const HELPERS = /* glsl */ `
// uv in [0,1] horizontally; aspect-correct centered coords with y up
vec2 toCentered(vec2 frag) {
  vec2 uv = frag / iResolution.xy;
  uv = uv * 2.0 - 1.0;
  uv.x *= iResolution.x / iResolution.y;
  return uv;
}

// 2D circle SDF, signed distance: <0 inside, >0 outside
float sdCircle(vec2 p, float r) { return length(p) - r; }

// Filled mask from an SDF using a 1-pixel anti-alias band
float fill(float d) {
  float aa = fwidth(d);
  return 1.0 - smoothstep(-aa, aa, d);
}
`;

export const TEMPLATE_BLACK = /* glsl */ `void main() {
  fragColor = vec4(0.0, 0.0, 0.0, 1.0);
}
`;
