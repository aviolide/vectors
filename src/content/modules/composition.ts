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

    {
      id: "comp-02-fireball",
      title: "Fireball: SDF + noise + fire gradient",
      module: "composition",
      difficulty: "hard",
      tags: ["sdf", "noise", "fire", "tinykaboom"],
      taskType: "build",
      description:
        "Port the tinykaboom recipe to 2D: a noisy disk SDF whose mask drives a 5-stop fire gradient (black → red → orange → yellow → white).",
      goal: "Combine an SDF, a noise displacement, and a colour ramp via mix().",
      expectedVisual:
        "A blobby fireball — irregular orange/yellow centre fading to red and out to black.",
      starterCode: `float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x),
             mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float s = 0.0, a = 0.5, f = 1.0, n = 0.0;
  for (int i = 0; i < 5; i++) { s += a * vnoise(p * f); n += a; a *= 0.5; f *= 2.0; }
  return s / n;
}

vec3 fireRamp(float t) {
  // TODO: 5 stops: black -> red -> orange -> yellow -> white using mix() and smoothstep().
  return vec3(t);
}

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 p  = uv * 2.0 - 1.0;
  p.x    *= iResolution.x / iResolution.y;

  float n = fbm(p * 3.0) * 0.4;
  float d = length(p) - 0.4 + n;     // noisy disk
  float t = 1.0 - smoothstep(-0.05, 0.15, d); // 1 inside, fading to 0 outside

  fragColor = vec4(fireRamp(t), 1.0);
}
`,
      solutionCode: `float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x),
             mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float s = 0.0, a = 0.5, f = 1.0, n = 0.0;
  for (int i = 0; i < 5; i++) { s += a * vnoise(p * f); n += a; a *= 0.5; f *= 2.0; }
  return s / n;
}

vec3 fireRamp(float t) {
  vec3 black  = vec3(0.0);
  vec3 red    = vec3(0.7, 0.05, 0.0);
  vec3 orange = vec3(1.0, 0.4, 0.05);
  vec3 yellow = vec3(1.0, 0.85, 0.2);
  vec3 white  = vec3(1.0);
  vec3 c = mix(black,  red,    smoothstep(0.0, 0.25, t));
       c = mix(c,      orange, smoothstep(0.25, 0.5, t));
       c = mix(c,      yellow, smoothstep(0.5, 0.8, t));
       c = mix(c,      white,  smoothstep(0.8, 1.0, t));
  return c;
}

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 p  = uv * 2.0 - 1.0;
  p.x    *= iResolution.x / iResolution.y;

  float n = fbm(p * 3.0) * 0.4;
  float d = length(p) - 0.4 + n;
  float t = 1.0 - smoothstep(-0.05, 0.15, d);
  fragColor = vec4(fireRamp(t), 1.0);
}
`,
      hints: [
        { id: "h1", content: "Build the gradient by chained mix(): start with black, mix() to red over [0, 0.25], then to orange, then yellow, then white." },
        { id: "h2", content: "smoothstep(a, b, t) gives the blend weight between two stops." },
        { id: "h3", content: "The noise term is added INSIDE the SDF (`length(p) - r + n`) so the boundary is irregular." },
      ],
      validation: { type: "pattern", description: "Irregular blob with red→yellow→white core, black outside." },
    },
  ],
};
