const STORAGE_KEY = "exam-todo-tasks";
const EMPTY_MESSAGE = "등록된 할 일이 없습니다. 새로운 계획을 추가해 보세요!";
const PRIORITIES = {
  high: { label: "상", className: "border-red-200 bg-red-50 text-red-700" },
  medium: { label: "중", className: "border-amber-200 bg-amber-50 text-amber-700" },
  low: { label: "하", className: "border-emerald-200 bg-emerald-50 text-emerald-700" }
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
  progress: document.querySelector("#progressTrack"),
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
    elements.textInput.classList.add("border-red-500", "ring-4", "ring-red-100");
    isValid = false;
  }
  if (!isValidDate(dueDate)) {
    elements.dateInput.classList.add("border-red-500", "ring-4", "ring-red-100");
    isValid = false;
  }
  if (!hasPriority(priority)) {
    elements.priorityInput.classList.add("border-red-500", "ring-4", "ring-red-100");
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
    editingTaskId = null;
    saveTasks();
    render();
  }
  if (actionButton.dataset.action === "edit") {
    editingTaskId = taskId;
    render();
    document.querySelector(`[data-task-id="${CSS.escape(taskId)}"] [data-edit-field="text"]`)?.focus();
  }
  if (actionButton.dataset.action === "cancel-edit") {
    editingTaskId = null;
    render();
  }
  if (actionButton.dataset.action === "save-edit") saveEdit(taskId, taskItem);
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
  if (!text || !isValidDate(dateInput.value) || !hasPriority(priorityInput.value)) {
    textInput.classList.toggle("border-red-500", !text);
    dateInput.classList.toggle("border-red-500", !isValidDate(dateInput.value));
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
    emptyState.className = "rounded-2xl border border-dashed border-pink-200 bg-white p-12 text-center text-sm text-slate-500 shadow-sm";
    emptyState.textContent = EMPTY_MESSAGE;
    elements.taskList.append(emptyState);
    return;
  }
  visibleTasks.forEach((task) => elements.taskList.append(createTaskElement(task)));
}

function createTaskElement(task) {
  const item = document.createElement("article");
  item.className = `group flex flex-wrap items-start gap-3 rounded-2xl border p-4 shadow-lg shadow-pink-200/30 transition hover:-translate-y-0.5 sm:flex-nowrap ${task.isCompleted ? "border-pink-100 bg-white opacity-60" : "border-pink-100 bg-white"}`;
  item.dataset.taskId = task.id;
  if (editingTaskId === task.id) {
    item.append(createEditForm(task));
    return item;
  }

  const checkbox = document.createElement("input");
  checkbox.className = "mt-1 h-5 w-5 shrink-0 cursor-pointer accent-cyan-400";
  checkbox.type = "checkbox";
  checkbox.checked = task.isCompleted;
  checkbox.dataset.completeId = task.id;
  checkbox.setAttribute("aria-label", `${task.text} 완료 처리`);

  const content = document.createElement("div");
  content.className = "min-w-0 flex-1";
  const text = document.createElement("div");
  text.className = `break-anywhere text-sm font-semibold leading-6 text-slate-800 ${task.isCompleted ? "line-through" : ""}`;
  text.textContent = task.text;
  const meta = document.createElement("div");
  meta.className = "mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500";
  const priority = document.createElement("span");
  priority.className = `rounded-full border px-2 py-1 font-bold ${PRIORITIES[task.priority]?.className || PRIORITIES.medium.className}`;
  priority.textContent = `중요도 ${PRIORITIES[task.priority]?.label || "중"}`;
  const dueDate = document.createElement("span");
  dueDate.textContent = `목표 ${formatDate(task.dueDate)}`;
  meta.append(priority, dueDate);
  content.append(text, meta);

  const actions = document.createElement("div");
  actions.className = "flex w-full shrink-0 justify-end gap-2 sm:w-auto";
  actions.append(createActionButton("수정", "edit", "border-pink-200 text-pink-600 hover:bg-pink-50"), createActionButton("삭제", "delete", "border-red-200 text-red-600 hover:bg-red-50"));
  item.append(checkbox, content, actions);
  return item;
}

function createEditForm(task) {
  const form = document.createElement("div");
  form.className = "grid w-full gap-2 sm:grid-cols-6";
  const textInput = document.createElement("input");
  textInput.className = "rounded-xl border border-pink-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-pink-400 sm:col-span-3";
  textInput.value = task.text;
  textInput.maxLength = 500;
  textInput.dataset.editField = "text";
  const dateInput = document.createElement("input");
  dateInput.className = "rounded-xl border border-pink-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-pink-400 sm:col-span-1";
  dateInput.type = "date";
  dateInput.value = task.dueDate;
  dateInput.dataset.editField = "date";
  const priorityInput = document.createElement("select");
  priorityInput.className = "rounded-xl border border-pink-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-pink-400 sm:col-span-1";
  priorityInput.dataset.editField = "priority";
  Object.entries(PRIORITIES).forEach(([value, details]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = details.label;
    option.selected = value === task.priority;
    priorityInput.append(option);
  });
  const actions = document.createElement("div");
  actions.className = "flex justify-end gap-2 sm:col-span-1";
  actions.append(createActionButton("저장", "save-edit", "border-pink-500 bg-pink-500 text-white hover:bg-pink-600"), createActionButton("취소", "cancel-edit", "border-slate-200 text-slate-600 hover:bg-slate-50"));
  form.append(textInput, dateInput, priorityInput, actions);
  return form;
}

function createActionButton(label, action, style) {
  const button = document.createElement("button");
  button.className = `rounded-lg border px-3 py-2 text-xs font-bold transition ${style}`;
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
  const upcomingDates = tasks.filter((task) => !task.isCompleted && isValidDate(task.dueDate)).map((task) => task.dueDate).sort();
  elements.nextDueDate.textContent = upcomingDates.length > 0 ? formatDate(upcomingDates[0]) : "-";
}

function updateFilterButtons() {
  elements.filters.forEach((button) => {
    const isActive = button.dataset.filter === currentFilter;
    button.className = isActive ? "rounded-lg bg-pink-500 px-4 py-2 text-sm font-bold text-white transition" : "rounded-lg px-4 py-2 text-sm font-bold text-slate-500 transition hover:text-pink-600";
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function loadTasks() {
  try {
    const storedTasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(storedTasks)) return [];
    return storedTasks.filter((task) => task && task.id !== undefined && typeof task.text === "string").map((task) => ({
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
  [elements.textInput, elements.dateInput, elements.priorityInput].forEach((input) => input.classList.remove("border-red-500", "ring-4", "ring-red-100"));
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
