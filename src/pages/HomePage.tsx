import { Link } from "react-router-dom";
import { MODULES, getLocalizedModule } from "../content";
import { ModuleProgress } from "../components/ModuleProgress";
import { useProgress } from "../store/progress";
import { useLocale } from "../i18n";
import { useUI } from "../i18n/ui";

export function HomePage() {
  const locale = useLocale((s) => s.locale);
  const ui = useUI(locale);
  const completed = useProgress((s) => s.completedTaskIds);
  const totalTasks = MODULES.reduce((acc, m) => acc + m.tasks.length, 0);
  const doneTasks = MODULES.reduce(
    (acc, m) => acc + m.tasks.filter((t) => completed[t.id]).length,
    0
  );
  const localizedModules = MODULES.map((m) => getLocalizedModule(m.id, locale) ?? m);

  return (
    <div className="container">
      <section className="hero">
        <h1>{ui.heroTitle}</h1>
        <p>{ui.heroBlurb}</p>
        <div className="hero__stats">
          <span>
            <strong>{doneTasks}</strong> / {totalTasks} {ui.tasksComplete}
          </span>
        </div>
      </section>

      <section>
        <h2>{ui.curriculum}</h2>
        <ul className="modlist">
          {localizedModules.map((m) => (
            <li key={m.id} className="modcard">
              <Link to={`/m/${m.id}`} className="modcard__link">
                <div className="modcard__head">
                  <span className="modcard__order">
                    {String(m.order).padStart(2, "0")}
                  </span>
                  <h3>{m.title}</h3>
                </div>
                <p>{m.blurb}</p>
                <ModuleProgress module={m} />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
