import type { Module } from "../../types";

export const vectorsCoordsModule: Module = {
  id: "vectors-coords",
  title: "Vectors & Coordinates",
  blurb:
    "Pixels are points. Master the coordinate transforms that turn integer pixels into a clean math playground.",
  order: 1,
  lessons: [
    {
      id: "what-is-a-vector",
      title: "What's a vector, in a fragment shader?",
      theory: `A vector in 2D is just a pair of floats (x, y). In a fragment shader, every invocation has a built-in vector: gl_FragCoord.xy — the current pixel's screen-space coordinate, with origin at the bottom-left.

Geometric operations apply pointwise:
  add: a + b moves a by b
  scale: 2.0 * a stretches it from the origin
  dot: dot(a, b) measures alignment (and equals |a||b|cosθ)
  length: length(a) is the euclidean norm sqrt(x*x + y*y)`,
      example: `vec2 a = vec2(3.0, 4.0);
float L = length(a); // 5.0
vec2 n = a / L;      // unit vector pointing same direction`,
    },
    {
      id: "uv-space",
      title: "UV space",
      theory: `Normalize gl_FragCoord by iResolution to get uv in [0,1]. From there we typically do one of two things:
  - keep uv as-is for textures and gradients
  - center it around 0 and aspect-correct: vec2 p = (uv*2-1); p.x *= aspect;

Centered coordinates are great for shapes; uv is great for color gradients and patterns.`,
    },
  ],
  tasks: [
    {
      id: "vec-01-uv-gradient",
      title: "UV color gradient",
      module: "vectors-coords",
      difficulty: "easy",
      tags: ["uv", "color"],
      taskType: "build",
      description: "Output the uv coordinates as red and green: red increases left→right, green increases bottom→top.",
      goal: "Convert gl_FragCoord to uv and write it as RG.",
      expectedVisual:
        "A gradient: black in the bottom-left, red on the right edge, green at the top, yellow in the top-right corner.",
      starterCode: `void main() {
  fragColor = vec4(0.0, 0.0, 0.0, 1.0);
}
`,
      solutionCode: `void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  fragColor = vec4(uv, 0.0, 1.0);
}
`,
      hints: [
        { id: "h1", content: "uv = gl_FragCoord.xy / iResolution.xy puts you in [0,1]." },
        { id: "h2", content: "fragColor = vec4(uv, 0.0, 1.0) packs uv.x into red, uv.y into green." },
      ],
      validation: {
        type: "pixel",
        rules: [
          { point: [0.0, 0.0], expected: [0, 0, 0], tolerance: 0.05 },
          { point: [1.0, 0.0], expected: [1, 0, 0], tolerance: 0.05 },
          { point: [0.0, 1.0], expected: [0, 1, 0], tolerance: 0.05 },
          { point: [1.0, 1.0], expected: [1, 1, 0], tolerance: 0.05 },
        ],
      },
    },
  ],
};
