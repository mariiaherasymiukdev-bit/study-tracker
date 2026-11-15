import "@fontsource-variable/inter";

import { initCalendar, renderCalendar } from "./calendar.js";
import { getSessions, getTasks } from "./storage.js";
import { renderStatistics } from "./statistics.js";
import { initTasks } from "./tasks.js";

const sessions = getSessions();

// Викликається після кожної зміни завдань
function renderDashboard(tasks) {
  renderStatistics(tasks, sessions);
  renderCalendar(tasks);
}

initCalendar();
initTasks(getTasks(), renderDashboard);