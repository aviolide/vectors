export type Difficulty = "easy" | "medium" | "hard";
export type TaskType = "build" | "modify" | "debug" | "optimize";

export type ValidationRule = {
  /** Pixel coords in the [0,1]×[0,1] uv space (bottom-left origin). */
  point: [number, number];
  /** Expected linear RGB in [0,1]. */
  expected: [number, number, number];
  /** Per-channel tolerance in [0,1]. */
  tolerance: number;
};

export type Validation =
  | {
      type: "pixel";
      rules: ValidationRule[];
      description?: string;
    }
  | {
      type: "function";
      /** Name of a registered validator in src/engine/validators.ts */
      validator: string;
      description?: string;
    }
  | {
      type: "pattern";
      /** Free-form description shown to the user — manual self-check. */
      description: string;
    };

export type Hint = {
  id: string;
  content: string;
};

export type ShaderTask = {
  id: string;

  title: string;
  module: string;
  difficulty: Difficulty;

  tags: string[];

  description: string;
  theory?: string;

  goal: string;
  expectedVisual: string;

  starterCode: string;
  solutionCode: string;

  hints: Hint[];

  validation?: Validation;

  taskType: TaskType;

  challenge?: { description: string };
};

export type Lesson = {
  id: string;
  title: string;
  /** Markdown-ish theory: rendered as paragraphs. */
  theory: string;
  /** Optional code block accompanying the lesson. */
  example?: string;
};

export type Module = {
  id: string;
  title: string;
  blurb: string;
  /** Order index in the curriculum. */
  order: number;
  lessons: Lesson[];
  tasks: ShaderTask[];
};
