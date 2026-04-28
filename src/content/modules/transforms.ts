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

    {
      id: "tx-02-translate-rotate-scale",
      title: "Translate, rotate, scale — in that order",
      module: "transforms",
      difficulty: "medium",
      tags: ["affine", "tx"],
      taskType: "build",
      description:
        "Render a square that's translated to (-0.3, 0.2), rotated 30°, and scaled to half size — by transforming p with the INVERSE of each operation in REVERSE order.",
      goal: "Compose translate / rotate / scale on the input point, in the right inverse order.",
      expectedVisual:
        "A small white rotated square offset to the upper-left of the canvas centre.",
      starterCode: `float sdBox(vec2 p, vec2 b) {
  vec2 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
}
mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 p  = uv * 2.0 - 1.0;
  p.x    *= iResolution.x / iResolution.y;

  // TODO: apply inverse translate(-0.3, 0.2), rotate(30°), scale(0.5)
  vec2 q = p;

  float d  = sdBox(q, vec2(0.4));
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

  // To draw T*R*S applied to the shape, we apply S^-1 * R^-1 * T^-1 to the point.
  vec2 q = p;
  q -= vec2(-0.3, 0.2);            // undo translate
  q  = rot(-radians(30.0)) * q;     // undo rotate
  q /= 0.5;                         // undo scale

  float d  = sdBox(q, vec2(0.4));
  float aa = fwidth(d) * 0.5;       // distances scaled when we scaled q
  float m  = 1.0 - smoothstep(-aa, aa, d);
  fragColor = vec4(vec3(m), 1.0);
}
`,
      hints: [
        { id: "h1", content: "We always apply the INVERSE transform to the input point." },
        { id: "h2", content: "Compose the inverses in REVERSE order: translate first → rotate → scale, becomes scale^-1 ∘ rotate^-1 ∘ translate^-1 on p." },
        { id: "h3", content: "Scale q by /0.5 to undo a 0.5× scale on the shape." },
      ],
      validation: {
        type: "pixel",
        rules: [
          // The square ends up centered around (-0.3, 0.2). In uv that's around (0.35, 0.6).
          { point: [0.35, 0.6], expected: [1, 1, 1], tolerance: 0.2 },
          // Far corner: black.
          { point: [0.95, 0.05], expected: [0, 0, 0], tolerance: 0.05 },
        ],
      },
    },

    {
      id: "tx-03-perspective-divide",
      title: "Apply a perspective divide",
      module: "transforms",
      difficulty: "hard",
      tags: ["projection", "homogeneous"],
      taskType: "modify",
      description:
        "We have a 2D shape on the plane z=−1 and want to render it under a pinhole projection from a camera at the origin looking down -z. Implement the perspective divide: x' = x / (1 - z/c), y' = y / (1 - z/c), with c = 2.",
      goal: "Hand-implement the homogeneous-to-screen perspective divide.",
      expectedVisual:
        "A projected square — centered, smaller than it would be without projection.",
      starterCode: `float sdBox(vec2 p, vec2 b) {
  vec2 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 p  = uv * 2.0 - 1.0;
  p.x    *= iResolution.x / iResolution.y;

  float c = 2.0;
  float z = -1.0;

  // We want to know: which world-space (x, y, z=-1) projects to this screen pixel p?
  // Forward projection: screen.xy = world.xy / (1 - world.z / c)
  // Solve for world.xy in terms of p:
  //   world.xy = p * (1 - z/c)
  // TODO: compute world.xy from p, then test it against a 0.6×0.6 square.
  vec2 world = p;

  float d  = sdBox(world, vec2(0.6));
  float aa = fwidth(d);
  float m  = 1.0 - smoothstep(-aa, aa, d);
  fragColor = vec4(vec3(m), 1.0);
}
`,
      solutionCode: `float sdBox(vec2 p, vec2 b) {
  vec2 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 p  = uv * 2.0 - 1.0;
  p.x    *= iResolution.x / iResolution.y;

  float c = 2.0;
  float z = -1.0;
  vec2 world = p * (1.0 - z / c);

  float d  = sdBox(world, vec2(0.6));
  float aa = fwidth(d);
  float m  = 1.0 - smoothstep(-aa, aa, d);
  fragColor = vec4(vec3(m), 1.0);
}
`,
      hints: [
        { id: "h1", content: "Forward projection: screen.xy = world.xy / (1 - world.z / c). Invert it for world.xy." },
        { id: "h2", content: "world.xy = screen.xy * (1 - z / c)." },
        { id: "h3", content: "Pulling things back to z=-1 with c=2 stretches them by 1.5×, so the projected square is smaller." },
      ],
      validation: {
        type: "pixel",
        rules: [
          // Center is inside the projected square.
          { point: [0.5, 0.5], expected: [1, 1, 1], tolerance: 0.1 },
          // Corners — black.
          { point: [0.05, 0.05], expected: [0, 0, 0], tolerance: 0.05 },
        ],
      },
    },
  ],
};
