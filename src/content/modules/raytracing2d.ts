import type { Module } from "../../types";

/**
 * Module 13 — Ray tracing in 2D (ssloy tinyraytracer parts 1–3, simplified).
 *
 * Real ray-shape intersections — analytic ray–disk and ray–segment, then
 * a recursive bounce. Everything runs in 2D so the math stays visible.
 */
export const raytracing2dModule: Module = {
  id: "raytracing2d",
  title: "Ray Tracing (2D)",
  blurb:
    "Cast rays. Intersect shapes analytically. Bounce them. The mental model that scales straight up to 3D rendering.",
  order: 13,
  lessons: [
    {
      id: "ray-disk",
      title: "Ray–disk intersection",
      theory: `A ray is r(t) = o + t·d, t ≥ 0. A disk of centre c and radius R is ||p - c|| = R.

Substituting and squaring:
  ||o + t·d - c||² = R²
  (let f = o - c)
  t² (d·d) + 2t (f·d) + (f·f - R²) = 0

Quadratic in t. Discriminant = (f·d)² - (d·d)(f·f - R²). If negative → miss. Otherwise the smaller positive root is the entry point.`,
    },
  ],
  tasks: [
    {
      id: "rt-01-ray-disk-mask",
      title: "Ray–disk hit mask",
      module: "raytracing2d",
      difficulty: "medium",
      tags: ["ray", "disk", "intersect"],
      taskType: "build",
      description:
        "Each pixel is treated as a parallel ray pointing along +x. From its uv y-position, decide if the ray would hit a disk centred at (0.3, 0.0) with radius 0.25. Output white on hit, black on miss.",
      goal: "Solve the ray–disk quadratic for t and check that its discriminant is non-negative.",
      expectedVisual:
        "A horizontal white band whose vertical thickness equals the disk's diameter, against black above and below.",
      starterCode: `void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 p  = uv * 2.0 - 1.0;
  p.x    *= iResolution.x / iResolution.y;

  vec2 ro = vec2(-1.0, p.y);
  vec2 rd = vec2(1.0, 0.0);
  vec2 c  = vec2(0.3, 0.0);
  float R = 0.25;

  // TODO: discriminant of the ray-disk quadratic.
  float hit = 0.0;

  fragColor = vec4(vec3(hit), 1.0);
}
`,
      solutionCode: `void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 p  = uv * 2.0 - 1.0;
  p.x    *= iResolution.x / iResolution.y;

  vec2 ro = vec2(-1.0, p.y);
  vec2 rd = vec2(1.0, 0.0);
  vec2 c  = vec2(0.3, 0.0);
  float R = 0.25;

  vec2 f = ro - c;
  float a = dot(rd, rd);
  float b = dot(f, rd);
  float k = dot(f, f) - R * R;
  float disc = b * b - a * k;

  float hit = step(0.0, disc);
  fragColor = vec4(vec3(hit), 1.0);
}
`,
      hints: [
        { id: "h1", content: "f = ro - c. Then disc = (f·d)² - (d·d)(f·f - R²)." },
        { id: "h2", content: "step(0.0, disc) gives white wherever the ray hits the disk." },
      ],
      validation: {
        type: "pixel",
        rules: [
          { point: [0.5, 0.5], expected: [1, 1, 1], tolerance: 0.05 }, // through the disk
          { point: [0.5, 0.95], expected: [0, 0, 0], tolerance: 0.05 },
          { point: [0.5, 0.05], expected: [0, 0, 0], tolerance: 0.05 },
        ],
      },
    },

    {
      id: "rt-02-ray-disk-shading",
      title: "Shade the hit point",
      module: "raytracing2d",
      difficulty: "hard",
      tags: ["ray", "shading", "lambert"],
      taskType: "build",
      description:
        "Cast rays from the camera at (0,0) through each pixel direction. If the ray hits a disk at (0.3, 0.0) of radius 0.25, shade the surface with Lambert against a light at (-0.5, 0.5).",
      goal: "Combine ray–disk intersection with N·L surface shading.",
      expectedVisual:
        "A 2D 'sphere' rendered with a smooth bright-to-dark gradient; brighter on the upper-left side facing the light.",
      starterCode: `void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 p  = uv * 2.0 - 1.0;
  p.x    *= iResolution.x / iResolution.y;

  vec2 ro = vec2(0.0, 0.0);
  vec2 rd = normalize(p);
  vec2 c  = vec2(0.6, 0.0);
  float R = 0.25;
  vec2 light = vec2(-0.5, 0.5);

  // TODO:
  // 1. solve the quadratic for t (smaller positive root).
  // 2. hit = ro + t * rd
  // 3. N = (hit - c) / R
  // 4. shade = max(0, dot(N, normalize(light - hit))).

  fragColor = vec4(0.0, 0.0, 0.0, 1.0);
}
`,
      solutionCode: `void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 p  = uv * 2.0 - 1.0;
  p.x    *= iResolution.x / iResolution.y;

  vec2 ro = vec2(0.0, 0.0);
  vec2 rd = normalize(p);
  vec2 c  = vec2(0.6, 0.0);
  float R = 0.25;
  vec2 light = vec2(-0.5, 0.5);

  vec2 f = ro - c;
  float a = dot(rd, rd);
  float b = dot(f, rd);
  float k = dot(f, f) - R * R;
  float disc = b * b - a * k;
  if (disc < 0.0) { fragColor = vec4(0.05, 0.06, 0.10, 1.0); return; }

  float t = (-b - sqrt(disc)) / a;
  if (t < 0.0) { fragColor = vec4(0.05, 0.06, 0.10, 1.0); return; }

  vec2 hit = ro + t * rd;
  vec2 N   = (hit - c) / R;
  vec2 L   = normalize(light - hit);
  float shade = max(dot(N, L), 0.0);
  fragColor = vec4(vec3(shade), 1.0);
}
`,
      hints: [
        { id: "h1", content: "Smaller positive root: t = (-b - sqrt(disc)) / a." },
        { id: "h2", content: "Surface normal at the hit on a circle is just (hit - centre) / radius." },
        { id: "h3", content: "Discard rays that miss (disc < 0) or hit behind the camera (t < 0)." },
      ],
      validation: {
        type: "pixel",
        rules: [
          // Camera at origin, rd through pixel — pixel near the disk centre projects to the disk's leftmost (lit) side.
          { point: [0.55, 0.5], expected: [0.6, 0.6, 0.6], tolerance: 0.5 },
          // Far corner: background.
          { point: [0.05, 0.05], expected: [0.05, 0.06, 0.10], tolerance: 0.1 },
        ],
      },
    },
  ],
};
