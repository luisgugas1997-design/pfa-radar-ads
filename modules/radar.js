// Radar Google Ads — integração nativa do dashboard PFA
(function () {
  'use strict';

  const LIVE_API = 'https://chatwoot-radar-api.phqoes.easypanel.host';
  const state = {
    initialized: false,
    dashboard: null,
    quota: null,
    plan: null,
    loading: false,
  };

  const byId = (id) => document.getElementById(id);
  const apiBase = () => window.location.protocol === 'file:' ? LIVE_API : '';

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function toNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    }).format(date);
  }

  function compactText(values, limit = 2) {
    const valid = (Array.isArray(values) ? values : []).filter(Boolean).slice(0, limit);
    return valid.length ? valid.join(' · ') : 'Ainda não observado nesta amostra.';
  }

  function setFeedback(message = '', type = '') {
    const element = byId('radar-feedback');
    if (!element) return;
    element.textContent = message;
    element.className = `radar-feedback${message ? ' is-visible' : ''}${type ? ` is-${type}` : ''}`;
  }

  async function fetchJson(path, options = {}) {
    const response = await fetch(`${apiBase()}${path}`, {
      credentials: 'include',
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {}),
      },
    });
    let payload = null;
    try { payload = await response.json(); } catch (_) { payload = null; }
    if (!response.ok) {
      const detail = payload && (payload.detail || payload.error);
      throw new Error(detail || `Falha HTTP ${response.status}`);
    }
    return payload;
  }

  function queryString() {
    const params = new URLSearchParams({
      days: byId('radar-filter-days')?.value || '30',
      time_window: byId('radar-filter-window')?.value || 'all',
    });
    const filters = [
      ['service', 'radar-filter-service'],
      ['location', 'radar-filter-location'],
      ['device', 'radar-filter-device'],
    ];
    filters.forEach(([key, id]) => {
      const value = byId(id)?.value;
      if (value) params.set(key, value);
    });
    return params.toString();
  }

  function populateSelect(id, values, emptyLabel) {
    const select = byId(id);
    if (!select) return;
    const selected = select.value;
    const cleanValues = [...new Set((values || []).filter(Boolean))];
    select.innerHTML = `<option value="">${escapeHtml(emptyLabel)}</option>${cleanValues
      .map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)
      .join('')}`;
    if (cleanValues.includes(selected)) select.value = selected;
  }

  function renderQuota(quota) {
    const badge = byId('radar-quota-badge');
    if (!badge) return;
    badge.className = 'radar-quota-badge';
    if (!quota || quota.status === 'unavailable' || !Number.isInteger(quota.remaining)) {
      badge.classList.add('is-unavailable');
      badge.textContent = 'Saldo indisponível — relatório liberado';
      return;
    }
    const remaining = quota.remaining;
    const limit = Number.isInteger(quota.monthly_limit) ? quota.monthly_limit : '—';
    badge.textContent = `Saldo SerpApi: ${remaining} / ${limit}`;
    if (remaining <= 0) badge.classList.add('is-empty');
    else if (remaining <= 25) badge.classList.add('is-low');
  }

  async function loadQuota() {
    try {
      state.quota = await fetchJson('/api/radar/quota');
    } catch (error) {
      state.quota = { status: 'unavailable', error: error.message };
    }
    renderQuota(state.quota);
    return state.quota;
  }

  function renderKpis(coverage = {}) {
    const cards = [
      ['Concorrentes observados', coverage.advertisers_observed, `${coverage.completed_search_runs || 0} buscas concluídas`],
      ['Anúncios únicos observados', coverage.unique_ads_observed, `${coverage.observations || 0} aparições registradas`],
      ['Oportunidades sem anúncio', coverage.zero_ad_search_runs, `${coverage.queries_searched || 0} consultas avaliadas`],
      ['Landing pages observadas', coverage.landing_pages_observed, `Amostra ${coverage.sample_confidence || 'baixa'}`],
    ];
    byId('radar-kpis').innerHTML = cards.map(([label, value, detail]) => `
      <article class="radar-kpi-card">
        <span class="radar-kpi-label">${escapeHtml(label)}</span>
        <strong class="radar-kpi-value">${toNumber(value)}</strong>
        <span class="radar-kpi-detail">${escapeHtml(detail)}</span>
      </article>`).join('');
  }

  function renderSummary(items = []) {
    const summary = items.slice(0, 3);
    byId('radar-executive-summary').innerHTML = summary.length
      ? summary.map((item) => `<div class="radar-summary-item"><strong>${item.kind === 'observed' ? 'Observado: ' : 'Leitura: '}</strong>${escapeHtml(item.text)}</div>`).join('')
      : '<div class="radar-summary-item">Execute buscas para construir o resumo executivo observado.</div>';
  }

  function renderMarketPressure(items = []) {
    const container = byId('radar-market-pressure');
    const ranking = items.slice(0, 10);
    if (!ranking.length) {
      container.innerHTML = '<div class="radar-empty">Nenhum concorrente observado com estes filtros.</div>';
      return;
    }
    container.innerHTML = ranking.map((item) => {
      const rate = Math.max(0, Math.min(100, toNumber(item.observed_presence_rate)));
      const position = item.average_position_observed == null ? '—' : item.average_position_observed;
      return `<article class="radar-market-row">
        <div class="radar-market-name"><strong>${escapeHtml(item.advertiser)}</strong><small>${escapeHtml(item.domain)}</small></div>
        <div class="radar-market-track" title="${rate}% das buscas concluídas"><div class="radar-market-fill" style="width:${rate}%"></div></div>
        <div class="radar-market-stats"><strong>${rate.toFixed(1)}%</strong><small>${toNumber(item.unique_ads_observed)} anúncios · pos. média ${escapeHtml(position)}</small></div>
      </article>`;
    }).join('');
  }

  function renderOpportunities(items = []) {
    const opportunities = items.filter((item) => item.is_opportunity).slice(0, 12);
    const tbody = byId('radar-opportunities');
    if (!opportunities.length) {
      tbody.innerHTML = '<tr><td colspan="4"><div class="radar-empty">Nenhuma oportunidade de baixa pressão nesta amostra.</div></td></tr>';
      return;
    }
    tbody.innerHTML = opportunities.map((item) => `
      <tr>
        <td>${escapeHtml(item.query)}<br><span class="radar-opportunity-chip">${toNumber(item.zero_ad_rate).toFixed(0)}% sem anúncios</span></td>
        <td>${escapeHtml(item.location)}<br><small>${escapeHtml(item.device)}</small></td>
        <td>${toNumber(item.average_distinct_advertisers).toFixed(1)}<br><small>${toNumber(item.completed_runs)} buscas</small></td>
        <td class="${item.sample_confidence === 'baixa' ? 'radar-confidence-low' : ''}">${escapeHtml(item.sample_confidence)}</td>
      </tr>`).join('');
  }

  function renderMessaging(items = []) {
    const container = byId('radar-messaging-library');
    const messages = items.slice(0, 9);
    if (!messages.length) {
      container.innerHTML = '<div class="radar-empty">Ainda não há textos de anúncios ou páginas para comparar.</div>';
      return;
    }
    container.innerHTML = messages.map((item) => {
      const promises = [...(item.titles || []), ...(item.headlines || [])];
      const signals = [...(item.urgency_signals || []), ...(item.authority_signals || [])].slice(0, 4);
      const ctas = (item.ctas || []).slice(0, 4);
      return `<article class="radar-message-card">
        <h3>${escapeHtml(item.advertiser)}</h3><small>${escapeHtml(item.domain)}</small>
        <div class="radar-message-block"><b>Promessas e ganchos</b><p>${escapeHtml(compactText(promises))}</p></div>
        <div class="radar-message-block"><b>Descrições</b><p>${escapeHtml(compactText(item.descriptions, 1))}</p></div>
        <div class="radar-message-block"><b>CTAs e sinais</b><div class="radar-tag-list">${[...ctas, ...signals].length
          ? [...ctas, ...signals].map((value) => `<span class="radar-tag">${escapeHtml(value)}</span>`).join('')
          : '<span class="radar-tag">Não observado</span>'}</div></div>
      </article>`;
    }).join('');
  }

  function renderObservations(items = []) {
    const container = byId('radar-recent-observations');
    const observations = items.slice(0, 12);
    if (!observations.length) {
      container.innerHTML = '<div class="radar-empty">Nenhuma evidência encontrada com estes filtros.</div>';
      return;
    }
    container.innerHTML = observations.map((item) => {
      const screenshot = item.latest_snapshot?.screenshot_url;
      const image = screenshot
        ? `<img src="${escapeHtml(`${apiBase()}${screenshot}`)}" alt="Captura da landing page de ${escapeHtml(item.advertiser)}" loading="lazy">`
        : '<span>⌕</span>';
      return `<article class="radar-observation-card">
        <div class="radar-observation-image">${image}</div>
        <div class="radar-observation-body">
          <small>${escapeHtml(item.advertiser)} · posição ${escapeHtml(item.position || '—')}</small>
          <h3>${escapeHtml(item.title || item.latest_snapshot?.h1 || 'Título não informado')}</h3>
          <p>${escapeHtml(item.description || 'Descrição não informada.')}</p>
          <div class="radar-observation-meta"><span>${escapeHtml(item.location)}</span><span>${formatDate(item.observed_at)}</span></div>
        </div>
      </article>`;
    }).join('');
  }

  function renderMethodology(methodology = {}, coverage = {}) {
    const element = byId('radar-methodology');
    element.innerHTML = `<strong>Leitura responsável:</strong> ${escapeHtml(methodology.scope || '')} ${escapeHtml(methodology.presence_rate || '')}<br>
      <strong>Cobertura atual:</strong> ${toNumber(coverage.completed_search_runs)} buscas concluídas, ${toNumber(coverage.locations_searched)} regiões e ${toNumber(coverage.devices_searched)} tipos de dispositivo. Última coleta: ${formatDate(coverage.last_search_at)}.`;
  }

  function renderDashboard(data) {
    state.dashboard = data;
    const coverage = data.coverage || {};
    renderKpis(coverage);
    renderSummary(data.executive_summary || []);
    renderMarketPressure(data.market_pressure || []);
    renderOpportunities(data.opportunity_map || []);
    renderMessaging(data.messaging_library || []);
    renderObservations(data.recent_observations || []);
    renderMethodology(data.methodology || {}, coverage);
    const confidence = byId('radar-sample-confidence');
    if (confidence) confidence.textContent = `Amostra ${coverage.sample_confidence || 'baixa'}`;
    populateSelect('radar-filter-service', data.filter_options?.services, 'Todos');
    populateSelect('radar-filter-location', data.filter_options?.locations, 'Todas');
  }

  async function loadDashboard() {
    if (state.loading) return;
    state.loading = true;
    const button = byId('radar-apply-filters');
    if (button) { button.disabled = true; button.textContent = 'Atualizando…'; }
    setFeedback('Atualizando inteligência observada…', 'loading');
    try {
      const data = await fetchJson(`/api/radar/dashboard?${queryString()}`);
      renderDashboard(data);
      setFeedback('');
    } catch (error) {
      setFeedback(`Não foi possível carregar o Radar: ${error.message}`, 'error');
    } finally {
      state.loading = false;
      if (button) { button.disabled = false; button.textContent = 'Atualizar análise'; }
    }
  }

  function csvCell(value) {
    const text = Array.isArray(value) ? value.join(' | ') : String(value ?? '');
    return `"${text.replaceAll('"', '""')}"`;
  }

  function downloadCsv(filename, headers, rows) {
    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(';')).join('\r\n');
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 500);
  }

  function exportOpportunities() {
    const rows = (state.dashboard?.opportunity_map || []).map((item) => [
      item.query, item.location, item.device, item.completed_runs, item.zero_ad_rate,
      item.average_distinct_advertisers, item.classification, item.sample_confidence,
    ]);
    downloadCsv('radar-oportunidades.csv', ['Consulta', 'Região', 'Dispositivo', 'Buscas', '% sem anúncios', 'Média concorrentes', 'Classificação', 'Confiança'], rows);
  }

  function exportMessages() {
    const rows = (state.dashboard?.messaging_library || []).map((item) => [
      item.advertiser, item.domain, item.titles, item.descriptions, item.headlines,
      item.ctas, item.urgency_signals, item.authority_signals, item.landing_pages,
    ]);
    downloadCsv('radar-mensagens-ctas.csv', ['Anunciante', 'Domínio', 'Títulos', 'Descrições', 'H1', 'CTAs', 'Urgência', 'Autoridade', 'Landing pages'], rows);
  }

  function openModal() {
    const modal = byId('radar-scan-modal');
    if (!modal) return;
    const selectedService = byId('radar-filter-service')?.value;
    const scanService = byId('radar-scan-service');
    if (selectedService && [...scanService.options].some((item) => item.value === selectedService)) scanService.value = selectedService;
    state.plan = null;
    byId('radar-plan-summary').className = 'radar-plan-summary';
    byId('radar-plan-summary').innerHTML = '';
    byId('radar-confirm-scan').disabled = true;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    const modal = byId('radar-scan-modal');
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
  }

  function renderPlan(plan, quota) {
    const summary = byId('radar-plan-summary');
    const remaining = Number.isInteger(quota?.remaining) ? quota.remaining : null;
    const after = remaining == null ? 'a confirmar' : Math.max(0, remaining - plan.estimated_credits);
    const insufficient = remaining != null && plan.estimated_credits > remaining;
    summary.innerHTML = `
      <div class="radar-credit-flow">
        <div class="radar-credit-box"><strong>${remaining ?? '—'}</strong><small>saldo antes</small></div>
        <b>− ${plan.estimated_credits}</b>
        <div class="radar-credit-box"><strong>${after}</strong><small>saldo depois</small></div>
      </div>
      <div class="radar-plan-list"><strong>${plan.matrix.length} consultas planejadas${plan.limited ? ' (plano limitado a 24)' : ''}:</strong><br>${plan.matrix
        .map((item) => `${item.index}. ${escapeHtml(item.keyword)} · ${escapeHtml(item.location)} · ${escapeHtml(item.device)}`)
        .join('<br>')}</div>
      ${insufficient ? '<p style="color:#9b2435;margin:10px 0 0;font-size:11px;font-weight:700">Saldo insuficiente. Nenhuma consulta será executada.</p>' : ''}
      ${remaining == null ? '<p style="color:#8a5b0b;margin:10px 0 0;font-size:11px">O saldo não pôde ser confirmado agora. O backend fará a trava antes de consumir qualquer crédito.</p>' : ''}`;
    summary.classList.add('is-visible');
    byId('radar-confirm-scan').disabled = insufficient || !plan.matrix.length;
  }

  async function previewPlan() {
    const button = byId('radar-preview-plan');
    button.disabled = true;
    button.textContent = 'Calculando…';
    try {
      const params = new URLSearchParams({
        service: byId('radar-scan-service').value,
        locations: byId('radar-scan-locations').value,
        devices: byId('radar-scan-devices').value,
        mode: byId('radar-scan-mode').value,
      });
      const [plan, quota] = await Promise.all([
        fetchJson(`/api/radar/search-plan?${params.toString()}`),
        loadQuota(),
      ]);
      state.plan = plan;
      renderPlan(plan, quota);
    } catch (error) {
      state.plan = null;
      byId('radar-plan-summary').className = 'radar-plan-summary is-visible';
      byId('radar-plan-summary').innerHTML = `<p style="color:#92263a;margin:0">${escapeHtml(error.message)}</p>`;
      byId('radar-confirm-scan').disabled = true;
    } finally {
      button.disabled = false;
      button.textContent = 'Calcular custo antes de pesquisar';
    }
  }

  const wait = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

  async function executePlan() {
    if (!state.plan?.matrix?.length) return;
    const button = byId('radar-confirm-scan');
    const total = state.plan.matrix.length;
    let completed = 0;
    let failed = 0;
    button.disabled = true;
    for (const item of state.plan.matrix) {
      button.textContent = `Executando ${completed + failed + 1} de ${total}…`;
      try {
        await fetchJson('/api/radar/scan', {
          method: 'POST',
          body: JSON.stringify({
            keyword: item.keyword,
            location: item.location,
            device: item.device,
            service: item.service,
          }),
        });
        completed += 1;
      } catch (error) {
        failed += 1;
        if (/saldo|credit|quota/i.test(error.message)) break;
      }
      if (completed + failed < total) await wait(1800);
    }
    closeModal();
    button.textContent = 'Confirmar e consumir créditos';
    setFeedback(`${completed} buscas concluídas${failed ? ` e ${failed} falharam` : ''}. Atualizando relatórios…`, failed ? 'error' : 'success');
    await Promise.all([loadQuota(), loadDashboard()]);
  }

  function bindEvents() {
    byId('radar-apply-filters')?.addEventListener('click', loadDashboard);
    byId('radar-new-scan')?.addEventListener('click', openModal);
    byId('radar-preview-plan')?.addEventListener('click', previewPlan);
    byId('radar-confirm-scan')?.addEventListener('click', executePlan);
    byId('radar-export-opportunities')?.addEventListener('click', exportOpportunities);
    byId('radar-export-messages')?.addEventListener('click', exportMessages);
    document.querySelectorAll('[data-radar-close-modal]').forEach((element) => element.addEventListener('click', closeModal));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && byId('radar-scan-modal')?.classList.contains('is-open')) closeModal();
    });
  }

  async function initRadarDashboard() {
    if (!byId('screen-radar')) return;
    if (!state.initialized) {
      bindEvents();
      state.initialized = true;
    }
    await Promise.all([loadQuota(), loadDashboard()]);
  }

  window.initRadarDashboard = initRadarDashboard;
})();
