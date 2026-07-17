// ============================================
// STATE — Variáveis de estado globais e referências DOM
// PFA Dashboard — Módulo extraído do app.js
// ============================================

// State variables
let currentLeadId = 1;
let currentDocFolder = 'pessoais';
let activeDocumentId = null;

// DOM Elements - Navigation Sidebar
const sidebarItems = document.querySelectorAll('.sidebar-item');
const screenPanels = document.querySelectorAll('.screen-panel');

// DOM Elements - Conversations View
const chatListContainer = document.getElementById('chat-list');
const chatHistoryContainer = document.getElementById('chat-history');
const headerAvatar = document.getElementById('header-avatar');
const headerName = document.getElementById('header-name');
const headerSub = document.getElementById('header-sub');
const btnPararRobo = document.getElementById('btn-parar-robo');
const btnRetomarRobo = document.getElementById('btn-retomar-robo');
const btnAssumirManual = document.getElementById('btn-assumir-manual');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const bottomTabs = document.querySelectorAll('#bottom-tabs .panel-tab');
const tabContentContainer = document.getElementById('tab-content');
const unreadConversationsBadge = document.getElementById('unread-conversations-count');
const searchInput = document.getElementById('search-conversations');

// DOM Elements - Right CRM Sidebar
const profileAvatar = document.getElementById('profile-avatar');
const profileName = document.getElementById('profile-name');
const profilePhone = document.getElementById('profile-phone');
const profileEmail = document.getElementById('profile-email');
const profileLocation = document.getElementById('profile-location');
const crmEtapa = document.getElementById('crm-etapa');
const crmTipoCaso = document.getElementById('crm-tipo-caso');
const crmProcesso = document.getElementById('crm-processo');
const crmDataInfra = document.getElementById('crm-data-infra');
const crmAutuador = document.getElementById('crm-autuador');
const crmValorCausa = document.getElementById('crm-valor-cause');
const timelineList = document.getElementById('timeline-list');
const promptTextarea = document.getElementById('prompt-textarea');
const btnSavePrompt = document.getElementById('btn-save-prompt');
const kanbanColsMini = document.getElementById('kanban-cols');

// DOM Elements - Document Screen
const docFolderItems = document.querySelectorAll('.docs-folder-item');
const docsTableBody = document.getElementById('docs-table-body');
const pdfPreviewTitle = document.getElementById('pdf-preview-title');
const pdfPreviewAutuador = document.getElementById('pdf-preview-autuador');
const pdfPreviewCondutor = document.getElementById('pdf-preview-condutor');
const pdfPreviewData = document.getElementById('pdf-preview-data');
const pdfPreviewBody = document.getElementById('pdf-preview-body');
const docDetailsName = document.getElementById('doc-details-name');
const docDetailsStatus = document.getElementById('doc-details-status');
const docDetailsAuthor = document.getElementById('doc-details-author');
const docDetailsDate = document.getElementById('doc-details-date');

// DOM Elements - Follow-up Modal
const followupModal = document.getElementById('followup-modal');
const btnOpenFollowup = document.getElementById('btn-open-followup');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnCancelModal = document.getElementById('btn-cancel-modal');
const btnSaveFollowup = document.getElementById('btn-save-followup');
const followupTimeSelect = document.getElementById('followup-time');
const followupTypeSelect = document.getElementById('followup-type');
const followupCustomPrompt = document.getElementById('followup-custom-prompt');

// Helper - Find current active lead object
function getCurrentLead() {
  return mockLeads.find(l => l.id === currentLeadId) || mockLeads[0];
}

// Helper: Convert DD/MM/AAAA [HH:MM] to YYYY-MM-DD[THH:MM]
function formatDateToISO(dateStr) {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr;
  const parts = dateStr.split(' ');
  const dateParts = parts[0].split('/');
  if (dateParts.length !== 3) return '';
  const yyyymmdd = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;
  if (parts[1]) {
    return `${yyyymmdd}T${parts[1]}`;
  }
  return yyyymmdd;
}

// Helper: Convert YYYY-MM-DD[THH:MM] to DD/MM/AAAA [HH:MM]
function formatDateToBR(dateStr) {
  if (!dateStr) return 'Sem prazo';
  if (dateStr.includes('T')) {
    const parts = dateStr.split('T');
    const dateParts = parts[0].split('-');
    if (dateParts.length !== 3) return dateStr;
    return `${dateParts[2]}/${dateParts[1]}/${dateParts[0]} ${parts[1]}`;
  }
  const dateParts = dateStr.split('-');
  if (dateParts.length === 3) {
    return `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
  }
  return dateStr;
}

