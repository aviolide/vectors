import type { Module } from "../../types";

/**
 * Module 15 — Raycasting (ssloy tinyraycaster).
 *
 * The Wolfenstein 3D trick: instead of full ray tracing, cast one ray per
 * screen column from a 2D player into a 2D map; column height ∝ 1/distance.
 * Implemented entirely inside a fragment shader by treating uv.x as the
 * column index.
 */
export const raycastingModule: Module = {
  id: "raycasting",
  title: "Raycasting (FPS)",
  blurb:
    "Wolfenstein 3D in a fragment shader: 2D rays into a tile map, column heights from inverse distance, and fisheye correction.",
  order: 15,
  lessons: [
    {
      id: "wolfenstein",
      title: "How Wolfenstein 3D worked",
      theory: `Cast ONE ray per screen column. Each ray walks along its angle until it hits a wall in a 2D grid map. Wall column height on screen is inversely proportional to the hit distance:

  height = SCREEN_HEIGHT * WALL_HEIGHT / distance

Two pitfalls:
1. **Fisheye**: rays at the edges of the FOV are longer just from being angled, not because the wall is far. Multiply by cos(rayAngle - playerAngle) to flatten.
2. **Stepping**: the cleanest implementation is "DDA" — step from grid line to grid line — but a small per-step march works too for teaching.`,
    },
  ],
  tasks: [
    {
      id: "rc-01-column-heights",
      title: "Column heights from a fixed-distance map",
      module: "raycasting",
      difficulty: "medium",
      tags: ["raycast", "fps"],
      taskType: "build",
      description:
        "Pretend you've already cast 1 ray per column and recovered its hit distance from a fake function distance(u). Convert that distance into a vertical wall column height and shade.",
      goal: "Render `height = WALL_HEIGHT / distance` as a centered band per column.",
      expectedVisual:
        "Vertical 'wall' bars of varying heights — taller in the middle, shorter at the edges (the simulated wall is closer at u≈0.5).",
      starterCode: `float fakeDistance(float u) {
  // pretend a synthetic wall: closest at u=0.5, farthest at edges.
  return 0.5 + 1.5 * abs(u - 0.5);
}

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  float d = fakeDistance(uv.x);
  float wallHeight = 0.6;

  // TODO: column half-height = wallHeight / d / 2 (clamped).
  // pixel is wall iff |uv.y - 0.5| < halfH.
  float wall = 0.0;
  vec3 col = wall > 0.0 ? vec3(0.7, 0.55, 0.4) / d : vec3(0.05, 0.06, 0.1);
  fragColor = vec4(col, 1.0);
}
`,
      solutionCode: `float fakeDistance(float u) {
  return 0.5 + 1.5 * abs(u - 0.5);
}

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  float d = fakeDistance(uv.x);
  float wallHeight = 0.6;

  float halfH = clamp(wallHeight / d * 0.5, 0.0, 0.5);
  float wall = step(abs(uv.y - 0.5), halfH);
  vec3 col = wall > 0.0 ? vec3(0.7, 0.55, 0.4) / d : vec3(0.05, 0.06, 0.1);
  fragColor = vec4(col, 1.0);
}
`,
      hints: [
        { id: "h1", content: "halfHeight = wallHeight / distance / 2 — clamp to [0, 0.5] to keep on-screen." },
        { id: "h2", content: "Pixel is on the wall iff |uv.y - 0.5| < halfHeight." },
        { id: "h3", content: "Divide colour by d for cheap distance-based darkening." },
      ],
      validation: {
        type: "pixel",
        rules: [
          // Centre column should be wall (closest, d=0.5 → half height 0.6).
          { point: [0.5, 0.5], expected: [1.4, 1.1, 0.8], tolerance: 0.6 },
          // Top of canvas — sky.
          { point: [0.5, 0.97], expected: [0.05, 0.06, 0.1], tolerance: 0.1 },
        ],
      },
    },

    {
      id: "rc-02-2d-ray-march-map",
      title: "Cast a real ray into a tile map",
      module: "raycasting",
      difficulty: "hard",
      tags: ["raycast", "tile", "march"],
      taskType: "build",
      description:
        "Turn uv.x into a ray angle across an FOV of 60°. March that ray into a tiled grid: walls live where `((floor(p.x) + floor(p.y)) mod 2) == 0`. Render the wall column with fisheye correction.",
      goal: "Combine ray casting, march-step, fisheye correction, and inverse-distance column drawing.",
      expectedVisual:
        "A first-person view of a checkerboard 'world': vertical wall bands of various heights, darker the further away.",
      starterCode: `bool isWall(vec2 p) {
  vec2 c = floor(p);
  return mod(c.x + c.y, 2.0) < 0.5;
}

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;

  float fov   = radians(60.0);
  float angle = (uv.x - 0.5) * fov;
  vec2  ro    = vec2(0.5, 0.5);
  vec2  rd    = vec2(cos(angle), sin(angle));

  // TODO: march; on hit, compute corrected distance and a column-height test.
  fragColor = vec4(0.0, 0.0, 0.0, 1.0);
}
`,
      solutionCode: `bool isWall(vec2 p) {
  vec2 c = floor(p);
  return mod(c.x + c.y, 2.0) < 0.5;
}

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;

  float fov   = radians(60.0);
  float angle = (uv.x - 0.5) * fov;
  vec2  ro    = vec2(0.5, 0.5);
  vec2  rd    = vec2(cos(angle), sin(angle));

  float t = 0.0;
  bool hit = false;
  for (int i = 0; i < 128; i++) {
    vec2 p = ro + t * rd;
    if (isWall(p)) { hit = true; break; }
    t += 0.02;
    if (t > 6.0) break;
  }

  if (!hit) { fragColor = vec4(0.05, 0.06, 0.1, 1.0); return; }

  // fisheye correction: project onto the player's forward direction.
  float dCorr = t * cos(angle);
  float halfH = clamp(0.6 / dCorr * 0.5, 0.0, 0.5);
  if (abs(uv.y - 0.5) < halfH) {
    vec3 col = vec3(0.75, 0.55, 0.35) / (1.0 + dCorr * 0.7);
    fragColor = vec4(col, 1.0);
  } else {
    fragColor = vec4(0.05, 0.06, 0.1, 1.0);
  }
}
`,
      hints: [
        { id: "h1", content: "Per pixel column: angle = (uv.x - 0.5) * FOV; rd = (cos(angle), sin(angle))." },
        { id: "h2", content: "March in small steps (0.02) and stop on the first wall cell." },
        { id: "h3", content: "Distance correction: dCorr = t * cos(angle) — REQUIRED to remove fisheye." },
        { id: "h4", content: "Column half-height = wallHeight / dCorr / 2." },
      ],
      validation: { type: "pattern", description: "Vertical wall bands of varying height — first-person checkerboard view." },
    },
  ],
};
