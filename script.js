const STORAGE_KEY = "exam-todo-tasks";
const EMPTY_MESSAGE = "등록된 할 일이 없습니다. 새로운 계획을 추가해 보세요!";
const PRIORITIES = {
  high: { label: "상", className: "priority-high" },
  medium: { label: "중", className: "priority-medium" },
  low: { label: "하", className: "priority-low" }
};

let tasks = loadTasks();
let currentFilter = "all";
let editingTaskId = null;

const elements = {
  form: document.querySelector("#taskForm"),
  textInput: document.querySelector("#taskText"),
  dateInput: document.querySelector("#taskDueDate"),
  priorityInput: document.querySelector("#taskPriority"),
  formMessage: document.querySelector("#formMessage"),
  taskList: document.querySelector("#taskList"),
  taskCount: document.querySelector("#taskCount"),
  todayDate: document.querySelector("#todayDate"),
  nextDueDate: document.querySelector("#nextDueDate"),
  progressPercent: document.querySelector("#progressPercent"),
  progressBar: document.querySelector("#progressBar"),
  progress: document.querySelector(".progress"),
  filters: document.querySelectorAll("[data-filter]")
};

initialize();

function initialize() {
  const today = getLocalDateString();
  elements.todayDate.textContent = formatDate(today);
  elements.dateInput.value = today;
  elements.dateInput.min = today;
  elements.form.addEventListener("submit", handleAddTask);
  elements.taskList.addEventListener("click", handleTaskAction);
  elements.taskList.addEventListener("change", handleTaskChange);
  elements.filters.forEach((button) => {
    button.addEventListener("click", () => {
      currentFilter = button.dataset.filter;
      updateFilterButtons();
      render();
    });
  });
  render();
}

function handleAddTask(event) {
  event.preventDefault();
  clearFormFeedback();

  const text = elements.textInput.value.trim();
  const dueDate = elements.dateInput.value;
  const priority = elements.priorityInput.value;
  let isValid = true;

  if (!text) {
    elements.textInput.classList.add("is-invalid");
    isValid = false;
  }

  if (!isValidDate(dueDate)) {
    elements.dateInput.classList.add("is-invalid");
    isValid = false;
  }

  if (!hasPriority(priority)) {
    elements.priorityInput.classList.add("is-invalid");
    isValid = false;
  }

  if (!isValid) {
    elements.formMessage.textContent = "입력 내용을 확인해 주세요.";
    return;
  }

  tasks.unshift({
    id: String(Date.now()),
    text,
    priority,
    dueDate,
    isCompleted: false,
    createdAt: new Date().toISOString()
  });

  saveTasks();
  elements.form.reset();
  elements.dateInput.value = getLocalDateString();
  elements.priorityInput.value = "medium";
  elements.formMessage.textContent = "새 계획을 추가했습니다.";
  render();
}

function handleTaskAction(event) {
  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;

  const taskItem = actionButton.closest("[data-task-id]");
  if (!taskItem) return;

  const taskId = taskItem.dataset.taskId;
  const task = tasks.find((item) => item.id === taskId);
  if (!task) return;

  if (actionButton.dataset.action === "delete") {
    tasks = tasks.filter((item) => item.id !== taskId);
    if (editingTaskId === taskId) editingTaskId = null;
    saveTasks();
    render();
  }

  if (actionButton.dataset.action === "edit") {
    editingTaskId = taskId;
    render();
    const editInput = document.querySelector(`#edit-text-${CSS.escape(taskId)}`);
    editInput?.focus();
  }

  if (actionButton.dataset.action === "cancel-edit") {
    editingTaskId = null;
    render();
  }

  if (actionButton.dataset.action === "save-edit") {
    saveEdit(taskId, taskItem);
  }
}

function handleTaskChange(event) {
  const checkbox = event.target.closest("[data-complete-id]");
  if (!checkbox) return;

  const task = tasks.find((item) => item.id === checkbox.dataset.completeId);
  if (!task) return;

  task.isCompleted = checkbox.checked;
  saveTasks();
  render();
}

function saveEdit(taskId, taskItem) {
  const textInput = taskItem.querySelector("[data-edit-field='text']");
  const dateInput = taskItem.querySelector("[data-edit-field='date']");
  const priorityInput = taskItem.querySelector("[data-edit-field='priority']");
  const text = textInput.value.trim();

  textInput.classList.toggle("is-invalid", !text);
  dateInput.classList.toggle("is-invalid", !isValidDate(dateInput.value));

  if (!text || !isValidDate(dateInput.value) || !hasPriority(priorityInput.value)) {
    return;
  }

  const task = tasks.find((item) => item.id === taskId);
  if (!task) return;

  task.text = text;
  task.dueDate = dateInput.value;
  task.priority = priorityInput.value;
  editingTaskId = null;
  saveTasks();
  render();
}

function render() {
  renderProgress();
  renderSummary();

  const visibleTasks = tasks.filter((task) => {
    if (currentFilter === "active") return !task.isCompleted;
    if (currentFilter === "completed") return task.isCompleted;
    return true;
  });

  elements.taskCount.textContent = `${tasks.length}개의 계획`;
  elements.taskList.replaceChildren();

  if (visibleTasks.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";
    emptyState.textContent = EMPTY_MESSAGE;
    elements.taskList.append(emptyState);
    return;
  }

  visibleTasks.forEach((task) => {
    elements.taskList.append(createTaskElement(task));
  });
}

