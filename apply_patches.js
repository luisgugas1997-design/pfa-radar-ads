const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'style.css');
const htmlPath = path.join(__dirname, 'index.html');
const jsPath = path.join(__dirname, 'app.js');

console.log("Applying CSS patches...");
let cssContent = fs.readFileSync(cssPath, 'utf8');
cssContent = cssContent.replace(
  /body\s*{\s*margin: 0;[\s\S]*?font-family:\s*['"]Outfit['"][\s\S]*?font-size:\s*12px;/,
  match => match.replace('font-size: 12px;', 'font-size: 14px;\n  line-height: 1.5;\n  letter-spacing: 0.01em;')
);

const cssAppends = `
/* ==========================================================================
   MELHORIAS DE UI (Trânsito, Kanban, Chat, etc.)
   ========================================================================== */
@keyframes pulse-banner { 0%, 100% { opacity: 1; } 50% { opacity: 0.85; } }
.conv-tag { display: inline-flex; align-items: center; padding: 2px 7px; border-radius: 10px; font-size: 10px; font-weight: 700; white-space: nowrap; }
.conv-tag.urgente { background: #fee2e2; color: #ef4444; }
.conv-tag.aguardando { background: #fef3c7; color: #d97706; }
.conv-tag.proposta { background: #dbeafe; color: #2563eb; }
.conv-tag.andamento { background: #d1fae5; color: #059669; }
.conv-tag.inativo { background: #f1f5f9; color: #64748b; }
.conv-tag.vip { background: #fdf4ff; color: #9333ea; }
.case-progress-bar { background: var(--bg-tertiary); border-bottom: 1px solid var(--border-color); padding: 6px 20px; display: flex; align-items: center; gap: 4px; overflow-x: auto; flex-shrink: 0; }
.case-progress-step { display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; white-space: nowrap; color: var(--text-secondary); padding: 3px 10px; border-radius: 20px; cursor: pointer; transition: all 0.15s; }
.case-progress-step.done { background: var(--green-bg); color: var(--green-primary); }
.case-progress-step.active { background: var(--brand-primary); color: #fff; }
.case-progress-step.pending { background: var(--bg-secondary); border: 1px solid var(--border-color); }
.case-progress-arrow { color: var(--text-secondary); font-size: 10px; flex-shrink: 0; }
.center-col { grid-template-rows: 70px 32px 1fr 40px 60px !important; }
.center-col.expanded { grid-template-rows: 70px 32px 1fr 260px 60px !important; }
`;

if (!cssContent.includes('.case-progress-bar')) {
  cssContent += "\n" + cssAppends;
}
fs.writeFileSync(cssPath, cssContent, 'utf8');

console.log("Applying HTML patches...");
let htmlContent = fs.readFileSync(htmlPath, 'utf8');
const htmlBanner = `<!-- Banner de Urgência Global -->
  <div id="urgency-banner" style="display:none; background: linear-gradient(90deg, #7f1d1d, var(--red-primary)); color:#fff; padding:8px 20px; font-size:13px; font-weight:700; text-align:center; position:relative; z-index:2000; animation: pulse-banner 2s ease-in-out infinite;">
    <span id="urgency-banner-text">⚠️ ATENÇÃO: Há prazos críticos vencendo hoje!</span>
    <button onclick="document.getElementById('urgency-banner').style.display='none'" style="background:none;border:none;color:#fff;cursor:pointer;margin-left:12px;font-size:16px;">✕</button>
  </div>\n`;

if (!htmlContent.includes('id="urgency-banner"')) {
  htmlContent = htmlContent.replace(/<body>\s*<div class="app-container">/, `<body>\n\n  ` + htmlBanner + `  <div class="app-container">`);
}
const progressBarHtml = `<div class="case-progress-bar" id="case-progress-bar"></div>`;
if (!htmlContent.includes('id="case-progress-bar"')) {
  htmlContent = htmlContent.replace(
    /<div class="center-header-sub" id="header-sub">.*?<\/div>\s*<\/div>\s*<\/div>/,
    match => match + '\n\n        <!-- Barra de Progresso do Caso -->\n        ' + progressBarHtml
  );
}
fs.writeFileSync(htmlPath, htmlContent, 'utf8');

console.log("Applying JS patches...");
let jsContent = fs.readFileSync(jsPath, 'utf8');
const oldRenderChatListStart = "function renderChatList(filterText = '') {";
const oldRenderChatListEnd = "    chatListContainer.appendChild(item);\n  });\n}";
if (jsContent.includes(oldRenderChatListStart) && !jsContent.includes('const tags = [];')) {
    const listStartIndex = jsContent.indexOf(oldRenderChatListStart);
    const listEndIndex = jsContent.indexOf(oldRenderChatListEnd, listStartIndex) + oldRenderChatListEnd.length;
    if (listStartIndex > -1 && listEndIndex > listStartIndex) {
        const newRenderChatList = `function renderChatList(filterText = '') {
  chatListContainer.innerHTML = '';
  const query = filterText.toLowerCase();
  const activeFilter = window.currentChatFilter || 'all';
  const today = new Date(); today.setHours(0,0,0,0);

  mockLeads.forEach(lead => {
    if (query && !lead.name.toLowerCase().includes(query) && !lead.tipoCaso.toLowerCase().includes(query)) return;
    if (activeFilter === 'unread') { if (!lead.messages.some(m => m.sender === 'client' && !m.read)) return; }
    else if (activeFilter === 'manual') { if (lead.roboAtivo) return; }
    else if (activeFilter === 'bot') { if (!lead.roboAtivo) return; }

    const item = document.createElement('div');
    item.className = \`left-light-item \${lead.id === currentLeadId ? 'active' : ''}\`;
    const lastMsg = lead.messages[lead.messages.length - 1];
    const badgeClass = lead.tipoCaso.toLowerCase().includes('seca') ? 'lei-seca' : 
                      lead.tipoCaso.toLowerCase().includes('suspens') ? 'suspensao' : 'cassacao';

    // Tags visuais
    const tags = [];
    const prazoTask = window.mockTasks && window.mockTasks.find(t => t.leadId === lead.id && !t.concluida);
    if (prazoTask) {
      const iso = formatDateToISO(prazoTask.prazo);
      if (iso) {
        const pd = new Date(iso.substring(0,10)); pd.setHours(0,0,0,0);
        const diff = Math.ceil((pd - today) / 86400000);
        if (diff <= 3) tags.push({ label: diff < 0 ? 'VENCIDO' : 'URGENTE', cls: 'urgente' });
      }
    }
    if (lead.etapa && lead.etapa.toLowerCase().includes('doc')) tags.push({ label: 'DOCS', cls: 'aguardando' });
    if (lead.etapa && (lead.etapa.toLowerCase().includes('proposta') || lead.etapa.toLowerCase().includes('assinatura'))) tags.push({ label: 'PROPOSTA', cls: 'proposta' });
    if ((lead.valorCausa || 0) > 5000) tags.push({ label: 'VIP', cls: 'vip' });
    if (lead.id % 4 === 0 && !tags.find(t => t.cls === 'urgente')) tags.push({ label: 'INATIVO 3d', cls: 'inativo' });

    const tagsHTML = tags.length > 0
      ? \`<div style="display:flex;gap:3px;flex-wrap:wrap;margin-top:4px;">\${tags.map(t => \`<span class="conv-tag \${t.cls}">\${t.label}</span>\`).join('')}</div>\`
      : '';
    const unreadCount = lead.messages.filter(m => m.sender === 'client' && !m.read).length;

    item.innerHTML = \`
      <div class="avatar">\${getInitials(lead.name)}</div>
      <div class="chat-details">
        <div class="chat-name-row">
          <span class="chat-name">\${lead.name}</span>
          <span class="chat-time">\${lastMsg ? lastMsg.time : 'Ontem'}</span>
        </div>
        <div class="chat-message-row">
          <span class="chat-msg">\${lastMsg ? lastMsg.text.substring(0,42)+(lastMsg.text.length>42?'...':'') : 'Sem mensagens'}</span>
          <span class="chat-badge \${badgeClass}">\${lead.tipoCaso}</span>
        </div>
        \${tagsHTML}
      </div>
      \${unreadCount > 0 ? \`<div class="unread-count" style="position:absolute;right:10px;top:12px;">\${unreadCount}</div>\` : ''}
    \`;

    item.addEventListener('click', () => {
      currentLeadId = lead.id;
      lead.messages.forEach(m => m.read = true);
      renderChatList(filterText);
      renderChatArea();
      renderRightSidebar();
      renderBottomTabContent();
      updateUnreadBadgeCount();
    });
    chatListContainer.appendChild(item);
  });
}`;
        jsContent = jsContent.substring(0, listStartIndex) + newRenderChatList + jsContent.substring(listEndIndex);
    }
}

if (!jsContent.includes("const progressBar = document.getElementById('case-progress-bar');")) {
    const oldHeaderSub = "headerSub.innerText = \`\${lead.tipoCaso} • Proc. \${lead.processo}\`;";
    const newHeaderSub = \`headerSub.innerText = \`\${lead.tipoCaso} • Proc. \${lead.processo}\`;

  const progressBar = document.getElementById('case-progress-bar');
  if (progressBar) {
    const allSteps = [ { key: 'Triagem', label: 'Triagem' }, { key: 'Documentos', label: 'Documentos' }, { key: 'Elaboração Defesa', label: 'Defesa' }, { key: 'Protocolo', label: 'Protocolo' }, { key: 'Julgamento JARI', label: 'JARI' }, { key: 'Recurso CETRAN', label: 'CETRAN' }, { key: 'Concluído', label: 'Concluído' } ];
    let currentIdx = allSteps.findIndex(s => lead.etapa && lead.etapa.includes(s.key));
    if (currentIdx === -1) currentIdx = 0;
    progressBar.innerHTML = allSteps.map((step, idx) => {
      const isDone = idx < currentIdx;
      const isActive = idx === currentIdx;
      const cls = isDone ? 'done' : isActive ? 'active' : 'pending';
      const icon = isDone ? '✓ ' : '';
      const arrow = idx < allSteps.length - 1 ? '<span class="case-progress-arrow">›</span>' : '';
      return \`<span class="case-progress-step \${cls}" title="\${step.label}">\${icon}\${step.label}</span>\${arrow}\`;
    }).join('');
  }
\`;
    jsContent = jsContent.replace(oldHeaderSub, newHeaderSub);
}

const checkUrgencyBannerCode = \`
function checkGlobalUrgency() {
  const today = new Date(); today.setHours(0,0,0,0);
  const urgentTasks = window.mockTasks.filter(t => !t.concluida && Math.ceil((new Date(formatDateToISO(t.prazo).substring(0,10)) - today)/86400000) <= 3);
  const banner = document.getElementById('urgency-banner');
  if (banner) {
    if (urgentTasks.length > 0) {
      document.getElementById('urgency-banner-text').innerText = \`⚠️ ATENÇÃO: Você possui \${urgentTasks.length} prazo(s) urgentes vencendo nos próximos 3 dias!\`;
      banner.style.display = 'block';
    } else { banner.style.display = 'none'; }
  }
}
window.addEventListener('DOMContentLoaded', () => { setTimeout(checkGlobalUrgency, 1000); });
\`;
if (!jsContent.includes('checkGlobalUrgency()')) {
    jsContent += "\\n" + checkUrgencyBannerCode;
}
fs.writeFileSync(jsPath, jsContent, 'utf8');
console.log("All patches applied successfully!");
