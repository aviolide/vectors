import { useProgress } from "../store/progress";
import type { Module } from "../types";

export function ModuleProgress({ module }: { module: Module }) {
  const completed = useProgress((s) => s.completedTaskIds);
  const done = module.tasks.filter((t) => completed[t.id]).length;
  const total = module.tasks.length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="mod-progress" aria-label={`${done} of ${total} tasks complete`}>
      <div className="mod-progress__bar">
        <div className="mod-progress__fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="mod-progress__label">
        {done} / {total}
      </div>
    </div>
  );
}
