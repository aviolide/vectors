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
};
