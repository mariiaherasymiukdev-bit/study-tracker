import "@fontsource-variable/inter";

import { initCalendar, renderCalendar } from "./calendar.js";
import { getSessions, getTasks, saveSessions, saveTasks } from "./storage.js";
import { renderStatistics } from "./statistics.js";
import { initTasks } from "./tasks.js";
import { initTimer } from "./timer.js";

let currentTasks = [];
let sessions = getSessions();

// Викликається після кожної зміни завдань (і один раз на старті)
function handleTasksChange(tasks) {
  currentTasks = tasks;
  saveTasks(currentTasks);
  renderStatistics(currentTasks, sessions);
  renderCalendar(currentTasks);
}

// Викликається, коли таймер завершив фокус-сесію
function handleSessionComplete(session) {
  sessions = [...sessions, session];
  saveSessions(sessions);
  renderStatistics(currentTasks, sessions);
}

initCalendar();
initTasks(getTasks(), handleTasksChange);
initTimer(handleSessionComplete);