import type { Module } from "../../types";

/**
 * Module 02 — Distance & SDF.
 *
 * The featured module: 4 lessons + 5 hand-authored tasks covering euclidean
 * distance, the disk SDF, anti-aliased fills, the box SDF (max trick), and
 * a debug task that fixes a corrupted line SDF.
 */
export const distanceSdfModule: Module = {
  id: "distance-sdf",
  title: "Distance & SDF",
  blurb:
    "Treat the screen as a field of distances. Every shape is a function from a point to a number — and rendering becomes thresholding.",
  order: 2,
  lessons: [
    {
      id: "what-is-distance",
      title: "What is a distance field?",
      theory: `A distance field is a function d(p) that, for every point p in the plane, returns how far p is from a target shape. Negative inside, positive outside, zero on the boundary.

In a fragment shader, every pixel is a point. We compute d(p) for that pixel and convert it to a color: white if d <= 0 ("inside the shape"), black otherwise. That's the entire idea — we draw shapes by evaluating math at every pixel in parallel.

Why bother? Distance fields compose beautifully. Union of two shapes is min(d1, d2). Subtraction is max(d1, -d2). You can dilate a shape by subtracting a constant. You get crisp anti-aliasing for free using fwidth().`,
      example: `// Pixel-to-shape distance, the core pattern
float d = length(p) - 0.5;     // signed distance to a disk
float mask = d < 0.0 ? 1.0 : 0.0;
fragColor = vec4(vec3(mask), 1.0);`,
    },
    {
      id: "centered-coords",
      title: "Aspect-correct coordinates",
      theory: `gl_FragCoord.xy is in pixels. Two transformations make math sane:
1. Normalize: divide by iResolution.xy so coords land in [0,1].
2. Center & correct aspect: map to [-1,1] and multiply x by aspect = width/height. Now (0,0) is the screen center and a unit on x equals a unit on y, so a "circle" actually looks circular.`,
      example: `vec2 uv = gl_FragCoord.xy / iResolution.xy;
vec2 p  = uv * 2.0 - 1.0;
p.x    *= iResolution.x / iResolution.y;`,
    },
    {
      id: "antialiasing",
      title: "Anti-aliasing with fwidth",
      theory: `A hard threshold (d < 0) gives jagged edges. Instead, use smoothstep over a band whose width matches the screen-space derivative of d. fwidth(d) is exactly that: how much d changes between adjacent pixels.

  float aa  = fwidth(d);
  float fillMask = 1.0 - smoothstep(-aa, aa, d);

This is resolution-independent: at higher DPR the band shrinks automatically.`,
    },
    {
      id: "box-sdf",
      title: "The box SDF",
      theory: `For an axis-aligned box of half-size b centered at the origin:

  vec2 q = abs(p) - b;
  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);

The first term handles the outside (distance to nearest corner/edge). The second term handles the inside (negative, capped at 0 outside). Memorize the shape — every 2D primitive uses a variant of this trick.`,
    },
  ],
  tasks: [
    {
      id: "sdf-01-circle-mask",
      title: "Draw a white disk on black",
      module: "distance-sdf",
      difficulty: "easy",
      tags: ["sdf", "circle", "fundamentals"],
      taskType: "build",
      description:
        "Render a solid white disk centered on the canvas, radius 0.25 in centered-aspect coordinates, on a pure black background.",
      goal: "Convert pixels to centered coordinates, compute the signed distance to a disk of radius 0.25, and threshold to white-or-black.",
      expectedVisual:
        "A white circular disk centered on the canvas, surrounded by pure black. The disk should fill roughly a quarter of the height.",
      starterCode: `void main() {
  // 1. Convert gl_FragCoord to centered, aspect-corrected coords.
  // 2. Compute signed distance to a disk of radius 0.25.
  // 3. Output white when inside, black when outside.
  fragColor = vec4(0.0, 0.0, 0.0, 1.0);
}
`,
      solutionCode: `void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 p  = uv * 2.0 - 1.0;
  p.x    *= iResolution.x / iResolution.y;

  float d = length(p) - 0.25;
  float m = d < 0.0 ? 1.0 : 0.0;
  fragColor = vec4(vec3(m), 1.0);
}
`,
      hints: [
        { id: "h1", content: "Start by converting gl_FragCoord.xy to uv in [0,1] using iResolution.xy." },
        { id: "h2", content: "Map uv from [0,1] to [-1,1] and scale x by iResolution.x / iResolution.y to keep circles round." },
        { id: "h3", content: "The signed distance to a disk of radius r centered at the origin is `length(p) - r`." },
        { id: "h4", content: "Output `vec4(vec3(d < 0.0 ? 1.0 : 0.0), 1.0)` for a hard-edged disk." },
      ],
      validation: { type: "function", validator: "centeredDisk" },
      challenge: {
        description:
          "Replace the hard threshold with `1.0 - smoothstep(-fwidth(d), fwidth(d), d)` for clean anti-aliased edges.",
      },
    },

    {
      id: "sdf-02-aa-disk",
      title: "Anti-alias the disk edge",
      module: "distance-sdf",
      difficulty: "easy",
      tags: ["sdf", "smoothstep", "fwidth"],
      taskType: "modify",
      description:
        "The starter code draws a hard-edged disk. Replace the threshold with an anti-aliased fill using smoothstep and fwidth.",
      goal: "Smooth the edge of the disk so it looks crisp, not jagged.",
      expectedVisual:
        "Same white disk on black, but the edge is now a thin smooth band instead of staircased pixels.",
      starterCode: `void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 p  = uv * 2.0 - 1.0;
  p.x    *= iResolution.x / iResolution.y;

  float d = length(p) - 0.25;
  // Replace this hard threshold with an AA fill.
  float m = d < 0.0 ? 1.0 : 0.0;
  fragColor = vec4(vec3(m), 1.0);
}
`,
      solutionCode: `void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 p  = uv * 2.0 - 1.0;
  p.x    *= iResolution.x / iResolution.y;

  float d  = length(p) - 0.25;
  float aa = fwidth(d);
  float m  = 1.0 - smoothstep(-aa, aa, d);
  fragColor = vec4(vec3(m), 1.0);
}
`,
      hints: [
        { id: "h1", content: "smoothstep(edge0, edge1, x) interpolates 0→1 across [edge0, edge1]." },
        { id: "h2", content: "You want 1 inside (d < 0) and 0 outside (d > 0). That's `1.0 - smoothstep(-w, w, d)`." },
        { id: "h3", content: "fwidth(d) gives the per-pixel rate of change of d — perfect width for the AA band." },
      ],
      validation: { type: "function", validator: "centeredDisk" },
    },

    {
      id: "sdf-03-box",
      title: "Build a centered box",
      module: "distance-sdf",
      difficulty: "medium",
      tags: ["sdf", "box", "max"],
      taskType: "build",
      description:
        "Render a filled axis-aligned rectangle centered on the canvas, half-size (0.4, 0.2). Use the box SDF.",
      goal: "Implement sdBox(p, b) and render its anti-aliased fill.",
      expectedVisual:
        "A wide white rectangle (40% wide × 20% tall in centered coords) on black, with smooth edges.",
      starterCode: `// Implement sdBox and use it to draw a filled rectangle.
float sdBox(vec2 p, vec2 b) {
  // TODO: return the signed distance to a box of half-size b at the origin.
  return 1.0;
}

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 p  = uv * 2.0 - 1.0;
  p.x    *= iResolution.x / iResolution.y;

  float d = sdBox(p, vec2(0.4, 0.2));
  float aa = fwidth(d);
  float m = 1.0 - smoothstep(-aa, aa, d);
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

  float d  = sdBox(p, vec2(0.4, 0.2));
  float aa = fwidth(d);
  float m  = 1.0 - smoothstep(-aa, aa, d);
  fragColor = vec4(vec3(m), 1.0);
}
`,
      hints: [
        { id: "h1", content: "The box SDF uses |p| (componentwise abs) — by symmetry, only the first quadrant matters." },
        { id: "h2", content: "Compute q = abs(p) - b. Outside the box, max(q, 0.0) is the offset to the nearest edge or corner." },
        { id: "h3", content: "Inside the box (q < 0 in both axes), distance is min(max(q.x, q.y), 0.0) — the largest negative component." },
        { id: "h4", content: "Full formula: `length(max(q, 0.0)) + min(max(q.x, q.y), 0.0)`." },
      ],
      validation: {
        type: "pixel",
        rules: [
          // Center is inside the box → bright.
          { point: [0.5, 0.5], expected: [1, 1, 1], tolerance: 0.05 },
          // Just inside the right edge horizontally (~ p.x ≈ 0.35 in centered aspect — still inside 0.4).
          { point: [0.85, 0.5], expected: [1, 1, 1], tolerance: 0.1 },
          // Top center far above the box → dark.
          { point: [0.5, 0.95], expected: [0, 0, 0], tolerance: 0.05 },
        ],
        description: "Center of the box should be white; points well above/below should be black.",
      },
    },

    {
      id: "sdf-04-stroke-circle",
      title: "Stroke instead of fill",
      module: "distance-sdf",
      difficulty: "medium",
      tags: ["sdf", "stroke", "abs"],
      taskType: "modify",
      description:
        "The starter fills a disk. Modify it to render only the outline of the disk — a 0.01-thick white ring on black.",
      goal: "Convert a fill into a stroke using `abs(d) - thickness`.",
      expectedVisual: "A thin white ring centered on the canvas. The interior of the ring is black.",
      starterCode: `void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 p  = uv * 2.0 - 1.0;
  p.x    *= iResolution.x / iResolution.y;

  float d = length(p) - 0.25;
  // TODO: turn this fill into a 0.01-thick stroke.
  float aa = fwidth(d);
  float m  = 1.0 - smoothstep(-aa, aa, d);
  fragColor = vec4(vec3(m), 1.0);
}
`,
      solutionCode: `void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 p  = uv * 2.0 - 1.0;
  p.x    *= iResolution.x / iResolution.y;

  float d  = length(p) - 0.25;
  float ds = abs(d) - 0.01; // distance from the ring centerline
  float aa = fwidth(ds);
  float m  = 1.0 - smoothstep(-aa, aa, ds);
  fragColor = vec4(vec3(m), 1.0);
}
`,
      hints: [
        { id: "h1", content: "abs(d) is zero on the boundary and grows on both sides — perfect for strokes." },
        { id: "h2", content: "abs(d) - thickness is the SDF of a thin band along the original boundary." },
        { id: "h3", content: "Apply the same AA fill to abs(d) - 0.01 instead of d." },
      ],
      validation: {
        type: "pixel",
        rules: [
          // Pixel at the center is inside the disk but OUTSIDE the ring → black.
          { point: [0.5, 0.5], expected: [0, 0, 0], tolerance: 0.1 },
          // Pixel exactly on the ring (top center, where p ≈ (0, 0.25)) → bright.
          { point: [0.5, 0.75], expected: [1, 1, 1], tolerance: 0.25 },
          // Far corner: black.
          { point: [0.05, 0.05], expected: [0, 0, 0], tolerance: 0.05 },
        ],
        description: "Center should be black, top of ring bright, corners black.",
      },
    },

    {
      id: "sdf-05-debug-line",
      title: "Debug: the line SDF that isn't",
      module: "distance-sdf",
      difficulty: "hard",
      tags: ["sdf", "debug", "line", "dot"],
      taskType: "debug",
      description:
        "This shader is supposed to render a horizontal capsule (a thick line segment from (-0.4, 0) to (0.4, 0), thickness 0.05). It currently renders nothing useful. Find and fix the bug in sdSegment.",
      goal: "Recognize that the segment SDF needs a clamped projection of p onto the segment.",
      expectedVisual:
        "A horizontal pill-shaped capsule running across the middle of the canvas, white on black.",
      starterCode: `// BROKEN: this implementation projects p onto an INFINITE line.
// We need the distance to a finite segment.
float sdSegment(vec2 p, vec2 a, vec2 b, float r) {
  vec2 ab = b - a;
  vec2 ap = p - a;
  float h = dot(ap, ab) / dot(ab, ab); // <-- bug: not clamped
  return length(ap - ab * h) - r;
}

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 p  = uv * 2.0 - 1.0;
  p.x    *= iResolution.x / iResolution.y;

  float d  = sdSegment(p, vec2(-0.4, 0.0), vec2(0.4, 0.0), 0.05);
  float aa = fwidth(d);
  float m  = 1.0 - smoothstep(-aa, aa, d);
  fragColor = vec4(vec3(m), 1.0);
}
`,
      solutionCode: `float sdSegment(vec2 p, vec2 a, vec2 b, float r) {
  vec2 ab = b - a;
  vec2 ap = p - a;
  float h = clamp(dot(ap, ab) / dot(ab, ab), 0.0, 1.0);
  return length(ap - ab * h) - r;
}

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 p  = uv * 2.0 - 1.0;
  p.x    *= iResolution.x / iResolution.y;

  float d  = sdSegment(p, vec2(-0.4, 0.0), vec2(0.4, 0.0), 0.05);
  float aa = fwidth(d);
  float m  = 1.0 - smoothstep(-aa, aa, d);
  fragColor = vec4(vec3(m), 1.0);
}
`,
      hints: [
        { id: "h1", content: "The bug renders a line stretching to infinity in both directions, not a finite capsule." },
        { id: "h2", content: "The projection coefficient h is the fraction along the segment; if h<0 we're past a, if h>1 we're past b." },
        { id: "h3", content: "Clamp h to [0,1] before using it. That snaps points past the endpoints to the nearest endpoint." },
        { id: "h4", content: "Full fix: `float h = clamp(dot(ap, ab) / dot(ab, ab), 0.0, 1.0);`" },
      ],
      validation: {
        type: "pixel",
        rules: [
          // Center of segment → white
          { point: [0.5, 0.5], expected: [1, 1, 1], tolerance: 0.1 },
          // Far above → black (broken version paints whole horizontal strip too)
          { point: [0.5, 0.9], expected: [0, 0, 0], tolerance: 0.05 },
          // Far to the right of the endpoint → black (broken version is white here!)
          { point: [0.98, 0.5], expected: [0, 0, 0], tolerance: 0.05 },
        ],
        description:
          "The right-of-endpoint sample distinguishes the bug: an unclamped projection paints the entire horizontal band white.",
      },
    },
  ],
};
