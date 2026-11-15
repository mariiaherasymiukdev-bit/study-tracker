import { addDays, getWeekStart, toDateKey } from "./dates.js";

const daysList = document.querySelector("#calendar-days");
const titleElement = document.querySelector("#calendar-title");
const todayButton = document.querySelector("#calendar-today");
const navButtons = document.querySelectorAll("[data-week]");

let weekStart = getWeekStart(new Date());
let currentTasks = [];

// Скільки завдань на кожну дату: Map { "2026-11-09" => 2, ... }
function countTasksByDate(tasks) {
  const counts = new Map();

  tasks.forEach((task) => {
    counts.set(task.date, (counts.get(task.date) ?? 0) + 1);
  });

  return counts;
}

// "November 2026" або, якщо тиждень на межі місяців, "Nov – Dec 2026"
function formatWeekTitle(start, end) {
  if (start.getMonth() === end.getMonth()) {
    return start.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }

  const startPart = start.toLocaleDateString("en-US", {
    month: "short",
    year: start.getFullYear() !== end.getFullYear() ? "numeric" : undefined,
  });
  const endPart = end.toLocaleDateString("en-US", { month: "short", year: "numeric" });

  return `${startPart} – ${endPart}`;
}

function createDayElement(date, taskCount, isToday) {
  const item = document.createElement("li");
  item.className = "calendar__day";

  if (isToday) {
    item.classList.add("calendar__day--today");
    item.setAttribute("aria-current", "date");
  }

  const weekday = document.createElement("span");
  weekday.className = "calendar__weekday";
  weekday.textContent = date.toLocaleDateString("en-US", { weekday: "short" });

  const dateNumber = document.createElement("span");
  dateNumber.className = "calendar__date";
  dateNumber.textContent = String(date.getDate());

  item.append(weekday, dateNumber);

  if (taskCount > 0) {
    const dot = document.createElement("span");
    dot.className = "calendar__dot";
    dot.setAttribute("aria-hidden", "true");

    const hiddenLabel = document.createElement("span");
    hiddenLabel.className = "visually-hidden";
    hiddenLabel.textContent = `${taskCount} ${taskCount === 1 ? "task" : "tasks"}`;

    item.append(dot, hiddenLabel);
  }

  return item;
}

export function renderCalendar(tasks = currentTasks) {
  currentTasks = tasks;

  const counts = countTasksByDate(tasks);
  const todayKey = toDateKey(new Date());
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));

  titleElement.textContent = formatWeekTitle(weekDays[0], weekDays[6]);

  const dayElements = weekDays.map((day) => {
    const key = toDateKey(day);

    return createDayElement(day, counts.get(key) ?? 0, key === todayKey);
  });

  daysList.replaceChildren(...dayElements);
}

function shiftWeek(direction) {
  weekStart = addDays(weekStart, direction * 7);
  renderCalendar();
}

// Викликається один раз, тому слухачі не дублюються
export function initCalendar() {
  navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      shiftWeek(button.dataset.week === "next" ? 1 : -1);
    });
  });

  todayButton.addEventListener("click", () => {
    weekStart = getWeekStart(new Date());
    renderCalendar();
  });
}