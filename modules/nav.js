// ============================================
// NAV — Sistema de navegação da sidebar
// PFA Dashboard — Módulo extraído do app.js
// ============================================

// ==========================================
// SIDEBAR NAVIGATION SYSTEM
// ==========================================
function initNavigation() {
  sidebarItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetScreen = item.getAttribute('data-screen');
      navigateToScreen(targetScreen);
    });
  });
}

function navigateToScreen(screenName) {
  // Toggle sidebar active state
  sidebarItems.forEach(i => {
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
  } else if (screenName === 'clientes') {
    renderCRMLeadsTable();
  } else if (screenName === 'tarefas') {
    renderControladoriaTasks();
  } else if (screenName === 'kanban') {
    renderFullKanbanScreen();
  } else if (screenName === 'configuracoes') {
    setTimeout(renderWebhookLogs, 50);
    setTimeout(renderConfigScreen, 50);
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
window.initNavigation = initNavigation;


