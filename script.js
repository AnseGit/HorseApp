(function () {
  const data = window.HesteVennData;
  const app = document.querySelector('#app');
  const labels = { users: 'Brukere', horses: 'Hester', activities: 'Aktiviteter', qualifications: 'Kvalifikasjoner', incidents: 'Hendelser' };
  const singular = { users: 'user', horses: 'horse', activities: 'activity', qualifications: 'qualification', incidents: 'incident' };
  const descriptions = { users: 'Personer som eier hest, rir eller gjør begge deler.', horses: 'Hester og deres behov, egenskaper og stalltilhørighet.', activities: 'Planlagte og gjennomførte aktiviteter mellom hest og rytter.', qualifications: 'Erfaringer og godkjenninger knyttet til en bruker og en hest.', incidents: 'Oppfølging av hendelser og helse rundt hestene.' };
  const columns = {
    users: [['name', 'Navn'], ['role', 'Rolle'], ['location', 'Sted'], ['experienceLevel', 'Erfaringsnivå'], ['active', 'Aktiv']],
    horses: [['name', 'Navn'], ['ownerId', 'Eier'], ['age', 'Alder'], ['breed', 'Rase'], ['location', 'Sted'], ['experienceRequirement', 'Krever erfaring'], ['active', 'Aktiv']],
    activities: [['name', 'Aktivitet'], ['horseId', 'Hest'], ['userId', 'Rytter'], ['date', 'Dato'], ['activityType', 'Type'], ['status', 'Status']],
    qualifications: [['name', 'Kvalifikasjon'], ['userId', 'Bruker'], ['horseId', 'Hest'], ['qualificationType', 'Type'], ['level', 'Nivå'], ['status', 'Status']],
    incidents: [['name', 'Hendelse'], ['horseId', 'Hest'], ['date', 'Dato'], ['incidentType', 'Type'], ['severity', 'Alvorlighet'], ['status', 'Status']]
  };
  const filters = { users: [['role', 'Alle roller'], ['active', 'Alle statuser']], horses: [['breed', 'Alle raser'], ['active', 'Alle statuser']], activities: [['status', 'Alle statuser'], ['activityType', 'Alle typer']], qualifications: [['status', 'Alle statuser'], ['level', 'Alle nivåer']], incidents: [['status', 'Alle statuser'], ['severity', 'Alle alvorlighetsgrader']] };
  const detailFields = {
    users: [['role', 'Rolle'], ['location', 'Sted'], ['experienceLevel', 'Erfaringsnivå'], ['yearsOfExperience', 'År med erfaring'], ['email', 'E-post'], ['phone', 'Telefon'], ['biography', 'Biografi'], ['active', 'Aktiv']],
    horses: [['ownerId', 'Eier'], ['age', 'Alder'], ['breed', 'Rase'], ['gender', 'Kjønn'], ['height', 'Mankehøyde'], ['location', 'Sted'], ['experienceRequirement', 'Krever erfaring'], ['temperament', 'Temperament'], ['suitableActivities', 'Passer til'], ['description', 'Beskrivelse'], ['active', 'Aktiv']],
    activities: [['horseId', 'Hest'], ['userId', 'Rytter'], ['activityType', 'Type'], ['date', 'Dato'], ['startTime', 'Starttid'], ['duration', 'Varighet'], ['location', 'Sted'], ['status', 'Status'], ['notes', 'Notater']],
    qualifications: [['userId', 'Bruker'], ['horseId', 'Hest'], ['qualificationType', 'Type'], ['level', 'Nivå'], ['status', 'Status'], ['description', 'Beskrivelse'], ['validFrom', 'Gyldig fra'], ['validUntil', 'Gyldig til']],
    incidents: [['horseId', 'Hest'], ['date', 'Dato'], ['incidentType', 'Type'], ['severity', 'Alvorlighet'], ['description', 'Beskrivelse'], ['actionTaken', 'Tiltak'], ['status', 'Status']]
  };
  const state = { search: '', selectedFilters: {} };

  function renderHome() {
    const horses = data.horses.slice(0, 3);
    const nextActivity = data.activities.find((activity) => activity.status === 'Godkjent') || data.activities[0];
    app.innerHTML = `<div class="home-page">
      <section class="home-hero"><div><p class="eyebrow">Velkommen til HesteVenn</p><h1>Gode dager med hest begynner med riktig match.</h1><p class="lede">Finn en trygg hestevenn, en passende rytter eller neste aktivitet i nærheten.</p></div><div class="hero-mark" aria-hidden="true">♞<span>✦</span></div></section>
      <section class="home-section"><div class="section-heading"><p class="eyebrow">Kom i gang</p><h2>Hva passer best for deg?</h2></div><div class="choice-grid"><a class="choice-card choice-owner" href="#horses"><span class="choice-icon" aria-hidden="true">♞</span><strong>Jeg har hest</strong><p>Finn en passende rytter og fortell hva hesten din trenger.</p><span class="choice-link">Utforsk hester →</span></a><a class="choice-card choice-rider" href="#users"><span class="choice-icon" aria-hidden="true">⌁</span><strong>Jeg ønsker å ri</strong><p>Oppdag hester og aktiviteter som passer erfaringen og hverdagen din.</p><span class="choice-link">Finn din ridevenn →</span></a></div></section>
      <section class="home-section nearby-section"><div class="section-heading heading-row"><div><p class="eyebrow">Noen hester i nærheten</p><h2>Møt din neste turkamerat</h2></div><a class="text-link" href="#horses">Se alle hester →</a></div><div class="home-horse-grid">${horses.map((horse) => `<article class="home-horse-card"><div class="home-horse-art" aria-hidden="true">♞</div><div class="home-horse-content"><div class="home-horse-title"><h3>${escapeHtml(horse.name)}</h3><span>${horse.age} år</span></div><p>${escapeHtml(horse.breed)} · ${escapeHtml(horse.location)}</p><dl><div><dt>Passer for</dt><dd>${escapeHtml(horse.suitableActivities.join(' og '))}</dd></div><div><dt>Ønsket erfaring</dt><dd>${escapeHtml(horse.experienceRequirement)}</dd></div></dl><a class="button button-outline" href="#horse/${horse.id}">Se profil</a></div></article>`).join('')}</div></section>
      <section class="home-section match-strip"><div><p class="eyebrow">Et mulig treff</p><h2>Fjellglimt og Nora kan bli et fint lag</h2><p>Når behov, erfaring og hverdag passer sammen, blir det lettere å bygge tillit over tid.</p></div><div class="match-visual"><span aria-hidden="true">♞</span><strong>92%</strong><span aria-hidden="true">N</span></div><a class="button" href="#horse/HORSE-001">Se Fjellglimt</a></section>
      <section class="home-section activity-preview"><div><p class="eyebrow">Et glimt av hverdagen</p><h2>Neste aktivitet</h2><p>${escapeHtml(nextActivity.name)}</p></div><div class="activity-preview-details"><div><span>Hest</span><a href="#horse/${nextActivity.horseId}">${escapeHtml(getHorseName(nextActivity.horseId))}</a></div><div><span>Rytter</span><a href="#user/${nextActivity.userId}">${escapeHtml(getUserName(nextActivity.userId))}</a></div><div><span>Når</span><strong>${escapeHtml(nextActivity.date)} · ${escapeHtml(nextActivity.startTime)}</strong></div><div><span>Sted</span><strong>${escapeHtml(nextActivity.location)}</strong></div></div><span class="badge">${escapeHtml(nextActivity.status)}</span></section>
      <section class="home-section how-section"><div class="section-heading centered"><p class="eyebrow">Enkelt å utforske</p><h2>Slik fungerer HesteVenn</h2></div><div class="steps"><article><span class="step-number">01</span><span class="step-icon" aria-hidden="true">◎</span><h3>Opprett en profil</h3><p>Fortell om hesten din, eller del erfaringen og det du liker å gjøre i salen.</p></article><article><span class="step-number">02</span><span class="step-icon" aria-hidden="true">⌕</span><h3>Finn en passende hest eller rytter</h3><p>Utforsk profiler som passer med hverdagen, nivået og ønskene dine.</p></article><article><span class="step-number">03</span><span class="step-icon" aria-hidden="true">✦</span><h3>Avtal en aktivitet</h3><p>Finn en god ramme for første tur, økt eller møte i stallen.</p></article></div></section>
    </div>`;
  }

  function getRecordById(type, id) { return (data[type] || []).find((record) => record.id === id); }
  function getUserName(id) { const record = getRecordById('users', id); return record ? record.name : id; }
  function getHorseName(id) { const record = getRecordById('horses', id); return record ? record.name : id; }
  function objectTypeForId(id) { return Object.keys(data).find((type) => getRecordById(type, id)); }
  function escapeHtml(value) { return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character])); }
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
    if (key === 'ownerId' || key === 'userId') return lookupLink(value, 'users');
    if (key === 'horseId') return lookupLink(value, 'horses');
    if (key === 'name') return `<a class="record-link strong-link" href="#${singular[type]}/${encodeURIComponent(record.id)}">${escapeHtml(value)}</a>`;
    if (key === 'status' || key === 'severity' || key === 'role' || key === 'active') return `<span class="badge badge-${String(value).toLowerCase().replaceAll(' ', '-')}">${escapeHtml(formatValue(key, value))}</span>`;
    return escapeHtml(formatValue(key, value));
  }
  function uniqueValues(type, key) { return [...new Set(data[type].map((record) => formatValue(key, record[key])).filter(Boolean))].sort(); }
  function matchesFilters(type, record) { return Object.entries(state.selectedFilters).every(([key, value]) => !value || formatValue(key, record[key]) === value); }
  function renderObjectList(type) {
    const query = state.search.toLowerCase().trim();
    const records = data[type].filter((record) => matchesFilters(type, record) && (!query || Object.values(record).join(' ').toLowerCase().includes(query)));
    const filterMarkup = (filters[type] || []).map(([key, label]) => `<label class="filter"><span>${label}</span><select data-filter-key="${key}"><option value="">${label}</option>${uniqueValues(type, key).map((value) => `<option value="${escapeHtml(value)}" ${state.selectedFilters[key] === value ? 'selected' : ''}>${escapeHtml(value)}</option>`).join('')}</select></label>`).join('');
    const tableHead = columns[type].map(([, label]) => `<th scope="col">${label}</th>`).join('');
    const rows = records.map((record) => `<tr>${columns[type].map(([key]) => `<td>${renderCell(type, key, record[key], record)}</td>`).join('')}</tr>`).join('');
    app.innerHTML = `<section class="page-heading"><div><p class="eyebrow">Objekt · ${labels[type]}</p><h1>${labels[type]}</h1><p class="lede">${descriptions[type]}</p></div><button class="button export-button" type="button" data-export="${type}">⇩ Eksporter CSV</button></section><section class="list-panel"><div class="list-toolbar"><div><strong>${records.length} av ${data[type].length} poster</strong><span class="toolbar-note"> · lesemodus</span></div><label class="search-field"><span class="sr-only">Søk i ${labels[type]}</span><span aria-hidden="true">⌕</span><input type="search" id="record-search" placeholder="Søk i poster" value="${escapeHtml(state.search)}"></label><div class="filters">${filterMarkup}</div></div><div class="table-wrap"><table><thead><tr>${tableHead}</tr></thead><tbody>${rows}</tbody></table></div>${records.length ? '' : '<div class="empty-state"><span aria-hidden="true">⌕</span><h2>Ingen poster funnet</h2><p>Prøv et annet søk eller fjern et filter.</p></div>'}</section>`;
    bindListEvents(type);
  }
  function relatedRecords(type, key, id) { return data[type].filter((record) => record[key] === id); }
  function renderRelatedList(type, records) {
    if (!records.length) return '<div class="empty-state compact"><span aria-hidden="true">○</span><h3>Ingen relaterte poster</h3><p>Det finnes ingen registrerte poster her ennå.</p></div>';
    return `<div class="related-list">${records.map((record) => `<a class="related-item" href="#${singular[type]}/${record.id}"><span><strong>${escapeHtml(record.name)}</strong><small>${escapeHtml(record.id)}</small></span><span aria-hidden="true">→</span></a>`).join('')}</div>`;
  }
  function renderDetail(type, id, tab) {
    const record = getRecordById(type, id);
    if (!record) { app.innerHTML = '<div class="empty-state"><h1>Posten finnes ikke</h1><a class="record-link" href="#users">Til oversikten</a></div>'; return; }
    const related = type === 'horses' ? { activities: relatedRecords('activities', 'horseId', id), qualifications: relatedRecords('qualifications', 'horseId', id), incidents: relatedRecords('incidents', 'horseId', id) } : type === 'users' ? { horses: relatedRecords('horses', 'ownerId', id), activities: relatedRecords('activities', 'userId', id), qualifications: relatedRecords('qualifications', 'userId', id) } : {};
    const tabs = type === 'horses' ? [['details', 'Detaljer'], ['activities', `Aktiviteter (${related.activities.length})`], ['qualifications', `Kvalifikasjoner (${related.qualifications.length})`], ['incidents', `Hendelser (${related.incidents.length})`]] : type === 'users' ? [['details', 'Detaljer'], ['horses', `Hester (${related.horses.length})`], ['activities', `Aktiviteter (${related.activities.length})`], ['qualifications', `Kvalifikasjoner (${related.qualifications.length})`]] : [];
    const relationKey = type === 'users' ? (tab === 'horses' ? 'horses' : tab) : tab;
    const body = tabs.length && tab && tab !== 'details' ? renderRelatedList(relationKey, related[relationKey]) : `<div class="detail-grid">${detailFields[type].map(([key, label]) => `<div class="detail-field"><dt>${label}</dt><dd>${key === 'ownerId' || key === 'userId' ? lookupLink(record[key], 'users') : key === 'horseId' ? lookupLink(record[key], 'horses') : escapeHtml(formatValue(key, record[key]))}</dd></div>`).join('')}</div>`;
    app.innerHTML = `<a class="back-link" href="#${type}">← Til ${labels[type].toLowerCase()}</a><section class="record-header"><div><p class="eyebrow">${labels[type]} · ${escapeHtml(record.id)}</p><h1>${escapeHtml(record.name)}</h1><p class="record-id">${escapeHtml(record.id)}</p></div>${record.status ? `<span class="badge badge-large badge-${record.status.toLowerCase().replaceAll(' ', '-')}">${escapeHtml(record.status)}</span>` : record.active !== undefined ? `<span class="badge badge-large">${record.active ? 'Aktiv' : 'Inaktiv'}</span>` : ''}</section>${tabs.length ? `<nav class="inner-tabs" aria-label="Relaterte poster">${tabs.map(([value, label]) => `<a class="${(tab || 'details') === value ? 'is-active' : ''}" href="#${singular[type]}/${id}${value === 'details' ? '' : `/${value}`}"\>${label}</a>`).join('')}</nav>` : ''}<section class="detail-panel">${body}</section>`;
  }
  function bindListEvents(type) {
    document.querySelector('#record-search').addEventListener('input', (event) => { state.search = event.target.value; renderObjectList(type); });
    document.querySelectorAll('[data-filter-key]').forEach((select) => select.addEventListener('change', (event) => { state.selectedFilters[event.target.dataset.filterKey] = event.target.value; renderObjectList(type); }));
    document.querySelector('[data-export]').addEventListener('click', () => exportObjectToCsv(type));
  }
  function csvValue(value) { return `"${String(Array.isArray(value) ? value.join('; ') : value ?? '').replaceAll('"', '""').replace(/\r?\n/g, ' ')}"`; }
  function exportObjectToCsv(type) {
    const records = data[type];
    const keys = Object.keys(records[0]);
    const csv = `\ufeff${keys.map(csvValue).join(',')}\r\n${records.map((record) => keys.map((key) => csvValue(record[key])).join(',')).join('\r\n')}`;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    link.download = `hestevenn-${type}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }
  function navigateToRecord(type, id, tab) { if (id) renderDetail(type, id, tab); else { state.search = ''; state.selectedFilters = {}; renderObjectList(type); } updateNavigation(type); }
  function updateNavigation(type, isHome) { document.querySelectorAll('[data-object]').forEach((link) => link.classList.toggle('is-active', !isHome && link.dataset.object === type)); document.querySelector('[data-home]').classList.toggle('is-active', isHome); }
  function renderRoute() { const parts = window.location.hash.slice(1).split('/').filter(Boolean); if (!parts.length || parts[0] === 'home') { renderHome(); updateNavigation('', true); return; } const type = labels[parts[0]] ? parts[0] : Object.keys(singular).find((key) => singular[key] === parts[0]); if (type && data[type]) { navigateToRecord(type, parts[1] ? decodeURIComponent(parts[1]) : null, parts[2]); } else { window.location.hash = '#home'; } }
  document.querySelector('.menu-toggle').addEventListener('click', () => { const nav = document.querySelector('.nav-links'); const open = nav.classList.toggle('is-open'); document.querySelector('.menu-toggle').setAttribute('aria-expanded', open); });
  window.addEventListener('hashchange', renderRoute);
  renderRoute();
}());
