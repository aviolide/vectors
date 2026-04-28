import type { Hint } from "../types";
import { useProgress } from "../store/progress";
import { useLocale } from "../i18n";
import { useUI } from "../i18n/ui";

type Props = { taskId: string; hints: Hint[] };

export function HintSystem({ taskId, hints }: Props) {
  const locale = useLocale((s) => s.locale);
  const ui = useUI(locale);
  const isHintUnlocked = useProgress((s) => s.isHintUnlocked);
  const unlockHint = useProgress((s) => s.unlockHint);
  // Subscribe to the bag so re-renders happen on unlocks.
  useProgress((s) => s.unlockedHints);

  const firstLockedIdx = hints.findIndex((h) => !isHintUnlocked(taskId, h.id));

  return (
    <div className="hints">
      <h3>{ui.hints}</h3>
      {hints.length === 0 && <p className="muted">{ui.noHints}</p>}
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
                  {ui.revealHint} {i + 1}
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
