# ShaderForge

An interactive, frontend-only learning platform for GLSL shaders and vector
mathematics. Ten modules of theory + tasks, an in-browser ShaderToy-style
editor, automatic per-pixel validation, progressive hints, and progress
persisted to `localStorage`.

```
npm install
npm run dev      # http://localhost:5173
npm run build
npm run preview
```

Requires a browser with WebGL2.

---

## What's inside

### Curriculum

| #  | Module                       | Status                                            |
|----|------------------------------|---------------------------------------------------|
| 01 | Vectors & Coordinates        | 5 tasks (uv, dot, cross, aspect, change-of-basis) |
| 02 | **Distance & SDF**           | **4 lessons + 5 tasks** (featured)                |
| 03 | Shape Operations             | 1 task                                            |
| 04 | Transformations              | 3 tasks (rotate, TRS, perspective divide)         |
| 05 | Lighting & Dot Product       | 4 tasks (Lambert, Phong, reflect, multi-light)    |
| 06 | GLSL Utility Functions       | 1 task                                            |
| 07 | Tiling & Patterns            | 1 task                                            |
| 08 | Noise                        | 3 tasks (value, fbm, domain warp)                 |
| 09 | Animation                    | 1 task                                            |
| 10 | Composition                  | 2 tasks (glow, fireball)                          |
| 11 | Projection & Cameras         | 2 tasks (perspective grid, lookAt)                |
| 12 | Rasterization                | 3 tasks (triangle fill, varying interp, z-buffer) |
| 13 | Ray Tracing (2D)             | 2 tasks (ray–disk, shaded hit)                    |
| 14 | Sphere Tracing               | 2 tasks (march loop, FD normals)                  |
| 15 | Raycasting (FPS)             | 2 tasks (column heights, tile-map raycaster)      |

Modules 11–15 are direct adaptations of the [ssloy](https://github.com/ssloy)
software-rendering courses (`tinyrenderer`, `tinyraytracer`, `tinyraycaster`,
`tinykaboom`), reworked into 2D fragment-shader form so each technique fits in
a single GLSL file the learner can edit live. **Distance & SDF** is the
reference implementation; the `ShaderTask` schema is identical across modules,
so adding a task is purely a content edit — no engine work required.

### Task types

`build` (write from scratch), `modify` (complete missing logic), `debug` (fix a
broken shader), `optimize` (improve performance/readability) — declared per
task and surfaced in the UI as a tag.

---

## Architecture

```
src/
├── engine/
│   ├── shaderRunner.ts   WebGL2 fullscreen-triangle runner with iTime / iResolution / iMouse
│   ├── validation.ts     Pluggable validation engine (pixel | function | pattern)
│   └── validators.ts     Named function validators (e.g. centeredDisk)
├── components/
│   ├── ShaderEditor.tsx  CodeMirror 6 editor (cpp lang + onedark)
│   ├── PreviewCanvas.tsx Hosts the WebGL runner; hot-swaps source on change
│   ├── HintSystem.tsx    Progressive (one-at-a-time) hint reveal
│   └── ModuleProgress.tsx Per-module progress bar
├── pages/
│   ├── HomePage.tsx      Curriculum overview + global progress
│   ├── ModulePage.tsx    Module detail: lessons + task cards
│   ├── LessonPage.tsx    Theory page
│   └── TaskPage.tsx      Editor + preview + validation + hints + drafts
├── content/
│   ├── index.ts          MODULES[] index, by-id lookups
│   ├── snippets.ts       Reusable GLSL helpers
│   └── modules/<name>.ts One file per module, fully typed Module objects
├── store/
│   └── progress.ts       Zustand store, persisted to localStorage
├── types.ts              ShaderTask / Module / Validation types
├── styles/global.css
├── App.tsx               Router shell
└── main.tsx              Bootstrap
```

### Shader runner

A single fullscreen triangle drawn from `gl_VertexID` (no VBOs). The user
fragment shader is concatenated with this preamble:

```glsl
#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform vec2  iResolution;
uniform float iTime;
uniform vec2  iMouse;
```

So every task only declares helper functions and `void main()` and writes to
`fragColor`.

The runner exposes `setSource`, `start`, `stop`, `setMouse`, `renderAt(t)` and
`readPixel(u, v)`. `preserveDrawingBuffer: true` is enabled so validation can
sample a previously-rendered frame without forcing a redraw race.

### Validation engine

Three validation modes are supported by the same pipeline:

- **`pixel`** — list of `{ point: [u,v], expected: [r,g,b], tolerance }`.
  The runner is force-rendered at `iTime = 0` and each rule is sampled with
  `glReadPixels`. Pass requires `max-channel-delta ≤ tolerance`.
- **`function`** — references a named validator in
  `src/engine/validators.ts`. Useful when one rule isn't enough (e.g. confirm
  a circle is *centered* by sampling the center bright + four corners dark).
