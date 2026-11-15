import "@fontsource-variable/inter";

import { initCalendar, renderCalendar } from "./calendar.js";
import { getSessions, getTasks } from "./storage.js";
import { renderStatistics } from "./statistics.js";
import { initTasks } from "./tasks.js";
import { initTimer } from "./timer.js";

let currentTasks = [];
let sessions = getSessions();

// Викликається після кожної зміни завдань
function renderDashboard(tasks) {
  currentTasks = tasks;
  renderStatistics(currentTasks, sessions);
  renderCalendar(currentTasks);
}

// Викликається, коли таймер завершив фокус-сесію
function handleSessionComplete(session) {
  sessions = [...sessions, session];
  renderStatistics(currentTasks, sessions);
}

initCalendar();
initTasks(getTasks(), renderDashboard);
initTimer(handleSessionComplete);