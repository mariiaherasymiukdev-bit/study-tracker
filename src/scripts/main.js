import "@fontsource-variable/inter";

import { initCalendar, renderCalendar } from "./calendar.js";
import { getSessions, getTasks } from "./storage.js";
import { renderStatistics } from "./statistics.js";

function render() {
  const tasks = getTasks();
  const sessions = getSessions();

  renderStatistics(tasks, sessions);
  renderCalendar(tasks);
}

initCalendar();
render();