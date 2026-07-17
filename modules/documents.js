// ============================================
// DOCUMENTS — Tela de documentos, upload, validação
// PFA Dashboard — Módulo extraído do app.js
// ============================================

// ==========================================
// DOCUMENTS SCREEN LOGIC
// ==========================================
function initDocumentsScreen() {
  initDocsScaleControl();
  
  if (typeof renderDocsSidebarClientList === 'function') {
    renderDocsSidebarClientList();
  }
  
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
      const stdActions = document.getElementById('docs-standard-actions');
      const andActions = document.getElementById('docs-andamento-actions');
      const tableWrapper = document.getElementById('docs-table-wrapper');
      const andContainer = document.getElementById('docs-andamento-container');
      const detailsContainer = document.getElementById('docs-details-container');

      if (currentDocFolder === 'andamento') {
        if (folderTitle) folderTitle.innerText = '🔗 Acompanhamento do Cliente (Link Compartilhável)';
        if (stdActions) stdActions.style.display = 'none';
        if (andActions) andActions.style.display = 'flex';
        if (tableWrapper) tableWrapper.style.display = 'none';
        if (andContainer) andContainer.style.display = 'grid';
        if (detailsContainer) detailsContainer.style.display = 'none';
        
        const linkBox = document.getElementById('generated-link-box');
        if (linkBox) linkBox.style.display = 'none';
        
        window.updateClientPagePreview();
      } else {
        if (folderTitle) {
          folderTitle.innerText = `Arquivos em 0${currentDocFolder === 'pessoais' ? '1. Pessoais' : currentDocFolder === 'processo' ? '2. Processo' : currentDocFolder === 'comunicacoes' ? '3. Comunicações' : '4. Financeiro'}`;
        }
        if (stdActions) stdActions.style.display = 'flex';
        if (andActions) andActions.style.display = 'none';
        if (tableWrapper) tableWrapper.style.display = 'block';
        if (andContainer) andContainer.style.display = 'none';
        if (detailsContainer) detailsContainer.style.display = 'none';
        
        renderDocumentsTable();
      }
    });
  });

  const stdActions = document.getElementById('docs-standard-actions');
  const andActions = document.getElementById('docs-andamento-actions');
  const tableWrapper = document.getElementById('docs-table-wrapper');
  const andContainer = document.getElementById('docs-andamento-container');
  if (stdActions) stdActions.style.display = 'flex';
  if (andActions) andActions.style.display = 'none';
  if (tableWrapper) tableWrapper.style.display = 'block';
  if (andContainer) andContainer.style.display = 'none';

  renderDocumentsTable();
}

