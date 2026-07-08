let lists = JSON.parse(localStorage.getItem('taskflow_lists')) || [
  { id: 1, name: '📝 Personal', tasks: [] },
  { id: 2, name: '💼 Work', tasks: [] }
];
let activeListId = 1;
let editingTaskId = null;

const listsEl = document.getElementById('lists');
const tasksListEl = document.getElementById('tasksList');
const themeBtn = document.getElementById('themeBtn');

// Init
function init() {
  renderLists();
  renderTasks();
  updateStats();
  setMinDate();
  
  document.getElementById('addListBtn').addEventListener('click', addList);
  document.getElementById('addTaskBtn').addEventListener('click', addTask);
  document.getElementById('taskInput').addEventListener('keypress', e => { if(e.key === 'Enter') addTask() });
  document.getElementById('searchInput').addEventListener('input', renderTasks);
  document.getElementById('sortSelect').addEventListener('change', renderTasks);
  document.getElementById('cancelEditBtn').addEventListener('click', () => document.getElementById('editModal').classList.remove('active'));
  document.getElementById('saveEditBtn').addEventListener('click', saveEdit);
  themeBtn.addEventListener('click', toggleTheme);
}

function setMinDate() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('taskDate').min = today;
  document.getElementById('editTaskDate').min = today;
}

function saveToLocal() {
  localStorage.setItem('taskflow_lists', JSON.stringify(lists));
}

// Lists
function renderLists() {
  listsEl.innerHTML = '';
  lists.forEach(list => {
    const div = document.createElement('div');
    div.className = `list-item ${list.id === activeListId? 'active' : ''}`;
    div.innerHTML = `
      <div class="list-info" onclick="setActiveList(${list.id})">
        <span class="list-icon">${list.name.split(' ')[0]}</span>
        <span class="list-name">${list.name.substring(2)}</span>
      </div>
      <span class="list-count">${list.tasks.filter(t =>!t.completed).length}</span>
      ${lists.length > 1? `<button class="delete-list" onclick="deleteList(${list.id})">×</button>` : ''}
    `;
    listsEl.appendChild(div);
  });
}

function setActiveList(id) {
  activeListId = id;
  renderLists();
  renderTasks();
}

function addList() {
  const input = document.getElementById('newListInput');
  const name = input.value.trim();
  if (!name) return;
  lists.push({ id: Date.now(), name: `📋 ${name}`, tasks: [] });
  input.value = '';
  saveToLocal();
  renderLists();
}

function deleteList(id) {
  if (lists.length === 1) return alert("Can't delete last list");
  lists = lists.filter(l => l.id!== id);
  if (activeListId === id) activeListId = lists[0].id;
  saveToLocal();
  renderLists();
  renderTasks();
}

// Tasks
function addTask() {
  const text = document.getElementById('taskInput').value.trim();
  const date = document.getElementById('taskDate').value;
  const time = document.getElementById('taskTime').value;
  const priority = document.getElementById('taskPriority').value;
  
  if (!text) return alert("Please enter a task");
  
  const list = lists.find(l => l.id === activeListId);
  list.tasks.push({
    id: Date.now(),
    text,
    date,
    time,
    priority,
    completed: false,
    createdAt: Date.now()
  });
  
  document.getElementById('taskInput').value = '';
  document.getElementById('taskDate').value = '';
  document.getElementById('taskTime').value = '';
  
  saveToLocal();
  renderTasks();
  updateStats();
}

function toggleTask(id) {
  const list = lists.find(l => l.id === activeListId);
  const task = list.tasks.find(t => t.id === id);
  task.completed =!task.completed;
  saveToLocal();
  renderTasks();
  updateStats();
}

function deleteTask(id) {
  const list = lists.find(l => l.id === activeListId);
  list.tasks = list.tasks.filter(t => t.id!== id);
  saveToLocal();
  renderTasks();
  updateStats();
}

