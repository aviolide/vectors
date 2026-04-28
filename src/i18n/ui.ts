import type { Locale } from "./index";

type UIStrings = {
  // Navigation
  modules: string;
  curriculum: string;
  tasksComplete: string;

  // Module page
  lessons: string;
  tasks: string;

  // Task page
  description: string;
  goal: string;
  expectedVisual: string;
  theory: string;
  hints: string;
  noHints: string;
  revealHint: string;
  bonusChallenge: string;
  showSolution: string;
  solutionLoaded: string;

  // Toolbar
  run: string;
  reset: string;
  validate: string;
  shaderLive: string;
  error: string;

  // Validation
  validationPass: string;
  validationFail: string;
  fixErrorsFirst: string;

  // Badges / pills
  done: string;
  complete: string;

  // Difficulty
  easy: string;
  medium: string;
  hard: string;

  // Not found
  notFound: string;
  moduleNotFound: string;
  lessonNotFound: string;
  taskNotFound: string;
  backToModules: string;
  back: string;

  // Hero
  heroTitle: string;
  heroBlurb: string;
};

const en: UIStrings = {
  modules: "Modules",
  curriculum: "Curriculum",
  tasksComplete: "tasks complete",

  lessons: "Lessons",
  tasks: "Tasks",

  description: "Description",
  goal: "Goal",
  expectedVisual: "Expected visual",
  theory: "Theory",
  hints: "Hints",
  noHints: "No hints for this task.",
  revealHint: "Reveal hint",
  bonusChallenge: "Bonus challenge",
  showSolution: "Show solution",
  solutionLoaded: "Solution loaded",

  run: "Run",
  reset: "Reset",
  validate: "Validate",
  shaderLive: "● shader live",
  error: "⨯",

  validationPass: "PASS",
  validationFail: "FAIL",
  fixErrorsFirst: "Fix compile errors first.",

  done: "done",
  complete: "complete",

  easy: "Easy",
  medium: "Medium",
  hard: "Hard",

  notFound: "Not found",
  moduleNotFound: "Module not found",
  lessonNotFound: "Lesson not found",
  taskNotFound: "Task not found",
  backToModules: "← Back to modules",
  back: "← Back",

  heroTitle: "Learn GLSL by drawing math.",
  heroBlurb:
    "Ten modules, dozens of tasks, one editor. From writing your first fragment shader to composing complete procedural scenes.",
};

const ru: UIStrings = {
  modules: "Модули",
  curriculum: "Программа",
  tasksComplete: "заданий пройдено",

  lessons: "Уроки",
  tasks: "Задания",

  description: "Описание",
  goal: "Цель",
  expectedVisual: "Ожидаемый результат",
  theory: "Теория",
  hints: "Подсказки",
  noHints: "Нет подсказок к этому заданию.",
  revealHint: "Показать подсказку",
  bonusChallenge: "Бонусный вызов",
  showSolution: "Показать решение",
  solutionLoaded: "Решение загружено",

  run: "Запустить",
  reset: "Сбросить",
  validate: "Проверить",
  shaderLive: "● шейдер активен",
  error: "⨯",

  validationPass: "ПРОЙДЕНО",
  validationFail: "ОШИБКА",
  fixErrorsFirst: "Сначала исправьте ошибки компиляции.",

  done: "готово",
  complete: "пройдено",

  easy: "Лёгкий",
  medium: "Средний",
  hard: "Сложный",

  notFound: "Страница не найдена",
  moduleNotFound: "Модуль не найден",
  lessonNotFound: "Урок не найден",
  taskNotFound: "Задание не найдено",
  backToModules: "← Все модули",
  back: "← Назад",

  heroTitle: "Учи GLSL через математику.",
  heroBlurb:
    "Пятнадцать модулей, десятки заданий, один редактор. От первого фрагментного шейдера до полноценных процедурных сцен.",
};

const strings: Record<Locale, UIStrings> = { en, ru };
export const useUI = (locale: Locale): UIStrings => strings[locale];
