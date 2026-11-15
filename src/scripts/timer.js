import { toDateKey } from "./dates.js";

const TICK_INTERVAL_MS = 250;
const RING_LENGTH = 2 * Math.PI * 90; // довжина кола з r="90" в SVG

const MODE_LABELS = {
  pomodoro: "Pomodoro",
  short: "Short Break",
  long: "Long Break",
};

// Який режим вмикається після завершення поточного (без автозапуску)
const NEXT_MODE = {
  pomodoro: "short",
  short: "pomodoro",
  long: "pomodoro",
};

const FINISH_MESSAGES = {
  pomodoro: "Focus session complete! Your short break is ready. Press Play.",
  short: "Break is over. Ready to focus? Press Play.",
  long: "Break is over. Ready to focus? Press Play.",
};

const timerSection = document.querySelector("#timer");
const timeElement = document.querySelector("#timer-time");
const progressCircle = document.querySelector("#timer-progress");
const toggleButton = document.querySelector("#timer-toggle");
const toggleIcon = document.querySelector("#timer-toggle-icon use");
const resetButton = document.querySelector("#timer-reset");
const statusElement = document.querySelector("#timer-status");
const modeButtons = document.querySelectorAll("[data-mode]");
const modeDialog = document.querySelector("#mode-dialog");
const modeText = document.querySelector("#mode-text");

// Тривалість режимів у мс береться з data-minutes у HTML
const durations = Object.fromEntries(
  [...modeButtons].map((button) => [button.dataset.mode, Number(button.dataset.minutes) * 60 * 1000]),
);

let currentMode = "pomodoro";
let totalMs = durations[currentMode];
let remainingMs = totalMs;
let endTimestamp = null; // коли таймер має дійти до нуля (лише коли йде відлік)
let intervalId = null; // не null = таймер зараз іде
let pendingMode = null; // режим, який чекає підтвердження
let onSessionComplete = () => {};

// ---------- Відображення ----------

function formatTime(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function render() {
  const isRunning = intervalId !== null;
  const progress = totalMs === 0 ? 0 : remainingMs / totalMs;

  timeElement.textContent = formatTime(remainingMs);
  progressCircle.style.strokeDashoffset = String(RING_LENGTH * (1 - progress));
  toggleIcon.setAttribute("href", isRunning ? "#icon-pause" : "#icon-play");
  toggleButton.setAttribute("aria-label", isRunning ? "Pause timer" : "Start timer");
}

function showStatus(message) {
  statusElement.textContent = message;
  timerSection.classList.add("timer--finished");
}

function clearStatus() {
  statusElement.textContent = "";
  timerSection.classList.remove("timer--finished");
}

// ---------- Режими ----------

// Вмикає режим «в тиші»: без зупинки відліку, статусів і перемальовування
function applyMode(mode) {
  currentMode = mode;
  totalMs = durations[mode];
  remainingMs = totalMs;

  modeButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.mode === mode));
  });
}

// Перемикання з боку користувача (після підтвердження, якщо відлік ішов)
function switchMode(mode) {
  stopTicking();
  applyMode(mode);
  clearStatus();
  render();
}

function getModeWarning(mode) {
  const note = currentMode === "pomodoro" ? " It won't count towards your Study Time." : "";

  return `Switch to ${MODE_LABELS[mode]}? The current session will be cancelled.${note}`;
}

function requestModeChange(mode) {
  if (mode === currentMode) {
    return;
  }

  if (intervalId === null) {
    switchMode(mode);
    return;
  }

  pendingMode = mode;
  modeText.textContent = getModeWarning(mode);
  modeDialog.returnValue = ""; // скидаємо, щоб Esc не «успадкував» старе значення
  modeDialog.showModal();
}

function handleModeDialogClose() {
  const mode = pendingMode;

  pendingMode = null;

  if (modeDialog.returnValue === "confirm" && mode !== null) {
    switchMode(mode);
  }
}

function handleModeDialogBackdropClick(event) {
  if (event.target === modeDialog) {
    modeDialog.close();
  }
}

// Закриває вікно без підтвердження (наприклад, коли сесія завершилась сама)
function closeModeDialog() {
  pendingMode = null;

  if (modeDialog.open) {
    modeDialog.close();
  }
}

// ---------- Керування відліком ----------

function stopTicking() {
  clearInterval(intervalId);
  intervalId = null;
  endTimestamp = null;
}

// Єдине місце, де сесія вважається завершеною й записується
function finishSession() {
  const finishedMode = currentMode;
  const finishedMinutes = totalMs / 60000;

  stopTicking();
  closeModeDialog();

  if (finishedMode === "pomodoro") {
    onSessionComplete({ date: toDateKey(new Date()), minutes: finishedMinutes });
  }

  applyMode(NEXT_MODE[finishedMode]);
  showStatus(FINISH_MESSAGES[finishedMode]);
  render();
}

function tick() {
  if (endTimestamp === null) {
    return; // таймер уже зупинено
  }

  remainingMs = Math.max(0, endTimestamp - Date.now());
  render();

  if (remainingMs === 0) {
    finishSession();
  }
}

function start() {
  if (intervalId !== null) {
    return; // таймер уже йде: другий не запускаємо
  }

  clearStatus();
  endTimestamp = Date.now() + remainingMs;
  intervalId = setInterval(tick, TICK_INTERVAL_MS);
  render();
}

function pause() {
  if (intervalId === null) {
    return;
  }

  remainingMs = Math.max(0, endTimestamp - Date.now());
  stopTicking();
  render();
}

function reset() {
  stopTicking();
  remainingMs = totalMs;
  clearStatus();
  render();
}

// Викликається один раз. sessionCompleteHandler отримує { date, minutes }.
export function initTimer(sessionCompleteHandler) {
  onSessionComplete = sessionCompleteHandler;
  progressCircle.style.strokeDasharray = String(RING_LENGTH);

  toggleButton.addEventListener("click", () => {
    if (intervalId === null) {
      start();
    } else {
      pause();
    }
  });

  resetButton.addEventListener("click", reset);

  modeButtons.forEach((button) => {
    button.addEventListener("click", () => requestModeChange(button.dataset.mode));
  });

  modeDialog.addEventListener("close", handleModeDialogClose);
  modeDialog.addEventListener("click", handleModeDialogBackdropClick);

  render();
}