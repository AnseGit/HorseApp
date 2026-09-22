(function () {
  const data = window.HesteVennData;
  const app = document.querySelector('#app');
  const localStorageKeys = Object.fromEntries(Object.keys(data).map((type) => [type, `hestevenn-local-${type}`]));
  const currentUserKey = 'hestevenn-current-user-id';
  const idPrefixes = { users: 'USER', horses: 'HORSE', wishes: 'WISH', activities: 'ACTIVITY', qualifications: 'QUALIFICATION', incidents: 'INCIDENT' };
  const labels = { users: 'Brukere', horses: 'Hester', wishes: 'Ønsker', activities: 'Aktiviteter', qualifications: 'Kvalifikasjoner', incidents: 'Hendelser' };
  const singular = { users: 'user', horses: 'horse', wishes: 'wish', activities: 'activity', qualifications: 'qualification', incidents: 'incident' };
  const descriptions = { users: 'Personer som eier hest, rir eller gjør begge deler.', horses: 'Hester og deres behov, egenskaper og stalltilhørighet.', wishes: 'Rideønsker fra brukere og ønsker om ryttere for hester.', activities: 'Planlagte og gjennomførte aktiviteter mellom hest og rytter.', qualifications: 'Erfaringer og godkjenninger knyttet til en bruker og en hest.', incidents: 'Oppfølging av hendelser og helse rundt hestene.' };
  const columns = {
    users: [['name', 'Navn'], ['role', 'Rolle'], ['location', 'Sted'], ['experienceLevel', 'Erfaringsnivå'], ['active', 'Aktiv']],
    horses: [['name', 'Navn'], ['ownerId', 'Eier'], ['age', 'Alder'], ['breed', 'Rase'], ['location', 'Sted'], ['experienceRequirement', 'Krever erfaring'], ['active', 'Aktiv']],
    wishes: [['name', 'Ønske'], ['userId', 'Bruker'], ['horseId', 'Hest'], ['location', 'Sted'], ['experience', 'Erfaring'], ['ridingStyles', 'Ridestil']],
    activities: [['name', 'Aktivitet'], ['horseId', 'Hest'], ['userId', 'Rytter'], ['date', 'Dato'], ['activityType', 'Type'], ['status', 'Status']],
    qualifications: [['name', 'Kvalifikasjon'], ['userId', 'Bruker'], ['horseId', 'Hest'], ['qualificationType', 'Type'], ['level', 'Nivå'], ['status', 'Status']],
    incidents: [['name', 'Hendelse'], ['horseId', 'Hest'], ['date', 'Dato'], ['incidentType', 'Type'], ['severity', 'Alvorlighet'], ['status', 'Status']]
  };
  const filters = { users: [['role', 'Alle roller'], ['location', 'Alle steder'], ['active', 'Alle statuser']], horses: [['breed', 'Alle raser'], ['location', 'Alle steder'], ['active', 'Alle statuser']], wishes: [['location', 'Alle steder'], ['experience', 'All erfaring'], ['ridingStyles', 'Alle ridestiler']], activities: [['status', 'Alle statuser'], ['activityType', 'Alle typer']], qualifications: [['status', 'Alle statuser'], ['level', 'Alle nivåer']], incidents: [['status', 'Alle statuser'], ['severity', 'Alle alvorlighetsgrader']] };
  const detailFields = {
    users: [['role', 'Rolle'], ['location', 'Sted'], ['experienceLevel', 'Erfaringsnivå'], ['yearsOfExperience', 'År med erfaring'], ['email', 'E-post'], ['phone', 'Telefon'], ['biography', 'Biografi'], ['active', 'Aktiv']],
    horses: [['ownerId', 'Eier'], ['age', 'Alder'], ['breed', 'Rase'], ['gender', 'Kjønn'], ['height', 'Mankehøyde'], ['location', 'Sted'], ['experienceRequirement', 'Krever erfaring'], ['temperament', 'Temperament'], ['suitableActivities', 'Passer til'], ['description', 'Beskrivelse'], ['active', 'Aktiv']],
    wishes: [['userId', 'Bruker'], ['horseId', 'Hest'], ['location', 'Sted'], ['experience', 'Erfaring'], ['qualifications', 'Kvalifikasjoner'], ['ridingStyles', 'Ridestil'], ['horseSize', 'Størrelse på hest'], ['comment', 'Kommentar']],
    activities: [['horseId', 'Hest'], ['userId', 'Rytter'], ['activityType', 'Type'], ['date', 'Dato'], ['startTime', 'Starttid'], ['duration', 'Varighet'], ['location', 'Sted'], ['status', 'Status'], ['notes', 'Notater']],
    qualifications: [['userId', 'Bruker'], ['horseId', 'Hest'], ['qualificationType', 'Type'], ['level', 'Nivå'], ['status', 'Status'], ['description', 'Beskrivelse'], ['validFrom', 'Gyldig fra'], ['validUntil', 'Gyldig til']],
    incidents: [['horseId', 'Hest'], ['date', 'Dato'], ['incidentType', 'Type'], ['severity', 'Alvorlighet'], ['description', 'Beskrivelse'], ['actionTaken', 'Tiltak'], ['status', 'Status']]
  };
  const state = { search: '', selectedFilters: {} };
  const createLabels = { users: 'profil', horses: 'hest', wishes: 'ønske', activities: 'aktivitet', qualifications: 'kvalifikasjon', incidents: 'hendelse' };
  const createFields = {
    users: [
      { key: 'name', label: 'Navn', required: true, autocomplete: 'name' }, { key: 'role', label: 'Rolle', type: 'select', required: true, options: ['Rytter', 'Hesteeier', 'Begge'] },
      { key: 'location', label: 'Sted', required: true }, { key: 'experienceLevel', label: 'Erfaringsnivå', type: 'select', required: true, options: ['Nybegynner', 'Øvet', 'Erfaren'] },
      { key: 'yearsOfExperience', label: 'År med erfaring', type: 'number', required: true, min: 0, max: 80, value: 0 }, { key: 'email', label: 'E-post', type: 'email' },
      { key: 'phone', label: 'Telefon', type: 'tel' }, { key: 'biography', label: 'Biografi', type: 'textarea', wide: true }
    ],
    horses: [
      { key: 'name', label: 'Navn', required: true }, { key: 'ownerId', label: 'Eier', type: 'reference', source: 'users', required: true },
      { key: 'age', label: 'Alder', type: 'number', min: 0, max: 50, required: true }, { key: 'breed', label: 'Rase', required: true },
      { key: 'gender', label: 'Kjønn', type: 'select', required: true, options: ['Hoppe', 'Vallak', 'Hingst'] }, { key: 'height', label: 'Mankehøyde', placeholder: 'For eksempel 150 cm' },
      { key: 'location', label: 'Sted', required: true }, { key: 'experienceRequirement', label: 'Krever erfaring', type: 'select', required: true, options: ['Alle nivåer', 'Trygg nybegynner', 'Øvet rytter', 'Erfaren rytter'] },
      { key: 'temperament', label: 'Temperament' }, { key: 'suitableActivities', label: 'Passer til', array: true, placeholder: 'Tur, Dressur, Sprang' },
      { key: 'description', label: 'Beskrivelse', type: 'textarea', wide: true }
    ],
    wishes: [
      { key: 'name', label: 'Navn på ønsket', required: true }, { key: 'userId', label: 'Bruker', type: 'reference', source: 'users' },
      { key: 'horseId', label: 'Hest', type: 'reference', source: 'horses' }, { key: 'location', label: 'Sted', required: true },
      { key: 'experience', label: 'Erfaring', type: 'select', required: true, options: ['Nybegynner', 'Øvet', 'Erfaren'] },
      { key: 'qualifications', label: 'Kvalifikasjoner', array: true }, { key: 'ridingStyles', label: 'Ridestil', array: true, required: true, placeholder: 'Tur, Dressur, Sprang' },
      { key: 'horseSize', label: 'Størrelse på hest' }, { key: 'comment', label: 'Kommentar', type: 'textarea', wide: true }
    ],
    activities: [
      { key: 'name', label: 'Aktivitet', required: true }, { key: 'horseId', label: 'Hest', type: 'reference', source: 'horses', required: true },
      { key: 'userId', label: 'Rytter', type: 'reference', source: 'users', required: true }, { key: 'activityType', label: 'Type', required: true },
      { key: 'date', label: 'Dato', type: 'date', required: true }, { key: 'startTime', label: 'Starttid', type: 'time', required: true },
      { key: 'duration', label: 'Varighet', placeholder: 'For eksempel 60 min' }, { key: 'location', label: 'Sted', required: true },
      { key: 'status', label: 'Status', type: 'select', required: true, options: ['Planlagt', 'Godkjent', 'Gjennomført', 'Avlyst'] }, { key: 'notes', label: 'Notater', type: 'textarea', wide: true }
    ],
    qualifications: [
      { key: 'name', label: 'Kvalifikasjon', required: true }, { key: 'userId', label: 'Bruker', type: 'reference', source: 'users', required: true },
      { key: 'horseId', label: 'Hest', type: 'reference', source: 'horses', required: true }, { key: 'qualificationType', label: 'Type', required: true },
      { key: 'level', label: 'Nivå', required: true }, { key: 'status', label: 'Status', type: 'select', required: true, options: ['Foreslått', 'Godkjent', 'Utløpt'] },
      { key: 'validFrom', label: 'Gyldig fra', type: 'date' }, { key: 'validUntil', label: 'Gyldig til', type: 'date' }, { key: 'description', label: 'Beskrivelse', type: 'textarea', wide: true }
    ],
    incidents: [
      { key: 'name', label: 'Hendelse', required: true }, { key: 'horseId', label: 'Hest', type: 'reference', source: 'horses', required: true },
      { key: 'date', label: 'Dato', type: 'date', required: true }, { key: 'incidentType', label: 'Type', required: true },
      { key: 'severity', label: 'Alvorlighet', type: 'select', required: true, options: ['Lav', 'Middels', 'Høy'] },
      { key: 'status', label: 'Status', type: 'select', required: true, options: ['Åpen', 'Under oppfølging', 'Lukket'] },
      { key: 'description', label: 'Beskrivelse', type: 'textarea', wide: true }, { key: 'actionTaken', label: 'Tiltak', type: 'textarea', wide: true }
    ]
  };

  function loadLocalRecords() {
    Object.keys(localStorageKeys).forEach((type) => {
      try {
        const records = JSON.parse(localStorage.getItem(localStorageKeys[type]) || '[]');
        if (Array.isArray(records)) data[type].push(...records.filter((record) => record && record.id && record.name));
      } catch (error) {
        console.warn(`Kunne ikke laste lokale ${labels[type].toLowerCase()}.`, error);
      }
    });
  }

  function saveLocalRecord(type, record) {
    const prefix = `${idPrefixes[type]}-LOCAL-`;
    const localRecords = data[type].filter((item) => item.id.startsWith(prefix));
    localStorage.setItem(localStorageKeys[type], JSON.stringify([...localRecords, record]));
    data[type].push(record);
  }

  function getCurrentUser() {
    const user = getRecordById('users', localStorage.getItem(currentUserKey));
    if (!user) localStorage.removeItem(currentUserKey);
    return user;
  }

  function updateAuthAction() {
    const user = getCurrentUser();
    const action = document.querySelector('[data-auth-action]');
    action.textContent = user ? `Logg ut (${user.name})` : 'Logg inn';
    action.href = user ? '#logout' : '#login';
  }

  function renderHome() {
    const currentUser = getCurrentUser();
    const horses = data.horses.slice(0, 3);
    const nextActivity = data.activities.find((activity) => activity.status === 'Godkjent') || data.activities[0];
    const locationFilter = currentUser ? `/filter/location/${encodeURIComponent(currentUser.location)}` : '';
    const personalIntro = currentUser ? `<section class="my-profile"><div><p class="eyebrow">Min Side</p><h1>Hei, ${escapeHtml(currentUser.name)}</h1><p>${escapeHtml(currentUser.role)} · ${escapeHtml(currentUser.location)} · ${escapeHtml(currentUser.experienceLevel)}</p></div><a class="button button-secondary" href="#user/${encodeURIComponent(currentUser.id)}">Se profilen min</a></section>` : `<section class="my-profile logged-out"><div><p class="eyebrow">Min Side</p><h1>Finn gode matcher nær deg</h1><p>Logg inn for å bruke stedet og preferansene fra profilen din.</p></div><a class="button" href="#login">Logg inn</a></section>`;
    app.innerHTML = `<div class="home-page">
      ${personalIntro}
      <section class="home-hero"><div><p class="eyebrow">Velkommen til HesteVenn</p><h1>Gode dager med hest begynner med riktig match.</h1><p class="lede">Finn en trygg hestevenn, en passende rytter eller neste aktivitet i nærheten.</p></div><div class="hero-mark" aria-hidden="true">♞<span>✦</span></div></section>
      <section class="home-section"><div class="section-heading"><p class="eyebrow">Kom i gang</p><h2>Hva passer best for deg?</h2></div><div class="choice-grid"><a class="choice-card choice-owner" href="#users${locationFilter}${currentUser ? '/audience/riders' : ''}"><span class="choice-icon" aria-hidden="true">♞</span><strong>Jeg har hest</strong><p>Finn en passende rytter${currentUser ? ` i ${escapeHtml(currentUser.location)}` : ''} og fortell hva hesten din trenger.</p><span class="choice-link">Finn en rytter →</span></a><a class="choice-card choice-rider" href="#horses${locationFilter}"><span class="choice-icon" aria-hidden="true">⌁</span><strong>Jeg ønsker å ri</strong><p>Oppdag hester${currentUser ? ` i ${escapeHtml(currentUser.location)}` : ''} som passer erfaringen og hverdagen din.</p><span class="choice-link">Utforsk hester →</span></a></div></section>
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
    if (key === 'ownerId' || key === 'userId') return value ? lookupLink(value, 'users') : '—';
    if (key === 'horseId') return value ? lookupLink(value, 'horses') : '—';
    if (key === 'name') return `<a class="record-link strong-link" href="#${singular[type]}/${encodeURIComponent(record.id)}">${escapeHtml(value)}</a>`;
    if (key === 'status' || key === 'severity' || key === 'role' || key === 'active') return `<span class="badge badge-${String(value).toLowerCase().replaceAll(' ', '-')}">${escapeHtml(formatValue(key, value))}</span>`;
    return escapeHtml(formatValue(key, value));
  }
  function uniqueValues(type, key) { return [...new Set(data[type].flatMap((record) => Array.isArray(record[key]) ? record[key] : formatValue(key, record[key])).filter(Boolean))].sort(); }
  function matchesFilters(type, record) { return Object.entries(state.selectedFilters).every(([key, value]) => !value || (key === 'audience' && value === 'riders' ? ['Rytter', 'Begge'].includes(record.role) : Array.isArray(record[key]) ? record[key].includes(value) : formatValue(key, record[key]) === value)); }
  function renderObjectList(type) {
    const query = state.search.toLowerCase().trim();
    const records = data[type].filter((record) => matchesFilters(type, record) && (!query || Object.values(record).join(' ').toLowerCase().includes(query)));
    const filterMarkup = (filters[type] || []).map(([key, label]) => `<label class="filter"><span>${label}</span><select data-filter-key="${key}"><option value="">${label}</option>${uniqueValues(type, key).map((value) => `<option value="${escapeHtml(value)}" ${state.selectedFilters[key] === value ? 'selected' : ''}>${escapeHtml(value)}</option>`).join('')}</select></label>`).join('');
    const tableHead = columns[type].map(([, label]) => `<th scope="col">${label}</th>`).join('');
    const rows = records.map((record) => `<tr>${columns[type].map(([key]) => `<td>${renderCell(type, key, record[key], record)}</td>`).join('')}</tr>`).join('');
    const createAction = `<a class="button" href="#new-${singular[type]}">+ Opprett ${createLabels[type]}</a>`;
    app.innerHTML = `<section class="page-heading"><div><p class="eyebrow">Objekt · ${labels[type]}</p><h1>${labels[type]}</h1><p class="lede">${descriptions[type]}</p></div><div class="page-actions">${createAction}<button class="button export-button" type="button" data-export="${type}">⇩ Eksporter CSV</button></div></section><section class="list-panel"><div class="list-toolbar"><div><strong>${records.length} av ${data[type].length} poster</strong><span class="toolbar-note"> · lokale data</span></div><label class="search-field"><span class="sr-only">Søk i ${labels[type]}</span><span aria-hidden="true">⌕</span><input type="search" id="record-search" placeholder="Søk i poster" value="${escapeHtml(state.search)}"></label><div class="filters">${filterMarkup}</div></div><div class="table-wrap"><table><thead><tr>${tableHead}</tr></thead><tbody>${rows}</tbody></table></div>${records.length ? '' : '<div class="empty-state"><span aria-hidden="true">⌕</span><h2>Ingen poster funnet</h2><p>Prøv et annet søk eller fjern et filter.</p></div>'}</section>`;
    bindListEvents(type);
  }
  function renderLogin() {
    const currentUser = getCurrentUser();
    app.innerHTML = `<a class="back-link" href="#home">← Til Min Side</a><section class="page-heading"><div><p class="eyebrow">Lokal innlogging</p><h1>Logg inn</h1><p class="lede">Velg en bruker. Passord er ikke nødvendig i denne prototypen.</p></div></section><form class="profile-form detail-panel" id="login-form"><div class="form-grid"><label class="form-wide"><span>Bruker</span><select name="userId" required><option value="">Velg bruker</option>${data.users.filter((user) => user.active).map((user) => `<option value="${escapeHtml(user.id)}" ${currentUser && currentUser.id === user.id ? 'selected' : ''}>${escapeHtml(user.name)} · ${escapeHtml(user.location)}</option>`).join('')}</select></label></div><div class="form-actions"><a class="button button-secondary" href="#home">Avbryt</a><button class="button" type="submit">Logg inn</button></div></form>`;
    document.querySelector('#login-form').addEventListener('submit', (event) => {
      event.preventDefault();
      localStorage.setItem(currentUserKey, new FormData(event.currentTarget).get('userId'));
      updateAuthAction();
      window.location.hash = '#home';
    });
    updateNavigation('', true);
  }
  function relationPresets(type, contextType, contextId) {
    if (!contextType || !contextId) return {};
    if (contextType === 'users') return type === 'horses' ? { ownerId: contextId } : type === 'wishes' ? { userId: contextId, horseId: '' } : { userId: contextId };
    if (contextType === 'horses') return type === 'wishes' ? { horseId: contextId, userId: '' } : { horseId: contextId };
    return {};
  }
  function renderCreateField(field, presets) {
    const attributes = `${field.required ? ' required' : ''}${field.min !== undefined ? ` min="${field.min}"` : ''}${field.max !== undefined ? ` max="${field.max}"` : ''}${field.value !== undefined ? ` value="${field.value}"` : ''}${field.autocomplete ? ` autocomplete="${field.autocomplete}"` : ''}${field.placeholder ? ` placeholder="${escapeHtml(field.placeholder)}"` : ''}`;
    const hasPreset = Object.prototype.hasOwnProperty.call(presets, field.key);
    let control;
    if (field.type === 'select') control = `<select name="${field.key}"${attributes}>${field.options.map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`).join('')}</select>`;
    else if (field.type === 'reference') {
      const options = `<option value="">Velg ${field.label.toLowerCase()}</option>${data[field.source].map((record) => `<option value="${escapeHtml(record.id)}" ${hasPreset && presets[field.key] === record.id ? 'selected' : ''}>${escapeHtml(record.name)}</option>`).join('')}`;
      control = hasPreset ? `<select disabled>${options}</select><input type="hidden" name="${field.key}" value="${escapeHtml(presets[field.key])}">` : `<select name="${field.key}"${attributes}>${options}</select>`;
    }
    else if (field.type === 'textarea') control = `<textarea name="${field.key}" rows="5"${attributes}></textarea>`;
    else control = `<input name="${field.key}" type="${field.type || 'text'}"${attributes}>`;
    return `<label class="${field.wide ? 'form-wide' : ''}"><span>${field.label}</span>${control}</label>`;
  }
  function renderCreateForm(type, contextType, contextId, returnTab) {
    const fields = createFields[type];
    const presets = relationPresets(type, contextType, contextId);
    const contextRecord = contextType ? getRecordById(contextType, contextId) : null;
    const returnUrl = contextRecord ? `#${singular[contextType]}/${contextId}/${returnTab}` : `#${type}`;
    const contextText = contextRecord ? ` Relasjonen til ${contextRecord.name} legges til automatisk.` : '';
    app.innerHTML = `<a class="back-link" href="${returnUrl}">← Tilbake</a><section class="page-heading"><div><p class="eyebrow">Ny post</p><h1>Opprett ${createLabels[type]}</h1><p class="lede">Posten lagres lokalt i denne nettleseren.${escapeHtml(contextText)}</p></div></section><form class="profile-form detail-panel" id="create-form"><div class="form-grid">${fields.map((field) => renderCreateField(field, presets)).join('')}</div><div class="form-actions"><a class="button button-secondary" href="${returnUrl}">Avbryt</a><button class="button" type="submit">Lagre ${createLabels[type]}</button></div><p class="form-error" role="alert" hidden></p></form>`;
    document.querySelector('#create-form').addEventListener('submit', (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const values = Object.fromEntries(new FormData(form));
      fields.filter((field) => field.array).forEach((field) => { values[field.key] = values[field.key].split(',').map((value) => value.trim()).filter(Boolean); });
      fields.filter((field) => field.type === 'number').forEach((field) => { values[field.key] = Number(values[field.key]); });
      Object.keys(values).forEach((key) => { if (typeof values[key] === 'string') values[key] = values[key].trim(); });
      const record = { id: `${idPrefixes[type]}-LOCAL-${Date.now()}`, ...values };
      if (type === 'users' || type === 'horses') record.active = true;
      const message = form.querySelector('.form-error');
      if (type === 'wishes' && Boolean(record.userId) === Boolean(record.horseId)) {
        message.textContent = 'Velg enten én bruker eller én hest for ønsket.';
        message.hidden = false;
        return;
      }
      try {
        saveLocalRecord(type, record);
        window.location.hash = contextRecord ? returnUrl : `#${singular[type]}/${record.id}`;
      } catch (error) {
        message.textContent = 'Posten kunne ikke lagres lokalt i denne nettleseren.';
        message.hidden = false;
      }
    });
    updateNavigation(type);
  }
  function relatedRecords(type, key, id) { return data[type].filter((record) => record[key] === id); }
  function renderRelatedList(type, records) {
    if (!records.length) return '<div class="empty-state compact"><span aria-hidden="true">○</span><h3>Ingen relaterte poster</h3><p>Det finnes ingen registrerte poster her ennå.</p></div>';
    return `<div class="related-list">${records.map((record) => `<a class="related-item" href="#${singular[type]}/${record.id}"><span><strong>${escapeHtml(record.name)}</strong><small>${escapeHtml(record.id)}</small></span><span aria-hidden="true">→</span></a>`).join('')}</div>`;
  }
  function renderDetailValue(key, value) {
    if (key === 'ownerId' || key === 'userId') return value ? lookupLink(value, 'users') : '—';
    if (key === 'horseId') return value ? lookupLink(value, 'horses') : '—';
    return escapeHtml(formatValue(key, value));
  }
  function renderDetail(type, id, tab) {
    const record = getRecordById(type, id);
    if (!record) { app.innerHTML = '<div class="empty-state"><h1>Posten finnes ikke</h1><a class="record-link" href="#users">Til oversikten</a></div>'; return; }
    const related = type === 'horses' ? { wishes: relatedRecords('wishes', 'horseId', id), activities: relatedRecords('activities', 'horseId', id), qualifications: relatedRecords('qualifications', 'horseId', id), incidents: relatedRecords('incidents', 'horseId', id) } : type === 'users' ? { horses: relatedRecords('horses', 'ownerId', id), wishes: relatedRecords('wishes', 'userId', id), activities: relatedRecords('activities', 'userId', id), qualifications: relatedRecords('qualifications', 'userId', id) } : {};
    const tabs = type === 'horses' ? [['details', 'Detaljer'], ['wishes', `Ønsker (${related.wishes.length})`], ['activities', `Aktiviteter (${related.activities.length})`], ['qualifications', `Kvalifikasjoner (${related.qualifications.length})`], ['incidents', `Hendelser (${related.incidents.length})`]] : type === 'users' ? [['details', 'Detaljer'], ['wishes', `Ønsker (${related.wishes.length})`], ['horses', `Hester (${related.horses.length})`], ['activities', `Aktiviteter (${related.activities.length})`], ['qualifications', `Kvalifikasjoner (${related.qualifications.length})`]] : [];
    const relationKey = type === 'users' ? (tab === 'horses' ? 'horses' : tab) : tab;
    const createRelated = tabs.length && tab && tab !== 'details' ? `<div class="related-toolbar"><div><strong>${labels[relationKey]}</strong><span>${related[relationKey].length} poster relatert til ${escapeHtml(record.name)}</span></div><a class="button" href="#new-${singular[relationKey]}/${singular[type]}/${encodeURIComponent(id)}/${tab}">+ Opprett ${createLabels[relationKey]}</a></div>` : '';
    const body = tabs.length && tab && tab !== 'details' ? `${createRelated}${renderRelatedList(relationKey, related[relationKey])}` : `<div class="detail-grid">${detailFields[type].map(([key, label]) => `<div class="detail-field"><dt>${label}</dt><dd>${renderDetailValue(key, record[key])}</dd></div>`).join('')}</div>`;
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
  function navigateToRecord(type, id, tab, routeParts = []) { if (id) renderDetail(type, id, tab); else { state.search = ''; state.selectedFilters = {}; if (routeParts[0] === 'filter') { for (let index = 1; index < routeParts.length; index += 2) state.selectedFilters[routeParts[index]] = decodeURIComponent(routeParts[index + 1] || ''); } renderObjectList(type); } updateNavigation(type); }
  function updateNavigation(type, isHome) { document.querySelectorAll('[data-object]').forEach((link) => link.classList.toggle('is-active', !isHome && link.dataset.object === type)); document.querySelector('[data-home]').classList.toggle('is-active', isHome); }
  function renderRoute() { const parts = window.location.hash.slice(1).split('/').filter(Boolean); updateAuthAction(); if (!parts.length || parts[0] === 'home') { renderHome(); updateNavigation('', true); return; } if (parts[0] === 'login') { renderLogin(); return; } if (parts[0] === 'logout') { localStorage.removeItem(currentUserKey); updateAuthAction(); window.location.hash = '#home'; return; } if (parts[0].startsWith('new-')) { const createType = Object.keys(singular).find((key) => singular[key] === parts[0].slice(4)); const contextType = Object.keys(singular).find((key) => singular[key] === parts[1]); if (createType) { renderCreateForm(createType, contextType, parts[2] ? decodeURIComponent(parts[2]) : null, parts[3]); return; } } const type = labels[parts[0]] ? parts[0] : Object.keys(singular).find((key) => singular[key] === parts[0]); if (type && data[type]) { const isFilterRoute = parts[1] === 'filter'; navigateToRecord(type, isFilterRoute ? null : (parts[1] ? decodeURIComponent(parts[1]) : null), isFilterRoute ? null : parts[2], isFilterRoute ? parts.slice(1) : []); } else { window.location.hash = '#home'; } }
  document.querySelector('.menu-toggle').addEventListener('click', () => { const nav = document.querySelector('.nav-links'); const open = nav.classList.toggle('is-open'); document.querySelector('.menu-toggle').setAttribute('aria-expanded', open); });
  window.addEventListener('hashchange', renderRoute);
  loadLocalRecords();
  updateAuthAction();
  renderRoute();
}());
