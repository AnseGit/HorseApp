window.HesteVennDetailView = function createHesteVennDetailView(context) {
  const {
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
  } = context;

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
  const currentUser = getCurrentUser();
  const related = type === 'horses' ? { requests: relatedRecords('requests', 'horseId', id), wishes: relatedRecords('wishes', 'horseId', id), activities: relatedRecords('activities', 'horseId', id), qualifications: relatedRecords('qualifications', 'horseId', id), incidents: relatedRecords('incidents', 'horseId', id) } : type === 'users' ? { requests: data.requests.filter((request) => request.sender === id || request.mottaker === id || request.userId === id), horses: relatedRecords('horses', 'ownerId', id), wishes: relatedRecords('wishes', 'userId', id), activities: data.activities.filter((activity) => activity.userId === id || activity.mottaker === id), qualifications: relatedRecords('qualifications', 'userId', id) } : {};
  const tabs = type === 'horses' ? [['details', 'Detaljer'], ['requests', `Forespørsler (${related.requests.length})`], ['wishes', `Ønsker (${related.wishes.length})`], ['activities', `Aktiviteter (${related.activities.length})`], ['qualifications', `Kvalifikasjoner (${related.qualifications.length})`], ['incidents', `Hendelser (${related.incidents.length})`]] : type === 'users' ? [['details', 'Detaljer'], ['requests', `Forespørsler (${related.requests.length})`], ['wishes', `Ønsker (${related.wishes.length})`], ['horses', `Hester (${related.horses.length})`], ['activities', `Aktiviteter (${related.activities.length})`], ['qualifications', `Kvalifikasjoner (${related.qualifications.length})`]] : [];
  const isOtherUserProfileView = Boolean(type === 'users' && currentUser && !canEditRecord('users', record, currentUser));
  const tabsToRender = isOtherUserProfileView ? tabs.filter(([value]) => ['details', 'wishes', 'horses', 'qualifications'].includes(value)) : tabs;
  const activeTab = tabsToRender.some(([value]) => value === (tab || 'details')) ? (tab || 'details') : 'details';
  const relationKey = type === 'users' ? (activeTab === 'horses' ? 'horses' : activeTab) : activeTab;
  const supportsImage = type === 'users' || type === 'horses';
  const imageSource = supportsImage ? getProfileImage(record) : '';
  const profileMedia = supportsImage ? `<div class="profile-media">${imageSource ? `<img src="${escapeHtml(imageSource)}" alt="${escapeHtml(record.name)}">` : `<div class="profile-image-placeholder" aria-hidden="true">${type === 'horses' ? '♞' : escapeHtml(record.name.charAt(0))}</div>`}<label class="image-upload-button"><span>${imageSource ? 'Bytt bilde' : 'Legg til bilde'}</span><input type="file" accept="image/jpeg,image/png,image/webp" data-profile-image></label><p class="image-upload-error" role="alert" hidden></p></div>` : '';
  const canCreateQualificationOnOwnProfile = Boolean(type === 'users' && relationKey === 'qualifications' && currentUser && currentUser.id === id);
  const createRelated = tabsToRender.length && activeTab !== 'details' && (canCreateRecord(relationKey, currentUser) || canCreateQualificationOnOwnProfile)
    ? `<div class="related-toolbar"><div><strong>${labels[relationKey]}</strong><span>${related[relationKey].length} poster relatert til ${escapeHtml(record.name)}</span></div><a class="button" href="#new-${singular[relationKey]}/${singular[type]}/${encodeURIComponent(id)}/${activeTab}">+ Legg Til</a></div>`
    : '';
  const participants = type === 'events' ? getEventParticipants(record) : [];
  const eventRecord = type === 'events' ? { ...record, participantIds: participants } : record;
  const visibleDetailFields = type === 'users' && isOtherUserProfileView
    ? [['name', 'Navn'], ['location', 'Fylke'], ['experienceLevel', 'Erfaringsnivå'], ['yearsOfExperience', 'År med erfaring'], ['biography', 'Biografi']]
    : type === 'wishes'
    ? [
        ...detailFields[type].filter(([key]) => key === 'userId'),
        ...detailFields[type].filter(([key]) => key === 'status'),
        ...detailFields[type].filter(([key]) => key === 'horseId'),
        ...detailFields[type].filter(([key]) => key === 'ønsketype'),
        ...detailFields[type].filter(([key]) => !['userId', 'status', 'horseId', 'ønsketype'].includes(key))
      ]
    : detailFields[type];
  const body = tabsToRender.length && activeTab !== 'details' ? `${createRelated}${renderRelatedList(relationKey, related[relationKey])}` : `<div class="detail-grid">${visibleDetailFields.map(([key, label]) => `<div class="detail-field"><dt>${label}</dt><dd>${renderDetailValue(key, eventRecord[key])}</dd></div>`).join('')}</div>`;
  const isOwnWish = type === 'wishes' && currentUser ? isWishOwnedByUser(record, currentUser.id) : false;
  const isRequestParticipant = type === 'requests' && currentUser && (record.sender === currentUser.id || record.mottaker === currentUser.id);
  const canProposeNewTime = isRequestParticipant && record.status !== 'Avslått';
  const pendingTimeProposal = type === 'requests' ? record.pendingTimeProposal : null;
  const canRespondToTimeProposal = Boolean(canProposeNewTime && pendingTimeProposal && pendingTimeProposal.toUserId === currentUser.id);
  const requestActionButtons = [];
  if (type === 'requests' && currentUser) {
    if (record.mottaker === currentUser.id && record.status === 'Under behandling') {
      requestActionButtons.push('<button class="button" type="button" data-approve-request-detail>Godkjenn forespørsel</button>');
      requestActionButtons.push('<button class="button button-secondary" type="button" data-reject-request-detail>Avslå forespørsel</button>');
    }
    if (canProposeNewTime) requestActionButtons.push('<button class="button button-secondary" type="button" data-open-reschedule-form>Foreslå nytt tidspunkt</button>');
    if (isRequestParticipant) requestActionButtons.push(`<a class="button button-secondary" href="#request/${encodeURIComponent(record.id)}/message">Send melding</a>`);
  }
  const requestAction = type === 'horses'
    ? (canCreateRecord('requests', currentUser) ? `<a class="button" href="#new-request/horse/${encodeURIComponent(id)}/requests">Legg til forespørsel</a>` : '')
    : type === 'wishes'
      ? (isOwnWish || !canCreateRecord('requests', currentUser) ? '' : `<a class="button" href="#new-request/wish/${encodeURIComponent(id)}/requests">Send forespørsel</a>`)
      : type === 'requests' && currentUser
        ? (requestActionButtons.length ? `<div class="inline-actions">${requestActionButtons.join('')}</div>` : '')
        : '';
  const eventAction = type === 'events' ? currentUser ? `<button class="button" type="button" data-event-participation>${participants.includes(currentUser.id) ? 'Forlat arrangement' : 'Bli med'}</button>` : '<a class="button" href="#login">Logg inn for å delta</a>' : '';
  const primaryAction = requestAction || eventAction;
  const editAction = type !== 'requests' && canEditRecord(type, record, currentUser) ? `<a class="button button-secondary" href="#edit/${singular[type]}/${encodeURIComponent(id)}${activeTab !== 'details' ? `/${activeTab}` : ''}">Endre</a>` : '';
  const detailEditAction = editAction ? `<div class="form-actions">${editAction}</div>` : '';
  const statusBadge = type !== 'wishes' && record.status ? `<span class="badge badge-large badge-${record.status.toLowerCase().replaceAll(' ', '-')}">${escapeHtml(record.status)}</span>` : record.active !== undefined ? `<span class="badge badge-large">${record.active ? 'Aktiv' : 'Inaktiv'}</span>` : '';
  const requestRescheduleSection = type === 'requests' && currentUser
    ? `<section class="detail-panel"><h3>Foreslått tidspunkt</h3><div class="detail-grid"><div class="detail-field"><dt>Gjeldende dato</dt><dd>${escapeHtml(formatValue('date', record.date))}</dd></div><div class="detail-field"><dt>Gjeldende tid</dt><dd>${escapeHtml(record.startTime || '—')}</dd></div></div>${pendingTimeProposal ? `<div class="empty-state compact"><h3>${escapeHtml(getUserName(pendingTimeProposal.fromUserId))} foreslår nytt tidspunkt</h3><p>${escapeHtml(formatValue('date', pendingTimeProposal.date))} kl. ${escapeHtml(pendingTimeProposal.startTime)}${pendingTimeProposal.durationHours ? ` · ${escapeHtml(String(pendingTimeProposal.durationHours))} timer` : ''}${pendingTimeProposal.comment ? `<br>${escapeHtml(pendingTimeProposal.comment)}` : ''}</p>${canRespondToTimeProposal ? '<div class="inline-actions"><button class="button" type="button" data-approve-reschedule>Godkjenn ny tid</button><button class="button button-secondary" type="button" data-reject-reschedule>Avslå ny tid</button><button class="button button-secondary" type="button" data-open-reschedule-form>Foreslå nytt tidspunkt</button></div>' : '<p>Venter på svar fra motpart.</p>'}</div>` : '<p>Ingen aktive forslag til nytt tidspunkt.</p>'}${canProposeNewTime ? `<form id="reschedule-form" class="profile-form" hidden><div class="form-grid"><label><span>Ny dato</span><input name="date" type="date" required value="${escapeHtml(record.date || '')}"></label><label><span>Nytt tidspunkt</span><input name="startTime" type="time" required value="${escapeHtml(record.startTime || '')}"></label><label><span>Varighet (timer)</span><input name="durationHours" type="number" min="0.5" max="12" step="0.5" value="${escapeHtml(String(record.durationHours || 1))}"></label><label class="form-wide"><span>Kommentar</span><textarea name="comment" rows="3" placeholder="For eksempel: passer dette bedre?">${escapeHtml(pendingTimeProposal?.toUserId === currentUser.id ? '' : (pendingTimeProposal?.comment || ''))}</textarea></label></div><div class="form-actions"><button class="button" type="submit">Send forslag</button><button class="button button-secondary" type="button" data-cancel-reschedule>Avbryt</button></div><p class="form-error" role="alert" hidden></p></form>` : ''}</section>`
    : '';
  app.innerHTML = `<a class="back-link" href="#${type}">← Til ${labels[type].toLowerCase()}</a><section class="record-profile-header ${supportsImage ? '' : 'record-profile-header-no-media'}">${profileMedia}<div class="record-header"><div><p class="eyebrow">${labels[type]}</p><h1>${escapeHtml(record.name)}</h1>${primaryAction ? `<div class="record-primary-action">${primaryAction}</div>` : ''}</div><div class="record-actions">${statusBadge}</div></div></section>${tabsToRender.length ? `<nav class="inner-tabs" aria-label="Relaterte poster">${tabsToRender.map(([value, label]) => `<a class="${activeTab === value ? 'is-active' : ''}" href="#${singular[type]}/${id}${value === 'details' ? '' : `/${value}`}"\>${label}</a>`).join('')}</nav>` : ''}<section class="detail-panel">${body}${detailEditAction}</section>${requestRescheduleSection}`;
  const eventParticipation = document.querySelector('[data-event-participation]');
  if (eventParticipation) eventParticipation.addEventListener('click', () => { toggleEventParticipant(id, currentUser.id); renderDetail(type, id, tab); });
  const approveRequestDetail = document.querySelector('[data-approve-request-detail]');
  if (approveRequestDetail) approveRequestDetail.addEventListener('click', () => {
    updateRequestStatus(id, 'Godkjent');
    createActivityFromApprovedRequest(id);
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
  const openRescheduleForm = document.querySelectorAll('[data-open-reschedule-form]');
  openRescheduleForm.forEach((button) => button.addEventListener('click', () => {
    const form = document.querySelector('#reschedule-form');
    if (!form) return;
    form.hidden = false;
    form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }));
  const cancelReschedule = document.querySelector('[data-cancel-reschedule]');
  if (cancelReschedule) cancelReschedule.addEventListener('click', () => {
    const form = document.querySelector('#reschedule-form');
    if (!form) return;
    form.hidden = true;
  });
  const rescheduleForm = document.querySelector('#reschedule-form');
  if (rescheduleForm && currentUser && isRequestParticipant) rescheduleForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const message = event.currentTarget.querySelector('.form-error');
    if (!values.date || !values.startTime) {
      message.textContent = 'Velg både dato og tidspunkt.';
      message.hidden = false;
      return;
    }
    const counterpartId = record.sender === currentUser.id ? record.mottaker : record.sender;
    record.pendingTimeProposal = {
      fromUserId: currentUser.id,
      toUserId: counterpartId,
      date: String(values.date).trim(),
      startTime: String(values.startTime).trim(),
      durationHours: Number(values.durationHours) || record.durationHours || 1,
      comment: String(values.comment || '').trim(),
      createdAt: new Date().toISOString()
    };
    syncLocalType('requests');
    addNotification(counterpartId, `${currentUser.name} foreslo nytt tidspunkt for ${record.name}.`, `#request/${encodeURIComponent(record.id)}`);
    renderDetail(type, id, tab);
    updateAuthAction();
  });
  const approveReschedule = document.querySelector('[data-approve-reschedule]');
  if (approveReschedule && currentUser && canRespondToTimeProposal) approveReschedule.addEventListener('click', () => {
    const proposal = record.pendingTimeProposal;
    if (!proposal) return;
    record.date = proposal.date;
    record.startTime = proposal.startTime;
    record.durationHours = proposal.durationHours;
    record.pendingTimeProposal = null;
    syncLocalType('requests');
    syncActivityFromRequest(record);
    addNotification(proposal.fromUserId, `${currentUser.name} godkjente nytt tidspunkt for ${record.name}.`, `#request/${encodeURIComponent(record.id)}`);
    renderDetail(type, id, tab);
    updateAuthAction();
  });
  const rejectReschedule = document.querySelector('[data-reject-reschedule]');
  if (rejectReschedule && currentUser && canRespondToTimeProposal) rejectReschedule.addEventListener('click', () => {
    const proposal = record.pendingTimeProposal;
    if (!proposal) return;
    record.pendingTimeProposal = null;
    syncLocalType('requests');
    addNotification(proposal.fromUserId, `${currentUser.name} avslo nytt tidspunkt for ${record.name}.`, `#request/${encodeURIComponent(record.id)}`);
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

  return { renderDetail };
};
