// ============================================
// PERSONA — Sistema de personas, urgência máxima, filtros de escala de docs
// PFA Dashboard — Módulo extraído do app.js
// ============================================

window.checkGlobalUrgency = function() {
  const banner = document.getElementById('urgency-banner');
  if (banner) {
    banner.style.display = 'none';
  }
  document.documentElement.style.setProperty('--banner-height', '0px');
  const ac = document.querySelector('.app-container');
  if (ac) {
    ac.style.height = '100dvh';
    ac.style.maxHeight = '100dvh';
    ac.style.marginTop = '0';
  }
};
function runGlobalUrgencyCheck() {
  setTimeout(window.checkGlobalUrgency, 1000);
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', runGlobalUrgencyCheck);
} else {
  runGlobalUrgencyCheck();
}

window.advanceCaseStage = function(stageKey) {
  const lead = getCurrentLead();
  if (lead) {
    // Map stage short keys to official crmEtapas values
    const stageMap = {
      'Triagem': 'Em Triagem',
      'Documentos': 'Documentos Pendentes',
      'Elaboração Defesa': 'Recurso em Andamento',
      'Protocolo': 'Protocolo',
      'Julgamento JARI': 'Recurso em Andamento',
      'Recurso CETRAN': 'Recurso em Andamento',
      'Concluído': 'Fechado'
    };
    lead.etapa = stageMap[stageKey] || stageKey;
    
    // Refresh all views
    renderChatList(document.getElementById('search-conversations')?.value || '');
    renderChatArea();
    renderRightSidebar();
    
    // Automatically switch and re-render document/notes tabs at bottom
    const activeTabEl = document.querySelector('.panel-tab.active');
    const activeTab = activeTabEl ? activeTabEl.getAttribute('data-tab') : 'documentos';
    renderBottomTabContent(activeTab);
    
    // Update CRM Leads Table if it's rendered
    if (typeof renderCRMLeadsTable === 'function') {
      renderCRMLeadsTable();
    }
  }
};

// --- Persona and Urgência Máxima Control logic ---
window.currentPersona = 'atendimento';
window.setPersona = function(personaKey) {
  window.currentPersona = personaKey;
  
  // Highlight active button
  document.querySelectorAll('.persona-pill').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-persona') === personaKey);
  });
  
  // Change input container border color
  const container = document.querySelector('.chat-input-container');
  if (container) {
    container.style.transition = 'border-color 0.3s ease, border-width 0.1s ease';
    const borderColors = {
      'atendimento': '#2563eb',
      'financeiro': '#16a34a',
      'juridico': '#d97706',
      'copiloto': '#7c3aed'
    };
    container.style.borderColor = borderColors[personaKey] || 'var(--border-color)';
    container.style.borderWidth = '2px';
  }
};

window.urgenciaMaximaActive = false;
window.toggleUrgenciaMaxima = function() {
  window.urgenciaMaximaActive = !window.urgenciaMaximaActive;
  
  // Update all buttons with class .btn-urgencia-maxima
  const btns = document.querySelectorAll('.btn-urgencia-maxima');
  btns.forEach(btn => {
    if (window.urgenciaMaximaActive) {
      btn.style.background = '#dc2626';
      btn.style.color = '#fff';
      btn.style.border = '2px solid #fee2e2';
      btn.innerHTML = '🚨 Urgência Ativada!';
    } else {
      btn.style.background = 'linear-gradient(90deg, #7f1d1d, #dc2626)';
      btn.style.color = '#fff';
      btn.style.border = 'none';
      btn.innerHTML = '🚨 Urgência Máxima';
    }
  });

  // Re-render dashboard and lists
  if (document.getElementById('kanban-board-container')) {
    renderFullKanbanScreen();
  }
  if (document.getElementById('crm-leads-table-body')) {
    renderCRMLeadsTable();
  }
};

// --- Gestor de Documentos: Central de Controle de Escala ---
window.docsFilters = {
  deadline: 'all',
  stage: 'all',
  infraction: 'all'
};
window.docsAutocompleteIndex = -1;

window.initDocsScaleControl = function() {
  const searchInput = document.getElementById('docs-client-search');
  const autocompleteDiv = document.getElementById('docs-client-autocomplete');
  if (!searchInput || !autocompleteDiv) return;

  // Render advanced filter pills click handlers
  const pills = document.querySelectorAll('.filter-pill');
  pills.forEach(pill => {
    pill.onclick = () => {
      const type = pill.getAttribute('data-filter-type');
      const val = pill.getAttribute('data-value');
      
      // Deactivate siblings
      document.querySelectorAll(`.filter-pill[data-filter-type="${type}"]`).forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      
      window.docsFilters[type] = val;
      
      // Clear search input and update active table immediately
      searchInput.value = '';
      autocompleteDiv.style.display = 'none';
      triggerDocsFiltering();
    };
  });

  searchInput.oninput = (e) => {
    const val = e.target.value.toLowerCase().trim();
    if (!val) {
      autocompleteDiv.style.display = 'none';
      return;
    }
    
    // Get matching clients from filtered memory
    const filteredLeads = getFilteredDocsLeads().filter(l => {
      const nameMatch = l.name.toLowerCase().includes(val);
      const placaMatch = (l.placa || `BRA-3Y2${l.id}`).toLowerCase().includes(val);
      const cpfMatch = (l.cpf || '').includes(val);
      const cnhMatch = (l.cnh || `992837411${l.id}`).toLowerCase().includes(val);
      return nameMatch || placaMatch || cpfMatch || cnhMatch;
    });

    if (filteredLeads.length === 0) {
      autocompleteDiv.innerHTML = '<div class="autocomplete-item" style="color:var(--text-secondary); cursor:default;">Nenhum motorista encontrado</div>';
    } else {
      autocompleteDiv.innerHTML = filteredLeads.map(l => {
        const placa = l.placa || `BRA-3Y2${l.id}`;
        const cnh = l.cnh || `992837411${l.id}`;
        return `<div class="autocomplete-item" onclick="selectDocsClient(${l.id})">
          <strong>👤 ${l.name}</strong> - 🚗 ${placa} - 🪪 CNH: ${cnh} - (${l.tipoCaso})
        </div>`;
      }).join('');
    }
    autocompleteDiv.style.display = 'block';
  };

  // Close autocomplete on click outside
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !autocompleteDiv.contains(e.target)) {
      autocompleteDiv.style.display = 'none';
    }
  });
};