- **`pattern`** — manual self-check; the description is shown to the learner.

A passing validation calls `markComplete(taskId)` on the store.

### State

`zustand` + `persist` middleware. Tracks: completed task ids, unlocked hint
ids, "shown solution" flag per task, and per-task code drafts so editors
preserve work across navigation. Versioned key: `shaderforge.progress.v1`.

### Hints

Progressive: hint N+1 is locked until hint N is revealed. Once revealed,
unlock state persists. There is also an explicit "Show solution" button that
loads `solutionCode` into the editor (and is recorded so the UI can disable
itself afterwards).

---

## Scaling — adding content

### Add a task

Edit the relevant module in `src/content/modules/<name>.ts`, push a new
`ShaderTask` into the `tasks` array. Required fields: `id` (unique), `title`,
`module`, `difficulty`, `tags`, `description`, `goal`, `expectedVisual`,
`starterCode`, `solutionCode`, `hints`, `taskType`. Optional: `theory`,
`validation`, `challenge`.

```ts
{
  id: "ops-02-smin-blob",
  title: "Smooth-min two disks",
  module: "shape-ops",
  difficulty: "medium",
  tags: ["sdf", "smin"],
  taskType: "build",
  description: "...",
  goal: "...",
  expectedVisual: "...",
  starterCode: "...",
  solutionCode: "...",
  hints: [{ id: "h1", content: "..." }],
  validation: { type: "pixel", rules: [...] },
}
```

The task auto-appears on the module page and at `/t/<id>` — no router
edit needed.

### Add a module

1. Create `src/content/modules/myModule.ts` exporting a `Module` object.
2. Import it in `src/content/index.ts` and append to `MODULES`.
3. Pick an `order` value to slot it into the curriculum.

That's the entire integration.

### Add a validator

Add an entry to the `validators` map in `src/engine/validators.ts`, then
reference it from a task with `{ type: "function", validator: "myValidator" }`.

---

## Localization

The platform supports multiple languages via a lightweight i18n scaffold:

- **`src/i18n/index.ts`** — `useLocale` Zustand store (persisted to `localStorage`)
- **`src/i18n/ui.ts`** — UI strings (44 keys in EN + RU)
- **`src/i18n/localize.ts`** — `localizeModule(module, tx)` deep-merge utility
- **`src/content/translations/ru.ts`** — Russian content translations
- **`src/content/index.ts`** — `getLocalizedModule(id, locale)` and `getLocalizedTask(id, locale)` accessors

Pages and components read `locale` from the store and call `useUI(locale)` for UI strings or `getLocalizedModule(id, locale)` for content.

### Adding a new language

1. Create `src/content/translations/xx.ts` exporting a `ContentTranslations` object.
2. Import and wire into the accessors in `src/content/index.ts`.
3. Add UI strings to `src/i18n/ui.ts` (extend the `UIStrings` type and add a translations object).
4. Update `src/i18n/index.ts` type `Locale = "en" | "xx"`.
5. (Optional) Add a locale option to the `LocaleToggle` button in `src/components/LocaleToggle.tsx`.

The `localizeModule` function preserves all code fields (`starterCode`, `solutionCode`, `validation`, etc.) — only display text (titles, descriptions, hints, theory) is translated. Validation rules, task types, and difficulty ratings remain language-agnostic.

---

- **Gamification**: XP per task by difficulty (1/3/5), streaks via daily
  task counter in the store, skill-tree visualization on the home page.
- **AI hints**: an optional "explain my error" button that posts the user's
  source + compile log + the task description to a model — gated behind a
  user-supplied API key, kept out of the bundle.
- **Performance** in the runner: switch to an offscreen canvas + `transferToImageBitmap`
  when validating to avoid disturbing the visible frame; reuse a single GL
  context across previews when stacking many tasks.
- **Code splitting**: lazy-load CodeMirror on the task route to drop ~200kB
  from the home page bundle.

---

## Stack

- React 18 + TypeScript + Vite
- React Router 6
- Zustand (with `persist` middleware)
- CodeMirror 6 (`@uiw/react-codemirror`, cpp lang, one-dark theme)
- Raw WebGL2 (no Three.js) — keeps the runner ~150 LOC and shows the math
