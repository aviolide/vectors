import type { Module } from "../../types";

export const transformsModule: Module = {
  id: "transforms",
  title: "Transformations",
  blurb:
    "Translate, rotate, and scale by transforming the input point, not the shape. Inverse-thinking unlocks everything.",
  order: 4,
  lessons: [
    {
      id: "inverse-thinking",
      title: "Transform the space, not the shape",
      theory: `In a fragment shader you don't move shapes — you move the coordinate system.

To draw a circle at (cx, cy):  evaluate sdCircle(p - vec2(cx, cy), r).
To rotate a shape by θ:        evaluate sd(rot(-θ) * p).
To scale by s:                 evaluate sd(p / s) * s   // distance scales too!

Always apply the inverse of the transform you want to see.`,
      example: `mat2 rot(float a) {
  float c = cos(a), s = sin(a);
  return mat2(c, -s, s, c);
}`,
    },
  ],
  tasks: [
    {
      id: "tx-01-rotate-square",
      title: "Rotate a square 45°",
      module: "transforms",
      difficulty: "easy",
      tags: ["rotate", "mat2"],
      taskType: "modify",
      description: "Take the centered square and rotate it 45° (turning it into a diamond).",
      goal: "Apply a 2D rotation matrix to p before computing the SDF.",
      expectedVisual: "A white diamond (rotated square) on a black canvas.",
      starterCode: `float sdBox(vec2 p, vec2 b) {
  vec2 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 p  = uv * 2.0 - 1.0;
  p.x    *= iResolution.x / iResolution.y;

  // TODO: rotate p by 45 degrees (PI/4) before computing the SDF.
  float d  = sdBox(p, vec2(0.3));
  float aa = fwidth(d);
  float m  = 1.0 - smoothstep(-aa, aa, d);
  fragColor = vec4(vec3(m), 1.0);
}
`,
      solutionCode: `float sdBox(vec2 p, vec2 b) {
  vec2 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
}

mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 p  = uv * 2.0 - 1.0;
  p.x    *= iResolution.x / iResolution.y;

  p = rot(0.7853981633974483) * p; // PI/4
  float d  = sdBox(p, vec2(0.3));
  float aa = fwidth(d);
  float m  = 1.0 - smoothstep(-aa, aa, d);
  fragColor = vec4(vec3(m), 1.0);
}
`,
      hints: [
        { id: "h1", content: "A 2D rotation matrix is mat2(cos a, -sin a, sin a, cos a)." },
        { id: "h2", content: "Multiply rot(angle) * p before passing p to sdBox." },
      ],
      validation: {
        type: "pixel",
        rules: [
          // Center of canvas is inside the diamond.
          { point: [0.5, 0.5], expected: [1, 1, 1], tolerance: 0.1 },
          // 45° corner toward the right tip — still inside.
          { point: [0.78, 0.5], expected: [1, 1, 1], tolerance: 0.25 },
        ],
      },
    },
  ],
};
