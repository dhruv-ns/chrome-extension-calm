// Aura Tab - Top Task of the Day Anchor Line

import { getTasks, saveTasks } from '../common/storage.js';

let currentTopTask = null;

export async function initTopTask(onOpenTaskPanel) {
  const container = document.getElementById('top-task-container');
  const checkbox = document.getElementById('top-task-check');
  const label = document.getElementById('top-task-label');

  async function refresh() {
    const tasks = await getTasks();
    const todayTasks = tasks.filter(t => t.column === 'today' && !t.completed);
    
    container.classList.remove('completed');

    if (todayTasks.length > 0) {
      currentTopTask = todayTasks[0];
      label.textContent = currentTopTask.text;
      checkbox.style.display = 'flex';
    } else {
      currentTopTask = null;
      label.textContent = '+ Add a focus task for today';
      checkbox.style.display = 'none';
    }
  }

  // Handle clicking the checkbox (completion animation)
  checkbox.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (!currentTopTask) return;

    container.classList.add('completed');

    // Micro-animation delay
    setTimeout(async () => {
      const tasks = await getTasks();
      const taskIndex = tasks.findIndex(t => t.id === currentTopTask.id);
      if (taskIndex >= 0) {
        tasks[taskIndex].completed = true;
        tasks[taskIndex].column = 'done';
        tasks[taskIndex].completedAt = Date.now();
        await saveTasks(tasks);
      }
      await refresh();
      // Dispatch custom event so task panel updates its view and badges
      window.dispatchEvent(new CustomEvent('aura-tasks-updated'));
    }, 450);
  });

  // Handle clicking the label / container
  container.addEventListener('click', () => {
    if (!currentTopTask && onOpenTaskPanel) {
      onOpenTaskPanel();
    }
  });

  await refresh();

  // Listen to task updates from panels
  window.addEventListener('aura-tasks-updated', refresh);
}

