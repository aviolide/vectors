import type { Module } from "../../types";

export const compositionModule: Module = {
  id: "composition",
  title: "Composition",
  blurb: "Layer shapes, add glow, build a scene. Where everything you've learned comes together.",
  order: 10,
  lessons: [
    {
      id: "layering",
      title: "Layering",
      theory: `Each layer is a (color, alpha) pair. Composite back-to-front using mix():

  vec3 col = bg;
  col = mix(col, layer1.rgb, layer1.a);
  col = mix(col, layer2.rgb, layer2.a);

For glow, render an SDF and use exp(-d * k) (or 1.0/(1.0 + d*d*k)) as additive contribution. Bloom on the cheap.`,
    },
  ],
  tasks: [
    {
      id: "comp-01-glowing-disk",
      title: "Glowing disk",
      module: "composition",
      difficulty: "medium",
      tags: ["glow", "compose"],
      taskType: "build",
      description: "Render a small bright disk with a soft warm glow falling off radially.",
      goal: "Combine an AA fill with an exponential falloff term added on top.",
      expectedVisual:
        "A small white-hot disk on a dark background with an orange/red glow halo around it.",
      starterCode: `void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 p  = uv * 2.0 - 1.0;
  p.x    *= iResolution.x / iResolution.y;

  float d = length(p) - 0.08;
  // TODO: build a glow term and combine with the core disk.
  float core = 1.0 - smoothstep(-fwidth(d), fwidth(d), d);
  vec3 col = vec3(core);
  fragColor = vec4(col, 1.0);
}
`,
      solutionCode: `void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 p  = uv * 2.0 - 1.0;
  p.x    *= iResolution.x / iResolution.y;

  float d    = length(p) - 0.08;
  float core = 1.0 - smoothstep(-fwidth(d), fwidth(d), d);
  float glow = exp(-max(d, 0.0) * 12.0);

  vec3 hot   = vec3(1.0, 0.95, 0.85);
  vec3 halo  = vec3(1.0, 0.45, 0.15);
  vec3 col   = halo * glow + hot * core;
  fragColor = vec4(col, 1.0);
}
`,
      hints: [
        { id: "h1", content: "Glow as additive: exp(-max(d,0) * k) for some k around 8–20." },
        { id: "h2", content: "Final color = halo * glow + core_color * core." },
      ],
      validation: { type: "pattern", description: "Bright core, warm halo, dark away from center." },
    },
  ],
};
