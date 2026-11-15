import "@fontsource-variable/inter";

import { initCalendar, renderCalendar } from "./calendar.js";
import { getSessions, getTasks, saveSessions, saveTasks } from "./storage.js";
import { renderStatistics } from "./statistics.js";
import { initTasks } from "./tasks.js";
import { initTimer } from "./timer.js";

const ISSUE_MESSAGES = {
  tasks: {
    damaged: "Saved tasks could not be loaded because the data is damaged.",
    skipped: "Some saved tasks were damaged and have been skipped.",
  },
  sessions: {
    damaged: "Saved study sessions could not be loaded because the data is damaged.",
    skipped: "Some saved study sessions were damaged and have been skipped.",
  },
};

const noticeElement = document.querySelector("#storage-notice");

const storedTasks = getTasks();
const storedSessions = getSessions();

let currentTasks = [];
let sessions = storedSessions.items;

// Незакриті проблеми зі збереженими даними (null = усе гаразд)
const issues = { tasks: storedTasks.issue, sessions: storedSessions.issue };

function updateNotice() {
  const messages = Object.entries(issues)
    .filter(([, issue]) => issue !== null)
    .map(([name, issue]) => ISSUE_MESSAGES[name][issue]);

  noticeElement.textContent =
    messages.length > 0 ? `${messages.join(" ")} Your next change will replace the stored data.` : "";
  noticeElement.hidden = messages.length === 0;
}

function renderDashboard(tasks) {
  currentTasks = tasks;
  renderStatistics(currentTasks, sessions);
  renderCalendar(currentTasks);
}

// Викликається після кожної зміни завдань користувачем
function handleTasksChange(tasks) {
  // Успішне збереження замінило зіпсовані дані, тож проблема більше не актуальна
  if (saveTasks(tasks)) {
    issues.tasks = null;
    updateNotice();
  }

  renderDashboard(tasks);
}

// Викликається, коли таймер завершив фокус-сесію
function handleSessionComplete(session) {
  sessions = [...sessions, session];

  if (saveSessions(sessions)) {
    issues.sessions = null;
    updateNotice();
  }

  renderStatistics(currentTasks, sessions);
}

initCalendar();
initTasks(storedTasks.items, handleTasksChange);
renderDashboard(storedTasks.items);
initTimer(handleSessionComplete);
updateNotice();