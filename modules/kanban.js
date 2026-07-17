// ============================================
// KANBAN — Tela kanban + drag and drop
// PFA Dashboard — Módulo extraído do app.js
// ============================================

// ==========================================
// KANBAN SCREEN LOGIC
// ==========================================
function renderFullKanbanScreen() {
  const container = document.getElementById('kanban-board-container');
  container.innerHTML = '';
  
  const stages = [
    { key: 'Novo Lead', title: 'Novo Lead', val: 'R$ 124.350' },
    { key: 'Em Triagem', title: 'Em Triagem', val: 'R$ 89.760' },
    { key: 'Documentos Pendentes', title: 'Doc. Pendentes', val: 'R$ 76.440' },
    { key: 'Assinatura', title: 'Assinatura', val: 'R$ 38.120' },
    { key: 'Protocolo', title: 'Protocolo', val: 'R$ 58.910' },
    { key: 'Recurso em Andamento', title: 'Em Recurso', val: 'R$ 92.100' },
    { key: 'Audiência / Retorno', title: 'Audiência', val: 'R$ 26.480' },
    { key: 'Fechado', title: 'Fechado/Ganho', val: 'R$ 158.310' }
  ];

  stages.forEach(stage => {
    const col = document.createElement('div');
    col.className = 'kanban-board-column';
    
    // Filter leads matching this stage
    let stageLeads = mockLeads.filter(l => l.etapa.toLowerCase() === stage.key.toLowerCase());
    if (window.urgenciaMaximaActive) {
      stageLeads = stageLeads.filter(l => l.prioridade === 'alta' || l.apreendido || (l.location && l.location.includes('Apreendido')));
    }
    
    col.innerHTML = `
      <div class="kanban-board-column-header" style="display:flex; justify-content:space-between; align-items:center;">
        <span class="kanban-board-column-title" style="font-weight:700;">${stage.title}</span>
        <span class="kanban-board-column-count">${stageLeads.length}</span>
      </div>
      <div style="font-size:9px; color:var(--text-secondary); margin-bottom:8px;">${stage.val}</div>
      <div class="kanban-board-card-list" data-stage="${stage.key}">
        <!-- Cards insert -->
      </div>
    `;

    const cardList = col.querySelector('.kanban-board-card-list');
    
    stageLeads.forEach(lead => {
      const card = document.createElement('div');
      card.className = `kanban-board-card ${lead.id === currentLeadId ? 'active' : ''}`;
      card.setAttribute('draggable', 'true');
      
      const priorityClass = lead.prioridade === 'alta' ? 'alta' : lead.prioridade === 'media' ? 'media' : 'baixa';
      const priorityName = lead.prioridade === 'alta' ? 'Alta' : lead.prioridade === 'media' ? 'Média' : 'Baixa';
      const tempIcon = lead.temperatura === 'quente' ? '📋' : lead.temperatura === 'morno' ? 's' : '"️';
      const lawyer = window.mockLawyers.find(l => l.id === lead.responsavelId) || window.mockLawyers[0];
      
      const valorCausaStr = lead.valorCausa.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
      const valoresPagosStr = (lead.valoresPagos || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
      const roboHTML = lead.roboAtivo 
        ? '<span style="font-size:9px; font-weight:600; background:#dcfce7; color:#15803d; border:1px solid #bbf7d0; padding:2px 6px; border-radius:4px;">Y- IA Ativa</span>' 
        : '<span style="font-size:9px; font-weight:600; background:#f3f4f6; color:#4b5563; border:1px solid #e5e7eb; padding:2px 6px; border-radius:4px;">✅ Manual</span>';

      const ultContatoDias = Math.abs((lead.id * 7) % 15);
      const ultContatoHTML = `<span style="font-size:9px; font-weight:700; background:#fef3c7; color:#d97706; border:1px solid #fde68a; padding:2px 6px; border-radius:4px; white-space:nowrap;">⏳ Contato: ${ultContatoDias}d</span>`;
      
      const statusFin = lead.valoresPagos >= lead.valorCausa * 0.4 ? 'Contrato Ativo' : 'Parcela Atrasada';
      const statusFinCls = statusFin === 'Contrato Ativo' ? 'background:#dcfce7; color:#15803d; border:1px solid #bbf7d0;' : 'background:#fee2e2; color:#b91c1c; border:1px solid #fca5a5;';
      const statusFinHTML = `<span style="font-size:9px; font-weight:700; ${statusFinCls} padding:2px 6px; border-radius:4px; white-space:nowrap;">✅ ${statusFin}</span>`;
      
      const apreendidoBadge = lead.apreendido ? `<span style="font-size:9px; font-weight:700; background:#fef2f2; color:#dc2626; border:1px solid #fca5a5; padding:2px 6px; border-radius:4px; white-space:nowrap;">🚨 Apreendido</span>` : '';

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <div class="kanban-board-card-title" style="font-size:12px; font-weight:700; color:var(--text-primary); margin:0;">${lead.name} ${tempIcon}</div>
          ${roboHTML}
        </div>
        
        <div style="display:flex; flex-wrap:wrap; gap:4px; margin-bottom:4px;">
          <span class="kanban-board-card-badge lei-seca" style="background:#e0f2fe; color:#0369a1; border:1px solid #bae6fd; font-size:9px; padding:2px 6px; border-radius:4px;">${lead.tipoCaso}</span>
          <span style="font-size:9px; font-weight:600; color:var(--text-secondary); background:var(--bg-tertiary); padding:2px 6px; border-radius:4px; border:1px solid var(--border-color);">Proc: ${lead.processo}</span>
          ${apreendidoBadge}
        </div>

        <div class="kanban-board-card-footer" style="display:flex; justify-content:space-between; align-items:center; border-top:1px dashed var(--border-color); padding-top:6px; margin-top:4px;">
          <div style="display:flex; align-items:center; gap:6px;">
            <div class="avatar avatar-xs" style="width:20px; height:20px; font-size:9px; display:flex; align-items:center; justify-content:center; border-radius:50%; background:var(--gold-bg); color:var(--gold-primary); font-weight:700;">${lawyer.initials}</div>
            <span style="font-size:10px; font-weight:600; color:var(--text-primary);">${lawyer.name.split(' ').slice(0,2).join(' ')}</span>
          </div>
          <div style="display:flex; flex-direction:column; align-items:flex-end;">
            <span class="kanban-board-card-priority ${priorityClass}" style="font-size:10px; font-weight:700;">- ${priorityName}</span>
            <span style="font-size:9px; color:var(--text-secondary); margin-top:1px;">Prazo: ${lead.prazoAcao.split(' ')[0]}</span>
          </div>
        </div>
      `;

      card.addEventListener('click', () => {
        currentLeadId = lead.id;
        renderFullKanbanScreen();
        openDetailedClientModal(lead.id);
      });

      card.addEventListener('dragstart', (e) => {
        card.classList.add('dragging');
        e.dataTransfer.setData('text/plain', lead.id);
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
      });

      cardList.appendChild(card);
    });

    container.appendChild(col);
  });

  renderFullKanbanSidebar();
  bindKanbanDragEvents(); // Bind dragover and drop events to the columns
}

function renderFullKanbanSidebar() {
  const container = document.getElementById('kanban-sidebar-container');
  if (container) {
    container.innerHTML = document.querySelector('.right-col').innerHTML;
    // Bind buttons again
    bindFollowupButton();
  }
}


// ==========================================
// KANBAN DRAG & DROP SYSTEM
// ==========================================
function initKanbanDragAndDrop() {
  // Navigation sync
  const kanbanNavItem = document.querySelector('[data-screen="kanban"]');
  if (kanbanNavItem) {
    kanbanNavItem.addEventListener('click', () => {
      setTimeout(bindKanbanDragEvents, 50);
    });
  }
}

function bindKanbanDragEvents() {
  const lists = document.querySelectorAll('.kanban-board-card-list');
  
  lists.forEach(list => {
    list.addEventListener('dragover', (e) => {
      e.preventDefault();
      list.closest('.kanban-board-column').classList.add('drag-over');
    });
    
    list.addEventListener('dragleave', () => {
      list.closest('.kanban-board-column').classList.remove('drag-over');
    });
    
    list.addEventListener('drop', (e) => {
      e.preventDefault();
      list.closest('.kanban-board-column').classList.remove('drag-over');
      
      const leadId = parseInt(e.dataTransfer.getData('text/plain'));
      const targetStage = list.getAttribute('data-stage');
      
      if (leadId && targetStage) {
        moveLeadStage(leadId, targetStage, 'Arrastado pelo administrador');
      }
    });
  });
}

function openMoveStageModal(event, leadId) {
  event.stopPropagation();
  const lead = window.mockLeads.find(l => l.id === leadId);
  if (!lead) return;
  
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.innerHTML = `
    <div class="edit-lead-modal" style="max-width: 440px;">
      <div class="modal-header">
        <h3>📋" Mudar Etapa - ${lead.name}</h3>
        <button class="modal-close-btn" onclick="this.closest('.modal-overlay').remove()">&times;</button>
      </div>
      <div class="modal-body" style="padding: 20px;">
        <div class="form-group" style="margin-bottom: 12px;">
          <label>Mover para:</label>
          <select id="move-target-stage">
            ${window.crmEtapas.map(e => `<option ${e === lead.etapa ? 'selected' : ''}>${e}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="margin-bottom: 12px;">
          <label>Motivo da Mudança</label>
          <input type="text" id="move-reason" placeholder="Ex: Documento enviado pelo cliente" value="">
        </div>
        <div class="form-group">
          <label>Reatribuir Advogado (Opcional)</label>
          <select id="move-lawyer-assign">
            ${window.mockLawyers.map(l => `<option ${l.id === lead.responsavelId ? 'selected' : ''} value="${l.id}">${l.name}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline-yellow" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
        <button class="btn btn-yellow" onclick="confirmMoveStage(${leadId}, this)">Confirmar</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

window.confirmMoveStage = function(leadId, button) {
  const overlay = button ? button.closest('.modal-overlay') : document.querySelector('.modal-overlay.active');
  if (!overlay) return;
  const stage = overlay.querySelector('#move-target-stage').value;
  const reason = overlay.querySelector('#move-reason').value || 'Alteração manual';
  const lawyerId = parseInt(overlay.querySelector('#move-lawyer-assign').value);
  
  overlay.remove();
  
  // Update lawyer if changed
  const lead = window.mockLeads.find(l => l.id === leadId);
  if (lead) {
    lead.responsavelId = lawyerId;
  }
  
  moveLeadStage(leadId, stage, reason);
};

function moveLeadStage(leadId, targetStage, reason) {
  const lead = window.mockLeads.find(l => l.id === leadId);
  if (!lead) return;
  
  const previousStage = lead.etapa;
  lead.etapa = targetStage;
  
  // Log inside timeline
  lead.timeline.unshift({
    time: new Date().toLocaleString('pt-BR').substring(0,14),
    type: 'Advogado',
    title: 'Estágio Alterado',
    desc: `Mapeado de "${previousStage}" para "${targetStage}". Motivo: ${reason}`
  });
  
  // Refresh views
  if (document.getElementById('kanban-board-container')) {
    renderFullKanbanScreen();
  }
  renderCRMLeadsTable();
  if (typeof renderConversationList === 'function') renderConversationList();
}

function toggleLeadRobot(leadId) {
  const lead = window.mockLeads.find(l => l.id === leadId);
  if (lead) {
    lead.roboAtivo = !lead.roboAtivo;
    lead.timeline.unshift({
      time: new Date().toLocaleString('pt-BR').substring(0,10),
      type: 'Sistema',
      title: lead.roboAtivo ? 'Robô Ativado' : 'Robô Desativado',
      desc: `O robô do chatbot IA foi ${lead.roboAtivo ? 'ativado' : 'desativado'} para este cliente.`
    });
    // Refresh slideout details panel if open
    const slideout = document.getElementById('details-slideout');
    if (slideout && slideout.classList.contains('open') && currentLeadId === leadId) {
      openViewDetailsPanel(leadId);
    }
    // Refresh conversational tabs
    if (typeof renderChatArea === 'function') renderChatArea();
    if (typeof renderConversationList === 'function') renderConversationList();
    if (document.getElementById('kanban-board-container')) {
      renderFullKanbanScreen();
    }
  }
}

function saveCaseSummary(leadId, summary) {
  const lead = window.mockLeads.find(l => l.id === leadId);
  if (lead) {
    lead.promptCustom = summary; // Map case summary to custom prompt context!
    
    // Notify
    const statusText = document.getElementById('summary-save-status');
    if (statusText) {
      statusText.innerText = '✅ Salvo';
      statusText.style.color = 'var(--green-primary)';
      setTimeout(() => {
        statusText.innerText = '';
      }, 1500);
    }
  }
}

function validateDocumentDirect(leadId, docName, isValid) {
  const lead = window.mockLeads.find(l => l.id === leadId);
  if (!lead) return;
  const doc = lead.documentos.find(d => d.name === docName);
  if (doc) {
    doc.status = isValid ? 'Validado' : 'Pendente';
    doc.date = new Date().toLocaleString('pt-BR').substring(0,16);
    
    lead.timeline.unshift({
      time: new Date().toLocaleString('pt-BR').substring(0,10),
      type: 'Advogado',
      title: isValid ? 'Documento Validado' : 'Documento Recusado',
      desc: `O documento ${docName} foi ${isValid ? 'validado' : 'recusado'} na ficha do caso.`
    });
    
    if (!isValid) {
      lead.messages.push({
        sender: 'bot',
        text: `Olá ${lead.name.split(' ')[0]}! O documento "${docName}" enviado está ilegível ou incorreto. Poderia reenviar por favor?`,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        read: true
      });
    }
    
    openViewDetailsPanel(leadId);
    renderDocumentsTable();
    renderBottomTabContent('documentos');
    renderTimeline(lead);
    if (typeof renderChatArea === 'function') renderChatArea();
  }
}

function toggleControladoriaTaskDirect(leadId, taskId) {
  const task = window.mockTasks.find(t => t.id === taskId);
  if (task) {
    task.concluida = !task.concluida;
    openViewDetailsPanel(leadId);
    renderControladoriaTasks();
    renderInteractiveTasks();
  }
}

function openNewTaskForLead(leadId) {
  openEditTaskModal(null);
  // After modal is appended, select this client in the dropdown automatically!
  setTimeout(() => {
    const clientSelect = document.querySelector('#edit-task-client');
    if (clientSelect) {
      clientSelect.value = leadId;
    }
  }, 50);
}

function updateLeadPriority(leadId, priority) {
  const lead = window.mockLeads.find(l => l.id === leadId);
  if (lead) {
    lead.prioridade = priority;
    lead.timeline.unshift({
      time: new Date().toLocaleString('pt-BR').substring(0,10),
      type: 'Advogado',
      title: 'Prioridade Alterada',
      desc: `Prioridade do caso redefinida para: ${priority.toUpperCase()}`
    });
    
    // Refresh table and Kanban if present
    renderCRMLeadsTable();
    if (document.getElementById('kanban-board-container')) {
      renderFullKanbanScreen();
    }
  }
}

function updateLeadTemperature(leadId, temperature) {
  const lead = window.mockLeads.find(l => l.id === leadId);
  if (lead) {
    lead.temperatura = temperature;
    lead.timeline.unshift({
      time: new Date().toLocaleString('pt-BR').substring(0,10),
      type: 'Advogado',
      title: 'Status Alterado',
      desc: `Temperatura da conversa redefinida para: ${temperature.toUpperCase()}`
    });
    
    // Refresh lists
    if (typeof renderConversationList === 'function') renderConversationList();
  }
}

function updateLeadValoresPagos(leadId, amount) {
  const lead = window.mockLeads.find(l => l.id === leadId);
  if (lead) {
    const numeric = parseFloat(amount) || 0;
    lead.valoresPagos = numeric;
    lead.timeline.unshift({
      time: new Date().toLocaleString('pt-BR').substring(0,10),
      type: 'Advogado',
      title: 'Financeiro Atualizado',
      desc: `Honorários pagos atualizados para: R$ ${numeric.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    });
    
    // Refresh table
    renderCRMLeadsTable();
  }
}

function openFollowupModalDirect(leadId) {
  currentLeadId = leadId;
  const modal = document.getElementById('followup-modal');
  if (modal) {
    modal.classList.add('active');
  }
}

function toggleCustomFollowupTime(val) {
  const customGroup = document.getElementById('followup-custom-time-group');
  if (customGroup) {
    customGroup.style.display = val === 'custom' ? 'block' : 'none';
  }
}

window.initKanbanDragAndDrop = initKanbanDragAndDrop;
window.renderFullKanbanScreen = renderFullKanbanScreen;
window.openMoveStageModal = openMoveStageModal;
window.openFollowupModalDirect = openFollowupModalDirect;
window.toggleCustomFollowupTime = toggleCustomFollowupTime;