function renderDocumentsTable() {
  if (!docsTableBody) return;
  docsTableBody.innerHTML = '';
  const lead = getCurrentLead();

  const allDocs = lead.documentos.filter(d => d.folder === currentDocFolder);

  if (allDocs.length === 0) {
    docsTableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center;color:var(--text-secondary);padding:30px;">Nenhum documento nesta pasta para ${lead.name}.</td>
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

    // Status editável — select inline
    const statusOpts = ['Pendente','Recebido','Validado','Recusado'];
    const statusHTML = `<select title="Alterar status" onclick="event.stopPropagation()"
      style="border:1px solid transparent;border-radius:4px;background:transparent;font-size:11px;font-weight:700;cursor:pointer;padding:2px 4px;"
      onmouseover="this.style.borderColor='var(--border-color)'"
      onmouseout="if(document.activeElement!==this)this.style.borderColor='transparent'"
      onchange="event.stopPropagation();const lead=getCurrentLead();const d=lead.documentos.find(x=>x.name==='${doc.name.replace(/'/g, "\\'")}');if(d){d.status=this.value;renderDocumentsTable();showToastNotification('Status atualizado','→ '+this.value,'success');}">
      ${statusOpts.map(s => `<option value="${s}" ${s===doc.status?'selected':''}
        style="font-weight:700;color:${s==='Validado'?'#10b981':s==='Recusado'?'#ef4444':s==='Recebido'?'#f59e0b':'var(--text-secondary)'}">${s}</option>`).join('')}
    </select>`;

    // Nome editável
    const docIndex = lead.documentos.findIndex(x => x.name === doc.name);
    row.innerHTML = `
      <td>
        <div contenteditable="true" onclick="event.stopPropagation()" title="Clique para editar o nome do documento"
          style="outline:none;border:1px solid transparent;border-radius:4px;padding:2px 4px;cursor:text;font-weight:600;transition:border-color 0.15s;display:inline-block;min-width:120px;"
          onmouseover="this.style.borderColor='var(--border-color)'"
          onmouseout="if(document.activeElement!==this)this.style.borderColor='transparent'"
          onfocus="this.style.borderColor='var(--brand-primary)'"
          onblur="const lead=getCurrentLead();const d=lead.documentos[${docIndex}];if(d&&this.innerText.trim()){d.name=this.innerText.trim();}this.style.borderColor='transparent'"
        >${doc.name}</div>
        <br><span style="font-size:10px; color:var(--text-secondary);">${doc.size}</span>
      </td>
      <td style="font-size:11px;color:var(--text-secondary);">${doc.folder === 'pessoais' ? 'Pessoal' : doc.folder === 'processo' ? 'Processo' : doc.folder === 'comunicacoes' ? 'Comunicação' : 'Financeiro'}</td>
      <td>${statusHTML}</td>
      <td style="font-size:11px;">${doc.date}</td>
      <td>
        <div class="table-actions" onclick="event.stopPropagation()" style="display:flex; gap:6px; justify-content:flex-end;">
          <button class="btn btn-outline-yellow" title="Solicitar Assinatura (WhatsApp)" onclick="requestSignatureSimulate('${doc.name}')" style="font-size:10.5px; padding:4px 8px; font-weight:700;">✍️ Assinar</button>
          <button class="btn btn-outline-green" title="Validar Documento" onclick="validateDocument('${doc.name}', true)" style="font-size:10.5px; padding:4px 8px; font-weight:700; color:var(--green-primary); border-color:var(--green-primary);">✓ Validar</button>
          <button class="btn btn-danger" title="Recusar Documento" onclick="validateDocument('${doc.name}', false)" style="font-size:10.5px; padding:4px 8px; font-weight:700; background:#fee2e2; border-color:#fca5a5; color:#b91c1c;">✗ Recusar</button>
          <button class="btn btn-danger" title="Excluir Documento" onclick="deleteDocumentSimulate('${doc.name}')" style="font-size:10.5px; padding:4px 8px; font-weight:700; background:#fee2e2; border-color:#fca5a5; color:#b91c1c;">🗑️</button>
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
    <div style="margin-top:20px; line-height:1.5; font-size:11px; border-top:1px solid var(--border-color); padding-top:10px;color:var(--text-primary);">
      <strong>Conteúdo do Documento:</strong><br>
      Este é um arquivo anexado ao caso de ${lead.tipoCaso} do cliente ${lead.name}. 
      Status atualizado para: ${doc.status}. Para validar este arquivo para peticionamento legal ou envio ao Detran, use os botões na tabela.
    </div>
  `;
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
          <textarea id="req-doc-msg" style="height:80px;" placeholder="Mensagem que será enviada ao cliente..."></textarea>
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
  const msgArea = overlay.querySelector('#req-doc-msg');
  const updateMsg = () => {
    const docName = docSelect.value.replace('.pdf', '');
    msgArea.value = `Olá ${lead.name.split(' ')[0]}! Para dar andamento ao seu recurso de ${lead.tipoCaso}, preciso que vocêêê me envie o seguinte documento: *${docName}*. Você consegue enviar a foto ou arquivo por aqui?`;
  };
  docSelect.addEventListener('change', updateMsg);
  updateMsg();
}

function sendDocumentRequest(leadId, button) {
  const overlay = button ? button.closest('.modal-overlay') : document.querySelector('.modal-overlay.active');
  if (!overlay) return;

  const lead = window.mockLeads.find(l => l.id === leadId);
  const docSelect = overlay.querySelector('#req-doc-type');
  const msgText = overlay.querySelector('#req-doc-msg').value;
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
    text: msgText,
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

// ============================================================
// CLIENT MONITORING AND PROGRESS PUBLIC LINK SIMULATOR
// ============================================================

window.updateClientPagePreview = function() {
  const lead = getCurrentLead();
  if (!lead) return;

  // Name update
  document.querySelectorAll('.client-name-preview').forEach(el => {
    el.innerText = lead.name;
  });

  // Toggle Visibility Blocks based on checkboxes
  const blocks = [
    { cb: 'share-etapa', ids: ['preview-block-etapa', 'portal-block-etapa'] },
    { cb: 'share-docs', ids: ['preview-block-docs', 'portal-block-docs'] },
    { cb: 'share-historico', ids: ['preview-block-historico', 'portal-block-historico'] },
    { cb: 'share-financeiro', ids: ['preview-block-financeiro', 'portal-block-financeiro'] },
    { cb: 'share-advogado', ids: ['preview-block-advogado', 'portal-block-advogado'] }
  ];

  blocks.forEach(item => {
    const checked = document.getElementById(item.cb)?.checked;
    item.ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = checked ? 'block' : 'none';
      if (id.includes('advogado') && el && checked) {
        el.style.display = 'flex';
      }
    });
  });

  // 1. Render Progress Stage
  const currentEtapa = lead.etapa || 'Em Triagem';
  document.querySelectorAll('#preview-etapa-txt, #portal-etapa-txt').forEach(el => {
    el.innerText = `Etapa Atual: ${currentEtapa}`;
  });

  const stages = ['Triagem', 'Documentos', 'Defesa', 'Julgamento', 'Concluído'];
  let currentIdx = stages.findIndex(s => currentEtapa.includes(s));
  if (currentIdx === -1) currentIdx = 0;

  document.querySelectorAll('#preview-etapa-progress, #portal-etapa-progress').forEach(progressEl => {
    if (!progressEl) return;
    progressEl.innerHTML = stages.map((s, idx) => {
      const isPassed = idx <= currentIdx;
      const bg = isPassed ? '#10b981' : '#e2e8f0';
      return `<div style="flex:1; height:6px; background:${bg}; border-radius:3px;" title="${s}"></div>`;
    }).join('');
  });

  // 2. Render Pending Documents
  const pendingDocs = lead.documentos.filter(d => d.status === 'Pendente' || d.status === 'Aguardando envio');
  document.querySelectorAll('#preview-docs-list, #portal-docs-list').forEach(listEl => {
    if (!listEl) return;
    if (pendingDocs.length === 0) {
      listEl.innerHTML = `<div style="font-size:11px; color:#64748b; font-style:italic;">Nenhum documento pendente!</div>`;
    } else {
      listEl.innerHTML = pendingDocs.map(d => `
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; padding: 4px 0; border-bottom: 1px solid #f1f5f9;">
          <span style="color:#475569; font-weight:500;">📄 ${d.name}</span>
          <button onclick="window.simulateClientDocUploadFromPortal('${d.name.replace(/'/g, "\\'")}')" style="background:#eff6ff; border:1px solid #bfdbfe; color:#2563eb; font-size:9.5px; font-weight:bold; padding:2px 6px; border-radius:3px; cursor:pointer;">Upload 📤</button>
        </div>
      `).join('');
    }
  });

  // 3. Render Timeline
  document.querySelectorAll('#preview-timeline-list, #portal-timeline-list').forEach(listEl => {
    if (!listEl) return;
    const events = lead.timeline.slice(0, 3);
    if (events.length === 0) {
      listEl.innerHTML = `<div style="font-size:11px; color:#64748b; font-style:italic;">Nenhum andamento recente registrado.</div>`;
    } else {
      listEl.innerHTML = events.map(ev => `
        <div style="display:flex; gap:8px; font-size:10.5px; margin-bottom: 6px;">
          <div style="width:5px; height:5px; border-radius:50%; background:#7f1c1d; margin-top:5px; flex-shrink:0;"></div>
          <div style="flex:1;">
            <div style="font-weight:600; color:#1e293b;">${ev.title}</div>
            <div style="font-size:9px; color:#64748b;">${ev.time}</div>
          </div>
        </div>
      `).join('');
    }
  });

  // 4. Render Finance Details
  const honVal = lead.valorHonorarios || (lead.valorCausa * 0.3) || 1500;
  const pagoVal = lead.valoresPagos || 0;
  const restVal = Math.max(0, honVal - pagoVal);

  document.querySelectorAll('#preview-fin-total, #portal-fin-total').forEach(el => {
    el.innerText = 'R$ ' + honVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  });
  document.querySelectorAll('#preview-fin-pago, #portal-fin-pago').forEach(el => {
    el.innerText = 'R$ ' + pagoVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  });
  document.querySelectorAll('#preview-fin-rest, #portal-fin-rest').forEach(el => {
    el.innerText = 'R$ ' + restVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  });

  // 5. Render Lawyer Contact
  const lawyer = window.mockLawyers.find(l => l.id === lead.responsavelId) || window.mockLawyers[0];
  document.querySelectorAll('#preview-adv-initials, #portal-adv-initials').forEach(el => {
    el.innerText = lawyer.initials;
  });
  document.querySelectorAll('#preview-adv-name, #portal-adv-name').forEach(el => {
    el.innerText = lawyer.name;
  });
};

