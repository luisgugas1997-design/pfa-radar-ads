// ============================================
// FICHA CLIENTE — Portal de Trabalho Full-Viewport & Editor Unificado
// PFA Dashboard — Módulo para visualização detalhada, edição e andamentos do cliente
// ============================================

let activeFichaLeadId = null;
let activeFichaTab = 'andamentos';

function openDetailedClientModal(leadId) {
  const lead = window.mockLeads.find(l => l.id === leadId);
  if (!lead) return;

  activeFichaLeadId = leadId;
  activeFichaTab = 'andamentos';

  const portal = document.getElementById('detailed-client-modal');
  if (!portal) return;

  // Build the entire HTML of the portal dynamically
  portal.innerHTML = `
    <div class="detailed-client-container">
      <!-- TOP BAR -->
      <div class="detailed-client-topbar">
        <button class="btn-voltar-painel" onclick="closeDetailedClientModal()">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Voltar para o Painel
        </button>
        <div class="topbar-client-summary">
          <div class="avatar avatar-md">${getInitials(lead.name)}</div>
          <div>
            <h2>${lead.name}</h2>
            <span>ID do Lead: #${lead.id} • ${lead.tipoCaso}</span>
          </div>
        </div>
        <div class="topbar-actions">
          <button class="btn btn-yellow" onclick="saveDetailedFichaData(true)">💾 Salvar Alterações</button>
        </div>
      </div>

      <!-- MAIN CONTENT BODY -->
      <div class="detailed-client-body">
        
        <!-- LEFT COLUMN: CADASTRO & METADADOS (EDITOR) -->
        <div class="detailed-client-sidebar">
          
          <!-- Seção: Dados Pessoais -->
          <div class="ficha-card">
            <h3>👤 Informações Cadastrais</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Nome Completo</label>
                <input type="text" id="ficha-nome" value="${lead.name || ''}">
              </div>
              <div class="form-group">
                <label>Telefone / WhatsApp</label>
                <input type="text" id="ficha-telefone" value="${lead.phone || ''}">
              </div>
              <div class="form-group">
                <label>E-mail</label>
                <input type="email" id="ficha-email" value="${lead.email || ''}">
              </div>
              <div class="form-group">
                <label>CPF</label>
                <input type="text" id="ficha-cpf" value="${lead.cpf || ''}">
              </div>
              <div class="form-group" style="grid-column: span 2;">
                <label>Endereço Completo</label>
                <input type="text" id="ficha-endereco" value="${lead.endereco || ''}">
              </div>
            </div>
          </div>

          <!-- Seção: Dados do Processo -->
          <div class="ficha-card">
            <h3>⚖️ Informações Jurídicas</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Número do Processo</label>
                <input type="text" id="ficha-processo" value="${lead.processo || ''}">
              </div>
              <div class="form-group">
                <label>Órgão Autuador</label>
                <input type="text" id="ficha-autuador" value="${lead.autuador || ''}">
              </div>
              <div class="form-group">
                <label>Data da Infração</label>
                <input type="date" id="ficha-data-infra" value="${formatDateToISO(lead.dataInfra) || ''}">
              </div>
              <div class="form-group">
                <label>Localização / Cidade</label>
                <input type="text" id="ficha-localizacao" value="${lead.location || ''}">
              </div>
              <div class="form-group">
                <label>Etapa Atual no CRM</label>
                <select id="ficha-etapa">
                  <option value="Em Triagem" ${lead.etapa === 'Em Triagem' ? 'selected' : ''}>Em Triagem</option>
                  <option value="Documentos" ${lead.etapa === 'Documentos' ? 'selected' : ''}>Documentos</option>
                  <option value="Elaboração Defesa" ${lead.etapa === 'Elaboração Defesa' ? 'selected' : ''}>Elaboração Defesa</option>
                  <option value="Protocolo" ${lead.etapa === 'Protocolo' ? 'selected' : ''}>Protocolo</option>
                  <option value="Julgamento JARI" ${lead.etapa === 'Julgamento JARI' ? 'selected' : ''}>Julgamento JARI</option>
                  <option value="Recurso CETRAN" ${lead.etapa === 'Recurso CETRAN' ? 'selected' : ''}>Recurso CETRAN</option>
                  <option value="Concluído" ${lead.etapa === 'Concluído' ? 'selected' : ''}>Concluído</option>
                </select>
              </div>
              <div class="form-group">
                <label>Prioridade</label>
                <select id="ficha-prioridade">
                  <option value="baixa" ${lead.prioridade === 'baixa' ? 'selected' : ''}>Baixa</option>
                  <option value="media" ${lead.prioridade === 'media' ? 'selected' : ''}>Média</option>
                  <option value="alta" ${lead.prioridade === 'alta' ? 'selected' : ''}>Alta</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Seção: Configurações de Automação -->
          <div class="ficha-card flex-row-between">
            <div>
              <h3 style="margin:0; font-size:13px;">🤖 Robô IA Chatbot</h3>
              <p style="margin:2px 0 0 0; font-size:11px; color:var(--text-secondary);">Quando ativado, a IA responde o WhatsApp do cliente automaticamente.</p>
            </div>
            <label class="switch-toggle">
              <input type="checkbox" id="ficha-robo-switch" ${lead.roboAtivo ? 'checked' : ''}>
              <span class="switch-slider"></span>
            </label>
          </div>

        </div>

        <!-- RIGHT COLUMN: ABAS DE TRABALHO -->
        <div class="detailed-client-tabs-area">
          <!-- NAVIGATION TABS -->
          <div class="ficha-tabs-header">
            <button class="ficha-tab-btn active" id="ficha-btn-andamentos" onclick="switchDetailedFichaTab('andamentos')">💬 Histórico & Andamentos</button>
            <button class="ficha-tab-btn" id="ficha-btn-financeiro" onclick="switchDetailedFichaTab('financeiro')">💰 Financeiro Detalhado</button>
            <button class="ficha-tab-btn" id="ficha-btn-documentos" onclick="switchDetailedFichaTab('documentos')">📄 Documentos do Cliente</button>
            <button class="ficha-tab-btn" id="ficha-btn-prompt" onclick="switchDetailedFichaTab('prompt')">🚀 Instruções da IA</button>
          </div>

          <!-- TAB CONTENT: HISTORICO & ANDAMENTOS -->
          <div class="ficha-tab-pane active" id="ficha-pane-andamentos">
            <!-- Novo Andamento Input -->
            <div class="add-andamento-box">
              <h4>Adicionar Novo Andamento ao Processo</h4>
              <div class="add-andamento-form">
                <textarea id="ficha-new-andamento-text" placeholder="Digite aqui o andamento judicial, administrative ou aviso importante para o cliente..."></textarea>
                <button class="btn btn-yellow" onclick="addDetailedFichaAndamento()">+ Adicionar Andamento</button>
              </div>
            </div>

            <!-- Linha do tempo -->
            <div class="ficha-timeline-container">
              <h4>Histórico Cronológico do Processo</h4>
              <div class="ficha-timeline" id="detailed-ficha-timeline">
                ${renderFichaTimeline(lead.timeline)}
              </div>
            </div>
          </div>

          <!-- TAB CONTENT: FINANCEIRO -->
          <div class="ficha-tab-pane" id="ficha-pane-financeiro">
            <div class="financeiro-edit-grid">
              <div class="ficha-card">
                <h3>Resumo de Valores</h3>
                <div class="form-grid">
                  <div class="form-group">
                    <label>Valor Total dos Honorários (R$)</label>
                    <input type="number" step="0.01" id="ficha-fin-total" value="${lead.valorCausa || 0}" oninput="calculateFichaFinanceRest()">
                  </div>
                  <div class="form-group">
                    <label>Valor Pago até o Momento (R$)</label>
                    <input type="number" step="0.01" id="ficha-fin-pago" value="${lead.valoresPagos || 0}" oninput="calculateFichaFinanceRest()">
                  </div>
                  <div class="form-group">
                    <label>Saldo Restante (R$)</label>
                    <input type="text" id="ficha-fin-restante" value="${((lead.valorCausa || 0) - (lead.valoresPagos || 0)).toFixed(2)}" readonly style="background:var(--bg-secondary);">
                  </div>
                  <div class="form-group">
                    <label>Tipo de Pagamento</label>
                    <select id="ficha-fin-tipo">
                      <option value="PIX" ${lead.financeiroTipo === 'PIX' ? 'selected' : ''}>PIX</option>
                      <option value="Cartão de Crédito" ${lead.financeiroTipo === 'Cartão de Crédito' ? 'selected' : ''}>Cartão de Crédito</option>
                      <option value="Boleto Bancário" ${lead.financeiroTipo === 'Boleto Bancário' ? 'selected' : ''}>Boleto Bancário</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Quantidade de Parcelas</label>
                    <select id="ficha-fin-parcelas">
                      <option value="1" ${lead.financeiroParcelas === 1 ? 'selected' : ''}>À Vista (1x)</option>
                      <option value="2" ${lead.financeiroParcelas === 2 ? 'selected' : ''}>2x</option>
                      <option value="3" ${lead.financeiroParcelas === 3 ? 'selected' : ''}>3x</option>
                      <option value="4" ${lead.financeiroParcelas === 4 ? 'selected' : ''}>4x</option>
                      <option value="5" ${lead.financeiroParcelas === 5 ? 'selected' : ''}>5x</option>
                      <option value="6" ${lead.financeiroParcelas === 6 ? 'selected' : ''}>6x</option>
                      <option value="12" ${lead.financeiroParcelas === 12 ? 'selected' : ''}>12x</option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="ficha-card" style="display:flex; flex-direction:column; justify-content:space-between;">
                <div>
                  <h3>🔗 Links e Cobranças Asaas</h3>
                  <p style="font-size:12px; color:var(--text-secondary); margin-bottom:12px;">Gere faturas e acompanhe o recebimento integrado de forma automatizada.</p>
                  
                  <div class="asaas-simulated-box">
                    <strong>Status no Asaas:</strong>
                    <span class="badge ${lead.valoresPagos >= lead.valorCausa ? 'validated' : 'pending'}" style="margin-left:4px;">
                      ${lead.valoresPagos >= lead.valorCausa ? 'Liquidado' : 'Aguardando Pagamento'}
                    </span>
                    <div style="font-size:11px; margin-top:8px; color:var(--text-secondary);">Fatura #AS39281-002 • Vencimento: 25/08/2026</div>
                  </div>
                </div>
                
                <button class="btn btn-yellow" style="width:100%; padding:12px; font-weight:700;" onclick="generateAsaasSimulatedLink()">
                  🔗 Re-gerar Link de Cobrança (Asaas)
                </button>
              </div>
            </div>
          </div>

          <!-- TAB CONTENT: DOCUMENTOS -->
          <div class="ficha-tab-pane" id="ficha-pane-documentos">
            <div class="ficha-card">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h3 style="margin:0;">📁 Pasta de Arquivos do Processo</h3>
                <button class="btn btn-yellow" style="padding:6px 12px; font-size:11px;" onclick="document.getElementById('ficha-doc-upload-hidden').click()">+ Upload Arquivo</button>
                <input type="file" id="ficha-doc-upload-hidden" style="display:none;" onchange="uploadFichaDocumentSimulate(this)">
              </div>
              
              <div class="ficha-doc-list">
                <table class="crm-table">
                  <thead>
                    <tr>
                      <th>Nome do Arquivo</th>
                      <th>Pasta</th>
                      <th>Data do Envio</th>
                      <th>Status</th>
                      <th style="text-align:right;">Ações</th>
                    </tr>
                  </thead>
                  <tbody id="ficha-doc-table-body">
                    ${renderFichaDocuments(lead.documentos)}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- TAB CONTENT: PROMPT IA -->
          <div class="ficha-tab-pane" id="ficha-pane-prompt">
            <div class="ficha-card">
              <h3>🚀 Instruções Personalizadas do Chatbot (Prompt Customizado)</h3>
              <p style="font-size:12px; color:var(--text-secondary); margin-bottom:12px;">Calibre a personalidade do robô especificamente para este cliente. A IA lerá essas instruções antes de enviar qualquer mensagem no WhatsApp.</p>
              
              <textarea id="ficha-prompt-text" style="width:100%; height:200px; padding:15px; border-radius:8px; border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--text-primary); font-family:inherit; font-size:13px; line-height:1.5; resize:none;" placeholder="Ex: João está muito preocupado com a suspensão da CNH dele. Dê ênfase na Metodologia PFA e evite termos excessivamente jurídicos...">${lead.promptCustom || ''}</textarea>
              
              <div style="display:flex; justify-content:flex-end; margin-top:12px;">
                <button class="btn btn-yellow" onclick="saveDetailedFichaData(true)">💾 Salvar Instruções</button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  `;

  // Display the portal
  portal.style.display = 'block';
  portal.scrollTop = 0;
}

