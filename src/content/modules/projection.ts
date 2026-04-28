import type { Module } from "../../types";

/**
 * Module 11 — Projection & cameras (ssloy tinyrenderer lessons 4–5).
 *
 * Teaches the 4-stage transform pipeline `Viewport · Projection · View · Model`,
 * homogeneous coordinates, perspective divide, and the `gluLookAt`
 * change-of-basis camera. Examples are 2D so they fit one fragment shader.
 */
export const projectionModule: Module = {
  id: "projection",
  title: "Projection & Cameras",
  blurb:
    "From homogeneous coordinates to gluLookAt — the transform pipeline that turns 3D points into pixels.",
  order: 11,
  lessons: [
    {
      id: "homogeneous",
      title: "Why a 4th coordinate?",
      theory: `In 3D you can rotate and scale with a 3×3 matrix, but translation is an addition — it doesn't fit. The trick: embed every point (x, y, z) as (x, y, z, 1). Now translation IS a matrix multiply. Bonus: the same trick lets us encode perspective by writing a non-trivial fourth row, then "dividing by w" at the end.

The pipeline becomes a single 4×4 matrix M such that screen.xy = (M · point).xy / (M · point).w.`,
      example: `mat4 T = mat4(1.0); T[3].xyz = vec3(2.0, 0.0, 0.0); // translate by (2,0,0)`,
    },
    {
      id: "lookat",
      title: "gluLookAt as change of basis",
      theory: `Given eye, center, up:
  z = normalize(eye - center);   // view direction (out of screen)
  x = normalize(cross(up, z));   // right
  y = cross(z, x);               // recomputed up

The view matrix moves the world INTO that camera basis: it's the transpose of [x | y | z], times a translation that puts the eye at the origin. You're not moving the camera — you're moving the world so the camera lives at (0,0,0) looking down -z.`,
    },
  ],
  tasks: [
    {
      id: "proj-01-perspective-grid",
      title: "Perspective grid lines",
      module: "projection",
      difficulty: "medium",
      tags: ["projection", "perspective"],
      taskType: "build",
      description:
        "Render a horizontal grid lying on the plane y = -0.5, viewed from the camera at the origin. Each cell projects smaller as it recedes.",
      goal: "Apply the perspective formula `screen.x = world.x / (1 - world.z / c)` to figure out which pixel sees which world cell.",
      expectedVisual:
        "Dark canvas with horizontal lines that get closer together near the horizon — classic vanishing-point grid.",
      starterCode: `void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 p  = uv * 2.0 - 1.0;
  p.x    *= iResolution.x / iResolution.y;

  // Reconstruct world coords on the floor plane y = -0.5
  // Forward projection: screen.y = world.y / (1 - world.z / c)
  // We KNOW world.y = -0.5; solve for world.z:
  //   world.z = c * (1 + world.y / screen.y)
  // Then world.x = screen.x * (1 - world.z / c)
  // TODO: compute world.x, world.z and check if either falls on a grid line.

  fragColor = vec4(0.0, 0.0, 0.0, 1.0);
}
`,
      solutionCode: `void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 p  = uv * 2.0 - 1.0;
  p.x    *= iResolution.x / iResolution.y;

  if (p.y >= 0.0) { fragColor = vec4(0.05, 0.06, 0.10, 1.0); return; } // sky

  float c = 2.0;
  float wy = -0.5;
  float wz = c * (1.0 + wy / p.y);
  float wx = p.x * (1.0 - wz / c);

  vec2 g = abs(fract(vec2(wx, wz) - 0.5) - 0.5);
  float line = min(g.x, g.y);
  float aa = fwidth(line);
  float m = 1.0 - smoothstep(0.0, 0.04 + aa, line);
  vec3 col = mix(vec3(0.05), vec3(0.85, 0.9, 1.0), m);
  fragColor = vec4(col, 1.0);
}
`,
      hints: [
        { id: "h1", content: "We know world.y = -0.5, so the perspective formula `screen.y = world.y / (1 - world.z/c)` lets us solve for world.z first." },
        { id: "h2", content: "Then world.x = screen.x * (1 - world.z/c)." },
        { id: "h3", content: "A grid line at integer x or z is fract(world - 0.5) close to 0.5 — abs(fract(w) - 0.5) gives distance to the nearest line." },
      ],
      validation: { type: "pattern", description: "Receding grid with a clear vanishing point." },
    },

    {
      id: "proj-02-look-at-2d",
      title: "Build lookAt in 2D",
      module: "projection",
      difficulty: "hard",
      tags: ["lookat", "basis", "camera"],
      taskType: "build",
      description:
        "A 2D 'camera' lives at eye = (0.4, 0.0) looking at center = (0, 0). Build the view matrix that brings world points into the camera's basis, then render a horizontal stripe pattern in WORLD space — the stripes will appear rotated according to the camera's orientation.",
      goal: "Construct an orthonormal basis from (eye, center) and use its transpose as the view matrix.",
      expectedVisual:
        "Diagonal alternating black/white stripes (the camera looks at the origin from 'east-ish', so world horizontals tilt).",
      starterCode: `void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 p  = uv * 2.0 - 1.0;
  p.x    *= iResolution.x / iResolution.y;

  vec2 eye    = vec2(0.4, 0.0);
  vec2 center = vec2(0.0, 0.0);

  // TODO:
  // 1. forward = normalize(eye - center)  (camera's local -y in 2D? we'll use it as 'up')
  // 2. right   = (forward.y, -forward.x)  (perpendicular)
  // 3. world point = right * p.x + forward * p.y + eye
  // 4. stripe by world.y
  vec2 world = p;
  float s = step(0.0, sin(world.y * 12.0));
  fragColor = vec4(vec3(s), 1.0);
}
`,
      solutionCode: `void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 p  = uv * 2.0 - 1.0;
  p.x    *= iResolution.x / iResolution.y;

  vec2 eye    = vec2(0.4, 0.0);
  vec2 center = vec2(0.0, 0.0);

  vec2 forward = normalize(eye - center);
  vec2 right   = vec2(forward.y, -forward.x);
  vec2 world   = right * p.x + forward * p.y + eye;

  float s = step(0.0, sin(world.y * 12.0));
  fragColor = vec4(vec3(s), 1.0);
}
`,
      hints: [
        { id: "h1", content: "In 2D, the rotated 'right' is just the 90° rotation of forward: (forward.y, -forward.x)." },
        { id: "h2", content: "World position = right * p.x + forward * p.y + eye. That IS the inverse of the view matrix applied to camera-space p." },
        { id: "h3", content: "Stripe by sin(world.y * k) and step(0, ...) for hard bands." },
      ],
      validation: { type: "pattern", description: "Diagonal alternating black/white stripes." },
    },
  ],
};
