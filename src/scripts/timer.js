import { toDateKey } from "./dates.js";

const TICK_INTERVAL_MS = 250;
const RING_LENGTH = 2 * Math.PI * 90; // довжина кола з r="90" в SVG

const FINISH_MESSAGES = {
  pomodoro: "Focus session complete! Time for a break.",
  short: "Break is over. Ready to focus?",
  long: "Break is over. Ready to focus?",
};

const timerSection = document.querySelector("#timer");
const timeElement = document.querySelector("#timer-time");
const progressCircle = document.querySelector("#timer-progress");
const toggleButton = document.querySelector("#timer-toggle");
const toggleIcon = document.querySelector("#timer-toggle-icon use");
const resetButton = document.querySelector("#timer-reset");
const statusElement = document.querySelector("#timer-status");
const modeButtons = document.querySelectorAll("[data-mode]");

// Тривалість режимів у мс береться з data-minutes у HTML
const durations = Object.fromEntries(
  [...modeButtons].map((button) => [button.dataset.mode, Number(button.dataset.minutes) * 60 * 1000]),
);

let currentMode = "pomodoro";
let totalMs = durations[currentMode];
let remainingMs = totalMs;
let endTimestamp = null; // коли таймер має дійти до нуля (лише коли йде відлік)
let intervalId = null; // не null = таймер зараз іде
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

// ---------- Керування відліком ----------

function stopTicking() {
  clearInterval(intervalId);
  intervalId = null;
  endTimestamp = null;
}

function finishSession() {
  stopTicking();
  remainingMs = 0;
  showStatus(FINISH_MESSAGES[currentMode]);

  // Рахуємо лише завершені фокус-сесії
  if (currentMode === "pomodoro") {
    onSessionComplete({ date: toDateKey(new Date()), minutes: totalMs / 60000 });
  }

  render();
}

function tick() {
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

  if (remainingMs <= 0) {
    remainingMs = totalMs; // після завершення новий запуск починає з початку
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

function setMode(mode) {
  if (mode === currentMode) {
    return;
  }

  stopTicking(); // перемикання під час відліку скасовує поточну сесію
  currentMode = mode;
  totalMs = durations[mode];
  remainingMs = totalMs;

  modeButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.mode === mode));
  });

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
    button.addEventListener("click", () => setMode(button.dataset.mode));
  });

  render();
}