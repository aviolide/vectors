import type { Module } from "../../types";

export const lightingModule: Module = {
  id: "lighting",
  title: "Lighting & Dot Product",
  blurb:
    "Dot product is the heart of shading: it measures how much a surface faces the light.",
  order: 5,
  lessons: [
    {
      id: "dot-as-cosine",
      title: "Dot product = cosine of the angle",
      theory: `For unit vectors, dot(a, b) is cos(θ) where θ is the angle between them. That's why max(dot(N, L), 0.0) is the standard Lambert term: it's full bright when the surface normal N faces the light L, fades to zero at 90°, and we clamp to ignore the back side.`,
    },
  ],
  tasks: [
    {
      id: "light-01-disk-shading",
      title: "Lambert-shade a disk",
      module: "lighting",
      difficulty: "medium",
      tags: ["lighting", "dot", "normal"],
      taskType: "build",
      description:
        "Treat a 2D disk as a hemisphere: at uv-position p inside the disk of radius R, the implied 3D normal is normalize(vec3(p.x, p.y, sqrt(R*R - dot(p,p)))). Light it with a directional light from the upper-right.",
      goal: "Compute a fake 3D normal from 2D position and apply Lambert.",
      expectedVisual:
        "A white sphere-like disk, brightest in the upper-right, fading to dark on the lower-left, black outside.",
      starterCode: `void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 p  = uv * 2.0 - 1.0;
  p.x    *= iResolution.x / iResolution.y;

  float R = 0.4;
  float r2 = dot(p, p);
  if (r2 > R*R) { fragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }

  // TODO: build a 3D normal from (p.xy, sqrt(R*R - r2)) and lambert against L.
  vec3 L = normalize(vec3(0.6, 0.6, 0.5));
  vec3 N = vec3(0.0, 0.0, 1.0);
  float diff = max(dot(N, L), 0.0);
  fragColor = vec4(vec3(diff), 1.0);
}
`,
      solutionCode: `void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 p  = uv * 2.0 - 1.0;
  p.x    *= iResolution.x / iResolution.y;

  float R = 0.4;
  float r2 = dot(p, p);
  if (r2 > R*R) { fragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }

  vec3 N = normalize(vec3(p, sqrt(R*R - r2)));
  vec3 L = normalize(vec3(0.6, 0.6, 0.5));
  float diff = max(dot(N, L), 0.0);
  fragColor = vec4(vec3(diff), 1.0);
}
`,
      hints: [
        { id: "h1", content: "Inside the disk, the implied z is sqrt(R*R - dot(p,p))." },
        { id: "h2", content: "Pack (p.xy, z) and normalize to get a unit normal." },
        { id: "h3", content: "Lambert: max(dot(N, L), 0.0); use the result as grayscale." },
      ],
      validation: {
        type: "pixel",
        rules: [
          // Bright in the upper-right.
          { point: [0.65, 0.65], expected: [0.85, 0.85, 0.85], tolerance: 0.3 },
          // Dim or black in the lower-left (terminator side).
          { point: [0.35, 0.35], expected: [0.1, 0.1, 0.1], tolerance: 0.25 },
          // Outside the disk: black.
          { point: [0.05, 0.05], expected: [0, 0, 0], tolerance: 0.05 },
        ],
      },
    },
  ],
};
