import { Link, useParams } from "react-router-dom";
import { getLocalizedModule } from "../content";
import { useLocale } from "../i18n";
import { useUI } from "../i18n/ui";

export function LessonPage() {
  const { moduleId = "", lessonId = "" } = useParams();
  const locale = useLocale((s) => s.locale);
  const ui = useUI(locale);
  const mod = getLocalizedModule(moduleId, locale);
  const lesson = mod?.lessons.find((l) => l.id === lessonId);

  if (!mod || !lesson) {
    return (
      <div className="container">
        <h1>{ui.lessonNotFound}</h1>
        <Link to="/">{ui.backToModules}</Link>
      </div>
    );
  }

  return (
    <div className="container container--prose">
      <Link to={`/m/${mod.id}`} className="backlink">
        ← {mod.title}
      </Link>
      <h1>{lesson.title}</h1>
      {lesson.theory.split("\n\n").map((para, i) => (
        <p key={i}>{para}</p>
      ))}
      {lesson.example && (
        <pre className="codeblock">
          <code>{lesson.example}</code>
        </pre>
      )}
    </div>
  );
}
