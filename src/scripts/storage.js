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

// Повертає розібрані дані або null, якщо запису немає чи він зіпсований
function readJson(key) {
  try {
    const raw = localStorage.getItem(key);

    return raw === null ? null : JSON.parse(raw);
  } catch (error) {
    console.warn(`Could not read "${key}" from localStorage:`, error);

    return null;
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

function normalizeTasks(items) {
  const seenIds = new Set();

  return items.map(normalizeTask).filter((task) => {
    if (task === null || seenIds.has(task.id)) {
      return false; // непридатний запис або повтор id
    }

    seenIds.add(task.id);

    return true;
  });
}

function normalizeSessions(items) {
  return items
    .filter(
      (item) =>
        item !== null &&
        typeof item === "object" &&
        isDateKey(item.date) &&
        Number.isInteger(item.minutes) &&
        item.minutes > 0,
    )
    .map(({ date, minutes }) => ({ date, minutes }));
}

// ---------- Публічний інтерфейс ----------

export function getTasks() {
  const stored = readJson(TASKS_KEY);

  // Немає запису (перший візит) або він зіпсований: показуємо демо
  if (!Array.isArray(stored)) {
    return createDefaultTasks();
  }

  return normalizeTasks(stored);
}

export function getSessions() {
  const stored = readJson(SESSIONS_KEY);

  if (!Array.isArray(stored)) {
    return createDefaultSessions();
  }

  return normalizeSessions(stored);
}

export function saveTasks(tasks) {
  return writeJson(TASKS_KEY, tasks);
}

export function saveSessions(sessions) {
  return writeJson(SESSIONS_KEY, sessions);
}