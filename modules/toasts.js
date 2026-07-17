// ============================================
// TOASTS — Notificações toast, webhook simulation, alerts
// PFA Dashboard — Módulo extraído do app.js
// ============================================
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
    text: `Olá ${lead.name.split(' ')[0]}! Para formalizar a contratação e dar início ao seu recurso, geramos o link de pagamento dos honorários. Você pode efetuar o PIX ou parcelamento no cartão por aqui: ${link}`,
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
  // Disabled as requested to prevent toast popups from appearing repeatedly.
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
    button.innerText = '✅ Salvo!';
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


