// ============================================
// CRM — Sistema CRM interativo completo
// PFA Dashboard — Módulo extraído do app.js
// ============================================

// ==========================================
// CRM INTERACTIVE SYSTEM
// ==========================================
function initCRMInteractive() {
  // Render table when CRM screen is shown
  const crmNavItem = document.querySelector('[data-screen="crm"]');
  if (crmNavItem) {
    crmNavItem.addEventListener('click', () => {
      setTimeout(renderCRMLeadsTable, 50);
      setTimeout(renderInteractiveTasks, 50);
    });
  }
  
  // New Lead button
  const newLeadBtn = document.getElementById('btn-new-lead');
  if (newLeadBtn) {
    newLeadBtn.addEventListener('click', () => openEditLeadModal(null));
  }
  
  // Search box
  const searchBox = document.getElementById('crm-search-input');
  if (searchBox) {
    searchBox.addEventListener('input', (e) => filterCRMTable(e.target.value));
  }
  
  // Close modal handlers 📄 IMPORTANT: #followup-modal is permanent, only toggle class.
  // Dynamic CRM/Kanban modals should be removed from DOM.
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      if (e.target.id === 'followup-modal' || e.target.id === 'task-calendar-modal' || e.target.id === 'client-portal-modal') {
        // Permanent modal 📄 just hide via class toggle
        e.target.classList.remove('active');
      } else {
        // Dynamic modal 📄 remove from DOM
        e.target.remove();
      }
    }
  });
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      // Close permanent modals if active
      ['followup-modal', 'task-calendar-modal', 'client-portal-modal'].forEach(id => {
        const m = document.getElementById(id);
        if (m && m.classList.contains('active')) {
          m.classList.remove('active');
        }
      });
      // Remove any other dynamic modal-overlay
      document.querySelectorAll('.modal-overlay:not(#followup-modal):not(#task-calendar-modal):not(#client-portal-modal)').forEach(m => m.remove());
      // Close any open slideout panels
      const slideout = document.querySelector('.details-slideout.open');
      if (slideout) slideout.classList.remove('open');
    }
  });
}

function renderCRMLeadsTable() {
  const container = document.getElementById('crm-leads-table-body');
  if (!container) return;
  
  container.innerHTML = '';
  
  let leadsToRender = window.mockLeads;
  if (window.urgenciaMaximaActive) {
    leadsToRender = leadsToRender.filter(l => l.prioridade === 'alta' || l.apreendido || (l.location && l.location.includes('Apreendido')));
  }

  leadsToRender.forEach(lead => {
    const lawyer = window.mockLawyers.find(l => l.id === lead.responsavelId) || window.mockLawyers[0];
    const etapaClass = getEtapaClass(lead.etapa);
    const tempIcon = lead.temperatura === 'quente' ? '📋' : lead.temperatura === 'morno' ? 's' : '"️';
    const roboText = lead.roboAtivo ? 'Y- IA' : '✅ Man';
    
    const ultContatoDias = Math.abs((lead.id * 7) % 15);
    const ultContatoHTML = `<span style="font-size:9px; font-weight:700; background:#fef3c7; color:#d97706; border:1px solid #fde68a; padding:1px 4px; border-radius:3px; white-space:nowrap;">⏳ ${ultContatoDias}d</span>`;
    
    const statusFin = lead.valoresPagos >= lead.valorCausa * 0.4 ? 'Contrato Ativo' : 'Parcela Atrasada';
    const statusFinCls = statusFin === 'Contrato Ativo' ? 'background:#dcfce7; color:#15803d; border:1px solid #bbf7d0;' : 'background:#fee2e2; color:#b91c1c; border:1px solid #fca5a5;';
    const statusFinHTML = `<span style="font-size:9px; font-weight:700; ${statusFinCls} padding:1px 4px; border-radius:3px; white-space:nowrap;">✅ ${statusFin}</span>`;
    
    const apreendidoBadge = lead.apreendido ? `<span style="font-size:9px; font-weight:700; background:#fef2f2; color:#dc2626; border:1px solid #fca5a5; padding:1px 4px; border-radius:3px; white-space:nowrap;">🚨 Apreendido</span>` : '';

    const row = document.createElement('tr');
    row.style.cursor = 'pointer';
    row.addEventListener('click', (e) => {
      if (e.target.closest('.table-actions')) return;
      openDetailedClientModal(lead.id);
    });

    row.innerHTML = `
      <td>
        <div class="table-lead-name">
          <div class="avatar avatar-sm">${getInitials(lead.name)}</div>
          <div>
            <strong>${lead.name} ${tempIcon}</strong>
            <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap; margin-top:2px;">
              <span class="table-lead-phone">${lead.phone}</span>
              <span style="font-size:9px; font-weight:700; padding:1px 4px; border-radius:3px; ${lead.roboAtivo ? 'background:#dcfce7; color:#166534;' : 'background:#f3f4f6; color:#374151;'}">${roboText}</span>
              ${statusFinHTML}
              ${ultContatoHTML}
              ${apreendidoBadge}
            </div>
          </div>
        </div>
      </td>
      <td><span class="table-caso-badge">${lead.tipoCaso}</span></td>
      <td><span class="etapa-badge ${etapaClass}">${lead.etapa}</span></td>
      <td>
        <div class="table-responsavel">
          <div class="avatar avatar-xs">${lawyer.initials}</div>
          <span>${lawyer.name.split(' ').slice(0,2).join(' ')}</span>
        </div>
      </td>
      <td class="table-valor">R$ ${lead.valorCausa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      <td>
        <div class="table-actions" onclick="event.stopPropagation()">
          <button class="btn btn-outline-yellow" style="padding:4px 8px; font-size:10px; font-weight:700; border-radius:4px; display:inline-flex; align-items:center; gap:3px;" onclick="openDetailedClientModal(${lead.id})">
            📂 Abrir Ficha
          </button>
          <button class="table-action-btn delete" title="Excluir" onclick="deleteLeadWithConfirmation(${lead.id})">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
        </div>
      </td>
    `;
    container.appendChild(row);
  });
}

