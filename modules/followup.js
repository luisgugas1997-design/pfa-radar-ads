// ============================================
// FOLLOWUP — Modal de follow-up e agendamento
// PFA Dashboard — Módulo extraído do app.js
// ============================================

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
      else if (hours === 24) dateStr = "Amanhã de manhã às 09:00";
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


// ==========================================================================
// CHAT PANEL INLINE FOLLOW-UP SCHEDULER & SIMULATOR
// ==========================================================================

window.applyFollowupTemplate = function(type) {
  const input = document.getElementById('follow-prompt-input');
  if (!input) return;
  
  if (type === 'cobrar_docs') {
    input.value = "Olá! Lembramos que o seu caso precisa dos documentos pendentes para prosseguirmos com a sua defesa. Consegue nos enviar por aqui hoje? 📄";
  } else if (type === 'aviso_analise') {
    input.value = "Olá! Nossa equipe terminou a análise preliminar dos seus autos. Em breve entraremos em contato para explicar a estratégia da sua defesa. ⚖️";
  } else if (type === 'aviso_protocolo') {
    input.value = "Seu recurso já foi devidamente elaborado e protocolado junto ao órgão autuador! Vamos monitorar o julgamento e te avisar assim que houver novidades. 🔍";
  }
};

window.scheduleFollowupForLead = function(leadId) {
  const lead = window.mockLeads.find(l => l.id === leadId);
  if (!lead) return;

  const dateVal = document.getElementById('follow-date-input')?.value;
  const timeVal = document.getElementById('follow-time-input')?.value;
  const promptVal = document.getElementById('follow-prompt-input')?.value.trim();

  if (!dateVal || !timeVal || !promptVal) {
    showToastNotification('Dados incompletos', 'Preencha a data, horário e a mensagem do follow-up.', 'error');
    return;
  }

  const dateParts = dateVal.split('-');
  const dateBR = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;

  lead.followupScheduled = {
    active: true,
    date: dateBR,
    time: timeVal,
    prompt: promptVal
  };

  lead.proximaAcao = 'Follow-up Agendado';
  lead.prazoAcao = `${dateBR} às ${timeVal}`;

  lead.timeline.unshift({
    time: new Date().toLocaleString('pt-BR').substring(0, 10),
    type: 'Advogado',
    title: 'Follow-up Agendado',
    desc: `Disparo automático via IA programado para: ${dateBR} às ${timeVal}. Prompt: "${promptVal}"`
  });

  showToastNotification('Follow-up Agendado', `Agendado para ${dateBR} às ${timeVal}! 📅`, 'success');

  // Refresh
  renderBottomTabContent('notas');
  renderRightSidebar();
  if (typeof renderFullCRMSidebar === 'function') renderFullCRMSidebar();
  if (typeof window.renderCRMFollowupMonitor === 'function') window.renderCRMFollowupMonitor();
};

window.cancelFollowupForLead = function(leadId) {
  const lead = window.mockLeads.find(l => l.id === leadId);
  if (!lead) return;

  if (lead.followupScheduled) {
    lead.followupScheduled.active = false;
  }
  lead.proximaAcao = '';
  lead.prazoAcao = '';

  lead.timeline.unshift({
    time: new Date().toLocaleString('pt-BR').substring(0, 10),
    type: 'Advogado',
    title: 'Agendamento Cancelado',
    desc: 'O envio automático de follow-up foi cancelado pelo advogado.'
  });

  showToastNotification('Agendamento Cancelado', 'Follow-up automático desativado. ❌', 'warning');

  // Refresh
  renderBottomTabContent('notas');
  renderRightSidebar();
  if (typeof window.renderCRMFollowupMonitor === 'function') window.renderCRMFollowupMonitor();
};

window.triggerFollowupSimulation = function(leadId) {
  const lead = window.mockLeads.find(l => l.id === leadId);
  if (!lead) return;

  const promptText = lead.followupScheduled ? lead.followupScheduled.prompt : 'Olá!';

  if (lead.followupScheduled) {
    lead.followupScheduled.active = false;
  }
  lead.proximaAcao = '';
  lead.prazoAcao = '';

  lead.messages.push({
    sender: 'bot',
    text: promptText,
    time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    read: true,
    status: 'sent'
  });

  lead.timeline.unshift({
    time: new Date().toLocaleString('pt-BR').substring(0, 10),
    type: 'Sistema',
    title: 'Disparo Follow-up',
    desc: `Robô enviou a mensagem de follow-up via WhatsApp: "${promptText}"`
  });

  showToastNotification('Follow-up Disparado', 'Mensagem enviada com sucesso ao cliente! 🚀', 'success');

  const msgIdx = lead.messages.length - 1;
  setTimeout(() => {
    if (lead.messages[msgIdx]) lead.messages[msgIdx].status = 'delivered';
    if (typeof renderChatArea === 'function') renderChatArea();
  }, 600);

  setTimeout(() => {
    if (lead.messages[msgIdx]) lead.messages[msgIdx].status = 'read';
    if (typeof renderChatArea === 'function') renderChatArea();
  }, 1600);

  // Refresh chat & lists
  renderBottomTabContent('notas');
  renderRightSidebar();
  if (typeof renderChatArea === 'function') renderChatArea();
  if (typeof renderConversationList === 'function') renderConversationList();
  if (typeof window.renderCRMFollowupMonitor === 'function') window.renderCRMFollowupMonitor();
};

