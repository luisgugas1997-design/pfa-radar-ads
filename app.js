// State variables
let currentLeadId = 1;
let currentDocFolder = 'pessoais';
let activeDocumentId = null;

// DOM Elements - Navigation Sidebar
const sidebarItemÃªs = document.querySelectorAll('.sidebar-item');
const screenPanels = document.querySelectorAll('.screen-panel');

// DOM Elements - Conversations View
const chatListContainer = document.getElementById('chat-list');
const chatHistoryContainer = document.getElementById('chat-history');
const headerAvatar = document.getElementById('header-avatar');
const headerName = document.getElementById('header-name');
const headerSub = document.getElementById('header-sub');
const btnPararRobo = document.getElementById('btn-parar-robo');
const btnRetomarRobo = document.getElementById('btn-retomar-robo');
const btnAssumirManual = document.getElementById('btn-assumir-manual');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const bottomTabs = document.querySelectorAll('#bottom-tabs .panel-tab');
const tabContentContainer = document.getElementById('tab-content');
const unreadConversationsBadge = document.getElementById('unread-conversations-count');
const searchInput = document.getElementById('search-conversations');

// DOM Elements - Right CRM Sidebar
const profileAvatar = document.getElementById('profile-avatar');
const profileName = document.getElementById('profile-name');
const profilePhone = document.getElementById('profile-phone');
const profileEmail = document.getElementById('profile-email');
const profileLocation = document.getElementById('profile-location');
const crmEtapa = document.getElementById('crm-etapa');
const crmTipoCaso = document.getElementById('crm-tipo-caso');
const crmProcesso = document.getElementById('crm-processo');
const crmDataInfra = document.getElementById('crm-data-infra');
const crmAutuador = document.getElementById('crm-autuador');
const crmValorCausa = document.getElementById('crm-valor-cause');
const timelineList = document.getElementById('timeline-list');
const promptTextarea = document.getElementById('prompt-textarea');
const btnSavePrompt = document.getElementById('btn-save-prompt');
const kanbanColsMini = document.getElementById('kanban-cols');

// DOM Elements - Document Screen
const docFolderItemÃªs = document.querySelectorAll('.docs-folder-item');
const docsTableBody = document.getElementById('docs-table-body');
const pdfPreviewTitle = document.getElementById('pdf-preview-title');
const pdfPreviewBody = document.getElementById('pdf-preview-body');
const pdfPreviewAutuador = document.getElementById('pdf-preview-autuador');
const pdfPreviewCondutor = document.getElementById('pdf-preview-condutor');
const pdfPreviewData = document.getElementById('pdf-preview-data');
const docDetailsName = document.getElementById('doc-details-name');
const docDetailsStatus = document.getElementById('doc-details-status');
const docDetailsAuthor = document.getElementById('doc-details-author');
const docDetailsDate = document.getElementById('doc-details-date');

// DOM Elements - Follow-up Modal
const followupModal = document.getElementById('followup-modal');
const btnOpenFollowup = document.getElementById('btn-open-followup');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnCancelModal = document.getElementById('btn-cancel-modal');
const btnSaveFollowup = document.getElementById('btn-save-followup');
const followupTimeSelect = document.getElementById('followup-time');
const followupTypeSelect = document.getElementById('followup-type');
const followupCustomPrompt = document.getElementById('followup-custom-prompt');

// Helper - Find current active lead object
function getCurrentLead() {
  return mockLeads.find(l => l.id === currentLeadId) || mockLeads[0];
}

// Helper: Convert DD/MM/AAAA [HH:MM] to YYYY-MM-DD[THH:MM]
function formatDateToISO(dateStr) {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr;
  const parts = dateStr.split(' ');
  const dateParts = parts[0].split('/');
  if (dateParts.length !== 3) return '';
  const yyyymmdd = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;
  if (parts[1]) {
    return `${yyyymmdd}T${parts[1]}`;
  }
  return yyyymmdd;
}

