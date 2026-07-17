// ============================================
// DOCVIEWPORT — Viewport de documentos, drag-drop, chat notes, tarefas inline
// PFA Dashboard — Módulo extraído do app.js
// ============================================

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
function saveClientNotes(leadId, textVal = null) {
  const lead = window.mockLeads.find(l => l.id === leadId);
  const notesAreaSidebar = document.getElementById('sidebar-client-notes');
  const notesAreaChat = document.getElementById('chat-client-notes');
  const text = textVal !== null ? textVal : (notesAreaSidebar ? notesAreaSidebar.value : (notesAreaChat ? notesAreaChat.value : ''));
  
  if (lead) {
    lead.notasCustom = text;
    
    // Prevent duplicate timeline logs if saved multiple times in a row
    const lastEvent = lead.timeline[0];
    const isDuplicate = lastEvent && lastEvent.title === 'Nota Salva';
    
    if (!isDuplicate) {
      lead.timeline.unshift({
        time: new Date().toLocaleString('pt-BR').substring(0, 10),
        type: 'Advogado',
        title: 'Nota Salva',
        desc: 'Observação interna adicionada pelo advogado.'
      });
    }
    
    showToastNotification('Nota Salva', 'Anotações gravadas com sucesso! 📋', 'success');
    
    if (notesAreaSidebar) notesAreaSidebar.value = text;
    if (notesAreaChat) notesAreaChat.value = text;
    
    // Safely update right sidebar and bottom content
    if (typeof renderBottomTabContent === 'function') {
      // Re-render notes tab if visible to reflect updates
      const activeTab = document.querySelector('#bottom-tabs .panel-tab.active');
      if (activeTab && activeTab.getAttribute('data-tab') === 'notas') {
        renderBottomTabContent('notas');
      }
    }
  }
}

function confirmAndSaveNotes(leadId) {
  const lead = window.mockLeads.find(l => l.id === leadId);
  if (!lead) return;

  const notesAreaSidebar = document.getElementById('sidebar-client-notes');
  const notesAreaChat = document.getElementById('chat-client-notes');
  const text = notesAreaSidebar ? notesAreaSidebar.value : (notesAreaChat ? notesAreaChat.value : '');

  if (!text.trim()) {
    showToastNotification('Nota vazia', 'Por favor, digite alguma observação antes de salvar. 📋', 'error');
    return;
  }

  // Create the confirmation modal overlay
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.id = 'confirm-notes-modal';
  overlay.style.zIndex = '10005';
  
  overlay.innerHTML = `
    <div class="edit-lead-modal" style="max-width: 420px; border-radius: 12px; background: var(--bg-secondary); border: 1px solid var(--border-color); box-shadow: var(--shadow-lg); overflow: hidden; display: flex; flex-direction: column;">
      <div class="modal-header" style="background: var(--brand-primary); color: #fff; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--gold-primary);">
        <h3 style="font-size: 14px; font-weight: 700; margin: 0; display: flex; align-items: center; gap: 6px; color: var(--gold-primary);">
          📋 Confirmar Gravação de Nota
        </h3>
        <button class="modal-close-btn" onclick="this.closest('.modal-overlay').remove()" style="background: none; border: none; color: #fff; font-size: 20px; cursor: pointer; font-weight: bold;">&times;</button>
      </div>
      
      <div class="modal-body" style="padding: 16px; font-size: 13px; color: var(--text-primary); display: flex; flex-direction: column; gap: 12px; line-height: 1.5; text-align: left;">
        <div style="background: rgba(220,100,0,0.05); border-left: 3px solid var(--orange-primary); padding: 8px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; color: var(--orange-primary);">
          📢 Destino da anotação:
        </div>
        <p style="margin: 0;">Esta nota será salva na <strong>Ficha do Cliente (${lead.name})</strong>, visível no painel lateral direito sob a aba <strong>Resumo</strong>.</p>
        
        <div style="font-size: 11px; font-weight: bold; color: var(--text-secondary); text-transform: uppercase;">Conteúdo da Nota:</div>
        <div style="background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 6px; padding: 10px; font-style: italic; max-height: 100px; overflow-y: auto; font-size: 12px; color: var(--text-secondary); white-space: pre-wrap;">"${text}"</div>
      </div>
      
      <div class="modal-footer" style="padding: 12px 16px; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; gap: 8px; background: var(--bg-tertiary);">
        <button class="btn btn-outline-yellow" onclick="this.closest('.modal-overlay').remove()" style="font-size: 11px; padding: 6px 12px; font-weight: bold;">Cancelar</button>
        <button class="btn btn-yellow" onclick="window.executeNotesSave(${leadId}, \`${text.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`); this.closest('.modal-overlay').remove();" style="font-size: 11px; padding: 6px 12px; font-weight: bold;">✅ Confirmar e Salvar</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
}

function executeNotesSave(leadId, text) {
  saveClientNotes(leadId, text);
  
  // Highlight the sidebar notes container temporarily to show exactly where it went!
  const sidebarBox = document.querySelector('.notes-sidebar-box');
  if (sidebarBox) {
    sidebarBox.style.transition = 'background-color 0.3s ease';
    sidebarBox.style.backgroundColor = 'rgba(234, 179, 8, 0.2)'; // Gold flash
    sidebarBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => {
      sidebarBox.style.backgroundColor = 'transparent';
    }, 1500);
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
    text: 'Olá! Passando para lembrar que ainda precisamos do envio dos seus documentos pendentes para dar andamento ao seu caso. Você pode enviar por aqui.',
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

// Global Window Bindings
window.saveClientNotes = saveClientNotes;
window.confirmAndSaveNotes = confirmAndSaveNotes;
window.executeNotesSave = executeNotesSave;
window.saveClientPromptFromChat = saveClientPromptFromChat;
window.toggleControladoriaTaskDirect = toggleControladoriaTaskDirect;
window.openNewTaskForLead = openNewTaskForLead;
window.sendDocumentRequest = sendDocumentRequest;
window.downloadChatFile = downloadChatFile;
window.toggleChatMaximization = toggleChatMaximization;
window.triggerFileInputClick = triggerFileInputClick;
window.handleFileSelect = handleFileSelect;
window.updateClientFinanceInline = updateClientFinanceInline;


