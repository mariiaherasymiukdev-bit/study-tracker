import { isDateKey, toDateKey } from "./dates.js";

const CATEGORY_LABELS = {
  javascript: "JavaScript",
  react: "React",
  html: "HTML",
  css: "CSS",
  english: "English",
  project: "Project",
  other: "Other",
};

const EMPTY_MESSAGES = {
  all: "No tasks here yet. Add your first one!",
  active: "No active tasks. Nice work!",
  completed: "No completed tasks yet.",
};

const MAX_TITLE_LENGTH = 80;
const MIN_MINUTES = 5;
const MAX_MINUTES = 600;

const form = document.querySelector("#task-form");
const titleInput = document.querySelector("#task-title");
const categorySelect = document.querySelector("#task-category");
const minutesInput = document.querySelector("#task-minutes");
const dateInput = document.querySelector("#task-date");
const submitButton = document.querySelector("#task-submit");
const cancelButton = document.querySelector("#task-cancel");
const toggleButton = document.querySelector(".task-form__toggle");
const errorElement = document.querySelector("#task-form-error");
const list = document.querySelector("#task-list");
const emptyMessage = document.querySelector("#tasks-empty");
const template = document.querySelector("#task-template");
const confirmDialog = document.querySelector("#confirm-dialog");
const confirmText = document.querySelector("#confirm-text");
const filterButtons = document.querySelectorAll("[data-filter]");

let tasks = [];
let activeFilter = "all";
let editingId = null;
let pendingDeleteId = null;
let onChange = () => {};

// ---------- Допоміжні функції ----------

function createId() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Невідома категорія (наприклад, зі зіпсованих даних) вважається "other"
function getCategory(task) {
  return Object.hasOwn(CATEGORY_LABELS, task.category)
    ? task.category
    : "other";
}

function getVisibleTasks() {
  if (activeFilter === "active") {
    return tasks.filter((task) => !task.completed);
  }

  if (activeFilter === "completed") {
    return tasks.filter((task) => task.completed);
  }

  return tasks;
}

// ---------- Малювання списку ----------

function createTaskElement(task) {
  const item = template.content.firstElementChild.cloneNode(true);
  const category = getCategory(task);
  const badge = item.querySelector(".task__badge");

  item.dataset.id = task.id;
  item.classList.toggle("task--completed", task.completed);
  item.classList.toggle("task--editing", task.id === editingId);

  item.querySelector(".task__checkbox").checked = task.completed;
  item.querySelector(".task__title").textContent = task.title;
  item.querySelector(".task__minutes").textContent = `${task.minutes} min`;

  badge.textContent = CATEGORY_LABELS[category];
  badge.classList.add(`task__badge--${category}`);

  item
    .querySelector('[data-action="edit"]')
    .setAttribute("aria-label", `Edit task: ${task.title}`);
  item
    .querySelector('[data-action="delete"]')
    .setAttribute("aria-label", `Delete task: ${task.title}`);

  return item;
}

function renderTasks() {
  const visibleTasks = getVisibleTasks();

  list.replaceChildren(...visibleTasks.map(createTaskElement));

  emptyMessage.textContent = EMPTY_MESSAGES[activeFilter];
  emptyMessage.hidden = visibleTasks.length > 0;
}

// Єдина точка після будь-якої зміни даних
function commit() {
  renderTasks();
  onChange(tasks);
}

// ---------- Дії над завданнями ----------

function addTask(values) {
  tasks = [{ id: createId(), ...values, completed: false }, ...tasks];
}

function updateTask(id, values) {
  tasks = tasks.map((task) => (task.id === id ? { ...task, ...values } : task));
}

function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);

  if (editingId === id) {
    stopEditing();
  }

  commit();
}

function toggleTask(id, completed) {
  tasks = tasks.map((task) => (task.id === id ? { ...task, completed } : task));
  commit();
}

// Показує підтвердження; саме видалення виконується після закриття вікна
function requestDelete(id) {
  const task = tasks.find((item) => item.id === id);

  if (!task) {
    return;
  }

  pendingDeleteId = id;
  confirmText.textContent = `“${task.title}” will be permanently removed.`;
  confirmDialog.returnValue = ""; // скидаємо, інакше Esc може «успадкувати» старе значення
  confirmDialog.showModal();
}

function handleConfirmClose() {
  const id = pendingDeleteId;

  pendingDeleteId = null;

  if (confirmDialog.returnValue === "delete" && id !== null) {
    deleteTask(id);
  }
}

// Клік по затемненому фону (поза вікном) закриває його як Cancel
function handleConfirmBackdropClick(event) {
  if (event.target === confirmDialog) {
    confirmDialog.close();
  }
}

// ---------- Форма: поля та валідація ----------

function readFormValues() {
  return {
    title: titleInput.value.trim(),
    category: categorySelect.value,
    minutes: Number(minutesInput.value),
    date: dateInput.value,
  };
}

