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

    {
      id: "light-02-phong-specular",
      title: "Phong: add a specular highlight",
      module: "lighting",
      difficulty: "medium",
      tags: ["phong", "specular", "reflect"],
      taskType: "modify",
      description:
        "The starter has Lambert diffuse on a fake sphere. Add a Phong specular term: pow(max(dot(R, V), 0), 32), where R is the reflected light direction and V points to the viewer (V = (0, 0, 1)).",
      goal: "Compose ambient + diffuse + specular into a full Phong response.",
      expectedVisual:
        "A shaded ball with a small bright highlight in the upper-right and a soft warm gradient elsewhere.",
      starterCode: `void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 p  = uv * 2.0 - 1.0;
  p.x    *= iResolution.x / iResolution.y;

  float R = 0.4;
  float r2 = dot(p, p);
  if (r2 > R*R) { fragColor = vec4(0.0); return; }

  vec3 N = normalize(vec3(p, sqrt(R*R - r2)));
  vec3 L = normalize(vec3(0.6, 0.6, 0.5));
  vec3 V = vec3(0.0, 0.0, 1.0);

  float diff = max(dot(N, L), 0.0);
  // TODO: float spec = pow(max(dot(reflect(-L, N), V), 0.0), 32.0);
  float spec = 0.0;

  vec3 col = vec3(0.05) + vec3(1.0, 0.6, 0.3) * diff + vec3(1.0) * spec;
  fragColor = vec4(col, 1.0);
}
`,
      solutionCode: `void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 p  = uv * 2.0 - 1.0;
  p.x    *= iResolution.x / iResolution.y;

  float R = 0.4;
  float r2 = dot(p, p);
  if (r2 > R*R) { fragColor = vec4(0.0); return; }

  vec3 N = normalize(vec3(p, sqrt(R*R - r2)));
  vec3 L = normalize(vec3(0.6, 0.6, 0.5));
  vec3 V = vec3(0.0, 0.0, 1.0);

  float diff = max(dot(N, L), 0.0);
  vec3 Rv   = reflect(-L, N);
  float spec = pow(max(dot(Rv, V), 0.0), 32.0);

  vec3 col = vec3(0.05) + vec3(1.0, 0.6, 0.3) * diff + vec3(1.0) * spec;
  fragColor = vec4(col, 1.0);
}
`,
      hints: [
        { id: "h1", content: "The reflected light direction is reflect(-L, N) — note the negation: GLSL's reflect points along the incoming ray." },
        { id: "h2", content: "Specular intensity = pow(max(dot(R, V), 0), shininess). Higher shininess = tighter highlight." },
        { id: "h3", content: "Add the specular term as white on top of the diffuse contribution." },
      ],
      validation: { type: "function", validator: "phongHighlight" },
    },

    {
      id: "light-03-reflect-vector",
      title: "Visualize the reflection vector",
      module: "lighting",
      difficulty: "easy",
      tags: ["reflect", "vector"],
      taskType: "build",
      description:
        "For each pixel inside the disk, compute the reflected light direction and output its xy components as red/green (mapped from [-1,1] → [0,1]).",
      goal: "Use reflect(I, N) and visualize the result as a colour field.",
      expectedVisual:
        "A smooth red/green gradient ball (the colours encode the reflection direction).",
      starterCode: `void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 p  = uv * 2.0 - 1.0;
  p.x    *= iResolution.x / iResolution.y;

  float R = 0.4;
  float r2 = dot(p, p);
  if (r2 > R*R) { fragColor = vec4(0.0); return; }

  vec3 N = normalize(vec3(p, sqrt(R*R - r2)));
  vec3 L = normalize(vec3(0.6, 0.6, 0.5));

  // TODO: vec3 Rv = reflect(-L, N); display Rv.xy
  fragColor = vec4(0.0, 0.0, 0.0, 1.0);
}
`,
      solutionCode: `void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 p  = uv * 2.0 - 1.0;
  p.x    *= iResolution.x / iResolution.y;

  float R = 0.4;
  float r2 = dot(p, p);
  if (r2 > R*R) { fragColor = vec4(0.0); return; }

  vec3 N = normalize(vec3(p, sqrt(R*R - r2)));
  vec3 L = normalize(vec3(0.6, 0.6, 0.5));
  vec3 Rv = reflect(-L, N);
  fragColor = vec4(Rv.xy * 0.5 + 0.5, 0.0, 1.0);
}
`,
      hints: [
        { id: "h1", content: "reflect(I, N) returns I - 2*dot(N, I)*N. Pass -L because GLSL expects an INCOMING ray." },
        { id: "h2", content: "Map xy from [-1,1] to [0,1] before writing as colour: `Rv.xy * 0.5 + 0.5`." },
      ],
      validation: { type: "pattern", description: "Smooth two-channel gradient inside the disk; black outside." },
    },

    {
      id: "light-04-multi-light",
      title: "Three coloured lights",
      module: "lighting",
      difficulty: "hard",
      tags: ["lighting", "additive"],
      taskType: "build",
      description:
        "Light the same fake sphere with three coloured lights at directions (1, 0, 0.5), (-1, 0, 0.5), (0, 1, 0.5), summed additively. Use red, green, blue respectively.",
      goal: "Sum independent Lambert contributions from multiple lights.",
      expectedVisual:
        "A ball that's red on the right, green on the left, blue from above, with smooth colour mixing in between.",
      starterCode: `void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 p  = uv * 2.0 - 1.0;
  p.x    *= iResolution.x / iResolution.y;

  float R = 0.4;
  float r2 = dot(p, p);
  if (r2 > R*R) { fragColor = vec4(0.0); return; }

  vec3 N = normalize(vec3(p, sqrt(R*R - r2)));

  // TODO: 3 lights summed (red right, green left, blue top).
  vec3 col = vec3(0.0);
  fragColor = vec4(col, 1.0);
}
`,
      solutionCode: `void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 p  = uv * 2.0 - 1.0;
  p.x    *= iResolution.x / iResolution.y;

  float R = 0.4;
  float r2 = dot(p, p);
  if (r2 > R*R) { fragColor = vec4(0.0); return; }

  vec3 N = normalize(vec3(p, sqrt(R*R - r2)));

  vec3 L1 = normalize(vec3( 1.0, 0.0, 0.5));
  vec3 L2 = normalize(vec3(-1.0, 0.0, 0.5));
  vec3 L3 = normalize(vec3( 0.0, 1.0, 0.5));

  vec3 col =
      vec3(1.0, 0.2, 0.2) * max(dot(N, L1), 0.0) +
      vec3(0.2, 1.0, 0.2) * max(dot(N, L2), 0.0) +
      vec3(0.2, 0.2, 1.0) * max(dot(N, L3), 0.0);
  fragColor = vec4(col, 1.0);
}
`,
      hints: [
        { id: "h1", content: "Light contributions sum: total = Σ colour_i * max(dot(N, L_i), 0)." },
        { id: "h2", content: "Don't forget to NORMALIZE each light direction." },
      ],
      validation: {
        type: "pixel",
        rules: [
          // Right side — red dominates
          { point: [0.85, 0.5], expected: [0.7, 0.15, 0.15], tolerance: 0.4 },
          // Left side — green dominates
          { point: [0.15, 0.5], expected: [0.15, 0.7, 0.15], tolerance: 0.4 },
        ],
      },
    },
  ],
};
