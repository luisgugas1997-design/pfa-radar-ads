// --- Gestor de Documentos: Central de Controle de Escala ---
window.docsFilters = {
  deadline: 'all',
  stage: 'all',
  infraction: 'all'
};
window.docsAutocompleteIndex = -1;

function getLeadNearestDeadline(leadId) {
  const tasks = (window.mockTasks || []).filter(t => t.leadId === leadId && !t.concluida);
  if (!tasks.length) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let nearest = null;
  tasks.forEach(task => {
    const iso = formatDateToISO(task.prazo);
    if (!iso) return;
    const diff = Math.ceil((new Date(iso.substring(0, 10)) - today) / 86400000);
    if (!nearest || diff < nearest.diff) {
      nearest = { task, diff };
    }
  });
  return nearest;
}

function getDocsInfractionAliases(filterValue) {
  const aliases = {
    'Suspenso por Pontos': ['cnh suspensa', 'suspensão por pontos', 'suspenso por pontos', 'suspensao por pontos'],
    'Excesso de Velocidade': ['excesso de velocidade', 'excesso'],
    'Lei Seca': ['lei seca']
  };
  return aliases[filterValue] || [filterValue.toLowerCase()];
}

function leadMatchesDocsStage(lead, stageFilter) {
  const stageMap = {
    Triagem: ['em triagem', 'triagem'],
    'Defesa Prévia': ['defesa prévia', 'defesa previa', 'recurso em andamento', 'protocolo'],
    'Recurso JARI/CETRAN': ['recurso em andamento', 'recurso jari', 'cetran', 'audiência / retorno', 'audiencia / retorno']
  };
  const etapa = (lead.etapa || '').toLowerCase();
  const aliases = stageMap[stageFilter] || [stageFilter.toLowerCase()];
  return aliases.some(alias => etapa.includes(alias));
}

function leadMatchesDocsSearch(lead, query) {
  const val = query.toLowerCase().trim();
  if (!val) return true;
  const placa = (lead.placa || `BRA-3Y2${lead.id}`).toLowerCase();
  const cnh = (lead.cnh || `992837411${lead.id}`).toLowerCase();
  const cpf = (lead.cpf || '').replace(/\D/g, '');
  const queryDigits = val.replace(/\D/g, '');
  return (
    lead.name.toLowerCase().includes(val) ||
    placa.includes(val) ||
    cnh.includes(val) ||
    (queryDigits && cpf.includes(queryDigits))
  );
}

window.updateDocsFilterCount = function() {
  const badge = document.getElementById('docs-filter-count');
  if (!badge) return;
  const count = getFilteredDocsLeads().length;
  badge.textContent = count === 1 ? '1 motorista' : `${count} motoristas`;
};

window.renderDocsAutocomplete = function(query) {
  const autocompleteDiv = document.getElementById('docs-client-autocomplete');
  if (!autocompleteDiv) return;

  const filteredLeads = getFilteredDocsLeads().filter(l => leadMatchesDocsSearch(l, query));
  window.docsAutocompleteIndex = -1;

  if (!query.trim()) {
    autocompleteDiv.style.display = 'none';
    autocompleteDiv.innerHTML = '';
    return;
  }

  if (filteredLeads.length === 0) {
    autocompleteDiv.innerHTML = '<div class="autocomplete-item autocomplete-empty">Nenhum motorista encontrado</div>';
  } else {
    autocompleteDiv.innerHTML = filteredLeads.map((l, idx) => {
      const placa = l.placa || `BRA-3Y2${l.id}`;
      const cnh = l.cnh || `992837411${l.id}`;
      const deadline = getLeadNearestDeadline(l.id);
      const deadlineLabel = deadline
        ? (deadline.diff <= 0 ? '🚨 Vencido' : deadline.diff <= 2 ? '🚨 Crítico' : deadline.diff <= 7 ? '⚠️ Atenção' : '✓ OK')
        : '';
      return `<div class="autocomplete-item" data-lead-id="${l.id}" data-index="${idx}" onclick="selectDocsClient(${l.id})">
        <div class="autocomplete-item-main"><strong>${l.name}</strong> <span class="autocomplete-case">${l.tipoCaso}</span></div>
        <div class="autocomplete-item-meta">🚗 ${placa} · 📋 CNH ${cnh}${deadlineLabel ? ` · ${deadlineLabel}` : ''}</div>
      </div>`;
    }).join('');
  }
  autocompleteDiv.style.display = 'block';
};