// Helper: Convert YYYY-MM-DD[THH:MM] to DD/MM/AAAA [HH:MM]
function formatDateToBR(dateStr) {
  if (!dateStr) return 'Sem prazo';
  if (dateStr.includes('T')) {
    const parts = dateStr.split('T');
    const dateParts = parts[0].split('-');
    if (dateParts.length !== 3) return dateStr;
    return `${dateParts[2]}/${dateParts[1]}/${dateParts[0]} ${parts[1]}`;
  }
  const dateParts = dateStr.split('-');
  if (dateParts.length === 3) {
    return `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
  }
  return dateStr;
}

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  // Enrich mockLeads first for plate, cnh, and impounded status search
  try {
    window.mockLeads.forEach((l, idx) => {
      l.placa = l.placa || `BRA-3Y2${idx}`;
      l.cnh = l.cnh || `992837411${idx}`;
      l.apreendido = l.apreendido || (idx % 3 === 0);
    });
  } catch(e) { console.error('Erro ao enriquecer mockLeads:', e); }

  const safeInit = (fn, label) => {
    try { fn(); }
    catch(e) { console.warn(`[PFA] Erro ao inicializar ${label}:`, e.message); }
  };

  safeInit(initNavigation, 'Navigation');
  safeInit(initConversationsScreen, 'Conversations');
  safeInit(initDocumentsScreen, 'Documents');
  safeInit(initFollowupModal, 'FollowupModal');
  safeInit(initSidebarToggle, 'SidebarToggle');
  safeInit(initBottomPanelToggle, 'BottomPanelToggle');
  safeInit(initHoverPreview, 'HoverPreview');
  safeInit(initRightSidebarTabs, 'RightSidebarTabs');
  safeInit(initCRMInteractive, 'CRMInteractive');
  safeInit(initKanbanDragAndDrop, 'KanbanDragAndDrop');
  safeInit(updateUnreadBadgeCount, 'UnreadBadge');
  safeInit(initSimulationIntervals, 'SimulationIntervals');
  safeInit(startWebhookLogSimulation, 'WebhookSimulation');
  safeInit(initGlobalClock, 'GlobalClock');
});

// ==========================================
// SIDEBAR NAVIGATION SYSTEM
// ==========================================
function initNavigation() {
  sidebarItemÃªs.forEach(item => {
    item.addEventListener('click', () => {
      const targetScreen = item.getAttribute('data-screen');
      navigateToScreen(targetScreen);
    });
  });
}

function navigateToScreen(screenName) {
  // Toggle sidebar active state
  sidebarItemÃªs.forEach(i => {
    if (i.getAttribute('data-screen') === screenName) {
      i.classList.add('active');
    } else {
      i.classList.remove('active');
    }
  });

  // Toggle screens display
  screenPanels.forEach(panel => {
    if (panel.id === `screen-${screenName}`) {
      panel.classList.add('active');
    } else {
      panel.classList.remove('active');
    }
  });

  // Screen specific synchronizations
  if (screenName === 'crm') {
    renderFullCRMSidebar();
    renderInteractiveTasks();
    renderFullKanbanScreen();
    if (typeof window.renderCRMFollowupMonitor === 'function') {
      window.renderCRMFollowupMonitor();
    }
  } else if (screenName === 'clientes') {
    renderCRMLeadsTable();
  } else if (screenName === 'tarefas') {
    renderControladoriaTasks();
  } else if (screenName === 'kanban') {
    renderFullKanbanScreen();
  } else if (screenName === 'configuracoes') {
    setTimeout(renderWebhookLogs, 50);
  } else if (screenName === 'financeiro') {
    setTimeout(renderFinanceiroScreen, 50);
  }
}

// Bind to window to allow call from HTML links
window.navigateToScreen = navigateToScreen;

// Open current lead's full client record on the CRM / Clientes screen
function openCurrentLeadFicha() {
  const lead = getCurrentLead();
  if (!lead) return;
  
  // Navigate to CRM screen (Clientes tab)
  navigateToScreen('clientes');
  
  // Wait for render then highlight the lead
  setTimeout(() => {
    // Try to filter/search by name
    const searchBox = document.getElementById('crm-search-input');
    if (searchBox) {
      searchBox.value = lead.name;
      filterCRMTable(lead.name);
    }
    
    // Try to open the details panel for this lead
    if (typeof openViewDetailsPanel === 'function') {
      openViewDetailsPanel(lead.id);
    }
    
    showToastNotification('Ficha do Cliente', `Abrindo ficha de ${lead.name} ✅`, '✅');
  }, 100);
}
window.openCurrentLeadFicha = openCurrentLeadFicha;

// ==========================================
// CONVERSATIONS SCREEN LOGIC
// ==========================================
function initConversationsScreen() {
  renderChatList();
  renderChatArea();
  renderRightSidebar();
  renderBottomTabContent();

  // Search filter
  searchInput.addEventListener('input', (e) => {
    renderChatList(e.target.value);
  });

  // Sending message
  sendBtn.addEventListener('click', sendMessage);
  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  // Robot toggles
  btnPararRobo.addEventListener('click', () => toggleRobot(false));
  btnRetomarRobo.addEventListener('click', () => toggleRobot(true));
  btnAssumirManual.addEventListener('click', () => toggleRobot(false));

  // Prompt Saving
  btnSavePrompt.addEventListener('click', () => {
    const lead = getCurrentLead();
    lead.promptCustom = promptTextarea.value;
    alert(`Prompt customizado de ${lead.name} salvo com sucesso!`);
    
    // Add to timeline
    addTimelineEvent(lead, 'success', 'Configurações', 'Prompt customizado da IA atualizado pelo advogado.');
    renderRightSidebar();
  });

  // Bottom tabs navigation
  bottomTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      bottomTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderBottomTabContent(tab.getAttribute('data-tab'));
    });
  });
}

// Render the list of chats on left sidebar column
function renderChatList(filterText = '') {
  chatListContainer.innerHTML = '';
  const query = filterText.toLowerCase();
  const activeFilter = window.currentChatFilter || 'all';

  mockLeads.forEach(lead => {
    // Search query filter
    if (query && !lead.name.toLowerCase().includes(query) && !lead.tipoCaso.toLowerCase().includes(query)) {
      return;
    }

    // Status filter
    if (activeFilter === 'unread') {
      const hasUnread = lead.messages.some(m => m.sender === 'client' && !m.read);
      if (!hasUnread) return;
    } else if (activeFilter === 'manual') {
      if (lead.roboAtivo) return;
    } else if (activeFilter === 'bot') {
      if (!lead.roboAtivo) return;
    }

    const item = document.createElement('div');
    item.className = `left-light-item ${lead.id === currentLeadId ? 'active' : ''}`;
    
    // Get last message info
    const lastMsg = lead.messages[lead.messages.length - 1];
    const badgeClass = lead.tipoCaso.toLowerCase().includes('seca') ? 'lei-seca' : 
                      lead.tipoCaso.toLowerCase().includes('suspens') ? 'suspensao' : 'cassacao';

    // Tags visuais da conversa
    const tags = [];
    const today = new Date(); today.setHours(0,0,0,0);
    const prazoTask = window.mockTasks && window.mockTasks.find(t => t.leadId === lead.id && !t.concluida);
    if (prazoTask) {
      const iso = formatDateToISO(prazoTask.prazo);
      if (iso) {
        const pd = new Date(iso.substring(0,10)); pd.setHours(0,0,0,0);
        const diff = Math.ceil((pd - today) / 86400000);
        if (diff <= 3) tags.push({ label: diff < 0 ? 'VENCIDO' : 'URGENTE', cls: 'urgente' });
      }
    }
    if (lead.etapa && lead.etapa.toLowerCase().includes('doc')) tags.push({ label: 'DOCS', cls: 'aguardando' });
    if (lead.etapa && (lead.etapa.toLowerCase().includes('proposta') || lead.etapa.toLowerCase().includes('assinatura'))) tags.push({ label: 'PROPOSTA', cls: 'proposta' });
    if ((lead.valorCausa || 0) > 5000) tags.push({ label: 'VIP', cls: 'vip' });
    if (lead.id % 4 === 0 && !tags.find(t => t.cls === 'urgente')) tags.push({ label: 'INATIVO', cls: 'inativo' });

    const tagsHTML = tags.length > 0
      ? `<div style="display:flex;gap:3px;flex-wrap:wrap;margin-top:4px;">${tags.map(t => `<span class="conv-tag ${t.cls}">${t.label}</span>`).join('')}</div>`
      : '';
    const unreadCount = lead.messages.filter(m => m.sender === 'client' && !m.read).length;
    
    item.innerHTML = `
      <div class="avatar">${getInitials(lead.name)}</div>
      <div class="chat-details">
        <div class="chat-name-row">
          <span class="chat-name">${lead.name}</span>
          <span class="chat-time">${lastMsg ? lastMsg.time : 'Ontem'}</span>
        </div>
        <div class="chat-message-row">
          <span class="chat-mÃªsg">${lastMsg ? lastMsg.text.substring(0,42)+(lastMsg.text.length>42?'...':'') : 'Sem mensagens'}</span>
          <span class="chat-badge ${badgeClass}">${lead.tipoCaso}</span>
        </div>
        ${tagsHTML}
      </div>
      ${unreadCount > 0 ? `<div class="unread-count" style="position:absolute;right:10px;top:12px;">${unreadCount}</div>` : ''}
    `;

    item.addEventListener('click', () => {
      currentLeadId = lead.id;
      // Mark all messages as read
      lead.messages.forEach(m => m.read = true);
      
      renderChatList(filterText);
      renderChatArea();
      renderRightSidebar();
      renderBottomTabContent();
      updateUnreadBadgeCount();
    });

    chatListContainer.appendChild(item);
  });
}

// Render the chat history and header
function renderChatArea() {
  const lead = getCurrentLead();
  chatHistoryContainer.innerHTML = '';
  
  // Set Header User Details
  headerAvatar.innerText = getInitials(lead.name);
  headerName.innerHTML = `
    ${lead.name}
    <span class="file-badge ${lead.roboAtivo ? 'validated' : 'pending'}" style="margin-left: 8px; font-size: 10.5px; padding: 2px 6px; border-radius: 12px; display: inline-flex; align-items: center; gap: 3px; font-weight: 700; white-space: nowrap;">
      ${lead.roboAtivo ? '🤖 IA Ativa' : '👤 Humano'}
    </span>
  `;
  headerSub.innerText = `${lead.tipoCaso} • Proc. ${lead.processo}`;

  // Render Case Progress Bar
  const progressBar = document.getElementById('case-progress-bar');
  if (progressBar) {
    const allSteps = [ { key: 'Triagem', label: 'Triagem' }, { key: 'Documentos', label: 'Documentos' }, { key: 'Elaboração Defesa', label: 'Defesa' }, { key: 'Protocolo', label: 'Protocolo' }, { key: 'Julgamento JARI', label: 'JARI' }, { key: 'Recurso CETRAN', label: 'CETRAN' }, { key: 'Concluído', label: 'Concluído' } ];
    let currentIdx = allSteps.findIndex(s => lead.etapa && lead.etapa.includes(s.key));
    if (currentIdx === -1) currentIdx = 0;
    progressBar.innerHTML = allSteps.map((step, idx) => {
      const isDone = idx < currentIdx;
      const isActive = idx === currentIdx;
      const cls = isDone ? 'done' : isActive ? 'active' : 'pending';
      const icon = isDone ? '✓ ' : '';
      const arrow = idx < allSteps.length - 1 ? '<span class="case-progress-arrow">›</span>' : '';
      return `<span class="case-progress-step ${cls}" title="${step.label}" onclick="advanceCaseStage('${step.key}')" style="cursor:pointer; transition: transform 0.1s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">${icon}${step.label}</span>${arrow}`;
    }).join('');
  }

  // Set toggle buttons visibilities
  if (lead.roboAtivo) {
    btnPararRobo.style.display = 'inline-flex';
    btnRetomarRobo.style.display = 'none';
  } else {
    btnPararRobo.style.display = 'none';
    btnRetomarRobo.style.display = 'inline-flex';
  }

  // Render Bot Status Alert Box if paused
  if (!lead.roboAtivo) {
    const alertBox = document.createElement('div');
    alertBox.className = 'bot-status-bar';
    alertBox.style.backgroundColor = 'var(--red-bg)';
    alertBox.style.borderColor = 'var(--red-primary)';
    alertBox.style.color = 'var(--red-primary)';
    alertBox.innerHTML = `
      <span>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
        Robô pausado - Atendimento manual ativo
      </span>
    `;
    chatHistoryContainer.appendChild(alertBox);
  } else {
    const alertBox = document.createElement('div');
    alertBox.className = 'bot-status-bar';
    alertBox.innerHTML = `
      <span>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bot"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
        Robô IA ativo e respondendo em tempo real
      </span>
    `;
    chatHistoryContainer.appendChild(alertBox);
  }

  // Render Messages
  lead.messages.forEach(mÃªsg => {
    const bubble = document.createElement('div');
    bubble.className = `message-bubble ${mÃªsg.sender === 'client' ? 'client' : 'bot'}`;
    
    let content = mÃªsg.text;
    if (mÃªsg.attachment) {
      const att = mÃªsg.attachment;
      const isImg = att.type === 'image';
      content += `
        <div class="chat-attachment-card" style="margin-top: 8px; background: rgba(0,0,0,0.03); padding: 8px; border-radius: 6px; display: flex; align-items: center; justify-content: space-between; gap: 15px; border: 1px solid var(--border-color); min-width: 200px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:20px;">${isImg ? '🖼️' : '📄'}</span>
            <div style="display:flex; flex-direction:column; text-align:left;">
              <strong style="font-size:11.5px; word-break:break-all; color:var(--text-primary);">${att.name}</strong>
              <span style="font-size:10px; color:var(--text-secondary);">${att.size || '350 KB'}</span>
            </div>
          </div>
          <button onclick="downloadChatFile('${att.name}')" class="btn btn-outline-orange" style="padding: 4px 8px; font-size: 10px; font-weight:700; white-space:nowrap;">⬇️ Baixar</button>
        </div>
      `;
    }

    bubble.innerHTML = `
      ${content}
      <span class="mÃªsg-time">${mÃªsg.time}</span>
    `;
    chatHistoryContainer.appendChild(bubble);
  });

  // Scroll to bottom
  setTimeout(() => {
    chatHistoryContainer.scrollTop = chatHistoryContainer.scrollHeight;
  }, 30);
}

// Render the right sidebar details for Conversations
function renderRightSidebar() {
  const lead = getCurrentLead();
  
  profileAvatar.innerText = getInitials(lead.name);
  profileName.innerHTML = `${lead.name} <span class="status-indicator">${lead.roboAtivo ? 'IA Ativa' : 'Manual'}</span>`;
  profilePhone.innerText = lead.phone;
  profileEmail.innerText = lead.email;
  profileLocation.innerText = lead.location;
  
  crmEtapa.innerText = lead.etapa;
  crmTipoCaso.innerText = lead.tipoCaso;
  crmProcesso.innerText = lead.processo;
  crmDataInfra.innerText = lead.dataInfra;
  crmAutuador.innerText = lead.autuador;
  crmValorCausa.innerText = `R$ ${lead.valorCausa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  
  // Next Action box
  const actionBox = document.querySelector('.action-box .action-content');
  actionBox.innerHTML = `
    ${lead.proximaAcao}
    <div class="action-deadline">Prazo: ${lead.prazoAcao}</div>
  `;

  // Render Financeiro Right Sidebar fields
  const finHonorariosInput = document.getElementById('fin-honorarios');
  const finPagoInput = document.getElementById('fin-pago');
  const finRestanteInput = document.getElementById('fin-restante');
  const finDataInput = document.getElementById('fin-data-pagamento');
  const finStatusSelect = document.getElementById('fin-status');
  
  if (finHonorariosInput) {
    const honVal = lead.valorHonorarios || (lead.valorCausa * 0.3) || 1500;
    const pagoVal = lead.valoresPagos || 0;
    const restVal = Math.max(0, honVal - pagoVal);
    
    finHonorariosInput.value = honVal.toFixed(2);
    finPagoInput.value = pagoVal.toFixed(2);
    finRestanteInput.value = restVal.toFixed(2);
    finDataInput.value = lead.prazoPagamento || '';
finStatusSelect.value = lead.statusPagamento || (pagoVal >= honVal ? 'pago' : pagoVal > 0 ? 'parcial' : 'pendente');
  }

  // Set prompt text
  promptTextarea.value = lead.promptCustom;
}

// Render the bottom panel tabs content
function renderBottomTabContent(tabName = 'documentos') {
  const lead = getCurrentLead();
  if (!lead) return;
  
  if (!tabContentContainer) return;
  tabContentContainer.innerHTML = '';

  if (tabName === 'documentos') {
    // Summarized Document Panel as requested
    const docsHeader = document.createElement('div');
    docsHeader.style.display = 'flex';
    docsHeader.style.justifyContent = 'space-between';
    docsHeader.style.alignItemÃªs = 'center';
    docsHeader.style.marginBottom = '12px';
    docsHeader.innerHTML = `
      <span style="font-size:11.5px; font-weight:700; color:var(--text-secondary); text-transform:uppercase;">Resumo de Documentos do Caso</span>
      <div style="display:flex; gap:8px;">
        <button class="btn btn-outline-yellow" onclick="openRequestDocModal(${lead.id})" style="font-size:10px; padding:3px 8px;">Solicitar Documento</button>
        <button class="btn btn-yellow" onclick="simulateDocUpload()" style="font-size:10px; padding:3px 8px;">+ Upload</button>
      </div>
    `;
    tabContentContainer.appendChild(docsHeader);

    const docCols = document.createElement('div');
    docCols.style.display = 'grid';
    docCols.style.gridTemplateColumns = '1fr 1fr';
    docCols.style.gap = '15px';
    
    // Filter documents based on stage/folder dynamically
    let activeFolder = 'pessoais';
    const currentEtapa = lead.etapa || '';
    if (currentEtapa.includes('Recurso') || currentEtapa.includes('Protocolo') || currentEtapa.includes('Defesa') || currentEtapa.includes('Elaboração') || currentEtapa.includes('JARI') || currentEtapa.includes('CETRAN')) {
      activeFolder = 'processo';
    } else if (currentEtapa.includes('Fechado') || currentEtapa.includes('Concluído')) {
      activeFolder = 'financeiro';
    }

    const receivedDocs = lead.documentos.filter(d => d.folder === activeFolder && (d.status === 'Recebido' || d.status === 'Validado'));
    
    const receivedCol = document.createElement('div');
    receivedCol.style.background = 'var(--bg-tertiary)';
    receivedCol.style.padding = '10px';
    receivedCol.style.borderRadius = '8px';
    receivedCol.style.border = '1px solid var(--border-color)';
    
    receivedCol.innerHTML = `
      <h4 style="font-size:11px; font-weight:700; color:var(--green-primary); margin-bottom:8px; display:flex; align-items:center; gap:4px;">✅ Recebidos [Pasta: ${activeFolder.toUpperCase()}] (${receivedDocs.length})</h4>
      <div style="display:flex; flex-direction:column; gap:6px; max-height:120px; overflow-y:auto;">
        ${receivedDocs.map(d => {
          const isValidated = d.status === 'Validado';
          return `
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; padding:4px 0; border-bottom:1px solid var(--border-color);">
              <span onclick="showDocumentPreviewFromChat('${d.name}')" style="cursor:pointer; color:var(--text-primary); text-decoration:underline;" onmouseover="this.style.color='var(--gold-primary)'" onmouseout="this.style.color='var(--text-primary)'">📄 ${d.name}</span>
              <div style="display:flex; align-items:center; gap:6px;">
                ${!isValidated ? `
                  <button onclick="validateDocument('${d.name}', true)" style="border:1px solid rgba(0,180,130,0.3); background:var(--green-bg); color:var(--green-primary); font-size:10px; font-weight:700; cursor:pointer; padding:1px 5px; border-radius:3px;" title="Validar Documento">✓</button>
                  <button onclick="validateDocument('${d.name}', false)" style="border:1px solid rgba(220,38,38,0.3); background:var(--red-bg); color:var(--red-primary); font-size:10px; font-weight:700; cursor:pointer; padding:1px 5px; border-radius:3px;" title="Recusar Documento">❌</button>
                ` : `
                  <span style="font-size:9px; background:#dcfce7; color:#166534; padding:1px 5px; border-radius:3px; font-weight:700;">Validado ✓</span>
                `}
              </div>
            </div>
          `;
        }).join('') || '<div style="font-size:10.5px; color:var(--text-secondary);">Nenhum documento recebido nesta pasta.</div>'}
      </div>
    `;
    
    // Column 2: Pending / Missing
    const missingCol = document.createElement('div');
    missingCol.style.background = 'var(--bg-tertiary)';
    missingCol.style.padding = '10px';
    missingCol.style.borderRadius = '8px';
    missingCol.style.border = '1px solid var(--border-color)';
    
    const missingDocs = lead.documentos.filter(d => d.folder === activeFolder && (d.status === 'Pendente' || d.status === 'Aguardando envio'));
    missingCol.innerHTML = `
      <h4 style="font-size:11px; font-weight:700; color:var(--orange-primary); margin-bottom:8px; display:flex; align-items:center; gap:4px;">⚠️ Pendentes [Pasta: ${activeFolder.toUpperCase()}] (${missingDocs.length})</h4>
      <div style="display:flex; flex-direction:column; gap:6px; max-height:120px; overflow-y:auto;">
        ${missingDocs.map(d => `
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; padding:4px 0; border-bottom:1px solid var(--border-color);">
            <span style="color:var(--text-secondary);">📄 ${d.name}</span>
            <div style="display:flex; align-items:center; gap:6px;">
              <button onclick="simulateClientDocUpload('${d.name}')" style="border:1px solid rgba(37,99,235,0.3); background:#eff6ff; color:#2563eb; font-size:9.5px; font-weight:700; cursor:pointer; padding:1px 5px; border-radius:3px;" title="Simular cliente enviando este documento via WhatsApp">Simular 📲</button>
              <button onclick="sendDocumentRequest(${lead.id})" style="border:none; background:none; color:var(--orange-primary); font-size:10px; font-weight:700; cursor:pointer;" title="Cobrar por WhatsApp">Cobrar 💬</button>
            </div>
          </div>
        `).join('') || '<div style="font-size:10.5px; color:var(--text-secondary);">Tudo em dia! Sem pendências nesta pasta.</div>'}
      </div>
    `;
    
    docCols.appendChild(receivedCol);
    docCols.appendChild(missingCol);
    tabContentContainer.appendChild(docCols);

  } else if (tabName === 'notas') {
    // Notes tab
    const notesContainer = document.createElement('div');
    notesContainer.style.display = 'flex';
    notesContainer.style.flexDirection = 'column';
    notesContainer.style.gap = '10px';
    notesContainer.innerHTML = `
      <label style="font-size:11px; font-weight:700; color:var(--text-secondary); text-transform:uppercase;">Anotações do Advogado (Uso Interno)</label>
      <textarea id="chat-client-notes" placeholder="Digite observações sobre o caso, fatos relatados ou lembretes especiais..." style="width:100%; height:80px; padding:8px; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-tertiary); color:var(--text-primary); font-size:11.5px; resize:none;">${lead.notasCustom || ''}</textarea>
      <button class="btn btn-yellow" onclick="saveClientNotes(${lead.id})" style="align-self:flex-end; font-size:10.5px; padding:4px 12px; font-weight:700;">💾 Salvar Anotações</button>
    `;
    tabContentContainer.appendChild(notesContainer);

  } else if (tabName === 'atividades') {
    // Tasks checklist
    const tasksHeader = document.createElement('div');
    tasksHeader.style.display = 'flex';
    tasksHeader.style.justifyContent = 'space-between';
    tasksHeader.style.alignItemÃªs = 'center';
    tasksHeader.style.marginBottom = '10px';
    tasksHeader.innerHTML = `
      <span style="font-size:11px; font-weight:700; color:var(--text-secondary); text-transform:uppercase;">Tarefas de Atendimento</span>
      <button class="btn btn-yellow" onclick="openNewTaskForLead(${lead.id})" style="font-size:9.5px; padding:2px 8px;">+ Atribuir</button>
    `;
    tabContentContainer.appendChild(tasksHeader);
    tabContentContainer.insertAdjacentHTML('beforeend', renderCaseStandardChecklist(lead));

    const tasksList = document.createElement('div');
    tasksList.style.display = 'flex';
    tasksList.style.flexDirection = 'column';
    tasksList.style.gap = '6px';
    tasksList.style.maxHeight = '130px';
    tasksList.style.overflowY = 'auto';

    const clientTasks = window.mockTasks.filter(t => t.leadId === lead.id);
    if (clientTasks.length === 0) {
      tasksList.innerHTML = `<div style="font-size:11px; color:var(--text-secondary); padding:10px 0;">Nenhuma atividade cadastrada para este cliente.</div>`;
    } else {
      clientTasks.forEach(task => {
        const item = document.createElement('div');
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        item.style.alignItemÃªs = 'center';
        item.style.padding = '4px 8px';
        item.style.background = 'var(--bg-tertiary)';
        item.style.border = '1px solid var(--border-color)';
        item.style.borderRadius = '4px';
        item.innerHTML = `
          <div style="display:flex; align-items:center; gap:8px;">
            <input type="checkbox" ${task.concluida ? 'checked' : ''} onchange="toggleControladoriaTaskDirect(${lead.id}, ${task.id})" style="cursor:pointer; width:13px; height:13px; accent-color:var(--gold-primary);">
            <span style="font-size:11.5px; ${task.concluida ? 'text-decoration:line-through; color:var(--text-secondary);' : 'color:var(--text-primary);'}">${task.titulo}</span>
          </div>
          <span style="font-size:10px; color:var(--text-secondary);">📅 ${task.prazo}</span>
        `;
        tasksList.appendChild(item);
      });
    }
    tabContentContainer.appendChild(tasksList);

  } else if (tabName === 'historico') {
    // Historical events
    const timeline = document.createElement('div');
    timeline.style.display = 'flex';
    timeline.style.flexDirection = 'column';
    timeline.style.gap = '8px';
    timeline.style.maxHeight = '140px';
    timeline.style.overflowY = 'auto';
    timeline.innerHTML = lead.timeline.map(ev => `
      <div style="display:flex; gap:10px; font-size:11px;">
        <div style="width:6px; height:6px; border-radius:50%; background:var(--gold-primary); margin-top:4px; flex-shrink:0;"></div>
        <div>
          <div style="font-weight:600; color:var(--text-primary);">${ev.title}: ${ev.desc}</div>
          <div style="font-size:9.5px; color:var(--text-secondary);">${ev.time} • ${ev.type}</div>
        </div>
      </div>
    `).join('') || '<div style="font-size:11px; color:var(--text-secondary);">Nenhum histórico disponível.</div>';
    tabContentContainer.appendChild(timeline);

  } else if (tabName === 'automacoes') {
    // Robot IA configs
    const autoBox = document.createElement('div');
    autoBox.style.display = 'flex';
    autoBox.style.flexDirection = 'column';
    autoBox.style.gap = '10px';
    
    const statusText = lead.roboAtivo ? '🟢 IA n8n ATIVA E CONVERSANDO' : '👤 IA PAUSADA (ATENDIMENTO MANUAL)';
    
    autoBox.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-tertiary); padding:8px; border-radius:6px; border:1px solid var(--border-color);">
        <span style="font-size:11.5px; font-weight:700; color:var(--text-primary);">${statusText}</span>
        <button class="btn ${lead.roboAtivo ? 'btn-outline-orange' : 'btn-yellow'}" onclick="toggleLeadRobot(${lead.id})" style="font-size:10px; padding:3px 8px;">
          ${lead.roboAtivo ? 'Pausar IA' : 'Ativar IA'}
        </button>
      </div>
      <div style="display:flex; flex-direction:column; gap:4px;">
        <label style="font-size:11px; font-weight:700; color:var(--text-secondary); text-transform:uppercase;">Instruções Customizadas do Chatbot (Prompt)</label>
        <textarea id="chat-client-prompt" placeholder="Ex: Focar na suspensão, evitar termos técnicos..." style="width:100%; height:60px; padding:6px; border-radius:4px; border:1px solid var(--border-color); background:var(--bg-tertiary); color:var(--text-primary); font-size:11px; resize:none;">${lead.promptCustom || ''}</textarea>
        <button class="btn btn-yellow" onclick="saveClientPromptFromChat(${lead.id})" style="align-self:flex-end; font-size:10px; padding:3px 10px; margin-top:2px;">Salvar Prompt</button>
      </div>
    `;
    tabContentContainer.appendChild(autoBox);
  }
}

function renderCaseStandardChecklist(lead) {
  const checklists = {
    'Lei Seca': ['Conferir AIT', 'Validar etilômetro', 'Defesa prévia', 'Recurso JARI', 'Recurso CETRAN'],
    'CNH Suspensa': ['Ler notificação', 'Analisar prontuário', 'Definir tese', 'Protocolar defesa', 'Acompanhar julgamento'],
    'CNH Cassada': ['Conferir cassação', 'Checar reincidência', 'Montar defesa', 'Protocolar recurso', 'Monitorar reabilitação'],
    'Recurso de Multa': ['Conferir auto', 'Validar prazo', 'Coletar provas', 'Protocolar recurso', 'Monitorar decisão']
  };
  const steps = checklists[lead.tipoCaso] || checklists['Recurso de Multa'];
  const stageIndex = Math.max(0, window.crmEtapas.indexOf(lead.etapa));
  const completedSteps = Math.min(steps.length, Math.max(1, Math.ceil((stageIndex / (window.crmEtapas.length - 1)) * steps.length)));
  return `
    <div class="case-standard-checklist">
      <span class="case-standard-title">Checklist padrão • ${lead.tipoCaso}</span>
      <div class="case-standard-steps">
        ${steps.map((step, index) => `<span class="${index < completedSteps ? 'done' : index === completedSteps ? 'active' : ''}">${index < completedSteps ? '✓' : index + 1}. ${step}</span>`).join('')}
      </div>
    </div>
  `;
}

// Mini Kanban inside Right Sidebar
function renderMiniKanban(lead) {
  if (!kanbanColsMini) return;
  kanbanColsMini.innerHTML = '';
  const stages = ['Novo Lead', 'Em Triagem', 'Pendentes', 'Recurso', 'Fechado'];
  
  stages.forEach(stage => {
    const col = document.createElement('div');
    col.className = 'kanban-col';
    col.innerHTML = `<div class="kanban-col-header">${stage.toUpperCase()}</div>`;
    
    // If the lead stage matches, put its card here
    if (lead.etapa.toLowerCase().includes(stage.toLowerCase().substring(0,5))) {
      const card = document.createElement('div');
      card.className = 'kanban-card';
      card.innerHTML = `
        <div class="kanban-card-title">${lead.name}</div>
        <div class="kanban-card-tag">${lead.tipoCaso}</div>
      `;
      col.appendChild(card);
    }
    
    kanbanColsMini.appendChild(col);
  });
}

// Timeline inside Right Sidebar
function renderTimeline(lead) {
  if (!timelineList) return;
  timelineList.innerHTML = '';
  lead.timeline.forEach(event => {
    const item = document.createElement('div');
    item.className = 'timeline-item';
    
    const dotClass = event.type === 'IA' ? 'success' : event.type === 'Advogado' ? 'info' : 'warning';
    
    item.innerHTML = `
      <div class="timeline-dot ${dotClass}"></div>
      <div class="timeline-time">${event.time} - ${event.type}</div>
      <div class="timeline-text"><strong>${event.title}:</strong> ${event.desc}</div>
    `;
    timelineList.appendChild(item);
  });
}

// Toggle active status of chatbot
function toggleRobot(status) {
  const lead = getCurrentLead();
  lead.roboAtivo = status;
  
  // Log event in timeline
  const actionText = status ? 'Robô reativado pelo advogado' : 'Robô pausado pelo advogado para atendimento humano';
  addTimelineEvent(lead, status ? 'IA' : 'Advogado', 'Automação', actionText);
  
  renderChatArea();
  renderRightSidebar();
  renderChatList();
}

// Add event helper to timeline
function addTimelineEvent(lead, type, title, desc) {
  const now = new Date();
  const timeStr = `${now.getDate().toString().padStart(2,'0')}/${(now.getMonth()+1).toString().padStart(2,'0')} ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
  
  lead.timeline.unshift({
    time: timeStr,
    type: type,
    title: title,
    desc: desc
  });
}

// Send input message and simulate robot reply
function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;

  const lead = getCurrentLead();
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;

  // Process text based on active AI Persona
  let finalSendText = text;
  if (window.currentPersona === 'financeiro') {
    finalSendText = `💰 [Financeiro] ${text}`;
  } else if (window.currentPersona === 'juridico') {
    finalSendText = `⚖️ [Jurídico] ${text}`;
  } else if (window.currentPersona === 'copiloto') {
    finalSendText = `🚀 [Copiloto] ${text}`;
  } else {
    finalSendText = `👤 [Atendimento] ${text}`;
  }

  // Add client message
  lead.messages.push({
    sender: 'client',
    text: finalSendText,
    time: timeStr,
    read: true
  });

  messageInput.value = '';
  renderChatArea();
  renderChatList();

  // If robot is active, simulate AI response after 1.2s
  if (lead.roboAtivo) {
    setTimeout(() => {
      const aiTime = new Date();
      const aiTimeStr = `${aiTime.getHours().toString().padStart(2,'0')}:${aiTime.getMinutes().toString().padStart(2,'0')}`;
      
      let reply = "Perfeito, entendi. Vou repassar isso para a equipe técnica analisar.";
      if (text.toLowerCase().includes('cnh') || text.toLowerCase().includes('documento')) {
        reply = "Obrigado por avisar! Já localizei seus documentos e os enviei para a pasta do processo. Nossa equipe analisará em instantes.";
      }

      lead.messages.push({
        sender: 'bot',
        text: reply,
        time: aiTimeStr,
        read: true
      });

      renderChatArea();
      renderChatList();
    }, 1200);
  }
}

// Get count of total unread messages
function updateUnreadBadgeCount() {
  let unread = 0;
  mockLeads.forEach(l => {
    unread += l.messages.filter(m => m.sender === 'client' && !m.read).length;
  });
  unreadConversationsBadge.innerText = unread > 0 ? unread : '0';
}

// Copy Right-col structure to full screens
function renderFullCRMSidebar() {
  const container = document.getElementById('crm-sidebar-container');
  if (container) {
    container.innerHTML = document.querySelector('.right-col').innerHTML;
    // Bind buttons again
    bindFollowupButton();
  }
}

// ==========================================
// DOCUMENTS SCREEN LOGIC
// ==========================================
function initDocumentsScreen() {
  initDocsScaleControl();
  
  // Set default search box text
  const searchInput = document.getElementById('docs-client-search');
  const activeLead = getCurrentLead();
  if (searchInput && activeLead) {
    searchInput.value = `${activeLead.name} (${activeLead.tipoCaso})`;
  }
  updateDocsFilterCount();

  document.querySelectorAll('.docs-folder-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.docs-folder-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      currentDocFolder = item.getAttribute('data-folder');
      
      const folderTitle = document.getElementById('docs-current-folder-title');
      if (folderTitle) {
        const folderLabels = {
          pessoais: '01. Pessoais', processo: '02. Processo', comunicacoes: '03. Comunicações',
          financeiro: '04. Financeiro', contratos: '05. Contratos', recursos: '06. Recursos', decisoes: '07. Decisões'
        };
        folderTitle.innerText = `Arquivos em ${folderLabels[currentDocFolder] || currentDocFolder}`;
      }
      
      renderDocumentsTable();
    });
  });

  renderDocumentsTable();
}

