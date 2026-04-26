import type { Module } from "../../types";

export const animationModule: Module = {
  id: "animation",
  title: "Animation",
  blurb: "iTime turns static math into motion. Sin and cos are your animation curve library.",
  order: 9,
  lessons: [
    {
      id: "time-curves",
      title: "Time-driven motion",
      theory: `iTime is seconds since the shader started. Drive any parameter with it:

  float t   = iTime;
  vec2  pos = vec2(0.4*cos(t), 0.4*sin(t));   // orbit
  float pul = 0.5 + 0.5*sin(t*3.0);            // 0..1 pulse
  float sw  = mod(t, 2.0) > 1.0 ? 1.0 : 0.0;   // 1Hz square wave

Tip: scale by frequency in radians per second. 2π per period.`,
    },
  ],
  tasks: [
    {
      id: "anim-01-orbit-disk",
      title: "Orbiting disk",
      module: "animation",
      difficulty: "easy",
      tags: ["time", "orbit"],
      taskType: "build",
      description: "A white disk of radius 0.1 should orbit the screen center on a circle of radius 0.4 at one revolution per 4 seconds.",
      goal: "Use cos and sin of iTime to position the disk.",
      expectedVisual: "A small white disk orbiting the center of the canvas counter-clockwise.",
      starterCode: `void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 p  = uv * 2.0 - 1.0;
  p.x    *= iResolution.x / iResolution.y;

  // TODO: place a disk of radius 0.1 orbiting at radius 0.4, period 4s.
  vec2 c = vec2(0.0);
  float d  = length(p - c) - 0.1;
  float aa = fwidth(d);
  float m  = 1.0 - smoothstep(-aa, aa, d);
  fragColor = vec4(vec3(m), 1.0);
}
`,
      solutionCode: `void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 p  = uv * 2.0 - 1.0;
  p.x    *= iResolution.x / iResolution.y;

  float w = 6.2831853 / 4.0; // 2*pi / period
  vec2 c  = vec2(0.4 * cos(iTime * w), 0.4 * sin(iTime * w));
  float d  = length(p - c) - 0.1;
  float aa = fwidth(d);
  float m  = 1.0 - smoothstep(-aa, aa, d);
  fragColor = vec4(vec3(m), 1.0);
}
`,
      hints: [
        { id: "h1", content: "Angular frequency ω = 2π / period. For period 4s, ω = π/2." },
        { id: "h2", content: "Center c = radius * (cos(ωt), sin(ωt))." },
      ],
      validation: { type: "pattern", description: "A disk should be visibly orbiting." },
    },
  ],
};