function closeDetailedClientModal() {
  const portal = document.getElementById('detailed-client-modal');
  if (portal) {
    // Save data automatically on close
    saveDetailedFichaData(false);
    portal.style.display = 'none';
  }

  // Refresh lists to display modified content
  if (typeof renderCRMLeadsTable === 'function') renderCRMLeadsTable();
  if (typeof renderFullKanbanScreen === 'function') renderFullKanbanScreen();
  if (typeof renderChatList === 'function') renderChatList();
  if (typeof renderChatArea === 'function') renderChatArea();
  if (typeof initDocumentsScreen === 'function') initDocumentsScreen();
  if (typeof renderFinanceDashboard === 'function') renderFinanceDashboard();
}

function switchDetailedFichaTab(tabName) {
  activeFichaTab = tabName;

  // Toggle tab buttons active state
  const tabs = document.querySelectorAll('.ficha-tab-btn');
  tabs.forEach(t => t.classList.remove('active'));

  const btn = document.getElementById(`ficha-btn-${tabName}`);
  if (btn) btn.classList.add('active');

  // Toggle tab panes visibility
  const panes = document.querySelectorAll('.ficha-tab-pane');
  panes.forEach(p => p.classList.remove('active'));

  const pane = document.getElementById(`ficha-pane-${tabName}`);
  if (pane) pane.classList.add('active');
}

