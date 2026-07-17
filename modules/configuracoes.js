// ============================================
// CONFIGURACOES — Gestão de usuários, acesso e sistema
// PFA Dashboard — Módulo extraído do app.js
// ============================================

// Estado local de usuários (inicializado de localStorage ou padrão)
window.pfaUsers = JSON.parse(localStorage.getItem('pfaUsers') || 'null') || [
  { id: 1, nome: 'Dr. Pedro Freitas', email: 'pedro@pfa.adv.br', role: 'admin', ativo: true, criadoEm: '10/01/2024' },
  { id: 2, nome: 'Dra. Ana Lima',     email: 'ana@pfa.adv.br',   role: 'advogado', ativo: true, criadoEm: '15/02/2024' },
  { id: 3, nome: 'Dra. Carla Souza',  email: 'carla@pfa.adv.br', role: 'advogado', ativo: true, criadoEm: '20/03/2024' },
  { id: 4, nome: 'Dr. Rafael Mendes', email: 'rafael@pfa.adv.br', role: 'assistente', ativo: true, criadoEm: '05/04/2024' },
  { id: 5, nome: 'Mariana Pinto',     email: 'mariana@pfa.adv.br', role: 'assistente', ativo: false, criadoEm: '12/05/2024' },
];

function saveUsers() {
  localStorage.setItem('pfaUsers', JSON.stringify(window.pfaUsers));
}