window.renderCRMFollowupMonitor = function() {
  const container = document.getElementById('crm-followup-monitor-container');
  if (!container) return;

  const leads = window.mockLeads;
  
  const scheduledList = [];
  leads.forEach(lead => {
    if (lead.followupScheduled && lead.followupScheduled.active) {
      scheduledList.push({
        leadId: lead.id,
        name: lead.name,
        date: lead.followupScheduled.date,
        time: lead.followupScheduled.time,
        prompt: lead.followupScheduled.prompt
      });
    }
  });

  const executedList = [];
  leads.forEach(lead => {
    lead.timeline.forEach(ev => {
      if (ev.title === 'Disparo Follow-up' || ev.title === 'Follow-up Disparado') {
        executedList.push({
          name: lead.name,
          time: ev.time,
          desc: ev.desc
        });
      }
    });
  });

  scheduledList.sort((a,b) => {
    const da = a.date.split('/').reverse().join('-') + ' ' + a.time;
    const db = b.date.split('/').reverse().join('-') + ' ' + b.time;
    return da.localeCompare(db);
  });

  executedList.sort((a,b) => b.time.localeCompare(a.time));

  const scheduledHTML = scheduledList.length === 0 
    ? `<div style="font-size:12px; color:var(--text-secondary); font-style:italic; padding: 10px 0;">Nenhum follow-up agendado no momento.</div>`
    : scheduledList.map(s => `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding: 8px 0; font-size:12px; text-align:left;">
          <div>
            <strong>${s.name}</strong><br>
            <span style="font-size:10.5px; color:var(--text-secondary);">${s.prompt}</span>
          </div>
          <div style="text-align:right; flex-shrink:0; margin-left:15px;">
            <span class="file-badge validated" style="font-size:9.5px; padding:2px 6px;">📅 ${s.date} ${s.time}</span>
          </div>
        </div>
      `).join('');

  const executedHTML = executedList.length === 0
    ? `<div style="font-size:12px; color:var(--text-secondary); font-style:italic; padding: 10px 0;">Nenhum follow-up enviado recentemente.</div>`
    : executedList.slice(0, 5).map(e => `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding: 8px 0; font-size:12px; text-align:left;">
          <div>
            <strong>${e.name}</strong><br>
            <span style="font-size:10.5px; color:var(--text-secondary);">${e.desc}</span>
          </div>
          <div style="text-align:right; flex-shrink:0; margin-left:15px;">
            <span style="font-size:9px; color:var(--text-secondary);">${e.time}</span><br>
            <span style="color:var(--green-primary); font-weight:bold; font-size:10px;">✓✓ Enviado</span>
          </div>
        </div>
      `).join('');

  container.innerHTML = `
    <div style="border-right: 1px solid var(--border-color); padding-right: 15px;">
      <h4 style="font-size:12.5px; font-weight:700; color:var(--brand-primary); margin-top:0; margin-bottom:10px; display:flex; align-items:center; gap:6px;">
        ⏳ Próximos Envios Agendados (${scheduledList.length})
      </h4>
      <div style="max-height: 250px; overflow-y:auto; padding-right:5px;">
        ${scheduledHTML}
      </div>
    </div>
    <div>
      <h4 style="font-size:12.5px; font-weight:700; color:var(--green-primary); margin-top:0; margin-bottom:10px; display:flex; align-items:center; gap:6px;">
        ✅ Histórico de Disparos Recentes
      </h4>
      <div style="max-height: 250px; overflow-y:auto; padding-right:5px;">
        ${executedHTML}
      </div>
    </div>
  `;
};

window.initFollowupModal = initFollowupModal;
window.bindFollowupButton = bindFollowupButton;
window.toggleFollowupModal = toggleFollowupModal;
window.cancelFollowupForLead = cancelFollowupForLead;
window.triggerFollowupSimulation = triggerFollowupSimulation;
window.applyFollowupTemplate = applyFollowupTemplate;
window.scheduleFollowupForLead = scheduleFollowupForLead;
window.renderCRMFollowupMonitor = renderCRMFollowupMonitor;



