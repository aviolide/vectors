import { create } from "zustand";
import { persist } from "zustand/middleware";

type ProgressState = {
  completedTaskIds: Record<string, true>;
  unlockedHints: Record<string, true>; // key: `${taskId}:${hintId}`
  shownSolutions: Record<string, true>;
  /** Per-task user code drafts. */
  drafts: Record<string, string>;

  markComplete: (taskId: string) => void;
  isComplete: (taskId: string) => boolean;
  unlockHint: (taskId: string, hintId: string) => void;
  isHintUnlocked: (taskId: string, hintId: string) => boolean;
  showSolution: (taskId: string) => void;
  hasShownSolution: (taskId: string) => boolean;
  saveDraft: (taskId: string, code: string) => void;
  getDraft: (taskId: string) => string | undefined;
  reset: () => void;
};

const hintKey = (taskId: string, hintId: string) => `${taskId}:${hintId}`;

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      completedTaskIds: {},
      unlockedHints: {},
      shownSolutions: {},
      drafts: {},

      markComplete: (taskId) =>
        set((s) => ({ completedTaskIds: { ...s.completedTaskIds, [taskId]: true } })),
      isComplete: (taskId) => !!get().completedTaskIds[taskId],

      unlockHint: (taskId, hintId) =>
        set((s) => ({
          unlockedHints: { ...s.unlockedHints, [hintKey(taskId, hintId)]: true },
        })),
      isHintUnlocked: (taskId, hintId) => !!get().unlockedHints[hintKey(taskId, hintId)],

      showSolution: (taskId) =>
        set((s) => ({ shownSolutions: { ...s.shownSolutions, [taskId]: true } })),
      hasShownSolution: (taskId) => !!get().shownSolutions[taskId],

      saveDraft: (taskId, code) =>
        set((s) => ({ drafts: { ...s.drafts, [taskId]: code } })),
      getDraft: (taskId) => get().drafts[taskId],

      reset: () =>
        set({
          completedTaskIds: {},
          unlockedHints: {},
          shownSolutions: {},
          drafts: {},
        }),
    }),
    { name: "shaderforge.progress.v1" }
  )
);