function renderDocumentsTable() {
  if (!docsTableBody) return;
  docsTableBody.innerHTML = '';
  const lead = getCurrentLead();
  renderDocumentChecklist(lead);

  const smartFolders = ['contratos', 'recursos', 'decisoes'];
  const allDocs = lead.documentos.filter(doc => smartFolders.includes(currentDocFolder) ? doc.smartFolder === currentDocFolder : doc.folder === currentDocFolder);

  if (allDocs.length === 0) {
    docsTableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;color:var(--text-secondary);padding:30px;">Nenhum documento nesta pasta para ${lead.name}.</td>
      </tr>
    `;
    // Clear preview
    pdfPreviewTitle.innerText = 'Sem documento para visualizar';
    pdfPreviewBody.innerHTML = `<div style="text-align:center;color:var(--text-secondary);padding:40px;">Selecione um documento da lista para ver a pré-visualização.</div>`;
    return;
  }

  allDocs.forEach(doc => {
    const row = document.createElement('tr');
    row.style.cursor = 'pointer';
    if (activeDocumentId === doc.name) {
      row.style.backgroundColor = 'var(--bg-tertiary)';
    }

    const validity = getDocumentValidityStatus(doc);
    const folderLabels = { pessoais: 'Pessoal', processo: 'Processo', comunicacoes: 'Comunicação', financeiro: 'Financeiro', contratos: 'Contratos', recursos: 'Recursos', decisoes: 'Decisões' };
    row.innerHTML = `
      <td><strong>${doc.name}</strong><br><span style="font-size:10px; color:var(--text-secondary);">${doc.size}</span></td>
      <td>${folderLabels[smartFolders.includes(currentDocFolder) ? doc.smartFolder : doc.folder] || 'Processo'}</td>
      <td><span class="file-badge ${doc.status === 'Recebido' ? 'received' : doc.status === 'Validado' ? 'validated' : 'pending'}">${doc.status}</span></td>
      <td><span class="doc-validity-badge ${validity.className}">${validity.icon} ${validity.label}</span></td>
      <td>${doc.date}</td>
      <td>
        <div class="table-actions" onclick="event.stopPropagation()">
          ${doc.status !== 'Validado' ? `
            <button class="table-action-btn edit" title="Validar Documento" onclick="validateDocument('${doc.name}', true)" style="color:var(--green-primary);border-color:rgba(0,180,130,0.2);">
              o"
            </button>
            <button class="table-action-btn delete" title="Recusar Documento" onclick="validateDocument('${doc.name}', false)">
              o-
            </button>
          ` : `<span style="font-size:11px;color:var(--green-primary);font-weight:600;">o" Validado</span>`}
        </div>
      </td>
    `;

    row.addEventListener('click', () => {
      activeDocumentId = doc.name;
      renderDocumentsTable();
      updateDocumentPreview(doc);
    });

    // Hover previews
    row.addEventListener('mouseenter', (e) => {
      if (window.showDocPreview) window.showDocPreview(e, doc.name);
    });
    row.addEventListener('mousemove', (e) => {
      if (window.positionTooltip) window.positionTooltip(e);
    });
    row.addEventListener('mouseleave', () => {
      if (window.hideDocPreview) window.hideDocPreview();
    });

    docsTableBody.appendChild(row);
  });

  // Trigger preview of first item if exists
  if (allDocs.length > 0 && !activeDocumentId) {
    activeDocumentId = allDocs[0].name;
    updateDocumentPreview(allDocs[0]);
  }
}

function updateDocumentPreview(doc) {
  const lead = getCurrentLead();
  if (!doc) return;
  
  pdfPreviewTitle.innerText = `${doc.name} (Pré-visualização)`;
  
  pdfPreviewBody.innerHTML = `
    <div class="pdf-document-title" style="font-weight:700;color:var(--text-primary);margin-bottom:15px;font-size:14px;border-bottom:2px solid var(--gold-primary);padding-bottom:5px;">${doc.name}</div>
    <div class="pdf-metadata-row" style="margin-bottom:8px;font-size:12px;"><span class="pdf-metadata-label" style="font-weight:600;color:var(--text-secondary);">Proprietário:</span> <span>${lead.name}</span></div>
    <div class="pdf-metadata-row" style="margin-bottom:8px;font-size:12px;"><span class="pdf-metadata-label" style="font-weight:600;color:var(--text-secondary);">"rgão Relacionado:</span> <span>${lead.autuador}</span></div>
    <div class="pdf-metadata-row" style="margin-bottom:8px;font-size:12px;"><span class="pdf-metadata-label" style="font-weight:600;color:var(--text-secondary);">Data do Registro:</span> <span>${doc.date}</span></div>
    <div class="pdf-metadata-row" style="margin-bottom:8px;font-size:12px;"><span class="pdf-metadata-label" style="font-weight:600;color:var(--text-secondary);">Tamanho:</span> <span>${doc.size}</span></div>
    <div class="pdf-metadata-row" style="margin-bottom:8px;font-size:12px;"><span class="pdf-metadata-label" style="font-weight:600;color:var(--text-secondary);">Status da Validação:</span> <span class="file-badge ${doc.status === 'Recebido' ? 'received' : doc.status === 'Validado' ? 'validated' : 'pending'}">${doc.status}</span></div>
    <div class="pdf-metadata-row" style="margin-bottom:8px;font-size:12px;"><span class="pdf-metadata-label" style="font-weight:600;color:var(--text-secondary);">Versão Atual:</span> <span>v${doc.version || 1}</span></div>
    <div style="margin-top:20px; line-height:1.5; font-size:11px; border-top:1px solid var(--border-color); padding-top:10px;color:var(--text-primary);">
      <strong>Conteúdo do Documento:</strong><br>
      Este é um arquivo anexado ao caso de ${lead.tipoCaso} do cliente ${lead.name}. 
      Status atualizado para: ${doc.status}. Para validar este arquivo para peticionamento legal ou envio ao Detran, use os botões na tabela.
    </div>
  `;

  const versionsContainer = document.querySelector('.doc-versions-list');
  if (versionsContainer) {
    versionsContainer.innerHTML = `
      <strong style="font-size:11px;">Histórico de Versões</strong>
      ${(doc.versions || []).slice().reverse().map(version => `
        <div class="doc-version-item" style="font-size:10px; margin-top:4px;"><span>v${version.version} - ${version.date}</span><span>${version.author}</span></div>
      `).join('')}
    `;
  }
}

function normalizeDocumentName(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function renderDocumentChecklist(lead) {
  const container = document.getElementById('docs-smart-checklist');
  if (!container || !lead) return;
  const requirements = documentRequirementsByCase[lead.tipoCaso] || documentRequirementsByCase['Recurso de Multa'];

  container.innerHTML = `
    <div class="doc-checklist-title">📋 Checklist automático • ${lead.tipoCaso}</div>
    <div class="doc-checklist-grid">
      ${requirements.map(requirement => {
        const normalizedRequirement = normalizeDocumentName(requirement);
        const doc = lead.documentos.find(item => {
          const normalizedDoc = normalizeDocumentName(item.name);
          return normalizedRequirement.split(' ').some(token => token.length > 3 && normalizedDoc.includes(token));
        });
        const state = !doc ? 'missing' : /validado|recebido/i.test(doc.status) ? 'ok' : 'pending';
        const icon = state === 'ok' ? '✓' : state === 'pending' ? '!' : '×';
        const label = state === 'ok' ? 'Recebido' : state === 'pending' ? 'Pendente' : 'Faltando';
        return `<div class="doc-checklist-item ${state}"><span class="doc-check-icon">${icon}</span><span>${requirement}</span><small>${label}</small></div>`;
      }).join('')}
    </div>
  `;
}

function getDocumentValidityStatus(doc) {
  if (!doc.validade) return { className: 'valid', icon: '—', label: 'Sem prazo' };
  const days = getDaysUntil(doc.validade);
  if (days < 0) return { className: 'expired', icon: '×', label: `Vencido ${Math.abs(days)}d` };
  if (days <= 15) return { className: 'expiring', icon: '!', label: `${days}d` };
  return { className: 'valid', icon: '✓', label: formatDateToBR(doc.validade) };
}

function validateDocument(docName, isValid) {
  const lead = getCurrentLead();
  const doc = lead.documentos.find(d => d.name === docName);
  if (doc) {
    doc.status = isValid ? 'Validado' : 'Pendente';
    doc.date = new Date().toLocaleString('pt-BR').substring(0,16);
    
    // Add timeline log
    lead.timeline.unshift({
      time: new Date().toLocaleString('pt-BR').substring(0,10),
      type: 'Advogado',
      title: isValid ? 'Documento Validado' : 'Documento Recusado',
      desc: `O documento ${docName} foi ${isValid ? 'validado' : 'recusado e marcado como pendente'} no painel.`
    });
    
    // If invalid, toggle a prompt in chat to let the user know
    if (!isValid) {
      lead.messages.push({
        sender: 'bot',
        text: `Olá ${lead.name.split(' ')[0]}! Notei que o documento "${docName}" enviado tem problemas ou está ilegível. Poderia reenviar por favor?`,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        read: true
      });
    }

    renderDocumentsTable();
    renderBottomTabContent('documentos');
    renderTimeline(lead);
    if (typeof renderChatArea === 'function') renderChatArea();
  }
}

function simulateDocUpload() {
  const lead = getCurrentLead();
  const name = prompt("Digite o nome do arquivo para upload (ex: Comprovante de Residência.pdf):", "Comprovante.pdf");
  if (!name) return;
  
  lead.documentos.push({
    name: name,
    folder: currentDocFolder,
    status: 'Recebido',
    size: '1.4 MB',
    date: new Date().toLocaleString('pt-BR').substring(0,16),
    author: 'Advogado'
  });
  
  lead.timeline.unshift({
    time: new Date().toLocaleString('pt-BR').substring(0,10),
    type: 'Sistema',
    title: 'Documento Anexado',
    desc: `Documento ${name} enviado com sucesso via painel.`
  });
  
  renderDocumentsTable();
  renderBottomTabContent('documentos');
  renderTimeline(lead);
}

function openRequestDocModal(leadId = null) {
  const id = leadId || currentLeadId;
  const lead = window.mockLeads.find(l => l.id === id);
  if (!lead) return;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.innerHTML = `
    <div class="edit-lead-modal" style="max-width: 400px;">
      <div class="modal-header">
        <h3>📋, Solicitar Documento</h3>
        <button class="modal-close-btn" onclick="this.closest('.modal-overlay').remove()">&times;</button>
      </div>
      <div class="modal-body" style="padding: 20px;">
        <div style="font-size:12px;margin-bottom:12px;color:var(--text-secondary);">Destinatário: <strong>${lead.name}</strong></div>
        <div class="form-group" style="margin-bottom:12px;">
          <label>Qual documento solicitar?</label>
          <select id="req-doc-type">
            <option value="CNH.pdf">CNH (PDF/Imagem)</option>
            <option value="Auto de Infração.pdf">Auto de Infração (PDF)</option>
            <option value="Comprovante de Residência.pdf">Comprovante de Residência</option>
            <option value="Procuração Assinada.pdf">Procuração Assinada</option>
            <option value="Contrato Assinado.pdf">Contrato Comercial Assinado</option>
          </select>
        </div>
        <div class="form-group">
          <label>Mensagem automatizada (WhatsApp)</label>
          <textarea id="req-doc-mÃªsg" style="height:80px;" placeholder="Mensagem que será enviada ao cliente..."></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline-yellow" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
        <button class="btn btn-yellow" onclick="sendDocumentRequest(${lead.id}, this)">Enviar Solicitação</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  
  const docSelect = overlay.querySelector('#req-doc-type');
  const mÃªsgArea = overlay.querySelector('#req-doc-mÃªsg');
  const updateMsg = () => {
    const docName = docSelect.value.replace('.pdf', '');
    mÃªsgArea.value = `Olá ${lead.name.split(' ')[0]}! Para dar andamento ao seu recurso de ${lead.tipoCaso}, preciso que vocÃªÃªÃªê me envie o seguinte documento: *${docName}*. VocÃªÃªÃªê consegue enviar a foto ou arquivo por aqui?`;
  };
  docSelect.addEventListener('change', updateMsg);
  updateMsg();
}

function sendDocumentRequest(leadId, button) {
  const overlay = button ? button.closest('.modal-overlay') : document.querySelector('.modal-overlay.active');
  if (!overlay) return;

  const lead = window.mockLeads.find(l => l.id === leadId);
  const docSelect = overlay.querySelector('#req-doc-type');
  const mÃªsgText = overlay.querySelector('#req-doc-mÃªsg').value;
  if (!lead || !docSelect) return;

  const fileName = docSelect.value;
  const folder = fileName.includes('Contrato') || fileName.includes('Financeiro') ? 'financeiro' : 'pessoais';

  // Add pending doc
  lead.documentos.push({
    name: fileName,
    folder: folder,
    status: 'Pendente',
    size: 'Aguardando',
    date: 'Aguardando envio',
    author: ''
  });

  // Send message
  lead.messages.push({
    sender: 'bot',
    text: mÃªsgText,
    time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    read: true
  });

  // Timeline
  lead.timeline.unshift({
    time: new Date().toLocaleString('pt-BR').substring(0,10),
    type: 'Advogado',
    title: 'Documento Solicitado',
    desc: `Solicitado envio de ${fileName} via WhatsApp.`
  });

  overlay.remove();

  // Refresh
  renderDocumentsTable();
  renderBottomTabContent('documentos');
  renderTimeline(lead);
  if (typeof renderChatArea === 'function') renderChatArea();
  if (typeof renderConversationList === 'function') renderConversationList();
}

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
      
      const apreendidoBadge = lead.apreendido ? `<span style="font-size:9px; font-weight:700; background:#fef2f2; color:#dc2626; border:1px solid #fca5a5; padding:2px 6px; border-radius:4px; white-space:nowrap;">Ys- Apreendido</span>` : '';

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <div class="kanban-board-card-title" style="font-size:12.5px; font-weight:700; color:var(--text-primary); margin:0;">${lead.name} ${tempIcon}</div>
          ${roboHTML}
        </div>
        <div class="kanban-board-card-location" style="margin-bottom:6px; font-size:10px; color:var(--text-secondary);">📋 ${lead.location}</div>
        
        <div style="display:flex; flex-wrap:wrap; gap:4px; margin-bottom:6px;">
          <span class="kanban-board-card-badge lei-seca" style="background:#e0f2fe; color:#0369a1; border:1px solid #bae6fd; font-size:9px; padding:2px 6px; border-radius:4px;">${lead.tipoCaso}</span>
          <span style="font-size:9px; font-weight:600; color:var(--text-secondary); background:var(--bg-tertiary); padding:2px 6px; border-radius:4px; border:1px solid var(--border-color);">Proc: ${lead.processo}</span>
          ${statusFinHTML}
          ${ultContatoHTML}
          ${apreendidoBadge}
        </div>

        <div style="font-size:10.5px; color:var(--text-primary); margin-bottom:6px; background:var(--bg-tertiary); padding:6px; border-radius:6px; border:1px solid var(--border-color);">
          <div style="display:flex; justify-content:space-between;"><span>Causa:</span><strong style="color:var(--gold-primary)">R$ ${valorCausaStr}</strong></div>
          <div style="display:flex; justify-content:space-between; margin-top:2px;"><span>Hon. Pago:</span><strong style="color:var(--green-primary)">R$ ${valoresPagosStr}</strong></div>
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
        <div class="kanban-card-actions" style="margin-top:6px;">
          <button class="kanban-move-btn" onclick="openMoveStageModal(event, ${lead.id})" style="width:100%; justify-content:center; font-size:10px; padding:4px 0;">
            Mudar Etapa z"
          </button>
        </div>
      `;

      card.addEventListener('click', () => {
        currentLeadId = lead.id;
        renderFullKanbanScreen();
        openViewDetailsPanel(lead.id);
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
// FOLLOW-UP DIALOG MODAL LOGIC
// ==========================================
function initFollowupModal() {
  bindFollowupButton();

  btnCloseModal.addEventListener('click', toggleFollowupModal);
  btnCancelModal.addEventListener('click', toggleFollowupModal);

  btnSaveFollowup.addEventListener('click', () => {
    const lead = getCurrentLead();
    const timeVal = followupTimeSelect.value;
    const purpose = followupTypeSelect.value;
    const notes = followupCustomPrompt.value.trim();

    // Determine target execution time string
    let dateStr = "";
    if (timeVal === 'custom') {
      const cDate = document.getElementById('followup-custom-date').value;
      const cTime = document.getElementById('followup-custom-time-val').value;
      if (cDate) {
        const parts = cDate.split('-');
        dateStr = `${parts[2]}/${parts[1]}/${parts[0]} às ${cTime}`;
      } else {
        dateStr = "Data não especificada";
      }
    } else {
      const hours = parseInt(timeVal);
      if (hours === 1) dateStr = "Em 1 hora";
      else if (hours === 24) dateStr = "AmanhÃ£Ã£Ã£ã de manhã às 09:00";
      else if (hours === 48) dateStr = "Em 2 dias";
      else dateStr = "Em 1 semana";
    }

    // Update lead CRM properties
    lead.proximaAcao = `Follow-up agendado: ${purpose}`;
    lead.prazoAcao = dateStr;

    // Log in timeline
    const detailsLog = `Disparo automático via IA programado para: ${dateStr}. Objetivo: ${purpose}.${notes ? ` Nota: "${notes}"` : ''}`;
    addTimelineEvent(lead, 'Advogado', 'Agendamento', detailsLog);

    // Refresh Sidebar and active screen
    renderRightSidebar();
    
    // Sync with CRM/Kanban if active
    const activeScreen = document.querySelector('.sidebar-item.active').getAttribute('data-screen');
    if (activeScreen === 'crm') renderFullCRMSidebar();
    else if (activeScreen === 'kanban') renderFullKanbanSidebar();

    // Clear and Close
    followupCustomPrompt.value = '';
    toggleFollowupModal();

    alert(`Sucesso! Follow-up do robô programado para: ${lead.name} (${dateStr}).`);
  });
}

function bindFollowupButton() {
  // Can be bound in multiple views (Conversas sidebar, CRM sidebar, Kanban sidebar)
  const buttons = document.querySelectorAll('#btn-open-followup');
  buttons.forEach(btn => {
    btn.removeEventListener('click', toggleFollowupModal); // Avoid double binding
    btn.addEventListener('click', toggleFollowupModal);
  });
}

function toggleFollowupModal() {
  followupModal.classList.toggle('active');
}

// ==========================================
// HELPERS
// ==========================================
function getInitials(name) {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

function initGlobalClock() {
  const clockContent = document.getElementById('global-clock-content');
  if (!clockContent) return;

  function update() {
    const now = new Date();
    const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const dayName = days[now.getDay()];
    
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();
    
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    
    clockContent.innerText = `${dayName}, ${day}/${month}/${year} - ${hours}:${minutes}:${seconds}`;
  }
  
  update();
  setInterval(update, 1000);
}

// Sidebar toggle logic
function initSidebarToggle() {
  const btnToggle = document.getElementById('btn-toggle-sidebar');
  const app = document.querySelector('.app-container');
  const sidebar = document.querySelector('.global-sidebar');

  if (btnToggle && app && sidebar) {
    btnToggle.addEventListener('click', () => {
      app.classList.toggle('collapsed');
      sidebar.classList.toggle('collapsed');
      
      const isCollapsed = sidebar.classList.contains('collapsed');
      btnToggle.innerHTML = isCollapsed ? 
        `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevrons-right-left"><path d="m8 3-5 5 5 5"/><path d="m16 21 5-5-5-5"/><path d="M12 5v14"/></svg>` :
        `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevrons-left-right"><path d="m16 3 5 5-5 5"/><path d="m8 21-5-5 5-5"/><path d="M12 5v14"/></svg>`;
    });
  }
}

// Bottom panel toggle (expand/collapse)
function initBottomPanelToggle() {
  const btnToggle = document.getElementById('btn-toggle-bottom-panel');
  const textToggle = document.getElementById('text-toggle-bottom-panel');
  const centerCol = document.querySelector('.center-col');
  const bottomPanel = document.querySelector('.center-bottom-panel');
  const tabContent = document.getElementById('tab-content');

  if (btnToggle && centerCol && bottomPanel && tabContent) {
    btnToggle.addEventListener('click', () => {
      const isExpanded = centerCol.classList.contains('expanded');
      
      if (isExpanded) {
        // Collapse
        centerCol.classList.remove('expanded');
        bottomPanel.classList.add('collapsed');
        tabContent.style.display = 'none';
        if (textToggle) textToggle.innerText = 'Ver Documentos z"';
      } else {
        // Expand
        centerCol.classList.add('expanded');
        bottomPanel.classList.remove('collapsed');
        tabContent.style.display = 'flex';
        if (textToggle) textToggle.innerText = 'Recolher Aba o-';

        // Force Documentos tab to be active on initial open
        const tabs = document.querySelectorAll('#bottom-tabs .panel-tab');
        tabs.forEach(t => t.classList.remove('active'));
        const docTab = document.querySelector('#bottom-tabs .panel-tab[data-tab="documentos"]');
        if (docTab) docTab.classList.add('active');
        renderBottomTabContent('documentos');
      }
    });

    // Auto-expand if any panel tab is clicked while collapsed
    const tabs = document.querySelectorAll('#bottom-tabs .panel-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const isExpanded = centerCol.classList.contains('expanded');
        
        // Remove active from all tabs, add to current clicked
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        if (!isExpanded) {
          centerCol.classList.add('expanded');
          bottomPanel.classList.remove('collapsed');
          tabContent.style.display = 'flex';
          if (textToggle) textToggle.innerText = 'Recolher Aba o-';
        }
        
        renderBottomTabContent(tab.getAttribute('data-tab'));
      });
    });
  }
}

