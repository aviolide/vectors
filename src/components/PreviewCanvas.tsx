import { useEffect, useRef } from "react";
import { createShaderRunner, type RunnerHandle, type CompileError } from "../engine/shaderRunner";

type Props = {
  source: string;
  onError: (err: CompileError | null) => void;
  onReady?: (runner: RunnerHandle) => void;
};

/**
 * Wraps a single canvas + shader runner. The runner instance is created once
 * per mount; the source is hot-swapped on changes without tearing down GL.
 */
export function PreviewCanvas({ source, onError, onReady }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const runnerRef = useRef<RunnerHandle | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const runner = createShaderRunner(canvas);
    if (!runner) {
      onError({ stage: "link", log: "WebGL2 is not supported in this browser." });
      return;
    }
    runnerRef.current = runner;
    runner.start();
    onReady?.(runner);

    const handleMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (rect.height - (e.clientY - rect.top)) * (canvas.height / rect.height);
      runner.setMouse(x, y);
    };
    canvas.addEventListener("mousemove", handleMouse);

    return () => {
      canvas.removeEventListener("mousemove", handleMouse);
      runner.dispose();
      runnerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const runner = runnerRef.current;
    if (!runner) return;
    const err = runner.setSource(source);
    onError(err);
  }, [source, onError]);

  return <canvas ref={canvasRef} className="preview-canvas" />;
}
