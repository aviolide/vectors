import { Link, NavLink, Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { ModulePage } from "./pages/ModulePage";
import { LessonPage } from "./pages/LessonPage";
import { TaskPage } from "./pages/TaskPage";

export function App() {
  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand__mark">⟁</span>
          <span className="brand__name">ShaderForge</span>
        </Link>
        <nav className="topnav">
          <NavLink to="/" end>
            Modules
          </NavLink>
        </nav>
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
                <h1>Not found</h1>
                <Link to="/">Back to modules</Link>
              </div>
            }
          />
        </Routes>
      </main>
    </div>
  );
}
