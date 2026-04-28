import { Link, useParams } from "react-router-dom";
import { getLocalizedModule } from "../content";
import { ModuleProgress } from "../components/ModuleProgress";
import { useProgress } from "../store/progress";
import { useLocale } from "../i18n";
import { useUI } from "../i18n/ui";

export function ModulePage() {
  const { moduleId = "" } = useParams();
  const locale = useLocale((s) => s.locale);
  const ui = useUI(locale);
  const mod = getLocalizedModule(moduleId, locale);
  const isComplete = useProgress((s) => s.completedTaskIds);

  if (!mod) {
    return (
      <div className="container">
        <h1>{ui.moduleNotFound}</h1>
        <Link to="/">{ui.backToModules}</Link>
      </div>
    );
  }

  const difficultyLabel: Record<string, string> = {
    easy: ui.easy,
    medium: ui.medium,
    hard: ui.hard,
  };

  return (
    <div className="container">
      <Link to="/" className="backlink">
        {ui.backToModules}
      </Link>
      <header className="modhead">
        <div>
          <span className="modhead__order">
            {String(mod.order).padStart(2, "0")}
          </span>
          <h1>{mod.title}</h1>
        </div>
        <p>{mod.blurb}</p>
        <ModuleProgress module={mod} />
      </header>

      {mod.lessons.length > 0 && (
        <section>
          <h2>{ui.lessons}</h2>
          <ul className="lessonlist">
            {mod.lessons.map((l) => (
              <li key={l.id}>
                <Link to={`/m/${mod.id}/lesson/${l.id}`}>{l.title}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2>{ui.tasks}</h2>
        <ul className="tasklist">
          {mod.tasks.map((t) => (
            <li key={t.id} className="taskcard">
              <Link to={`/t/${t.id}`} className="taskcard__link">
                <div className="taskcard__row">
                  <h3>{t.title}</h3>
                  {isComplete[t.id] && (
                    <span className="badge badge--done">{ui.done}</span>
                  )}
                </div>
                <p>{t.description}</p>
                <div className="taskcard__meta">
                  <span className={`pill pill--${t.difficulty}`}>
                    {difficultyLabel[t.difficulty] ?? t.difficulty}
                  </span>
                  <span className="pill">{t.taskType}</span>
                  {t.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="pill pill--ghost">
                      #{tag}
                    </span>
                  ))}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
