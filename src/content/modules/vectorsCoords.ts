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

    {
      id: "vec-02-dot-product-cosine",
      title: "Dot product as cosine",
      module: "vectors-coords",
      difficulty: "easy",
      tags: ["dot", "vector"],
      taskType: "build",
      description:
        "Visualize the dot product. Each pixel's centered position p is a vector; output `max(0, dot(normalize(p), L))` as red, where L is fixed pointing to (1, 0).",
      goal: "Use the dot product as the cosine of the angle between p and a fixed direction.",
      expectedVisual:
        "A red half-disk fading to black: bright on the right side of the canvas, fully black on the left half.",
      starterCode: `void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 p  = uv * 2.0 - 1.0;
  p.x    *= iResolution.x / iResolution.y;

  // TODO: red = max(0, dot(normalize(p), vec2(1.0, 0.0)))
  fragColor = vec4(0.0, 0.0, 0.0, 1.0);
}
`,
      solutionCode: `void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 p  = uv * 2.0 - 1.0;
  p.x    *= iResolution.x / iResolution.y;

  vec2 L = vec2(1.0, 0.0);
  float c = max(0.0, dot(normalize(p), L));
  fragColor = vec4(c, 0.0, 0.0, 1.0);
}
`,
      hints: [
        { id: "h1", content: "Normalize p first; otherwise length cancels out and you get a value in screen units." },
        { id: "h2", content: "max(0.0, dot(...)) clips negative cosines (back-facing directions) to zero." },
      ],
      validation: { type: "function", validator: "gradientLeftRight" },
    },

    {
      id: "vec-03-cross-product-sign",
      title: "Cross product sign as side test",
      module: "vectors-coords",
      difficulty: "medium",
      tags: ["cross", "side-test"],
      taskType: "build",
      description:
        "Color the canvas based on which side of the line through (-0.5, -0.5) → (0.5, 0.5) each pixel lies on. Use the 2D cross product (a.x*b.y - a.y*b.x).",
      goal: "Use the sign of the 2D cross product as a left/right side test.",
      expectedVisual:
        "Two flat-colored half-planes split by a diagonal line: blue on one side, orange on the other.",
      starterCode: `float cross2(vec2 a, vec2 b) {
  // TODO
  return 0.0;
}

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 p  = uv * 2.0 - 1.0;
  p.x    *= iResolution.x / iResolution.y;

  vec2 a = vec2(-0.5, -0.5);
  vec2 b = vec2( 0.5,  0.5);
  float s = cross2(b - a, p - a);
  vec3 col = s > 0.0 ? vec3(0.95, 0.55, 0.20) : vec3(0.20, 0.45, 0.95);
  fragColor = vec4(col, 1.0);
}
`,
      solutionCode: `float cross2(vec2 a, vec2 b) {
  return a.x * b.y - a.y * b.x;
}

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 p  = uv * 2.0 - 1.0;
  p.x    *= iResolution.x / iResolution.y;

  vec2 a = vec2(-0.5, -0.5);
  vec2 b = vec2( 0.5,  0.5);
  float s = cross2(b - a, p - a);
  vec3 col = s > 0.0 ? vec3(0.95, 0.55, 0.20) : vec3(0.20, 0.45, 0.95);
  fragColor = vec4(col, 1.0);
}
`,
      hints: [
        { id: "h1", content: "The 2D cross product of (a, b) is `a.x * b.y - a.y * b.x` — a scalar." },
        { id: "h2", content: "Its sign tells you which side of vector a vector b lies on (left = positive)." },
      ],
      validation: {
        type: "pixel",
        rules: [
          { point: [0.1, 0.9], expected: [0.2, 0.45, 0.95], tolerance: 0.1 },
          { point: [0.9, 0.1], expected: [0.95, 0.55, 0.2], tolerance: 0.1 },
        ],
      },
    },

    {
      id: "vec-04-aspect-fix",
      title: "Fix the squashed circle",
      module: "vectors-coords",
      difficulty: "easy",
      tags: ["aspect", "uv", "debug"],
      taskType: "debug",
      description:
        "On a wide canvas this circle renders as a horizontal ellipse. Fix the coordinate setup so it stays round at any aspect ratio.",
      goal: "Apply aspect correction to the centered coordinate.",
      expectedVisual: "A perfectly round white disk on black, regardless of canvas width/height ratio.",
      starterCode: `void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 p  = uv * 2.0 - 1.0;
  // TODO: aspect-correct so the disk is a CIRCLE on a non-square canvas

  float d  = length(p) - 0.4;
  float aa = fwidth(d);
  float m  = 1.0 - smoothstep(-aa, aa, d);
  fragColor = vec4(vec3(m), 1.0);
}
`,
      solutionCode: `void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 p  = uv * 2.0 - 1.0;
  p.x    *= iResolution.x / iResolution.y;

  float d  = length(p) - 0.4;
  float aa = fwidth(d);
  float m  = 1.0 - smoothstep(-aa, aa, d);
  fragColor = vec4(vec3(m), 1.0);
}
`,
      hints: [
        { id: "h1", content: "x covers a wider range of pixels than y on a wide canvas — multiply p.x by aspect." },
        { id: "h2", content: "aspect = iResolution.x / iResolution.y." },
      ],
      validation: { type: "function", validator: "centeredDisk" },
    },

    {
      id: "vec-05-change-of-basis",
      title: "Rotate uv into a custom basis",
      module: "vectors-coords",
      difficulty: "medium",
      tags: ["basis", "dot", "rotation"],
      taskType: "build",
      description:
        "Given two orthonormal axis vectors u and v at 30° rotation, project the centered pixel onto (u, v) and use those projections as red/green channels.",
      goal: "Express a vector in a non-axis-aligned basis using dot products.",
      expectedVisual:
        "A red/green color field whose gradient axis is rotated 30° from horizontal.",
      starterCode: `void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 p  = uv * 2.0 - 1.0;
  p.x    *= iResolution.x / iResolution.y;

  float a = radians(30.0);
  vec2 U  = vec2(cos(a), sin(a));
  vec2 V  = vec2(-sin(a), cos(a));

  // TODO: pu = dot(p, U), pv = dot(p, V), pack into colour.
  fragColor = vec4(0.0, 0.0, 0.0, 1.0);
}
`,
      solutionCode: `void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 p  = uv * 2.0 - 1.0;
  p.x    *= iResolution.x / iResolution.y;

  float a = radians(30.0);
  vec2 U  = vec2(cos(a), sin(a));
  vec2 V  = vec2(-sin(a), cos(a));

  float pu = dot(p, U) * 0.5 + 0.5;
  float pv = dot(p, V) * 0.5 + 0.5;
  fragColor = vec4(pu, pv, 0.0, 1.0);
}
`,
      hints: [
        { id: "h1", content: "Coordinate of p in basis (U, V) is (dot(p, U), dot(p, V)) when U and V are unit and orthogonal." },
        { id: "h2", content: "Map [-1, 1] back into [0, 1] before writing as a colour." },
      ],
      validation: { type: "pattern", description: "A red/green gradient whose axes are visibly tilted ~30°." },
    },
  ],
};
