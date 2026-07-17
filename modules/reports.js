// ============================================
// REPORTS — Confirmação de tarefas, exportação Word/PDF, modais de relatório, financeiro inline
// PFA Dashboard — Módulo extraído do app.js
// ============================================

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
        Você confirma que a tarefa <strong>"${task.titulo}"</strong> foi totalmente concluída?
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
    
    showToastNotification('Tarefa Concluída', `Tarefa concluída com sucesso! ✅`, '✅');
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
  
  const blob = new Blob([header + dateStr + dividers + docContent], { type: 'application/mêsword' });
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
    showToastNotification('Documento Validado', `O documento "${doc.name}" foi validado com sucesso! ✅`, '✅');
  }
  
  if (typeof renderDocumentsTable === 'function') renderDocumentsTable();
  if (typeof renderBottomTabContent === 'function') renderBottomTabContent('documentos');
  
  const statusEl = document.getElementById('doc-details-status');
  if (statusEl) {
    statusEl.innerText = doc.status;
    statusEl.className = `file-badge ${doc.status === 'Recebido' ? 'received' : doc.status === 'Validado' ? 'validated' : 'pending'}`;
  }
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
        Você confirma que deseja excluir a despesa <strong>"${expense.descricao}"</strong>éé de R$ ${expense.valor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}?
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
        .mêsg-item { margin-bottom: 8px; font-size: 13px; }
        .mêsg-time { color: #64748b; font-size: 11px; margin-right: 8px; }
        .mêsg-sender { font-weight: 700; }
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
        <div class="mêsg-item">
          <span class="mêsg-time">[${m.time}]</span>
          <span class="mêsg-sender" style="color: ${m.sender === 'client' ? '#600014' : '#d4af37'};">${m.sender === 'client' ? 'Cliente' : 'Robô/Advogado'}:</span>
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
    const blob = new Blob([reportHTML], { type: 'application/mêsword' });
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