// Floating hover preview visualizer
function initHoverPreview() {
  const tooltip = document.getElementById('hover-preview-tooltip');
  if (!tooltip) return;

  window.showDocPreview = function(e, docName) {
    const docData = getDocMockDetails(docName);
    
    tooltip.innerHTML = `
      <div class="tooltip-title">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
        ${docName}
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">Status:</span>
        <span class="tooltip-val" style="color: ${docData.color};">${docData.status}</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">Tamanho:</span>
        <span class="tooltip-val">${docData.size}</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">Data:</span>
        <span class="tooltip-val">${docData.date}</span>
      </div>
      <div class="tooltip-pdf-mock">
        ${docData.previewMock.replace(/\n/g, '<br>')}
      </div>
    `;

    tooltip.style.display = 'block';
    tooltip.style.opacity = '1';
    positionTooltip(e);
  };

  window.hideDocPreview = function() {
    tooltip.style.display = 'none';
    tooltip.style.opacity = '0';
  };

  window.positionTooltip = function(e) {
    const tooltipWidth = 240;
    const tooltipHeight = 180;
    let x = e.pageX + 15;
    let y = e.pageY + 15;

    if (x + tooltipWidth > window.innerWidth) {
      x = e.pageX - tooltipWidth - 15;
    }
    if (y + tooltipHeight > window.innerHeight) {
      y = e.pageY - tooltipHeight - 15;
    }

    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
  };
}

// Get mock contents and info for tooltip
function getDocMockDetails(docName) {
  const defaults = {
    status: 'Recebido',
    size: '1.2 MB',
    date: '11/05/2024',
    color: 'var(--green-primary)',
    previewMock: '[PDF DOCUMENT]\nConteúdo carregado.\nSem pendências.'
  };

  if (docName.toLowerCase().includes('cnh')) {
    return {
      status: 'Recebido (Análise)',
      size: '1.4 MB',
      date: '11/05/2024 11:20',
      color: 'var(--green-primary)',
      previewMock: 'CARTEIRA NACIONAL DE HABILITA?fO\nNome: João da Silva\nCat: AB | CPF: 382.901.884-21\nValidade: 12/2028\nStatus: Sem restrições'
    };
  } else if (docName.toLowerCase().includes('infra')) {
    return {
      status: 'Pendente Assinatura',
      size: '2.1 MB',
      date: '11/05/2024 11:21',
      color: 'var(--yellow-primary)',
      previewMock: 'NOTIFICA?fO DE INFRA?fO\n"rgão: DETRAN/SP\nAIT: 5E291029\nEnquadramento: Art. 165 (Lei Seca)\nPlaca: DKA-8239 | Defesa: Apta'
    };
  } else if (docName.toLowerCase().includes('procur')) {
    return {
      status: 'Validado',
      size: '450 KB',
      date: '10/05/2024 16:45',
      color: '#3b82f6',
      previewMock: 'PROCURA?fO AD JUDICIA\nOutorgante: João da Silva\nOutorgado: Parreira, Ferreira Adv.\nPoderes: Amplos poderes para foro\nem geral e defesa de CNH.'
    };
  } else if (docName.toLowerCase().includes('comprov')) {
    return {
      status: 'Aguardando Envio',
      size: '0 KB',
      date: 'Pendente',
      color: 'var(--yellow-primary)',
      previewMock: '[COMPROVANTE DE ENDERE?O]\nCliente sinalizou envio para\nhoje à tarde via WhatsApp.'
    };
  } else if (docName.toLowerCase().includes('recurso')) {
    return {
      status: 'Aguardando Assinatura',
      size: '1.8 MB',
      date: '10/05/2024 16:40',
      color: 'var(--yellow-primary)',
      previewMock: 'PE?A DE RECURSO ADMINISTRATIVO\nTribunal: CETRAN/SP\nMotivo: Ausência de calibragem de\netilômetro (bafômetro).'
    };
  }

  return defaults;
}

