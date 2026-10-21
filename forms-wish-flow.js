window.HesteVennFormsWishFlow = function createHesteVennFormsWishFlow(context) {
  const {
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
  } = context;

function composeUserName(firstName, lastName) {
  return [String(firstName || '').trim(), String(lastName || '').trim()].filter(Boolean).join(' ').trim();
}

function userFirstName(user) {
  const explicit = String(user?.firstName || '').trim();
  if (explicit) return explicit;
  return String(user?.name || '').trim().split(/\s+/).filter(Boolean)[0] || 'Bruker';
}

function createWishFlowDefaults() {
  const currentUser = getCurrentUser();
  return {
    ønsketype: '',
    location: currentUser?.location || '',
    address: '',
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
  const currentUser = getCurrentUser();
  if (!canCreateRecord('wishes', currentUser)) {
    window.location.hash = '#login';
    return;
  }
  state.wishFlow = createWishFlowDefaults();
  app.innerHTML = `<a class="back-link" href="#home">← Til Min Side</a><section class="page-heading"><div><p class="eyebrow">Opprett Ønske · 1 av 3</p><h1>Velg ønsketype</h1><p class="lede">Start med å fortelle om du ønsker å ri, ønsker en rytter eller ønsker hest på fôr.</p></div></section><form class="profile-form detail-panel" id="wish-flow-step-1"><div class="form-grid"><label class="form-wide"><span>Ønsketype</span><select name="ønsketype" required><option value="">Velg ønsketype</option><option value="Ønsker å Ri">Ønsker å Ri</option><option value="Ønsker en rytter">Ønsker en rytter</option><option value="Hest på fôr">Hest på fôr</option></select></label></div><div class="form-actions"><a class="button button-secondary" href="#home">Avbryt</a><button class="button" type="submit">Neste</button></div></form>`;
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
  const currentUser = getCurrentUser();
  const needsHorse = flow.ønsketype === 'Ønsker en rytter';
  const ownHorses = currentUser ? data.horses.filter((horse) => horse.ownerId === currentUser.id) : [];
  const ownHorseIds = new Set(ownHorses.map((horse) => horse.id));
  const horseField = needsHorse
    ? `<label><span>Hest</span><select name="horseId" required><option value="">${ownHorses.length ? 'Velg hest' : 'Ingen hester knyttet til profilen din'}</option>${ownHorses.map((horse) => `<option value="${escapeHtml(horse.id)}" ${flow.horseId === horse.id ? 'selected' : ''}>${escapeHtml(horse.name)} · ${escapeHtml(horse.location)}</option>`).join('')}</select></label>`
    : '';
  app.innerHTML = `<a class="back-link" href="#create-wish">← Tilbake</a><section class="page-heading"><div><p class="eyebrow">Opprett Ønske · 2 av 3</p><h1>${escapeHtml(flow.ønsketype)}</h1><p class="lede">Svar på spørsmålene under for å opprette ønsket ditt.</p></div></section><form class="profile-form detail-panel" id="wish-flow-step-2"><div class="form-grid"><label><span>Fylke</span><input name="location" required value="${escapeHtml(flow.location)}"></label><label><span>Adresse</span><input name="address"${needsHorse ? ' required' : ''} value="${escapeHtml(flow.address)}" placeholder="For eksempel Stallveien 12, 4630 Kristiansand"></label><label><span>Erfaring</span><select name="erfaring" required><option value="Nybegynner" ${flow.erfaring === 'Nybegynner' ? 'selected' : ''}>Nybegynner</option><option value="Lett øvet" ${flow.erfaring === 'Lett øvet' ? 'selected' : ''}>Lett øvet</option><option value="Erfaren" ${flow.erfaring === 'Erfaren' ? 'selected' : ''}>Erfaren</option><option value="Profesjonell" ${flow.erfaring === 'Profesjonell' ? 'selected' : ''}>Profesjonell</option></select></label><label><span>Aktivitetstype</span><select name="aktivitetstype" required><option value="Engangstilfelle" ${flow.aktivitetstype === 'Engangstilfelle' ? 'selected' : ''}>Engangstilfelle</option><option value="Månedlig" ${flow.aktivitetstype === 'Månedlig' ? 'selected' : ''}>Månedlig</option><option value="Ukentlig" ${flow.aktivitetstype === 'Ukentlig' ? 'selected' : ''}>Ukentlig</option><option value="Daglig" ${flow.aktivitetstype === 'Daglig' ? 'selected' : ''}>Daglig</option><option value="Periode" ${flow.aktivitetstype === 'Periode' ? 'selected' : ''}>Periode</option></select></label><label><span>Størrelse på hest</span><select name="størrelsePåHest" required><option value="Liten" ${flow.størrelsePåHest === 'Liten' ? 'selected' : ''}>Liten</option><option value="Mellom" ${flow.størrelsePåHest === 'Mellom' ? 'selected' : ''}>Mellom</option><option value="Stor" ${flow.størrelsePåHest === 'Stor' ? 'selected' : ''}>Stor</option></select></label><label><span>Ridestil</span><select name="ridestil" required><option value="Tur" ${flow.ridestil === 'Tur' ? 'selected' : ''}>Tur</option><option value="Dressur" ${flow.ridestil === 'Dressur' ? 'selected' : ''}>Dressur</option><option value="Sprang" ${flow.ridestil === 'Sprang' ? 'selected' : ''}>Sprang</option><option value="Fôr" ${flow.ridestil === 'Fôr' ? 'selected' : ''}>Fôr</option></select></label>${horseField}<label class="form-wide"><span>Kvalifikasjoner</span><input name="qualifications" value="${escapeHtml(flow.qualifications)}" placeholder="For eksempel Trygg på tur, Grunnleggende håndtering"></label><label class="form-wide"><span>Kommentar</span><textarea name="comment" rows="5">${escapeHtml(flow.comment)}</textarea></label></div><div class="form-actions"><a class="button button-secondary" href="#create-wish">Tilbake</a><button class="button" type="submit">Opprett ønske</button></div><p class="form-error" role="alert" hidden></p></form>`;
  const buildWishAutoName = (wishType, currentUser, selectedHorseId, formValues) => {
    const firstName = userFirstName(currentUser);
    const horseName = selectedHorseId ? getHorseName(selectedHorseId) : '';
    const ridestil = String(formValues.ridestil || '').trim().toLowerCase();
    const erfaring = String(formValues.erfaring || '').trim().toLowerCase();

    if (wishType === 'Ønsker en rytter') {
      return `${horseName || 'Hest'} ønsker ${erfaring || 'erfaren'} rytter`;
    }
    if (wishType === 'Hest på fôr') {
      return `${firstName} ønsker ${erfaring || 'erfaren'} hest på fôr`;
    }
    return `${firstName} ønsker å ri ${ridestil || 'tur'}`;
  };
  document.querySelector('#wish-flow-step-2').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    const wishType = flow.ønsketype;
    const horseId = wishType === 'Ønsker en rytter' ? (values.horseId || '').trim() : '';
    const userId = wishType === 'Ønsker en rytter' ? '' : (currentUser?.id || '');
    const message = form.querySelector('.form-error');
    if (wishType === 'Ønsker en rytter' && !horseId) {
      message.textContent = 'Velg hest for ønsket ditt.';
      message.hidden = false;
      return;
    }
    if (wishType === 'Ønsker en rytter' && !ownHorseIds.has(horseId)) {
      message.textContent = 'Du kan bare velge hester knyttet til din profil.';
      message.hidden = false;
      return;
    }
    const autoName = buildWishAutoName(wishType, currentUser, horseId, values);
    const record = {
      id: `${idPrefixes.wishes}-LOCAL-${Date.now()}`,
      name: autoName,
      userId,
      horseId,
      location: values.location.trim(),
      address: String(values.address || '').trim(),
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
    window.location.hash = '#home';
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

function renderEditField(field, record, isLocked = false) {
  const value = record[field.key];
  const isArray = field.array;
  const normalizedValue = isArray ? (Array.isArray(value) ? value.join(', ') : '') : (value ?? '');
  const attributes = `${field.required ? ' required' : ''}${field.min !== undefined ? ` min="${field.min}"` : ''}${field.max !== undefined ? ` max="${field.max}"` : ''}${field.step !== undefined ? ` step="${field.step}"` : ''}${field.autocomplete ? ` autocomplete="${field.autocomplete}"` : ''}${field.placeholder ? ` placeholder="${escapeHtml(field.placeholder)}"` : ''}`;
  let control;
  if (field.type === 'image') return '';
  if (isLocked) {
    if (field.type === 'reference') {
      const labelText = normalizedValue ? getRecordById(field.source, normalizedValue)?.name || normalizedValue : '—';
      control = `<input value="${escapeHtml(labelText)}" disabled><input type="hidden" name="${field.key}" value="${escapeHtml(normalizedValue)}">`;
    } else if (field.type === 'select') {
      control = `<select disabled>${field.options.map((option) => `<option value="${escapeHtml(option)}" ${String(option) === String(normalizedValue) ? 'selected' : ''}>${escapeHtml(option)}</option>`).join('')}</select><input type="hidden" name="${field.key}" value="${escapeHtml(normalizedValue)}">`;
    } else {
      control = `<input value="${escapeHtml(normalizedValue)}" disabled><input type="hidden" name="${field.key}" value="${escapeHtml(normalizedValue)}">`;
    }
    return `<label class="${field.wide ? 'form-wide' : ''}"><span>${field.label}</span>${control}</label>`;
  }
  if (field.type === 'select') {
    control = `<select name="${field.key}"${attributes}>${field.options.map((option) => `<option value="${escapeHtml(option)}" ${String(option) === String(normalizedValue) ? 'selected' : ''}>${escapeHtml(option)}</option>`).join('')}</select>`;
  } else if (field.type === 'reference') {
    const options = `<option value="">Velg ${field.label.toLowerCase()}</option>${data[field.source].map((item) => `<option value="${escapeHtml(item.id)}" ${item.id === normalizedValue ? 'selected' : ''}>${escapeHtml(item.name)}</option>`).join('')}`;
    control = `<select name="${field.key}"${attributes}>${options}</select>`;
  } else if (field.type === 'textarea') {
    control = `<textarea name="${field.key}" rows="5"${attributes}>${escapeHtml(normalizedValue)}</textarea>`;
  } else {
    control = `<input name="${field.key}" type="${field.type || 'text'}" value="${escapeHtml(normalizedValue)}"${attributes}>`;
  }
  return `<label class="${field.wide ? 'form-wide' : ''}"><span>${field.label}</span>${control}</label>`;
}

function renderEditForm(type, id, returnTab) {
  const record = getRecordById(type, id);
  if (!record) { window.location.hash = `#${type}`; return; }
  if (type === 'requests') {
    app.innerHTML = '<div class="empty-state"><h2>Forespørsel kan ikke redigeres direkte</h2><p>Bruk knappen «Foreslå nytt tidspunkt» på forespørselen for å endre tid.</p></div>';
    return;
  }
  const currentUser = getCurrentUser();
  if (!canEditRecord(type, record, currentUser)) {
    app.innerHTML = '<div class="empty-state"><h2>Du kan ikke redigere denne posten</h2><p>Kun egne poster kan redigeres.</p></div>';
    return;
  }
  const fields = (createFields[type] || []).filter((field) => field.type !== 'image');
  const lockedWishFields = type === 'wishes' ? new Set(['userId', 'ønsketype']) : new Set();
  const lockedUserRoleFields = type === 'users' && !isAdmin(currentUser) ? new Set(['profil']) : new Set();
  const returnUrl = `#${singular[type]}/${encodeURIComponent(id)}${returnTab ? `/${returnTab}` : ''}`;
  app.innerHTML = `<a class="back-link" href="${returnUrl}">← Tilbake</a><section class="page-heading"><div><p class="eyebrow">Rediger post</p><h1>Endre ${escapeHtml(record.name)}</h1><p class="lede">Oppdater feltene under og lagre endringene.</p></div></section><form class="profile-form detail-panel" id="edit-form"><div class="form-grid">${fields.map((field) => renderEditField(field, record, lockedWishFields.has(field.key) || lockedUserRoleFields.has(field.key))).join('')}</div><div class="form-actions"><a class="button button-secondary" href="${returnUrl}">Avbryt</a><button class="button" type="submit">Lagre endringer</button></div><p class="form-error" role="alert" hidden></p></form>`;
  document.querySelector('#edit-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    fields.filter((field) => field.array).forEach((field) => { values[field.key] = String(values[field.key] || '').split(',').map((part) => part.trim()).filter(Boolean); });
    fields.filter((field) => field.type === 'number').forEach((field) => { values[field.key] = Number(values[field.key]); });
    Object.keys(values).forEach((key) => { if (typeof values[key] === 'string') values[key] = values[key].trim(); });
    if (type === 'users') values.name = composeUserName(values.firstName, values.lastName);
    if (type === 'users' && !isAdmin(currentUser)) values.profil = getProfil(record);
    if (type === 'wishes' && Boolean(values.userId) === Boolean(values.horseId)) {
      const message = form.querySelector('.form-error');
      message.textContent = 'Velg enten én bruker eller én hest for ønsket.';
      message.hidden = false;
      return;
    }
    Object.assign(record, values);
    saveRecordEdit(type, record);
    syncLocalType(type);
    window.location.hash = returnUrl;
  });
  updateNavigation(type);
}
function renderCreateForm(type, contextType, contextId, returnTab) {
  const currentUser = getCurrentUser();
  const canCreateQualificationOnOwnProfile = Boolean(type === 'qualifications' && contextType === 'users' && currentUser && contextId === currentUser.id);
  if (!canCreateRecord(type, currentUser) && !canCreateQualificationOnOwnProfile) {
    app.innerHTML = '<div class="empty-state"><h2>Ingen tilgang</h2><p>Du har ikke tilgang til å opprette denne typen post.</p></div>';
    return;
  }
  if (type === 'requests' && contextType === 'wishes' && contextId) {
    const wish = getRecordById('wishes', contextId);
    if (!wish) {
      window.location.hash = '#wishes';
      return;
    }
    const horse = wish.horseId ? getRecordById('horses', wish.horseId) : null;
    const receiverId = wish.userId || horse?.ownerId || '';
    const returnUrl = `#wish/${encodeURIComponent(contextId)}`;
    app.innerHTML = `<a class="back-link" href="${returnUrl}">← Tilbake</a><section class="page-heading"><div><p class="eyebrow">Ny forespørsel</p><h1>Send forespørsel</h1><p class="lede">Velg dato og tidspunkt. Resten fylles inn automatisk fra ønsket.</p></div></section><div class="modal-backdrop"><form class="profile-form detail-panel modal-card" id="quick-request-form"><div class="section-heading"><p class="eyebrow">Ønske</p><h2>${escapeHtml(wish.name || 'Uten navn')}</h2></div><div class="form-grid"><label><span>Dato</span><input name="date" type="date" required></label><label><span>Tidspunkt</span><input name="startTime" type="time" required></label><label class="form-wide"><span>Kommentar (valgfritt)</span><textarea name="comment" rows="3" placeholder="Legg til ekstra informasjon om forespørselen..."></textarea></label></div><div class="form-actions"><a class="button button-secondary" href="${returnUrl}">Avbryt</a><button class="button" type="submit">Send forespørsel</button></div><p class="form-error" role="alert" hidden></p></form></div>`;
    document.querySelector('#quick-request-form').addEventListener('submit', (event) => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(event.currentTarget));
      const message = event.currentTarget.querySelector('.form-error');
      const date = String(values.date || '').trim();
      const startTime = String(values.startTime || '').trim();
      const comment = String(values.comment || '').trim();
      if (!date || !startTime) {
        message.textContent = 'Velg både dato og tidspunkt.';
        message.hidden = false;
        return;
      }
      if (!receiverId) {
        message.textContent = 'Kunne ikke finne mottaker for dette ønsket.';
        message.hidden = false;
        return;
      }
      const record = {
        id: `${idPrefixes.requests}-LOCAL-${Date.now()}`,
        name: generateNextRequestName(),
        wishId: contextId,
        horseId: wish.horseId || '',
        sender: currentUser?.id || '',
        userId: currentUser?.id || '',
        mottaker: receiverId,
        date,
        startTime,
        durationHours: 1,
        activityType: wish.ridestil || 'Tur',
        status: 'Under behandling',
        comment
      };
      saveLocalRecord('requests', record);
      if (record.mottaker) addNotification(record.mottaker, `Ny forespørsel mottatt: ${record.name}.`, `#request/${encodeURIComponent(record.id)}`);
      window.location.hash = `#request/${encodeURIComponent(record.id)}`;
    });
    updateNavigation('requests');
    return;
  }
  const fields = createFields[type];
  const presets = relationPresets(type, contextType, contextId);
  const contextRecord = contextType ? getRecordById(contextType, contextId) : null;
  const returnUrl = contextRecord ? `#${singular[contextType]}/${contextId}/${returnTab}` : `#${type}`;
  const contextText = contextRecord ? ` Relasjonen til ${contextRecord.name} legges til automatisk.` : '';
  app.innerHTML = `<a class="back-link" href="${returnUrl}">← Tilbake</a><section class="page-heading"><div><p class="eyebrow">Ny post</p><h1>Opprett ${createLabels[type]}</h1><p class="lede">Posten lagres lokalt i denne nettleseren.${escapeHtml(contextText)}</p></div></section><form class="profile-form detail-panel" id="create-form"><div class="form-grid">${fields.map((field) => renderCreateField(field, presets)).join('')}</div><div class="form-actions"><a class="button button-secondary" href="${returnUrl}">Avbryt</a><button class="button" type="submit">Lagre ${createLabels[type]}</button></div><p class="form-error" role="alert" hidden></p></form>`;
  if (type === 'wishes') {
    const form = document.querySelector('#create-form');
    const wishTypeSelect = form.querySelector('[name="ønsketype"]');
    const horseSelect = form.querySelector('[name="horseId"]');
    const horseField = horseSelect ? horseSelect.closest('label') : null;
    const addressInput = form.querySelector('[name="address"]');
    const toggleHorseField = () => {
      if (!wishTypeSelect || !horseField || !horseSelect) return;
      const needsHorse = wishTypeSelect.value === 'Ønsker en rytter';
      horseField.hidden = !needsHorse;
      horseSelect.required = needsHorse;
      if (addressInput) addressInput.required = needsHorse;
      if (!needsHorse) horseSelect.value = '';
    };
    if (wishTypeSelect && horseField && horseSelect) {
      wishTypeSelect.addEventListener('change', toggleHorseField);
      toggleHorseField();
    }
  }
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
    if (type === 'users') values.name = composeUserName(values.firstName, values.lastName);
    if (type === 'users') values.profil = 'User';
    if (type === 'requests') {
      if (!values.sender && currentUser) values.sender = currentUser.id;
      if (!values.userId && values.sender) values.userId = values.sender;
      if (!values.mottaker && values.wishId) {
        const wish = getRecordById('wishes', values.wishId);
        values.mottaker = wish?.userId || (wish?.horseId ? getRecordById('horses', wish.horseId)?.ownerId : '');
      }
    }
    if (type === 'requests') values.name = generateNextRequestName();
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

  return {
    renderCreateWishFlowStep1,
    renderCreateWishFlowStep2,
    renderCreateWishFlowStep3,
    renderEditForm,
    renderCreateForm
  };
};