function editTask(id) {
  editingTaskId = id;
  const list = lists.find(l => l.id === activeListId);
  const task = list.tasks.find(t => t.id === id);
  
  document.getElementById('editTaskInput').value = task.text;
  document.getElementById('editTaskDate').value = task.date;
  document.getElementById('editTaskTime').value = task.time;
  document.getElementById('editTaskPriority').value = task.priority;
  
  document.getElementById('editModal').classList.add('active');
}

function saveEdit() {
  const list = lists.find(l => l.id === activeListId);
  const task = list.tasks.find(t => t.id === editingTaskId);
  
  task.text = document.getElementById('editTaskInput').value.trim();
  task.date = document.getElementById('editTaskDate').value;
  task.time = document.getElementById('editTaskTime').value;
  task.priority = document.getElementById('editTaskPriority').value;
  
  document.getElementById('editModal').classList.remove('active');
  saveToLocal();
  renderTasks();
}

function renderTasks() {
  const list = lists.find(l => l.id === activeListId);
  let tasks = [...list.tasks];
  const search = document.getElementById('searchInput').value.toLowerCase();
  const sort = document.getElementById('sortSelect').value;
  
  tasks = tasks.filter(t => t.text.toLowerCase().includes(search));
  
  if (sort === 'date') tasks.sort((a,b) => new Date(a.date) - new Date(b.date));
  if (sort === 'priority') {
    const order = { high: 1, medium: 2, low: 3 };
    tasks.sort((a,b) => order[a.priority] - order[b.priority]);
  }
  if (sort === 'name') tasks.sort((a,b) => a.text.localeCompare(b.text));
  
  if (tasks.length === 0) {
    tasksListEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <h3>No tasks yet</h3>
        <p>Add your first task above</p>
      </div>
    `;
    return;
  }
  
  tasksListEl.innerHTML = '';
  tasks.forEach(task => {
    const isOverdue = task.date && new Date(`${task.date}T${task.time || '23:59'}`) < new Date() &&!task.completed;
    const div = document.createElement('div');
    div.className = `task priority-${task.priority} ${task.completed? 'completed' : ''} ${isOverdue? 'overdue' : ''}`;
    div.innerHTML = `
      <div class="task-checkbox ${task.completed? 'checked' : ''}" onclick="toggleTask(${task.id})"></div>
      <div class="task-content">
        <div class="task-text">${task.text}</div>
        <div class="task-meta">
          ${task.date? `<div class="task-badge task-date ${isOverdue? 'overdue' : ''}">📅 ${task.date} ${task.time || ''}</div>` : ''}
          <div class="task-badge task-priority">⭐ ${task.priority}</div>
        </div>
      </div>
      <div class="task-actions">
        <button class="task-btn" onclick="editTask(${task.id})">✏️</button>
        <button class="task-btn" onclick="deleteTask(${task.id})">🗑️</button>
      </div>
    `;
    tasksListEl.appendChild(div);
  });
}

// Stats + Progress
function updateStats() {
  const allTasks = lists.flatMap(l => l.tasks);
  const total = allTasks.length;
  const completed = allTasks.filter(t => t.completed).length;
  const active = total - completed;
  const overdue = allTasks.filter(t => t.date && new Date(`${t.date}T${t.time || '23:59'}`) < new Date() &&!t.completed).length;
  
  document.getElementById('totalTasks').textContent = total;
  document.getElementById('activeTasks').textContent = active;
  document.getElementById('completedTasks').textContent = completed;
  document.getElementById('overdueTasks').textContent = overdue;
  
  const percent = total? Math.round((completed / total) * 100) : 0;
  document.getElementById('progressPercent').textContent = `${percent}%`;
  
  const circumference = 326.73;
  const offset = circumference - (percent / 100) * circumference;
  document.getElementById('progressRing').style.strokeDashoffset = offset;
}

// Theme
function toggleTheme() {
  const theme = document.documentElement.getAttribute('data-theme');
  if (theme === 'dark') {
    document.documentElement.removeAttribute('data-theme');
    themeBtn.textContent = '🌙';
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeBtn.textContent = '☀️';
  }
}

init();