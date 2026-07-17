// ============================================
// CALENDAR — Calendário gigante interativo de tarefas
// PFA Dashboard — Módulo para visualização e edição visual
// ============================================

window.calendarCurrentDate = new Date(2026, 6, 15); // Julho de 2026 (base de dados)

function openCalendarModal() {
  const modal = document.getElementById('task-calendar-modal');
  if (modal) {
    modal.classList.add('active');
    renderCalendar();
  }
}

function closeCalendarModal() {
  const modal = document.getElementById('task-calendar-modal');
  if (modal) {
    modal.classList.remove('active');
  }
}

function prevCalendarMonth() {
  window.calendarCurrentDate.setMonth(window.calendarCurrentDate.getMonth() - 1);
  renderCalendar();
}

function nextCalendarMonth() {
  window.calendarCurrentDate.setMonth(window.calendarCurrentDate.getMonth() + 1);
  renderCalendar();
}

function todayCalendar() {
  window.calendarCurrentDate = new Date(2026, 6, 15); // Voltar para Julho de 2026
  renderCalendar();
}

function renderCalendar() {
  const container = document.getElementById('calendar-grid-container');
  const title = document.getElementById('calendar-month-title');
  if (!container || !title) return;

  // Handle Client Filtering Visuals
  const filterBadge = document.getElementById('calendar-filter-badge');
  const filterName = document.getElementById('calendar-filter-name');
  if (filterBadge && filterName) {
    if (window.calendarFilterLeadId) {
      const lead = window.mockLeads.find(l => l.id === window.calendarFilterLeadId);
      if (lead) {
        filterName.innerText = lead.name;
        filterBadge.style.display = 'inline-flex';
      } else {
        filterBadge.style.display = 'none';
      }
    } else {
      filterBadge.style.display = 'none';
    }
  }

  container.innerHTML = '';

  const year = window.calendarCurrentDate.getFullYear();
  const month = window.calendarCurrentDate.getMonth();

  // Set month title
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  title.innerText = `${monthNames[month]} ${year}`;

  // Get first day of current month (0 = Sunday, 1 = Monday...)
  const firstDayIndex = new Date(year, month, 1).getDay();
  // Get number of days in current month
  const lastDay = new Date(year, month + 1, 0).getDate();
  // Get number of days in previous month
  const prevLastDay = new Date(year, month, 0).getDate();

  // We need 42 cells (6 rows * 7 columns) to cover all layouts
  const totalCells = 42;
  
  // Previous month days to prepend
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const day = prevLastDay - i;
    const prevMonthDate = new Date(year, month - 1, day);
    renderCalendarDayCell(container, day, true, prevMonthDate);
  }

  // Current month days
  for (let day = 1; day <= lastDay; day++) {
    const currentDate = new Date(year, month, day);
    const isToday = day === 15 && month === 6 && year === 2026; // Simular 15 de Julho de 2026
    renderCalendarDayCell(container, day, false, currentDate, isToday);
  }

  // Next month days to fill remaining cells
  const remainingCells = totalCells - (firstDayIndex + lastDay);
  for (let day = 1; day <= remainingCells; day++) {
    const nextMonthDate = new Date(year, month + 1, day);
    renderCalendarDayCell(container, day, true, nextMonthDate);
  }
}

function renderCalendarDayCell(container, dayNum, isOtherMonth, dateObj, isToday = false) {
  const cell = document.createElement('div');
  cell.className = `calendar-day-cell ${isOtherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`;
  
  // Formatted date attribute for drop target
  const dayStr = dateObj.getDate().toString().padStart(2, '0');
  const monthStr = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const dateStr = `${dayStr}/${monthStr}/${dateObj.getFullYear()}`;
  cell.setAttribute('data-date', dateStr);

  // Cell Header
  cell.innerHTML = `
    <div class="calendar-day-header">
      <span>${dayNum}</span>
    </div>
    <div class="calendar-task-list" data-date="${dateStr}"></div>
  `;

  // Query tasks for this date
  const listContainer = cell.querySelector('.calendar-task-list');
  let dailyTasks = window.mockTasks.filter(t => t.prazo.split(' ')[0] === dateStr);
  if (window.calendarFilterLeadId) {
    dailyTasks = dailyTasks.filter(t => t.leadId === window.calendarFilterLeadId);
  }

  dailyTasks.forEach(task => {
    const card = document.createElement('div');
    const prioClass = task.concluida ? 'concluida' : task.prioridade;
    card.className = `calendar-task-card ${prioClass}`;
    card.setAttribute('draggable', 'true');
    card.setAttribute('data-task-id', task.id);
    card.innerText = task.titulo;
    card.title = `${task.titulo} (${task.tipo} • ${task.prioridade.toUpperCase()})`;

    // Drag start event
    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', task.id);
      card.style.opacity = '0.5';
    });

    card.addEventListener('dragend', () => {
      card.style.opacity = '1';
    });

    // Click to edit task quick-action
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      if (typeof openEditTaskModal === 'function') {
        closeCalendarModal();
        openEditTaskModal(task.id);
      }
    });

    listContainer.appendChild(card);
  });

  // Enable click on day cell to quickly create a task on that date
  cell.addEventListener('click', () => {
    if (typeof openNewTaskForm === 'function') {
      closeCalendarModal();
      openNewTaskForm(dateStr, window.calendarFilterLeadId);
    }
  });

  // HTML5 Drag and Drop Events
  listContainer.addEventListener('dragover', (e) => {
    e.preventDefault();
    cell.classList.add('dragover');
  });

  listContainer.addEventListener('dragleave', () => {
    cell.classList.remove('dragover');
  });

  listContainer.addEventListener('drop', (e) => {
    e.preventDefault();
    cell.classList.remove('dragover');
    
    const taskId = parseInt(e.dataTransfer.getData('text/plain'));
    const targetDate = listContainer.getAttribute('data-date');

    const task = window.mockTasks.find(t => t.id === taskId);
    if (task && targetDate) {
      task.prazo = targetDate;
      
      // Reactive reload
      renderCalendar();
      if (typeof renderControladoriaTasks === 'function') {
        renderControladoriaTasks();
      }
      
      // Toast notification for user confirmation
      showToastNotification('Tarefa realocada', `"${task.titulo}" alterada para ${targetDate}`, 'success');
    }
  });

  container.appendChild(cell);
}

// Bind to window to allow references in onclick attributes
window.openCalendarModal = openCalendarModal;
window.closeCalendarModal = closeCalendarModal;
window.prevCalendarMonth = prevCalendarMonth;
window.nextCalendarMonth = nextCalendarMonth;
window.todayCalendar = todayCalendar;
window.renderCalendar = renderCalendar;

function clearCalendarFilter(e) {
  if (e) e.stopPropagation();
  window.calendarFilterLeadId = null;
  renderCalendar();
}
window.clearCalendarFilter = clearCalendarFilter;