window.generateAcompanhamentoLink = function() {
  const lead = getCurrentLead();
  if (!lead) return;

  const hash = Math.floor(1000 + Math.random() * 9000);
  const cleanName = lead.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_');
  const generatedUrl = `https://pfa.adv.br/acompanhamento/${cleanName}_${lead.id}_${hash}`;

  const linkInput = document.getElementById('client-share-link');
  const linkBox = document.getElementById('generated-link-box');
  
  if (linkInput && linkBox) {
    linkInput.value = generatedUrl;
    linkBox.style.display = 'flex';
    showToastNotification('Link Gerado', 'O link de acompanhamento foi criado com sucesso! 🔗', 'success');
  }
};

window.copyClientShareLink = function() {
  const linkInput = document.getElementById('client-share-link');
  if (linkInput) {
    linkInput.select();
    linkInput.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(linkInput.value).then(() => {
      showToastNotification('Link Copiado', 'Link copiado para a área de transferência! 📋', 'success');
    }).catch(err => {
      console.error('Error copying text: ', err);
    });
  }
};

window.simulateClientPageOpen = function() {
  const modal = document.getElementById('client-portal-modal');
  if (modal) {
    modal.classList.add('active');
    window.updateClientPagePreview();
  }
};

window.simulateClientDocUploadFromPortal = function(docName) {
  const lead = getCurrentLead();
  if (!lead) return;

  const doc = lead.documentos.find(d => d.name === docName);
  if (doc) {
    doc.status = 'Recebido';
    doc.date = new Date().toLocaleString('pt-BR').substring(0, 16);
    doc.author = 'Cliente (Via Portal)';

    lead.timeline.unshift({
      time: new Date().toLocaleString('pt-BR').substring(0, 10),
      type: 'Sistema',
      title: 'Upload do Cliente',
      desc: `O cliente fez o upload de ${docName} pelo Portal de Acompanhamento.`
    });

    lead.messages.push({
      sender: 'client',
      text: `Enviei o documento solicitado: *${docName}* 📄`,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      read: false
    });

    showToastNotification('Documento Recebido', `O cliente enviou o documento "${docName}"! 📂`, 'success');
    
    window.updateClientPagePreview();
    renderDocumentsTable();
    if (typeof renderChatArea === 'function') renderChatArea();
    if (typeof renderChatList === 'function') renderChatList();
  }
};

