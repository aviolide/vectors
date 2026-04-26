import type { RunnerHandle } from "./shaderRunner";
import type { Validation, ValidationRule } from "../types";

export type ValidationResult = {
  pass: boolean;
  /** Per-rule outcome (pixel mode). */
  details: Array<{
    rule: ValidationRule;
    actual: [number, number, number];
    delta: number;
    pass: boolean;
  }>;
  message: string;
};

function maxChannelDelta(
  a: [number, number, number],
  b: [number, number, number]
): number {
  return Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]));
}

/**
 * Run a validation against a runner. The runner's program must already be set
 * to the user's solution; the caller forces a render at deterministic times
 * before reading pixels (so iTime-dependent shaders are reproducible).
 */
export function runValidation(
  runner: RunnerHandle,
  validation: Validation | undefined,
  validators: Record<string, (r: RunnerHandle) => ValidationResult>
): ValidationResult {
  if (!validation) {
    return { pass: true, details: [], message: "No automatic validation defined." };
  }

  if (validation.type === "pixel") {
    runner.renderAt(0);
    const details = validation.rules.map((rule) => {
      const [r, g, b] = runner.readPixel(rule.point[0], rule.point[1]);
      const actual: [number, number, number] = [r, g, b];
      const delta = maxChannelDelta(actual, rule.expected);
      return { rule, actual, delta, pass: delta <= rule.tolerance };
    });
    const pass = details.every((d) => d.pass);
    const message = pass
      ? "All sampled pixels match the expected output."
      : `${details.filter((d) => !d.pass).length} of ${details.length} samples failed.`;
    return { pass, details, message };
  }

  if (validation.type === "function") {
    const fn = validators[validation.validator];
    if (!fn) {
      return {
        pass: false,
        details: [],
        message: `Validator "${validation.validator}" is not registered.`,
      };
    }
    return fn(runner);
  }

  return {
    pass: true,
    details: [],
    message: validation.description ?? "Manual validation — check the output yourself.",
  };
}
