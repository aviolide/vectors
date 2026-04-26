import type { Module } from "../../types";

export const utilsModule: Module = {
  id: "glsl-utils",
  title: "GLSL Utility Functions",
  blurb:
    "step, smoothstep, mix, clamp, fract — the small toolbox you'll reach for in every shader.",
  order: 6,
  lessons: [
    {
      id: "stepfamily",
      title: "step / smoothstep / mix",
      theory: `step(edge, x): 0 if x<edge, 1 otherwise.
smoothstep(e0, e1, x): cubic Hermite blend from 0 to 1 across [e0, e1].
mix(a, b, t): linear interpolation a*(1-t) + b*t.
clamp(x, lo, hi): saturate to [lo, hi].
fract(x): x - floor(x), great for tiling.`,
      example: `float band = smoothstep(0.45, 0.5, uv.x) - smoothstep(0.5, 0.55, uv.x);`,
    },
  ],
  tasks: [
    {
      id: "util-01-color-mix",
      title: "Mix between two colors",
      module: "glsl-utils",
      difficulty: "easy",
      tags: ["mix", "color"],
      taskType: "build",
      description:
        "Use mix() to interpolate between magenta (1, 0, 1) and cyan (0, 1, 1) horizontally across the canvas.",
      goal: "Output mix(magenta, cyan, uv.x).",
      expectedVisual:
        "A horizontal gradient: magenta on the left, cyan on the right, smooth blend in the middle.",
      starterCode: `void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  fragColor = vec4(0.0, 0.0, 0.0, 1.0);
}
`,
      solutionCode: `void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec3 a = vec3(1.0, 0.0, 1.0);
  vec3 b = vec3(0.0, 1.0, 1.0);
  fragColor = vec4(mix(a, b, uv.x), 1.0);
}
`,
      hints: [
        { id: "h1", content: "mix(a, b, t) = a*(1-t) + b*t. Use uv.x as t." },
      ],
      validation: {
        type: "pixel",
        rules: [
          { point: [0.0, 0.5], expected: [1, 0, 1], tolerance: 0.05 },
          { point: [1.0, 0.5], expected: [0, 1, 1], tolerance: 0.05 },
          { point: [0.5, 0.5], expected: [0.5, 0.5, 1], tolerance: 0.05 },
        ],
      },
    },
  ],
};
