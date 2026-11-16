// Aura Tab - Tasks Panel Controller (Today, Later, Done)

import { getTasks, saveTasks } from '../common/storage.js';
import { escapeHtml } from '../common/utils.js';

let activeColumn = 'today'; // 'today' | 'later' | 'done'

export async function initTasksPanel() {
  const panel = document.getElementById('panel-tasks');
  const listEl = document.getElementById('task-list');
  const inputEl = document.getElementById('task-new-input');
  const tabBtns = panel.querySelectorAll('.task-tab-btn');
  const clearDoneBtn = document.getElementById('btn-clear-done');
  const badgeEl = document.getElementById('tasks-badge');

  async function render() {
    const tasks = await getTasks();
    const filtered = tasks.filter(t => t.column === activeColumn);

    // Update dock badge count (number of incomplete today tasks)
    const todayCount = tasks.filter(t => t.column === 'today' && !t.completed).length;
    if (todayCount > 0) {
      badgeEl.textContent = todayCount;
      badgeEl.style.display = 'flex';
    } else {
      badgeEl.style.display = 'none';
    }

    // Toggle clear done button visibility
    clearDoneBtn.style.display = activeColumn === 'done' && filtered.length > 0 ? 'block' : 'none';

    listEl.innerHTML = '';

    if (filtered.length === 0) {
      let emptyMsg = 'No tasks for today. You are completely caught up!';
      if (activeColumn === 'later') emptyMsg = 'No upcoming tasks scheduled.';
      if (activeColumn === 'done') emptyMsg = 'No completed tasks yet.';
      listEl.innerHTML = `<div style="text-align:center; padding: 28px 12px; color: var(--text-faint); font-size: 13px;">${emptyMsg}</div>`;
      return;
    }

    filtered.forEach((task, index) => {
      const row = document.createElement('div');
      row.className = `task-row ${task.completed ? 'completed' : ''}`;
      row.draggable = true;
      row.dataset.id = task.id;
      row.dataset.index = index;

      row.innerHTML = `
        <div class="task-row-left">
          <input type="checkbox" class="task-checkbox-input" ${task.completed ? 'checked' : ''}>
          <span class="task-row-text">${escapeHtml(task.text)}</span>
        </div>
        <div class="task-row-actions">
          ${activeColumn === 'today' ? '<button class="task-action-btn btn-move" title="Move to Later">Later</button>' : ''}
          ${activeColumn === 'later' ? '<button class="task-action-btn btn-move" title="Move to Today">Today</button>' : ''}
          <button class="task-action-btn btn-del" title="Delete">×</button>
        </div>
      `;

      // Checkbox complete toggle
      const cb = row.querySelector('.task-checkbox-input');
      cb.addEventListener('change', async () => {
        const all = await getTasks();
        const target = all.find(t => t.id === task.id);
        if (target) {
          target.completed = cb.checked;
          if (cb.checked) {
            target.column = 'done';
            target.completedAt = Date.now();
          } else {
            target.column = 'today';
          }
          await saveTasks(all);
          window.dispatchEvent(new CustomEvent('aura-tasks-updated'));
          render();
        }
      });

      // Move between Today and Later
      const moveBtn = row.querySelector('.btn-move');
      if (moveBtn) {
        moveBtn.addEventListener('click', async () => {
          const all = await getTasks();
          const target = all.find(t => t.id === task.id);
          if (target) {
            target.column = activeColumn === 'today' ? 'later' : 'today';
            await saveTasks(all);
            window.dispatchEvent(new CustomEvent('aura-tasks-updated'));
            render();
          }
        });
      }

      // Delete task
      row.querySelector('.btn-del').addEventListener('click', async () => {
        const all = await getTasks();
        const next = all.filter(t => t.id !== task.id);
        await saveTasks(next);
        window.dispatchEvent(new CustomEvent('aura-tasks-updated'));
        render();
      });

      // HTML5 Drag and Drop Reordering
      row.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', task.id);
      });

      row.addEventListener('dragover', (e) => {
        e.preventDefault();
        row.style.background = 'rgba(255, 255, 255, 0.12)';
      });

      row.addEventListener('dragleave', () => {
        row.style.background = '';
      });

      row.addEventListener('drop', async (e) => {
        e.preventDefault();
        row.style.background = '';
        const draggedId = e.dataTransfer.getData('text/plain');
        if (draggedId && draggedId !== task.id) {
          const all = await getTasks();
          const draggedIdx = all.findIndex(t => t.id === draggedId);
          const targetIdx = all.findIndex(t => t.id === task.id);
          if (draggedIdx >= 0 && targetIdx >= 0) {
            const [item] = all.splice(draggedIdx, 1);
            all.splice(targetIdx, 0, item);
            await saveTasks(all);
            window.dispatchEvent(new CustomEvent('aura-tasks-updated'));
            render();
          }
        }
      });

      listEl.appendChild(row);
    });
  }

  // Switch column tabs
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeColumn = btn.dataset.col;
      render();
    });
  });

  // Add new task on Enter
  inputEl.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter' && inputEl.value.trim()) {
      const text = inputEl.value.trim();
      inputEl.value = '';
      const all = await getTasks();
      all.unshift({
        id: 'task_' + Date.now(),
        text,
        column: activeColumn === 'done' ? 'today' : activeColumn,
        completed: false,
        createdAt: Date.now()
      });
      await saveTasks(all);
      window.dispatchEvent(new CustomEvent('aura-tasks-updated'));
      render();
    }
  });

  // Clear Done tasks
  clearDoneBtn.addEventListener('click', async () => {
    const all = await getTasks();
    const remaining = all.filter(t => t.column !== 'done');
    await saveTasks(remaining);
    window.dispatchEvent(new CustomEvent('aura-tasks-updated'));
    render();
  });

  window.addEventListener('aura-panel-opened', (e) => {
    if (e.detail?.panelId === 'panel-tasks') {
      render();
      inputEl.focus();
    }
  });

  window.addEventListener('aura-tasks-updated', render);

  await render();
}