// Повертає опис першої помилки або null, якщо все гаразд
function validateValues(values) {
  if (values.title.length === 0) {
    return { message: "Please enter a task name.", field: titleInput };
  }

  if (values.title.length > MAX_TITLE_LENGTH) {
    return {
      message: `Task name must be up to ${MAX_TITLE_LENGTH} characters.`,
      field: titleInput,
    };
  }

  if (!Object.hasOwn(CATEGORY_LABELS, values.category)) {
    return { message: "Please choose a category.", field: categorySelect };
  }

  if (
    !Number.isInteger(values.minutes) ||
    values.minutes < MIN_MINUTES ||
    values.minutes > MAX_MINUTES
  ) {
    return {
      message: `Time must be a whole number from ${MIN_MINUTES} to ${MAX_MINUTES} minutes.`,
      field: minutesInput,
    };
  }

  if (!isDateKey(values.date)) {
    return { message: "Please choose a date.", field: dateInput };
  }

  return null;
}

function showError(message) {
  errorElement.textContent = message;
  errorElement.hidden = false;
}

function clearError() {
  errorElement.textContent = "";
  errorElement.hidden = true;
}

function resetForm() {
  form.reset();
  dateInput.value = toDateKey(new Date());
  submitButton.textContent = "Add";
  cancelButton.hidden = true;
  clearError();
}

// ---------- Форма: показ додаткових полів ----------

function setOptionsOpen(isOpen) {
  form.classList.toggle("task-form--open", isOpen);
  toggleButton.setAttribute("aria-expanded", String(isOpen));
}

// ---------- Форма: режим редагування ----------

function startEdit(id) {
  const task = tasks.find((item) => item.id === id);

  if (!task) {
    return;
  }

  editingId = id;
  titleInput.value = task.title;
  categorySelect.value = getCategory(task);
  minutesInput.value = task.minutes;
  dateInput.value = task.date;
  submitButton.textContent = "Save";
  cancelButton.hidden = false;
  clearError();
  setOptionsOpen(true);
  renderTasks();
  titleInput.focus();
}

function stopEditing() {
  editingId = null;
  resetForm();
  setOptionsOpen(false);
}

function cancelEdit() {
  stopEditing();
  renderTasks();
}

// ---------- Обробники подій ----------

function handleSubmit(event) {
  event.preventDefault();

  const values = readFormValues();
  const problem = validateValues(values);

  if (problem) {
    showError(problem.message);
    setOptionsOpen(true);
    problem.field.focus();
    return;
  }

  if (editingId === null) {
    addTask(values);
  } else {
    updateTask(editingId, values);
  }

  stopEditing();
  commit();
}

function handleListClick(event) {
  const button = event.target.closest("[data-action]");

  if (!button) {
    return;
  }

  const { id } = button.closest(".task").dataset;

  if (button.dataset.action === "edit") {
    startEdit(id);
  }

  if (button.dataset.action === "delete") {
    requestDelete(id);
  }
}

function handleListChange(event) {
  if (!event.target.matches(".task__checkbox")) {
    return;
  }

  toggleTask(event.target.closest(".task").dataset.id, event.target.checked);
}

function handleFilterClick(event) {
  activeFilter = event.currentTarget.dataset.filter;

  filterButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button === event.currentTarget));
  });

  renderTasks();
}

// Додаткові поля відкриваються при фокусі в формі (крім кнопки "+", у неї свій клік)
function handleFormFocusIn(event) {
  if (!event.target.closest(".task-form__toggle")) {
    setOptionsOpen(true);
  }
}

// Клік по вже сфокусованому полю теж відкриває поля
function handleFormClick(event) {
  if (event.target.matches("input, select")) {
    setOptionsOpen(true);
  }
}

// Фокус пішов за межі форми (Tab) — закриваємо, але не під час редагування
function handleFormFocusOut(event) {
  const nextElement = event.relatedTarget;

  if (editingId === null && nextElement && !form.contains(nextElement)) {
    setOptionsOpen(false);
  }
}

function handleToggleClick() {
  if (editingId !== null) {
    return;
  }

  const willOpen = !form.classList.contains("task-form--open");

  setOptionsOpen(willOpen);

  if (willOpen) {
    titleInput.focus();
  }
}

function handleFormKeydown(event) {
  if (event.key !== "Escape") {
    return;
  }

  if (editingId === null) {
    setOptionsOpen(false);
  } else {
    cancelEdit();
  }
}

// Клік поза формою закриває її (рідні випадні списки сюди не потрапляють)
function handleDocumentPointerDown(event) {
  if (editingId === null && !form.contains(event.target)) {
    setOptionsOpen(false);
  }
}

function bindEvents() {
  form.addEventListener("submit", handleSubmit);
  form.addEventListener("input", clearError);
  form.addEventListener("focusin", handleFormFocusIn);
  form.addEventListener("focusout", handleFormFocusOut);
  form.addEventListener("click", handleFormClick);
  form.addEventListener("keydown", handleFormKeydown);
  toggleButton.addEventListener("click", handleToggleClick);
  cancelButton.addEventListener("click", cancelEdit);
  document.addEventListener("pointerdown", handleDocumentPointerDown);
  confirmDialog.addEventListener("close", handleConfirmClose);
  confirmDialog.addEventListener("click", handleConfirmBackdropClick);

  list.addEventListener("click", handleListClick);
  list.addEventListener("change", handleListChange);

  filterButtons.forEach((button) => {
    button.addEventListener("click", handleFilterClick);
  });
}

// Викликається один раз. Малює список і повідомляє main.js про початковий стан.
export function initTasks(initialTasks, changeHandler) {
  tasks = initialTasks;
  onChange = changeHandler;

  bindEvents();
  resetForm();
  commit();
}