// Right sidebar tab switching (Resumo / CRM / Detalhes)
function initRightSidebarTabs() {
  // Use event delegation on document click so it works for copied templates too!
  document.addEventListener('click', (e) => {
    const tab = e.target.closest('.right-tab');
    if (tab) {
      const target = tab.getAttribute('data-rtab');
      const container = tab.closest('.right-col') || tab.closest('#crm-sidebar-container') || tab.closest('#kanban-sidebar-container');
      if (container) {
        const rightTabs = container.querySelectorAll('.right-tab');
        const rtabContents = container.querySelectorAll('.rtab-content');

        // Toggle tab active state
        rightTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Toggle content panels
        rtabContents.forEach(panel => {
          panel.classList.remove('active');
          if (panel.id.endsWith(`-${target}`)) {
            panel.classList.add('active');
          }
        });
      }
    }
  });
}

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
      if (e.target.id === 'followup-modal') {
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
      // Close followup modal if active
      const followup = document.getElementById('followup-modal');
      if (followup && followup.classList.contains('active')) {
        followup.classList.remove('active');
      }
      // Remove any other dynamic modal-overlay
      document.querySelectorAll('.modal-overlay:not(#followup-modal)').forEach(m => m.remove());
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
    
    const apreendidoBadge = lead.apreendido ? `<span style="font-size:9px; font-weight:700; background:#fef2f2; color:#dc2626; border:1px solid #fca5a5; padding:1px 4px; border-radius:3px; white-space:nowrap;">Ys- Apreendido</span>` : '';

    const row = document.createElement('tr');
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
        <div class="table-actions">
          <button class="table-action-btn report" title="Gerar Relatório" onclick="openClientReportModal(${lead.id})" style="color:var(--brand-primary); font-size:12px; border-color:rgba(96,0,20,0.2); padding: 4px 6px;">
            📋"
          </button>
          <button class="table-action-btn view" title="Ver Detalhes" onclick="openViewDetailsPanel(${lead.id})">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button class="table-action-btn edit" title="Editar" onclick="openEditLeadModal(${lead.id})">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
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
            <option value="morno" ${lead.temperatura === 'morno' ? 'selected' : ''}>s Lead Morno</option>
            <option value="frio" ${lead.temperatura === 'frio' ? 'selected' : ''}>"️ Lead Frio</option>
          </select>
        </div>

        <!-- Robot AI chatbot Switch -->
        <div style="margin-top:12px; display:flex; align-items:center; justify-content:space-between; padding:8px 12px; background:var(--bg-tertiary); border-radius:8px; border:1px solid var(--border-color);">
          <span style="font-size:11px; font-weight:600; color:var(--text-secondary);">Robô IA Automação:</span>
          <button class="btn ${lead.roboAtivo ? 'btn-yellow' : 'btn-outline-yellow'}" onclick="toggleLeadRobot(${lead.id})" style="font-size:10px; padding:3px 10px; min-width:85px; font-weight:600; text-transform:uppercase;">
            ${lead.roboAtivo ? 'YY Ativado' : '📋 Desativado'}
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
            <option value="media" ${lead.prioridade === 'media' ? 'selected' : ''}>YY Média</option>
            <option value="baixa" ${lead.prioridade === 'baixa' ? 'selected' : ''}>YY Baixa</option>
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
              <option value="parcial" ${lead.statusPagamento === 'parcial' ? 'selected' : ''}>Parcial YY</option>
              <option value="pago" ${lead.statusPagamento === 'pago' ? 'selected' : ''}>Pago Total YY</option>
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
      const prioLabel = task.prioridade === 'alta' ? '📋 Alta' : task.prioridade === 'media' ? 'YY Média' : 'YY Baixa';
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

function openNewTaskForm() {
  openEditTaskModal(null);
}

function openEditTaskModal(taskId) {
  const isNew = taskId === null;
  const task = isNew ? { id: null, titulo: '', leadId: null, prioridade: 'media', responsavelId: 1, concluida: false, prazo: '', tipo: 'Petição' } : window.mockTasks.find(t => t.id === taskId);
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
              <option value="media" ${task.prioridade === 'media' ? 'selected' : ''}>YY Média</option>
              <option value="baixa" ${task.prioridade === 'baixa' ? 'selected' : ''}>YY Baixa</option>
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
  const container = document.getElementById('controladoria-tasks-table-body');
  if (!container) return;

  const filterLawyerEl = document.getElementById('task-filter-lawyer');
  const filterLawyerVal = filterLawyerEl ? filterLawyerEl.value : 'all';
  const sortByEl = document.getElementById('task-sort-by');
  const sortBy = sortByEl ? sortByEl.value : 'none';
  const activeTab = window.currentTaskTab || 'pending';
  const today = new Date();
  today.setHours(0,0,0,0);

  // --- Carga de Trabalho ---
  const workloadContainer = document.getElementById('workload-panel');
  if (workloadContainer) {
    const lawyers = window.mockLawyers;
    workloadContainer.innerHTML = lawyers.map(l => {
      const pendingTasks = window.mockTasks.filter(t => t.responsavelId === l.id && !t.concluida).length;
      const totalCapacity = 8;
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
            <span>${Math.round(ratio)}% da capacidade</span>
          </div>
        </div>
      `;
    }).join('');
  }
  renderDeadlineWeekTimeline();
  renderControladoriaSLA();

  // Helper: calcular dias restantes até o prazo
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
    return days !== null && days <= 3;
  });

  // Update urgent tab badge
  const urgentTab = document.getElementById('task-tab-urgent');
  if (urgentTab) {
    const countSpan = urgentTab.querySelector('.urgente-badge');
    if (allUrgent.length > 0) {
      if (!countSpan) {
        urgentTab.innerHTML = `Ys Urgente <span class="urgente-badge" style="background:var(--red-primary);color:#fff;border-radius:10px;font-size:10px;padding:1px 6px;margin-left:4px;">${allUrgent.length}</span>`;
      } else {
        countSpan.textContent = allUrgent.length;
      }
    } else if (countSpan) {
      countSpan.remove();
    }
  }

  // Update summary label
  const summaryEl = document.getElementById('task-tab-summary');
  if (summaryEl) {
    const pendingCount = window.mockTasks.filter(t => !t.concluida).length;
    const completedCount = window.mockTasks.filter(t => t.concluida).length;
    summaryEl.textContent = `${pendingCount} pendentes · ${allUrgent.length} urgentes · ${completedCount} concluídas`;
  }

  container.innerHTML = '';

  // Filter tasks by tab
  let filtered = window.mockTasks.filter(task => {
    const matchLawyer = filterLawyerVal === 'all' || task.responsavelId === parseInt(filterLawyerVal);
    const days = getDaysRemaining(task.prazo);
    let matchStatus;
    if (activeTab === 'completed') {
      matchStatus = task.concluida;
    } else if (activeTab === 'urgent') {
      matchStatus = !task.concluida && days !== null && days <= 3;
    } else {
      // 'pending' 📄 all non-completed
      matchStatus = !task.concluida;
    }
    return matchLawyer && matchStatus;
  });

  // Sort tasks
  if (sortBy === 'prazo') {
    filtered.sort((a, b) => {
      const da = formatDateToISO(a.prazo) || '9999-12-31';
      const db = formatDateToISO(b.prazo) || '9999-12-31';
      return da.localeCompare(db);
    });
  } else if (sortBy === 'lawyer') {
    filtered.sort((a, b) => {
      const la = window.mockLawyers.find(l => l.id === a.responsavelId)?.name || '';
      const lb = window.mockLawyers.find(l => l.id === b.responsavelId)?.name || '';
      return la.localeCompare(lb);
    });
  } else if (sortBy === 'priority') {
    const weight = { alta: 3, media: 2, baixa: 1 };
    filtered.sort((a, b) => (weight[b.prioridade] || 0) - (weight[a.prioridade] || 0));
  } else if (activeTab === 'urgent') {
    // Auto-sort urgent by deadline ascending
    filtered.sort((a, b) => {
      const da = formatDateToISO(a.prazo) || '9999-12-31';
      const db = formatDateToISO(b.prazo) || '9999-12-31';
      return da.localeCompare(db);
    });
  }

  if (filtered.length === 0) {
    const emptyMsg = activeTab === 'urgent'
      ? 'o. Nenhum prazo urgente! Todos os prazos estão dentro do prazo.'
      : activeTab === 'completed'
      ? 'Nenhuma tarefa concluída ainda.'
      : 'Nenhuma tarefa pendente encontrada.';
    container.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center;color:var(--text-secondary);padding:24px;font-size:13px;">${emptyMsg}</td>
      </tr>
    `;
    return;
  }

  filtered.forEach(task => {
    const lawyer = window.mockLawyers.find(l => l.id === task.responsavelId) || window.mockLawyers[0];
    const client = task.leadId ? window.mockLeads.find(l => l.id === task.leadId) : null;
    const days = getDaysRemaining(task.prazo);
    
    let clientHTML = 'Geral (Sem cliente)';
    if (client) {
      clientHTML = `<a href="#" onclick="openViewDetailsPanel(${client.id}); return false;" style="color:var(--gold-primary); font-weight:600; text-decoration:underline;">${client.name}</a>`;
    }
    
    const prioClass = task.prioridade === 'alta' ? 'prio-alta' : task.prioridade === 'media' ? 'prio-media' : 'prio-baixa';
    const prioLabel = task.prioridade === 'alta' ? '📋 Alta' : task.prioridade === 'media' ? 'YY Média' : 'YY Baixa';

    // Urgency highlighting
    const isUrgent = !task.concluida && days !== null && days <= 3;
    const isOverdue = !task.concluida && days !== null && days < 0;
    
    let prazoHTML = `<strong>${task.prazo}</strong>`;
    if (isOverdue) {
      prazoHTML += `<br><span style="color:var(--red-primary);font-size:10px;font-weight:700;">s️ VENCIDO (${Math.abs(days)}d atrás)</span>`;
    } else if (isUrgent) {
      const dayLabel = days === 0 ? 'HOJE' : days === 1 ? 'AMANHf' : `em ${days} dias`;
      prazoHTML += `<br><span style="color:var(--orange-primary);font-size:10px;font-weight:700;">📋" VENCE ${dayLabel.toUpperCase()}</span>`;
    }

    const row = document.createElement('tr');
    row.style.opacity = task.concluida ? '0.7' : '1';
    if (isOverdue) row.style.backgroundColor = 'rgba(239,68,68,0.08)';
    else if (isUrgent) row.style.backgroundColor = 'rgba(245,158,11,0.07)';
    
    let actionCellHTML = '';
    if (task.concluida) {
      actionCellHTML = `
        <span style="color:var(--green-primary); font-weight:600;">o"️ Concluída</span>
        <a href="#" onclick="reopenTask(${task.id}); return false;" style="font-size:10.5px; color:var(--orange-primary); font-weight:700; margin-left:6px; text-decoration:underline;">(Reabrir)</a>
      `;
    } else {
      actionCellHTML = `
        <button class="btn btn-outline-yellow" onclick="confirmTaskCompletion(null, ${task.id})" style="padding: 4px 8px; font-size: 11px; font-weight: 700; border-radius: 4px; border:1px solid var(--border-color); color:var(--green-primary); display:flex; align-items:center; gap:4px;" title="Marcar como Concluída">
          o"️ Concluir
        </button>
      `;
    }

    row.innerHTML = `
      <td>${actionCellHTML}</td>
      <td>
        <strong style="${task.concluida ? 'text-decoration:line-through;color:var(--text-secondary);' : ''}">${task.titulo}</strong>
        ${isUrgent && !task.concluida ? `<span style="display:inline-block;margin-left:6px;background:var(--red-primary);color:#fff;border-radius:4px;font-size:9px;padding:1px 5px;font-weight:700;">URGENTE</span>` : ''}
        ${task.recorrente ? `<span class="recurring-task-badge">↻ ${task.recorrencia || 'Semanal'}</span>` : ''}
      </td>
      <td>${clientHTML}</td>
      <td><span class="table-caso-badge">${task.tipo}</span></td>
      <td><span class="task-prio-badge ${prioClass}">${prioLabel}</span></td>
      <td>
        <div class="table-responsavel">
          <div class="avatar avatar-xs">${lawyer.initials}</div>
          <span>${lawyer.name.split(' ').slice(0,2).join(' ')}</span>
        </div>
      </td>
      <td>${prazoHTML}</td>
      <td>
        <div class="table-actions">
          <button class="table-action-btn edit" title="Editar Tarefa" onclick="openEditTaskModal(${task.id})">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
          </button>
          <button class="table-action-btn delete" title="Excluir Tarefa" onclick="deleteTaskWithConfirmation(${task.id})">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
        </div>
      </td>
    `;
    container.appendChild(row);
  });
}

function renderDeadlineWeekTimeline() {
  const container = document.getElementById('deadline-week-timeline');
  if (!container) return;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });

  container.innerHTML = `
    <div class="deadline-week-header"><div><strong>📅 Timeline de prazos da semana</strong><span>Visão consolidada dos próximos 7 dias</span></div><span class="deadline-week-legend">● prazo • ↻ recorrente</span></div>
    <div class="deadline-week-grid">
      ${days.map(date => {
        const iso = date.toISOString().substring(0, 10);
        const tasks = window.mockTasks.filter(task => !task.concluida && formatDateToISO(task.prazo).substring(0, 10) === iso);
        const isToday = date.toDateString() === start.toDateString();
        return `
          <div class="deadline-day ${isToday ? 'today' : ''}">
            <div class="deadline-day-title"><span>${date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}</span><strong>${date.getDate()}</strong></div>
            <div class="deadline-day-items">
              ${tasks.map(task => `<button onclick="openEditTaskModal(${task.id})" class="deadline-task ${task.prioridade}">${task.recorrente ? '↻' : '●'} ${task.titulo}</button>`).join('') || '<span class="deadline-empty">Livre</span>'}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderControladoriaSLA() {
  const container = document.getElementById('controladoria-sla-panel');
  if (!container) return;
  const avgFirstContact = Math.round(window.mockLeads.reduce((sum, lead) => sum + Number(lead.primeiroContatoMin || 0), 0) / window.mockLeads.length);
  const pendingTasks = window.mockTasks.filter(task => !task.concluida);
  const overdue = pendingTasks.filter(task => getDaysUntil(task.prazo) < 0).length;
  const withinSLA = window.mockLeads.filter(lead => lead.primeiroContatoMin <= 10).length;
  const slaRate = Math.round((withinSLA / window.mockLeads.length) * 100);
  const completed = window.mockTasks.filter(task => task.concluida).length;
  const completionRate = Math.round((completed / window.mockTasks.length) * 100);

  container.innerHTML = `
    <div class="sla-card"><span>1º contato médio</span><strong>${avgFirstContact} min</strong><small>Meta: até 10 min</small></div>
    <div class="sla-card"><span>SLA de atendimento</span><strong>${slaRate}%</strong><small>${withinSLA}/${window.mockLeads.length} casos na meta</small></div>
    <div class="sla-card ${overdue ? 'danger' : ''}"><span>Prazos vencidos</span><strong>${overdue}</strong><small>${pendingTasks.length} tarefas abertas</small></div>
    <div class="sla-card"><span>Taxa de conclusão</span><strong>${completionRate}%</strong><small>${completed} tarefas concluídas</small></div>
  `;
}

function openRecurringTaskModal() {
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.innerHTML = `
    <div class="edit-lead-modal" style="max-width:520px;">
      <div class="modal-header"><h3>↻ Criar tarefa recorrente</h3><button class="modal-close-btn" onclick="this.closest('.modal-overlay').remove()">&times;</button></div>
      <div class="modal-body" style="padding:20px;">
        <div class="form-group" style="margin-bottom:12px;"><label>Título do template</label><input id="recurring-task-title" value="Revisar prazos ativos da carteira"></div>
        <div class="form-grid">
          <div class="form-group"><label>Responsável</label><select id="recurring-task-lawyer">${window.mockLawyers.map(lawyer => `<option value="${lawyer.id}">${lawyer.name}</option>`).join('')}</select></div>
          <div class="form-group"><label>Tipo</label><select id="recurring-task-type">${window.tiposTarefa.map(type => `<option>${type}</option>`).join('')}</select></div>
        </div>
        <div class="form-grid" style="margin-top:12px;">
          <div class="form-group"><label>Periodicidade</label><select id="recurring-task-frequency"><option value="Semanal">Semanal</option><option value="Quinzenal">Quinzenal</option><option value="Mensal">Mensal</option></select></div>
          <div class="form-group"><label>Próxima execução</label><input type="date" id="recurring-task-date" value="${nextWeek.toISOString().substring(0, 10)}"></div>
        </div>
      </div>
      <div class="modal-footer"><button class="btn btn-outline-yellow" onclick="this.closest('.modal-overlay').remove()">Cancelar</button><button class="btn btn-yellow" onclick="saveRecurringTask(this)">Ativar recorrência</button></div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function saveRecurringTask(button) {
  const overlay = button.closest('.modal-overlay');
  const title = overlay.querySelector('#recurring-task-title').value.trim();
  const lawyerId = Number(overlay.querySelector('#recurring-task-lawyer').value);
  const type = overlay.querySelector('#recurring-task-type').value;
  const frequency = overlay.querySelector('#recurring-task-frequency').value;
  const date = overlay.querySelector('#recurring-task-date').value;
  if (!title || !date) return;

  window.mockTasks.push({
    id: Math.max(0, ...window.mockTasks.map(task => task.id)) + 1,
    titulo: title,
    leadId: null,
    prioridade: 'media',
    responsavelId: lawyerId,
    concluida: false,
    prazo: formatDateToBR(date),
    tipo: type,
    recorrente: true,
    recorrencia: frequency,
    slaHoras: 12
  });
  overlay.remove();
  renderControladoriaTasks();
  showToastNotification('Recorrência ativada', `A tarefa "${title}" será criada em frequência ${frequency.toLowerCase()}.`, '↻');
}

function switchTaskTab(tabName) {
  window.currentTaskTab = tabName;
  
  const pendingTab = document.getElementById('task-tab-pending');
  const urgentTab = document.getElementById('task-tab-urgent');
  const completedTab = document.getElementById('task-tab-completed');
  
  [pendingTab, urgentTab, completedTab].forEach(t => t && t.classList.remove('active'));
  
  if (tabName === 'pending' && pendingTab) pendingTab.classList.add('active');
  else if (tabName === 'urgent' && urgentTab) urgentTab.classList.add('active');
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
window.openEditTaskModal = openEditTaskModal;
window.saveTaskChanges = saveTaskChanges;
window.deleteTaskWithConfirmation = deleteTaskWithConfirmation;
window.confirmDeleteTask = confirmDeleteTask;
window.switchTaskTab = switchTaskTab;
window.reopenTask = reopenTask;



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
      statusText.innerText = 'o" Salvo';
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

// Bind to window to allow HTML inline execution
window.openViewDetailsPanel = openViewDetailsPanel;
window.openEditLeadModal = openEditLeadModal;
window.deleteLeadWithConfirmation = deleteLeadWithConfirmation;
window.confirmDeleteLead = confirmDeleteLead;
window.toggleTask = toggleTask;
window.openTaskReassign = openTaskReassign;
window.reassignTask = reassignTask;
window.openMoveStageModal = openMoveStageModal;
window.moveLeadStage = moveLeadStage;
window.createNewTask = createNewTask;
window.saveLeadChanges = saveLeadChanges;
window.openNewTaskForm = openNewTaskForm;
window.initRightSidebarTabs = initRightSidebarTabs;
window.initCRMInteractive = initCRMInteractive;
window.initKanbanDragAndDrop = initKanbanDragAndDrop;
window.validateDocument = validateDocument;
window.simulateDocUpload = simulateDocUpload;
window.openRequestDocModal = openRequestDocModal;
window.sendDocumentRequest = sendDocumentRequest;
window.toggleLeadRobot = toggleLeadRobot;
window.saveCaseSummary = saveCaseSummary;
window.validateDocumentDirect = validateDocumentDirect;
window.toggleControladoriaTaskDirect = toggleControladoriaTaskDirect;
window.openNewTaskForLead = openNewTaskForLead;
window.updateLeadPriority = updateLeadPriority;
window.updateLeadTemperature = updateLeadTemperature;
window.updateLeadValoresPagos = updateLeadValoresPagos;
window.openFollowupModalDirect = openFollowupModalDirect;
window.toggleCustomFollowupTime = toggleCustomFollowupTime;

// Style injection for Toast Notifications
const toastStyle = document.createElement('style');
toastStyle.innerHTML = `
  .toast-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    display: flex;
    flex-direction: column;
    gap: 10px;
    pointer-events: none;
  }
  .toast-alert {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-left: 4px solid var(--gold-primary);
    border-radius: 8px;
    padding: 12px 16px;
    width: 320px;
    box-shadow: var(--shadow-lg);
    display: flex;
    gap: 12px;
    align-items: flex-start;
    animation: toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    pointer-events: auto;
    transition: all 0.2s ease;
  }
  .toast-alert.fade-out {
    animation: toastFadeOut 0.3s forwards;
  }
  .toast-icon {
    font-size: 18px;
  }
  .toast-body {
    flex: 1;
  }
  .toast-title {
    font-weight: 700;
    font-size: 12px;
    color: var(--text-primary);
    margin-bottom: 2px;
  }
  .toast-desc {
    font-size: 11px;
    color: var(--text-secondary);
    line-height: 1.3;
  }
  @keyframes toastSlideIn {
    from { transform: translateX(120%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes toastFadeOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(120%); opacity: 0; }
  }
`;
document.head.appendChild(toastStyle);

function showToastNotification(title, desc, icon = '✅') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  
  const toast = document.createElement('div');
  toast.className = 'toast-alert';
  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      <div class="toast-desc">${desc}</div>
    </div>
  `;
  
  container.appendChild(toast);
  
  // Auto-remove
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function simulatePaymentLink(leadId) {
  const lead = window.mockLeads.find(l => l.id === leadId);
  if (!lead) return;
  
  const value = lead.valorCausa * 0.3; // 30% causa value
  const link = `https://pfa.pagar.me/checkout/invoice_lead_${leadId}_${Math.floor(Math.random()*90000+10000)}`;
  
  // Copy to clipboard
  navigator.clipboard.writeText(link).then(() => {
    showToastNotification('Link de Cobrança Gerado', `Link copiado para a área de transferência! (Valor: R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits:2})}) ✅`, '✅');
  }).catch(() => {
    showToastNotification('Link de Cobrança Gerado', `Valor: R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits:2})} ✅`, '✅');
  });
  
  // Update timeline
  lead.timeline.unshift({
    time: new Date().toLocaleString('pt-BR').substring(0,10),
    type: 'Sistema',
    title: 'Cobrança Gerada',
    desc: `Link de cobrança gerado: R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits:2})}`
  });
  
  // Push WhatsApp message
  lead.messages.push({
    sender: 'bot',
    text: `Olá ${lead.name.split(' ')[0]}! Para formalizar a contratação e dar início ao seu recurso, geramos o link de pagamento dos honorários. VocÃªÃªÃªê pode efetuar o PIX ou parcelamento no cartão por aqui: ${link}`,
    time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    read: true
  });
  
  openViewDetailsPanel(leadId);
  if (typeof renderChatArea === 'function') renderChatArea();
  showToastNotification('Cobrança Enviada', `Mensagem com link de pagamento disparada para o WhatsApp de ${lead.name}. o?️`, '🚨');
}

const webhookLogHistory = [
  '19:20:01 - Webhook recebido de WAHA (11) 98942-8923 z" n8n [OK]',
  '19:20:04 - Classificação Gemini IA: "Lei Seca" (Lead Quente) z" NocoDB [OK]',
  '19:20:05 - Resposta automática WAHA enviada z" [OK]',
  '19:21:12 - Webhook recebido de WAHA (19) 99887-7665 z" n8n [OK]',
  '19:21:15 - Classificação Gemini IA: "CNH Suspensa" (Lead Morno) z" NocoDB [OK]',
  '19:21:17 - Resposta automática WAHA enviada z" [OK]'
];

function renderWebhookLogs() {
  const container = document.getElementById('waha-webhook-logs');
  if (!container) return;
  
  container.innerHTML = webhookLogHistory.map(line => `<div>${line}</div>`).join('');
  container.scrollTop = container.scrollHeight;
}

function startWebhookLogSimulation() {
  const actions = [
    'Webhook recebido de WAHA (11) 99999-9999 z" n8n [OK]',
    'Classificação Gemini IA: "Lei Seca" (Lead Quente) z" NocoDB [OK]',
    'Resposta automática WAHA enviada z" [OK]',
    'Webhook recebido de WAHA (13) 99776-6554 z" n8n [OK]',
    'Classificação Gemini IA: "CNH Cassada" (Lead Quente) z" NocoDB [OK]',
    'Resposta automática WAHA enviada z" [OK]',
    'Agendador n8n: Lembrete de follow-up disparado via WAHA para Maria Oliveira z" [OK]',
    'Webhook de pagamento Asaas: R$ 1.500,00 recebido de João da Silva z" NocoDB [OK]',
    'Atualização de status: João da Silva z" Etapa: Protocolo [OK]'
  ];
  
  setInterval(() => {
    const time = new Date().toLocaleTimeString('pt-BR');
    const action = actions[Math.floor(Math.random() * actions.length)];
    webhookLogHistory.push(`${time} - ${action}`);
    
    if (webhookLogHistory.length > 25) webhookLogHistory.shift();
    
    renderWebhookLogs();
  }, 12000);
}

function initSimulationIntervals() {
  const alerts = [
    { title: 'Novo Lead de WhatsApp', desc: 'Roberto Santos classificado como "Lei Seca" via n8n webhook. 📋', icon: '📋' },
    { title: 'IA n8n Validação', desc: 'Documento CNH_Joao.pdf validado automaticamente pela API. o"', icon: 'Y-' },
    { title: 'Follow-up IA Enviado', desc: 'Mensagem de cobrança enviada no WhatsApp de Maria Oliveira. ⚠️', icon: 'Y-' },
    { title: 'Pagamento Detectado', desc: 'Cliente Carlos Mendes efetuou pagamento dos honorários via PIX! ✅', icon: '✅' },
    { title: 'Lead Reatribuído', desc: 'Lead "Lucas Rocha" reatribuído automaticamente para Dr. Severton. ✅', icon: '📋"' },
    { title: 'Robô IA Pausado', desc: 'Conversa com João da Silva assumida manualmente pelo Dr. Luis. ✅', icon: '⏸️' }
  ];
  
  setTimeout(() => {
    const alert = alerts[0];
    showToastNotification(alert.title, alert.desc, alert.icon);
  }, 10000);

  setInterval(() => {
    const alert = alerts[Math.floor(Math.random() * alerts.length)];
    showToastNotification(alert.title, alert.desc, alert.icon);
  }, 35000);
}

window.showToastNotification = showToastNotification;
window.simulatePaymentLink = simulatePaymentLink;
window.renderWebhookLogs = renderWebhookLogs;
window.startWebhookLogSimulation = startWebhookLogSimulation;
window.initSimulationIntervals = initSimulationIntervals;

function calculateFinanceFicha(leadId) {
  const totalInput = document.getElementById('ficha-fin-totais');
  const pagoInput = document.getElementById('ficha-fin-pago');
  const restanteInput = document.getElementById('ficha-fin-restante');
  const statusSelect = document.getElementById('ficha-fin-status');
  
  if (!totalInput || !pagoInput || !restanteInput) return;
  
  const total = parseFloat(totalInput.value) || 0;
  const pago = parseFloat(pagoInput.value) || 0;
  const restante = Math.max(0, total - pago);
  
  restanteInput.value = restante.toFixed(2);
  
  if (statusSelect) {
    if (pago >= total && total > 0) {
      statusSelect.value = 'pago';
    } else if (pago > 0) {
      statusSelect.value = 'parcial';
    } else {
      statusSelect.value = 'pendente';
    }
  }
}

function saveFinanceFicha(leadId, button) {
  const lead = window.mockLeads.find(l => l.id === leadId);
  if (!lead) return;
  
  const total = parseFloat(document.getElementById('ficha-fin-totais').value) || 0;
  const pago = parseFloat(document.getElementById('ficha-fin-pago').value) || 0;
  const vencimento = document.getElementById('ficha-fin-vencimento').value;
  const status = document.getElementById('ficha-fin-status').value;
  
  lead.valorHonorarios = total;
  lead.valoresPagos = pago;
  lead.prazoPagamento = vencimento;
  lead.statusPagamento = status;
  
  lead.timeline.unshift({
    time: new Date().toLocaleString('pt-BR').substring(0, 10),
    type: 'Advogado',
    title: 'Financeiro Atualizado',
    desc: `Honorários Totais: R$ ${total.toLocaleString('pt-BR', {minimumFractionDigits:2})}, Pago: R$ ${pago.toLocaleString('pt-BR', {minimumFractionDigits:2})}, Status: ${status.toUpperCase()}`
  });
  
  showToastNotification('Financeiro Salvo', `Dados de ${lead.name} atualizados com sucesso! ✅`, '✅');
  
  renderCRMLeadsTable();
  if (document.getElementById('kanban-board-container')) {
    renderFullKanbanScreen();
  }
  
  if (button) {
    button.innerText = 'o" Salvo!';
    button.style.backgroundColor = 'var(--green-primary)';
    button.style.color = '#ffffff';
    setTimeout(() => {
      button.innerText = '✅ Salvar Financeiro do Caso';
      button.style.backgroundColor = '';
      button.style.color = '';
      openViewDetailsPanel(leadId);
    }, 1000);
  }
}

function calculateFinanceRightSidebar() {
  let context = document.querySelector('.main-content-panel .screen-panel.active');
  if (!context) context = document.body;
  
  const totalInput = context.querySelector('#fin-honorarios') || document.querySelector('#fin-honorarios');
  const pagoInput = context.querySelector('#fin-pago') || document.querySelector('#fin-pago');
  const restanteInput = context.querySelector('#fin-restante') || document.querySelector('#fin-restante');
  const statusSelect = context.querySelector('#fin-status') || document.querySelector('#fin-status');
  
  if (!totalInput || !pagoInput) return;
  
  const total = parseFloat(totalInput.value) || 0;
  const pago = parseFloat(pagoInput.value) || 0;
  const restante = Math.max(0, total - pago);
  
  if (restanteInput) restanteInput.value = restante.toFixed(2);
  
  if (statusSelect) {
    if (pago >= total && total > 0) {
      statusSelect.value = 'pago';
    } else if (pago > 0) {
      statusSelect.value = 'parcial';
    } else {
      statusSelect.value = 'pendente';
    }
  }
}

function saveFinanceRightSidebar() {
  const lead = getCurrentLead();
  if (!lead) return;
  
  let context = document.querySelector('.main-content-panel .screen-panel.active');
  if (!context) context = document.body;
  
  const totalInput = context.querySelector('#fin-honorarios') || document.querySelector('#fin-honorarios');
  const pagoInput = context.querySelector('#fin-pago') || document.querySelector('#fin-pago');
  const vencimentoInput = context.querySelector('#fin-data-pagamento') || document.querySelector('#fin-data-pagamento');
  const statusSelect = context.querySelector('#fin-status') || document.querySelector('#fin-status');
  
  const total = parseFloat(totalInput.value) || 0;
  const pago = parseFloat(pagoInput.value) || 0;
  const vencimento = vencimentoInput ? vencimentoInput.value : '';
  const status = statusSelect ? statusSelect.value : 'pendente';
  
  lead.valorHonorarios = total;
  lead.valoresPagos = pago;
  lead.prazoPagamento = vencimento;
  lead.statusPagamento = status;
  
  // Log to timeline
  lead.timeline.unshift({
    time: new Date().toLocaleString('pt-BR').substring(0, 10),
    type: 'Advogado',
    title: 'Financeiro Atualizado',
    desc: `Honorários Totais: R$ ${total.toLocaleString('pt-BR', {minimumFractionDigits:2})}, Pago: R$ ${pago.toLocaleString('pt-BR', {minimumFractionDigits:2})}, Status: ${status.toUpperCase()}`
  });
  
  showToastNotification('Financeiro Salvo', `Dados de ${lead.name} atualizados! ✅`, '✅');
  
  renderCRMLeadsTable();
  if (document.getElementById('kanban-board-container')) {
    renderFullKanbanScreen();
  }
  
  if (typeof renderChatArea === 'function') renderChatArea();
  renderRightSidebar();
  
  if (context.id === 'screen-crm') {
    renderFullCRMSidebar();
    // Re-fill values on cloned sidebar
    const clonedTotal = document.querySelector('#crm-sidebar-container #fin-honorarios');
    const clonedPago = document.querySelector('#crm-sidebar-container #fin-pago');
    const clonedRestante = document.querySelector('#crm-sidebar-container #fin-restante');
    const clonedVencimento = document.querySelector('#crm-sidebar-container #fin-data-pagamento');
    const clonedStatus = document.querySelector('#crm-sidebar-container #fin-status');
    if (clonedTotal) {
      clonedTotal.value = total.toFixed(2);
      clonedPago.value = pago.toFixed(2);
      clonedRestante.value = (total - pago).toFixed(2);
      clonedVencimento.value = vencimento;
      clonedStatus.value = status;
    }
  }
}

function toggleCustomTaskTypeField(val) {
  const customGroup = document.getElementById('custom-task-type-group');
  if (customGroup) {
    customGroup.style.display = val === 'Outro' ? 'block' : 'none';
  }
}

function filterChatsByStatus(status, button) {
  window.currentChatFilter = status;
  
  const buttons = document.querySelectorAll('.chat-filter-btn');
  buttons.forEach(btn => {
    btn.classList.remove('active');
    btn.style.background = 'var(--bg-secondary)';
    btn.style.color = 'var(--text-secondary)';
    btn.style.borderColor = 'var(--border-color)';
  });
  
  if (button) {
    button.classList.add('active');
    button.style.background = 'var(--bg-tertiary)';
    button.style.color = 'var(--text-primary)';
    button.style.borderColor = 'var(--gold-primary)';
  }
  
  const searchInput = document.getElementById('search-conversations');
  renderChatList(searchInput ? searchInput.value : '');
}

window.calculateFinanceFicha = calculateFinanceFicha;
window.saveFinanceFicha = saveFinanceFicha;
window.calculateFinanceRightSidebar = calculateFinanceRightSidebar;
window.saveFinanceRightSidebar = saveFinanceRightSidebar;
window.toggleCustomTaskTypeField = toggleCustomTaskTypeField;
window.filterChatsByStatus = filterChatsByStatus;

/* ==========================================================================
   FINANCIAL SCREEN RENDERING & ACTIONS
   ========================================================================== */
function renderFinanceiroScreen() {
  const statsContainer = document.getElementById('finance-stats-grid');
  const expensesContainer = document.getElementById('office-expenses-table-body');
  const alertsContainer = document.getElementById('finance-alerts-table-body');
  const receivablesContainer = document.getElementById('client-receivables-table-body');
  
  if (!statsContainer) return;
  
  // 1. Calculations
  const prevHonorarios = window.mockLeads.reduce((acc, l) => acc + (l.valorHonorarios || (l.valorCausa * 0.3) || 1500), 0);
  const recHonorarios = window.mockLeads.reduce((acc, l) => acc + (l.valoresPagos || 0), 0);
  
  const spendMarketing = window.officeExpenses.filter(e => e.categoria === 'Marketing').reduce((acc, e) => acc + e.valor, 0);
  const spendApps = window.officeExpenses.filter(e => e.categoria === 'Aplicativos').reduce((acc, e) => acc + e.valor, 0);
  const totalSpend = window.officeExpenses.reduce((acc, e) => acc + Number(e.valor || 0), 0);
  const successFees = window.mockLeads.reduce((acc, lead) => acc + Number(lead.honorariosExito || 0), 0);
  
  const netProfit = recHonorarios - totalSpend;
  
  // 2. Populate Metrics
  statsContainer.innerHTML = `
    <div class="stat-card">
      <div class="stat-header">Honorários Previstos <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
      <div class="stat-val">R$ ${prevHonorarios.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
      <div class="stat-footer neutral">Contas a Receber</div>
    </div>
    <div class="stat-card">
      <div class="stat-header">Honorários Recebidos <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg></div>
      <div class="stat-val" style="color:var(--green-primary);">R$ ${recHonorarios.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
      <div class="stat-footer up">Realizado no caixa</div>
    </div>
    <div class="stat-card">
      <div class="stat-header">Investimento Marketing <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h20M20 5v14M4 5v14M12 5v14"/></svg></div>
      <div class="stat-val" style="color:var(--orange-primary);">R$ ${spendMarketing.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
      <div class="stat-footer neutral">Ads e Captação</div>
    </div>
    <div class="stat-card">
      <div class="stat-header">Ferramentas & Apps <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 8v8M8 12h8"/></svg></div>
      <div class="stat-val" style="color:var(--orange-primary);">R$ ${spendApps.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
      <div class="stat-footer neutral">n8n, WAHA, OpenAI</div>
    </div>
    <div class="stat-card">
      <div class="stat-header">Margem Líquida Real <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg></div>
      <div class="stat-val" style="color:${netProfit >= 0 ? 'var(--green-primary)' : 'var(--red-primary)'}; font-weight: 700;">R$ ${netProfit.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
      <div class="stat-footer up">Lucro Caixa Realizado</div>
    </div>
    <div class="stat-card">
      <div class="stat-header">Honorários de Êxito</div>
      <div class="stat-val" style="color:var(--gold-primary);">${formatCurrency(successFees)}</div>
      <div class="stat-footer neutral">Separados dos honorários iniciais</div>
    </div>
  `;
  renderFinanceAnalytics({ prevHonorarios, recHonorarios, spendMarketing, totalSpend, netProfit });
  
  // --- 2b. DRE & Forecast Chart ---
  const dreContainer = document.getElementById('finance-dre-content');
  if (dreContainer) {
    dreContainer.innerHTML = `
      <div class="fin-dre-row receita">
        <span>Honorários Recebidos</span>
        <span>+ R$ ${recHonorarios.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
      </div>
      <div class="fin-dre-row despesa">
        <span>Despesas Fixas e Variáveis</span>
        <span>- R$ ${totalSpend.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
      </div>
      <div class="fin-dre-row despesa">
        <span>Impostos Estimados (4.5%)</span>
        <span>- R$ ${(recHonorarios * 0.045).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
      </div>
      <div class="fin-dre-row total ${netProfit >= 0 ? 'lucro' : 'prejuizo'}">
        <span>Resultado Líquido</span>
        <span>R$ ${(netProfit - (recHonorarios * 0.045)).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
      </div>
    `;
  }
  
  const chartContainer = document.getElementById('finance-forecast-chart');
  if (chartContainer) {
    const months = ['Mês Atual', 'Mês +1', 'Mês +2', 'Mês +3'];
    const values = [recHonorarios, recHonorarios * 1.15, recHonorarios * 1.35, recHonorarios * 1.5];
    const maxVal = Math.max(...values, 1000);
    chartContainer.innerHTML = months.map((m, i) => `
      <div class="fin-chart-bar-group">
        <div class="fin-chart-bar positive" style="height: ${(values[i]/maxVal)*100}%;" title="R$ ${values[i].toLocaleString('pt-BR')}"></div>
        <span class="fin-chart-label">${m}</span>
        <span class="fin-chart-value">${(values[i]/1000).toFixed(1)}k</span>
      </div>
    `).join('');
  }

  // 3. Office Expenses Table
  if (expensesContainer) {
    expensesContainer.innerHTML = window.officeExpenses.map(e => `
      <tr>
        <td>
          <input type="text" value="${e.descricao}" data-prev="${e.descricao}" onchange="confirmFinanceChange('expense', ${e.id}, 'descricao', this.value, this.dataset.prev, this)" style="width:100%; padding:4px; border:1px solid var(--border-color); border-radius:4px; background:var(--bg-tertiary); color:var(--text-primary); font-weight:700;">
        </td>
        <td>
          <select data-prev="${e.categoria}" onchange="confirmFinanceChange('expense', ${e.id}, 'categoria', this.value, this.dataset.prev, this)" style="padding:4px; border:1px solid var(--border-color); border-radius:4px; background:var(--bg-tertiary); color:var(--text-primary); font-size:11.5px; font-weight:600;">
            <option value="Marketing" ${e.categoria === 'Marketing' ? 'selected' : ''}>Marketing</option>
            <option value="Aplicativos" ${e.categoria === 'Aplicativos' ? 'selected' : ''}>Aplicativos</option>
            <option value="Honorários" ${e.categoria === 'Honorários' ? 'selected' : ''}>Honorários</option>
            <option value="Geral" ${e.categoria === 'Geral' ? 'selected' : ''}>Geral</option>
          </select>
        </td>
        <td>
          <input type="text" value="${e.data}" data-prev="${e.data}" onchange="confirmFinanceChange('expense', ${e.id}, 'data', this.value, this.dataset.prev, this)" style="width:100px; padding:4px; border:1px solid var(--border-color); border-radius:4px; background:var(--bg-tertiary); color:var(--text-primary); text-align:center;">
        </td>
        <td>
          <input type="number" step="0.01" value="${e.valor.toFixed(2)}" data-prev="${e.valor}" onchange="confirmFinanceChange('expense', ${e.id}, 'valor', this.value, this.dataset.prev, this)" style="width:90px; padding:4px; border:1px solid var(--border-color); border-radius:4px; background:var(--bg-tertiary); color:var(--red-primary); font-weight:700; text-align:right;">
        </td>
        <td>
          <button class="table-action-btn delete" onclick="deleteExpenseWithConfirmation(${e.id})" style="border:none; background:none; cursor:pointer; color:var(--red-primary); display:inline-flex; align-items:center; justify-content:center;" title="Excluir Despesa">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="5" style="text-align:center;">Nenhuma despesa cadastrada.</td></tr>';
  }
  
  // 4. Render Follow-up Section Content
  renderFinanceFollowupContent();
  
  // 5. Receivables Table
  if (receivablesContainer) {
    receivablesContainer.innerHTML = window.mockLeads.map(l => {
      const honVal = l.valorHonorarios || (l.valorCausa * 0.3) || 1500;
      const pagoVal = l.valoresPagos || 0;
      const restVal = Math.max(0, honVal - pagoVal);
      
      const statusText = l.statusPagamento || (pagoVal >= honVal ? 'pago' : pagoVal > 0 ? 'parcial' : 'pendente');
      const risk = getPaymentRisk(l);
      
      return `
        <tr>
          <td><strong>${l.name}</strong><br><span style="font-size:10px; color:var(--text-secondary);">${l.tipoCaso}</span></td>
          <td>
            <input type="number" step="0.01" value="${honVal.toFixed(2)}" data-prev="${honVal}" onchange="confirmFinanceChange('client', ${l.id}, 'valorHonorarios', this.value, this.dataset.prev, this)" style="width:100px; padding:4px; border:1px solid var(--border-color); border-radius:4px; background:var(--bg-tertiary); color:var(--text-primary); font-weight:700;">
          </td>
          <td>
            <input type="number" step="0.01" value="${pagoVal.toFixed(2)}" data-prev="${pagoVal}" onchange="confirmFinanceChange('client', ${l.id}, 'valoresPagos', this.value, this.dataset.prev, this)" style="width:100px; padding:4px; border:1px solid var(--border-color); border-radius:4px; background:var(--bg-tertiary); color:var(--green-primary); font-weight:700;">
          </td>
          <td style="color:var(--red-primary); font-weight:700; padding-top:12px;">R$ ${restVal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
          <td>
            <input type="date" value="${l.prazoPagamento || ''}" data-prev="${l.prazoPagamento || ''}" onchange="confirmFinanceChange('client', ${l.id}, 'prazoPagamento', this.value, this.dataset.prev, this)" style="padding:4px; border:1px solid var(--border-color); border-radius:4px; background:var(--bg-tertiary); color:var(--text-primary); font-size:11.5px;">
          </td>
          <td>
            <select data-prev="${statusText}" onchange="confirmFinanceChange('client', ${l.id}, 'statusPagamento', this.value, this.dataset.prev, this)" style="padding:4px; border:1px solid var(--border-color); border-radius:4px; background:var(--bg-tertiary); color:var(--text-primary); font-size:11.5px; font-weight:600;">
              <option value="pendente" ${statusText === 'pendente' ? 'selected' : ''}>Pendente 📋</option>
              <option value="parcial" ${statusText === 'parcial' ? 'selected' : ''}>Parcial YY</option>
              <option value="pago" ${statusText === 'pago' ? 'selected' : ''}>Pago Total YY</option>
            </select>
          </td>
          <td><span class="inadimplencia-score ${risk.className}">${risk.icon} ${risk.label}</span></td>
          <td>
            <div style="display:flex; gap:8px;">
              <button class="btn btn-outline-yellow" onclick="openReceivablePaymentModal(${l.id})" style="font-size:10.5px; padding:3px 6px; font-weight:700;">✅ Receber</button>
              <button class="btn btn-outline-orange" onclick="openViewDetailsPanel(${l.id})" style="font-size:10.5px; padding:3px 6px;">📋 Ver Ficha</button>
              <button class="btn btn-outline-yellow" onclick="openClientReportModal(${l.id})" style="font-size:10.5px; padding:3px 6px;" title="Gerar Relatório">📋" Relatório</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }
}

function openNewExpenseModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.innerHTML = `
    <div class="edit-lead-modal" style="max-width: 400px;">
      <div class="modal-header">
        <h3>✅ Lançar Nova Despesa</h3>
        <button class="modal-close-btn" onclick="this.closest('.modal-overlay').remove()">&times;</button>
      </div>
      <div class="modal-body" style="padding: 20px;">
        <div class="form-group" style="margin-bottom: 12px;">
          <label>Descrição</label>
          <input type="text" id="exp-desc" placeholder="Ex: Anúncios Facebook Google Ads">
        </div>
        <div class="form-grid" style="margin-bottom: 12px;">
          <div class="form-group">
            <label>Categoria</label>
            <select id="exp-cat">
              <option value="Marketing">Marketing</option>
              <option value="Aplicativos">Aplicativos</option>
              <option value="Outros">Outros</option>
            </select>
          </div>
          <div class="form-group">
            <label>Valor (R$)</label>
            <input type="number" id="exp-val" step="0.01" placeholder="0.00">
          </div>
        </div>
        <div class="form-group">
          <label>Data</label>
          <input type="date" id="exp-date" value="${new Date().toISOString().substring(0, 10)}">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline-yellow" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
        <button class="btn btn-yellow" onclick="saveNewExpense(this)">✅ Salvar Despesa</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function saveNewExpense(button) {
  const overlay = button.closest('.modal-overlay');
  if (!overlay) return;
  
  const desc = overlay.querySelector('#exp-desc').value;
  const cat = overlay.querySelector('#exp-cat').value;
  const val = parseFloat(overlay.querySelector('#exp-val').value) || 0;
  const dateVal = overlay.querySelector('#exp-date').value;
  
  if (!desc.trim() || val <= 0) {
    alert('Por favor, preencha a descrição e um valor válido.');
    return;
  }
  
  const dateFormatted = dateVal.split('-').reverse().join('/');
  
  const newId = Math.max(...window.officeExpenses.map(e => e.id)) + 1;
  window.officeExpenses.push({
    id: newId,
    descricao: desc,
    categoria: cat,
    data: dateFormatted,
    valor: val
  });
  
  overlay.remove();
  showToastNotification('Despesa Lançada', `Despesa "${desc}" cadastrada com sucesso!`, '✅');
  renderFinanceiroScreen();
}

function openReceivablePaymentModal(leadId) {
  const lead = window.mockLeads.find(l => l.id === leadId);
  if (!lead) return;
  
  const honVal = lead.valorHonorarios || (lead.valorCausa * 0.3) || 1500;
  const pagoVal = lead.valoresPagos || 0;
  const outstanding = honVal - pagoVal;
  
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.innerHTML = `
    <div class="edit-lead-modal" style="max-width: 400px;">
      <div class="modal-header">
        <h3>✅ Registrar Recebimento</h3>
        <button class="modal-close-btn" onclick="this.closest('.modal-overlay').remove()">&times;</button>
      </div>
      <div class="modal-body" style="padding: 20px;">
        <div style="font-size:11.5px; background:var(--bg-tertiary); padding:10px; border-radius:6px; margin-bottom:12px; border:1px solid var(--border-color);">
          <strong>Cliente:</strong> ${lead.name}<br>
          <strong>Total Honorários:</strong> R$ ${honVal.toLocaleString('pt-BR')}<br>
          <strong>Restante a Receber:</strong> R$ ${outstanding.toLocaleString('pt-BR')}
        </div>
        <div class="form-group">
          <label>Valor Recebido (R$)</label>
          <input type="number" id="rec-amount" step="0.01" value="${outstanding}" style="width:100%;">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline-yellow" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
        <button class="btn btn-yellow" onclick="saveReceivablePayment(${leadId}, this)">✅ Confirmar Recebimento</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function saveReceivablePayment(leadId, button) {
  const overlay = button.closest('.modal-overlay');
  if (!overlay) return;
  
  const amount = parseFloat(overlay.querySelector('#rec-amount').value) || 0;
  const lead = window.mockLeads.find(l => l.id === leadId);
  
  if (lead && amount > 0) {
    lead.valoresPagos = (lead.valoresPagos || 0) + amount;
    
    const honVal = lead.valorHonorarios || (lead.valorCausa * 0.3) || 1500;
    if (lead.valoresPagos >= honVal) {
      lead.statusPagamento = 'pago';
    } else {
      lead.statusPagamento = 'parcial';
    }
    
    lead.timeline.unshift({
      time: new Date().toLocaleString('pt-BR').substring(0, 10),
      type: 'Advogado',
      title: 'Pagamento Recebido',
      desc: `RecebimentoÃ©Ã©Ã© de R$ ${amount.toLocaleString('pt-BR', {minimumFractionDigits: 2})} registrado.`
    });
    
    showToastNotification('Recebimento Salvo', `Pagamento de ${lead.name} registrado com sucesso! ✅`, '✅');
    overlay.remove();
    renderFinanceiroScreen();
  }
}

function triggerFinanceCobranca(leadId) {
  simulatePaymentLink(leadId);
  showToastNotification('WhatsApp Disparado', 'Mensagem de cobrança automática com link de pagamento enviada! 🚨', '🚨');
  
  const lead = window.mockLeads.find(l => l.id === leadId);
  if (lead) {
    lead.timeline.unshift({
      time: new Date().toLocaleString('pt-BR').substring(0, 10),
      type: 'Sistema',
      title: 'Cobrança WhatsApp',
      desc: 'Lembrete de follow-up financeiro enviado automaticamente.'
    });
    renderFinanceiroScreen();
  }
}

/* ==========================================================================
   DOCUMENT VIEWPORT TOGGLE & DRAG AND DROP
   ========================================================================== */
function toggleDocsSidebar() {
  const container = document.getElementById('docs-details-container');
  const btn = document.getElementById('btn-toggle-docs-sidebar');
  if (container) {
    container.classList.toggle('collapsed');
    const isCollapsed = container.classList.contains('collapsed');
    if (btn) {
      btn.innerText = isCollapsed ? '-? Detalhes' : '- Ocultar';
    }
  }
}

function handleDragOver(e) {
  e.preventDefault();
  const zone = document.getElementById('docs-drag-drop-zone');
  if (zone) zone.classList.add('dragover');
}

function handleDragLeave(e) {
  const zone = document.getElementById('docs-drag-drop-zone');
  if (zone) zone.classList.remove('dragover');
}

function handleFileDrop(e) {
  e.preventDefault();
  const zone = document.getElementById('docs-drag-drop-zone');
  if (zone) zone.classList.remove('dragover');
  
  const files = e.dataTransfer.files;
  if (files.length === 0) return;
  
  const file = files[0];
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    showToastNotification('Formato Inválido', 'Apenas arquivos PDF são aceitos para upload! ❌', '❌');
    return;
  }
  
  const lead = getCurrentLead();
  if (!lead) return;
  
  const sizeMB = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
  const newDoc = {
    name: file.name,
    folder: currentDocFolder || 'pessoais',
    status: 'Recebido',
    size: sizeMB,
    date: new Date().toLocaleString('pt-BR').substring(0, 16),
    author: 'Advogado (Local)'
  };
  
  lead.documentos.push(newDoc);
  
  lead.timeline.unshift({
    time: new Date().toLocaleString('pt-BR').substring(0, 10),
    type: 'Advogado',
    title: 'Upload Realizado',
    desc: `Documento ${file.name} carregado via drag-and-drop`
  });
  
  showToastNotification('Upload Concluído', `${file.name} adicionado com sucesso! o"`, '📋');
  
  if (typeof renderDocumentsTable === 'function') renderDocumentsTable();
  if (typeof renderBottomTabContent === 'function') renderBottomTabContent('documentos');
}

/* ==========================================================================
   CHAT WINDOW NOTE & PROMPT PERSISTENCE
   ========================================================================== */
function saveClientNotes(leadId) {
  const lead = window.mockLeads.find(l => l.id === leadId);
  const text = document.getElementById('chat-client-notes').value;
  if (lead) {
    lead.notasCustom = text;
    lead.timeline.unshift({
      time: new Date().toLocaleString('pt-BR').substring(0, 10),
      type: 'Advogado',
      title: 'Nota Salva',
      desc: 'Observação interna adicionada pelo advogado.'
    });
    showToastNotification('Nota Salva', 'Anotações internas gravadas com sucesso! 📋', '📋');
    renderBottomTabContent('notas');
    renderRightSidebar();
  }
}

function saveClientPromptFromChat(leadId) {
  const lead = window.mockLeads.find(l => l.id === leadId);
  const promptVal = document.getElementById('chat-client-prompt').value;
  if (lead) {
    lead.promptCustom = promptVal;
    lead.timeline.unshift({
      time: new Date().toLocaleString('pt-BR').substring(0, 10),
      type: 'Advogado',
      title: 'Prompt IA Salvo',
      desc: 'Instruções da IA personalizadas pelo chat.'
    });
    showToastNotification('Prompt IA Salvo', 'Instruções IA gravadas com sucesso! 🚨', '🚨');
    renderBottomTabContent('automacoes');
    renderRightSidebar();
  }
}

function toggleControladoriaTaskDirect(leadId, taskId) {
  const task = window.mockTasks.find(t => t.id === taskId);
  if (task) {
    task.concluida = !task.concluida;
    showToastNotification('Tarefa Atualizada', `Tarefa "${task.titulo}" marcada como ${task.concluida ? 'concluída' : 'pendente'}.`, '📋');
    
    const lead = window.mockLeads.find(l => l.id === leadId);
    if (lead) {
      lead.timeline.unshift({
        time: new Date().toLocaleString('pt-BR').substring(0, 10),
        type: 'Advogado',
        title: task.concluida ? 'Tarefa Concluída' : 'Tarefa Pendente',
        desc: `Tarefa "${task.titulo}" marcada como ${task.concluida ? 'concluída' : 'pendente'}`
      });
    }
    
    renderBottomTabContent('atividades');
    if (typeof renderControladoriaTasks === 'function') renderControladoriaTasks();
  }
}

function openNewTaskForLead(leadId) {
  openEditTaskModal(null);
  const clientSelect = document.getElementById('edit-task-client');
  if (clientSelect) {
    clientSelect.value = leadId.toString();
  }
}

function sendDocumentRequest(leadId) {
  const lead = window.mockLeads.find(l => l.id === leadId);
  if (!lead) return;
  
  lead.timeline.unshift({
    time: new Date().toLocaleString('pt-BR').substring(0, 10),
    type: 'Sistema',
    title: 'Solicitação WhatsApp',
    desc: 'Lembrete de documentos pendentes disparado pelo advogado.'
  });
  
  lead.messages.push({
    sender: 'bot',
    text: 'Olá! Passando para lembrar que ainda precisamos do envio dos seus documentos pendentes para dar andamento ao seu caso. VocÃªÃªÃªê pode enviar por aqui.',
    time: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}),
    read: true
  });
  
  showToastNotification('WhatsApp Disparado', 'Solicitação de documentos enviada por WhatsApp! 🚨', '🚨');
  
  if (typeof renderChatArea === 'function') renderChatArea();
  renderBottomTabContent('documentos');
}

function downloadChatFile(fileName) {
  const dummyContent = `Documento Simulado PFA Advogados - ${fileName}\nData de geração: ${new Date().toLocaleString()}`;
  const blob = new Blob([dummyContent], { type: 'application/octet-stream' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
  showToastNotification('Download Concluído', `Arquivo "${fileName}" salvo com sucesso! 📋`, '📋');
}

function toggleChatMaximization() {
  const conversasScreen = document.getElementById('screen-conversas');
  const btn = document.getElementById('btn-maximize-chat');
  if (conversasScreen) {
    conversasScreen.classList.toggle('maximize-chat');
    const isMax = conversasScreen.classList.contains('maximize-chat');
    if (btn) {
      btn.innerHTML = isMax ? 
        `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minimize"><path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M16 3v3a2 2 0 0 0 2 2h3"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/></svg> Abrir Detalhes` : 
        `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-fullscreen"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/></svg> Foco no Chat`;
    }
  }
}

function triggerFileInputClick() {
  const fileInput = document.getElementById('docs-hidden-file-input');
  if (fileInput) fileInput.click();
}

function handleFileSelect(e) {
  const files = e.target.files;
  if (files.length === 0) return;
  const file = files[0];
  
  const lead = getCurrentLead();
  if (!lead) return;
  
  const sizeMB = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
  const newDoc = {
    name: file.name,
    folder: currentDocFolder || 'pessoais',
    status: 'Recebido',
    size: sizeMB,
    date: new Date().toLocaleString('pt-BR').substring(0, 16),
    author: 'Advogado (Local)'
  };
  
  lead.documentos.push(newDoc);
  
  lead.timeline.unshift({
    time: new Date().toLocaleString('pt-BR').substring(0, 10),
    type: 'Advogado',
    title: 'Upload Realizado',
    desc: `Documento ${file.name} carregado via clique.`
  });
  
  showToastNotification('Upload Concluído', `${file.name} adicionado com sucesso! o"`, '📋');
  
  if (typeof renderDocumentsTable === 'function') renderDocumentsTable();
  if (typeof renderBottomTabContent === 'function') renderBottomTabContent('documentos');
}

function updateClientFinanceInline(leadId, field, value) {
  const lead = window.mockLeads.find(l => l.id === leadId);
  if (lead) {
    if (field === 'valorHonorarios') {
      lead.valorHonorarios = parseFloat(value) || 0;
    } else if (field === 'valoresPagos') {
      lead.valoresPagos = parseFloat(value) || 0;
    } else if (field === 'prazoPagamento') {
      lead.prazoPagamento = value;
    } else if (field === 'statusPagamento') {
      lead.statusPagamento = value;
    }
    
    if (field === 'valoresPagos' || field === 'valorHonorarios') {
      const honVal = lead.valorHonorarios || (lead.valorCausa * 0.3) || 1500;
      const pagoVal = lead.valoresPagos || 0;
      if (pagoVal >= honVal) {
        lead.statusPagamento = 'pago';
      } else if (pagoVal > 0) {
        lead.statusPagamento = 'parcial';
      } else {
        lead.statusPagamento = 'pendente';
      }
    }
    
    lead.timeline.unshift({
      time: new Date().toLocaleString('pt-BR').substring(0, 10),
      type: 'Advogado',
      title: 'Edição Financeira',
      desc: `Atualização inline do campo ${field} para: ${value}.`
    });
    
    showToastNotification('Financeiro Atualizado', `Finanças de ${lead.name} salvas! ✅`, '✅');
    renderFinanceiroScreen();
  }
}

function confirmTaskCompletion(leadId, taskId) {
  const task = window.mockTasks.find(t => t.id === taskId);
  if (!task) return;
  
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.innerHTML = `
    <div class="edit-lead-modal" style="max-width: 400px; text-align: center; padding: 25px;">
      <div style="font-size: 40px; margin-bottom: 15px;">"</div>
      <h3 style="margin-bottom: 10px;">Confirmar Conclusão</h3>
      <p style="font-size: 13.5px; color: var(--text-secondary); margin-bottom: 20px;">
        VocÃªÃªÃªê confirma que a tarefa <strong>"${task.titulo}"</strong> foi totalmente concluída?
      </p>
      <div style="display: flex; gap: 10px; justify-content: center;">
        <button class="btn btn-outline-yellow" onclick="this.closest('.modal-overlay').remove()" style="padding: 8px 20px;">Não</button>
        <button class="btn btn-yellow" onclick="executeTaskCompletion(${leadId}, ${taskId}, this)" style="padding: 8px 20px;">Sim, Confirmar</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function executeTaskCompletion(leadId, taskId, button) {
  const task = window.mockTasks.find(t => t.id === taskId);
  if (task) {
    task.concluida = true;
    
    const targetLeadId = leadId || task.leadId;
    const lead = window.mockLeads.find(l => l.id === targetLeadId);
    if (lead) {
      lead.timeline.unshift({
        time: new Date().toLocaleString('pt-BR').substring(0, 10),
        type: 'Advogado',
        title: 'Tarefa Concluída',
        desc: `Tarefa "${task.titulo}" foi concluída.`
      });
      
      lead.messages.push({
        sender: 'bot',
        text: `Y- Notificação: A tarefa "${task.titulo}" foi concluída com sucesso pelo advogado responsável!`,
        time: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}),
        read: true
      });
      
      if (typeof renderChatArea === 'function') renderChatArea();
    }
    
    showToastNotification('Tarefa Concluída', `Tarefa concluída com sucesso! o"️`, 'o"️');
    button.closest('.modal-overlay').remove();
    
    if (typeof renderControladoriaTasks === 'function') renderControladoriaTasks();
    if (typeof renderBottomTabContent === 'function') renderBottomTabContent('atividades');
  }
}

function exportToWord(screenName) {
  let docContent = "";
  const header = `RELAT"RIO DO SISTEMA PFA ADVOGADOS - TELA: ${screenName.toUpperCase()}\n`;
  const dateStr = `Data de emissão: ${new Date().toLocaleString()}\n`;
  const dividers = `========================================================================\n\n`;
  
  if (screenName === 'conversas') {
    const lead = getCurrentLead();
    if (!lead) return;
    docContent += `CLIENTE: ${lead.name}\n`;
    docContent += `Caso: ${lead.tipoCaso} | Processo: ${lead.processo || 'N/A'}\n`;
    docContent += `Vencimento do Pagamento: ${lead.prazoPagamento || 'N/A'}\n`;
    docContent += `Status do Pagamento: ${lead.statusPagamento || 'N/A'}\n\n`;
    docContent += `--- HIST"RICO DE MENSAGENS ---\n`;
    lead.messages.forEach(m => {
      docContent += `[${m.time}] ${m.sender === 'client' ? 'Cliente' : 'Robô/Advogado'}: ${m.text}\n`;
    });
  } else if (screenName === 'crm') {
    docContent += `--- FUNIL DE VENDAS CRM ---\n`;
    window.mockLeads.forEach(l => {
      docContent += `- ${l.name} | Etapa: ${l.etapa} | Honorários: R$ ${l.valorHonorarios || 1500} | Próxima Ação: ${l.proximaAcao}\n`;
    });
  } else if (screenName === 'clientes') {
    docContent += `--- BASE DE CLIENTES CADASTROS ---\n`;
    window.mockLeads.forEach(l => {
      docContent += `- Nome: ${l.name} | CPF: ${l.cpf || 'N/A'} | Fone: ${l.phone} | Local: ${l.location}\n`;
    });
  } else if (screenName === 'tarefas') {
    docContent += `--- CONTROLADORIA DE TAREFAS ---\n`;
    docContent += `\n>> PENDENTES:\n`;
    window.mockTasks.filter(t => !t.concluida).forEach(t => {
      docContent += `- [PENDENTE] ${t.titulo} | Prazo: ${t.prazo} | Prioridade: ${t.prioridade.toUpperCase()}\n`;
    });
    docContent += `\n>> CONCLUÍDAS:\n`;
    window.mockTasks.filter(t => t.concluida).forEach(t => {
      docContent += `- [CONCLUÍDA] ${t.titulo} | Concluída com sucesso.\n`;
    });
  } else if (screenName === 'documentos') {
    const lead = getCurrentLead();
    if (!lead) return;
    docContent += `DOCUMENTOS DO CLIENTE: ${lead.name}\n\n`;
    lead.documentos.forEach(d => {
      docContent += `- Nome: ${d.name} | Pasta: ${d.folder} | Status: ${d.status} | Data: ${d.date}\n`;
    });
  } else if (screenName === 'financeiro') {
    docContent += `--- BALAN?O FINANCEIRO DO ESCRIT"RIO ---\n`;
    const prevHonorarios = window.mockLeads.reduce((acc, l) => acc + (l.valorHonorarios || (l.valorCausa * 0.3) || 1500), 0);
    const recHonorarios = window.mockLeads.reduce((acc, l) => acc + (l.valoresPagos || 0), 0);
    const spendMarketing = window.officeExpenses.filter(e => e.categoria === 'Marketing').reduce((acc, e) => acc + e.valor, 0);
    const spendApps = window.officeExpenses.filter(e => e.categoria === 'Aplicativos').reduce((acc, e) => acc + e.valor, 0);
    docContent += `Faturamento Total Previsto: R$ ${prevHonorarios.toFixed(2)}\n`;
    docContent += `Faturamento Recebido: R$ ${recHonorarios.toFixed(2)}\n`;
    docContent += `Despesas de Marketing: R$ ${spendMarketing.toFixed(2)}\n`;
    docContent += `Despesas de Aplicativos: R$ ${spendApps.toFixed(2)}\n`;
    docContent += `Margem Realizada Caixa: R$ ${(recHonorarios - (spendMarketing + spendApps)).toFixed(2)}\n\n`;
    docContent += `>> CONTAS A RECEBER DOS CLIENTES:\n`;
    window.mockLeads.forEach(l => {
      const honVal = l.valorHonorarios || (l.valorCausa * 0.3) || 1500;
      docContent += `- ${l.name}: Cobrado R$ ${honVal.toFixed(2)}, Pago R$ ${(l.valoresPagos || 0).toFixed(2)}, Restante R$ ${(honVal - (l.valoresPagos || 0)).toFixed(2)} | Vence em: ${l.prazoPagamento || 'N/A'}\n`;
    });
  }
  
  const blob = new Blob([header + dateStr + dividers + docContent], { type: 'application/mÃªsword' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `relatorio_${screenName}_pfa.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
  showToastNotification('Relatório Word Gerado', `Relatório da tela "${screenName}" baixado com sucesso! 📋`, '📋');
}

function triggerDocDetailsAction(actionType) {
  const lead = getCurrentLead();
  if (!lead) return;
  
  const detailsNameElement = document.getElementById('doc-details-name');
  if (!detailsNameElement) return;
  const docName = detailsNameElement.innerText;
  
  const doc = lead.documentos.find(d => d.name === docName);
  if (!doc) return;
  
  if (actionType === 'assinatura') {
    doc.status = 'Pendente';
    lead.timeline.unshift({
      time: new Date().toLocaleString('pt-BR').substring(0, 10),
      type: 'Sistema',
      title: 'Assinatura Solicitada',
      desc: `Cobrança de assinatura para o documento: ${doc.name}`
    });
    showToastNotification('Assinatura Solicitada', `Solicitação de assinatura enviada! 📋`, '📋');
  } else if (actionType === 'validar') {
    doc.status = 'Validado';
    lead.timeline.unshift({
      time: new Date().toLocaleString('pt-BR').substring(0, 10),
      type: 'Advogado',
      title: 'Documento Validado',
      desc: `Documento "${doc.name}" foi validado e homologado pelo advogado.`
    });
    showToastNotification('Documento Validado', `O documento "${doc.name}" foi validado com sucesso! o"`, 'o"️');
  }
  
  if (typeof renderDocumentsTable === 'function') renderDocumentsTable();
  if (typeof renderBottomTabContent === 'function') renderBottomTabContent('documentos');
  
  const statusEl = document.getElementById('doc-details-status');
  if (statusEl) {
    statusEl.innerText = doc.status;
    statusEl.className = `file-badge ${doc.status === 'Recebido' ? 'received' : doc.status === 'Validado' ? 'validated' : 'pending'}`;
  }
}

function createDocumentVersion() {
  const lead = getCurrentLead();
  const doc = lead && lead.documentos.find(item => item.name === activeDocumentId);
  if (!doc) {
    showToastNotification('Selecione um documento', 'Clique em um arquivo antes de criar uma nova versão.', '📄');
    return;
  }

  doc.version = Number(doc.version || 1) + 1;
  if (!doc.versions) doc.versions = [];
  doc.versions.push({
    version: doc.version,
    date: new Date().toLocaleString('pt-BR').substring(0, 16),
    author: 'Advogado PFA'
  });
  doc.date = new Date().toLocaleString('pt-BR').substring(0, 16);
  lead.timeline.unshift({
    time: new Date().toLocaleString('pt-BR').substring(0, 10),
    type: 'Advogado',
    title: 'Nova Versão',
    desc: `Criada a versão v${doc.version} de "${doc.name}".`
  });
  updateDocumentPreview(doc);
  renderDocumentsTable();
  showToastNotification('Versão criada', `${doc.name} agora está na versão v${doc.version}.`, '🗂️');
}

function openPendingDocumentsManager() {
  const pendingRows = [];
  window.mockLeads.forEach(lead => {
    const requirements = documentRequirementsByCase[lead.tipoCaso] || [];
    requirements.forEach(requirement => {
      const normalized = normalizeDocumentName(requirement);
      const doc = lead.documentos.find(item => normalized.split(' ').some(token => token.length > 3 && normalizeDocumentName(item.name).includes(token)));
      if (!doc || /pendente|aguardando/i.test(doc.status)) {
        pendingRows.push({ lead, requirement, status: doc ? doc.status : 'Não recebido' });
      }
    });
  });

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.innerHTML = `
    <div class="edit-lead-modal pending-docs-modal">
      <div class="modal-header">
        <div><h3>📋 Pendências documentais gerais</h3><small>${pendingRows.length} item(ns) exigindo ação</small></div>
        <button class="modal-close-btn" onclick="this.closest('.modal-overlay').remove()">&times;</button>
      </div>
      <div class="crm-leads-table-wrapper" style="max-height:520px; overflow:auto;">
        <table class="crm-leads-table">
          <thead><tr><th>Cliente</th><th>Caso</th><th>Documento</th><th>Status</th><th>Ação</th></tr></thead>
          <tbody>
            ${pendingRows.map(row => `
              <tr>
                <td><strong>${row.lead.name}</strong></td><td>${row.lead.tipoCaso}</td><td>${row.requirement}</td>
                <td><span class="file-badge pending">${row.status}</span></td>
                <td><button class="btn btn-outline-yellow" onclick="openRequestDocModal(${row.lead.id})">Solicitar</button></td>
              </tr>
            `).join('') || '<tr><td colspan="5">Nenhuma pendência encontrada.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function generateProcessTemplate() {
  const lead = getCurrentLead();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.innerHTML = `
    <div class="edit-lead-modal" style="max-width:460px;">
      <div class="modal-header"><h3>✨ Gerar template processual</h3><button class="modal-close-btn" onclick="this.closest('.modal-overlay').remove()">&times;</button></div>
      <div class="modal-body" style="padding:20px;">
        <p style="color:var(--text-secondary); margin-bottom:14px;">O documento será criado com os dados de <strong>${lead.name}</strong> e salvo na pasta inteligente correspondente.</p>
        <div class="form-group"><label>Tipo de documento</label>
          <select id="process-template-type">
            <option value="Defesa Prévia">Defesa Prévia</option>
            <option value="Procuração">Procuração</option>
            <option value="Recurso JARI">Recurso JARI</option>
            <option value="Recurso CETRAN">Recurso CETRAN</option>
            <option value="Contrato de Honorários">Contrato de Honorários</option>
          </select>
        </div>
      </div>
      <div class="modal-footer"><button class="btn btn-outline-yellow" onclick="this.closest('.modal-overlay').remove()">Cancelar</button><button class="btn btn-yellow" onclick="executeGenerateProcessTemplate(this)">Gerar documento</button></div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function executeGenerateProcessTemplate(button) {
  const overlay = button.closest('.modal-overlay');
  const type = overlay.querySelector('#process-template-type').value;
  const lead = getCurrentLead();
  const isContract = /procuração|contrato/i.test(type);
  const fileName = `${type.replace(/\s+/g, '_')}_${lead.name.replace(/\s+/g, '_')}_v1.docx`;
  const newDoc = {
    name: fileName,
    folder: 'processo',
    smartFolder: isContract ? 'contratos' : 'recursos',
    status: 'Recebido',
    size: 'Gerado pelo sistema',
    date: new Date().toLocaleString('pt-BR').substring(0, 16),
    author: 'PFA Automação',
    version: 1,
    versions: [{ version: 1, date: new Date().toLocaleString('pt-BR').substring(0, 16), author: 'PFA Automação' }],
    validade: null
  };
  lead.documentos.push(newDoc);
  lead.timeline.unshift({ time: new Date().toLocaleString('pt-BR').substring(0, 10), type: 'Sistema', title: 'Template Gerado', desc: `${type} gerado automaticamente.` });
  overlay.remove();
  currentDocFolder = newDoc.smartFolder;
  document.querySelectorAll('.docs-folder-item').forEach(item => item.classList.toggle('active', item.dataset.folder === currentDocFolder));
  renderDocumentsTable();
  showToastNotification('Template gerado', `${fileName} foi adicionado à pasta ${isContract ? 'Contratos' : 'Recursos'}.`, '✨');
}

function createSecureUploadLink() {
  const lead = getCurrentLead();
  const token = `${lead.id}-${Date.now().toString(36).slice(-6)}`;
  const secureLink = `https://upload.pfa.local/${token}`;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.innerHTML = `
    <div class="edit-lead-modal" style="max-width:500px;">
      <div class="modal-header"><h3>🔐 Link seguro de upload</h3><button class="modal-close-btn" onclick="this.closest('.modal-overlay').remove()">&times;</button></div>
      <div class="modal-body" style="padding:20px;">
        <p style="color:var(--text-secondary); margin-bottom:12px;">Link simulado para ${lead.name}. Expira em 72 horas e aceita somente PDF ou imagem.</p>
        <div class="secure-link-box"><input id="secure-upload-link" value="${secureLink}" readonly><button class="btn btn-yellow" onclick="copySecureUploadLink(this)">Copiar</button></div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function copySecureUploadLink(button) {
  const input = button.closest('.secure-link-box').querySelector('input');
  navigator.clipboard.writeText(input.value).then(() => showToastNotification('Link copiado', 'O link seguro foi copiado para a área de transferência.', '🔐'));
}

function toggleControladoriaTaskDirect(leadId, taskId) {
  const task = window.mockTasks.find(t => t.id === taskId);
  if (task) {
    if (task.concluida) {
      reopenTask(taskId);
    } else {
      confirmTaskCompletion(leadId, taskId);
    }
  }
}

function switchFinanceFollowupTab(tabName) {
  window.activeFinanceTab = tabName;
  
  const tabAlerts = document.getElementById('fin-tab-alerts');
  const tabQueue = document.getElementById('fin-tab-queue');
  const tabHistory = document.getElementById('fin-tab-history');
  
  if (tabAlerts && tabQueue && tabHistory) {
    tabAlerts.classList.remove('active');
    tabQueue.classList.remove('active');
    tabHistory.classList.remove('active');
    
    if (tabName === 'alerts') tabAlerts.classList.add('active');
    else if (tabName === 'queue') tabQueue.classList.add('active');
    else if (tabName === 'history') tabHistory.classList.add('active');
  }
  
  renderFinanceFollowupContent();
}

function renderFinanceFollowupContent() {
  const contentDiv = document.getElementById('finance-followup-content');
  if (!contentDiv) return;
  
  const tabName = window.activeFinanceTab || 'alerts';
  
  if (tabName === 'alerts') {
    const alerts = window.mockLeads.filter(l => {
      const honVal = l.valorHonorarios || (l.valorCausa * 0.3) || 1500;
      const pagoVal = l.valoresPagos || 0;
      return (honVal - pagoVal) > 0 && l.prazoPagamento;
    });
    
    if (alerts.length === 0) {
      contentDiv.innerHTML = `<div style="text-align:center; padding:15px; color:var(--text-secondary);">Nenhum alerta de cobrança ativo.</div>`;
      return;
    }
    
    contentDiv.innerHTML = `
      <table class="crm-leads-table" style="font-size:11.5px; width:100%;">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Vencimento</th>
            <th>Pendente</th>
            <th>Ação</th>
          </tr>
        </thead>
        <tbody>
          ${alerts.map(l => {
            const honVal = l.valorHonorarios || (l.valorCausa * 0.3) || 1500;
            const pagoVal = l.valoresPagos || 0;
            const outstanding = honVal - pagoVal;
            return `
              <tr>
                <td><strong>${l.name}</strong></td>
                <td style="color:var(--orange-primary); font-weight:700;">📋. ${l.prazoPagamento.split('-').reverse().join('/')}</td>
                <td style="color:var(--red-primary); font-weight:700;">R$ ${outstanding.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                <td>
                  <button class="btn btn-outline-yellow" onclick="triggerFinanceCobranca(${l.id})" style="font-size:10px; padding:3px 6px;">✅ Cobrar</button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  } else if (tabName === 'queue') {
    const debtors = window.mockLeads.filter(l => {
      const honVal = l.valorHonorarios || (l.valorCausa * 0.3) || 1500;
      const pagoVal = l.valoresPagos || 0;
      return (honVal - pagoVal) > 0;
    });
    
    if (debtors.length === 0) {
      contentDiv.innerHTML = `<div style="text-align:center; padding:15px; color:var(--text-secondary);">Nenhum cliente com saldo pendente de cobrança.</div>`;
      return;
    }
    
    contentDiv.innerHTML = `
      <table class="crm-leads-table" style="font-size:11.5px; width:100%;">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Fase / Caso</th>
            <th>Vencido</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${debtors.map(l => {
            const honVal = l.valorHonorarios || (l.valorCausa * 0.3) || 1500;
            const pagoVal = l.valoresPagos || 0;
            const outstanding = honVal - pagoVal;
            return `
              <tr>
                <td><strong>${l.name}</strong></td>
                <td>${l.etapa}<br><span style="font-size:9.5px; color:var(--text-secondary);">${l.tipoCaso}</span></td>
                <td style="color:var(--red-primary); font-weight:700;">R$ ${outstanding.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                <td>
                  <div style="display:flex; gap:4px;">
                    <button class="btn btn-outline-orange" onclick="openFollowupModalDirect(${l.id})" style="font-size:10px; padding:3px 6px;" title="Agendar Follow-up">📋. Agendar</button>
                    <button class="btn btn-yellow" onclick="triggerImmediateFollowup(${l.id})" style="font-size:10px; padding:3px 6px;" title="Cobrar por WhatsApp agora">s Cobrar</button>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  } else if (tabName === 'history') {
    if (!window.mockFollowupLogs || window.mockFollowupLogs.length === 0) {
      contentDiv.innerHTML = `<div style="text-align:center; padding:15px; color:var(--text-secondary);">Nenhum follow-up enviado recentemente.</div>`;
      return;
    }
    
    contentDiv.innerHTML = `
      <div class="followup-history-list" style="display:flex; flex-direction:column; gap:8px;">
        ${window.mockFollowupLogs.map(log => `
          <div style="background:var(--bg-secondary); border:1px solid var(--border-color); padding:8px 12px; border-radius:6px; font-size:11px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <strong>${log.clientName}</strong><br>
              <span style="color:var(--text-secondary);">${log.type} (${log.date})</span>
            </div>
            <span style="font-size:9.5px; padding:2px 6px; border-radius:10px; font-weight:700; ${log.status.includes('Agendado') ? 'background:#fee2e2; color:#ef4444;' : 'background:#d1fae5; color:#10b981;'}">
              ${log.status}
            </span>
          </div>
        `).join('')}
      </div>
    `;
  }
}

function triggerImmediateFollowup(leadId) {
  const lead = window.mockLeads.find(l => l.id === leadId);
  if (!lead) return;
  
  lead.timeline.unshift({
    time: new Date().toLocaleString('pt-BR').substring(0, 10),
    type: 'Sistema',
    title: 'Cobrança Manual',
    desc: 'Lembrete de follow-up financeiro enviado manualmente pelo advogado.'
  });
  
  lead.messages.push({
    sender: 'bot',
    text: `Y- Olá ${lead.name}! Passando para lembrar sobre a parcela pendente de seus honorários. Caso precise do boleto ou PIX, é só nos avisar por aqui.`,
    time: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}),
    read: true
  });
  
  if (!window.mockFollowupLogs) window.mockFollowupLogs = [];
  window.mockFollowupLogs.unshift({
    id: window.mockFollowupLogs.length + 1,
    clientName: lead.name,
    type: 'Cobrança de Honorários',
    date: new Date().toLocaleString('pt-BR').substring(0, 16),
    status: 'Enviado via WhatsApp'
  });
  
  showToastNotification('WhatsApp Enviado', 'Mensagem de cobrança enviada com sucesso! ✅', '✅');
  renderFinanceiroScreen();
  if (typeof renderChatArea === 'function') renderChatArea();
}

function deleteExpenseWithConfirmation(expenseId) {
  const expense = window.officeExpenses.find(e => e.id === expenseId);
  if (!expense) return;
  
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.innerHTML = `
    <div class="edit-lead-modal" style="max-width: 400px; text-align: center; padding: 25px;">
      <div style="font-size: 40px; margin-bottom: 15px;">Y-'️</div>
      <h3 style="margin-bottom: 10px;">Excluir Despesa</h3>
      <p style="font-size: 13.5px; color: var(--text-secondary); margin-bottom: 20px;">
        VocÃªÃªÃªê confirma que deseja excluir a despesa <strong>"${expense.descricao}"</strong>Ã©Ã©Ã© de R$ ${expense.valor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}?
      </p>
      <div style="display: flex; gap: 10px; justify-content: center;">
        <button class="btn btn-outline-yellow" onclick="this.closest('.modal-overlay').remove()" style="padding: 8px 20px;">Não</button>
        <button class="btn btn-yellow" onclick="executeExpenseDeletion(${expenseId}, this)" style="padding: 8px 20px;">Sim, Excluir</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function executeExpenseDeletion(expenseId, button) {
  window.officeExpenses = window.officeExpenses.filter(e => e.id !== expenseId);
  showToastNotification('Despesa Excluída', 'Lançamento financeiro removido com sucesso.', '🚨');
  button.closest('.modal-overlay').remove();
  renderFinanceiroScreen();
}

function openClientReportModal(leadId) {
  const lead = window.mockLeads.find(l => l.id === leadId);
  if (!lead) return;
  
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.innerHTML = `
    <div class="edit-lead-modal" style="max-width: 450px; padding: 25px;">
      <div class="modal-header">
        <span style="font-weight: 700; font-size:16px;">📋" Gerar Relatório do Cliente</span>
        <button onclick="this.closest('.modal-overlay').remove()" style="background:none; border:none; cursor:pointer; font-size:18px;">&times;</button>
      </div>
      <div class="modal-body" style="text-align: left; margin-top: 15px;">
        <p style="font-size: 13.5px; color: var(--text-secondary); margin-bottom: 15px;">
          Selecione as seções e o formato para o relatório de <strong>${lead.name}</strong>:
        </p>
        
        <div class="form-group" style="margin-bottom: 15px;">
          <label style="font-weight: 700; font-size:11px; text-transform: uppercase;">Formato de Exportação</label>
          <div style="display: flex; gap: 15px; margin-top: 5px;">
            <label style="display: flex; align-items: center; gap: 6px; font-size: 13.5px; cursor:pointer;">
              <input type="radio" name="report-format" value="word" checked style="width:16px; height:16px; accent-color:var(--gold-primary);"> Word (.doc)
            </label>
            <label style="display: flex; align-items: center; gap: 6px; font-size: 13.5px; cursor:pointer;">
              <input type="radio" name="report-format" value="pdf" style="width:16px; height:16px; accent-color:var(--gold-primary);"> PDF (.pdf)
            </label>
          </div>
        </div>
        
        <div class="form-group" style="margin-bottom: 20px;">
          <label style="font-weight: 700; font-size:11px; text-transform: uppercase;">Seções a Incluir</label>
          <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 5px;">
            <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor:pointer;">
              <input type="checkbox" class="report-section" value="cadastral" checked style="width:16px; height:16px; accent-color:var(--gold-primary);"> Dados Cadastrais e do Caso
            </label>
            <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor:pointer;">
              <input type="checkbox" class="report-section" value="financeiro" checked style="width:16px; height:16px; accent-color:var(--gold-primary);"> Financeiro Individualizado (Honorários, Pagos)
            </label>
            <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor:pointer;">
              <input type="checkbox" class="report-section" value="conversas" checked style="width:16px; height:16px; accent-color:var(--gold-primary);"> Histórico de Conversas (Mensagens)
            </label>
            <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor:pointer;">
              <input type="checkbox" class="report-section" value="documentos" checked style="width:16px; height:16px; accent-color:var(--gold-primary);"> Lista de Documentos
            </label>
          </div>
        </div>
        
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button class="btn btn-outline-yellow" onclick="this.closest('.modal-overlay').remove()" style="padding: 8px 16px;">Cancelar</button>
          <button class="btn btn-yellow" onclick="generateClientReport(${lead.id}, this)" style="padding: 8px 16px;">Gerar Relatório</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function generateClientReport(leadId, button) {
  const lead = window.mockLeads.find(l => l.id === leadId);
  if (!lead) return;
  
  const format = document.querySelector('input[name="report-format"]:checked').value;
  const includeCadastral = document.querySelector('.report-section[value="cadastral"]').checked;
  const includeFinanceiro = document.querySelector('.report-section[value="financeiro"]').checked;
  const includeConversas = document.querySelector('.report-section[value="conversas"]').checked;
  const includeDocumentos = document.querySelector('.report-section[value="documentos"]').checked;
  
  let reportHTML = `
    <html>
    <head>
      <title>Relatório do Cliente - ${lead.name}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #1e293b; line-height: 1.5; }
        h1 { color: #600014; border-bottom: 2px solid #d4af37; padding-bottom: 8px; margin-bottom: 20px; }
        h2 { color: #800020; margin-top: 25px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 15px; }
        th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; font-size: 13.5px; }
        th { background: #f8f9fa; font-weight: 700; color: #1e293b; }
        .mÃªsg-item { margin-bottom: 8px; font-size: 13px; }
        .mÃªsg-time { color: #64748b; font-size: 11px; margin-right: 8px; }
        .mÃªsg-sender { font-weight: 700; }
        .meta-label { font-weight: 700; width: 200px; background: #f1f5f9; }
      </style>
    </head>
    <body>
      <h1>RELAT"RIO JURÍDICO E FINANCEIRO</h1>
      <p><strong>Cliente:</strong> ${lead.name} | <strong>Caso:</strong> ${lead.tipoCaso} | <strong>Emitido em:</strong> ${new Date().toLocaleString('pt-BR')}</p>
  `;
  
  if (includeCadastral) {
    reportHTML += `
      <h2>Dados Cadastrais e do Caso</h2>
      <table>
        <tr><td class="meta-label">Telefone</td><td>${lead.phone}</td></tr>
        <tr><td class="meta-label">E-mail</td><td>${lead.email}</td></tr>
        <tr><td class="meta-label">CPF</td><td>${lead.cpf || 'Não informado'}</td></tr>
        <tr><td class="meta-label">Endereço</td><td>${lead.endereco || 'Não informado'}</td></tr>
        <tr><td class="meta-label">"rgão Autuador</td><td>${lead.autuador || 'N/A'}</td></tr>
        <tr><td class="meta-label">Número do Processo</td><td>${lead.processo || 'N/A'}</td></tr>
        <tr><td class="meta-label">Etapa Atual no CRM</td><td>${lead.etapa}</td></tr>
      </table>
    `;
  }
  
  if (includeFinanceiro) {
    const honVal = lead.valorHonorarios || (lead.valorCausa * 0.3) || 1500;
    const pagoVal = lead.valoresPagos || 0;
    const restVal = Math.max(0, honVal - pagoVal);
    reportHTML += `
      <h2>Financeiro Individualizado</h2>
      <table>
        <tr><td class="meta-label">Honorários Totais Cobrados</td><td>R$ ${honVal.toLocaleString('pt-BR', {minimumFractionDigits:2})}</td></tr>
        <tr><td class="meta-label">Valor Pago até o Momento</td><td style="color:#10b981; font-weight:700;">R$ ${pagoVal.toLocaleString('pt-BR', {minimumFractionDigits:2})}</td></tr>
        <tr><td class="meta-label">Saldo de Honorários Restante</td><td style="color:#ef4444; font-weight:700;">R$ ${restVal.toLocaleString('pt-BR', {minimumFractionDigits:2})}</td></tr>
        <tr><td class="meta-label">Vencimento do Pagamento</td><td>${lead.prazoPagamento ? lead.prazoPagamento.split('-').reverse().join('/') : 'Não definido'}</td></tr>
        <tr><td class="meta-label">Status Financeiro</td><td>${lead.statusPagamento ? lead.statusPagamento.toUpperCase() : 'PENDENTE'}</td></tr>
      </table>
    `;
  }
  
  if (includeConversas) {
    reportHTML += `<h2>Histórico de Conversas (Mensagens)</h2><div style="margin-top:10px;">`;
    lead.messages.forEach(m => {
      reportHTML += `
        <div class="mÃªsg-item">
          <span class="mÃªsg-time">[${m.time}]</span>
          <span class="mÃªsg-sender" style="color: ${m.sender === 'client' ? '#600014' : '#d4af37'};">${m.sender === 'client' ? 'Cliente' : 'Robô/Advogado'}:</span>
          <span>${m.text}</span>
        </div>
      `;
    });
    reportHTML += `</div>`;
  }
  
  if (includeDocumentos) {
    reportHTML += `
      <h2>Documentos da Pasta</h2>
      <table>
        <thead>
          <tr><th>Nome do Documento</th><th>Pasta</th><th>Status</th><th>Data de Envio</th></tr>
        </thead>
        <tbody>
          ${lead.documentos.map(d => `
            <tr>
              <td>${d.name}</td>
              <td>${d.folder}</td>
              <td>${d.status}</td>
              <td>${d.date}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }
  
  reportHTML += `</body></html>`;
  
  if (format === 'pdf') {
    const win = window.open("", "_blank");
    win.document.write(reportHTML);
    win.document.close();
    setTimeout(() => {
      win.print();
    }, 500);
    showToastNotification('Relatório PDF Gerado', 'Seletor de impressão PDF aberto!', '📊');
  } else {
    const blob = new Blob([reportHTML], { type: 'application/mÃªsword' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_${lead.name.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    showToastNotification('Relatório Word Gerado', 'Relatório baixado com sucesso! 📋', '📋');
  }
  
  button.closest('.modal-overlay').remove();
}

function confirmFinanceChange(type, id, field, newVal, oldVal, inputEl) {
  const isClient = type === 'client';
  const entity = isClient ? window.mockLeads.find(l => l.id === id) : window.officeExpenses.find(e => e.id === id);
  if (!entity) return;
  
  const name = isClient ? entity.name : entity.descricao;
  
  let formattedNew = newVal;
  let formattedOld = oldVal;
  if (field === 'valorHonorarios' || field === 'valoresPagos' || field === 'valor') {
    formattedNew = 'R$ ' + parseFloat(newVal).toLocaleString('pt-BR', {minimumFractionDigits: 2});
    formattedOld = 'R$ ' + parseFloat(oldVal || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2});
  }
  
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.innerHTML = `
    <div class="edit-lead-modal" style="max-width: 420px; text-align: center; padding: 25px;">
      <div style="font-size: 40px; margin-bottom: 15px;">s️</div>
      <h3 style="margin-bottom: 10px;">Confirmar Alteração Financeira</h3>
      <p style="font-size: 13.5px; color: var(--text-secondary); margin-bottom: 20px; text-align: left;">
        Tem certeza que deseja alterar o campo <strong>"${field}"</strong> de <strong>"${name}"</strong>?<br><br>
        ? De: <strong>${formattedOld}</strong><br>
        ? Para: <strong style="color: var(--orange-primary);">${formattedNew}</strong>
      </p>
      <div style="display: flex; gap: 10px; justify-content: center;">
        <button class="btn btn-outline-yellow" id="btn-cancel-finance-change" style="padding: 8px 20px;">Não, Cancelar</button>
        <button class="btn btn-yellow" id="btn-confirm-finance-change" style="padding: 8px 20px;">Sim, Confirmar</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  
  document.getElementById('btn-cancel-finance-change').onclick = () => {
    inputEl.value = oldVal;
    overlay.remove();
  };
  
  document.getElementById('btn-confirm-finance-change').onclick = () => {
    if (isClient) {
      if (field === 'valorHonorarios') {
        entity.valorHonorarios = parseFloat(newVal) || 0;
      } else if (field === 'valoresPagos') {
        entity.valoresPagos = parseFloat(newVal) || 0;
        const hon = entity.valorHonorarios || (entity.valorCausa * 0.3) || 1500;
        if (entity.valoresPagos >= hon) {
          entity.statusPagamento = 'pago';
        } else if (entity.valoresPagos > 0) {
          entity.statusPagamento = 'parcial';
        } else {
          entity.statusPagamento = 'pendente';
        }
      } else if (field === 'prazoPagamento') {
        entity.prazoPagamento = newVal;
      } else if (field === 'statusPagamento') {
        entity.statusPagamento = newVal;
      }
      
      entity.timeline.unshift({
        time: new Date().toLocaleString('pt-BR').substring(0, 10),
        type: 'Advogado',
        title: 'Finanças Editadas',
        desc: `Campo "${field}" alterado para ${formattedNew}`
      });
      
      showToastNotification('Financeiro Atualizado', `Dados de ${entity.name} atualizados!`, '✅');
    } else {
      if (field === 'descricao') {
        entity.descricao = newVal;
      } else if (field === 'categoria') {
        entity.categoria = newVal;
      } else if (field === 'data') {
        entity.data = newVal;
      } else if (field === 'valor') {
        entity.valor = parseFloat(newVal) || 0;
      }
      showToastNotification('Despesa Atualizada', `Despesa "${entity.descricao}" atualizada!`, '✅');
    }
    
    renderFinanceiroScreen();
    overlay.remove();
  };
}

window.renderFinanceiroScreen = renderFinanceiroScreen;
window.openNewExpenseModal = openNewExpenseModal;
window.saveNewExpense = saveNewExpense;
window.openReceivablePaymentModal = openReceivablePaymentModal;
window.saveReceivablePayment = saveReceivablePayment;
window.triggerFinanceCobranca = triggerFinanceCobranca;
window.toggleDocsSidebar = toggleDocsSidebar;
window.handleDragOver = handleDragOver;
window.handleDragLeave = handleDragLeave;
window.handleFileDrop = handleFileDrop;
window.saveClientNotes = saveClientNotes;
window.saveClientPromptFromChat = saveClientPromptFromChat;
window.toggleControladoriaTaskDirect = toggleControladoriaTaskDirect;
window.openNewTaskForLead = openNewTaskForLead;
window.sendDocumentRequest = sendDocumentRequest;
window.downloadChatFile = downloadChatFile;
window.toggleChatMaximization = toggleChatMaximization;
window.triggerFileInputClick = triggerFileInputClick;
window.handleFileSelect = handleFileSelect;
window.updateClientFinanceInline = updateClientFinanceInline;
window.confirmTaskCompletion = confirmTaskCompletion;
window.executeTaskCompletion = executeTaskCompletion;
window.exportToWord = exportToWord;
window.triggerDocDetailsAction = triggerDocDetailsAction;
window.switchFinanceFollowupTab = switchFinanceFollowupTab;
window.renderFinanceFollowupContent = renderFinanceFollowupContent;
window.triggerImmediateFollowup = triggerImmediateFollowup;
window.deleteExpenseWithConfirmation = deleteExpenseWithConfirmation;
window.executeExpenseDeletion = executeExpenseDeletion;
window.openClientReportModal = openClientReportModal;
window.generateClientReport = generateClientReport;
window.confirmFinanceChange = confirmFinanceChange;

// --- Global Urgency check ---
window.checkGlobalUrgency = function() {
  const today = new Date(); today.setHours(0,0,0,0);
  const urgentTasks = window.mockTasks.filter(t => !t.concluida && Math.ceil((new Date(formatDateToISO(t.prazo).substring(0,10)) - today)/86400000) <= 3);
  const banner = document.getElementById('urgency-banner');
  if (banner) {
    if (urgentTasks.length > 0) {
      document.getElementById('urgency-banner-text').innerText = `s️ ATEN?fO: VocÃªÃªÃªê possui ${urgentTasks.length} prazo(s) urgentes vencendo nos próximos 3 dias!`;
      banner.style.display = 'block';
    } else {
      banner.style.display = 'none';
    }
  }
};
window.addEventListener('DOMContentLoaded', () => { setTimeout(window.checkGlobalUrgency, 1000); });

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
