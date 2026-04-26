import { Link, useParams } from "react-router-dom";
import { getModule } from "../content";

export function LessonPage() {
  const { moduleId = "", lessonId = "" } = useParams();
  const mod = getModule(moduleId);
  const lesson = mod?.lessons.find((l) => l.id === lessonId);

  if (!mod || !lesson) {
    return (
      <div className="container">
        <h1>Lesson not found</h1>
        <Link to="/">Back</Link>
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
