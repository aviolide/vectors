import type { Hint } from "../types";
import { useProgress } from "../store/progress";

type Props = { taskId: string; hints: Hint[] };

/**
 * Progressive hints: each hint unlocks the next. We never auto-reveal — the
 * learner must explicitly request the next one. Once a hint is unlocked it
 * stays unlocked across sessions (persisted).
 */
export function HintSystem({ taskId, hints }: Props) {
  const isHintUnlocked = useProgress((s) => s.isHintUnlocked);
  const unlockHint = useProgress((s) => s.unlockHint);
  // Subscribe to the bag so re-renders happen on unlocks.
  useProgress((s) => s.unlockedHints);

  const firstLockedIdx = hints.findIndex((h) => !isHintUnlocked(taskId, h.id));

  return (
    <div className="hints">
      <h3>Hints</h3>
      {hints.length === 0 && <p className="muted">No hints for this task.</p>}
      <ol>
        {hints.map((h, i) => {
          const unlocked = isHintUnlocked(taskId, h.id);
          if (unlocked) {
            return (
              <li key={h.id} className="hint hint--unlocked">
                {h.content}
              </li>
            );
          }
          if (i === firstLockedIdx) {
            return (
              <li key={h.id} className="hint hint--locked">
                <button onClick={() => unlockHint(taskId, h.id)}>
                  Reveal hint {i + 1}
                </button>
              </li>
            );
          }
          return (
            <li key={h.id} className="hint hint--queued">
              <span className="muted">Hint {i + 1} — locked</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
