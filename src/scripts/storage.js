import { addDays, getWeekStart, isDateKey, toDateKey } from "./dates.js";

const TASKS_KEY = "study-tracker:v1:tasks";
const SESSIONS_KEY = "study-tracker:v1:sessions";

// ---------- Демо-дані (перший візит або зіпсований запис) ----------

// Демо-завдання: дати завжди в поточному тижні, щоб у календарі були крапки
function createDefaultTasks() {
  const weekStart = getWeekStart(new Date());
  const dayKey = (offset) => toDateKey(addDays(weekStart, offset));

  return [
    { id: "task-1", title: "JavaScript practice", category: "javascript", minutes: 60, date: dayKey(0), completed: true },
    { id: "task-2", title: "React components", category: "react", minutes: 90, date: dayKey(0), completed: false },
    { id: "task-3", title: "English lesson", category: "english", minutes: 45, date: dayKey(2), completed: true },
    { id: "task-4", title: "CSS Grid practice", category: "css", minutes: 60, date: dayKey(2), completed: false },
    { id: "task-5", title: "Build portfolio page", category: "project", minutes: 120, date: dayKey(6), completed: false },
    { id: "task-6", title: "HTML semantic markup", category: "html", minutes: 40, date: dayKey(2), completed: true },
    { id: "task-7", title: "Git basics review", category: "other", minutes: 30, date: dayKey(6), completed: true },
    { id: "task-8", title: "Async JavaScript", category: "javascript", minutes: 75, date: dayKey(6), completed: true },
  ];
}

// Демо-сесії навчання (хвилини за день), разом 750 хв = 12h 30m
function createDefaultSessions() {
  const today = new Date();
  const dayKey = (offset) => toDateKey(addDays(today, offset));

  return [
    { date: dayKey(-1), minutes: 150 },
    { date: dayKey(-2), minutes: 125 },
    { date: dayKey(-3), minutes: 200 },
    { date: dayKey(-4), minutes: 150 },
    { date: dayKey(-5), minutes: 125 },
  ];
}

// ---------- Робота з LocalStorage ----------

// Повертає { status: "missing" } (запису немає або сховище недоступне),
// { status: "damaged" } (не розбирається) або { status: "ok", value }
function readStored(key) {
  let raw;

  try {
    raw = localStorage.getItem(key);
  } catch (error) {
    console.warn(`localStorage is not available for "${key}":`, error);

    return { status: "missing" };
  }

  if (raw === null) {
    return { status: "missing" };
  }

  try {
    return { status: "ok", value: JSON.parse(raw) };
  } catch (error) {
    console.warn(`Stored data for "${key}" is damaged:`, error);

    return { status: "damaged" };
  }
}

// Повертає true, якщо збережено (сховище може бути заповнене або заблоковане)
function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));

    return true;
  } catch (error) {
    console.warn(`Could not save "${key}" to localStorage:`, error);

    return false;
  }
}

// ---------- Очищення прочитаних даних ----------

// Повертає охайне завдання або null, якщо запис непридатний
function normalizeTask(item) {
  if (item === null || typeof item !== "object") {
    return null;
  }

  const { id, title, category, minutes, date, completed } = item;
  const cleanTitle = typeof title === "string" ? title.trim() : "";

  if (
    typeof id !== "string" ||
    id === "" ||
    cleanTitle === "" ||
    !Number.isInteger(minutes) ||
    minutes <= 0 ||
    !isDateKey(date)
  ) {
    return null;
  }

  return {
    id,
    title: cleanTitle,
    category: typeof category === "string" ? category : "other",
    minutes,
    date,
    completed: completed === true,
  };
}

// Повертає { items, skipped }: придатні завдання й кількість відкинутих записів
function normalizeTasks(items) {
  const seenIds = new Set();

  const tasks = items.map(normalizeTask).filter((task) => {
    if (task === null || seenIds.has(task.id)) {
      return false; // непридатний запис або повтор id
    }

    seenIds.add(task.id);

    return true;
  });

  return { items: tasks, skipped: items.length - tasks.length };
}

function normalizeSessions(items) {
  const sessions = items
    .filter(
      (item) =>
        item !== null &&
        typeof item === "object" &&
        isDateKey(item.date) &&
        Number.isInteger(item.minutes) &&
        item.minutes > 0,
    )
    .map(({ date, minutes }) => ({ date, minutes }));

  return { items: sessions, skipped: items.length - sessions.length };
}

// ---------- Публічний інтерфейс ----------

// Обидві функції повертають { items, issue }, де issue = null | "damaged" | "skipped"
export function getTasks() {
  const stored = readStored(TASKS_KEY);

  if (stored.status === "missing") {
    return { items: createDefaultTasks(), issue: null }; // перший запуск
  }

  if (stored.status === "damaged" || !Array.isArray(stored.value)) {
    return { items: [], issue: "damaged" };
  }

  const { items, skipped } = normalizeTasks(stored.value);

  return { items, issue: skipped > 0 ? "skipped" : null };
}

export function getSessions() {
  const stored = readStored(SESSIONS_KEY);

  if (stored.status === "missing") {
    return { items: createDefaultSessions(), issue: null };
  }

  if (stored.status === "damaged" || !Array.isArray(stored.value)) {
    return { items: [], issue: "damaged" };
  }

  const { items, skipped } = normalizeSessions(stored.value);

  return { items, issue: skipped > 0 ? "skipped" : null };
}

export function saveTasks(tasks) {
  return writeJson(TASKS_KEY, tasks);
}

export function saveSessions(sessions) {
  return writeJson(SESSIONS_KEY, sessions);
}