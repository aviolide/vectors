import { Link, useParams } from "react-router-dom";
import { useCallback, useMemo, useRef, useState } from "react";
import { getLocalizedTask } from "../content";
import { ShaderEditor } from "../components/ShaderEditor";
import { PreviewCanvas } from "../components/PreviewCanvas";
import { HintSystem } from "../components/HintSystem";
import { useProgress } from "../store/progress";
import { runValidation, type ValidationResult } from "../engine/validation";
import { validators } from "../engine/validators";
import type { CompileError, RunnerHandle } from "../engine/shaderRunner";
import { useLocale } from "../i18n";
import { useUI } from "../i18n/ui";

export function TaskPage() {
  const { taskId = "" } = useParams();
  const locale = useLocale((s) => s.locale);
  const ui = useUI(locale);
  const found = getLocalizedTask(taskId, locale);

  const getDraft = useProgress((s) => s.getDraft);
  const saveDraft = useProgress((s) => s.saveDraft);
  const markComplete = useProgress((s) => s.markComplete);
  const isComplete = useProgress((s) => s.isComplete(taskId));
  const showSolution = useProgress((s) => s.showSolution);
  const hasShownSolution = useProgress((s) => s.hasShownSolution(taskId));

  const initial = useMemo(
    () => getDraft(taskId) ?? found?.task.starterCode ?? "",
    // load once per task
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [taskId]
  );
  const [code, setCode] = useState(initial);
  const [liveCode, setLiveCode] = useState(initial);
  const [compileErr, setCompileErr] = useState<CompileError | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const runnerRef = useRef<RunnerHandle | null>(null);

  const handleEdit = useCallback(
    (next: string) => {
      setCode(next);
      saveDraft(taskId, next);
    },
    [saveDraft, taskId]
  );

  const handleRun = useCallback(() => {
    setLiveCode(code);
    setValidation(null);
  }, [code]);

  const handleReset = useCallback(() => {
    if (!found) return;
    setCode(found.task.starterCode);
    setLiveCode(found.task.starterCode);
    saveDraft(taskId, found.task.starterCode);
    setValidation(null);
  }, [found, saveDraft, taskId]);

  const handleValidate = useCallback(() => {
    if (!found || !runnerRef.current) return;
    if (compileErr) {
      setValidation({ pass: false, details: [], message: ui.fixErrorsFirst });
      return;
    }
    const result = runValidation(runnerRef.current, found.task.validation, validators);
    setValidation(result);
    if (result.pass) markComplete(found.task.id);
  }, [found, compileErr, markComplete, ui.fixErrorsFirst]);

  const handleShowSolution = useCallback(() => {
    if (!found) return;
    showSolution(found.task.id);
    setCode(found.task.solutionCode);
    setLiveCode(found.task.solutionCode);
    saveDraft(taskId, found.task.solutionCode);
  }, [found, showSolution, saveDraft, taskId]);

  const handleErrorRef = useRef(setCompileErr);
  handleErrorRef.current = setCompileErr;
  const onPreviewError = useCallback((e: CompileError | null) => {
    handleErrorRef.current(e);
  }, []);

  const onPreviewReady = useCallback((r: RunnerHandle) => {
    runnerRef.current = r;
  }, []);

  if (!found) {
    return (
      <div className="container">
        <h1>{ui.taskNotFound}</h1>
        <Link to="/">{ui.backToModules}</Link>
      </div>
    );
  }

  const { task, module: mod } = found;

  return (
    <div className="taskpage">
      <aside className="taskpage__panel">
        <Link to={`/m/${mod.id}`} className="backlink">
          ← {mod.title}
        </Link>
        <div className="taskpage__head">
          <h1>{task.title}</h1>
          <div className="taskpage__meta">
            <span className={`pill pill--${task.difficulty}`}>{task.difficulty}</span>
            <span className="pill">{task.taskType}</span>
            {isComplete && <span className="badge badge--done">{ui.complete}</span>}
          </div>
        </div>

        <section>
          <h2>{ui.description}</h2>
          <p>{task.description}</p>
        </section>

        <section>
          <h2>{ui.goal}</h2>
          <p>{task.goal}</p>
        </section>

        <section>
          <h2>{ui.expectedVisual}</h2>
          <p>{task.expectedVisual}</p>
        </section>

        {task.theory && (
          <section>
            <h2>{ui.theory}</h2>
            <p>{task.theory}</p>
          </section>
        )}

        <HintSystem taskId={task.id} hints={task.hints} />

        {task.challenge && (
          <section className="challenge">
            <h2>{ui.bonusChallenge}</h2>
            <p>{task.challenge.description}</p>
          </section>
        )}

        <section className="taskpage__actions">
          <button onClick={handleShowSolution} disabled={hasShownSolution}>
            {hasShownSolution ? ui.solutionLoaded : ui.showSolution}
          </button>
        </section>
      </aside>

      <section className="taskpage__work">
        <div className="taskpage__editor">
          <div className="toolbar">
            <button className="btn btn--primary" onClick={handleRun}>
              {ui.run}
            </button>
            <button className="btn" onClick={handleReset}>
              {ui.reset}
            </button>
            <button className="btn btn--accent" onClick={handleValidate}>
              {ui.validate}
            </button>
            <span className="toolbar__spacer" />
            {compileErr ? (
              <span className="status status--err">
                {ui.error} {compileErr.stage} error
              </span>
            ) : (
              <span className="status status--ok">{ui.shaderLive}</span>
            )}
          </div>
          <ShaderEditor value={code} onChange={handleEdit} />
        </div>

        <div className="taskpage__preview">
          <PreviewCanvas
            source={liveCode}
            onError={onPreviewError}
            onReady={onPreviewReady}
          />
          {compileErr && (
            <pre className="errorlog">
              <strong>{compileErr.stage} error</strong>
              {"\n"}
              {compileErr.log}
            </pre>
          )}
          {validation && (
            <div
              className={`valresult ${
                validation.pass ? "valresult--pass" : "valresult--fail"
              }`}
            >
              <strong>{validation.pass ? ui.validationPass : ui.validationFail}</strong>
              <span>{validation.message}</span>
              {validation.details.length > 0 && (
                <ul className="valresult__list">
                  {validation.details.map((d, i) => (
                    <li key={i} className={d.pass ? "ok" : "ko"}>
                      uv ({d.rule.point[0].toFixed(2)},{" "}
                      {d.rule.point[1].toFixed(2)}) → rgb(
                      {d.actual.map((c) => c.toFixed(2)).join(", ")}) — Δ{" "}
                      {d.delta.toFixed(2)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