window.initDocsScaleControl = function() {
  const searchInput = document.getElementById('docs-client-search');
  const autocompleteDiv = document.getElementById('docs-client-autocomplete');
  const scaleRoot = document.querySelector('.scale-control-center');
  if (!searchInput || !autocompleteDiv) return;

  const pills = scaleRoot ? scaleRoot.querySelectorAll('.filter-pill') : document.querySelectorAll('.scale-control-center .filter-pill');
  pills.forEach(pill => {
    pill.onclick = () => {
      const type = pill.getAttribute('data-filter-type');
      const val = pill.getAttribute('data-value');

      document.querySelectorAll(`.scale-control-center .filter-pill[data-filter-type="${type}"]`).forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      window.docsFilters[type] = val;
      searchInput.value = '';
      autocompleteDiv.style.display = 'none';
      triggerDocsFiltering();
    };
  });

  searchInput.oninput = (e) => renderDocsAutocomplete(e.target.value);

  searchInput.onkeydown = (e) => {
    const items = autocompleteDiv.querySelectorAll('.autocomplete-item[data-lead-id]');
    if (!items.length || autocompleteDiv.style.display === 'none') {
      if (e.key === 'Enter') triggerDocsFiltering();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      window.docsAutocompleteIndex = Math.min(window.docsAutocompleteIndex + 1, items.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      window.docsAutocompleteIndex = Math.max(window.docsAutocompleteIndex - 1, 0);
    } else if (e.key === 'Enter' && window.docsAutocompleteIndex >= 0) {
      e.preventDefault();
      const selected = items[window.docsAutocompleteIndex];
      if (selected) selectDocsClient(Number(selected.getAttribute('data-lead-id')));
      return;
    } else if (e.key === 'Escape') {
      autocompleteDiv.style.display = 'none';
      window.docsAutocompleteIndex = -1;
      return;
    } else {
      return;
    }

    items.forEach((item, idx) => item.classList.toggle('autocomplete-item-active', idx === window.docsAutocompleteIndex));
    if (window.docsAutocompleteIndex >= 0) {
      items[window.docsAutocompleteIndex].scrollIntoView({ block: 'nearest' });
    }
  };

  if (!window.docsScaleControlInitialized) {
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !autocompleteDiv.contains(e.target)) {
        autocompleteDiv.style.display = 'none';
        window.docsAutocompleteIndex = -1;
      }
    });
    window.docsScaleControlInitialized = true;
  }
};

window.selectDocsClient = function(leadId) {
  currentLeadId = leadId;
  const lead = window.mockLeads.find(l => l.id === leadId);
  const searchInput = document.getElementById('docs-client-search');
  const autocompleteDiv = document.getElementById('docs-client-autocomplete');

  if (searchInput && lead) {
    searchInput.value = `${lead.name} (${lead.tipoCaso})`;
  }
  if (autocompleteDiv) {
    autocompleteDiv.style.display = 'none';
    window.docsAutocompleteIndex = -1;
  }

  activeDocumentId = null;
  updateDocsFilterCount();
  renderDocumentsTable();
  renderBottomTabContent('documentos');
  if (typeof renderFullCRMSidebar === 'function') renderFullCRMSidebar();
};

window.getFilteredDocsLeads = function() {
  let list = [...window.mockLeads];

  if (window.docsFilters.deadline === 'critical') {
    list = list.filter(l => {
      const nearest = getLeadNearestDeadline(l.id);
      return nearest && nearest.diff <= 2;
    });
  } else if (window.docsFilters.deadline === 'warning') {
    list = list.filter(l => {
      const nearest = getLeadNearestDeadline(l.id);
      return nearest && nearest.diff > 2 && nearest.diff <= 7;
    });
  }

  if (window.docsFilters.stage !== 'all') {
    list = list.filter(l => leadMatchesDocsStage(l, window.docsFilters.stage));
  }

  if (window.docsFilters.infraction !== 'all') {
    const aliases = getDocsInfractionAliases(window.docsFilters.infraction);
    list = list.filter(l => aliases.some(alias => (l.tipoCaso || '').toLowerCase().includes(alias)));
  }

  return list;
};

window.triggerDocsFiltering = function() {
  const filtered = getFilteredDocsLeads();
  updateDocsFilterCount();

  if (filtered.length === 0) {
    const searchInput = document.getElementById('docs-client-search');
    if (searchInput) searchInput.value = 'Nenhum motorista filtrado';
    activeDocumentId = null;
    const tableBody = document.getElementById('docs-table-body');
    if (tableBody) {
      tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-secondary);padding:30px;">Nenhum motorista corresponde aos filtros ativos. Ajuste os filtros acima.</td></tr>';
    }
    const autocompleteDiv = document.getElementById('docs-client-autocomplete');
    if (autocompleteDiv) autocompleteDiv.style.display = 'none';
    return;
  }

  const currentInList = filtered.find(l => l.id === currentLeadId);
  if (!currentInList) {
    selectDocsClient(filtered[0].id);
    return;
  }

  const searchInput = document.getElementById('docs-client-search');
  if (searchInput && !searchInput.value.trim()) {
    searchInput.value = `${currentInList.name} (${currentInList.tipoCaso})`;
  }
  activeDocumentId = null;
  renderDocumentsTable();
  renderBottomTabContent('documentos');
};