function createTaskElement(task) {
  const item = document.createElement("article");
  item.className = `task-item${task.isCompleted ? " is-completed" : ""}`;
  item.dataset.taskId = task.id;

  if (editingTaskId === task.id) {
    item.append(createEditForm(task));
    return item;
  }

  const checkbox = document.createElement("input");
  checkbox.className = "form-check-input task-check";
  checkbox.type = "checkbox";
  checkbox.checked = task.isCompleted;
  checkbox.dataset.completeId = task.id;
  checkbox.setAttribute("aria-label", `${task.text} 완료 처리`);

  const content = document.createElement("div");
  content.className = "task-content";
  const text = document.createElement("div");
  text.className = "task-text";
  text.textContent = task.text;

  const meta = document.createElement("div");
  meta.className = "task-meta";
  const priority = document.createElement("span");
  priority.className = `priority-badge ${PRIORITIES[task.priority]?.className || "priority-medium"}`;
  priority.textContent = `중요도 ${PRIORITIES[task.priority]?.label || "중"}`;
  const dueDate = document.createElement("span");
  dueDate.textContent = `목표 ${formatDate(task.dueDate)}`;
  meta.append(priority, dueDate);
  content.append(text, meta);

  const actions = document.createElement("div");
  actions.className = "task-actions";
  actions.append(createActionButton("수정", "edit", "btn-outline-secondary"), createActionButton("삭제", "delete", "btn-outline-danger"));
  item.append(checkbox, content, actions);
  return item;
}

function createEditForm(task) {
  const form = document.createElement("div");
  form.className = "edit-form row g-2";

  const textColumn = document.createElement("div");
  textColumn.className = "col-12 col-lg-6";
  const textInput = document.createElement("input");
  textInput.id = `edit-text-${task.id}`;
  textInput.className = "form-control";
  textInput.value = task.text;
  textInput.maxLength = 500;
  textInput.dataset.editField = "text";
  textColumn.append(textInput);

  const dateColumn = document.createElement("div");
  dateColumn.className = "col-6 col-lg-2";
  const dateInput = document.createElement("input");
  dateInput.className = "form-control";
  dateInput.type = "date";
  dateInput.value = task.dueDate;
  dateInput.dataset.editField = "date";
  dateColumn.append(dateInput);

  const priorityColumn = document.createElement("div");
  priorityColumn.className = "col-6 col-lg-2";
  const priorityInput = document.createElement("select");
  priorityInput.className = "form-select";
  priorityInput.dataset.editField = "priority";
  Object.entries(PRIORITIES).forEach(([value, details]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = details.label;
    option.selected = value === task.priority;
    priorityInput.append(option);
  });
  priorityColumn.append(priorityInput);

  const actions = document.createElement("div");
  actions.className = "col-12 col-lg-2 d-flex justify-content-end gap-2";
  actions.append(createActionButton("저장", "save-edit", "btn-primary"), createActionButton("취소", "cancel-edit", "btn-outline-secondary"));
  form.append(textColumn, dateColumn, priorityColumn, actions);
  return form;
}

function createActionButton(label, action, style) {
  const button = document.createElement("button");
  button.className = `btn btn-sm ${style}`;
  button.type = "button";
  button.dataset.action = action;
  button.textContent = label;
  return button;
}

function renderProgress() {
  const completedCount = tasks.filter((task) => task.isCompleted).length;
  const progress = tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);
  elements.progressPercent.textContent = `${progress}%`;
  elements.progressBar.style.width = `${progress}%`;
  elements.progress.setAttribute("aria-valuenow", String(progress));
}

function renderSummary() {
  const upcomingDates = tasks
    .filter((task) => !task.isCompleted && isValidDate(task.dueDate))
    .map((task) => task.dueDate)
    .sort();
  elements.nextDueDate.textContent = upcomingDates.length > 0 ? formatDate(upcomingDates[0]) : "-";
}

function updateFilterButtons() {
  elements.filters.forEach((button) => {
    const isActive = button.dataset.filter === currentFilter;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function loadTasks() {
  try {
    const storedTasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(storedTasks)) return [];
    return storedTasks
      .filter((task) => task && task.id !== undefined && typeof task.text === "string")
      .map((task) => ({
        id: String(task.id),
        text: task.text,
        priority: hasPriority(task.priority) ? task.priority : "medium",
        dueDate: isValidDate(task.dueDate) ? task.dueDate : getLocalDateString(),
        isCompleted: task.isCompleted === true,
        createdAt: typeof task.createdAt === "string" ? task.createdAt : new Date().toISOString()
      }));
  } catch {
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    elements.formMessage.textContent = "브라우저 저장 공간을 사용할 수 없어 현재 화면에만 반영됩니다.";
  }
}

function clearFormFeedback() {
  elements.formMessage.textContent = "";
  [elements.textInput, elements.dateInput, elements.priorityInput].forEach((input) => input.classList.remove("is-invalid"));
}

function isValidDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00`).getTime());
}

function hasPriority(value) {
  return Object.prototype.hasOwnProperty.call(PRIORITIES, value);
}

function getLocalDateString(date = new Date()) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!isValidDate(value)) return "날짜 없음";
  const [year, month, day] = value.split("-");
  return `${year}.${month}.${day}`;
}