function getEtapaClass(etapa) {
  const map = {
    'Novo Lead': 'etapa-novo',
    'Em Triagem': 'etapa-triagem',
    'Documentos Pendentes': 'etapa-docs',
    'Assinatura': 'etapa-recurso',
    'Protocolo': 'etapa-recurso',
    'Recurso em Andamento': 'etapa-recurso',
    'Audiência / Retorno': 'etapa-humano',
    'Fechado': 'etapa-fechado'
  };
  return map[etapa] || 'etapa-novo';
}

function filterCRMTable(query) {
  const rows = document.querySelectorAll('#crm-leads-table-body tr');
  const q = query.toLowerCase();
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(q) ? '' : 'none';
  });
}

function openEditLeadModal(leadId) {
  const isNew = leadId === null;
  const lead = isNew ? { id: null, name: '', phone: '', email: '', cpf: '', endereco: '', location: '', etapa: 'Novo Lead', tipoCaso: 'Lei Seca', processo: '', dataInfra: '', autuador: 'Detran/SP', valorCausa: 0, responsavelId: 1, roboAtivo: true, proximaAcao: '', prazoAcao: '', promptCustom: '', messages: [], documentos: [], timeline: [] } : window.mockLeads.find(l => l.id === leadId);
  if (!lead) return;
  
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.innerHTML = `
    <div class="edit-lead-modal">
      <div class="modal-header">
        <h3>${isNew ? 'o Novo Lead' : 'o️ Editar Lead'}</h3>
        <button class="modal-close-btn" onclick="this.closest('.modal-overlay').remove()">&times;</button>
      </div>
      <div class="modal-tabs">
        <div class="modal-tab active" data-mtab="dados">Dados Pessoais</div>
        <div class="modal-tab" data-mtab="processo">Processo</div>
        <div class="modal-tab" data-mtab="responsavel">Responsável</div>
      </div>
      <div class="modal-body">
        <!-- Tab: Dados Pessoais -->
        <div class="mtab-content active" id="mtab-dados">
          <div class="form-grid">
            <div class="form-group">
              <label>Nome Completo</label>
              <input type="text" id="edit-name" value="${lead.name}" placeholder="Nome do cliente">
            </div>
            <div class="form-group">
              <label>CPF</label>
              <input type="text" id="edit-cpf" value="${lead.cpf || ''}" placeholder="000.000.000-00">
            </div>
            <div class="form-group">
              <label>Telefone</label>
              <input type="text" id="edit-phone" value="${lead.phone}" placeholder="(00) 00000-0000">
            </div>
            <div class="form-group">
              <label>E-mail</label>
              <input type="email" id="edit-email" value="${lead.email}" placeholder="email@exemplo.com">
            </div>
            <div class="form-group full-width">
              <label>Endereço</label>
              <input type="text" id="edit-endereco" value="${lead.endereco || ''}" placeholder="Rua, número - Bairro">
            </div>
            <div class="form-group">
              <label>Cidade</label>
              <input type="text" id="edit-location" value="${lead.location}" placeholder="Cidade - UF">
            </div>
          </div>
        </div>
        <!-- Tab: Processo -->
        <div class="mtab-content" id="mtab-processo">
          <div class="form-grid">
            <div class="form-group">
              <label>Tipo de Caso</label>
              <select id="edit-tipocaso">
                ${window.tiposCaso.map(t => `<option ${t === lead.tipoCaso ? 'selected' : ''}>${t}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Etapa no CRM</label>
              <select id="edit-etapa">
                ${window.crmEtapas.map(e => `<option ${e === lead.etapa ? 'selected' : ''}>${e}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Nº do Processo</label>
              <input type="text" id="edit-processo" value="${lead.processo}" placeholder="2024/0000">
            </div>
            <div class="form-group">
              <label>Data da Infração</label>
              <input type="date" id="edit-data-infra" value="${formatDateToISO(lead.dataInfra)}">
            </div>
            <div class="form-group">
              <label>"rgão Autuador</label>
              <select id="edit-autuador">
                ${window.orgaosAutuadores.map(o => `<option ${o === lead.autuador ? 'selected' : ''}>${o}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Valor da Causa (R$)</label>
              <input type="number" id="edit-valor" value="${lead.valorCausa}" step="0.01" placeholder="0,00">
            </div>
          </div>
        </div>
        <!-- Tab: Responsável -->
        <div class="mtab-content" id="mtab-responsavel">
          <div class="form-group">
            <label>Advogado Responsável</label>
            <div class="lawyer-picker" id="lawyer-picker">
              ${window.mockLawyers.map(l => `
                <div class="lawyer-pick-card ${l.id === lead.responsavelId ? 'selected' : ''}" data-lawyer-id="${l.id}">
                  <div class="avatar">${l.initials}</div>
                  <div class="lawyer-pick-info">
                    <strong>${l.name}</strong>
                    <span>${l.especialidade} ? ${l.casosAtivos} casos</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="form-grid" style="margin-top: 16px;">
            <div class="form-group full-width">
              <label>Próxima Ação</label>
              <input type="text" id="edit-proxima-acao" value="${lead.proximaAcao}" placeholder="Descreva a próxima ação...">
            </div>
            <div class="form-group">
              <label>Prazo da Ação</label>
              <input type="datetime-local" id="edit-prazo" value="${formatDateToISO(lead.prazoAcao)}">
            </div>
            <div class="form-group">
              <label>Robô IA</label>
              <select id="edit-robo">
                <option ${lead.roboAtivo ? 'selected' : ''} value="true">Ativado</option>
                <option ${!lead.roboAtivo ? 'selected' : ''} value="false">Desativado</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline-yellow" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
        <button class="btn btn-yellow" onclick="saveLeadChanges(${lead.id}, this)">✅ ${isNew ? 'Criar Lead' : 'Salvar Alterações'}</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // Prevent browser auto-scrolling to other fields by focusing the first field
  setTimeout(() => {
    const input = overlay.querySelector('#edit-name');
    if (input) input.focus();
  }, 50);
  
  // Modal tab switching
  overlay.querySelectorAll('.modal-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-mtab');
      overlay.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
      overlay.querySelectorAll('.mtab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      overlay.querySelector(`#mtab-${target}`).classList.add('active');
    });
  });
  
  // Lawyer picker click
  overlay.querySelectorAll('.lawyer-pick-card').forEach(card => {
    card.addEventListener('click', () => {
      overlay.querySelectorAll('.lawyer-pick-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
    });
  });
}

function saveLeadChanges(leadId, button) {
  const overlay = button ? button.closest('.modal-overlay') : document.querySelector('.modal-overlay.active');
  if (!overlay) return;
  
  const selectedLawyer = overlay.querySelector('.lawyer-pick-card.selected');
  const responsavelId = selectedLawyer ? parseInt(selectedLawyer.getAttribute('data-lawyer-id')) : 1;
  
  const data = {
    name: overlay.querySelector('#edit-name').value,
    cpf: overlay.querySelector('#edit-cpf').value,
    phone: overlay.querySelector('#edit-phone').value,
    email: overlay.querySelector('#edit-email').value,
    endereco: overlay.querySelector('#edit-endereco').value,
    location: overlay.querySelector('#edit-location').value,
    tipoCaso: overlay.querySelector('#edit-tipocaso').value,
    etapa: overlay.querySelector('#edit-etapa').value,
    processo: overlay.querySelector('#edit-processo').value,
    dataInfra: formatDateToBR(overlay.querySelector('#edit-data-infra').value),
    autuador: overlay.querySelector('#edit-autuador').value,
    valorCausa: parseFloat(overlay.querySelector('#edit-valor').value) || 0,
    responsavelId: responsavelId,
    proximaAcao: overlay.querySelector('#edit-proxima-acao').value,
    prazoAcao: formatDateToBR(overlay.querySelector('#edit-prazo').value),
    roboAtivo: overlay.querySelector('#edit-robo').value === 'true'
  };
  
  if (leadId === null) {
    // Create new lead
    const newId = Math.max(...window.mockLeads.map(l => l.id)) + 1;
    window.mockLeads.push({
      id: newId,
      ...data,
      promptCustom: '',
      messages: [],
      documentos: [],
      timeline: [{ time: new Date().toLocaleString('pt-BR').substring(0,14), type: 'Sistema', title: 'Criação', desc: 'Lead criado manualmente pelo administrador' }]
    });
  } else {
    // Update existing
    const lead = window.mockLeads.find(l => l.id === leadId);
    if (lead) {
      Object.assign(lead, data);
      lead.timeline.unshift({ time: new Date().toLocaleString('pt-BR').substring(0,14), type: 'Advogado', title: 'Edição', desc: 'Dados do lead atualizados manualmente' });
    }
  }
  
  overlay.remove();
  renderCRMLeadsTable();
  if (typeof renderConversationList === 'function') renderConversationList();
}

function deleteLeadWithConfirmation(leadId) {
  const lead = window.mockLeads.find(l => l.id === leadId);
  if (!lead) return;
  
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.innerHTML = `
    <div class="delete-confirm-modal">
      <div class="delete-confirm-icon">Y-'️</div>
      <h3>Excluir Lead</h3>
      <p>Tem certeza que deseja excluir <strong>${lead.name}</strong>?</p>
      <p class="delete-warning">Esta ação não pode ser desfeita. Todos os dados, documentos e histórico serão removidos.</p>
      <div class="delete-confirm-actions">
        <button class="btn btn-outline-yellow" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
        <button class="btn btn-danger" onclick="confirmDeleteLead(${leadId})">Excluir Permanentemente</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function confirmDeleteLead(leadId) {
  window.mockLeads = window.mockLeads.filter(l => l.id !== leadId);
  document.querySelector('.modal-overlay').remove();
  renderCRMLeadsTable();
}

function openViewDetailsPanel(leadId) {
  const lead = window.mockLeads.find(l => l.id === leadId);
  if (!lead) return;
  const lawyer = window.mockLawyers.find(l => l.id === lead.responsavelId) || window.mockLawyers[0];
  
  // Remove existing slideout
  const existing = document.querySelector('.details-slideout');
  if (existing) existing.remove();
  
  const slideout = document.createElement('div');
  slideout.className = 'details-slideout';
  slideout.innerHTML = `
    <div class="slideout-header" style="background:var(--bg-secondary); border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center; padding:15px 20px;">
      <h3 style="margin:0; font-size:16px; font-weight:600; color:var(--text-primary);">📋< Ficha Completa do Caso</h3>
      <button class="modal-close-btn" onclick="this.closest('.details-slideout').classList.remove('open')" style="background:none; border:none; color:var(--text-secondary); font-size:20px; cursor:pointer;">&times;</button>
    </div>
    <div class="slideout-body" style="padding:20px; overflow-y:auto; height:calc(100% - 60px);">
      
      <div class="slideout-profile" style="text-align:center; padding-bottom:15px; border-bottom:1px solid var(--border-color); margin-bottom:15px;">
        <div class="avatar avatar-lg" style="margin:0 auto 10px; width:60px; height:60px; font-size:20px;">${getInitials(lead.name)}</div>
        <h3 style="margin:0; font-size:16px; font-weight:600; color:var(--text-primary);">${lead.name}</h3>
        
        <!-- CRM Stage Dropdown Selector -->
        <div style="margin-top:10px; display:flex; align-items:center; justify-content:center; gap:8px;">
          <span style="font-size:11px; font-weight:700; color:var(--text-secondary); text-transform:uppercase;">Etapa:</span>
          <select onchange="moveLeadStage(${lead.id}, this.value, 'Atualizado na Ficha do Caso')" style="padding:4px 8px; font-size:12px; border-radius:6px; background:var(--bg-tertiary); color:var(--text-primary); border:1px solid var(--border-color); cursor:pointer;">
            ${window.crmEtapas.map(e => `<option value="${e}" ${e === lead.etapa ? 'selected' : ''}>${e}</option>`).join('')}
          </select>
        </div>

        <!-- Temperature Dropdown Selector -->
        <div style="margin-top:8px; display:flex; align-items:center; justify-content:center; gap:8px;">
          <span style="font-size:11px; font-weight:700; color:var(--text-secondary); text-transform:uppercase;">Status/Resp:</span>
          <select onchange="updateLeadTemperature(${lead.id}, this.value)" style="padding:4px 8px; font-size:12px; border-radius:6px; background:var(--bg-tertiary); color:var(--text-primary); border:1px solid var(--border-color); cursor:pointer;">
            <option value="quente" ${lead.temperatura === 'quente' ? 'selected' : ''}>📋 Lead Quente</option>
            <option value="morno" ${lead.temperatura === 'morno' ? 'selected' : ''}>🌡️ Lead Morno</option>
            <option value="frio" ${lead.temperatura === 'frio' ? 'selected' : ''}>"️ Lead Frio</option>
          </select>
        </div>

        <!-- Robot AI chatbot Switch -->
        <div style="margin-top:12px; display:flex; align-items:center; justify-content:space-between; padding:8px 12px; background:var(--bg-tertiary); border-radius:8px; border:1px solid var(--border-color);">
          <span style="font-size:11px; font-weight:600; color:var(--text-secondary);">Robô IA Automação:</span>
          <button class="btn ${lead.roboAtivo ? 'btn-yellow' : 'btn-outline-yellow'}" onclick="toggleLeadRobot(${lead.id})" style="font-size:10px; padding:3px 10px; min-width:85px; font-weight:600; text-transform:uppercase;">
            ${lead.roboAtivo ? '🤖 Ativado' : '📋 Desativado'}
          </button>
        </div>
      </div>
      
      <!-- Resumo do Caso (promptCustom) editable text area -->
      <div class="slideout-section" style="margin-bottom:15px;">
        <div class="slideout-section-title" style="font-size:12px; font-weight:700; color:var(--text-secondary); text-transform:uppercase; margin-bottom:8px; display:flex; justify-content:space-between;">
          Resumo Jurídico & Observações
          <span id="summary-save-status" style="font-size:10px; font-weight:normal; text-transform:none;"></span>
        </div>
        <textarea oninput="saveCaseSummary(${lead.id}, this.value)" style="width:100%; height:90px; padding:8px; font-size:12px; border-radius:6px; background:var(--bg-tertiary); color:var(--text-primary); border:1px solid var(--border-color); resize:vertical;" placeholder="Escreva observações e o resumo do caso. Os advogados e o robô usarão isso como contexto...">${lead.promptCustom || ''}</textarea>
      </div>

      <div class="slideout-section" style="margin-bottom:15px;">
        <div class="slideout-section-title" style="font-size:12px; font-weight:700; color:var(--text-secondary); text-transform:uppercase; margin-bottom:8px;">Contato do Cliente</div>
        <div class="slideout-info-row" style="display:flex; justify-content:space-between; font-size:12px; padding:4px 0;"><span>📋z Telefone</span><span>${lead.phone}</span></div>
        <div class="slideout-info-row" style="display:flex; justify-content:space-between; font-size:12px; padding:4px 0;"><span>📋 E-mail</span><span>${lead.email}</span></div>
        <div class="slideout-info-row" style="display:flex; justify-content:space-between; font-size:12px; padding:4px 0;"><span>📋 Cidade</span><span>${lead.location}</span></div>
        <div class="slideout-info-row" style="display:flex; justify-content:space-between; font-size:12px; padding:4px 0;"><span>Y Endereço</span><span>${lead.endereco || 'Não cadastrado'}</span></div>
        <div class="slideout-info-row" style="display:flex; justify-content:space-between; font-size:12px; padding:4px 0;"><span>Y📄 CPF</span><span>${lead.cpf || 'Não cadastrado'}</span></div>
      </div>
      
      <div class="slideout-section" style="margin-bottom:15px;">
        <div class="slideout-section-title" style="font-size:12px; font-weight:700; color:var(--text-secondary); text-transform:uppercase; margin-bottom:8px;">Informações do Processo</div>
        <div class="slideout-info-row" style="display:flex; justify-content:space-between; align-items:center; font-size:12px; padding:4px 0;">
          <span>Prioridade</span>
          <select onchange="updateLeadPriority(${lead.id}, this.value)" style="padding:3px 6px; font-size:12px; background:var(--bg-tertiary); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; cursor:pointer;">
            <option value="alta" ${lead.prioridade === 'alta' ? 'selected' : ''}>📋 Alta</option>
            <option value="media" ${lead.prioridade === 'media' ? 'selected' : ''}>🟡 Média</option>
            <option value="baixa" ${lead.prioridade === 'baixa' ? 'selected' : ''}>🟢 Baixa</option>
          </select>
        </div>
        <div class="slideout-info-row" style="display:flex; justify-content:space-between; font-size:12px; padding:4px 0;"><span>Tipo</span><strong>${lead.tipoCaso}</strong></div>
        <div class="slideout-info-row" style="display:flex; justify-content:space-between; font-size:12px; padding:4px 0;"><span>Nº Processo</span><strong>${lead.processo}</strong></div>
        <div class="slideout-info-row" style="display:flex; justify-content:space-between; font-size:12px; padding:4px 0;"><span>"rgão</span><strong>${lead.autuador}</strong></div>
        <div class="slideout-info-row" style="display:flex; justify-content:space-between; font-size:12px; padding:4px 0;"><span>Data Infração</span><strong>${lead.dataInfra}</strong></div>
        <div class="slideout-info-row" style="display:flex; justify-content:space-between; font-size:12px; padding:4px 0;"><span>Valor da Causa</span><strong style="color:var(--gold-primary)">R$ ${lead.valorCausa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></div>
        
        <div class="slideout-info-row" style="display:flex; flex-direction:column; gap:4px; font-size:12px; padding:6px 0; border-top:1px dashed var(--border-color); margin-top:4px;">
          <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
            <span>Gerar Cobrança (PIX/Cartão):</span>
            <button class="btn btn-outline-yellow" onclick="simulatePaymentLink(${lead.id})" style="font-size:10.5px; padding:3px 8px; font-weight:700;">✅ Cobrar PIX/Cartão</button>
          </div>
        </div>
      </div>

      <!-- SE?fO FINANCEIRA COMPLETA COM CÁLCULO -->
      <div class="slideout-section" style="margin-bottom:15px; background:var(--bg-tertiary); padding:12px; border-radius:8px; border:1px solid var(--border-color);">
        <div class="slideout-section-title" style="font-size:11.5px; font-weight:700; color:var(--text-secondary); text-transform:uppercase; margin-bottom:10px;">✅ Controle Financeiro & Honorários</div>
        
        <div style="display:flex; flex-direction:column; gap:8px; font-size:12px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span>Honorários Totais</span>
            <div>
              <span style="font-weight:600;margin-right:2px;">R$</span>
              <input type="number" id="ficha-fin-totais" value="${lead.valorHonorarios || (lead.valorCausa * 0.3) || 1500}" step="0.01" style="width:110px; padding:3px 6px; font-size:12px; background:var(--bg-secondary); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; text-align:right;" oninput="calculateFinanceFicha(${lead.id})">
            </div>
          </div>
          
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span>Valor Pago</span>
            <div>
              <span style="font-weight:600;margin-right:2px;">R$</span>
              <input type="number" id="ficha-fin-pago" value="${lead.valoresPagos || 0}" step="0.01" style="width:110px; padding:3px 6px; font-size:12px; background:var(--bg-secondary); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; text-align:right;" oninput="calculateFinanceFicha(${lead.id})">
            </div>
          </div>
          
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span>Restante</span>
            <div>
              <span style="font-weight:600;margin-right:2px;">R$</span>
              <input type="number" id="ficha-fin-restante" value="${Math.max(0, (lead.valorHonorarios || (lead.valorCausa * 0.3) || 1500) - (lead.valoresPagos || 0))}" style="width:110px; padding:3px 6px; font-size:12px; background:var(--bg-secondary); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; text-align:right; cursor:not-allowed;" readonly>
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span>Prazo de Vencimento</span>
            <input type="date" id="ficha-fin-vencimento" value="${lead.prazoPagamento || ''}" style="width:130px; padding:3px 6px; font-size:12px; background:var(--bg-secondary); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span>Status</span>
            <select id="ficha-fin-status" style="width:130px; padding:3px 6px; font-size:12px; background:var(--bg-secondary); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; cursor:pointer;">
              <option value="pendente" ${lead.statusPagamento === 'pendente' || !lead.statusPagamento ? 'selected' : ''}>Pendente 📋</option>
              <option value="parcial" ${lead.statusPagamento === 'parcial' ? 'selected' : ''}>Parcial 🔄</option>
              <option value="pago" ${lead.statusPagamento === 'pago' ? 'selected' : ''}>Pago Total ✅</option>
            </select>
          </div>

          <button class="btn btn-yellow" onclick="saveFinanceFicha(${lead.id}, this)" style="width:100%; font-size:11px; padding:6px 0; margin-top:4px; font-weight:700;">✅ Salvar Financeiro do Caso</button>
        </div>
      </div>
      
      <div class="slideout-section" style="margin-bottom:15px;">
        <div class="slideout-section-title" style="font-size:12px; font-weight:700; color:var(--text-secondary); text-transform:uppercase; margin-bottom:8px;">Responsável Pelo Atendimento</div>
        <div class="slideout-lawyer" style="display:flex; align-items:center; gap:10px; background:var(--bg-tertiary); padding:8px; border-radius:6px;">
          <div class="avatar" style="width:32px; height:32px; font-size:12px;">${lawyer.initials}</div>
          <div>
            <strong style="font-size:12px; color:var(--text-primary);">${lawyer.name}</strong>
            <div style="font-size:11px;color:var(--text-secondary)">${lawyer.especialidade}</div>
          </div>
        </div>
      </div>

      <!-- Follow-up scheduler shortcut -->
      <div class="slideout-section" style="margin-bottom:15px;">
        <div class="slideout-section-title" style="font-size:12px; font-weight:700; color:var(--text-secondary); text-transform:uppercase; margin-bottom:8px;">Agendamento de Follow-up</div>
        <button class="btn btn-outline-orange" onclick="openFollowupModalDirect(${lead.id})" style="width:100%; display:flex; align-items:center; justify-content:center; gap:8px; font-size:12px; padding:8px 0; border:1px dashed var(--orange-primary); color:var(--orange-primary); border-radius:6px; cursor:pointer; background:transparent;">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clock"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          📋. Agendar Mensagem IA / Follow-up
        </button>
      </div>

      <!-- Follow-up visual schedule checklist -->
      <div class="slideout-section" style="margin-bottom:15px; background:var(--bg-tertiary); padding:12px; border-radius:8px; border:1px solid var(--border-color);">
        <div class="slideout-section-title" style="font-size:11.5px; font-weight:700; color:var(--text-secondary); text-transform:uppercase; margin-bottom:8px;">Cronograma de Lembretes IA</div>
        ${(() => {
          if (!lead.followups) {
            lead.followups = [
              { time: '14/05/2024 10:00', type: 'Cobrar Procuração', status: 'Agendado' }
            ];
          }
          return lead.followups.map(f => `
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; padding:6px 0; border-bottom:1px dashed var(--border-color);">
              <div>
                <span style="font-weight:600; color:var(--text-primary);">📋. ${f.time}</span><br>
                <span style="font-size:9.5px; color:var(--text-secondary);">${f.type}</span>
              </div>
              <span style="font-size:9px; font-weight:700; padding:2px 5px; border-radius:4px; ${f.status === 'Agendado' ? 'background:#fef3c7; color:#d97706;' : 'background:#dcfce7; color:#15803d;'}">${f.status}</span>
            </div>
          `).join('') || '<div style="font-size:11px;color:var(--text-secondary)">Nenhum follow-up pendente.</div>';
        })()}
      </div>
      
      <!-- Interactive Documents validation list -->
      <div class="slideout-section" style="margin-bottom:15px;">
        <div class="slideout-section-title" style="font-size:12px; font-weight:700; color:var(--text-secondary); text-transform:uppercase; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
          Documentações Anexadas (${lead.documentos.length})
          <button class="btn btn-outline-yellow" onclick="openRequestDocModal(${lead.id})" style="font-size:10px; padding:2px 6px;">Solicitar Novo</button>
        </div>
        ${lead.documentos.length > 0 ? lead.documentos.map(doc => `
          <div class="slideout-doc-row" style="display:flex; justify-content:space-between; align-items:center; padding: 6px 0; border-bottom:1px solid var(--border-color);">
            <div>
              <span style="font-size:12px; font-weight:600; color:var(--text-primary);">📋" ${doc.name}</span><br>
              <span style="font-size:10px; color:var(--text-secondary);">${doc.size}</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="slideout-doc-status ${doc.status === 'Recebido' ? 'received' : doc.status === 'Validado' ? 'validated' : 'pending'}" style="font-size:9px; padding:2px 5px; border-radius:4px;">${doc.status}</span>
              ${doc.status !== 'Validado' ? `
                <button onclick="validateDocumentDirect(${lead.id}, '${doc.name}', true)" style="background:none; border:none; color:var(--green-primary); cursor:pointer; font-size:13px; font-weight:700; padding: 0 4px;" title="Validar Documento">o"</button>
                <button onclick="validateDocumentDirect(${lead.id}, '${doc.name}', false)" style="background:none; border:none; color:var(--red-primary); cursor:pointer; font-size:13px; font-weight:700; padding: 0 4px;" title="Recusar/Marcar Pendente">o-</button>
              ` : ''}
            </div>
          </div>
        `).join('') : '<div style="font-size:12px;color:var(--text-secondary);padding:4px 0">Nenhum documento anexado ainda.</div>'}
      </div>

      <!-- Specific client tasks list -->
      <div class="slideout-section" style="margin-bottom:15px;">
        <div class="slideout-section-title" style="font-size:12px; font-weight:700; color:var(--text-secondary); text-transform:uppercase; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
          Tarefas do Processo
          <button class="btn btn-outline-yellow" onclick="openNewTaskForLead(${lead.id})" style="font-size:10px; padding:2px 6px;">+ Nova</button>
        </div>
        ${window.mockTasks.filter(t => t.leadId === lead.id).map(task => `
          <div style="display:flex; align-items:center; justify-content:space-between; padding:6px 0; border-bottom:1px solid var(--border-color);">
            <div style="display:flex; align-items:center; gap:8px;">
              <input type="checkbox" ${task.concluida ? 'checked' : ''} onchange="toggleControladoriaTaskDirect(${lead.id}, ${task.id})" style="cursor:pointer; width:14px; height:14px; accent-color:var(--gold-primary);">
              <span style="font-size:12px; ${task.concluida ? 'text-decoration:line-through;color:var(--text-secondary);' : 'color:var(--text-primary);'}">${task.titulo}</span>
            </div>
            <span style="font-size:11px; font-weight:600; color:var(--text-secondary);">📋. ${task.prazo}</span>
          </div>
        `).join('') || '<div style="font-size:12px;color:var(--text-secondary);padding:4px 0">Nenhuma tarefa associada a este caso.</div>'}
      </div>
      
      <div class="slideout-section">
        <div class="slideout-section-title" style="font-size:12px; font-weight:700; color:var(--text-secondary); text-transform:uppercase; margin-bottom:8px;">Histórico de Atividades</div>
        ${lead.timeline.slice(0, 5).map(ev => `
          <div class="slideout-timeline-item" style="display:flex; gap:10px; margin-bottom:10px;">
            <div class="slideout-timeline-dot" style="width:8px; height:8px; border-radius:50%; background:var(--gold-primary); margin-top:4px; flex-shrink:0;"></div>
            <div>
              <div class="slideout-timeline-title" style="font-size:11.5px; color:var(--text-primary); font-weight:600;">${ev.title}: ${ev.desc}</div>
              <div class="slideout-timeline-time" style="font-size:10px; color:var(--text-secondary);">${ev.time} ? ${ev.type}</div>
            </div>
          </div>
        `).join('')}
      </div>
      
      <div class="slideout-actions" style="margin-top:20px; display:flex; gap:10px;">
        <button class="btn btn-yellow" style="flex:1;" onclick="openEditLeadModal(${lead.id}); this.closest('.details-slideout').classList.remove('open');">o️ Editar Completo</button>
        <button class="btn btn-outline-yellow" onclick="this.closest('.details-slideout').classList.remove('open')">Fechar</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(slideout);
  // Trigger animation
  requestAnimationFrame(() => slideout.classList.add('open'));
}
window.initCRMInteractive = initCRMInteractive;


