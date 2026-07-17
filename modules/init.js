// ============================================
// INIT — Inicialização DOMContentLoaded e safeInit
// PFA Dashboard — Módulo extraído do app.js
// ============================================

// ==========================================
// INITIALIZATION
// ==========================================
function runInitialization() {
  // Enrich mockLeads first for plate, cnh, and impounded status search
  try {
    window.mockLeads.forEach((l, idx) => {
      l.placa = l.placa || `BRA-3Y2${idx}`;
      l.cnh = l.cnh || `992837411${idx}`;
      l.apreendido = l.apreendido || (idx % 3 === 0);
    });
  } catch(e) { console.error('Erro ao enriquecer mockLeads:', e); }

  const safeInit = (fn, label) => {
    try {
      if (typeof fn === 'function') {
        fn();
      } else {
        console.warn(`[PFA] Componente ${label} não é uma função no objeto window:`, fn);
      }
    } catch(e) {
      console.error(`[PFA] Erro ao inicializar ${label}:`, e.message);
    }
  };

  safeInit(window.initNavigation, 'Navigation');
  safeInit(window.initConversationsScreen, 'Conversations');
  safeInit(window.initDocumentsScreen, 'Documents');
  safeInit(window.initFollowupModal, 'FollowupModal');
  safeInit(window.initSidebarToggle, 'SidebarToggle');
  safeInit(window.initBottomPanelToggle, 'BottomPanelToggle');
  safeInit(window.initHoverPreview, 'HoverPreview');
  safeInit(window.initRightSidebarTabs, 'RightSidebarTabs');
  safeInit(window.initCRMInteractive, 'CRMInteractive');
  safeInit(window.initKanbanDragAndDrop, 'KanbanDragAndDrop');
  safeInit(window.updateUnreadBadgeCount, 'UnreadBadge');
  safeInit(window.initSimulationIntervals, 'SimulationIntervals');
  safeInit(window.startWebhookLogSimulation, 'WebhookSimulation');
  safeInit(window.restoreRightColState, 'RightColState');
  safeInit(window.initGlobalClock, 'GlobalClock');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runInitialization);
} else {
  runInitialization();
}

