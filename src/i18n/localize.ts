import type { Module, Lesson, ShaderTask, Hint } from "../types";

/** Translatable slice of a Hint. */
type HintTx = { content: string };

/** Translatable slice of a ShaderTask. */
type TaskTx = {
  title?: string;
  description?: string;
  theory?: string;
  goal?: string;
  expectedVisual?: string;
  hints?: Record<string, HintTx>;
  challenge?: string;
};

/** Translatable slice of a Lesson. */
type LessonTx = {
  title?: string;
  theory?: string;
};

/** Translatable slice of a Module. */
export type ModuleTx = {
  title?: string;
  blurb?: string;
  lessons?: Record<string, LessonTx>;
  tasks?: Record<string, TaskTx>;
};

/** All module translations keyed by module id. */
export type ContentTranslations = Record<string, ModuleTx>;

function applyHints(base: Hint[], tx: Record<string, HintTx> | undefined): Hint[] {
  if (!tx) return base;
  return base.map((h) => (tx[h.id] ? { ...h, content: tx[h.id].content } : h));
}

function applyTask(base: ShaderTask, tx: TaskTx | undefined): ShaderTask {
  if (!tx) return base;
  return {
    ...base,
    title: tx.title ?? base.title,
    description: tx.description ?? base.description,
    theory: tx.theory ?? base.theory,
    goal: tx.goal ?? base.goal,
    expectedVisual: tx.expectedVisual ?? base.expectedVisual,
    hints: applyHints(base.hints, tx.hints),
    challenge: tx.challenge !== undefined ? { description: tx.challenge } : base.challenge,
  };
}

function applyLesson(base: Lesson, tx: LessonTx | undefined): Lesson {
  if (!tx) return base;
  return {
    ...base,
    title: tx.title ?? base.title,
    theory: tx.theory ?? base.theory,
  };
}

/**
 * Returns a shallow-merged copy of the module with translated fields
 * substituted in. Falls back to English for any field not covered.
 */
export function localizeModule(module: Module, tx: ModuleTx | undefined): Module {
  if (!tx) return module;
  return {
    ...module,
    title: tx.title ?? module.title,
    blurb: tx.blurb ?? module.blurb,
    lessons: module.lessons.map((l) =>
      applyLesson(l, tx.lessons?.[l.id])
    ),
    tasks: module.tasks.map((t) =>
      applyTask(t, tx.tasks?.[t.id])
    ),
  };
}
