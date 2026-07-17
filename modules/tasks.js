// ============================================
// TASKS — Sistema de tarefas interativo (controladoria)
// PFA Dashboard — Módulo extraído do app.js
// ============================================

// ==========================================
// INTERACTIVE TASKS SYSTEM
// ==========================================
function renderInteractiveTasks() {
  const container = document.querySelector('#screen-crm .tasks-list');
  if (!container) return;
  
  container.innerHTML = '';
  
  // Show only top 3 pending tasks for a clean compact dashboard widget
  const pendingTasks = window.mockTasks.filter(task => !task.concluida).slice(0, 3);

  if (pendingTasks.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; color:var(--text-secondary); font-size:12px; padding:20px 0;">
        Nenhuma tarefa pendente no momento!
      </div>
    `;
  } else {
    pendingTasks.forEach(task => {
      const lawyer = window.mockLawyers.find(l => l.id === task.responsavelId) || window.mockLawyers[0];
      const prioClass = task.prioridade === 'alta' ? 'prio-alta' : task.prioridade === 'media' ? 'prio-media' : 'prio-baixa';
      const prioLabel = task.prioridade === 'alta' ? '📋 Alta' : task.prioridade === 'media' ? '🟡 Média' : '🟢 Baixa';
      const isOverdue = !task.concluida && task.prazo < '19/05/2024'; // mock overdue check
      
      const taskEl = document.createElement('div');
      taskEl.className = `task-card ${task.concluida ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`;
      taskEl.innerHTML = `
        <div class="task-card-top">
          <label class="task-checkbox-label">
            <input type="checkbox" ${task.concluida ? 'checked' : ''} onchange="toggleTask(${task.id})">
            <span class="task-title">${task.titulo}</span>
          </label>
          <span class="task-prio-badge ${prioClass}">${prioLabel}</span>
        </div>
        <div class="task-card-bottom">
          <div class="task-assignee" onclick="openTaskReassign(event, ${task.id})" title="Clique para reatribuir">
            <div class="avatar avatar-xs">${lawyer.initials}</div>
            <span>${lawyer.name.split(' ').slice(0,2).join(' ')}</span>
          </div>
          <span class="task-deadline">📋. ${task.prazo}</span>
        </div>
      `;
      container.appendChild(taskEl);
    });
  }
  
  // Add direct link to Astrea Controladoria screen
  const viewAllBtn = document.createElement('button');
  viewAllBtn.className = 'btn btn-outline-yellow add-task-btn';
  viewAllBtn.innerHTML = 'Ver todas no Painel de Tarefas z"';
  viewAllBtn.onclick = () => navigateToScreen('tarefas');
  container.appendChild(viewAllBtn);
}

function toggleTask(taskId) {
  const task = window.mockTasks.find(t => t.id === taskId);
  if (task) {
    task.concluida = !task.concluida;
    renderInteractiveTasks();
    renderControladoriaTasks();
  }
}

function toggleTaskUrgente(taskId) {
  const task = window.mockTasks.find(t => t.id === taskId);
  if (task) {
    task.urgente = !task.urgente;
    renderControladoriaTasks();
    renderInteractiveTasks();
    const msg = task.urgente ? '🚨 Tarefa marcada como URGENTE!' : '✅ Urgência removida da tarefa.';
    showToastNotification('Prioridade Atualizada', msg, task.urgente ? 'error' : 'success');
  }
}

function openTaskReassign(event, taskId) {
  event.stopPropagation();
  // Remove existing popover
  document.querySelectorAll('.reassign-popover').forEach(p => p.remove());
  
  const task = window.mockTasks.find(t => t.id === taskId);
  if (!task) return;
  
  const popover = document.createElement('div');
  popover.className = 'reassign-popover';
  popover.innerHTML = `
    <div class="reassign-title">Reatribuir para:</div>
    ${window.mockLawyers.map(l => `
      <div class="reassign-option ${l.id === task.responsavelId ? 'current' : ''}" onclick="reassignTask(${taskId}, ${l.id})">
        <div class="avatar avatar-xs">${l.initials}</div>
        <span>${l.name}</span>
      </div>
    `).join('')}
  `;
  
  const rect = event.currentTarget.getBoundingClientRect();
  popover.style.position = 'fixed';
  popover.style.top = (rect.bottom + window.scrollY + 4) + 'px';
  popover.style.left = rect.left + 'px';
  document.body.appendChild(popover);
  
  // Close on click outside
  setTimeout(() => {
    document.addEventListener('click', function closePopover(e) {
      if (!popover.contains(e.target)) {
        popover.remove();
        document.removeEventListener('click', closePopover);
      }
    });
  }, 10);
}

function reassignTask(taskId, lawyerId) {
  const task = window.mockTasks.find(t => t.id === taskId);
  if (task) {
    task.responsavelId = lawyerId;
    document.querySelectorAll('.reassign-popover').forEach(p => p.remove());
    renderInteractiveTasks();
  }
}

function openNewTaskForm(defaultDate = null, defaultLeadId = null) {
  openEditTaskModal(null, defaultDate, defaultLeadId);
}

function openEditTaskModal(taskId, defaultDate = null, defaultLeadId = null) {
  const isNew = taskId === null;
  const task = isNew ? { id: null, titulo: '', leadId: defaultLeadId ? parseInt(defaultLeadId) : null, prioridade: 'media', responsavelId: 1, concluida: false, prazo: defaultDate || '', tipo: 'Petição' } : window.mockTasks.find(t => t.id === taskId);
  if (!task) return;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.innerHTML = `
    <div class="edit-lead-modal" style="max-width: 500px;">
      <div class="modal-header">
        <h3>${isNew ? '📋< Nova Tarefa (Controladoria)' : 'o️ Editar Tarefa'}</h3>
        <button class="modal-close-btn" onclick="this.closest('.modal-overlay').remove()">&times;</button>
      </div>
      <div class="modal-body" style="padding: 20px;">
        <div class="form-group" style="margin-bottom: 12px;">
          <label>Descrição da Tarefa</label>
          <input type="text" id="edit-task-title" value="${task.titulo}" placeholder="O que precisa ser feito📄>
        </div>
        <div class="form-grid" style="margin-bottom: 12px; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));">
          <div class="form-group">
            <label>Tipo de Atividade</label>
            <select id="edit-task-type" onchange="toggleCustomTaskTypeField(this.value)">
              ${window.tiposTarefa.map(t => `<option value="${t}" ${t === task.tipo || (!window.tiposTarefa.includes(task.tipo) && t === 'Outro') ? 'selected' : ''}>${t}</option>`).join('')}
            </select>
          </div>
          <div class="form-group" id="custom-task-type-group" style="display: ${task.tipo === 'Outro' || (!window.tiposTarefa.includes(task.tipo) && task.tipo) ? 'block' : 'none'};">
            <label>Especificar Atividade</label>
            <input type="text" id="edit-task-type-custom" value="${!window.tiposTarefa.includes(task.tipo) ? task.tipo : ''}" placeholder="Digite o tipo...">
          </div>
          <div class="form-group">
            <label>Cliente Associado</label>
            <select id="edit-task-client">
              <option value="">Nenhum (Geral)</option>
              ${window.mockLeads.map(l => `<option value="${l.id}" ${l.id === task.leadId ? 'selected' : ''}>${l.name}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-grid" style="margin-bottom: 12px;">
          <div class="form-group">
            <label>Prioridade</label>
            <select id="edit-task-prio">
              <option value="alta" ${task.prioridade === 'alta' ? 'selected' : ''}>📋 Alta</option>
              <option value="media" ${task.prioridade === 'media' ? 'selected' : ''}>🟡 Média</option>
              <option value="baixa" ${task.prioridade === 'baixa' ? 'selected' : ''}>🟢 Baixa</option>
            </select>
          </div>
          <div class="form-group">
            <label>Prazo</label>
            <input type="date" id="edit-task-prazo" value="${formatDateToISO(task.prazo)}">
          </div>
        </div>
        <div class="form-group">
          <label>Advogado Responsável</label>
          <div class="lawyer-picker" id="edit-task-lawyer-picker">
            ${window.mockLawyers.map(l => `
              <div class="lawyer-pick-card ${l.id === task.responsavelId ? 'selected' : ''}" data-lawyer-id="${l.id}">
                <div class="avatar">${l.initials}</div>
                <div class="lawyer-pick-info">
                  <strong>${l.name}</strong>
                  <span>${l.especialidade}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline-yellow" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
        <button class="btn btn-yellow" onclick="saveTaskChanges(${task.id}, this)">✅ ${isNew ? 'Criar Tarefa' : 'Salvar Alterações'}</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  
  // Prevent browser auto-scrolling to other fields by focusing the first field
  setTimeout(() => {
    const input = overlay.querySelector('#edit-task-title');
    if (input) input.focus();
  }, 50);

  // Lawyer picker clicks
  overlay.querySelectorAll('.lawyer-pick-card').forEach(card => {
    card.addEventListener('click', () => {
      overlay.querySelectorAll('.lawyer-pick-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
    });
  });
}

function saveTaskChanges(taskId, button) {
  const overlay = button ? button.closest('.modal-overlay') : document.querySelector('.modal-overlay.active');
  if (!overlay) return;

  const title = overlay.querySelector('#edit-task-title').value;
  if (!title.trim()) return;

  const selectedLawyer = overlay.querySelector('#edit-task-lawyer-picker .lawyer-pick-card.selected');
  const lawyerId = selectedLawyer ? parseInt(selectedLawyer.getAttribute('data-lawyer-id')) : 1;
  const leadIdRaw = overlay.querySelector('#edit-task-client').value;
  const leadId = leadIdRaw ? parseInt(leadIdRaw) : null;

  let taskType = overlay.querySelector('#edit-task-type').value;
  if (taskType === 'Outro') {
    const customInput = overlay.querySelector('#edit-task-type-custom');
    if (customInput && customInput.value.trim() !== '') {
      taskType = customInput.value.trim();
    }
  }

  const data = {
    titulo: title,
    tipo: taskType,
    leadId: leadId,
    prioridade: overlay.querySelector('#edit-task-prio').value,
    responsavelId: lawyerId,
    prazo: formatDateToBR(overlay.querySelector('#edit-task-prazo').value)
  };

  if (taskId === null) {
    // Create new
    const newId = Math.max(...window.mockTasks.map(t => t.id)) + 1;
    window.mockTasks.push({
      id: newId,
      concluida: false,
      ...data
    });
  } else {
    // Edit existing
    const task = window.mockTasks.find(t => t.id === taskId);
    if (task) {
      Object.assign(task, data);
    }
  }

  overlay.remove();
  
  // Refresh views
  renderControladoriaTasks();
  renderInteractiveTasks();
}

function deleteTaskWithConfirmation(taskId) {
  const task = window.mockTasks.find(t => t.id === taskId);
  if (!task) return;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.innerHTML = `
    <div class="delete-confirm-modal">
      <div class="delete-confirm-icon">Y-'️</div>
      <h3>Excluir Tarefa</h3>
      <p>Tem certeza que deseja excluir a tarefa: <strong>${task.titulo}</strong>?</p>
      <div class="delete-confirm-actions">
        <button class="btn btn-outline-yellow" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
        <button class="btn btn-danger" onclick="confirmDeleteTask(${taskId})">Excluir</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function confirmDeleteTask(taskId) {
  window.mockTasks = window.mockTasks.filter(t => t.id !== taskId);
  document.querySelector('.modal-overlay').remove();
  renderControladoriaTasks();
  renderInteractiveTasks();
}

function renderControladoriaTasks() {
  const container = document.getElementById('controladoria-tasks-accordion-container');
  if (!container) return;

  const filterLawyerEl = document.getElementById('task-filter-lawyer');
  const filterLawyerVal = filterLawyerEl ? filterLawyerEl.value : 'all';
  const filterTypeEl = document.getElementById('task-filter-type');
  const filterTypeVal = filterTypeEl ? filterTypeEl.value : 'all';
  const sortByEl = document.getElementById('task-sort-by');
  const sortBy = sortByEl ? sortByEl.value : 'none';
  const activeTab = window.currentTaskTab || 'pending';
  const today = new Date();
  today.setHours(0,0,0,0);

  // --- Carga de Trabalho ---
  const workloadContainer = document.getElementById('workload-panel-container');
  if (workloadContainer) {
    const lawyers = window.mockLawyers;
    workloadContainer.innerHTML = '<div class="workload-panel">' + lawyers.map(l => {
      const pendingTasks = window.mockTasks.filter(t => t.responsavelId === l.id && !t.concluida).length;
      const totalCapacity = 20;
      const ratio = Math.min(100, (pendingTasks / totalCapacity) * 100);
      const colorCls = ratio < 50 ? 'low' : ratio < 80 ? 'medium' : 'high';
      return `
        <div class="workload-card">
          <div class="workload-card-header">
            <div class="avatar avatar-sm">${getInitials(l.name)}</div>
            <strong style="font-size:12px; color:var(--text-primary);">${l.name.split(' ')[0]} ${l.name.split(' ')[1] || ''}</strong>
          </div>
          <div class="workload-bar-track">
            <div class="workload-bar-fill ${colorCls}" style="width: ${ratio}%"></div>
          </div>
          <div class="workload-label">
            <span>${pendingTasks} pendentes</span>
            <span>${Math.round(ratio)}% cap.</span>
          </div>
        </div>
      `;
    }).join('') + '</div>';
  }

  function getDaysRemaining(prazoStr) {
    if (!prazoStr || prazoStr === 'Sem prazo') return null;
    const iso = formatDateToISO(prazoStr);
    if (!iso) return null;
    const prazoDate = new Date(iso.substring(0,10));
    prazoDate.setHours(0,0,0,0);
    const diff = Math.ceil((prazoDate - today) / (1000 * 60 * 60 * 24));
    return diff;
  }

  // Compute urgent count for badge update
  const allUrgent = window.mockTasks.filter(t => {
    if (t.concluida) return false;
    const days = getDaysRemaining(t.prazo);
    return t.urgente || (days !== null && days <= 3);
  });

  // Update summary label
  const summaryEl = document.getElementById('task-tab-summary');
  if (summaryEl) {
    const pendingCount = window.mockTasks.filter(t => !t.concluida).length;
    const completedCount = window.mockTasks.filter(t => t.concluida).length;
    summaryEl.textContent = `${pendingCount} pendentes · ${allUrgent.length} urgentes · ${completedCount} concluídas`;
  }

  // Filter tasks
  let filtered = window.mockTasks.filter(task => {
    const matchLawyer = filterLawyerVal === 'all' || task.responsavelId === parseInt(filterLawyerVal);
    const matchType = filterTypeVal === 'all' || task.tipo === filterTypeVal;
    let matchStatus;
    if (activeTab === 'completed') {
      matchStatus = task.concluida;
    } else {
      matchStatus = !task.concluida;
    }
    return matchLawyer && matchType && matchStatus;
  });

  // Sort helper
  function sortTasksList(taskList) {
    taskList.sort((a, b) => {
      const daysA = getDaysRemaining(a.prazo);
      const daysB = getDaysRemaining(b.prazo);
      const isUrgentA = a.urgente || (daysA !== null && daysA <= 3);
      const isUrgentB = b.urgente || (daysB !== null && daysB <= 3);
      
      if (isUrgentA && !isUrgentB) return -1;
      if (!isUrgentA && isUrgentB) return 1;

      if (sortBy === 'prazo') {
        const da = formatDateToISO(a.prazo) || '9999-12-31';
        const db = formatDateToISO(b.prazo) || '9999-12-31';
        return da.localeCompare(db);
      } else if (sortBy === 'priority') {
        const weight = { alta: 3, media: 2, baixa: 1 };
        return (weight[b.prioridade] || 0) - (weight[a.prioridade] || 0);
      } else if (sortBy === 'lawyer') {
        const la = window.mockLawyers.find(l => l.id === a.responsavelId)?.name || '';
        const lb = window.mockLawyers.find(l => l.id === b.responsavelId)?.name || '';
        return la.localeCompare(lb);
      }
      return 0;
    });
  }

  container.innerHTML = '';

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; color:var(--text-secondary); padding:32px; font-size:13px; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:8px;">
        Nenhuma tarefa encontrada para os filtros selecionados.
      </div>
    `;
    return;
  }

  // Group tasks by lead
  const groups = {};
  filtered.forEach(task => {
    const key = task.leadId ? task.leadId : 'geral';
    if (!groups[key]) groups[key] = [];
    groups[key].push(task);
  });

  // Render each group
  Object.keys(groups).forEach(key => {
    const tasksInGroup = groups[key];
    sortTasksList(tasksInGroup);

    let clientName = 'Geral (Sem Cliente)';
    let clientObj = null;
    let trackerHTML = '';

    if (key !== 'geral') {
      clientObj = window.mockLeads.find(l => l.id === parseInt(key));
      if (clientObj) {
        clientName = clientObj.name;
        
        const stages = ['Triagem', 'Documentos', 'Defesa', 'Julgamento', 'Concluído'];
        const currentEtapa = clientObj.etapa || 'Triagem';
        let activeIdx = stages.findIndex(s => currentEtapa.includes(s));
        if (activeIdx === -1) activeIdx = 0;

        trackerHTML = `
          <div class="task-accordion-tracker" style="margin-left: 12px; display:inline-flex; align-items:center;">
            ${stages.map((s, idx) => {
              const isActive = idx === activeIdx;
              return `<span class="${isActive ? 'active' : ''}">${s}</span>`;
            }).join(' <span style="opacity:0.3; margin:0 3px;">➔</span> ')}
          </div>
        `;
      }
    }

    window.expandedClients = window.expandedClients || {};
    if (window.expandedClients[key] === undefined) {
      window.expandedClients[key] = true;
    }
    const isExpanded = window.expandedClients[key];

    const groupEl = document.createElement('div');
    groupEl.className = 'task-accordion-group';
    groupEl.setAttribute('data-group-id', key);

    // Header
    const headerEl = document.createElement('div');
    headerEl.className = `task-accordion-header ${isExpanded ? 'active' : ''}`;
    
    let actionButtonsHTML = '';
    if (clientObj) {
      actionButtonsHTML = `
        <button onclick="event.stopPropagation(); window.goToClientChat(${clientObj.id});" class="task-shortcut-btn" title="Ir para o Chat do Cliente">💬 Chat</button>
        <button onclick="event.stopPropagation(); window.goToClientDocs(${clientObj.id});" class="task-shortcut-btn" title="Ir para os Documentos do Cliente">📂 Docs</button>
      `;
    }

    headerEl.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px;">
        <span class="task-accordion-arrow" style="font-size:12px; color:var(--text-secondary); transition: transform 0.2s; display:inline-block; transform: rotate(${isExpanded ? '90deg' : '0deg'});">▶</span>
        <div class="task-accordion-client-title">
          ${clientName}
          <span style="font-size:11px; font-weight:normal; color:var(--text-secondary);">(${tasksInGroup.length} tarefas)</span>
        </div>
        ${trackerHTML}
      </div>
      <div class="task-accordion-actions">
        ${actionButtonsHTML}
      </div>
    `;

    // Body
    const bodyEl = document.createElement('div');
    bodyEl.className = `task-accordion-body ${isExpanded ? 'open' : ''}`;

    const tableWrapper = document.createElement('div');
    tableWrapper.className = 'crm-leads-table-wrapper';
    tableWrapper.style.boxShadow = 'none';
    tableWrapper.style.border = 'none';
    tableWrapper.style.marginTop = '0';
    tableWrapper.style.padding = '0';

    const table = document.createElement('table');
    table.className = 'crm-leads-table';
    table.style.tableLayout = 'auto';
    table.style.width = '100%';

    table.innerHTML = `
      <thead>
        <tr>
          <th style="width: 100px; text-align: center;">Status</th>
          <th style="min-width: 250px;">Tarefa</th>
          <th style="width: 120px;">Tipo</th>
          <th style="width: 120px;">Prioridade</th>
          <th style="min-width: 180px;">Responsável</th>
          <th style="width: 120px;">Prazo</th>
          <th style="width: 80px; text-align: center;">Ações</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');

    tasksInGroup.forEach(task => {
      const lawyer = window.mockLawyers.find(l => l.id === task.responsavelId) || window.mockLawyers[0];
      const days = getDaysRemaining(task.prazo);
      
      const prioClass = task.prioridade === 'alta' ? 'prio-alta' : task.prioridade === 'media' ? 'prio-media' : 'prio-baixa';
      const prioLabel = task.prioridade === 'alta' ? '📋 Alta' : task.prioridade === 'media' ? '🟡 Média' : '🟢 Baixa';

      const isUrgent = task.urgente || (!task.concluida && days !== null && days <= 3);
      const isOverdue = !task.concluida && days !== null && days < 0;

      const prazoISO = task.prazo ? task.prazo.split('/').reverse().join('-') : '';
      let prazoInputHTML = `
        <input type="date" value="${prazoISO}" style="border:1px solid transparent;border-radius:4px;background:transparent;color:var(--text-primary);font-size:12px;font-weight:700;padding:2px 4px;cursor:pointer;transition:border-color 0.15s;"
          onmouseover="this.style.borderColor='var(--border-color)'"
          onmouseout="if(document.activeElement!==this)this.style.borderColor='transparent'"
          onfocus="this.style.borderColor='var(--brand-primary)'"
          onchange="const p=this.value.split('-');const t=window.mockTasks.find(t=>t.id===${task.id});if(t){t.prazo=p[2]+'/'+p[1]+'/'+p[0];renderControladoriaTasks();showToastNotification('Prazo atualizado','','success');}">
      `;
      if (isOverdue) prazoInputHTML += `<br><span style="color:var(--red-primary);font-size:10px;font-weight:700;">⚠️ VENCIDO</span>`;
      else if (isUrgent) prazoInputHTML += `<br><span style="color:var(--orange-primary);font-size:10px;font-weight:700;">⏰ ${days===0?'HOJE':days===1?'AMANHÃ':'em '+days+'d'}</span>`;

      const tiposTask = ['Envio de Defesa','Protocolo JARI','Análise de Documentos','Contato com Cliente','Recurso CETRAN','Elaboração de Recurso','Audiência','Pagamento','Outro'];
      const tipoSelectHTML = `<select title="Alterar tipo" style="border:1px solid transparent;border-radius:4px;background:transparent;font-size:11px;font-weight:700;color:var(--text-secondary);padding:1px 4px;cursor:pointer;max-width:125px;"
        onmouseover="this.style.borderColor='var(--border-color)'"
        onmouseout="if(document.activeElement!==this)this.style.borderColor='transparent'"
        onchange="window.mockTasks.find(t=>t.id===${task.id}).tipo=this.value;showToastNotification('Tipo atualizado','','success')">
        ${tiposTask.map(t => `<option value="${t}" ${t===task.tipo?'selected':''}>${t}</option>`).join('')}
      </select>`;

      const respSelectHTML = `<select title="Alterar responsável" style="border:1px solid transparent;border-radius:4px;background:transparent;font-size:11.5px;color:var(--text-primary);padding:1px 4px;cursor:pointer;max-width:140px;"
        onmouseover="this.style.borderColor='var(--border-color)'"
        onmouseout="if(document.activeElement!==this)this.style.borderColor='transparent'"
        onchange="const t=window.mockTasks.find(x=>x.id===${task.id}); if(t){ t.responsavelId=parseInt(this.options[this.selectedIndex].dataset.id); t.advogadoId=t.responsavelId; } renderControladoriaTasks(); showToastNotification('Responsável atualizado','','success')">
        ${window.mockLawyers.map(l => `<option value="${l.name}" data-id="${l.id}" ${task.responsavelId===l.id?'selected':''}>${l.name.split(' ').slice(0,2).join(' ')}</option>`).join('')}
      </select>`;

      let actionCellHTML = '';
      if (task.concluida) {
        actionCellHTML = `
          <div style="display:flex; flex-direction:column; align-items:center; gap:2px;">
            <span style="color:var(--green-primary); font-weight:700; font-size:11px;">✓ Concluída</span>
            <a href="#" onclick="reopenTask(${task.id}); return false;" style="font-size:9.5px; color:var(--orange-primary); font-weight:700; text-decoration:underline;">(Reabrir)</a>
          </div>
        `;
      } else {
        actionCellHTML = `
          <button class="btn btn-outline-yellow" onclick="confirmTaskCompletion(null, ${task.id})" style="padding: 4px 8px; font-size: 10.5px; font-weight: 700; border-radius: 4px; border:1px solid var(--border-color); color:var(--green-primary); display:flex; align-items:center; gap:4px; margin: 0 auto;" title="Concluir">
            Concluir
          </button>
        `;
      }

      const tr = document.createElement('tr');
      tr.style.opacity = task.concluida ? '0.7' : '1';
      if (isOverdue) tr.style.backgroundColor = 'rgba(239,68,68,0.06)';
      else if (isUrgent) tr.style.backgroundColor = 'rgba(245,158,11,0.05)';

      tr.innerHTML = `
        <td style="text-align:center; vertical-align:middle;">${actionCellHTML}</td>
        <td style="vertical-align:middle;">
          <div contenteditable="true" title="Clique para editar o título"
            style="outline:none;border:1px solid transparent;border-radius:4px;padding:2px 4px;cursor:text;transition:border-color 0.15s;font-weight:600;${task.concluida?'text-decoration:line-through;color:var(--text-secondary);':''}"
            onmouseover="this.style.borderColor='var(--border-color)'"
            onmouseout="if(document.activeElement!==this)this.style.borderColor='transparent'"
            onfocus="this.style.borderColor='var(--brand-primary)'"
            onblur="const t=window.mockTasks.find(t=>t.id===${task.id});if(t&&this.innerText.trim())t.titulo=this.innerText.trim();this.style.borderColor='transparent'"
          >${task.titulo}</div>
          
          <div style="display:flex; align-items:center; gap:6px; margin-top:4px;">
            <button onclick="toggleTaskUrgente(${task.id})" title="${isUrgent ? 'Remover urgente' : 'Marcar como Urgente'}"
              style="display:inline-flex;align-items:center;gap:3px;border:none;border-radius:4px;font-size:9px;padding:2px 6px;font-weight:700;cursor:pointer;transition:all 0.15s;
              background:${isUrgent ? 'var(--red-primary)' : 'var(--bg-primary)'};
              color:${isUrgent ? '#fff' : 'var(--text-secondary)'};
              border:1px solid ${isUrgent ? 'var(--red-primary)' : 'var(--border-color)'};">
              ${isUrgent ? '🚨 URGENTE' : '+ Urgente'}
            </button>
          </div>
        </td>
        <td style="vertical-align:middle;">${tipoSelectHTML}</td>
        <td style="vertical-align:middle;"><span class="task-prio-badge ${prioClass}">${prioLabel}</span></td>
        <td style="vertical-align:middle;">${respSelectHTML}</td>
        <td style="vertical-align:middle;">${prazoInputHTML}</td>
        <td style="text-align:center; vertical-align:middle;">
          <button class="table-action-btn delete" title="Excluir Tarefa" onclick="deleteTaskWithConfirmation(${task.id})" style="margin:0 auto;">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tableWrapper.appendChild(table);
    bodyEl.appendChild(tableWrapper);

    groupEl.appendChild(headerEl);
    groupEl.appendChild(bodyEl);

    // Toggle expand action
    headerEl.addEventListener('click', () => {
      const currentlyOpen = bodyEl.classList.contains('open');
      if (currentlyOpen) {
        bodyEl.classList.remove('open');
        headerEl.classList.remove('active');
        headerEl.querySelector('.task-accordion-arrow').style.transform = 'rotate(0deg)';
        window.expandedClients[key] = false;
      } else {
        bodyEl.classList.add('open');
        headerEl.classList.add('active');
        headerEl.querySelector('.task-accordion-arrow').style.transform = 'rotate(90deg)';
        window.expandedClients[key] = true;
      }
    });

    container.appendChild(groupEl);
  });
}

function switchTaskTab(tabName) {
  window.currentTaskTab = tabName;
  
  const pendingTab = document.getElementById('task-tab-pending');
  const completedTab = document.getElementById('task-tab-completed');
  
  [pendingTab, completedTab].forEach(t => t && t.classList.remove('active'));
  
  if (tabName === 'pending' && pendingTab) pendingTab.classList.add('active');
  else if (tabName === 'completed' && completedTab) completedTab.classList.add('active');
  
  renderControladoriaTasks();
}

function reopenTask(taskId) {
  const task = window.mockTasks.find(t => t.id === taskId);
  if (task) {
    task.concluida = false;
    showToastNotification('Tarefa Reaberta', `Tarefa "${task.titulo}" reaberta para pendente.`, '📋');
    
    const lead = window.mockLeads.find(l => l.id === task.leadId);
    if (lead) {
      lead.timeline.unshift({
        time: new Date().toLocaleString('pt-BR').substring(0, 10),
        type: 'Advogado',
        title: 'Tarefa Reaberta',
        desc: `Tarefa "${task.titulo}" foi reaberta.`
      });
    }
    
    renderControladoriaTasks();
    if (typeof renderBottomTabContent === 'function') renderBottomTabContent('atividades');
  }
}

function filterInteractiveTasksScreen() {
  renderControladoriaTasks();
}

window.toggleControladoriaTask = toggleTask;
window.filterInteractiveTasksScreen = filterInteractiveTasksScreen;
window.renderControladoriaTasks = renderControladoriaTasks;
window.openNewTaskForm = openNewTaskForm;
window.openEditTaskModal = openEditTaskModal;
window.saveTaskChanges = saveTaskChanges;
window.deleteTaskWithConfirmation = deleteTaskWithConfirmation;
window.confirmDeleteTask = confirmDeleteTask;
window.switchTaskTab = switchTaskTab;
window.reopenTask = reopenTask;

window.goToClientChat = function(leadId) {
  const chatSidebarItem = document.querySelector('.sidebar-item[data-screen="conversas"]');
  if (chatSidebarItem) {
    chatSidebarItem.click();
  }
  if (typeof openViewDetailsPanel === 'function') {
    openViewDetailsPanel(leadId);
  }
  if (typeof renderChatArea === 'function') renderChatArea();
  if (typeof renderConversationList === 'function') renderConversationList();
};

window.goToClientDocs = function(leadId) {
  const docsSidebarItem = document.querySelector('.sidebar-item[data-screen="documentos"]');
  if (docsSidebarItem) {
    docsSidebarItem.click();
  }
  const searchInput = document.getElementById('docs-client-search');
  const lead = window.mockLeads.find(l => l.id === leadId);
  if (searchInput && lead) {
    searchInput.value = `${lead.name} (${lead.tipoCaso})`;
    if (typeof initDocumentsScreen === 'function') {
      initDocumentsScreen();
    }
  }
};