function renderFichaTimeline(timeline) {
  if (!timeline || timeline.length === 0) {
    return `<div style="font-size:12px; color:var(--text-secondary); text-align:center; padding:20px;">Nenhum andamento registrado.</div>`;
  }

  return timeline.map(item => `
    <div class="timeline-item">
      <div class="timeline-meta">
        <strong>${item.time.split(' ')[0]}</strong>
        <span>${item.time.split(' ')[1] || ''}</span>
      </div>
      <div class="timeline-badge">${item.type === 'Sistema' ? '⚙️' : '👤'}</div>
      <div class="timeline-content">
        <h5>${item.title}</h5>
        <p>${item.desc}</p>
      </div>
    </div>
  `).join('');
}

function renderFichaDocuments(docs) {
  if (!docs || docs.length === 0) {
    return `<tr><td colspan="5" style="text-align:center; font-size:12px; color:var(--text-secondary); padding:20px;">Nenhum documento anexado.</td></tr>`;
  }

  return docs.map((doc, idx) => `
    <tr>
      <td><strong>${doc.name}</strong><br><span style="font-size:9.5px; color:var(--text-secondary);">${doc.size || '350 KB'}</span></td>
      <td><span class="table-caso-badge" style="text-transform: capitalize; background:rgba(0,0,0,0.03); color:var(--text-primary); border:1px solid var(--border-color);">${doc.folder}</span></td>
      <td>${doc.date || 'Hoje'}</td>
      <td>
        <span class="badge ${doc.status === 'Recebido' ? 'pending' : doc.status === 'Validado' ? 'validated' : 'refused'}">
          ${doc.status}
        </span>
      </td>
      <td>
        <div style="display:flex; justify-content:flex-end; gap:6px;">
          <button class="btn btn-outline-yellow" style="padding:4px 8px; font-size:10px; font-weight:700;" onclick="downloadFichaDocumentSimulated('${doc.name}')">⬇️ Baixar</button>
          <button class="btn btn-outline-orange" style="padding:4px 8px; font-size:10px; font-weight:700;" onclick="validateFichaDocumentSimulated(${idx}, 'Validado')">✓ Validar</button>
          <button class="btn btn-danger" style="padding:4px 8px; font-size:10px; font-weight:700; background:#fee2e2; border-color:#fca5a5; color:#b91c1c;" onclick="validateFichaDocumentSimulated(${idx}, 'Recusado')">✗ Recusar</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function addDetailedFichaAndamento() {
  const textInput = document.getElementById('ficha-new-andamento-text');
  if (!textInput) return;

  const text = textInput.value.trim();
  if (!text) {
    alert('Digite uma descrição válida para o andamento!');
    return;
  }

  const lead = window.mockLeads.find(l => l.id === activeFichaLeadId);
  if (!lead) return;

  const now = new Date();
  const dateStr = `${now.getDate().toString().padStart(2,'0')}/${(now.getMonth()+1).toString().padStart(2,'0')}/${now.getFullYear()}`;
  const timeStr = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
  const fullTimestamp = `${dateStr} ${timeStr}`;

  // Insert into lead timeline
  lead.timeline.unshift({
    time: fullTimestamp,
    type: 'Advogado',
    title: 'Andamento Judicial',
    desc: text
  });

  // Log in user actions
  console.log(`[Andamento] Added to Lead #${lead.id}: ${text}`);

  // Save and re-render tab
  textInput.value = '';
  const timelineContainer = document.getElementById('detailed-ficha-timeline');
  if (timelineContainer) {
    timelineContainer.innerHTML = renderFichaTimeline(lead.timeline);
  }

  showToastNotification('Andamento Adicionado', 'Andamento registrado com sucesso! ✅', 'success');
}

function saveDetailedFichaData(showToast = false) {
  const lead = window.mockLeads.find(l => l.id === activeFichaLeadId);
  if (!lead) return;

  // 1. Gather Personal Metadados
  const nomeInput = document.getElementById('ficha-nome');
  const telInput = document.getElementById('ficha-telefone');
  const emailInput = document.getElementById('ficha-email');
  const cpfInput = document.getElementById('ficha-cpf');
  const endInput = document.getElementById('ficha-endereco');

  if (nomeInput) lead.name = nomeInput.value;
  if (telInput) lead.phone = telInput.value;
  if (emailInput) lead.email = emailInput.value;
  if (cpfInput) lead.cpf = cpfInput.value;
  if (endInput) lead.endereco = endInput.value;

  // 2. Gather Process Metadados
  const procInput = document.getElementById('ficha-processo');
  const autuadorInput = document.getElementById('ficha-autuador');
  const dataInfraInput = document.getElementById('ficha-data-infra');
  const locInput = document.getElementById('ficha-localizacao');
  const etapaSelect = document.getElementById('ficha-etapa');
  const prioSelect = document.getElementById('ficha-prioridade');
  const roboSwitch = document.getElementById('ficha-robo-switch');

  if (procInput) lead.processo = procInput.value;
  if (autuadorInput) lead.autuador = autuadorInput.value;
  if (dataInfraInput) lead.dataInfra = formatDateToBR(dataInfraInput.value);
  if (locInput) lead.location = locInput.value;
  if (etapaSelect) lead.etapa = etapaSelect.value;
  if (prioSelect) lead.prioridade = prioSelect.value;
  if (roboSwitch) lead.roboAtivo = roboSwitch.checked;

  // 3. Gather Financial Metadados
  const totalInput = document.getElementById('ficha-fin-total');
  const pagoInput = document.getElementById('ficha-fin-pago');
  const tipoSelect = document.getElementById('ficha-fin-tipo');
  const parcelasSelect = document.getElementById('ficha-fin-parcelas');

  if (totalInput) lead.valorCausa = parseFloat(totalInput.value) || 0;
  if (pagoInput) lead.valoresPagos = parseFloat(pagoInput.value) || 0;
  if (tipoSelect) lead.financeiroTipo = tipoSelect.value;
  if (parcelasSelect) lead.financeiroParcelas = parseInt(parcelasSelect.value) || 1;

  // 4. Gather custom prompt IA
  const promptInput = document.getElementById('ficha-prompt-text');
  if (promptInput) lead.promptCustom = promptInput.value;

  // Push updates to local state persistence
  if (showToast) {
    showToastNotification('Dados Salvos', 'Ficha atualizada e salva no banco de dados! ✅', 'success');
  }
}

function calculateFichaFinanceRest() {
  const totalVal = parseFloat(document.getElementById('ficha-fin-total').value) || 0;
  const pagoVal = parseFloat(document.getElementById('ficha-fin-pago').value) || 0;
  const rest = Math.max(0, totalVal - pagoVal);
  const restInput = document.getElementById('ficha-fin-restante');
  if (restInput) restInput.value = rest.toFixed(2);
}

function generateAsaasSimulatedLink() {
  const lead = window.mockLeads.find(l => l.id === activeFichaLeadId);
  if (!lead) return;
  const val = lead.valorCausa - lead.valoresPagos;
  showToastNotification('Faturamento Gerado', `Link de cobrança gerado no Asaas de R$ ${val.toFixed(2)} enviado! 💳`, 'success');
}

function downloadFichaDocumentSimulated(docName) {
  showToastNotification('Download Iniciado', `Baixando arquivo ${docName}... ⬇️`, 'success');
}

function validateFichaDocumentSimulated(docIdx, status) {
  const lead = window.mockLeads.find(l => l.id === activeFichaLeadId);
  if (!lead || !lead.documentos || !lead.documentos[docIdx]) return;

  lead.documentos[docIdx].status = status;
  
  // Re-render documents table tab
  const tbody = document.getElementById('ficha-doc-table-body');
  if (tbody) tbody.innerHTML = renderFichaDocuments(lead.documentos);

  showToastNotification('Documento Atualizado', `Status alterado para ${status}.`, 'success');
}

function uploadFichaDocumentSimulate(input) {
  if (!input.files || input.files.length === 0) return;
  const file = input.files[0];

  const lead = window.mockLeads.find(l => l.id === activeFichaLeadId);
  if (!lead) return;

  const now = new Date();
  const dateStr = `${now.getDate().toString().padStart(2,'0')}/${(now.getMonth()+1).toString().padStart(2,'0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;

  lead.documentos.push({
    name: file.name,
    folder: 'pessoais',
    status: 'Recebido',
    size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
    date: dateStr,
    author: 'Advogado'
  });

  // Re-render documents table tab
  const tbody = document.getElementById('ficha-doc-table-body');
  if (tbody) tbody.innerHTML = renderFichaDocuments(lead.documentos);

  showToastNotification('Upload Realizado', `Arquivo ${file.name} adicionado com sucesso! ✅`, 'success');
}

// Bind lifecycle methods to window global context
window.openDetailedClientModal = openDetailedClientModal;
window.closeDetailedClientModal = closeDetailedClientModal;
window.switchDetailedFichaTab = switchDetailedFichaTab;
window.addDetailedFichaAndamento = addDetailedFichaAndamento;
window.saveDetailedFichaData = saveDetailedFichaData;
window.calculateFichaFinanceRest = calculateFichaFinanceRest;
window.generateAsaasSimulatedLink = generateAsaasSimulatedLink;
window.downloadFichaDocumentSimulated = downloadFichaDocumentSimulated;
window.validateFichaDocumentSimulated = validateFichaDocumentSimulated;
window.uploadFichaDocumentSimulate = uploadFichaDocumentSimulate;