window.selectDocsClient = function(leadId) {
  currentLeadId = leadId;
  const lead = window.mockLeads.find(l => l.id === leadId);
  const searchInput = document.getElementById('docs-client-search');
  if (searchInput && lead) {
    searchInput.value = `${lead.name} (${lead.tipoCaso})`;
  }
  document.getElementById('docs-client-autocomplete').style.display = 'none';
  
  activeDocumentId = null;
  renderDocumentsTable();
  renderBottomTabContent('documentos');
};

window.getFilteredDocsLeads = function() {
  let list = window.mockLeads;
  
  // 1. Filter by deadline
  const today = new Date(); today.setHours(0,0,0,0);
  if (window.docsFilters.deadline === 'critical') {
    list = list.filter(l => {
      const task = window.mockTasks && window.mockTasks.find(t => t.leadId === l.id && !t.concluida);
      if (!task) return false;
      const iso = formatDateToISO(task.prazo);
      if (!iso) return false;
      const diff = Math.ceil((new Date(iso.substring(0,10)) - today) / 86400000);
      return diff <= 2; // <48h
    });
  } else if (window.docsFilters.deadline === 'warning') {
    list = list.filter(l => {
      const task = window.mockTasks && window.mockTasks.find(t => t.leadId === l.id && !t.concluida);
      if (!task) return false;
      const iso = formatDateToISO(task.prazo);
      if (!iso) return false;
      const diff = Math.ceil((new Date(iso.substring(0,10)) - today) / 86400000);
      return diff > 2 && diff <= 7; // < 7 days
    });
  }

  // 2. Filter by stage
  if (window.docsFilters.stage !== 'all') {
    const stageMap = {
      'Triagem': 'Em Triagem',
      'Defesa Prévia': 'Recurso em Andamento',
      'Recurso JARI/CETRAN': 'Recurso em Andamento'
    };
    const targetStage = stageMap[window.docsFilters.stage];
    list = list.filter(l => l.etapa.toLowerCase().includes(window.docsFilters.stage.toLowerCase()) || (targetStage && l.etapa.toLowerCase() === targetStage.toLowerCase()));
  }

  // 3. Filter by infraction
  if (window.docsFilters.infraction !== 'all') {
    list = list.filter(l => l.tipoCaso.toLowerCase().includes(window.docsFilters.infraction.toLowerCase()));
  }

  return list;
};

window.updateDocsFilterCount = function() {
  const filtered = getFilteredDocsLeads();
  const countEl = document.getElementById('docs-filter-count');
  if (countEl) {
    countEl.innerText = `${filtered.length} motorista${filtered.length === 1 ? '' : 's'}`;
  }
};

window.triggerDocsFiltering = function() {
  const filtered = getFilteredDocsLeads();
  updateDocsFilterCount();
  // Auto-select first matching client if current active is no longer in filtered list
  if (filtered.length > 0 && !filtered.find(l => l.id === currentLeadId)) {
    selectDocsClient(filtered[0].id);
  } else if (filtered.length === 0) {
    const searchInput = document.getElementById('docs-client-search');
    if (searchInput) searchInput.value = 'Nenhum motorista filtrado';
    activeDocumentId = null;
    const tableBody = document.getElementById('docs-table-body');
    if (tableBody) tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Use os filtros acima para selecionar outro motorista.</td></tr>';
  }
};

window.showDocumentPreviewFromChat = function(docName) {
  const lead = getCurrentLead();
  const doc = lead.documentos.find(d => d.name === docName);
  if (doc) {
    activeDocumentId = doc.name;
    
    // Update PDF preview container right panel
    if (typeof updateDocumentPreview === 'function') {
      updateDocumentPreview(doc);
    }
    
    // Toggle right side view tab to 'Resumo' or documents
    const summaryTab = document.querySelector('[data-tab="resumo"]');
    if (summaryTab) summaryTab.click();

    // Show toast notification
    if (typeof showToast === 'function') {
      showToast(`Visualizando: ${docName}`, 'info');
    }
  }
};

window.simulateClientDocUpload = function(docName) {
  const lead = getCurrentLead();
  const doc = lead.documentos.find(d => d.name === docName);
  if (doc) {
    // 1. Update document status to 'Recebido'
    doc.status = 'Recebido';
    doc.date = new Date().toLocaleString('pt-BR').substring(0,16);
    doc.author = lead.name;

    // 2. Add simulation message in chat
    lead.messages.push({
      sender: 'client',
      text: `Enviei o documento solicitado: *${docName}* 📲`,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      read: true
    });

    // 3. Add timeline entry
    lead.timeline.unshift({
      time: new Date().toLocaleString('pt-BR').substring(0,10),
      type: 'Sistema',
      title: 'Documento Recebido',
      desc: `Documento "${docName}" enviado pelo cliente via WhatsApp.`
    });

    // 4. Trigger UI Updates
    renderChatArea();
    renderBottomTabContent('documentos');
    renderTimeline(lead);
    
    if (typeof showToast === 'function') {
      showToast(`Simulação: Documento "${docName}" recebido!`, 'success');
    }
  }
};



