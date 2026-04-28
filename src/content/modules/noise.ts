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

    {
      id: "noise-02-fbm",
      title: "Fractional Brownian Motion (fbm)",
      module: "noise",
      difficulty: "medium",
      tags: ["fbm", "noise", "octaves"],
      taskType: "build",
      description:
        "Sum 5 octaves of value noise with frequency doubling and amplitude halving. Render the result as grayscale.",
      goal: "Implement fbm = Σ amp_i * noise(p * freq_i).",
      expectedVisual:
        "A cloudy texture with detail at multiple scales — large blobs with smaller wisps inside.",
      starterCode: `float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float valueNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  float a = hash(i), b = hash(i + vec2(1, 0));
  float c = hash(i + vec2(0, 1)), d = hash(i + vec2(1, 1));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  // TODO: 5 octaves, freq *= 2, amp *= 0.5. Normalize so output is in [0, ~1].
  return valueNoise(p);
}

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  uv.x *= iResolution.x / iResolution.y;
  fragColor = vec4(vec3(fbm(uv * 3.0)), 1.0);
}
`,
      solutionCode: `float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float valueNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  float a = hash(i), b = hash(i + vec2(1, 0));
  float c = hash(i + vec2(0, 1)), d = hash(i + vec2(1, 1));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float sum = 0.0, amp = 0.5, freq = 1.0, norm = 0.0;
  for (int i = 0; i < 5; i++) {
    sum  += amp * valueNoise(p * freq);
    norm += amp;
    amp  *= 0.5;
    freq *= 2.0;
  }
  return sum / norm;
}

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  uv.x *= iResolution.x / iResolution.y;
  fragColor = vec4(vec3(fbm(uv * 3.0)), 1.0);
}
`,
      hints: [
        { id: "h1", content: "fbm is a loop: each iteration doubles the frequency and halves the amplitude." },
        { id: "h2", content: "Track Σ amplitude as a normalizer so the output stays in roughly [0, 1]." },
      ],
      validation: { type: "pattern", description: "Cloudy texture with detail at multiple scales." },
    },

    {
      id: "noise-03-domain-warp",
      title: "Domain-warped noise",
      module: "noise",
      difficulty: "hard",
      tags: ["fbm", "warp", "iq"],
      taskType: "build",
      description:
        "Warp the input domain by another fbm before sampling. The output is what Inigo Quilez calls 'pattern in pattern' — flowing organic shapes.",
      goal: "Sample fbm at a position offset by another fbm.",
      expectedVisual:
        "A swirly, almost liquid grayscale field. No straight cell artifacts; very organic.",
      starterCode: `float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float valueNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x),
             mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float s = 0.0, a = 0.5, f = 1.0, n = 0.0;
  for (int i = 0; i < 5; i++) { s += a * valueNoise(p * f); n += a; a *= 0.5; f *= 2.0; }
  return s / n;
}

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  uv.x *= iResolution.x / iResolution.y;

  vec2 q = uv * 3.0;
  // TODO: offset = vec2(fbm(q), fbm(q + vec2(5.2, 1.3)));
  // sample fbm(q + 4.0 * offset).
  float v = fbm(q);
  fragColor = vec4(vec3(v), 1.0);
}
`,
      solutionCode: `float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float valueNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x),
             mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float s = 0.0, a = 0.5, f = 1.0, n = 0.0;
  for (int i = 0; i < 5; i++) { s += a * valueNoise(p * f); n += a; a *= 0.5; f *= 2.0; }
  return s / n;
}

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  uv.x *= iResolution.x / iResolution.y;

  vec2 q = uv * 3.0;
  vec2 offset = vec2(fbm(q), fbm(q + vec2(5.2, 1.3)));
  float v = fbm(q + 4.0 * offset);
  fragColor = vec4(vec3(v), 1.0);
}
`,
      hints: [
        { id: "h1", content: "The whole trick is `fbm(p + k * fbm(p))` — feeding noise into noise." },
        { id: "h2", content: "Use two independent offsets (different seeds) for x and y of the warp vector." },
      ],
      validation: { type: "pattern", description: "Swirly, organic-looking grayscale field." },
    },
  ],
};