function renderConfigScreen() {
  const container = document.getElementById('config-main-content');
  if (!container) return;

  const users = window.pfaUsers;
  const admins = users.filter(u => u.role === 'admin');
  const ativos = users.filter(u => u.ativo);

  container.innerHTML = `
    <!-- Cabeçalho -->
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
      <div>
        <h2 style="font-size:20px; font-weight:700; color:var(--text-primary); margin-bottom:4px;">⚙️ Configurações do Sistema</h2>
        <p style="font-size:13px; color:var(--text-secondary);">Gerencie usuários, permissões e acessos ao PFA Dashboard.</p>
      </div>
    </div>

    <!-- Stats rápidas -->
    <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:12px; margin-bottom:24px;">
      <div style="background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:10px; padding:16px; text-align:center;">
        <div style="font-size:28px; font-weight:800; color:var(--brand-primary);">${users.length}</div>
        <div style="font-size:11px; color:var(--text-secondary); font-weight:600; margin-top:4px;">Total de Usuários</div>
      </div>
      <div style="background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:10px; padding:16px; text-align:center;">
        <div style="font-size:28px; font-weight:800; color:var(--gold-primary);">${admins.length}</div>
        <div style="font-size:11px; color:var(--text-secondary); font-weight:600; margin-top:4px;">Administradores</div>
      </div>
      <div style="background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:10px; padding:16px; text-align:center;">
        <div style="font-size:28px; font-weight:800; color:var(--green-primary);">${ativos.length}</div>
        <div style="font-size:11px; color:var(--text-secondary); font-weight:600; margin-top:4px;">Usuários Ativos</div>
      </div>
      <div style="background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:10px; padding:16px; text-align:center;">
        <div style="font-size:28px; font-weight:800; color:var(--red-primary);">${users.filter(u=>!u.ativo).length}</div>
        <div style="font-size:11px; color:var(--text-secondary); font-weight:600; margin-top:4px;">Desativados</div>
      </div>
    </div>

    <!-- Formulário: Adicionar novo usuário -->
    <div style="background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:12px; padding:20px; margin-bottom:24px;">
      <h3 style="font-size:14px; font-weight:700; color:var(--text-primary); margin-bottom:16px; display:flex; align-items:center; gap:8px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="16" x2="22" y1="11" y2="11"/></svg>
        Adicionar Novo Usuário
      </h3>
      <div style="display:grid; grid-template-columns:1fr 1fr 1fr 140px 120px; gap:12px; align-items:end;">
        <div>
          <label style="font-size:10px; font-weight:700; color:var(--text-secondary); text-transform:uppercase; display:block; margin-bottom:4px;">Nome Completo</label>
          <input type="text" id="cfg-new-name" placeholder="Dr. Nome Sobrenome"
            style="width:100%; padding:8px 10px; border:1px solid var(--border-color); border-radius:6px; background:var(--bg-tertiary); color:var(--text-primary); font-size:12px;">
        </div>
        <div>
          <label style="font-size:10px; font-weight:700; color:var(--text-secondary); text-transform:uppercase; display:block; margin-bottom:4px;">E-mail</label>
          <input type="email" id="cfg-new-email" placeholder="email@pfa.adv.br"
            style="width:100%; padding:8px 10px; border:1px solid var(--border-color); border-radius:6px; background:var(--bg-tertiary); color:var(--text-primary); font-size:12px;">
        </div>
        <div>
          <label style="font-size:10px; font-weight:700; color:var(--text-secondary); text-transform:uppercase; display:block; margin-bottom:4px;">Senha de Acesso</label>
          <input type="password" id="cfg-new-password" placeholder="Mín. 8 caracteres"
            style="width:100%; padding:8px 10px; border:1px solid var(--border-color); border-radius:6px; background:var(--bg-tertiary); color:var(--text-primary); font-size:12px;">
        </div>
        <div>
          <label style="font-size:10px; font-weight:700; color:var(--text-secondary); text-transform:uppercase; display:block; margin-bottom:4px;">Perfil</label>
          <select id="cfg-new-role"
            style="width:100%; padding:8px 10px; border:1px solid var(--border-color); border-radius:6px; background:var(--bg-tertiary); color:var(--text-primary); font-size:12px;">
            <option value="assistente">Assistente</option>
            <option value="advogado">Advogado</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        <div>
          <button onclick="cfgAddUser()" class="btn btn-yellow" style="width:100%; padding:9px; font-size:12px; font-weight:700;">
            ➕ Adicionar
          </button>
        </div>
      </div>
    </div>

    <!-- Tabela de usuários -->
    <div style="background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:12px; overflow:hidden;">
      <div style="padding:14px 20px; border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
        <h3 style="font-size:14px; font-weight:700; color:var(--text-primary); margin:0;">👥 Usuários Cadastrados</h3>
        <input type="text" id="cfg-user-search" placeholder="Buscar usuário..." oninput="renderConfigScreen()"
          style="padding:6px 10px; border:1px solid var(--border-color); border-radius:6px; background:var(--bg-tertiary); color:var(--text-primary); font-size:12px; width:200px;">
      </div>
      <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:12px;">
          <thead>
            <tr style="background:var(--bg-tertiary);">
              <th style="padding:10px 16px; text-align:left; font-weight:700; color:var(--text-secondary); font-size:10px; text-transform:uppercase;">Usuário</th>
              <th style="padding:10px 16px; text-align:left; font-weight:700; color:var(--text-secondary); font-size:10px; text-transform:uppercase;">E-mail</th>
              <th style="padding:10px 16px; text-align:left; font-weight:700; color:var(--text-secondary); font-size:10px; text-transform:uppercase;">Perfil</th>
              <th style="padding:10px 16px; text-align:left; font-weight:700; color:var(--text-secondary); font-size:10px; text-transform:uppercase;">Status</th>
              <th style="padding:10px 16px; text-align:left; font-weight:700; color:var(--text-secondary); font-size:10px; text-transform:uppercase;">Criado em</th>
              <th style="padding:10px 16px; text-align:center; font-weight:700; color:var(--text-secondary); font-size:10px; text-transform:uppercase;">Ações</th>
            </tr>
          </thead>
          <tbody id="cfg-users-tbody">
            ${renderUsersRows()}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderUsersRows() {
  const searchEl = document.getElementById('cfg-user-search');
  const search = searchEl ? searchEl.value.toLowerCase() : '';
  const filtered = window.pfaUsers.filter(u =>
    u.nome.toLowerCase().includes(search) || u.email.toLowerCase().includes(search)
  );

  const roleLabels = { admin: '👑 Admin', advogado: '⚖️ Advogado', assistente: '🧑‍💼 Assistente' };
  const roleBg = { admin: 'rgba(183,133,48,0.15)', advogado: 'rgba(91,33,182,0.12)', assistente: 'rgba(59,130,246,0.1)' };
  const roleColor = { admin: 'var(--gold-primary)', advogado: '#a78bfa', assistente: '#60a5fa' };

  if (!filtered.length) return `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-secondary);">Nenhum usuário encontrado.</td></tr>`;

  return filtered.map(u => `
    <tr style="border-top:1px solid var(--border-color); transition:background 0.15s;" onmouseover="this.style.background='var(--bg-tertiary)'" onmouseout="this.style.background='transparent'">
      <td style="padding:12px 16px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <div style="width:32px;height:32px;border-radius:50%;background:var(--brand-primary);color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;">
            ${u.nome.split(' ').map(n=>n[0]).slice(0,2).join('')}
          </div>
          <strong style="color:var(--text-primary);">${u.nome}</strong>
        </div>
      </td>
      <td style="padding:12px 16px; color:var(--text-secondary);">${u.email}</td>
      <td style="padding:12px 16px;">
        <select onchange="cfgChangeRole(${u.id}, this.value)"
          style="padding:3px 8px; border:1px solid var(--border-color); border-radius:20px; font-size:11px; font-weight:700; cursor:pointer;
          background:${roleBg[u.role]||'var(--bg-tertiary)'}; color:${roleColor[u.role]||'var(--text-primary)'};">
          <option value="assistente" ${u.role==='assistente'?'selected':''}>🧑‍💼 Assistente</option>
          <option value="advogado"   ${u.role==='advogado'?'selected':''}>⚖️ Advogado</option>
          <option value="admin"      ${u.role==='admin'?'selected':''}>👑 Admin</option>
        </select>
      </td>
      <td style="padding:12px 16px;">
        <button onclick="cfgToggleAtivo(${u.id})"
          style="padding:3px 10px; border-radius:20px; border:none; font-size:11px; font-weight:700; cursor:pointer;
          background:${u.ativo ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.1)'};
          color:${u.ativo ? 'var(--green-primary)' : 'var(--red-primary)'};">
          ${u.ativo ? '✅ Ativo' : '❌ Inativo'}
        </button>
      </td>
      <td style="padding:12px 16px; color:var(--text-secondary); font-size:11px;">${u.criadoEm}</td>
      <td style="padding:12px 16px; text-align:center;">
        <div style="display:flex; gap:6px; justify-content:center;">
          <button onclick="cfgResetPassword(${u.id})" title="Redefinir senha"
            style="padding:4px 8px; border:1px solid var(--border-color); border-radius:6px; background:none; color:var(--text-secondary); font-size:11px; cursor:pointer;">
            🔑 Senha
          </button>
          <button onclick="cfgRemoveUser(${u.id})" title="Remover usuário"
            style="padding:4px 8px; border:1px solid var(--red-primary); border-radius:6px; background:none; color:var(--red-primary); font-size:11px; cursor:pointer;">
            🗑️
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function cfgAddUser() {
  const nome = document.getElementById('cfg-new-name')?.value?.trim();
  const email = document.getElementById('cfg-new-email')?.value?.trim();
  const senha = document.getElementById('cfg-new-password')?.value;
  const role = document.getElementById('cfg-new-role')?.value;

  if (!nome || nome.length < 3) { showToastNotification('Erro', 'Nome deve ter ao menos 3 caracteres.', 'error'); return; }
  if (!email || !email.includes('@')) { showToastNotification('Erro', 'E-mail inválido.', 'error'); return; }
  if (window.pfaUsers.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    showToastNotification('Erro', 'E-mail já cadastrado.', 'error'); return;
  }
  if (!senha || senha.length < 8) { showToastNotification('Erro', 'Senha deve ter mínimo 8 caracteres.', 'error'); return; }

  const today = new Date();
  const criadoEm = `${String(today.getDate()).padStart(2,'0')}/${String(today.getMonth()+1).padStart(2,'0')}/${today.getFullYear()}`;
  const newId = Math.max(...window.pfaUsers.map(u => u.id), 0) + 1;
  window.pfaUsers.push({ id: newId, nome, email, role, ativo: true, criadoEm });
  saveUsers();
  renderConfigScreen();
  showToastNotification('Usuário Criado', `${nome} adicionado com sucesso!`, 'success');
}

function cfgChangeRole(userId, newRole) {
  const user = window.pfaUsers.find(u => u.id === userId);
  if (user) {
    user.role = newRole;
    saveUsers();
    const tbody = document.getElementById('cfg-users-tbody');
    if (tbody) tbody.innerHTML = renderUsersRows();
    showToastNotification('Permissão Atualizada', `${user.nome} agora é ${newRole}.`, 'success');
  }
}

function cfgToggleAtivo(userId) {
  const user = window.pfaUsers.find(u => u.id === userId);
  if (user) {
    if (user.role === 'admin' && user.ativo && window.pfaUsers.filter(u => u.role === 'admin' && u.ativo).length <= 1) {
      showToastNotification('Ação Bloqueada', 'Deve haver ao menos 1 admin ativo.', 'error');
      return;
    }
    user.ativo = !user.ativo;
    saveUsers();
    const tbody = document.getElementById('cfg-users-tbody');
    if (tbody) tbody.innerHTML = renderUsersRows();
    showToastNotification('Status Atualizado', `${user.nome} ${user.ativo ? 'ativado' : 'desativado'}.`, user.ativo ? 'success' : 'warning');
  }
}

function cfgResetPassword(userId) {
  const user = window.pfaUsers.find(u => u.id === userId);
  if (!user) return;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.innerHTML = `
    <div class="edit-lead-modal" style="max-width:400px;">
      <div class="modal-header">
        <h3>🔑 Redefinir Senha — ${user.nome}</h3>
        <button class="modal-close-btn" onclick="this.closest('.modal-overlay').remove()">×</button>
      </div>
      <div class="modal-body" style="padding:20px; display:flex; flex-direction:column; gap:12px;">
        <div>
          <label style="font-size:11px;font-weight:700;color:var(--text-secondary);text-transform:uppercase;display:block;margin-bottom:4px;">Nova Senha</label>
          <input type="password" id="cfg-reset-pwd" placeholder="Mín. 8 caracteres"
            style="width:100%;padding:8px 10px;border:1px solid var(--border-color);border-radius:6px;background:var(--bg-tertiary);color:var(--text-primary);font-size:12px;">
        </div>
        <div>
          <label style="font-size:11px;font-weight:700;color:var(--text-secondary);text-transform:uppercase;display:block;margin-bottom:4px;">Confirmar Nova Senha</label>
          <input type="password" id="cfg-reset-pwd2" placeholder="Repita a senha"
            style="width:100%;padding:8px 10px;border:1px solid var(--border-color);border-radius:6px;background:var(--bg-tertiary);color:var(--text-primary);font-size:12px;">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline-yellow" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
        <button class="btn btn-yellow" onclick="
          const p1=document.getElementById('cfg-reset-pwd').value;
          const p2=document.getElementById('cfg-reset-pwd2').value;
          if(p1.length<8){showToastNotification('Erro','Senha deve ter mín. 8 caracteres.','error');return;}
          if(p1!==p2){showToastNotification('Erro','As senhas não coincidem.','error');return;}
          this.closest('.modal-overlay').remove();
          showToastNotification('Senha Redefinida','Nova senha salva com sucesso! ✅','success');
        ">✅ Salvar Senha</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function cfgRemoveUser(userId) {
  const user = window.pfaUsers.find(u => u.id === userId);
  if (!user) return;
  if (user.role === 'admin' && window.pfaUsers.filter(u => u.role === 'admin' && u.ativo).length <= 1) {
    showToastNotification('Ação Bloqueada', 'Não é possível remover o único admin ativo.', 'error'); return;
  }
  if (!confirm(`Remover ${user.nome} permanentemente?`)) return;
  window.pfaUsers = window.pfaUsers.filter(u => u.id !== userId);
  saveUsers();
  renderConfigScreen();
  showToastNotification('Usuário Removido', `${user.nome} foi removido.`, 'success');
}

window.startWebhookLogSimulation = startWebhookLogSimulation;
window.renderConfigScreen = renderConfigScreen;
window.renderWebhookLogs = renderWebhookLogs;
window.cfgResetPassword = cfgResetPassword;
window.cfgRemoveUser = cfgRemoveUser;
