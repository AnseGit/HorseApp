(function () {
  const data = window.HesteVennData;
  const app = document.querySelector('#app');
  const localStorageKeys = Object.fromEntries(Object.keys(data).map((type) => [type, `hestevenn-local-${type}`]));
  const currentUserKey = 'hestevenn-current-user-id';
  const profileImagesKey = 'hestevenn-profile-images';
  const eventAttendanceKey = 'hestevenn-event-attendance';
  const notificationKey = 'hestevenn-notifications';
  const idPrefixes = { users: 'USER', horses: 'HORSE', wishes: 'WISH', requests: 'REQUEST', events: 'EVENT', activities: 'ACTIVITY', qualifications: 'QUALIFICATION', incidents: 'INCIDENT' };
  const labels = { users: 'Ryttere', horses: 'Hester', wishes: 'Ønsker', requests: 'Forespørsler', events: 'Arrangementer', activities: 'Aktiviteter', qualifications: 'Kvalifikasjoner', incidents: 'Hendelser' };
  const singular = { users: 'user', horses: 'horse', wishes: 'wish', requests: 'request', events: 'event', activities: 'activity', qualifications: 'qualification', incidents: 'incident' };
  const descriptions = { users: 'Personer som eier hest, rir eller gjør begge deler.', horses: 'Hester og deres behov, egenskaper og stalltilhørighet.', wishes: 'Rideønsker fra Ryttere og ønsker om ryttere for hester.', requests: 'Forespørsler fra ryttere om å låne en hest på et bestemt tidspunkt.', events: 'Hestearrangementer som Ryttere kan opprette og delta på.', activities: 'Planlagte og gjennomførte aktiviteter mellom hest og rytter.', qualifications: 'Erfaringer og godkjenninger knyttet til en bruker og en hest.', incidents: 'Oppfølging av hendelser og helse rundt hestene.' };
  const columns = {
    users: [['name', 'Navn'], ['role', 'Rolle'], ['location', 'By'], ['experienceLevel', 'Erfaringsnivå'], ['active', 'Aktiv']],
    horses: [['name', 'Navn'], ['ownerId', 'Eier'], ['age', 'Alder'], ['breed', 'Rase'], ['location', 'By'], ['experienceRequirement', 'Krever erfaring'], ['active', 'Aktiv']],
    wishes: [['name', 'Ønske'], ['userId', 'Bruker'], ['horseId', 'Hest'], ['location', 'By'], ['ønsketype', 'Ønsketype'], ['aktivitetstype', 'Aktivitetstype'], ['status', 'Status']],
    requests: [['name', 'Forespørsel'], ['wishId', 'Ønske'], ['sender', 'Sender'], ['mottaker', 'Mottaker'], ['horseId', 'Hest'], ['date', 'Dato'], ['startTime', 'Tid'], ['durationHours', 'Varighet'], ['activityType', 'Aktivitet'], ['status', 'Status']],
    events: [['name', 'Navn'], ['location', 'By'], ['date', 'Dato'], ['startTime', 'Tidspunkt'], ['qualifications', 'Kvalifikasjoner']],
    activities: [['name', 'Aktivitet'], ['horseId', 'Hest'], ['userId', 'Rytter'], ['date', 'Dato'], ['activityType', 'Type'], ['status', 'Status']],
    qualifications: [['name', 'Kvalifikasjon'], ['userId', 'Bruker'], ['horseId', 'Hest'], ['qualificationType', 'Type'], ['level', 'Nivå'], ['status', 'Status']],
    incidents: [['name', 'Hendelse'], ['horseId', 'Hest'], ['date', 'Dato'], ['incidentType', 'Type'], ['severity', 'Alvorlighet'], ['status', 'Status']]
  };
  const filters = { users: [['role', 'Alle roller'], ['location', 'Alle steder'], ['active', 'Alle statuser']], horses: [['breed', 'Alle raser'], ['location', 'Alle steder'], ['active', 'Alle statuser']], wishes: [['location', 'Alle steder'], ['ønsketype', 'Alle ønsketyper'], ['status', 'Alle statuser']], requests: [['status', 'Alle statuser'], ['activityType', 'Alle aktiviteter']], events: [['location', 'Alle steder'], ['qualifications', 'Alle kvalifikasjoner']], activities: [['status', 'Alle statuser'], ['activityType', 'Alle typer']], qualifications: [['status', 'Alle statuser'], ['level', 'Alle nivåer']], incidents: [['status', 'Alle statuser'], ['severity', 'Alle alvorlighetsgrader']] };
  const detailFields = {
    users: [['role', 'Rolle'], ['location', 'By'], ['experienceLevel', 'Erfaringsnivå'], ['yearsOfExperience', 'År med erfaring'], ['email', 'E-post'], ['phone', 'Telefon'], ['biography', 'Biografi'], ['active', 'Aktiv']],
    horses: [['ownerId', 'Eier'], ['age', 'Alder'], ['breed', 'Rase'], ['gender', 'Kjønn'], ['height', 'Mankehøyde'], ['location', 'By'], ['experienceRequirement', 'Krever erfaring'], ['temperament', 'Temperament'], ['suitableActivities', 'Passer til'], ['description', 'Beskrivelse'], ['active', 'Aktiv']],
    wishes: [['userId', 'Bruker'], ['horseId', 'Hest'], ['location', 'By'], ['størrelsePåHest', 'Størrelse på hest'], ['erfaring', 'Erfaring'], ['ønsketype', 'Ønsketype'], ['aktivitetstype', 'Aktivitetstype'], ['ridestil', 'Ridestil'], ['status', 'Status'], ['qualifications', 'Kvalifikasjoner'], ['comment', 'Kommentar']],
    requests: [['wishId', 'Ønske'], ['sender', 'Sender'], ['mottaker', 'Mottaker'], ['horseId', 'Hest'], ['date', 'Dato'], ['startTime', 'Tidspunkt'], ['durationHours', 'Varighet (timer)'], ['activityType', 'Type aktivitet'], ['status', 'Forespørsel status'], ['comment', 'Kommentar']],
    events: [['organizerId', 'Arrangør'], ['location', 'By'], ['date', 'Dato'], ['startTime', 'Tidspunkt'], ['qualifications', 'Kvalifikasjoner'], ['description', 'Beskrivelse'], ['participantIds', 'Deltakere']],
    activities: [['horseId', 'Hest'], ['userId', 'Rytter'], ['activityType', 'Type'], ['date', 'Dato'], ['startTime', 'Starttid'], ['duration', 'Varighet'], ['location', 'By'], ['status', 'Status'], ['notes', 'Notater']],
    qualifications: [['userId', 'Bruker'], ['horseId', 'Hest'], ['qualificationType', 'Type'], ['level', 'Nivå'], ['status', 'Status'], ['description', 'Beskrivelse'], ['validFrom', 'Gyldig fra'], ['validUntil', 'Gyldig til']],
    incidents: [['horseId', 'Hest'], ['date', 'Dato'], ['incidentType', 'Type'], ['severity', 'Alvorlighet'], ['description', 'Beskrivelse'], ['actionTaken', 'Tiltak'], ['status', 'Status']]
  };
  const state = { search: '', selectedFilters: {}, wishFlow: {} };
  const createLabels = { users: 'profil', horses: 'hest', wishes: 'ønske', requests: 'forespørsel', events: 'arrangement', activities: 'aktivitet', qualifications: 'kvalifikasjon', incidents: 'hendelse' };
  const createFields = {
    users: [
      { key: 'image', label: 'Profilbilde', type: 'image', wide: true },
      { key: 'name', label: 'Navn', required: true, autocomplete: 'name' }, { key: 'role', label: 'Rolle', type: 'select', required: true, options: ['Rytter', 'Hesteeier', 'Begge'] },
      { key: 'location', label: 'By', required: true }, { key: 'experienceLevel', label: 'Erfaringsnivå', type: 'select', required: true, options: ['Nybegynner', 'Øvet', 'Erfaren'] },
      { key: 'yearsOfExperience', label: 'År med erfaring', type: 'number', required: true, min: 0, max: 80, value: 0 }, { key: 'email', label: 'E-post', type: 'email' },
      { key: 'phone', label: 'Telefon', type: 'tel' }, { key: 'biography', label: 'Biografi', type: 'textarea', wide: true }
    ],
    horses: [
      { key: 'image', label: 'Bilde av hesten', type: 'image', wide: true },
      { key: 'name', label: 'Navn', required: true }, { key: 'ownerId', label: 'Eier', type: 'reference', source: 'users', required: true },
      { key: 'age', label: 'Alder', type: 'number', min: 0, max: 50, required: true }, { key: 'breed', label: 'Rase', required: true },
      { key: 'gender', label: 'Kjønn', type: 'select', required: true, options: ['Hoppe', 'Vallak', 'Hingst'] }, { key: 'height', label: 'Mankehøyde', placeholder: 'For eksempel 150 cm' },
      { key: 'location', label: 'By', required: true }, { key: 'experienceRequirement', label: 'Krever erfaring', type: 'select', required: true, options: ['Alle nivåer', 'Trygg nybegynner', 'Øvet rytter', 'Erfaren rytter'] },
      { key: 'temperament', label: 'Temperament' }, { key: 'suitableActivities', label: 'Passer til', array: true, placeholder: 'Tur, Dressur, Sprang' },
      { key: 'description', label: 'Beskrivelse', type: 'textarea', wide: true }
    ],
    wishes: [
      { key: 'name', label: 'Navn på ønsket', required: true }, { key: 'userId', label: 'Bruker', type: 'reference', source: 'users' },
      { key: 'horseId', label: 'Hest', type: 'reference', source: 'horses' }, { key: 'location', label: 'By', required: true },
      { key: 'størrelsePåHest', label: 'Størrelse på hest', type: 'select', required: true, options: ['Liten', 'Mellom', 'Stor'] },
      { key: 'erfaring', label: 'Erfaring', type: 'select', required: true, options: ['Nybegynner', 'Lett øvet', 'Erfaren', 'Profesjonell'] },
      { key: 'ønsketype', label: 'Ønsketype', type: 'select', required: true, options: ['Ønsker en rytter', 'Ønsker å Ri'] },
      { key: 'aktivitetstype', label: 'Aktivitetstype', type: 'select', required: true, options: ['Engangstilfelle', 'Månedlig', 'Ukentlig', 'Daglig', 'Periode'] },
      { key: 'ridestil', label: 'Ridestil', type: 'select', required: true, options: ['Tur', 'Dressur', 'Sprang', 'Fôr'] },
      { key: 'status', label: 'Status', type: 'select', required: true, options: ['Aktiv', 'Matchet', 'Avsluttet', 'Pause'] },
      { key: 'qualifications', label: 'Kvalifikasjoner', array: true }, { key: 'comment', label: 'Kommentar', type: 'textarea', wide: true }
    ],
    requests: [
      { key: 'wishId', label: 'Ønske', type: 'reference', source: 'wishes', required: true },
      { key: 'sender', label: 'Sender', type: 'reference', source: 'users', required: true },
      { key: 'mottaker', label: 'Mottaker', type: 'reference', source: 'users', required: true },
      { key: 'horseId', label: 'Hest', type: 'reference', source: 'horses', required: true },
      { key: 'date', label: 'Dato', type: 'date', required: true }, { key: 'startTime', label: 'Tidspunkt', type: 'time', required: true },
      { key: 'durationHours', label: 'Varighet (timer)', type: 'number', min: 0.5, max: 12, step: 0.5, value: 1, required: true },
      { key: 'activityType', label: 'Type aktivitet', type: 'select', required: true, options: ['Sprang', 'Dressur', 'Tur', 'Fôr'] },
      { key: 'status', label: 'Forespørsel status', type: 'select', required: true, options: ['Under behandling', 'Godkjent', 'Avslått'] },
      { key: 'comment', label: 'Kommentar', type: 'textarea', wide: true }
    ],
    events: [
      { key: 'name', label: 'Navn', required: true }, { key: 'organizerId', label: 'Arrangør', type: 'reference', source: 'users', required: true },
      { key: 'location', label: 'By', required: true }, { key: 'date', label: 'Dato', type: 'date', required: true },
      { key: 'startTime', label: 'Tidspunkt', type: 'time', required: true },
      { key: 'qualifications', label: 'Kvalifikasjoner', array: true, placeholder: 'For eksempel Trygg på tur, Øvet rytter' },
      { key: 'description', label: 'Beskrivelse', type: 'textarea', wide: true }
    ],
    activities: [
      { key: 'name', label: 'Aktivitet', required: true }, { key: 'horseId', label: 'Hest', type: 'reference', source: 'horses', required: true },
      { key: 'userId', label: 'Rytter', type: 'reference', source: 'users', required: true }, { key: 'activityType', label: 'Type', required: true },
      { key: 'date', label: 'Dato', type: 'date', required: true }, { key: 'startTime', label: 'Starttid', type: 'time', required: true },
      { key: 'duration', label: 'Varighet', placeholder: 'For eksempel 60 min' }, { key: 'location', label: 'By', required: true },
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

  function getProfileImages() {
    try { return JSON.parse(localStorage.getItem(profileImagesKey) || '{}'); }
    catch (error) { return {}; }
  }

  function getProfileImage(record) {
    return getProfileImages()[record.id] || record.imageUrl || '';
  }

  function saveProfileImage(id, imageData) {
    const images = getProfileImages();
    images[id] = imageData;
    localStorage.setItem(profileImagesKey, JSON.stringify(images));
  }

  function getEventParticipants(record) {
    let attendance = {};
    try { attendance = JSON.parse(localStorage.getItem(eventAttendanceKey) || '{}'); } catch (error) { attendance = {}; }
    return attendance[record.id] || record.participantIds || [];
  }

  function toggleEventParticipant(eventId, userId) {
    let attendance = {};
    try { attendance = JSON.parse(localStorage.getItem(eventAttendanceKey) || '{}'); } catch (error) { attendance = {}; }
    const record = getRecordById('events', eventId);
    const participants = new Set(attendance[eventId] || record.participantIds || []);
    if (participants.has(userId)) participants.delete(userId); else participants.add(userId);
    attendance[eventId] = [...participants];
    localStorage.setItem(eventAttendanceKey, JSON.stringify(attendance));
  }

  function compressImage(file) {
    return new Promise((resolve, reject) => {
      if (!file || !file.size) { resolve(''); return; }
      if (!file.type.startsWith('image/')) { reject(new Error('Velg en gyldig bildefil.')); return; }
      if (file.size > 10 * 1024 * 1024) { reject(new Error('Bildet kan ikke være større enn 10 MB.')); return; }
      const image = new Image();
      const objectUrl = URL.createObjectURL(file);
      image.onload = () => {
        const scale = Math.min(1, 1200 / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(objectUrl);
        const imageData = canvas.toDataURL('image/jpeg', .8);
        if (imageData.length > 1000000) reject(new Error('Bildet er fortsatt for stort etter komprimering. Velg et mindre bilde.'));
        else resolve(imageData);
      };
      image.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Bildet kunne ikke leses.')); };
      image.src = objectUrl;
    });
  }

  function getCurrentUser() {
    const user = getRecordById('users', localStorage.getItem(currentUserKey));
    if (!user) localStorage.removeItem(currentUserKey);
    return user;
  }

  function hasActiveWishForUser(userId) {
    if (!userId) return false;
    return data.wishes.some((wish) => {
      if (wish.status !== 'Aktiv') return false;
      if (wish.userId === userId) return true;
      if (!wish.horseId) return false;
      const horse = getRecordById('horses', wish.horseId);
      return horse && horse.ownerId === userId;
    });
  }

  function isWishOwnedByUser(wish, userId) {
    if (!wish || !userId) return false;
    if (wish.userId === userId) return true;
    if (!wish.horseId) return false;
    const horse = getRecordById('horses', wish.horseId);
    return horse && horse.ownerId === userId;
  }

  function wishesOwnedByUser(userId) {
    return data.wishes.filter((wish) => isWishOwnedByUser(wish, userId));
  }

  function getNotifications() {
    try { return JSON.parse(localStorage.getItem(notificationKey) || '{}'); }
    catch (error) { return {}; }
  }

  function saveNotifications(notifications) {
    localStorage.setItem(notificationKey, JSON.stringify(notifications));
  }

  function getUserNotifications(userId) {
    return getNotifications()[userId] || [];
  }

  function addNotification(userId, message, link = '#requests') {
    if (!userId) return;
    const notifications = getNotifications();
    const userNotifications = notifications[userId] || [];
    userNotifications.unshift({ id: `NOTIFICATION-${Date.now()}`, message, link, read: false, createdAt: new Date().toISOString() });
    notifications[userId] = userNotifications.slice(0, 50);
    saveNotifications(notifications);
  }

  function markNotificationsRead(userId) {
    if (!userId) return;
    const notifications = getNotifications();
    notifications[userId] = (notifications[userId] || []).map((notification) => ({ ...notification, read: true }));
    saveNotifications(notifications);
  }

  function unreadNotificationCount(userId) {
    return getUserNotifications(userId).filter((notification) => !notification.read).length;
  }

  function syncLocalType(type) {
    const prefix = `${idPrefixes[type]}-LOCAL-`;
    const localRecords = data[type].filter((item) => item.id.startsWith(prefix));
    localStorage.setItem(localStorageKeys[type], JSON.stringify(localRecords));
  }

  function updateRequestStatus(requestId, status) {
    const request = getRecordById('requests', requestId);
    if (!request) return;
    request.status = status;
    syncLocalType('requests');
  }

  function renderHomeInsights(currentUser) {
    if (!currentUser) return '';
    const ownWishes = wishesOwnedByUser(currentUser.id);
    const ownActiveWishes = ownWishes.filter((wish) => wish.status === 'Aktiv');
    const ownWishIds = new Set(ownWishes.map((wish) => wish.id));
    const oppositeByType = { 'Ønsker en rytter': 'Ønsker å Ri', 'Ønsker å Ri': 'Ønsker en rytter' };
    const matchingWishes = data.wishes.filter((wish) => {
      if (wish.status !== 'Aktiv' || ownWishIds.has(wish.id)) return false;
      return ownActiveWishes.some((mine) => oppositeByType[mine.ønsketype] === wish.ønsketype && mine.location === wish.location && mine.erfaring === wish.erfaring);
    });
    const incomingRequests = data.requests.filter((request) => request.sender === currentUser.id || request.mottaker === currentUser.id);
    const localEvents = data.events.filter((event) => event.location === currentUser.location);
    const ownWishesHeader = '<div class="home-insight-header"><h3>Mine ønsker</h3><a class="button" href="#create-wish"><span aria-hidden="true">✦</span> Opprett Ønske</a></div>';
    const ownWishesBody = ownWishes.length
      ? `${ownWishesHeader}<div class="table-wrap"><table><thead><tr><th scope="col">Ønske</th><th scope="col">Type</th><th scope="col">By</th><th scope="col">Status</th></tr></thead><tbody>${ownWishes.map((wish) => `<tr><td>${lookupLink(wish.id, 'wishes')}</td><td>${escapeHtml(wish.ønsketype)}</td><td>${escapeHtml(wish.location)}</td><td><span class="badge badge-${String(wish.status).toLowerCase().replaceAll(' ', '-')}">${escapeHtml(wish.status)}</span></td></tr>`).join('')}</tbody></table></div>`
      : `${ownWishesHeader}<div class="empty-state compact"><h3>Du har ingen ønsker registrert ennå.</h3></div>`;
    const matchingWishBody = matchingWishes.length
      ? `<div class="table-wrap"><table><thead><tr><th scope="col">Ønske</th><th scope="col">Type</th><th scope="col">By</th><th scope="col">Erfaring</th></tr></thead><tbody>${matchingWishes.map((wish) => `<tr><td>${lookupLink(wish.id, 'wishes')}</td><td>${escapeHtml(wish.ønsketype)}</td><td>${escapeHtml(wish.location)}</td><td>${escapeHtml(wish.erfaring)}</td></tr>`).join('')}</tbody></table></div>`
      : '<div class="empty-state compact"><h3>Ingen matchende ønsker tilgjengelig for øyeblikket.</h3></div>';
    const incomingRequestsBody = incomingRequests.length
      ? `<div class="table-wrap"><table><thead><tr><th scope="col">Forespørsel</th><th scope="col">Ønske</th><th scope="col">Rolle</th><th scope="col">Status</th><th scope="col">Handling</th></tr></thead><tbody>${incomingRequests.map((request) => { const isReceiver = request.mottaker === currentUser.id; const canRespond = isReceiver && request.status === 'Under behandling'; return `<tr><td>${lookupLink(request.id, 'requests')}</td><td>${request.wishId ? lookupLink(request.wishId, 'wishes') : '—'}</td><td>${isReceiver ? 'Mottaker' : 'Sender'}</td><td><span class="badge badge-${String(request.status).toLowerCase().replaceAll(' ', '-')}">${escapeHtml(request.status)}</span></td><td>${canRespond ? `<div class="inline-actions"><button class="button" type="button" data-approve-request="${escapeHtml(request.id)}">Godkjenn</button><button class="button button-secondary" type="button" data-reject-request="${escapeHtml(request.id)}">Avslå</button></div>` : '—'}</td></tr>`; }).join('')}</tbody></table></div>`
      : '<div class="empty-state compact"><h3>Ingen forespørsler tilgjengelig for øyeblikket.</h3></div>';
    const eventsBody = localEvents.length
      ? `<div class="table-wrap"><table><thead><tr><th scope="col">Arrangement</th><th scope="col">Dato</th><th scope="col">Tid</th><th scope="col">By</th></tr></thead><tbody>${localEvents.map((event) => `<tr><td>${lookupLink(event.id, 'events')}</td><td>${escapeHtml(formatValue('date', event.date))}</td><td>${escapeHtml(event.startTime)}</td><td>${escapeHtml(event.location)}</td></tr>`).join('')}</tbody></table></div>`
      : '<div class="empty-state compact"><h3>Ingen arrangementer i din by akkurat nå.</h3></div>';
    return `<section class="home-section home-insights-section"><div class="section-heading"><h2>For deg i ${escapeHtml(currentUser.location)}</h2><p class="lede">Se relevante ønsker, forespørsler og arrangementer i nærheten.</p></div><article class="home-insight-card home-insight-card-full"><h3>Matchende ønsker</h3>${matchingWishBody}</article><article class="home-insight-card home-insight-card-full"><h3>Mine forespørsler</h3>${incomingRequestsBody}</article><div class="home-insights-grid home-insights-grid-bottom"><article class="home-insight-card"><h3>Arrangementer i samme by</h3>${eventsBody}</article><article class="home-insight-card">${ownWishesBody}</article></div></section>`;
  }

  function updateAuthAction() {
    const user = getCurrentUser();
    const action = document.querySelector('[data-auth-action]');
    const notificationAction = document.querySelector('[data-notification-action]');
    const notificationCount = document.querySelector('[data-notification-count]');
    action.textContent = user ? `Logg ut (${user.name})` : 'Logg inn';
    action.href = user ? '#logout' : '#login';
    if (notificationAction && notificationCount) {
      if (!user) {
        notificationAction.hidden = true;
        notificationCount.hidden = true;
      } else {
        const unread = unreadNotificationCount(user.id);
        notificationAction.hidden = false;
        notificationCount.hidden = unread === 0;
        notificationCount.textContent = unread;
      }
    }
  }

  function renderHome() {
    const currentUser = getCurrentUser();
    const horsePool = currentUser ? data.horses.filter((horse) => horse.location === currentUser.location) : data.horses;
    const horses = [...(horsePool.length ? horsePool : data.horses)].sort(() => Math.random() - .5).slice(0, 3);
    const nextActivity = data.activities.find((activity) => activity.status === 'Godkjent') || data.activities[0];
    const locationFilter = currentUser ? `/filter/location/${encodeURIComponent(currentUser.location)}` : '';
    const homeInsightsSection = renderHomeInsights(currentUser);
    const showWishPrompt = Boolean(currentUser) && !hasActiveWishForUser(currentUser.id);
    const wishPromptSection = showWishPrompt
      ? '<section class="home-section wish-prompt-section"><div class="section-heading"><p class="eyebrow">Kom i gang</p><h2>Begynn reisen din med et ønske</h2><p class="lede">Du kan opprette ønsket ditt direkte i panelet «Mine ønsker» lenger ned på siden.</p></div></section>'
      : '';
    const relatedHorse = currentUser ? data.horses.find((horse) => horse.ownerId === currentUser.id) : null;
    const relatedHorseImage = relatedHorse ? getProfileImage(relatedHorse) : '';
    const heroVisual = relatedHorseImage ? `<div class="hero-mark hero-mark-image"><img src="${escapeHtml(relatedHorseImage)}" alt="${escapeHtml(relatedHorse.name)}"></div>` : '<div class="hero-mark" aria-hidden="true">♞<span>✦</span></div>';
    app.innerHTML = `<div class="home-page">
      <section class="home-hero"><div><p class="eyebrow">Velkommen til HesteVenn</p><h1>Gode dager med hest begynner med riktig match.</h1><p class="lede">Finn en trygg hestevenn, en passende rytter eller neste aktivitet i nærheten.</p></div>${heroVisual}</section>
      ${wishPromptSection}
      ${homeInsightsSection}
      <section class="home-section"><div class="section-heading"><h2>Hva passer best for deg?</h2></div><div class="choice-grid"><a class="choice-card choice-owner" href="#wishes/filter/ønsketype/%C3%98nsker%20%C3%A5%20Ri"><span class="choice-icon" aria-hidden="true">♞</span><strong>Jeg har hest</strong><p>Finn en rytter${currentUser ? ` i ${escapeHtml(currentUser.location)}` : ''} som passer din hest.</p><span class="choice-link">Finn en rytter →</span></a><a class="choice-card choice-rider" href="#wishes/filter/ønsketype/%C3%98nsker%20en%20rytter"><span class="choice-icon" aria-hidden="true">⌁</span><strong>Jeg ønsker å ri</strong><p>Finn en hest${currentUser ? ` i ${escapeHtml(currentUser.location)}` : ''} som passer din erfaring og rideønske.</p><span class="choice-link">Utforsk hester →</span></a><a class="choice-card choice-event" href="#events${locationFilter}"><span class="choice-icon" aria-hidden="true">◎</span><strong>Utforsk arrangementer</strong><p>Finn arrangementer${currentUser ? ` i ${escapeHtml(currentUser.location)}` : ' i nærheten'} og møt andre hestevenner.</p><span class="choice-link">Se arrangementer →</span></a></div></section>
      <section class="home-section nearby-section"><div class="section-heading heading-row"><div><p class="eyebrow">Noen hester i nærheten</p><h2>Møt din neste turkamerat</h2></div><a class="text-link" href="#horses">Se alle hester →</a></div><div class="home-horse-grid">${horses.map((horse) => `<article class="home-horse-card"><div class="home-horse-art" aria-hidden="true">♞</div><div class="home-horse-content"><div class="home-horse-title"><h3>${escapeHtml(horse.name)}</h3><span>${horse.age} år</span></div><p>${escapeHtml(horse.breed)} · ${escapeHtml(horse.location)}</p><dl><div><dt>Passer for</dt><dd>${escapeHtml(horse.suitableActivities.join(' og '))}</dd></div><div><dt>Ønsket erfaring</dt><dd>${escapeHtml(horse.experienceRequirement)}</dd></div></dl><a class="button button-outline" href="#horse/${horse.id}">Se profil</a></div></article>`).join('')}</div></section>
      <section class="home-section activity-preview"><div><p class="eyebrow">Et glimt av hverdagen</p><h2>Neste aktivitet</h2><p>${escapeHtml(nextActivity.name)}</p></div><div class="activity-preview-details"><div><span>Hest</span><a href="#horse/${nextActivity.horseId}">${escapeHtml(getHorseName(nextActivity.horseId))}</a></div><div><span>Rytter</span><a href="#user/${nextActivity.userId}">${escapeHtml(getUserName(nextActivity.userId))}</a></div><div><span>Når</span><strong>${escapeHtml(nextActivity.date)} · ${escapeHtml(nextActivity.startTime)}</strong></div><div><span>By</span><strong>${escapeHtml(nextActivity.location)}</strong></div></div><span class="badge">${escapeHtml(nextActivity.status)}</span></section>
      <section class="home-section how-section"><div class="section-heading centered"><p class="eyebrow">Enkelt å utforske</p><h2>Slik fungerer HesteVenn</h2></div><div class="steps"><article><span class="step-number">01</span><span class="step-icon" aria-hidden="true">◎</span><h3>Opprett en profil</h3><p>Fortell om hesten din, eller del erfaringen og det du liker å gjøre i salen.</p></article><article><span class="step-number">02</span><span class="step-icon" aria-hidden="true">⌕</span><h3>Finn en passende hest eller rytter</h3><p>Utforsk profiler som passer med hverdagen, nivået og ønskene dine.</p></article><article><span class="step-number">03</span><span class="step-icon" aria-hidden="true">✦</span><h3>Avtal en aktivitet</h3><p>Finn en god ramme for første tur, økt eller møte i stallen.</p></article></div></section>
    </div>`;
    document.querySelectorAll('[data-approve-request]').forEach((button) => button.addEventListener('click', () => {
      const request = getRecordById('requests', button.dataset.approveRequest);
      if (!request || request.mottaker !== currentUser?.id || request.status !== 'Under behandling') return;
      updateRequestStatus(request.id, 'Godkjent');
      addNotification(request.sender, `Forespørselen ${request.name} ble godkjent.`, `#request/${encodeURIComponent(request.id)}`);
      renderHome();
      updateAuthAction();
    }));
    document.querySelectorAll('[data-reject-request]').forEach((button) => button.addEventListener('click', () => {
      const request = getRecordById('requests', button.dataset.rejectRequest);
      if (!request || request.mottaker !== currentUser?.id || request.status !== 'Under behandling') return;
      updateRequestStatus(request.id, 'Avslått');
      addNotification(request.sender, `Forespørselen ${request.name} ble avslått.`, `#request/${encodeURIComponent(request.id)}`);
      renderHome();
      updateAuthAction();
    }));
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
    if (key === 'ownerId' || key === 'userId' || key === 'sender' || key === 'mottaker') return value ? lookupLink(value, 'users') : '—';
    if (key === 'horseId') return value ? lookupLink(value, 'horses') : '—';
    if (key === 'wishId') return value ? lookupLink(value, 'wishes') : '—';
    if (key === 'name') return `<a class="record-link strong-link" href="#${singular[type]}/${encodeURIComponent(record.id)}">${escapeHtml(value)}</a>`;
    if (key === 'status' || key === 'severity' || key === 'role' || key === 'active') return `<span class="badge badge-${String(value).toLowerCase().replaceAll(' ', '-')}">${escapeHtml(formatValue(key, value))}</span>`;
    return escapeHtml(formatValue(key, value));
  }
  function uniqueValues(type, key) { return [...new Set(data[type].flatMap((record) => Array.isArray(record[key]) ? record[key] : formatValue(key, record[key])).filter(Boolean))].sort(); }
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
  function renderObjectList(type) {
    const query = state.search.toLowerCase().trim();
    const records = data[type].filter((record) => matchesFilters(type, record) && (!query || Object.values(record).join(' ').toLowerCase().includes(query)));
    const filterMarkup = (filters[type] || []).map(([key, label]) => `<label class="filter"><span>${label}</span><select data-filter-key="${key}"><option value="">${label}</option>${uniqueValues(type, key).map((value) => `<option value="${escapeHtml(value)}" ${state.selectedFilters[key] === value ? 'selected' : ''}>${escapeHtml(value)}</option>`).join('')}</select></label>`).join('');
    const tableHead = columns[type].map(([, label]) => `<th scope="col">${label}</th>`).join('');
    const rows = records.map((record) => `<tr>${columns[type].map(([key]) => `<td>${renderCell(type, key, record[key], record)}</td>`).join('')}</tr>`).join('');
    const createAction = `<a class="button" href="#new-${singular[type]}">+ Legg Til</a>`;
    app.innerHTML = `<section class="page-heading"><div><p class="eyebrow">Objekt · ${labels[type]}</p><h1>${labels[type]}</h1><p class="lede">${descriptions[type]}</p></div><div class="page-actions">${createAction}</div></section><section class="list-panel"><div class="list-toolbar"><div><strong>${records.length} av ${data[type].length} poster</strong><span class="toolbar-note"> · lokale data</span></div><label class="search-field"><span class="sr-only">Søk i ${labels[type]}</span><span aria-hidden="true">⌕</span><input type="search" id="record-search" placeholder="Søk i poster" value="${escapeHtml(state.search)}"></label><div class="filters">${filterMarkup}</div></div><div class="table-wrap"><table><thead><tr>${tableHead}</tr></thead><tbody>${rows}</tbody></table></div>${records.length ? '' : '<div class="empty-state"><span aria-hidden="true">⌕</span><h2>Ingen poster funnet</h2><p>Prøv et annet søk eller fjern et filter.</p></div>'}</section>`;
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
  function renderNotifications() {
    const currentUser = getCurrentUser();
    if (!currentUser) { window.location.hash = '#login'; return; }
    const notifications = getUserNotifications(currentUser.id);
    app.innerHTML = `<a class="back-link" href="#home">← Til Min Side</a><section class="page-heading"><div><p class="eyebrow">Varsler</p><h1>Notifikasjoner</h1><p class="lede">Her ser du nye hendelser knyttet til forespørsler.</p></div></section><section class="detail-panel">${notifications.length ? `<div class="related-list">${notifications.map((notification) => `<a class="related-item" href="${escapeHtml(notification.link || '#requests')}"><strong>${escapeHtml(notification.message)}</strong><small>${escapeHtml(new Date(notification.createdAt).toLocaleString('nb-NO'))}</small></a>`).join('')}</div>` : '<div class="empty-state compact"><h3>Ingen notifikasjoner akkurat nå.</h3></div>'}</section>`;
    markNotificationsRead(currentUser.id);
    updateAuthAction();
    updateNavigation('');
  }
  function createWishFlowDefaults() {
    const currentUser = getCurrentUser();
    return {
      ønsketype: '',
      location: currentUser?.location || '',
      erfaring: 'Nybegynner',
      aktivitetstype: 'Ukentlig',
      størrelsePåHest: 'Mellom',
      ridestil: 'Tur',
      qualifications: '',
      comment: '',
      horseId: '',
      status: 'Aktiv'
    };
  }
  function getWishFlowState() {
    if (!Object.keys(state.wishFlow).length) state.wishFlow = createWishFlowDefaults();
    return state.wishFlow;
  }
  function renderCreateWishFlowStep1() {
    state.wishFlow = createWishFlowDefaults();
    app.innerHTML = `<a class="back-link" href="#home">← Til Min Side</a><section class="page-heading"><div><p class="eyebrow">Opprett Ønske · 1 av 3</p><h1>Velg ønsketype</h1><p class="lede">Start med å fortelle om du ønsker å ri eller ønsker en rytter.</p></div></section><form class="profile-form detail-panel" id="wish-flow-step-1"><div class="form-grid"><label class="form-wide"><span>Ønsketype</span><select name="ønsketype" required><option value="">Velg ønsketype</option><option value="Ønsker å Ri">Ønsker å Ri</option><option value="Ønsker en rytter">Ønsker en rytter</option></select></label></div><div class="form-actions"><a class="button button-secondary" href="#home">Avbryt</a><button class="button" type="submit">Neste</button></div></form>`;
    document.querySelector('#wish-flow-step-1').addEventListener('submit', (event) => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(event.currentTarget));
      state.wishFlow = { ...createWishFlowDefaults(), ...values };
      window.location.hash = '#create-wish/detaljer';
    });
    updateNavigation('');
  }
  function renderCreateWishFlowStep2() {
    const flow = getWishFlowState();
    if (!flow.ønsketype) {
      window.location.hash = '#create-wish';
      return;
    }
    const needsHorse = flow.ønsketype === 'Ønsker en rytter';
    const horseField = needsHorse
      ? `<label><span>Hest</span><select name="horseId" required><option value="">Velg hest</option>${data.horses.map((horse) => `<option value="${escapeHtml(horse.id)}" ${flow.horseId === horse.id ? 'selected' : ''}>${escapeHtml(horse.name)} · ${escapeHtml(horse.location)}</option>`).join('')}</select></label>`
      : '';
    app.innerHTML = `<a class="back-link" href="#create-wish">← Tilbake</a><section class="page-heading"><div><p class="eyebrow">Opprett Ønske · 2 av 3</p><h1>${escapeHtml(flow.ønsketype)}</h1><p class="lede">Svar på spørsmålene under for å opprette ønsket ditt.</p></div></section><form class="profile-form detail-panel" id="wish-flow-step-2"><div class="form-grid"><label><span>By</span><input name="location" required value="${escapeHtml(flow.location)}"></label><label><span>Erfaring</span><select name="erfaring" required><option value="Nybegynner" ${flow.erfaring === 'Nybegynner' ? 'selected' : ''}>Nybegynner</option><option value="Lett øvet" ${flow.erfaring === 'Lett øvet' ? 'selected' : ''}>Lett øvet</option><option value="Erfaren" ${flow.erfaring === 'Erfaren' ? 'selected' : ''}>Erfaren</option><option value="Profesjonell" ${flow.erfaring === 'Profesjonell' ? 'selected' : ''}>Profesjonell</option></select></label><label><span>Aktivitetstype</span><select name="aktivitetstype" required><option value="Engangstilfelle" ${flow.aktivitetstype === 'Engangstilfelle' ? 'selected' : ''}>Engangstilfelle</option><option value="Månedlig" ${flow.aktivitetstype === 'Månedlig' ? 'selected' : ''}>Månedlig</option><option value="Ukentlig" ${flow.aktivitetstype === 'Ukentlig' ? 'selected' : ''}>Ukentlig</option><option value="Daglig" ${flow.aktivitetstype === 'Daglig' ? 'selected' : ''}>Daglig</option><option value="Periode" ${flow.aktivitetstype === 'Periode' ? 'selected' : ''}>Periode</option></select></label><label><span>Størrelse på hest</span><select name="størrelsePåHest" required><option value="Liten" ${flow.størrelsePåHest === 'Liten' ? 'selected' : ''}>Liten</option><option value="Mellom" ${flow.størrelsePåHest === 'Mellom' ? 'selected' : ''}>Mellom</option><option value="Stor" ${flow.størrelsePåHest === 'Stor' ? 'selected' : ''}>Stor</option></select></label><label><span>Ridestil</span><select name="ridestil" required><option value="Tur" ${flow.ridestil === 'Tur' ? 'selected' : ''}>Tur</option><option value="Dressur" ${flow.ridestil === 'Dressur' ? 'selected' : ''}>Dressur</option><option value="Sprang" ${flow.ridestil === 'Sprang' ? 'selected' : ''}>Sprang</option><option value="Fôr" ${flow.ridestil === 'Fôr' ? 'selected' : ''}>Fôr</option></select></label>${horseField}<label class="form-wide"><span>Kvalifikasjoner</span><input name="qualifications" value="${escapeHtml(flow.qualifications)}" placeholder="For eksempel Trygg på tur, Grunnleggende håndtering"></label><label class="form-wide"><span>Kommentar</span><textarea name="comment" rows="5">${escapeHtml(flow.comment)}</textarea></label></div><div class="form-actions"><a class="button button-secondary" href="#create-wish">Tilbake</a><button class="button" type="submit">Opprett ønske</button></div><p class="form-error" role="alert" hidden></p></form>`;
    document.querySelector('#wish-flow-step-2').addEventListener('submit', (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const values = Object.fromEntries(new FormData(form));
      const currentUser = getCurrentUser();
      const wishType = flow.ønsketype;
      const horseId = wishType === 'Ønsker en rytter' ? (values.horseId || '').trim() : '';
      const userId = wishType === 'Ønsker å Ri' ? (currentUser?.id || '') : '';
      const message = form.querySelector('.form-error');
      if (wishType === 'Ønsker en rytter' && !horseId) {
        message.textContent = 'Velg hest for ønsket ditt.';
        message.hidden = false;
        return;
      }
      const now = new Date();
      const dateToken = now.toLocaleDateString('nb-NO');
      const wishNamePrefix = wishType === 'Ønsker en rytter' ? 'Ønsker en rytter' : 'Ønsker å Ri';
      const record = {
        id: `${idPrefixes.wishes}-LOCAL-${Date.now()}`,
        name: `${wishNamePrefix} · ${values.location.trim()} · ${dateToken}`,
        userId,
        horseId,
        location: values.location.trim(),
        størrelsePåHest: values.størrelsePåHest,
        erfaring: values.erfaring,
        ønsketype: wishType,
        aktivitetstype: values.aktivitetstype,
        ridestil: values.ridestil,
        status: 'Aktiv',
        qualifications: String(values.qualifications || '').split(',').map((value) => value.trim()).filter(Boolean),
        comment: String(values.comment || '').trim()
      };
      saveLocalRecord('wishes', record);
      state.wishFlow = createWishFlowDefaults();
      window.location.hash = `#create-wish/fullfort/${encodeURIComponent(record.id)}`;
    });
    updateNavigation('');
  }
  function renderCreateWishFlowStep3(wishId) {
    const record = getRecordById('wishes', wishId);
    const wishLink = record ? `#wish/${encodeURIComponent(record.id)}` : '#wishes';
    app.innerHTML = `<a class="back-link" href="#home">← Til Min Side</a><section class="page-heading"><div><p class="eyebrow">Opprett Ønske · 3 av 3</p><h1>Ønsket ditt er opprettet</h1><p class="lede">Flott! Nå kan andre hestevenner finne ønsket ditt og ta kontakt for en trygg og god rideopplevelse.</p></div></section><section class="detail-panel"><div class="empty-state compact"><span aria-hidden="true">✦</span><h3>Klar for matching</h3><p>Du kan se ønsket ditt med en gang eller gå tilbake til oversikten over alle ønsker.</p></div><div class="form-actions"><a class="button button-secondary" href="#wishes">Se alle ønsker</a><a class="button" href="${wishLink}">Se ønsket ditt</a></div></section>`;
    updateNavigation('');
  }
  function relationPresets(type, contextType, contextId) {
    if (!contextType || !contextId) {
      const currentUser = getCurrentUser();
      return type === 'events' && currentUser ? { organizerId: currentUser.id } : {};
    }
    if (contextType === 'users') return type === 'horses' ? { ownerId: contextId } : type === 'wishes' ? { userId: contextId, horseId: '' } : { userId: contextId };
    if (contextType === 'wishes') {
      const wish = getRecordById('wishes', contextId);
      const currentUser = getCurrentUser();
      const receiverId = wish?.userId || (wish?.horseId ? getRecordById('horses', wish.horseId)?.ownerId : '');
      if (type === 'requests') return { wishId: contextId, horseId: wish?.horseId || '', sender: currentUser?.id || '', mottaker: receiverId || '' };
      return {};
    }
    if (contextType === 'horses') {
      if (type === 'wishes') return { horseId: contextId, userId: '' };
      if (type === 'requests') {
        const currentUser = getCurrentUser();
        const horse = getRecordById('horses', contextId);
        return currentUser && ['Rytter', 'Begge'].includes(currentUser.role) ? { horseId: contextId, sender: currentUser.id, mottaker: horse?.ownerId || '' } : { horseId: contextId, mottaker: horse?.ownerId || '' };
      }
      return { horseId: contextId };
    }
    return {};
  }
  function renderCreateField(field, presets) {
    const attributes = `${field.required ? ' required' : ''}${field.min !== undefined ? ` min="${field.min}"` : ''}${field.max !== undefined ? ` max="${field.max}"` : ''}${field.step !== undefined ? ` step="${field.step}"` : ''}${field.value !== undefined ? ` value="${field.value}"` : ''}${field.autocomplete ? ` autocomplete="${field.autocomplete}"` : ''}${field.placeholder ? ` placeholder="${escapeHtml(field.placeholder)}"` : ''}`;
    const hasPreset = Object.prototype.hasOwnProperty.call(presets, field.key);
    let control;
    if (field.type === 'image') control = `<input name="imageFile" type="file" accept="image/jpeg,image/png,image/webp"><img class="image-preview" alt="Forhåndsvisning" hidden>`;
    else if (field.type === 'select') control = `<select name="${field.key}"${attributes}>${field.options.map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`).join('')}</select>`;
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
    const imageInput = document.querySelector('[name="imageFile"]');
    if (imageInput) imageInput.addEventListener('change', () => {
      const preview = document.querySelector('.image-preview');
      if (!imageInput.files[0]) { preview.hidden = true; return; }
      preview.src = URL.createObjectURL(imageInput.files[0]);
      preview.hidden = false;
    });
    document.querySelector('#create-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const values = Object.fromEntries(new FormData(form));
      delete values.imageFile;
      fields.filter((field) => field.array).forEach((field) => { values[field.key] = values[field.key].split(',').map((value) => value.trim()).filter(Boolean); });
      fields.filter((field) => field.type === 'number').forEach((field) => { values[field.key] = Number(values[field.key]); });
      Object.keys(values).forEach((key) => { if (typeof values[key] === 'string') values[key] = values[key].trim(); });
      if (type === 'requests') {
        const currentUser = getCurrentUser();
        if (!values.sender && currentUser) values.sender = currentUser.id;
        if (!values.userId && values.sender) values.userId = values.sender;
        if (!values.mottaker && values.wishId) {
          const wish = getRecordById('wishes', values.wishId);
          values.mottaker = wish?.userId || (wish?.horseId ? getRecordById('horses', wish.horseId)?.ownerId : '');
        }
      }
      if (type === 'requests') values.name = `Forespørsel ${values.date} ${values.startTime}`;
      const record = { id: `${idPrefixes[type]}-LOCAL-${Date.now()}`, ...values };
      if (type === 'users' || type === 'horses') record.active = true;
      if (type === 'events') record.participantIds = [];
      const message = form.querySelector('.form-error');
      if (type === 'wishes' && Boolean(record.userId) === Boolean(record.horseId)) {
        message.textContent = 'Velg enten én bruker eller én hest for ønsket.';
        message.hidden = false;
        return;
      }
      try {
        const imageData = imageInput ? await compressImage(imageInput.files[0]) : '';
        saveLocalRecord(type, record);
        if (type === 'requests' && record.mottaker) addNotification(record.mottaker, `Ny forespørsel mottatt: ${record.name}.`, `#request/${encodeURIComponent(record.id)}`);
        if (imageData) saveProfileImage(record.id, imageData);
        window.location.hash = contextRecord ? returnUrl : `#${singular[type]}/${record.id}`;
      } catch (error) {
        message.textContent = error.message || 'Posten kunne ikke lagres lokalt i denne nettleseren.';
        message.hidden = false;
      }
    });
    updateNavigation(type);
  }
  function relatedRecords(type, key, id) { return data[type].filter((record) => record[key] === id); }
  function renderRelatedList(type, records) {
    if (!records.length) return '<div class="empty-state compact"><span aria-hidden="true">○</span><h3>Ingen relaterte poster</h3><p>Det finnes ingen registrerte poster her ennå.</p></div>';
    return `<div class="related-list">${records.map((record) => `<a class="related-item" href="#${singular[type]}/${record.id}"><strong>${escapeHtml(record.name)}</strong><span aria-hidden="true">→</span></a>`).join('')}</div>`;
  }
  function renderDetailValue(key, value) {
    if (key === 'ownerId' || key === 'userId' || key === 'sender' || key === 'mottaker') return value ? lookupLink(value, 'users') : '—';
    if (key === 'organizerId') return value ? lookupLink(value, 'users') : '—';
    if (key === 'horseId') return value ? lookupLink(value, 'horses') : '—';
    if (key === 'wishId') return value ? lookupLink(value, 'wishes') : '—';
    if (key === 'participantIds') return value.length ? value.map((userId) => lookupLink(userId, 'users')).join(', ') : 'Ingen deltakere ennå';
    return escapeHtml(formatValue(key, value));
  }
  function renderDetail(type, id, tab) {
    const record = getRecordById(type, id);
    if (!record) { app.innerHTML = '<div class="empty-state"><h1>Posten finnes ikke</h1><a class="record-link" href="#users">Til oversikten</a></div>'; return; }
    const related = type === 'horses' ? { requests: relatedRecords('requests', 'horseId', id), wishes: relatedRecords('wishes', 'horseId', id), activities: relatedRecords('activities', 'horseId', id), qualifications: relatedRecords('qualifications', 'horseId', id), incidents: relatedRecords('incidents', 'horseId', id) } : type === 'users' ? { requests: data.requests.filter((request) => request.sender === id || request.mottaker === id || request.userId === id), horses: relatedRecords('horses', 'ownerId', id), wishes: relatedRecords('wishes', 'userId', id), activities: relatedRecords('activities', 'userId', id), qualifications: relatedRecords('qualifications', 'userId', id) } : {};
    const tabs = type === 'horses' ? [['details', 'Detaljer'], ['requests', `Forespørsler (${related.requests.length})`], ['wishes', `Ønsker (${related.wishes.length})`], ['activities', `Aktiviteter (${related.activities.length})`], ['qualifications', `Kvalifikasjoner (${related.qualifications.length})`], ['incidents', `Hendelser (${related.incidents.length})`]] : type === 'users' ? [['details', 'Detaljer'], ['requests', `Forespørsler (${related.requests.length})`], ['wishes', `Ønsker (${related.wishes.length})`], ['horses', `Hester (${related.horses.length})`], ['activities', `Aktiviteter (${related.activities.length})`], ['qualifications', `Kvalifikasjoner (${related.qualifications.length})`]] : [];
    const relationKey = type === 'users' ? (tab === 'horses' ? 'horses' : tab) : tab;
    const supportsImage = type === 'users' || type === 'horses';
    const imageSource = supportsImage ? getProfileImage(record) : '';
    const profileMedia = supportsImage ? `<div class="profile-media">${imageSource ? `<img src="${escapeHtml(imageSource)}" alt="${escapeHtml(record.name)}">` : `<div class="profile-image-placeholder" aria-hidden="true">${type === 'horses' ? '♞' : escapeHtml(record.name.charAt(0))}</div>`}<label class="image-upload-button"><span>${imageSource ? 'Bytt bilde' : 'Legg til bilde'}</span><input type="file" accept="image/jpeg,image/png,image/webp" data-profile-image></label><p class="image-upload-error" role="alert" hidden></p></div>` : '';
    const createRelated = tabs.length && tab && tab !== 'details' ? `<div class="related-toolbar"><div><strong>${labels[relationKey]}</strong><span>${related[relationKey].length} poster relatert til ${escapeHtml(record.name)}</span></div><a class="button" href="#new-${singular[relationKey]}/${singular[type]}/${encodeURIComponent(id)}/${tab}">+ Legg Til</a></div>` : '';
    const currentUser = getCurrentUser();
    const participants = type === 'events' ? getEventParticipants(record) : [];
    const eventRecord = type === 'events' ? { ...record, participantIds: participants } : record;
    const body = tabs.length && tab && tab !== 'details' ? `${createRelated}${renderRelatedList(relationKey, related[relationKey])}` : `<div class="detail-grid">${detailFields[type].map(([key, label]) => `<div class="detail-field"><dt>${label}</dt><dd>${renderDetailValue(key, eventRecord[key])}</dd></div>`).join('')}</div>`;
    const requestAction = type === 'horses'
      ? `<a class="button" href="#new-request/horse/${encodeURIComponent(id)}/requests">Legg til forespørsel</a>`
      : type === 'wishes'
        ? `<a class="button" href="#new-request/wish/${encodeURIComponent(id)}/requests">Send forespørsel</a>`
        : type === 'requests' && currentUser && record.mottaker === currentUser.id && record.status === 'Under behandling'
          ? '<div class="inline-actions"><button class="button" type="button" data-approve-request-detail>Godkjenn forespørsel</button><button class="button button-secondary" type="button" data-reject-request-detail>Avslå forespørsel</button></div>'
          : '';
    const eventAction = type === 'events' ? currentUser ? `<button class="button" type="button" data-event-participation>${participants.includes(currentUser.id) ? 'Forlat arrangement' : 'Bli med'}</button>` : '<a class="button" href="#login">Logg inn for å delta</a>' : '';
    const primaryAction = requestAction || eventAction;
    app.innerHTML = `<a class="back-link" href="#${type}">← Til ${labels[type].toLowerCase()}</a><section class="record-profile-header ${supportsImage ? '' : 'record-profile-header-no-media'}">${profileMedia}<div class="record-header"><div><p class="eyebrow">${labels[type]}</p><h1>${escapeHtml(record.name)}</h1>${primaryAction ? `<div class="record-primary-action">${primaryAction}</div>` : ''}</div><div class="record-actions">${record.status ? `<span class="badge badge-large badge-${record.status.toLowerCase().replaceAll(' ', '-')}">${escapeHtml(record.status)}</span>` : record.active !== undefined ? `<span class="badge badge-large">${record.active ? 'Aktiv' : 'Inaktiv'}</span>` : ''}</div></div></section>${tabs.length ? `<nav class="inner-tabs" aria-label="Relaterte poster">${tabs.map(([value, label]) => `<a class="${(tab || 'details') === value ? 'is-active' : ''}" href="#${singular[type]}/${id}${value === 'details' ? '' : `/${value}`}"\>${label}</a>`).join('')}</nav>` : ''}<section class="detail-panel">${body}</section>`;
    const eventParticipation = document.querySelector('[data-event-participation]');
    if (eventParticipation) eventParticipation.addEventListener('click', () => { toggleEventParticipant(id, currentUser.id); renderDetail(type, id, tab); });
    const approveRequestDetail = document.querySelector('[data-approve-request-detail]');
    if (approveRequestDetail) approveRequestDetail.addEventListener('click', () => {
      updateRequestStatus(id, 'Godkjent');
      addNotification(record.sender, `Forespørselen ${record.name} ble godkjent.`, `#request/${encodeURIComponent(record.id)}`);
      renderDetail(type, id, tab);
      updateAuthAction();
    });
    const rejectRequestDetail = document.querySelector('[data-reject-request-detail]');
    if (rejectRequestDetail) rejectRequestDetail.addEventListener('click', () => {
      updateRequestStatus(id, 'Avslått');
      addNotification(record.sender, `Forespørselen ${record.name} ble avslått.`, `#request/${encodeURIComponent(record.id)}`);
      renderDetail(type, id, tab);
      updateAuthAction();
    });
    const profileImageInput = document.querySelector('[data-profile-image]');
    if (profileImageInput) profileImageInput.addEventListener('change', async () => {
      const errorMessage = document.querySelector('.image-upload-error');
      try {
        const imageData = await compressImage(profileImageInput.files[0]);
        if (imageData) saveProfileImage(record.id, imageData);
        renderDetail(type, id, tab);
      } catch (error) {
        errorMessage.textContent = error.message;
        errorMessage.hidden = false;
      }
    });
  }
  function bindListEvents(type) {
    document.querySelector('#record-search').addEventListener('input', (event) => {
      const caret = event.target.selectionStart;
      state.search = event.target.value;
      renderObjectList(type);
      const search = document.querySelector('#record-search');
      search.focus();
      search.setSelectionRange(caret, caret);
    });
    document.querySelectorAll('[data-filter-key]').forEach((select) => select.addEventListener('change', (event) => { state.selectedFilters[event.target.dataset.filterKey] = event.target.value; renderObjectList(type); }));
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
  function navigateToRecord(type, id, tab, routeParts = []) {
    if (id) renderDetail(type, id, tab);
    else {
      state.search = '';
      state.selectedFilters = {};
      if (routeParts[0] === 'filter') {
        for (let index = 1; index < routeParts.length; index += 2) {
          const key = decodeURIComponent(routeParts[index] || '');
          const value = decodeURIComponent(routeParts[index + 1] || '');
          state.selectedFilters[key] = normalizeFilterValue(type, key, value);
        }
      }
      renderObjectList(type);
    }
    updateNavigation(type);
  }
  function updateNavigation(type, isHome) { document.querySelectorAll('[data-object]').forEach((link) => link.classList.toggle('is-active', !isHome && link.dataset.object === type)); document.querySelector('[data-home]').classList.toggle('is-active', isHome); }
  function renderRoute() {
    const parts = window.location.hash.slice(1).split('/').filter(Boolean);
    updateAuthAction();
    if (!parts.length || parts[0] === 'home') {
      renderHome();
      updateNavigation('', true);
      return;
    }
    if (parts[0] === 'login') {
      renderLogin();
      return;
    }
    if (parts[0] === 'notifications') {
      renderNotifications();
      return;
    }
    if (parts[0] === 'logout') {
      localStorage.removeItem(currentUserKey);
      updateAuthAction();
      window.location.hash = '#home';
      return;
    }
    if (parts[0] === 'create-wish') {
      if (!parts[1]) {
        renderCreateWishFlowStep1();
        return;
      }
      if (parts[1] === 'detaljer') {
        renderCreateWishFlowStep2();
        return;
      }
      if (parts[1] === 'fullfort') {
        renderCreateWishFlowStep3(parts[2] ? decodeURIComponent(parts[2]) : '');
        return;
      }
      window.location.hash = '#create-wish';
      return;
    }
    if (parts[0].startsWith('new-')) {
      const createType = Object.keys(singular).find((key) => singular[key] === parts[0].slice(4));
      const contextType = Object.keys(singular).find((key) => singular[key] === parts[1]);
      if (createType) {
        renderCreateForm(createType, contextType, parts[2] ? decodeURIComponent(parts[2]) : null, parts[3]);
        return;
      }
    }
    const type = labels[parts[0]] ? parts[0] : Object.keys(singular).find((key) => singular[key] === parts[0]);
    if (type && data[type]) {
      const isFilterRoute = parts[1] === 'filter';
      navigateToRecord(type, isFilterRoute ? null : (parts[1] ? decodeURIComponent(parts[1]) : null), isFilterRoute ? null : parts[2], isFilterRoute ? parts.slice(1) : []);
    } else {
      window.location.hash = '#home';
    }
  }
  const menuToggle = document.querySelector('.menu-toggle');
  const navigationLinks = document.querySelector('.nav-links');
  function closeMenu() { navigationLinks.classList.remove('is-open'); menuToggle.setAttribute('aria-expanded', 'false'); }
  menuToggle.addEventListener('click', () => { const open = navigationLinks.classList.toggle('is-open'); menuToggle.setAttribute('aria-expanded', open); });
  navigationLinks.addEventListener('click', (event) => { if (event.target.closest('a')) closeMenu(); });
  document.addEventListener('click', (event) => { if (!navigationLinks.contains(event.target) && !menuToggle.contains(event.target)) closeMenu(); });
  window.addEventListener('hashchange', renderRoute);
  loadLocalRecords();
  updateAuthAction();
  renderRoute();
}());
