// ============================================
// FINANCEIRO — Tela financeira, cobranças, despesas, recebimentos
// PFA Dashboard — Módulo extraído do app.js
// ============================================

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
  const totalSpend = spendMarketing + spendApps;
  
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
  `;
  
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
              <option value="parcial" ${statusText === 'parcial' ? 'selected' : ''}>Parcial 🔄</option>
              <option value="pago" ${statusText === 'pago' ? 'selected' : ''}>Pago Total ✅</option>
            </select>
          </td>
          <td>
            <div style="display:flex; gap:8px;">
              <button class="btn btn-outline-yellow" onclick="openReceivablePaymentModal(${l.id})" style="font-size:10.5px; padding:3px 6px; font-weight:700;">✅ Receber</button>
              <button class="btn btn-outline-orange" onclick="window.openClientFinanceSheet(${l.id})" style="font-size:10.5px; padding:3px 6px;">📋 Ver Ficha</button>
              <button class="btn btn-outline-yellow" onclick="window.openClientFinanceReport(${l.id})" style="font-size:10.5px; padding:3px 6px;" title="Gerar Relatório">📋" Relatório</button>
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
      desc: `Recebimento de R$ ${amount.toLocaleString('pt-BR', {minimumFractionDigits: 2})} registrado.`
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

window.openClientFinanceSheet = function(leadId) {
  const lead = window.mockLeads.find(l => l.id === leadId);
  if (!lead) return;

  const totalHon = lead.valorHonorarios || (lead.valorCausa * 0.3) || 1500;
  
  if (!lead.financeInfo) {
    lead.financeInfo = {
      formaPagamento: 'PIX',
      parcelado: false,
      numParcelas: 1,
      parcelas: [
        {
          numero: 1,
          valor: totalHon,
          vencimento: lead.prazoPagamento || '25/07/2026',
          pagamento: lead.valoresPagos > 0 ? '15/07/2026' : '',
          status: lead.valoresPagos > 0 ? 'pago' : 'pendente'
        }
      ]
    };
  }

  const f = lead.financeInfo;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.id = 'finance-sheet-modal';
  
  function updateModalContent() {
    const totalPago = f.parcelas.reduce((acc, p) => p.status === 'pago' ? acc + parseFloat(p.valor) : acc, 0);
    const totalRestante = Math.max(0, totalHon - totalPago);

    overlay.innerHTML = `
      <div class="edit-lead-modal" style="max-width: 600px; width:90%; background:var(--bg-secondary); border-radius:12px; box-shadow:var(--shadow-lg); border:1px solid var(--border-color); overflow:hidden;">
        <div class="modal-header" style="background:var(--bg-tertiary); padding:16px 20px; border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
          <div>
            <h3 style="margin:0; font-size:16px; color:var(--text-primary); font-weight:700;">📊 Ficha Financeira de Honorários</h3>
            <span style="font-size:11px; color:var(--text-secondary);">${lead.name} • ${lead.tipoCaso}</span>
          </div>
          <button class="modal-close-btn" onclick="this.closest('.modal-overlay').remove()" style="background:none; border:none; color:var(--text-secondary); font-size:20px; cursor:pointer;">&times;</button>
        </div>
        
        <div class="modal-body" style="padding:20px; max-height: 480px; overflow-y:auto; display:flex; flex-direction:column; gap:20px; text-align:left;">
          <!-- Resumo de Saldos -->
          <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; background:var(--bg-tertiary); padding:12px; border-radius:8px; border:1px solid var(--border-color); text-align:center;">
            <div>
              <span style="font-size:10px; text-transform:uppercase; color:var(--text-secondary); font-weight:700;">Honorários Totais</span>
              <div style="font-size:16px; font-weight:700; color:var(--text-primary); margin-top:4px;">R$ ${totalHon.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            <div>
              <span style="font-size:10px; text-transform:uppercase; color:var(--green-primary); font-weight:700;">Valor Pago</span>
              <div style="font-size:16px; font-weight:700; color:var(--green-primary); margin-top:4px;">R$ ${totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            <div>
              <span style="font-size:10px; text-transform:uppercase; color:var(--red-primary); font-weight:700;">Valor Restante</span>
              <div style="font-size:16px; font-weight:700; color:var(--red-primary); margin-top:4px;">R$ ${totalRestante.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
          </div>

          <!-- Configurações de Pagamento -->
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px;">
            <div>
              <label style="display:block; font-size:11px; font-weight:700; color:var(--text-secondary); text-transform:uppercase; margin-bottom:6px;">Forma de Pagamento:</label>
              <select id="fin-sheet-forma" style="width:100%; padding:8px; border:1px solid var(--border-color); border-radius:6px; background:var(--bg-tertiary); color:var(--text-primary); font-size:13px; font-weight:600;">
                <option value="PIX" ${f.formaPagamento === 'PIX'?'selected':''}>⚡ PIX</option>
                <option value="Cartão de Crédito" ${f.formaPagamento === 'Cartão de Crédito'?'selected':''}>💳 Cartão de Crédito</option>
                <option value="Boleto Bancário" ${f.formaPagamento === 'Boleto Bancário'?'selected':''}>📄 Boleto Bancário</option>
                <option value="Dinheiro" ${f.formaPagamento === 'Dinheiro'?'selected':''}>💵 Dinheiro / Depósito</option>
              </select>
            </div>
            <div>
              <label style="display:block; font-size:11px; font-weight:700; color:var(--text-secondary); text-transform:uppercase; margin-bottom:6px;">Tipo de Cobrança:</label>
              <div style="display:flex; align-items:center; gap:12px; margin-top:8px;">
                <label style="display:inline-flex; align-items:center; gap:6px; font-size:13px; font-weight:600; cursor:pointer;">
                  <input type="radio" name="fin-sheet-tipo" value="vista" ${!f.parcelado?'checked':''} onchange="window.updateFinSheetInstallmentMode(${leadId}, false)"> À Vista
                </label>
                <label style="display:inline-flex; align-items:center; gap:6px; font-size:13px; font-weight:600; cursor:pointer;">
                  <input type="radio" name="fin-sheet-tipo" value="parcelado" ${f.parcelado?'checked':''} onchange="window.updateFinSheetInstallmentMode(${leadId}, true)"> Parcelado
                </label>
              </div>
            </div>
          </div>

          <!-- Parcelamento Config (Se ativo) -->
          <div id="fin-sheet-installments-config" style="display: ${f.parcelado ? 'block' : 'none'}; border-top: 1px dashed var(--border-color); padding-top: 15px;">
            <div style="display:flex; align-items:center; gap:15px; margin-bottom:12px;">
              <label style="font-size:12px; font-weight:700; color:var(--text-secondary);">Número de Parcelas:</label>
              <select id="fin-sheet-num-parcelas" style="padding:6px 12px; border:1px solid var(--border-color); border-radius:6px; background:var(--bg-tertiary); color:var(--text-primary); font-size:12px; font-weight:700;" onchange="window.generateFinSheetInstallments(${leadId}, this.value)">
                ${[2,3,4,5,6,7,8,9,10,11,12].map(n => `<option value="${n}" ${f.numParcelas === n ? 'selected' : ''}>${n}x</option>`).join('')}
              </select>
            </div>
          </div>

          <!-- Tabela de Parcelas / Lançamentos -->
          <div>
            <label style="display:block; font-size:11px; font-weight:700; color:var(--text-secondary); text-transform:uppercase; margin-bottom:10px;">Detalhamento das Parcelas / Vencimentos</label>
            <table style="width:100%; border-collapse:collapse; font-size:12px; text-align:left;">
              <thead>
                <tr style="border-bottom:1px solid var(--border-color); color:var(--text-secondary); font-weight:700;">
                  <th style="padding:8px 4px; width:60px;">Parcela</th>
                  <th style="padding:8px 4px; width:100px;">Valor</th>
                  <th style="padding:8px 4px; width:120px;">Vencimento</th>
                  <th style="padding:8px 4px; width:120px;">Pagamento</th>
                  <th style="padding:8px 4px; width:100px;">Status</th>
                  <th style="padding:8px 4px; text-align:center;">Ações</th>
                </tr>
              </thead>
              <tbody>
                ${f.parcelas.map((p, idx) => {
                  const statusCls = p.status === 'pago' ? 'color:var(--green-primary);font-weight:700;' : 'color:var(--orange-primary);font-weight:700;';
                  const statusText = p.status === 'pago' ? 'Pago' : 'Pendente';
                  return `
                    <tr style="border-bottom:1px solid var(--border-color); height:40px;">
                      <td style="padding:8px 4px;"><strong>${p.numero}/${f.numParcelas}</strong></td>
                      <td style="padding:8px 4px;">R$ ${parseFloat(p.valor).toFixed(2)}</td>
                      <td style="padding:8px 4px;">
                        <input type="date" value="${p.vencimento ? p.vencimento.split('/').reverse().join('-') : ''}" 
                          style="padding:3px; border:1px solid var(--border-color); border-radius:4px; background:var(--bg-tertiary); color:var(--text-primary); font-size:11px;"
                          onchange="window.updateFinSheetInstallmentField(${leadId}, ${idx}, 'vencimento', this.value)">
                      </td>
                      <td style="padding:8px 4px;">
                        <input type="date" value="${p.pagamento ? p.pagamento.split('/').reverse().join('-') : ''}" 
                          style="padding:3px; border:1px solid var(--border-color); border-radius:4px; background:var(--bg-tertiary); color:var(--text-primary); font-size:11px;"
                          onchange="window.updateFinSheetInstallmentField(${leadId}, ${idx}, 'pagamento', this.value)"
                          ${p.status !== 'pago' ? 'disabled' : ''}>
                      </td>
                      <td style="padding:8px 4px;"><span style="${statusCls}">${statusText}</span></td>
                      <td style="padding:8px 4px; text-align:center;">
                        ${p.status === 'pendente' 
                          ? `<button class="btn btn-outline-yellow" onclick="window.payFinSheetInstallment(${leadId}, ${idx})" style="padding:2px 6px; font-size:10px; font-weight:700;">Confirmar</button>`
                          : `<button class="btn btn-outline-orange" onclick="window.unpayFinSheetInstallment(${leadId}, ${idx})" style="padding:2px 6px; font-size:10px; font-weight:700;">Estornar</button>`
                        }
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="modal-footer" style="background:var(--bg-tertiary); padding:16px 20px; border-top:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
          <button class="btn btn-tab-action" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
          <button class="btn btn-yellow" onclick="window.saveClientFinanceSheet(${leadId}, this)" style="font-weight:700;">💾 Salvar Ficha</button>
        </div>
      </div>
    `;
  }

  window.updateFinSheetInstallmentMode = function(lId, isParcelado) {
    f.parcelado = isParcelado;
    if (isParcelado) {
      f.numParcelas = 3;
      window.generateFinSheetInstallments(lId, 3);
    } else {
      f.numParcelas = 1;
      f.parcelas = [
        {
          numero: 1,
          valor: totalHon,
          vencimento: lead.prazoPagamento || '25/07/2026',
          pagamento: lead.valoresPagos > 0 ? '15/07/2026' : '',
          status: lead.valoresPagos > 0 ? 'pago' : 'pendente'
        }
      ];
      updateModalContent();
    }
  };

  window.generateFinSheetInstallments = function(lId, countStr) {
    const count = parseInt(countStr);
    f.numParcelas = count;
    
    const valPerInstallment = parseFloat((totalHon / count).toFixed(2));
    
    f.parcelas = [];
    const baseDate = new Date();
    
    for (let i = 1; i <= count; i++) {
      const dueDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, 10);
      const dueDateStr = `${dueDate.getDate().toString().padStart(2,'0')}/${(dueDate.getMonth()+1).toString().padStart(2,'0')}/${dueDate.getFullYear()}`;
      
      f.parcelas.push({
        numero: i,
        valor: valPerInstallment,
        vencimento: dueDateStr,
        pagamento: '',
        status: 'pendente'
      });
    }
    
    updateModalContent();
  };

  window.updateFinSheetInstallmentField = function(lId, idx, field, isoVal) {
    if (!f.parcelas[idx]) return;
    if (isoVal) {
      const parts = isoVal.split('-');
      f.parcelas[idx][field] = `${parts[2]}/${parts[1]}/${parts[0]}`;
    } else {
      f.parcelas[idx][field] = '';
    }
  };

  window.payFinSheetInstallment = function(lId, idx) {
    if (!f.parcelas[idx]) return;
    f.parcelas[idx].status = 'pago';
    const now = new Date();
    f.parcelas[idx].pagamento = `${now.getDate().toString().padStart(2,'0')}/${(now.getMonth()+1).toString().padStart(2,'0')}/${now.getFullYear()}`;
    updateModalContent();
  };

  window.unpayFinSheetInstallment = function(lId, idx) {
    if (!f.parcelas[idx]) return;
    f.parcelas[idx].status = 'pendente';
    f.parcelas[idx].pagamento = '';
    updateModalContent();
  };

  window.saveClientFinanceSheet = function(lId, btnEl) {
    f.formaPagamento = document.getElementById('fin-sheet-forma').value;
    const totalPago = f.parcelas.reduce((acc, p) => p.status === 'pago' ? acc + parseFloat(p.valor) : acc, 0);
    lead.valoresPagos = totalPago;
    
    if (totalPago >= totalHon) {
      lead.statusPagamento = 'pago';
    } else if (totalPago > 0) {
      lead.statusPagamento = 'parcial';
    } else {
      lead.statusPagamento = 'pendente';
    }
    
    lead.timeline.unshift({
      time: new Date().toLocaleString('pt-BR').substring(0, 10),
      type: 'Advogado',
      title: 'Ficha Financeira Salva',
      desc: `Ficha financeira atualizada: Forma de Pagamento = ${f.formaPagamento}, Total Pago = R$ ${totalPago.toFixed(2)} (${f.parcelado ? `${f.numParcelas} parcelas` : 'À Vista'})`
    });

    if (typeof renderFinanceiroScreen === 'function') renderFinanceiroScreen();
    showToastNotification('Ficha Financeira Salva', 'As alterações financeiras do cliente foram gravadas com sucesso.', 'success');
    
    btnEl.closest('.modal-overlay').remove();
  };

  updateModalContent();
  document.body.appendChild(overlay);
};

window.openClientFinanceReport = function(leadId) {
  const lead = window.mockLeads.find(l => l.id === leadId);
  if (!lead) return;

  const totalHon = lead.valorHonorarios || (lead.valorCausa * 0.3) || 1500;
  
  if (!lead.financeInfo) {
    lead.financeInfo = {
      formaPagamento: 'PIX',
      parcelado: false,
      numParcelas: 1,
      parcelas: [
        {
          numero: 1,
          valor: totalHon,
          vencimento: lead.prazoPagamento || '25/07/2026',
          pagamento: lead.valoresPagos > 0 ? '15/07/2026' : '',
          status: lead.valoresPagos > 0 ? 'pago' : 'pendente'
        }
      ]
    };
  }

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.id = 'finance-report-modal';
  overlay.innerHTML = `
    <div class="edit-lead-modal" style="max-width: 400px; padding: 25px; background:var(--bg-secondary); border-radius:12px; border:1px solid var(--border-color); box-shadow:var(--shadow-lg);">
      <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
        <span style="font-weight: 700; font-size:15px; color:var(--text-primary);">📊 Relatório Financeiro Exclusivo</span>
        <button onclick="this.closest('.modal-overlay').remove()" style="background:none; border:none; cursor:pointer; font-size:18px; color:var(--text-secondary);">&times;</button>
      </div>
      <div class="modal-body" style="text-align: left;">
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 15px;">
          Exportar demonstrativo financeiro detalhado de <strong>${lead.name}</strong>.
        </p>
        
        <div class="form-group" style="margin-bottom: 20px;">
          <label style="font-weight: 700; font-size:10.5px; text-transform: uppercase; color:var(--text-secondary);">Formato do Relatório</label>
          <div style="display: flex; gap: 20px; margin-top: 8px;">
            <label style="display: flex; align-items: center; gap: 6px; font-size: 13px; cursor:pointer; color:var(--text-primary); font-weight:600;">
              <input type="radio" name="fin-report-format" value="pdf" checked style="width:16px; height:16px; accent-color:var(--brand-primary);"> PDF / Impressão
            </label>
            <label style="display: flex; align-items: center; gap: 6px; font-size: 13px; cursor:pointer; color:var(--text-primary); font-weight:600;">
              <input type="radio" name="fin-report-format" value="word" style="width:16px; height:16px; accent-color:var(--brand-primary);"> Word (.doc)
            </label>
          </div>
        </div>
        
        <div style="display: flex; gap: 10px; justify-content: flex-end; border-top:1px solid var(--border-color); padding-top:15px;">
          <button class="btn btn-outline-yellow" onclick="this.closest('.modal-overlay').remove()" style="padding: 6px 12px; font-size:12px;">Cancelar</button>
          <button class="btn btn-yellow" onclick="window.generateClientFinanceReport(${lead.id}, this)" style="padding: 6px 16px; font-size:12px; font-weight:700;">📥 Baixar Relatório</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
};

window.generateClientFinanceReport = function(leadId, button) {
  const lead = window.mockLeads.find(l => l.id === leadId);
  if (!lead) return;

  const format = document.querySelector('input[name="fin-report-format"]:checked').value;
  const totalHon = lead.valorHonorarios || (lead.valorCausa * 0.3) || 1500;
  const f = lead.financeInfo;
  const totalPago = f.parcelas.reduce((acc, p) => p.status === 'pago' ? acc + parseFloat(p.valor) : acc, 0);
  const totalRestante = Math.max(0, totalHon - totalPago);

  let reportHTML = `
    <html>
    <head>
      <title>Demonstrativo Financeiro - ${lead.name}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
        .header { border-bottom: 3px solid #600014; padding-bottom: 12px; margin-bottom: 25px; }
        .title { color: #600014; font-size: 22px; margin: 0; font-weight: 700; }
        .subtitle { color: #64748b; font-size: 13px; margin: 5px 0 0 0; }
        h2 { color: #800020; font-size: 15px; margin-top: 25px; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; text-transform: uppercase; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; font-size: 13px; }
        th { background: #f8f9fa; font-weight: 700; color: #1e293b; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="title">DEMONSTRATIVO FINANCEIRO INDIVIDUALIZADO</h1>
        <p class="subtitle">Parreira, Ferreira & Angeli Advogados | Emitido em: ${new Date().toLocaleString('pt-BR')}</p>
      </div>

      <h2>Resumo Cadastral</h2>
      <table>
        <tr><td style="font-weight:700; width:180px;">Cliente</td><td>${lead.name}</td></tr>
        <tr><td style="font-weight:700;">CPF / CNPJ</td><td>${lead.cpf || 'Não informado'}</td></tr>
        <tr><td style="font-weight:700;">Tipo de Ação</td><td>${lead.tipoCaso}</td></tr>
        <tr><td style="font-weight:700;">Nº do Processo</td><td>${lead.processo || 'Em triagem'}</td></tr>
        <tr><td style="font-weight:700;">Forma de Pagamento</td><td>${f.formaPagamento}</td></tr>
      </table>

      <h2>Detalhamento do Saldo</h2>
      <table>
        <tr style="background:#f8f9fa; font-weight:700;">
          <td>Valor Total dos Honorários</td>
          <td style="text-align:right;">R$ ${totalHon.toLocaleString('pt-BR', {minimumFractionDigits:2})}</td>
        </tr>
        <tr style="color:#10b981; font-weight:700;">
          <td>Total Pago Recebido</td>
          <td style="text-align:right;">R$ ${totalPago.toLocaleString('pt-BR', {minimumFractionDigits:2})}</td>
        </tr>
        <tr style="color:#ef4444; font-weight:700;">
          <td>Saldo Devedor Restante</td>
          <td style="text-align:right;">R$ ${totalRestante.toLocaleString('pt-BR', {minimumFractionDigits:2})}</td>
        </tr>
      </table>

      <h2>Lançamentos e Cronograma de Parcelas</h2>
      <table>
        <thead>
          <tr>
            <th>Parcela</th>
            <th>Valor da Parcela</th>
            <th>Data de Vencimento</th>
            <th>Data de Pagamento</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${f.parcelas.map(p => `
            <tr>
              <td><strong>${p.numero}/${f.numParcelas}</strong></td>
              <td>R$ ${parseFloat(p.valor).toFixed(2)}</td>
              <td>${p.vencimento}</td>
              <td>${p.pagamento || '—'}</td>
              <td style="font-weight:700; color:${p.status === 'pago' ? '#10b981' : '#f59e0b'};">${p.status === 'pago' ? 'PAGO' : 'PENDENTE'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  if (format === 'pdf') {
    const win = window.open("", "_blank");
    win.document.write(reportHTML);
    win.document.close();
    setTimeout(() => {
      win.print();
    }, 500);
    showToastNotification('Relatório Financeiro PDF', 'Seletor de impressão aberto!', 'success');
  } else {
    const blob = new Blob([reportHTML], { type: 'application/msword' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `demonstrativo_financeiro_${lead.name.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    showToastNotification('Relatório Financeiro Word', 'Baixado com sucesso! 📋', 'success');
  }
  
  button.closest('.modal-overlay').remove();
};


