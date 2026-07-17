// ============================================
// HELPERS — Funções utilitárias e helpers
// PFA Dashboard — Módulo extraído do app.js
// ============================================

// ==========================================
// HELPERS
// ==========================================
function getInitials(name) {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

// Sidebar toggle logic
function initSidebarToggle() {
  const btnToggle = document.getElementById('btn-toggle-sidebar');
  const app = document.querySelector('.app-container');

  if (btnToggle && app) {
    btnToggle.addEventListener('click', () => {
      app.classList.toggle('collapsed');
      
      const isCollapsed = app.classList.contains('collapsed');
      // Persist state in session
      sessionStorage.setItem('sidebarCollapsed', isCollapsed ? '1' : '0');
      
      btnToggle.title = isCollapsed ? 'Expandir Menu' : 'Recolher Menu';
      btnToggle.innerHTML = isCollapsed ? 
        `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 3-5 5 5 5"/><path d="m16 21 5-5-5-5"/><path d="M12 5v14"/></svg>` :
        `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 3 5 5-5 5"/><path d="m8 21-5-5 5-5"/><path d="M12 5v14"/></svg>`;
    });
    
    // Restore state from session
    if (sessionStorage.getItem('sidebarCollapsed') === '1') {
      app.classList.add('collapsed');
      btnToggle.title = 'Expandir Menu';
    }
  }
}

// Bottom panel toggle (expand/collapse)
function initBottomPanelToggle() {
  const btnToggle = document.getElementById('btn-toggle-bottom-panel');
  const textToggle = document.getElementById('text-toggle-bottom-panel');
  const bottomPanel = document.querySelector('.center-bottom-panel');
  const tabContent = document.getElementById('tab-content');

  if (btnToggle && bottomPanel && tabContent) {
    btnToggle.addEventListener('click', () => {
      const isExpanded = bottomPanel.classList.contains('expanded');
      
      if (isExpanded) {
        // Collapse
        bottomPanel.classList.remove('expanded');
        tabContent.style.display = 'none';
        if (textToggle) textToggle.innerText = 'Ver Documentos →';
      } else {
        // Expand
        bottomPanel.classList.add('expanded');
        tabContent.style.display = 'flex';
        if (textToggle) textToggle.innerText = 'Recolher ↑';

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
        const isExpanded = bottomPanel.classList.contains('expanded');
        
        // Remove active from all tabs, add to current clicked
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        if (!isExpanded) {
          bottomPanel.classList.add('expanded');
          tabContent.style.display = 'flex';
          if (textToggle) textToggle.innerText = 'Recolher ↑';
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


// ============================================================
// TOGGLE PAINEL DIREITO (RIGHT-COL) — Retrátil com FAB
// ============================================================
function toggleRightCol() {
  const screen = document.getElementById('screen-conversas');
  const toggleBtn = document.getElementById('right-col-toggle-btn');
  const fab = document.getElementById('right-col-expand-fab');
  const focoText = document.getElementById('btn-foco-text');

  if (!screen) return;

  const isCollapsed = screen.classList.contains('right-collapsed');

  if (isCollapsed) {
    // EXPANDIR
    screen.classList.remove('right-collapsed');
    if (toggleBtn) toggleBtn.textContent = '▶'; // Points right to collapse
    if (fab) fab.classList.remove('visible');
    if (focoText) focoText.textContent = 'Ocultar Ficha';
    sessionStorage.setItem('rightColCollapsed', 'false');
  } else {
    // COLAPSAR
    screen.classList.add('right-collapsed');
    if (toggleBtn) toggleBtn.textContent = '◀'; // Points left to expand
    if (fab) fab.classList.add('visible');
    if (focoText) focoText.textContent = 'Ver Ficha';
    sessionStorage.setItem('rightColCollapsed', 'true');
  }
}

// Restaurar estado do painel ao carregar a página
function restoreRightColState() {
  if (sessionStorage.getItem('rightColCollapsed') === 'true') {
    const screen = document.getElementById('screen-conversas');
    const toggleBtn = document.getElementById('right-col-toggle-btn');
    const fab = document.getElementById('right-col-expand-fab');
    const focoText = document.getElementById('btn-foco-text');
    if (screen) screen.classList.add('right-collapsed');
    if (toggleBtn) toggleBtn.textContent = '◀';
    if (fab) fab.classList.add('visible');
    if (focoText) focoText.textContent = 'Ver Ficha';
  }
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

window.initGlobalClock = initGlobalClock;
window.initSidebarToggle = initSidebarToggle;
window.initBottomPanelToggle = initBottomPanelToggle;
window.initHoverPreview = initHoverPreview;
window.initRightSidebarTabs = initRightSidebarTabs;
window.restoreRightColState = restoreRightColState;
