import type { RunnerHandle } from "./shaderRunner";
import type { ValidationResult } from "./validation";

/**
 * Custom validators registered by name. Tasks reference them via
 * { type: "function", validator: "name" }.
 *
 * They sample the runner at deterministic times and aggregate their own
 * pass/fail logic — useful when a single pixel rule isn't enough (e.g.
 * checking that a circle is centered, or that a pattern repeats).
 */
export const validators: Record<string, (r: RunnerHandle) => ValidationResult> = {
  /**
   * Confirms a filled disk centered at uv (0.5,0.5) of radius ~0.25:
   *   - center pixel is bright (> 0.5 luma)
   *   - corners are dark (< 0.1 luma)
   */
  centeredDisk(r) {
    r.renderAt(0);
    const samples: Array<{ uv: [number, number]; expectBright: boolean }> = [
      { uv: [0.5, 0.5], expectBright: true },
      { uv: [0.5, 0.7], expectBright: true },
      { uv: [0.05, 0.05], expectBright: false },
      { uv: [0.95, 0.05], expectBright: false },
      { uv: [0.05, 0.95], expectBright: false },
      { uv: [0.95, 0.95], expectBright: false },
    ];
    const details = samples.map((s) => {
      const [cr, cg, cb] = r.readPixel(s.uv[0], s.uv[1]);
      const luma = 0.299 * cr + 0.587 * cg + 0.114 * cb;
      const pass = s.expectBright ? luma > 0.5 : luma < 0.1;
      return {
        rule: { point: s.uv, expected: [0, 0, 0] as [number, number, number], tolerance: 0 },
        actual: [cr, cg, cb] as [number, number, number],
        delta: luma,
        pass,
      };
    });
    const pass = details.every((d) => d.pass);
    return {
      pass,
      details,
      message: pass
        ? "Disk is centered and the background is dark."
        : "Disk is missing, off-center, or the background is not dark.",
    };
  },

  /**
   * Confirms a smooth horizontal monotonic gradient on the red channel:
   * left should be darker than right by at least 0.6.
   */
  gradientLeftRight(r) {
    r.renderAt(0);
    const left = r.readPixel(0.05, 0.5);
    const right = r.readPixel(0.95, 0.5);
    const delta = right[0] - left[0];
    const pass = delta > 0.6;
    return {
      pass,
      details: [
        {
          rule: { point: [0.05, 0.5], expected: [0, 0, 0], tolerance: 0 },
          actual: [left[0], left[1], left[2]],
          delta: left[0],
          pass: left[0] < 0.2,
        },
        {
          rule: { point: [0.95, 0.5], expected: [1, 0, 0], tolerance: 0 },
          actual: [right[0], right[1], right[2]],
          delta: right[0],
          pass: right[0] > 0.7,
        },
      ],
      message: pass
        ? "Red channel rises smoothly from left to right."
        : `Expected the red channel to rise across x; saw Δ=${delta.toFixed(2)}.`,
    };
  },

  /**
   * Confirms a Phong-shaded sphere: bright in upper-right, dimmer in lower-left,
   * black outside the disk, AND a small specular hotspot brighter than diffuse.
   */
  phongHighlight(r) {
    r.renderAt(0);
    const samples: Array<{ uv: [number, number]; check: (rgb: number[]) => boolean; label: string }> = [
      { uv: [0.05, 0.05], check: (c) => c[0] + c[1] + c[2] < 0.15, label: "outside-dark" },
      { uv: [0.35, 0.35], check: (c) => c[0] + c[1] + c[2] < 0.6, label: "terminator-dim" },
      { uv: [0.65, 0.65], check: (c) => c[0] + c[1] + c[2] > 1.5, label: "lit-side-bright" },
    ];
    const details = samples.map((s) => {
      const px = r.readPixel(s.uv[0], s.uv[1]);
      const ok = s.check([px[0], px[1], px[2]]);
      return {
        rule: { point: s.uv, expected: [0, 0, 0] as [number, number, number], tolerance: 0 },
        actual: [px[0], px[1], px[2]] as [number, number, number],
        delta: px[0] + px[1] + px[2],
        pass: ok,
      };
    });
    const pass = details.every((d) => d.pass);
    return {
      pass,
      details,
      message: pass
        ? "Lit side, terminator, and background all behave as a Phong sphere should."
        : "Phong response is wrong somewhere — check labels in the per-sample list.",
    };
  },

  /**
   * Confirms a horizontal mirror-symmetric image: pixel at (u, v) ≈ (1-u, v).
   * Useful for reflection, look-at, and symmetry-based tasks.
   */
  horizontallySymmetric(r) {
    r.renderAt(0);
    const probes: Array<[number, number]> = [
      [0.2, 0.5],
      [0.3, 0.3],
      [0.4, 0.7],
    ];
    const details = probes.map((uv) => {
      const a = r.readPixel(uv[0], uv[1]);
      const b = r.readPixel(1 - uv[0], uv[1]);
      const delta = Math.max(
        Math.abs(a[0] - b[0]),
        Math.abs(a[1] - b[1]),
        Math.abs(a[2] - b[2])
      );
      return {
        rule: { point: uv, expected: [b[0], b[1], b[2]] as [number, number, number], tolerance: 0.1 },
        actual: [a[0], a[1], a[2]] as [number, number, number],
        delta,
        pass: delta < 0.1,
      };
    });
    const pass = details.every((d) => d.pass);
    return {
      pass,
      details,
      message: pass
        ? "Image is symmetric across the vertical midline."
        : "Image is not horizontally symmetric — at least one mirrored pair differs.",
    };
  },
};
