import type { Module } from "../../types";

export const tilingModule: Module = {
  id: "tiling",
  title: "Tiling & Patterns",
  blurb: "Use fract() and mod() to repeat space — one cell of math becomes an infinite pattern.",
  order: 7,
  lessons: [
    {
      id: "fract-mod",
      title: "fract() and the cell trick",
      theory: `If you want a shape to repeat every unit:
  vec2 cell = fract(p * scale) - 0.5;
  // evaluate your SDF using \`cell\` instead of \`p\`

You're effectively running the same shader inside every grid cell. Subtract 0.5 to recenter the cell origin in the middle.`,
    },
  ],
  tasks: [
    {
      id: "tile-01-checkerboard",
      title: "Checkerboard",
      module: "tiling",
      difficulty: "easy",
      tags: ["tiling", "mod", "checker"],
      taskType: "build",
      description:
        "Render a black-and-white checkerboard with 8 cells across the wider dimension.",
      goal: "Use floor() and mod() (or step) to alternate cells.",
      expectedVisual: "A standard 8-wide black-and-white checkerboard.",
      starterCode: `void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  fragColor = vec4(0.0, 0.0, 0.0, 1.0);
}
`,
      solutionCode: `void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  uv.x *= iResolution.x / iResolution.y;
  vec2 cell = floor(uv * 8.0);
  float c = mod(cell.x + cell.y, 2.0);
  fragColor = vec4(vec3(c), 1.0);
}
`,
      hints: [
        { id: "h1", content: "Multiply uv by 8 and floor to get integer cell coordinates." },
        { id: "h2", content: "(x + y) mod 2 alternates 0/1 across a grid." },
      ],
      validation: { type: "pattern", description: "Visually confirm an 8-wide black/white checkerboard." },
    },
  ],
};
