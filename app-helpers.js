window.HesteVennHelpers = function createHesteVennHelpers(context) {
  const { data, singular, state } = context;

  function getRecordById(type, id) {
    return (data[type] || []).find((record) => record.id === id);
  }

  function getUserName(id) {
    const record = getRecordById('users', id);
    return record ? record.name : id;
  }

  function getHorseName(id) {
    const record = getRecordById('horses', id);
    return record ? record.name : id;
  }

  function objectTypeForId(id) {
    return Object.keys(data).find((type) => getRecordById(type, id));
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
  }

  function formatValue(key, value) {
    if (Array.isArray(value)) return value.join('; ');
    if (key === 'active') return value ? 'Ja' : 'Nei';
    if (key === 'date' || key === 'validFrom' || key === 'validUntil') return value ? new Date(`${value}T12:00:00`).toLocaleDateString('nb-NO') : '—';
    return value || '—';
  }

  function lookupLink(id, fallbackType) {
    const type = objectTypeForId(id) || fallbackType;
    const record = getRecordById(type, id);
    return record ? `<a class="record-link" href="#${singular[type]}/${encodeURIComponent(id)}">${escapeHtml(record.name)}</a>` : escapeHtml(id);
  }

  function renderCell(type, key, value, record) {
    if (key === 'ownerId' || key === 'userId' || key === 'sender' || key === 'mottaker') return value ? lookupLink(value, 'users') : '—';
    if (key === 'horseId') return value ? lookupLink(value, 'horses') : '—';
    if (key === 'wishId') return value ? lookupLink(value, 'wishes') : '—';
    if (key === 'name') return `<a class="record-link strong-link" href="#${singular[type]}/${encodeURIComponent(record.id)}">${escapeHtml(value)}</a>`;
    if (key === 'status' || key === 'severity' || key === 'role' || key === 'active') return `<span class="badge badge-${String(value).toLowerCase().replaceAll(' ', '-')}">${escapeHtml(formatValue(key, value))}</span>`;
    return escapeHtml(formatValue(key, value));
  }

  function uniqueValues(type, key) {
    return [...new Set(data[type].flatMap((record) => Array.isArray(record[key]) ? record[key] : formatValue(key, record[key])).filter(Boolean))].sort();
  }

  function normalizeFilterValue(type, key, value) {
    if (type !== 'wishes' || key !== 'ønsketype') return value;
    const normalized = String(value || '').toLowerCase().replaceAll(' ', '');
    const aliases = {
      'ønskeråri': 'Ønsker å Ri',
      'onskeråri': 'Ønsker å Ri',
      'onskerari': 'Ønsker å Ri',
      'ønskerenrytter': 'Ønsker en rytter',
      'onskerenrytter': 'Ønsker en rytter'
    };
    if (aliases[normalized]) return aliases[normalized];
    const canonical = uniqueValues('wishes', 'ønsketype').find((option) => String(option).toLowerCase().replaceAll(' ', '') === normalized);
    return canonical || value;
  }

  function matchesFilters(type, record) {
    return Object.entries(state.selectedFilters).every(([key, value]) => {
      if (!value) return true;
      const expectedValue = normalizeFilterValue(type, key, value);
      if (key === 'audience' && expectedValue === 'riders') return ['Rytter', 'Begge'].includes(record.role);
      if (Array.isArray(record[key])) return record[key].includes(expectedValue);
      return formatValue(key, record[key]) === expectedValue;
    });
  }

  return {
    getRecordById,
    getUserName,
    getHorseName,
    objectTypeForId,
    escapeHtml,
    formatValue,
    lookupLink,
    renderCell,
    uniqueValues,
    normalizeFilterValue,
    matchesFilters
  };
};
