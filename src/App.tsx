import { Link, NavLink, Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { ModulePage } from "./pages/ModulePage";
import { LessonPage } from "./pages/LessonPage";
import { TaskPage } from "./pages/TaskPage";
import { LocaleToggle } from "./components/LocaleToggle";
import { useLocale } from "./i18n";
import { useUI } from "./i18n/ui";

export function App() {
  const locale = useLocale((s) => s.locale);
  const ui = useUI(locale);

  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand__mark">⟁</span>
          <span className="brand__name">ShaderForge</span>
        </Link>
        <nav className="topnav">
          <NavLink to="/" end>
            {ui.modules}
          </NavLink>
        </nav>
        <LocaleToggle />
      </header>
      <main className="appmain">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/m/:moduleId" element={<ModulePage />} />
          <Route path="/m/:moduleId/lesson/:lessonId" element={<LessonPage />} />
          <Route path="/t/:taskId" element={<TaskPage />} />
          <Route
            path="*"
            element={
              <div className="container">
                <h1>{ui.notFound}</h1>
                <Link to="/">{ui.backToModules}</Link>
              </div>
            }
          />
        </Routes>
      </main>
    </div>
  );
}
