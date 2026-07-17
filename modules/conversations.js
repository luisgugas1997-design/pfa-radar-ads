// ============================================
// CONVERSATIONS — Tela de conversas, chat, mensagens
// PFA Dashboard — Módulo extraído do app.js
// ============================================

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
          <span class="chat-msg">${lastMsg ? lastMsg.text.substring(0,42)+(lastMsg.text.length>42?'...':'') : 'Sem mensagens'}</span>
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
  lead.messages.forEach(msg => {
    const bubble = document.createElement('div');
    bubble.className = `message-bubble ${msg.sender === 'client' ? 'client' : 'bot'}`;
    
    let content = msg.text;
    if (msg.attachment) {
      const att = msg.attachment;
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

    let checkmarkHTML = '';
    if (msg.sender !== 'client') {
      const status = msg.status || 'read';
      let checkClass = 'msg-check-read';
      let checkText = '✓✓';
      if (status === 'sent') {
        checkClass = 'msg-check-sent';
        checkText = '✓';
      } else if (status === 'delivered') {
        checkClass = 'msg-check-delivered';
        checkText = '✓✓';
      }
      checkmarkHTML = `<span class="msg-status-check ${checkClass}" style="margin-left: 4px; font-weight: bold; font-size: 11px;">${checkText}</span>`;
    }

    bubble.innerHTML = `
      ${content}
      <span class="msg-time" style="display: flex; align-items: center; justify-content: flex-end; gap: 3px;">
        ${msg.time}
        ${checkmarkHTML}
      </span>
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
  
  // IA Ativa / Controle Humano select dropdown right inside profile name area
  profileName.innerHTML = `${lead.name} <select id="edit-robo-ativo" title="Alterar controle (IA / Humano)" style="font-size:10px; font-weight:700; border-radius:4px; padding:2px 4px; cursor:pointer; border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--text-primary); margin-left:8px; outline:none;"
    onchange="toggleRobot(this.value === 'bot')">
    <option value="bot" ${lead.roboAtivo ? 'selected' : ''}>🤖 IA Ativa</option>
    <option value="manual" ${!lead.roboAtivo ? 'selected' : ''}>👤 Humano</option>
  </select>`;

  profilePhone.innerText = lead.phone;
  profileEmail.innerText = lead.email;
  profileLocation.innerText = lead.location;

  // ─── CAMPOS EDITÁVEIS INLINE ───
  const fieldStyle = 'width:100%;border:1px solid transparent;border-radius:5px;background:transparent;color:var(--text-primary);font-size:12px;font-weight:600;padding:2px 5px;cursor:pointer;transition:border-color 0.15s,background 0.15s;outline:none;';
  const hoverStyle = 'onmouseover="this.style.borderColor=\'var(--border-color)\';this.style.background=\'var(--bg-primary)\'" onmouseout="if(document.activeElement!==this){this.style.borderColor=\'transparent\';this.style.background=\'transparent\'}"';
  const focusStyle = 'onfocus="this.style.borderColor=\'var(--brand-primary)\';this.style.background=\'var(--bg-primary)\'"';

  // ETAPA — select
  const etapas = ['Em Triagem','Aguardando Docs','Em Análise','Elaboração de Defesa','Protocolo','Aguardando JARI','Recurso CETRAN','Concluído','Proposta Enviada','Contrato Assinado'];
  crmEtapa.innerHTML = `<select id="edit-etapa" title="Clique para editar a Etapa" style="${fieldStyle}background:transparent;" ${hoverStyle} ${focusStyle}
    onchange="window.mockLeads.find(l=>l.id===${lead.id}).etapa=this.value;showToastNotification('Etapa atualizada','→ '+this.value,'success')">
    ${etapas.map(e => `<option value="${e}" ${e===lead.etapa?'selected':''}>${e}</option>`).join('')}
  </select>`;

  // TIPO DE CASO — select
  const tipos = ['Lei Seca','CNH Suspensa','CNH Cassada','Recurso de Multa','Excesso de Velocidade','Habilitação Estrangeira'];
  crmTipoCaso.innerHTML = `<select id="edit-tipo" title="Editar Tipo" style="${fieldStyle}" ${hoverStyle} ${focusStyle}
    onchange="window.mockLeads.find(l=>l.id===${lead.id}).tipoCaso=this.value;showToastNotification('Tipo atualizado','→ '+this.value,'success')">
    ${tipos.map(t => `<option value="${t}" ${t===lead.tipoCaso?'selected':''}>${t}</option>`).join('')}
  </select>`;

  // PROCESSO — text input
  crmProcesso.innerHTML = `<input id="edit-processo" type="text" value="${lead.processo||''}" style="${fieldStyle}" title="Clique para editar o Processo" ${hoverStyle} ${focusStyle}
    onblur="if(this.value.trim()){window.mockLeads.find(l=>l.id===${lead.id}).processo=this.value.trim();showToastNotification('Processo salvo','','success');}this.style.borderColor='transparent';this.style.background='transparent'">`;

  // DATA DA INFRAÇÃO — date input
  const dataISOStr = lead.dataInfra ? lead.dataInfra.split('/').reverse().join('-') : '';
  crmDataInfra.innerHTML = `<input id="edit-data-infra" type="date" value="${dataISOStr}" style="${fieldStyle}" title="Clique para editar Data" ${hoverStyle} ${focusStyle}
    onblur="const d=this.value;if(d){const p=d.split('-');window.mockLeads.find(l=>l.id===${lead.id}).dataInfra=p[2]+'/'+p[1]+'/'+p[0];showToastNotification('Data salva','','success');}this.style.borderColor='transparent';this.style.background='transparent'">`;

  // ÓRGÃO AUTUADOR — text
  crmAutuador.innerHTML = `<input id="edit-autuador" type="text" value="${lead.autuador||''}" style="${fieldStyle}" title="Clique para editar Órgão" ${hoverStyle} ${focusStyle}
    onblur="if(this.value.trim()){window.mockLeads.find(l=>l.id===${lead.id}).autuador=this.value.trim();}this.style.borderColor='transparent';this.style.background='transparent'">`;

  // VALOR DA CAUSA — number
  const valorEl = document.getElementById('crm-valor-cause');
  if (valorEl) valorEl.innerHTML = `<input id="edit-valor" type="number" step="0.01" value="${lead.valorCausa||0}" style="${fieldStyle}color:var(--brand-primary);" title="Clique para editar Valor" ${hoverStyle} ${focusStyle}
    onblur="const v=parseFloat(this.value);if(!isNaN(v)){window.mockLeads.find(l=>l.id===${lead.id}).valorCausa=v;showToastNotification('Valor atualizado','R$ '+v.toLocaleString('pt-BR',{minimumFractionDigits:2}),'success');}this.style.borderColor='transparent';this.style.background='transparent'">`;

  // PRIORIDADE / URGÊNCIA — select
  const prioridades = [
    { value: 'alta', label: '🚨 Alta / Urgente' },
    { value: 'media', label: '🟡 Média' },
    { value: 'baixa', label: '🟢 Baixa' }
  ];
  const crmPrioridade = document.getElementById('crm-prioridade');
  if (crmPrioridade) {
    crmPrioridade.innerHTML = `<select id="edit-prioridade" title="Alterar Urgência / Prioridade" style="${fieldStyle}" ${hoverStyle} ${focusStyle}
      onchange="window.mockLeads.find(l=>l.id===${lead.id}).prioridade=this.value; if(typeof renderChatList==='function')renderChatList(); if(typeof renderControladoriaTasks==='function')renderControladoriaTasks(); showToastNotification('Prioridade atualizada','→ '+this.options[this.selectedIndex].text,'success')">
      ${prioridades.map(p => `<option value="${p.value}" ${p.value===lead.prioridade?'selected':''}>${p.label}</option>`).join('')}
    </select>`;
  }

  // Next Action box — editable
  const actionBox = document.querySelector('.action-box .action-content');
  if (actionBox) actionBox.innerHTML = `
    <div contenteditable="true" id="edit-proxima-acao" style="outline:none;border:1px dashed transparent;border-radius:4px;padding:3px;cursor:text;transition:border-color 0.15s;min-height:20px;"
      onmouseover="this.style.borderColor='var(--border-color)'"
      onmouseout="if(document.activeElement!==this)this.style.borderColor='transparent'"
      onfocus="this.style.borderColor='var(--brand-primary)'"
      onblur="window.mockLeads.find(l=>l.id===${lead.id}).proximaAcao=this.innerText.trim();this.style.borderColor='transparent'"
    >${lead.proximaAcao}</div>
    <div class="action-deadline">Prazo:
      <input type="date" id="edit-prazo-acao" value="${lead.prazoAcao ? lead.prazoAcao.split('/').reverse().join('-') : ''}" 
        style="border:none;background:transparent;color:var(--text-secondary);font-size:11px;cursor:pointer;"
        onchange="const p=this.value.split('-');window.mockLeads.find(l=>l.id===${lead.id}).prazoAcao=p[2]+'/'+p[1]+'/'+p[0]">
    </div>
  `;

  // Financeiro fields
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
  if (promptTextarea) {
    promptTextarea.value = lead.promptCustom || '';
  }

  // Bind Sidebar notes
  const notesTextarea = document.getElementById('sidebar-client-notes');
  if (notesTextarea) {
    notesTextarea.value = lead.notasCustom || '';
  }
  const saveNotesBtn = document.getElementById('btn-save-notes-sidebar');
  if (saveNotesBtn) {
    saveNotesBtn.onclick = () => {
      if (typeof window.confirmAndSaveNotes === 'function') {
        window.confirmAndSaveNotes(lead.id);
      }
    };
  }
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
    docsHeader.style.alignItemês = 'center';
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
    // Notes tab (now Follow-up)
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '12px';
    container.style.padding = '5px 0';
    
    // Check if there is already a scheduled follow-up
    const hasFollowup = lead.followupScheduled && lead.followupScheduled.active;
    
    if (hasFollowup) {
      const f = lead.followupScheduled;
      container.innerHTML = `
        <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 8px; padding: 12px 16px; display: flex; flex-direction: column; gap: 8px; text-align: left;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="font-size: 13px; color: #065f46; display: flex; align-items: center; gap: 6px;">
              🟢 Follow-up Automático Agendado
            </strong>
            <button onclick="window.cancelFollowupForLead(${lead.id})" class="btn" style="background: #fee2e2; border: 1px solid #fca5a5; color: #b91c1c; font-size: 10px; font-weight: bold; padding: 3px 8px; border-radius: 4px; cursor: pointer;">
              Cancelar Agendamento
            </button>
          </div>
          <div style="font-size: 11.5px; color: var(--text-primary); display: grid; grid-template-columns: auto 1fr; gap: 6px 12px; margin-top: 4px;">
            <span style="color: var(--text-secondary); font-weight: 600;">📅 Data:</span>
            <span>${f.date}</span>
            <span style="color: var(--text-secondary); font-weight: 600;">⏰ Horário:</span>
            <span>${f.time}</span>
            <span style="color: var(--text-secondary); font-weight: 600;">💬 Mensagem/Prompt:</span>
            <span style="font-style: italic;">"${f.prompt}"</span>
          </div>
          <div style="display: flex; gap: 8px; margin-top: 8px; border-top: 1px dashed rgba(16, 185, 129, 0.2); padding-top: 8px;">
            <button onclick="window.triggerFollowupSimulation(${lead.id})" class="btn btn-yellow" style="font-size: 10.5px; padding: 4px 10px; font-weight: bold;">
              🚀 Disparar Agora (Simulação)
            </button>
          </div>
        </div>
      `;
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      container.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; text-align: left;">
          <!-- Coluna 1: Campos -->
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div>
                <label style="font-size: 10.5px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 4px;">📅 DATA</label>
                <input type="date" id="follow-date-input" value="${tomorrowStr}" style="width: 100%; padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-tertiary); color: var(--text-primary); font-size: 12px; outline: none;">
              </div>
              <div>
                <label style="font-size: 10.5px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 4px;">⏰ HORÁRIO</label>
                <input type="time" id="follow-time-input" value="10:00" style="width: 100%; padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-tertiary); color: var(--text-primary); font-size: 12px; outline: none;">
              </div>
            </div>
            
            <div>
              <label style="font-size: 10.5px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 4px;">📝 PROMPT / MENSAGEM DO ROBÔ</label>
              <textarea id="follow-prompt-input" placeholder="Ex: Olá, João! Notamos que os documentos estão pendentes. Precisamos deles para protocolar seu recurso. Você consegue nos enviar hoje?" style="width: 100%; height: 60px; padding: 8px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-tertiary); color: var(--text-primary); font-size: 11.5px; resize: none; outline: none;"></textarea>
            </div>
          </div>

          <!-- Coluna 2: Modelos / Templates rápidos -->
          <div style="display: flex; flex-direction: column; gap: 8px; border-left: 1px solid var(--border-color); padding-left: 15px;">
            <label style="font-size: 10.5px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 2px;">⚡ TEMPLATES RÁPIDOS</label>
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <button onclick="window.applyFollowupTemplate('cobrar_docs')" class="btn" style="background: var(--bg-tertiary); border: 1px solid var(--border-color); text-align: left; font-size: 10.5px; padding: 5px 8px; border-radius: 4px; color: var(--text-primary); cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                💬 Cobrança de Documentos
              </button>
              <button onclick="window.applyFollowupTemplate('aviso_analise')" class="btn" style="background: var(--bg-tertiary); border: 1px solid var(--border-color); text-align: left; font-size: 10.5px; padding: 5px 8px; border-radius: 4px; color: var(--text-primary); cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                💬 Feedback de Análise Inicial
              </button>
              <button onclick="window.applyFollowupTemplate('aviso_protocolo')" class="btn" style="background: var(--bg-tertiary); border: 1px solid var(--border-color); text-align: left; font-size: 10.5px; padding: 5px 8px; border-radius: 4px; color: var(--text-primary); cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                💬 Notificação de Protocolo
              </button>
            </div>
            <button onclick="window.scheduleFollowupForLead(${lead.id})" class="btn btn-yellow" style="margin-top: auto; align-self: flex-end; font-size: 11px; padding: 6px 16px; font-weight: 700;">
              📅 Agendar Follow-up
            </button>
          </div>
        </div>
      `;
    }
    tabContentContainer.appendChild(container);

  } else if (tabName === 'atividades') {
    // Tasks checklist
    const tasksHeader = document.createElement('div');
    tasksHeader.style.display = 'flex';
    tasksHeader.style.justifyContent = 'space-between';
    tasksHeader.style.alignItemês = 'center';
    tasksHeader.style.marginBottom = '10px';
    tasksHeader.innerHTML = `
      <span style="font-size:11px; font-weight:700; color:var(--text-secondary); text-transform:uppercase;">Tarefas de Atendimento</span>
      <button class="btn btn-yellow" onclick="openNewTaskForLead(${lead.id})" style="font-size:9.5px; padding:2px 8px;">+ Atribuir</button>
    `;
    tabContentContainer.appendChild(tasksHeader);

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
        item.style.alignItemês = 'center';
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

  const finalSendText = text;

  // Add lawyer message (outgoing team message, so 'bot' is used)
  const newMsg = {
    sender: 'bot',
    text: finalSendText,
    time: timeStr,
    status: 'sent',
    read: true
  };
  lead.messages.push(newMsg);

  messageInput.value = '';
  renderChatArea();
  renderChatList();

  // WhatsApp checkmark transitions
  setTimeout(() => {
    newMsg.status = 'delivered';
    renderChatArea();
  }, 600);

  setTimeout(() => {
    newMsg.status = 'read';
    renderChatArea();
  }, 1600);
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

window.initConversationsScreen = initConversationsScreen;
window.updateUnreadBadgeCount = updateUnreadBadgeCount;
window.renderFullCRMSidebar = renderFullCRMSidebar;


