export function calculateStatistics(tasks, sessions) {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const studyMinutes = sessions.reduce((sum, session) => sum + session.minutes, 0);
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  return { total, completed, studyMinutes, progress };
}

export function formatStudyTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours}h ${minutes}m`;
}

export function renderStatistics(tasks, sessions) {
  const { total, completed, studyMinutes, progress } = calculateStatistics(tasks, sessions);

  const values = {
    total,
    completed,
    time: formatStudyTime(studyMinutes),
    progress: `${progress}%`,
  };

  document.querySelectorAll("[data-stat]").forEach((element) => {
    element.textContent = values[element.dataset.stat];
  });
}