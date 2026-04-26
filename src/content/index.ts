import type { Module, ShaderTask } from "../types";
import { vectorsCoordsModule } from "./modules/vectorsCoords";
import { distanceSdfModule } from "./modules/distanceSdf";
import { shapeOpsModule } from "./modules/shapeOps";
import { transformsModule } from "./modules/transforms";
import { lightingModule } from "./modules/lighting";
import { utilsModule } from "./modules/utils";
import { tilingModule } from "./modules/tiling";
import { noiseModule } from "./modules/noise";
import { animationModule } from "./modules/animation";
import { compositionModule } from "./modules/composition";

/**
 * Curriculum index. Order is the canonical learning path; each module is
 * self-contained. To add a new module: create src/content/modules/<name>.ts,
 * import it here, and append to MODULES. The router and store are
 * data-driven and require no other changes.
 */
export const MODULES: Module[] = [
  vectorsCoordsModule,
  distanceSdfModule,
  shapeOpsModule,
  transformsModule,
  lightingModule,
  utilsModule,
  tilingModule,
  noiseModule,
  animationModule,
  compositionModule,
].sort((a, b) => a.order - b.order);

const moduleById = new Map(MODULES.map((m) => [m.id, m]));
export function getModule(id: string): Module | undefined {
  return moduleById.get(id);
}

const taskIndex = new Map<string, { module: Module; task: ShaderTask }>();
for (const m of MODULES) {
  for (const t of m.tasks) taskIndex.set(t.id, { module: m, task: t });
}
export function getTask(id: string): { module: Module; task: ShaderTask } | undefined {
  return taskIndex.get(id);
}

export function allTasks(): ShaderTask[] {
  return MODULES.flatMap((m) => m.tasks);
}
