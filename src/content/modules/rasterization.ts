import type { Module } from "../../types";

/**
 * Module 12 — Rasterization (ssloy tinyrenderer lessons 1–3, 6).
 *
 * 2D fragment-shader implementations of the same techniques used in software
 * rasterizers: bounding-box triangle fill, barycentric coordinates as varying
 * interpolators, and a tiny z-buffer between two overlapping triangles.
 */
export const rasterizationModule: Module = {
  id: "rasterization",
  title: "Rasterization",
  blurb:
    "Triangles, barycentrics, and z-buffers — the math behind every GPU. Implemented at the pixel level in GLSL.",
  order: 12,
  lessons: [
    {
      id: "barycentric",
      title: "Barycentric coordinates",
      theory: `Given a triangle (A, B, C) and a point P, barycentric coordinates (α, β, γ) are the unique weights such that P = αA + βB + γC and α + β + γ = 1.

P is inside the triangle iff all three are in [0, 1]. They're also exactly the weights you use to interpolate any per-vertex attribute (color, uv, normal) across the triangle:

  attr(P) = α·attr(A) + β·attr(B) + γ·attr(C)`,
      example: `// 2D Cramer's rule, fast version
vec3 bary(vec2 A, vec2 B, vec2 C, vec2 P) {
  vec2 v0 = B - A, v1 = C - A, v2 = P - A;
  float d = v0.x * v1.y - v1.x * v0.y;
  float v = (v2.x * v1.y - v1.x * v2.y) / d;
  float w = (v0.x * v2.y - v2.x * v0.y) / d;
  return vec3(1.0 - v - w, v, w);
}`,
    },
  ],
  tasks: [
    {
      id: "rast-01-triangle-fill",
      title: "Triangle fill",
      module: "rasterization",
      difficulty: "medium",
      tags: ["triangle", "barycentric"],
      taskType: "build",
      description:
        "Fill a triangle with vertices A=(-0.5,-0.4), B=(0.5,-0.4), C=(0.0,0.5) by computing barycentric coordinates per pixel and testing all-positive.",
      goal: "Implement an inside-triangle test using barycentrics.",
      expectedVisual: "A flat white isoceles triangle pointing up, on a black background.",
      starterCode: `vec3 bary(vec2 A, vec2 B, vec2 C, vec2 P) {
  // TODO: return barycentric coords (alpha, beta, gamma).
  return vec3(-1.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 P  = uv * 2.0 - 1.0;
  P.x    *= iResolution.x / iResolution.y;

  vec3 b = bary(vec2(-0.5, -0.4), vec2(0.5, -0.4), vec2(0.0, 0.5), P);
  float inside = step(0.0, min(min(b.x, b.y), b.z));
  fragColor = vec4(vec3(inside), 1.0);
}
`,
      solutionCode: `vec3 bary(vec2 A, vec2 B, vec2 C, vec2 P) {
  vec2 v0 = B - A, v1 = C - A, v2 = P - A;
  float d = v0.x * v1.y - v1.x * v0.y;
  float v = (v2.x * v1.y - v1.x * v2.y) / d;
  float w = (v0.x * v2.y - v2.x * v0.y) / d;
  return vec3(1.0 - v - w, v, w);
}

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 P  = uv * 2.0 - 1.0;
  P.x    *= iResolution.x / iResolution.y;

  vec3 b = bary(vec2(-0.5, -0.4), vec2(0.5, -0.4), vec2(0.0, 0.5), P);
  float inside = step(0.0, min(min(b.x, b.y), b.z));
  fragColor = vec4(vec3(inside), 1.0);
}
`,
      hints: [
        { id: "h1", content: "Solve P - A = β(B - A) + γ(C - A) for (β, γ) using Cramer's rule." },
        { id: "h2", content: "α = 1 - β - γ. Inside iff all three are non-negative." },
      ],
      validation: {
        type: "pixel",
        rules: [
          { point: [0.5, 0.4], expected: [1, 1, 1], tolerance: 0.1 },
          { point: [0.05, 0.05], expected: [0, 0, 0], tolerance: 0.05 },
          { point: [0.95, 0.95], expected: [0, 0, 0], tolerance: 0.05 },
        ],
      },
    },

    {
      id: "rast-02-rgb-triangle",
      title: "Interpolate vertex colours",
      module: "rasterization",
      difficulty: "medium",
      tags: ["barycentric", "interpolation", "varying"],
      taskType: "modify",
      description:
        "The triangle is filled flat. Interpolate per-vertex colours red / green / blue across it using barycentrics.",
      goal: "Use barycentric weights to blend per-vertex attributes.",
      expectedVisual:
        "A triangle with red at the bottom-left, green at the bottom-right, blue at the top, and smooth colour blends in between.",
      starterCode: `vec3 bary(vec2 A, vec2 B, vec2 C, vec2 P) {
  vec2 v0 = B - A, v1 = C - A, v2 = P - A;
  float d = v0.x * v1.y - v1.x * v0.y;
  float v = (v2.x * v1.y - v1.x * v2.y) / d;
  float w = (v0.x * v2.y - v2.x * v0.y) / d;
  return vec3(1.0 - v - w, v, w);
}

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 P  = uv * 2.0 - 1.0;
  P.x    *= iResolution.x / iResolution.y;

  vec2 A = vec2(-0.5, -0.4), B = vec2(0.5, -0.4), C = vec2(0.0, 0.5);
  vec3 b = bary(A, B, C, P);
  if (min(min(b.x, b.y), b.z) < 0.0) { fragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }

  // TODO: per-vertex colours r, g, b — interpolate with the bary weights.
  vec3 col = vec3(1.0);
  fragColor = vec4(col, 1.0);
}
`,
      solutionCode: `vec3 bary(vec2 A, vec2 B, vec2 C, vec2 P) {
  vec2 v0 = B - A, v1 = C - A, v2 = P - A;
  float d = v0.x * v1.y - v1.x * v0.y;
  float v = (v2.x * v1.y - v1.x * v2.y) / d;
  float w = (v0.x * v2.y - v2.x * v0.y) / d;
  return vec3(1.0 - v - w, v, w);
}

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 P  = uv * 2.0 - 1.0;
  P.x    *= iResolution.x / iResolution.y;

  vec2 A = vec2(-0.5, -0.4), B = vec2(0.5, -0.4), C = vec2(0.0, 0.5);
  vec3 b = bary(A, B, C, P);
  if (min(min(b.x, b.y), b.z) < 0.0) { fragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }

  vec3 ca = vec3(1.0, 0.0, 0.0);
  vec3 cb = vec3(0.0, 1.0, 0.0);
  vec3 cc = vec3(0.0, 0.0, 1.0);
  vec3 col = b.x * ca + b.y * cb + b.z * cc;
  fragColor = vec4(col, 1.0);
}
`,
      hints: [
        { id: "h1", content: "color(P) = α * c_A + β * c_B + γ * c_C — the same weights used for the inside test." },
      ],
      validation: {
        type: "pixel",
        rules: [
          // Near vertex A (bottom-left of triangle), uv ≈ (~0.25, 0.3) → red.
          { point: [0.27, 0.32], expected: [0.7, 0.1, 0.1], tolerance: 0.4 },
          // Near vertex B (bottom-right), uv ≈ (~0.75, 0.3) → green.
          { point: [0.73, 0.32], expected: [0.1, 0.7, 0.1], tolerance: 0.4 },
          // Near vertex C (top), uv ≈ (0.5, 0.72) → blue.
          { point: [0.5, 0.72], expected: [0.1, 0.1, 0.7], tolerance: 0.4 },
        ],
      },
    },

    {
      id: "rast-03-zbuffer",
      title: "Z-buffer two triangles",
      module: "rasterization",
      difficulty: "hard",
      tags: ["zbuffer", "depth"],
      taskType: "build",
      description:
        "Two coloured triangles overlap. Each has a constant depth (z value). Render only the nearer triangle in each overlapping region.",
      goal: "Implement the z-buffer test in a fragment shader.",
      expectedVisual:
        "A red triangle and a blue triangle overlapping; the red one is in FRONT of the blue, so it covers the overlap.",
      starterCode: `vec3 bary(vec2 A, vec2 B, vec2 C, vec2 P) {
  vec2 v0 = B - A, v1 = C - A, v2 = P - A;
  float d = v0.x * v1.y - v1.x * v0.y;
  float v = (v2.x * v1.y - v1.x * v2.y) / d;
  float w = (v0.x * v2.y - v2.x * v0.y) / d;
  return vec3(1.0 - v - w, v, w);
}

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 P  = uv * 2.0 - 1.0;
  P.x    *= iResolution.x / iResolution.y;

  vec2 A1 = vec2(-0.6, -0.3), B1 = vec2( 0.0, -0.3), C1 = vec2(-0.3,  0.4);
  vec2 A2 = vec2(-0.2, -0.4), B2 = vec2( 0.6, -0.4), C2 = vec2( 0.2,  0.3);

  vec3 b1 = bary(A1, B1, C1, P);
  vec3 b2 = bary(A2, B2, C2, P);
  bool in1 = min(min(b1.x, b1.y), b1.z) >= 0.0;
  bool in2 = min(min(b2.x, b2.y), b2.z) >= 0.0;

  float z1 = 0.2;   // nearer
  float z2 = 0.6;

  // TODO: write the colour of whichever triangle has the SMALLER z;
  // if neither covers, write black.
  vec3 col = vec3(0.0);
  fragColor = vec4(col, 1.0);
}
`,
      solutionCode: `vec3 bary(vec2 A, vec2 B, vec2 C, vec2 P) {
  vec2 v0 = B - A, v1 = C - A, v2 = P - A;
  float d = v0.x * v1.y - v1.x * v0.y;
  float v = (v2.x * v1.y - v1.x * v2.y) / d;
  float w = (v0.x * v2.y - v2.x * v0.y) / d;
  return vec3(1.0 - v - w, v, w);
}

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 P  = uv * 2.0 - 1.0;
  P.x    *= iResolution.x / iResolution.y;

  vec2 A1 = vec2(-0.6, -0.3), B1 = vec2( 0.0, -0.3), C1 = vec2(-0.3,  0.4);
  vec2 A2 = vec2(-0.2, -0.4), B2 = vec2( 0.6, -0.4), C2 = vec2( 0.2,  0.3);

  vec3 b1 = bary(A1, B1, C1, P);
  vec3 b2 = bary(A2, B2, C2, P);
  bool in1 = min(min(b1.x, b1.y), b1.z) >= 0.0;
  bool in2 = min(min(b2.x, b2.y), b2.z) >= 0.0;

  float z1 = 0.2;
  float z2 = 0.6;

  float bestZ = 1e9;
  vec3 col = vec3(0.0);
  if (in1 && z1 < bestZ) { bestZ = z1; col = vec3(0.95, 0.25, 0.20); }
  if (in2 && z2 < bestZ) { bestZ = z2; col = vec3(0.20, 0.40, 0.95); }
  fragColor = vec4(col, 1.0);
}
`,
      hints: [
        { id: "h1", content: "Track the smallest z seen so far and the colour that produced it." },
        { id: "h2", content: "Replace bestZ and colour ONLY when the candidate's z is strictly smaller." },
      ],
      validation: {
        type: "pixel",
        rules: [
          // Overlap area should show the nearer (red) triangle.
          { point: [0.42, 0.45], expected: [0.95, 0.25, 0.2], tolerance: 0.4 },
        ],
      },
    },
  ],
};
