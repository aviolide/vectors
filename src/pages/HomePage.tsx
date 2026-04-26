import { Link } from "react-router-dom";
import { MODULES } from "../content";
import { ModuleProgress } from "../components/ModuleProgress";
import { useProgress } from "../store/progress";

export function HomePage() {
  const completed = useProgress((s) => s.completedTaskIds);
  const totalTasks = MODULES.reduce((acc, m) => acc + m.tasks.length, 0);
  const doneTasks = MODULES.reduce(
    (acc, m) => acc + m.tasks.filter((t) => completed[t.id]).length,
    0
  );

  return (
    <div className="container">
      <section className="hero">
        <h1>Learn GLSL by drawing math.</h1>
        <p>
          Ten modules, dozens of tasks, one editor. From writing your first
          fragment shader to composing complete procedural scenes.
        </p>
        <div className="hero__stats">
          <span>
            <strong>{doneTasks}</strong> / {totalTasks} tasks complete
          </span>
        </div>
      </section>

      <section>
        <h2>Curriculum</h2>
        <ul className="modlist">
          {MODULES.map((m) => (
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
