window.HesteVennListViews = function createHesteVennListViews(context) {
  const {
    app,
    data,
    state,
    labels,
    singular,
    descriptions,
    columns,
    filters,
    getCurrentUser,
    canCreateRecord,
    escapeHtml,
    uniqueValues,
    renderCell,
    matchesFilters,
    searchDebounceMs = 180
  } = context;

  const searchCacheByType = new Map();
  const dirtySearchTypes = new Set(Object.keys(data));

  function markSearchCacheDirty(type) {
    if (!type) return;
    dirtySearchTypes.add(type);
  }

  function valueToSearchText(value) {
    if (value === null || value === undefined) return '';
    if (Array.isArray(value)) return value.map((part) => valueToSearchText(part)).join(' ');
    if (typeof value === 'object') return Object.values(value).map((part) => valueToSearchText(part)).join(' ');
    return String(value);
  }

  function buildRecordSearchText(record) {
    return Object.values(record || {}).map((value) => valueToSearchText(value)).join(' ').toLowerCase();
  }

  function ensureSearchCacheForType(type) {
    if (!searchCacheByType.has(type) || dirtySearchTypes.has(type)) {
      const index = new Map();
      (data[type] || []).forEach((record) => {
        if (!record?.id) return;
        index.set(record.id, buildRecordSearchText(record));
      });
      searchCacheByType.set(type, index);
      dirtySearchTypes.delete(type);
    }
  }

  function getRecordSearchText(type, record) {
    ensureSearchCacheForType(type);
    const index = searchCacheByType.get(type);
    if (!record?.id || !index) return '';
    if (!index.has(record.id)) index.set(record.id, buildRecordSearchText(record));
    return index.get(record.id) || '';
  }

  function debounce(callback, waitMs) {
    let timerId = 0;
    return (...args) => {
      window.clearTimeout(timerId);
      timerId = window.setTimeout(() => callback(...args), waitMs);
    };
  }

  function getFilteredRecordsForList(type) {
    const query = state.search.toLowerCase().trim();
    return data[type].filter((record) => matchesFilters(type, record) && (!query || getRecordSearchText(type, record).includes(query)));
  }

  function renderObjectListRows(type) {
    const body = document.querySelector('#record-table-body');
    const count = document.querySelector('#list-count');
    const emptyState = document.querySelector('#record-empty-state');
    if (!body || !count || !emptyState) return;

    const records = getFilteredRecordsForList(type);
    const rows = records.map((record) => `<tr>${columns[type].map(([key]) => `<td>${renderCell(type, key, record[key], record)}</td>`).join('')}</tr>`).join('');
    body.innerHTML = rows;
    count.textContent = `${records.length} av ${data[type].length} poster`;
    emptyState.hidden = records.length !== 0;
  }

  function bindListEvents(type) {
    const debouncedRenderRows = debounce(() => renderObjectListRows(type), searchDebounceMs);
    document.querySelector('#record-search').addEventListener('input', (event) => {
      state.search = event.target.value;
      debouncedRenderRows();
    });
    document.querySelectorAll('[data-filter-key]').forEach((select) => select.addEventListener('change', (event) => {
      state.selectedFilters[event.target.dataset.filterKey] = event.target.value;
      renderObjectListRows(type);
    }));
  }

  function renderObjectList(type) {
    const currentUser = getCurrentUser();
    const filterMarkup = (filters[type] || []).map(([key, label]) => `<label class="filter"><span>${label}</span><select data-filter-key="${key}"><option value="">${label}</option>${uniqueValues(type, key).map((value) => `<option value="${escapeHtml(value)}" ${state.selectedFilters[key] === value ? 'selected' : ''}>${escapeHtml(value)}</option>`).join('')}</select></label>`).join('');
    const tableHead = columns[type].map(([, label]) => `<th scope="col">${label}</th>`).join('');
    const createAction = canCreateRecord(type, currentUser)
      ? `<a class="button" href="#new-${singular[type]}">+ Legg Til</a>`
      : '';
    app.innerHTML = `<section class="page-heading"><div><p class="eyebrow">Objekt · ${labels[type]}</p><h1>${labels[type]}</h1><p class="lede">${descriptions[type]}</p></div><div class="page-actions">${createAction}</div></section><section class="list-panel"><div class="list-toolbar"><div><strong id="list-count">0 av ${data[type].length} poster</strong><span class="toolbar-note"> · lokale data</span></div><label class="search-field"><span class="sr-only">Søk i ${labels[type]}</span><span aria-hidden="true">⌕</span><input type="search" id="record-search" placeholder="Søk i poster" value="${escapeHtml(state.search)}"></label><div class="filters">${filterMarkup}</div></div><div class="table-wrap"><table><thead><tr>${tableHead}</tr></thead><tbody id="record-table-body"></tbody></table></div><div class="empty-state" id="record-empty-state" hidden><span aria-hidden="true">⌕</span><h2>Ingen poster funnet</h2><p>Prøv et annet søk eller fjern et filter.</p></div></section>`;
    bindListEvents(type);
    renderObjectListRows(type);
  }

  return {
    markSearchCacheDirty,
    renderObjectList
  };
};