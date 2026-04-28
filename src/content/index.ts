import type { Module, ShaderTask } from "../types";
import { localizeModule } from "../i18n/localize";
import type { Locale } from "../i18n";
import { ru } from "./translations/ru";
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
import { projectionModule } from "./modules/projection";
import { rasterizationModule } from "./modules/rasterization";
import { raytracing2dModule } from "./modules/raytracing2d";
import { raymarchingModule } from "./modules/raymarching";
import { raycastingModule } from "./modules/raycasting";

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
  projectionModule,
  rasterizationModule,
  raytracing2dModule,
  raymarchingModule,
  raycastingModule,
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

export function getLocalizedModule(id: string, locale: Locale): Module | undefined {
  const raw = moduleById.get(id);
  if (!raw) return undefined;
  if (locale === "en") return raw;
  return localizeModule(raw, ru[id]);
}

export function getLocalizedTask(
  id: string,
  locale: Locale
): { module: Module; task: ShaderTask } | undefined {
  const found = taskIndex.get(id);
  if (!found) return undefined;
  if (locale === "en") return found;
  const locMod = localizeModule(found.module, ru[found.module.id]);
  const locTask = locMod.tasks.find((t) => t.id === id);
  return locTask ? { module: locMod, task: locTask } : found;
}
