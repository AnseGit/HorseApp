(function () {
  const data = window.HesteVennData;
  const app = document.querySelector('#app');
  const config = window.HesteVennConfig;
  if (!config) {
    console.error('HesteVennConfig mangler. Last inn app-config.js før script.js.');
    return;
  }
  const recordIndexFactory = window.HesteVennRecordIndex;
  if (!recordIndexFactory) {
    console.error('HesteVennRecordIndex mangler. Last inn record-index.js før script.js.');
    return;
  }
  const recordIndex = recordIndexFactory(data);
  const persistenceFactory = window.HesteVennPersistence;
  if (!persistenceFactory) {
    console.error('HesteVennPersistence mangler. Last inn data-persistence.js før script.js.');
    return;
  }

  const {
    idPrefixes,
    labels,
    singular,
    descriptions,
    columns,
    filters,
    detailFields,
    createLabels,
    createFields
  } = config;
  const state = { search: '', selectedFilters: {}, wishFlow: {} };
  const profilValues = ['Admin', 'Premium User', 'User'];

  function generateNextRequestName() {
    const maxSequence = data.requests.reduce((max, request) => {
      const match = /^FS-(\d+)$/.exec(String(request?.name || '').trim());
      if (!match) return max;
      const sequence = Number(match[1]);
      return Number.isFinite(sequence) ? Math.max(max, sequence) : max;
    }, 0);
    return `FS-${String(maxSequence + 1).padStart(5, '0')}`;
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

  function getProfil(user) {
    const role = String(user?.profil || user?.brukerRolle || 'User').trim();
    return profilValues.includes(role) ? role : 'User';
  }

  function isAdmin(user) {
    return getProfil(user) === 'Admin';
  }

  function canCreateRecord(type, user) {
    if (!user) return false;
    if (isAdmin(user)) return true;
    const role = getProfil(user);
    if (type === 'users') return false;
    if (['events', 'qualifications', 'incidents'].includes(type)) return role === 'Premium User';
    return true;
  }

  function normalizeUserProfiler() {
    data.users.forEach((user) => {
      user.profil = getProfil(user);
      delete user.brukerRolle;
    });
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

  function isHorseOwnedByUser(horseId, userId) {
    const horse = getRecordById('horses', horseId);
    return Boolean(horse && horse.ownerId === userId);
  }

  function canEditRecord(type, record, user) {
    if (!user || !record) return false;
    if (isAdmin(user)) return true;
    if (type === 'users') return record.id === user.id;
    if (type === 'horses') return record.ownerId === user.id;
    if (type === 'wishes') return isWishOwnedByUser(record, user.id);
    if (type === 'requests') return record.sender === user.id || record.mottaker === user.id;
    if (type === 'events') return record.organizerId === user.id;
    if (type === 'activities') return record.userId === user.id || record.mottaker === user.id || isHorseOwnedByUser(record.horseId, user.id);
    if (type === 'qualifications') return record.userId === user.id || isHorseOwnedByUser(record.horseId, user.id);
    if (type === 'incidents') return isHorseOwnedByUser(record.horseId, user.id);
    return false;
  }

  function wishesOwnedByUser(userId) {
    return data.wishes.filter((wish) => isWishOwnedByUser(wish, userId));
  }

  function updateRequestStatus(requestId, status) {
    const request = getRecordById('requests', requestId);
    if (!request) return;
    request.status = status;
    syncLocalType('requests');
  }

  function syncActivityFromRequest(request) {
    if (!request?.id) return;
    const activity = data.activities.find((item) => item.sourceRequestId === request.id);
    if (!activity) return;
    activity.date = request.date || activity.date;
    activity.startTime = request.startTime || activity.startTime;
    if (request.durationHours) activity.duration = `${request.durationHours} timer`;
    syncLocalType('activities');
  }

  function activityDateTime(record) {
    const date = record?.date;
    if (!date) return Number.POSITIVE_INFINITY;
    const time = record?.startTime || '23:59';
    const timestamp = new Date(`${date}T${time}:00`).getTime();
    return Number.isFinite(timestamp) ? timestamp : Number.POSITIVE_INFINITY;
  }

  function upcomingActivitiesForUser(userId) {
    if (!userId) return [];
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return data.activities
      .filter((activity) => activity && (activity.userId === userId || activity.mottaker === userId))
      .filter((activity) => activityDateTime(activity) >= todayStart.getTime())
      .sort((left, right) => activityDateTime(left) - activityDateTime(right));
  }

  function createActivityFromApprovedRequest(requestId) {
    const request = getRecordById('requests', requestId);
    if (!request || request.status !== 'Godkjent') return;
    if (data.activities.some((activity) => activity.sourceRequestId === request.id)) return;
    const wish = request.wishId ? getRecordById('wishes', request.wishId) : null;
    const horse = request.horseId ? getRecordById('horses', request.horseId) : null;
    const duration = request.durationHours ? `${request.durationHours} timer` : '';
    const activity = {
      id: `${idPrefixes.activities}-LOCAL-${Date.now()}`,
      name: wish ? `Aktivitet fra ${wish.name}` : `Aktivitet fra ${request.name}`,
      horseId: request.horseId || wish?.horseId || '',
      userId: request.sender || '',
      mottaker: request.mottaker || '',
      date: request.date || '',
      startTime: request.startTime || '',
      duration,
      activityType: request.activityType || wish?.ridestil || 'Tur',
      location: wish?.location || horse?.location || '',
      status: 'Planlagt',
      notes: `Opprettet fra forespørsel ${request.name}.`,
      sourceRequestId: request.id
    };
    saveLocalRecord('activities', activity);
  }

  function renderHomeInsights(currentUser, showWishPrompt = false) {
    if (!currentUser) return '';
    const ownWishes = wishesOwnedByUser(currentUser.id);
    const ownActiveWishes = ownWishes.filter((wish) => wish.status === 'Aktiv');
    const ownWishIds = new Set(ownWishes.map((wish) => wish.id));
    const oppositeByType = { 'Ønsker en rytter': 'Ønsker å Ri', 'Ønsker å Ri': 'Ønsker en rytter' };
    const matchingWishes = data.wishes.filter((wish) => {
      if (wish.status !== 'Aktiv' || ownWishIds.has(wish.id)) return false;
      return ownActiveWishes.some((mine) => oppositeByType[mine.ønsketype] === wish.ønsketype && mine.location === wish.location && mine.erfaring === wish.erfaring);
    });
    const incomingRequests = data.requests.filter((request) => (request.sender === currentUser.id || request.mottaker === currentUser.id) && request.status !== 'Avslått');
    const upcomingActivities = upcomingActivitiesForUser(currentUser.id);
    const hasIncomingRequests = incomingRequests.length > 0;
    const hasUpcomingActivities = upcomingActivities.length > 0;
    const localEvents = data.events.filter((event) => event.location === currentUser.location);
    const ownWishesHeader = '<div class="home-insight-header"><h3>Mine ønsker</h3><a class="button" href="#create-wish"><span aria-hidden="true">✦</span> Opprett Ønske</a></div>';
    const ownWishesBody = ownWishes.length
      ? `${ownWishesHeader}<div class="table-wrap"><table><thead><tr><th scope="col">Ønske</th><th scope="col">Erfaring</th><th scope="col">Status</th></tr></thead><tbody>${ownWishes.map((wish) => `<tr><td>${lookupLink(wish.id, 'wishes')}</td><td>${escapeHtml(wish.erfaring)}</td><td><span class="badge badge-${String(wish.status).toLowerCase().replaceAll(' ', '-')}">${escapeHtml(wish.status)}</span></td></tr>`).join('')}</tbody></table></div>`
      : `${ownWishesHeader}<div class="empty-state compact"><h3>Du har ingen ønsker registrert ennå.</h3></div>`;
    const matchingWishBody = matchingWishes.length
      ? `<div class="table-wrap"><table><thead><tr><th scope="col">Ønske</th><th scope="col">Erfaring</th><th scope="col">Fylke</th></tr></thead><tbody>${matchingWishes.map((wish) => `<tr><td>${lookupLink(wish.id, 'wishes')}</td><td>${escapeHtml(wish.erfaring)}</td><td>${escapeHtml(wish.location)}</td></tr>`).join('')}</tbody></table></div>`
      : '<div class="empty-state compact"><h3>Ingen matchende ønsker tilgjengelig for øyeblikket.</h3></div>';
    const incomingRequestsBody = incomingRequests.length
      ? `<div class="table-wrap home-requests-table-wrap"><table class="home-requests-table"><thead><tr><th scope="col">Forespørsel</th><th scope="col">Ønske</th><th scope="col">Rolle</th><th scope="col">Status</th></tr></thead><tbody>${incomingRequests.map((request) => { const isReceiver = request.mottaker === currentUser.id; return `<tr><td>${lookupLink(request.id, 'requests')}</td><td>${request.wishId ? lookupLink(request.wishId, 'wishes') : '—'}</td><td>${isReceiver ? 'Mottaker' : 'Sender'}</td><td><span class="badge badge-${String(request.status).toLowerCase().replaceAll(' ', '-')}">${escapeHtml(request.status)}</span></td></tr>`; }).join('')}</tbody></table></div>`
      : '<div class="empty-state compact"><h3>Ingen forespørsler tilgjengelig for øyeblikket.</h3></div>';
    const upcomingActivitiesBody = upcomingActivities.length
      ? `<div class="table-wrap home-upcoming-activities-table-wrap"><table class="home-upcoming-activities-table"><thead><tr><th scope="col">Aktivitet</th><th scope="col">Dato</th><th scope="col">Tid</th><th scope="col">Hest</th></tr></thead><tbody>${upcomingActivities.map((activity) => `<tr><td>${lookupLink(activity.id, 'activities')}</td><td>${escapeHtml(formatValue('date', activity.date))}</td><td>${escapeHtml(activity.startTime || '—')}</td><td>${activity.horseId ? lookupLink(activity.horseId, 'horses') : '—'}</td></tr>`).join('')}</tbody></table></div>`
      : '<div class="empty-state compact"><h3>Ingen kommende aktiviteter akkurat nå.</h3></div>';
    const eventsBody = localEvents.length
      ? `<div class="table-wrap"><table><thead><tr><th scope="col">Arrangement</th><th scope="col">Dato</th><th scope="col">Tid</th></tr></thead><tbody>${localEvents.map((event) => `<tr><td>${lookupLink(event.id, 'events')}</td><td>${escapeHtml(formatValue('date', event.date))}</td><td>${escapeHtml(event.startTime)}</td></tr>`).join('')}</tbody></table></div>`
      : '<div class="empty-state compact"><h3>Ingen arrangementer i ditt fylke akkurat nå.</h3></div>';
    const wishPromptInline = showWishPrompt
      ? '<section class="wish-prompt-section"><div class="section-heading"><p class="eyebrow">Kom i gang</p><h2>Begynn reisen din med et ønske</h2><p class="lede">Du kan opprette ønsket ditt her, eller i panelet «Mine ønsker» lenger ned på siden.</p></div><a class="button" href="#create-wish"><span aria-hidden="true">✦</span> Opprett Ønske</a></section>'
      : '';
    const requestsActivitiesSection = hasIncomingRequests || hasUpcomingActivities
      ? `<div class="home-insights-grid home-insights-grid-mid"><article class="home-insight-card"><h3>Mine forespørsler</h3>${incomingRequestsBody}</article><article class="home-insight-card"><h3>Mine kommende aktiviteter</h3>${upcomingActivitiesBody}</article></div>`
      : '';
    return `<section class="home-section home-insights-section"><div class="section-heading"><h2>Hei ${escapeHtml(currentUser.name)}</h2><p class="lede">Se relevante ønsker, forespørsler og arrangementer i nærheten.</p></div>${wishPromptInline}<article class="home-insight-card home-insight-card-full"><h3>Matchende ønsker</h3>${matchingWishBody}</article>${requestsActivitiesSection}<div class="home-insights-grid home-insights-grid-bottom"><article class="home-insight-card"><h3>Arrangementer i samme fylke</h3>${eventsBody}</article><article class="home-insight-card">${ownWishesBody}</article></div></section>`;
  }

  function updateAuthAction() {
    const user = getCurrentUser();
    const isLoggedIn = Boolean(user);
    const action = document.querySelector('[data-auth-action]');
    const notificationAction = document.querySelector('[data-notification-action]');
    const notificationCount = document.querySelector('[data-notification-count]');
    const myHorsesAction = document.querySelector('[data-my-horses-action]');
    document.querySelectorAll('[data-loggedout-only]').forEach((link) => {
      link.hidden = isLoggedIn;
      if (isLoggedIn) link.classList.remove('is-active');
    });
    document.querySelectorAll('[data-auth-only]').forEach((link) => {
      link.hidden = !isLoggedIn;
      if (!isLoggedIn) link.classList.remove('is-active');
    });
    action.textContent = user ? `Logg ut (${user.name})` : 'Logg inn';
    action.href = user ? '#logout' : '#login';
    if (myHorsesAction) {
      const ownsHorse = Boolean(user && data.horses.some((horse) => horse.ownerId === user.id));
      myHorsesAction.hidden = !ownsHorse;
      myHorsesAction.href = ownsHorse ? `#user/${encodeURIComponent(user.id)}/horses` : '#home';
    }
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
    updateAdminOnlyTabs();
  }

  function updateAdminOnlyTabs() {
    const user = getCurrentUser();
    const canSeeAdminTabs = Boolean(user && isAdmin(user));
    ['users', 'horses'].forEach((type) => {
      document.querySelectorAll(`[data-object="${type}"]`).forEach((link) => {
        link.hidden = !canSeeAdminTabs;
        if (!canSeeAdminTabs) link.classList.remove('is-active');
      });
    });
  }

  function renderHome() {
    const currentUser = getCurrentUser();
    const horsePool = currentUser ? data.horses.filter((horse) => horse.location === currentUser.location) : data.horses;
    const horses = [...(horsePool.length ? horsePool : data.horses)].sort(() => Math.random() - .5).slice(0, 3);
    const upcomingActivities = currentUser ? upcomingActivitiesForUser(currentUser.id) : [];
    const nextActivity = upcomingActivities[0] || null;
    const showWishPrompt = Boolean(currentUser) && !hasActiveWishForUser(currentUser.id);
    const homeInsightsSection = renderHomeInsights(currentUser, showWishPrompt);
    const nextActivitySection = currentUser && nextActivity
      ? `<section class="home-section activity-preview"><div><p class="eyebrow">Et glimt av hverdagen</p><h2>Neste aktivitet</h2><p>${escapeHtml(nextActivity.name)}</p></div><div class="activity-preview-details"><div><span>Hest</span><a href="#horse/${nextActivity.horseId}">${escapeHtml(getHorseName(nextActivity.horseId))}</a></div><div><span>Rytter</span><a href="#user/${nextActivity.userId}">${escapeHtml(getUserName(nextActivity.userId))}</a></div><div><span>Når</span><strong>${escapeHtml(nextActivity.date)} · ${escapeHtml(nextActivity.startTime || '—')}</strong></div><div><span>Fylke</span><strong>${escapeHtml(nextActivity.location)}</strong></div></div><span class="badge">${escapeHtml(nextActivity.status || 'Planlagt')}</span></section>`
      : '';
    const choiceSection = currentUser
      ? ''
      : `<section class="home-section"><div class="section-heading"><h2>Hva passer best for deg?</h2></div><div class="choice-grid"><a class="choice-card choice-owner" href="#login/har-hest"><span class="choice-icon" aria-hidden="true">♞</span><strong>Jeg har hest</strong><p>Finn en rytter${currentUser ? ` i ${escapeHtml(currentUser.location)}` : ''} som passer din hest.</p><span class="choice-link">Finn en rytter →</span></a><a class="choice-card choice-rider" href="#login/vil-ri"><span class="choice-icon" aria-hidden="true">⌁</span><strong>Jeg ønsker å ri</strong><p>Finn en hest${currentUser ? ` i ${escapeHtml(currentUser.location)}` : ''} som passer din erfaring og rideønske.</p><span class="choice-link">Utforsk hester →</span></a><a class="choice-card choice-event" href="#login/arrangementer"><span class="choice-icon" aria-hidden="true">◎</span><strong>Utforsk arrangementer</strong><p>Finn arrangementer${currentUser ? ` i ${escapeHtml(currentUser.location)}` : ' i nærheten'} og møt andre hestevenner.</p><span class="choice-link">Se arrangementer →</span></a></div></section>`;
    const howSection = currentUser
      ? ''
      : '<section class="home-section how-section"><div class="section-heading centered"><p class="eyebrow">Enkelt å utforske</p><h2>Slik fungerer HesteVenn</h2></div><div class="steps"><article><div class="step-meta"><span class="step-number">1</span><span class="step-icon" aria-hidden="true">◎</span></div><h3>Opprett en profil</h3><p>Fortell om hesten din, eller del erfaringen og det du liker å gjøre i salen.</p></article><article><div class="step-meta"><span class="step-number">2</span><span class="step-icon" aria-hidden="true">⌕</span></div><h3>Finn en passende hest eller rytter</h3><p>Utforsk profiler som passer med hverdagen, nivået og ønskene dine.</p></article><article><div class="step-meta"><span class="step-number">3</span><span class="step-icon" aria-hidden="true">✦</span></div><h3>Avtal en aktivitet</h3><p>Finn en god ramme for første tur, økt eller møte i stallen.</p></article></div></section>';
    const relatedHorse = currentUser ? data.horses.find((horse) => horse.ownerId === currentUser.id) : null;
    const relatedHorseImage = relatedHorse ? getProfileImage(relatedHorse) : '';
    const heroVisual = relatedHorseImage ? `<div class="hero-mark hero-mark-image"><img src="${escapeHtml(relatedHorseImage)}" alt="${escapeHtml(relatedHorse.name)}"></div>` : '<div class="hero-mark" aria-hidden="true">♞<span>✦</span></div>';
    app.innerHTML = `<div class="home-page">
      <section class="home-hero"><div><p class="eyebrow">Velkommen til HesteVenn</p><h1>Gode dager med hest begynner med riktig match.</h1><p class="lede">Finn en trygg hestevenn, en passende rytter eller neste aktivitet i nærheten.</p></div>${heroVisual}</section>
      ${nextActivitySection}
      ${homeInsightsSection}
      ${choiceSection}
      <section class="home-section nearby-section"><div class="section-heading heading-row"><div><p class="eyebrow">Noen hester i nærheten</p><h2>Møt din neste turkamerat</h2></div><a class="text-link" href="${currentUser ? '#horses' : '#login/se-alle-hester'}">Se alle hester →</a></div><div class="home-horse-grid">${horses.map((horse) => `<article class="home-horse-card"><div class="home-horse-art" aria-hidden="true">♞</div><div class="home-horse-content"><div class="home-horse-title"><h3>${escapeHtml(horse.name)}</h3><span>${horse.age} år</span></div><p>${escapeHtml(horse.breed)} · ${escapeHtml(horse.location)}</p><dl><div><dt>Passer for</dt><dd>${escapeHtml(horse.suitableActivities.join(' og '))}</dd></div><div><dt>Ønsket erfaring</dt><dd>${escapeHtml(horse.experienceRequirement)}</dd></div></dl><a class="button button-outline" href="${currentUser ? `#horse/${horse.id}` : '#login/se-hesteprofil'}">Se profil</a></div></article>`).join('')}</div></section>
      ${howSection}
    </div>`;
  }

  const helperFactory = window.HesteVennHelpers;
  if (!helperFactory) {
    console.error('HesteVennHelpers mangler. Last inn app-helpers.js før script.js.');
    return;
  }

  const {
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
  } = helperFactory({ data, singular, state, recordIndex });

  const listViewsFactory = window.HesteVennListViews;
  if (!listViewsFactory) {
    console.error('HesteVennListViews mangler. Last inn list-views.js før script.js.');
    return;
  }

  const {
    markSearchCacheDirty,
    renderObjectList
  } = listViewsFactory({
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
    searchDebounceMs: 180
  });

  const {
    loadLocalRecords,
    saveRecordEdit,
    applySavedRecordEdits,
    saveLocalRecord,
    syncLocalType,
    getCurrentUser: getCurrentUserFromPersistence,
    setCurrentUserId,
    clearCurrentUser,
    getProfileImage,
    saveProfileImage,
    getEventParticipants,
    toggleEventParticipant,
    getUserNotifications,
    addNotification,
    markNotificationsRead,
    unreadNotificationCount
  } = persistenceFactory({ data, labels, idPrefixes, recordIndex, onTypeChanged: markSearchCacheDirty });

  function getCurrentUser() {
    return getCurrentUserFromPersistence();
  }

  const detailViewFactory = window.HesteVennDetailView;
  if (!detailViewFactory) {
    console.error('HesteVennDetailView mangler. Last inn detail-view.js før script.js.');
    return;
  }

  const {
    renderDetail
  } = detailViewFactory({
    app,
    data,
    singular,
    labels,
    detailFields,
    getRecordById,
    getUserName,
    lookupLink,
    escapeHtml,
    formatValue,
    getCurrentUser,
    canCreateRecord,
    canEditRecord,
    isWishOwnedByUser,
    getProfileImage,
    saveProfileImage,
    getEventParticipants,
    toggleEventParticipant,
    updateRequestStatus,
    createActivityFromApprovedRequest,
    addNotification,
    updateAuthAction,
    syncLocalType,
    syncActivityFromRequest,
    compressImage
  });

  const formsWishFlowFactory = window.HesteVennFormsWishFlow;
  if (!formsWishFlowFactory) {
    console.error('HesteVennFormsWishFlow mangler. Last inn forms-wish-flow.js før script.js.');
    return;
  }

  const {
    renderCreateWishFlowStep1,
    renderCreateWishFlowStep2,
    renderCreateWishFlowStep3,
    renderEditForm,
    renderCreateForm
  } = formsWishFlowFactory({
    app,
    data,
    state,
    idPrefixes,
    singular,
    createLabels,
    createFields,
    getCurrentUser,
    canCreateRecord,
    canEditRecord,
    isAdmin,
    getProfil,
    getHorseName,
    getRecordById,
    escapeHtml,
    compressImage,
    saveLocalRecord,
    saveRecordEdit,
    syncLocalType,
    saveProfileImage,
    addNotification,
    generateNextRequestName,
    updateNavigation
  });

  function renderLogin(intent = '') {
    const loginLedeByIntent = {
      'har-hest': 'Logg inn for å finne en rytter som passer din hest.',
      'vil-ri': 'Logg inn for å finne en hest som passer din erfaring og rideønske.',
      arrangementer: 'Logg inn for å utforske arrangementer og møte andre hestevenner.',
      'se-alle-hester': 'Logg inn for å se alle hester i nærheten.',
      'se-hesteprofil': 'Logg inn for å se hesteprofilen og finne en passende turkamerat.'
    };
    const normalizedIntent = String(intent || '').trim().toLowerCase();
    const loginLede = loginLedeByIntent[normalizedIntent] || 'Oppgi e-post for å logge inn. Passord er ikke nødvendig i denne prototypen.';
    app.innerHTML = `<a class="back-link" href="#home">← Til Min Side</a><section class="page-heading"><div><p class="eyebrow">Lokal innlogging</p><h1>Logg inn</h1><p class="lede">${escapeHtml(loginLede)}</p></div></section><form class="profile-form detail-panel" id="login-form"><div class="form-grid"><label class="form-wide"><span>E-post</span><input name="email" type="email" required placeholder="navn@epost.no" autocomplete="email"></label></div><div class="form-actions"><a class="button button-secondary" href="#register-user">Registrer Bruker</a><button class="button" type="submit">Logg inn</button></div><p class="form-error" role="alert" hidden></p></form>`;
    document.querySelector('#login-form').addEventListener('submit', (event) => {
      event.preventDefault();
      const formValues = new FormData(event.currentTarget);
      const message = event.currentTarget.querySelector('.form-error');
      const email = String(formValues.get('email') || '').trim().toLowerCase();
      message.hidden = true;
      const matchingUser = data.users.find((user) => user.active && String(user.email || '').trim().toLowerCase() === email);
      if (!matchingUser) {
        message.textContent = 'Fant ingen aktiv bruker med denne e-posten.';
        message.hidden = false;
        return;
      }
      setCurrentUserId(matchingUser.id);
      updateAuthAction();
      window.location.hash = '#home';
    });
    updateNavigation('', true);
  }

  function renderRegisterUser() {
    app.innerHTML = `<a class="back-link" href="#login">← Til Logg inn</a><section class="page-heading"><div><p class="eyebrow">Ny bruker</p><h1>Registrer Bruker</h1></div></section><form class="profile-form detail-panel" id="register-user-form"><div class="form-grid"><label><span>Navn</span><input name="name" required placeholder="For eksempel Ola Nordmann"></label><label><span>Rolle</span><select name="role" required><option value="Rytter">Rytter</option><option value="Hesteeier">Hesteeier</option><option value="Begge">Begge</option></select></label><label><span>Fylke</span><input name="location" required placeholder="For eksempel Agder"></label><label><span>E-post</span><input name="email" type="email" required placeholder="navn@epost.no" autocomplete="email"></label><label><span>Telefon</span><input name="phone" type="tel" placeholder="+47 400 00 000"></label><label><span>Erfaringsnivå</span><select name="experienceLevel" required><option value="">Velg nivå</option><option value="Nybegynner">Nybegynner</option><option value="Øvet">Øvet</option><option value="Erfaren">Erfaren</option></select></label></div><div class="form-actions"><a class="button button-secondary" href="#login">Avbryt</a><button class="button" type="submit">Opprett bruker</button></div><p class="form-error" role="alert" hidden></p></form>`;

    document.querySelector('#register-user-form').addEventListener('submit', (event) => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(event.currentTarget));
      const message = event.currentTarget.querySelector('.form-error');
      const name = String(values.name || '').trim();
      const location = String(values.location || '').trim();
      const experienceLevel = String(values.experienceLevel || '').trim();
      const email = String(values.email || '').trim().toLowerCase();
      message.hidden = true;
      if (!name || !location || !experienceLevel || !email) {
        message.textContent = 'Navn, Fylke, E-post og Erfaringsnivå er obligatoriske felter.';
        message.hidden = false;
        return;
      }
      const emailInUse = data.users.some((user) => String(user.email || '').trim().toLowerCase() === email);
      if (emailInUse) {
        message.textContent = 'E-postadressen er allerede i bruk.';
        message.hidden = false;
        return;
      }
      const record = {
        id: `${idPrefixes.users}-LOCAL-${Date.now()}`,
        name,
        role: String(values.role || 'Rytter').trim(),
        profil: 'User',
        location,
        experienceLevel,
        yearsOfExperience: 0,
        email,
        phone: String(values.phone || '').trim(),
        biography: '',
        active: true
      };
      saveLocalRecord('users', record);
      setCurrentUserId(record.id);
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
      renderLogin(parts[1] ? decodeURIComponent(parts[1]) : '');
      return;
    }
    if (parts[0] === 'register-user') {
      renderRegisterUser();
      return;
    }
    if (parts[0] === 'notifications') {
      renderNotifications();
      return;
    }
    if (parts[0] === 'min-profil') {
      const currentUser = getCurrentUser();
      if (!currentUser) { window.location.hash = '#login'; return; }
      window.location.hash = `#user/${encodeURIComponent(currentUser.id)}`;
      return;
    }
    if (parts[0] === 'logout') {
      clearCurrentUser();
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
    if (parts[0] === 'edit') {
      const editType = Object.keys(singular).find((key) => singular[key] === parts[1]);
      const editId = parts[2] ? decodeURIComponent(parts[2]) : '';
      const returnTab = parts[3] || '';
      if (editType && editId) {
        renderEditForm(editType, editId, returnTab);
        return;
      }
      window.location.hash = '#home';
      return;
    }
    const type = labels[parts[0]] ? parts[0] : Object.keys(singular).find((key) => singular[key] === parts[0]);
    if (type && data[type]) {
      const isFilterRoute = parts[1] === 'filter';
      const recordId = isFilterRoute ? null : (parts[1] ? decodeURIComponent(parts[1]) : null);
      if (type === 'users') {
        const currentUser = getCurrentUser();
        if (!currentUser) {
          window.location.hash = '#login';
          return;
        }
        const canAccessOwnProfile = Boolean(recordId && recordId === currentUser.id);
        if (!isAdmin(currentUser) && !canAccessOwnProfile) {
          window.location.hash = '#home';
          return;
        }
      }
      if (type === 'horses') {
        const currentUser = getCurrentUser();
        const horseRecord = recordId ? getRecordById('horses', recordId) : null;
        const canAccessOwnHorse = Boolean(currentUser && horseRecord && horseRecord.ownerId === currentUser.id);
        if (!currentUser || (!isAdmin(currentUser) && !canAccessOwnHorse)) {
          window.location.hash = '#home';
          return;
        }
      }
      navigateToRecord(type, recordId, isFilterRoute ? null : parts[2], isFilterRoute ? parts.slice(1) : []);
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
  applySavedRecordEdits();
  normalizeUserProfiler();
  updateAuthAction();
  renderRoute();
}());