window.selectDocsClientById = function(leadId) {
  window.currentLeadId = leadId;
  
  const searchInput = document.getElementById('docs-client-search');
  const activeLead = getCurrentLead();
  if (searchInput && activeLead) {
    searchInput.value = `${activeLead.name} (${activeLead.tipoCaso})`;
  }

  renderDocsSidebarClientList();
  renderDocumentsTable();
  
  if (currentDocFolder === 'andamento') {
    window.updateClientPagePreview();
  }
};

window.renderDocsSidebarClientList = function() {
  const container = document.getElementById('docs-sidebar-client-list');
  if (!container) return;

  const activeLead = getCurrentLead();
  
  container.innerHTML = window.mockLeads.map(lead => {
    const isActive = activeLead && activeLead.id === lead.id;
    const bg = isActive ? 'var(--brand-primary)' : 'var(--bg-tertiary)';
    const color = isActive ? '#fff' : 'var(--text-primary)';
    const borderColor = isActive ? 'var(--gold-primary)' : 'var(--border-color)';
    const badgeBg = isActive ? 'rgba(255,255,255,0.2)' : 'var(--bg-secondary)';
    const badgeColor = isActive ? '#fff' : 'var(--text-secondary)';
    
    return `
      <div class="docs-sidebar-client-item" style="padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 11.5px; transition: all 0.2s; display: flex; align-items: center; justify-content: space-between; background: ${bg}; color: ${color}; border: 1px solid ${borderColor}; margin-bottom: 2px;" onclick="window.selectDocsClientById(${lead.id})">
        <span style="font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100px;">${lead.name.split(' ')[0]} ${lead.name.split(' ')[1] || ''}</span>
        <span style="font-size: 9px; opacity: 0.9; background: ${badgeBg}; color: ${badgeColor}; padding: 1px 4px; border-radius: 4px; font-weight:700; white-space: nowrap;">${lead.tipoCaso.split(' ')[0]}</span>
      </div>
    `;
  }).join('');
};

function requestSignatureSimulate(docName) {
  const lead = getCurrentLead();
  showToastNotification('Assinatura Solicitada', `Solicitação enviada por WhatsApp para ${lead.name}. ✍️`, 'success');
  
  lead.timeline.unshift({
    time: new Date().toLocaleString('pt-BR').substring(0,10),
    type: 'Sistema',
    title: 'Assinatura Solicitada',
    desc: `Solicitação de assinatura do arquivo "${docName}" enviada via WhatsApp.`
  });
  renderBottomTabContent('documentos');
  renderTimeline(lead);
}

function deleteDocumentSimulate(docName) {
  const lead = getCurrentLead();
  const idx = lead.documentos.findIndex(d => d.name === docName);
  if (idx !== -1) {
    lead.documentos.splice(idx, 1);
    showToastNotification('Documento Excluído', `Arquivo "${docName}" removido com sucesso.`, 'success');
    renderDocumentsTable();
    renderBottomTabContent('documentos');
  }
}

window.requestSignatureSimulate = requestSignatureSimulate;
window.deleteDocumentSimulate = deleteDocumentSimulate;
window.initDocumentsScreen = initDocumentsScreen;


