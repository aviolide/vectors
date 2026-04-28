import type { Module } from "../../types";

/**
 * Module 14 — Sphere tracing / raymarching (ssloy tinykaboom).
 *
 * The killer trick: when shapes are SDFs, the next safe step along a ray is
 * exactly the SDF value at the current point. Iterate, and you converge to
 * the surface. Used everywhere from Shadertoy to Inigo Quilez's everything.
 */
export const raymarchingModule: Module = {
  id: "raymarching",
  title: "Sphere Tracing",
  blurb:
    "March rays through SDF fields. Get free shadows, AO, and analytic normals from the same distance function.",
  order: 14,
  lessons: [
    {
      id: "march-loop",
      title: "The march loop",
      theory: `Start at the ray origin. Step forward by the SDF value (the largest distance you can move without crossing a surface). Repeat. If your accumulated distance exceeds a max, you missed; if the SDF gets smaller than ε, you hit.

  float t = 0.0;
  for (int i = 0; i < 64; i++) {
    vec2 p = ro + t * rd;
    float d = sdf(p);
    if (d < 1e-3) break;        // hit
    t += d;
    if (t > 4.0) break;          // miss
  }

The same loop works in 3D — and the same SDF you use to RENDER is the one you use for shadows and AO.`,
    },
  ],
  tasks: [
    {
      id: "rm-01-march-disk",
      title: "March a 2D ray onto a disk",
      module: "raymarching",
      difficulty: "medium",
      tags: ["raymarch", "sdf"],
      taskType: "build",
      description:
        "Cast a ray from the origin through each pixel and step along it using the SDF of a disk at (0.5, 0.0), radius 0.25. Output white on a hit, black otherwise.",
      goal: "Implement the sphere-tracing loop with up to 64 steps.",
      expectedVisual:
        "A 2D disk rendered in white through ray-marching (visually identical to other disk renders, but reached via marching).",
      starterCode: `float sdDisk(vec2 p) { return length(p - vec2(0.5, 0.0)) - 0.25; }

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 p  = uv * 2.0 - 1.0;
  p.x    *= iResolution.x / iResolution.y;

  vec2 ro = vec2(0.0, 0.0);
  vec2 rd = normalize(p);

  // TODO: march up to 64 steps; declare hit if d < 1e-3, miss if t > 4.
  float hit = 0.0;
  fragColor = vec4(vec3(hit), 1.0);
}
`,
      solutionCode: `float sdDisk(vec2 p) { return length(p - vec2(0.5, 0.0)) - 0.25; }

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 p  = uv * 2.0 - 1.0;
  p.x    *= iResolution.x / iResolution.y;

  vec2 ro = vec2(0.0, 0.0);
  vec2 rd = normalize(p);

  float t = 0.0;
  float hit = 0.0;
  for (int i = 0; i < 64; i++) {
    vec2 q = ro + t * rd;
    float d = sdDisk(q);
    if (d < 1e-3) { hit = 1.0; break; }
    t += d;
    if (t > 4.0) break;
  }
  fragColor = vec4(vec3(hit), 1.0);
}
`,
      hints: [
        { id: "h1", content: "Step size = sdf(current point). Don't multiply it down — that's the whole speed of sphere tracing." },
        { id: "h2", content: "Hit threshold around 1e-3; miss threshold around 4 units along the ray." },
      ],
      validation: {
        type: "pixel",
        rules: [
          { point: [0.7, 0.5], expected: [1, 1, 1], tolerance: 0.1 },
          { point: [0.05, 0.05], expected: [0, 0, 0], tolerance: 0.05 },
        ],
      },
    },

    {
      id: "rm-02-fd-normals",
      title: "Finite-difference normals",
      module: "raymarching",
      difficulty: "hard",
      tags: ["raymarch", "normal", "fd"],
      taskType: "build",
      description:
        "Once you have the hit point, recover the surface normal by sampling the SDF at four nearby points: N = normalize(vec2(sdf(p+e.x) - sdf(p-e.x), sdf(p+e.y) - sdf(p-e.y))). Shade with Lambert against light at (-1, 1).",
      goal: "Use the SDF gradient (finite differences) as a normal.",
      expectedVisual:
        "A smoothly shaded ball with a soft gradient driven by the local SDF gradient.",
      starterCode: `float sdf(vec2 p) { return length(p - vec2(0.5, 0.0)) - 0.25; }

vec2 calcNormal(vec2 p) {
  // TODO: e = vec2(1e-3, 0); N = normalize(vec2(sdf(p+e.xy) - sdf(p-e.xy), sdf(p+e.yx) - sdf(p-e.yx)))
  return vec2(0.0, 1.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 p  = uv * 2.0 - 1.0;
  p.x    *= iResolution.x / iResolution.y;

  vec2 ro = vec2(0.0, 0.0);
  vec2 rd = normalize(p);

  float t = 0.0; vec2 q;
  bool hit = false;
  for (int i = 0; i < 64; i++) {
    q = ro + t * rd;
    float d = sdf(q);
    if (d < 1e-3) { hit = true; break; }
    t += d;
    if (t > 4.0) break;
  }

  if (!hit) { fragColor = vec4(0.05, 0.06, 0.10, 1.0); return; }

  vec2 N = calcNormal(q);
  vec2 L = normalize(vec2(-1.0, 1.0));
  float shade = max(dot(N, L), 0.0);
  fragColor = vec4(vec3(shade), 1.0);
}
`,
      solutionCode: `float sdf(vec2 p) { return length(p - vec2(0.5, 0.0)) - 0.25; }

vec2 calcNormal(vec2 p) {
  vec2 e = vec2(1e-3, 0.0);
  return normalize(vec2(
    sdf(p + e.xy) - sdf(p - e.xy),
    sdf(p + e.yx) - sdf(p - e.yx)
  ));
}

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 p  = uv * 2.0 - 1.0;
  p.x    *= iResolution.x / iResolution.y;

  vec2 ro = vec2(0.0, 0.0);
  vec2 rd = normalize(p);

  float t = 0.0; vec2 q;
  bool hit = false;
  for (int i = 0; i < 64; i++) {
    q = ro + t * rd;
    float d = sdf(q);
    if (d < 1e-3) { hit = true; break; }
    t += d;
    if (t > 4.0) break;
  }

  if (!hit) { fragColor = vec4(0.05, 0.06, 0.10, 1.0); return; }

  vec2 N = calcNormal(q);
  vec2 L = normalize(vec2(-1.0, 1.0));
  float shade = max(dot(N, L), 0.0);
  fragColor = vec4(vec3(shade), 1.0);
}
`,
      hints: [
        { id: "h1", content: "The gradient of the SDF IS the normal direction." },
        { id: "h2", content: "Use a tiny ε (1e-3) and sample the SDF at p±ε along each axis." },
      ],
      validation: { type: "pattern", description: "Smoothly shaded disk with a clear bright-to-dark gradient." },
    },
  ],
};
