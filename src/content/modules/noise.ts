import type { Module } from "../../types";

export const noiseModule: Module = {
  id: "noise",
  title: "Noise",
  blurb:
    "Hash-based noise turns pseudo-random integers into smooth fields. The foundation for clouds, terrain, dissolves.",
  order: 8,
  lessons: [
    {
      id: "hash-noise",
      title: "Hash → value noise",
      theory: `A hash function takes a position and returns a deterministic pseudo-random float. Sample at integer cell corners and bilinearly interpolate the values inside each cell — that's value noise.

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

Smoothstep the local coordinate before mixing to soften the cell seams.`,
    },
  ],
  tasks: [
    {
      id: "noise-01-value-noise",
      title: "Value noise field",
      module: "noise",
      difficulty: "medium",
      tags: ["noise", "hash"],
      taskType: "build",
      description: "Render a grayscale value-noise field with 8 cells across.",
      goal: "Implement bilinear value noise from a hash.",
      expectedVisual: "A blobby grayscale field — soft splotches, no hard cell boundaries.",
      starterCode: `float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float valueNoise(vec2 p) {
  // TODO: bilinearly interpolate hash() across the unit cell containing p,
  // using a smoothstep-eased fractional position.
  return 0.0;
}

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  uv.x *= iResolution.x / iResolution.y;
  float n = valueNoise(uv * 8.0);
  fragColor = vec4(vec3(n), 1.0);
}
`,
      solutionCode: `float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i + vec2(0.0, 0.0));
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  uv.x *= iResolution.x / iResolution.y;
  float n = valueNoise(uv * 8.0);
  fragColor = vec4(vec3(n), 1.0);
}
`,
      hints: [
        { id: "h1", content: "Sample hash() at the four corners of the cell containing p." },
        { id: "h2", content: "The local fractional position f = fract(p) controls the interpolation." },
        { id: "h3", content: "Use smoothstep easing on f before mix(): u = f*f*(3-2f)." },
        { id: "h4", content: "mix(mix(a,b,u.x), mix(c,d,u.x), u.y)." },
      ],
      validation: { type: "pattern", description: "Smooth grayscale blobs, no straight cell edges." },
    },
  ],
};
