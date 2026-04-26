import type { Module } from "../../types";

export const shapeOpsModule: Module = {
  id: "shape-ops",
  title: "Shape Operations",
  blurb: "Combine SDFs with min/max to get union, intersection, subtraction, and smooth blends.",
  order: 3,
  lessons: [
    {
      id: "boolean-ops",
      title: "Boolean ops on SDFs",
      theory: `Given two SDFs d1 and d2:
  union(d1, d2)        = min(d1, d2)
  intersection(d1, d2) = max(d1, d2)
  subtract(d1, d2)     = max(d1, -d2)

These are exact but produce sharp creases. For smooth blends, use polynomial smoothmin:
  float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5*(b-a)/k, 0.0, 1.0);
    return mix(b, a, h) - k*h*(1.0-h);
  }`,
    },
  ],
  tasks: [
    {
      id: "ops-01-two-circles-union",
      title: "Union two disks",
      module: "shape-ops",
      difficulty: "easy",
      tags: ["sdf", "union", "min"],
      taskType: "build",
      description:
        "Render a horizontal figure-eight: two disks of radius 0.2 centered at (-0.25, 0) and (0.25, 0), unioned together.",
      goal: "Use min() to take the union of two circle SDFs.",
      expectedVisual: "A peanut/figure-eight shape across the middle of the canvas, white on black.",
      starterCode: `void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 p  = uv * 2.0 - 1.0;
  p.x    *= iResolution.x / iResolution.y;

  float d1 = length(p - vec2(-0.25, 0.0)) - 0.2;
  float d2 = length(p - vec2( 0.25, 0.0)) - 0.2;
  // TODO: union
  float d = d1;

  float aa = fwidth(d);
  float m  = 1.0 - smoothstep(-aa, aa, d);
  fragColor = vec4(vec3(m), 1.0);
}
`,
      solutionCode: `void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 p  = uv * 2.0 - 1.0;
  p.x    *= iResolution.x / iResolution.y;

  float d1 = length(p - vec2(-0.25, 0.0)) - 0.2;
  float d2 = length(p - vec2( 0.25, 0.0)) - 0.2;
  float d  = min(d1, d2);

  float aa = fwidth(d);
  float m  = 1.0 - smoothstep(-aa, aa, d);
  fragColor = vec4(vec3(m), 1.0);
}
`,
      hints: [
        { id: "h1", content: "Union of two SDFs is the min of their distances." },
      ],
      validation: {
        type: "pixel",
        rules: [
          // Centered between the two disks: in the overlap → white.
          { point: [0.5, 0.5], expected: [1, 1, 1], tolerance: 0.1 },
          // Far above → black.
          { point: [0.5, 0.95], expected: [0, 0, 0], tolerance: 0.05 },
        ],
      },
    },
  ],
};
