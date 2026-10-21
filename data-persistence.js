window.HesteVennPersistence = function createHesteVennPersistence(context) {
  const {
    data,
    labels,
    idPrefixes,
    recordIndex,
    onTypeChanged
  } = context;

  const localStorageKeys = Object.fromEntries(Object.keys(data).map((type) => [type, `hestevenn-local-${type}`]));
  const currentUserKey = 'hestevenn-current-user-id';
  const profileImagesKey = 'hestevenn-profile-images';
  const eventAttendanceKey = 'hestevenn-event-attendance';
  const notificationKey = 'hestevenn-notifications';
  const recordEditsKey = 'hestevenn-record-edits';

  function markTypeChanged(type) {
    if (!type) return;
    if (typeof onTypeChanged === 'function') onTypeChanged(type);
  }

  function loadJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (error) {
      return fallback;
    }
  }

  function saveJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function loadLocalRecords() {
    Object.keys(localStorageKeys).forEach((type) => {
      let loadedAny = false;
      const records = loadJson(localStorageKeys[type], []);
      if (Array.isArray(records)) {
        records
          .filter((record) => record && record.id)
          .forEach((record) => {
            data[type].push(record);
            recordIndex.upsert(type, record);
            loadedAny = true;
          });
      } else {
        const label = String(labels[type] || type).toLowerCase();
        console.warn(`Kunne ikke laste lokale ${label}.`);
      }
      if (loadedAny) markTypeChanged(type);
    });
  }

  function getSavedRecordEdits() {
    return loadJson(recordEditsKey, {});
  }

  function saveRecordEdit(type, record) {
    const edits = getSavedRecordEdits();
    if (!edits[type]) edits[type] = {};
    edits[type][record.id] = record;
    saveJson(recordEditsKey, edits);
  }

  function applySavedRecordEdits() {
    const edits = getSavedRecordEdits();
    Object.entries(edits).forEach(([type, recordsById]) => {
      if (!Array.isArray(data[type])) return;
      let changed = false;
      Object.entries(recordsById || {}).forEach(([id, savedRecord]) => {
        const existing = recordIndex.get(type, id);
        if (!existing) return;
        Object.assign(existing, savedRecord);
        recordIndex.upsert(type, existing);
        changed = true;
      });
      if (changed) markTypeChanged(type);
    });
  }

  function saveLocalRecord(type, record) {
    const prefix = `${idPrefixes[type]}-LOCAL-`;
    const localRecords = data[type].filter((item) => item.id.startsWith(prefix));
    saveJson(localStorageKeys[type], [...localRecords, record]);
    data[type].push(record);
    recordIndex.upsert(type, record);
    markTypeChanged(type);
  }

  function syncLocalType(type) {
    const prefix = `${idPrefixes[type]}-LOCAL-`;
    const localRecords = data[type].filter((item) => item.id.startsWith(prefix));
    saveJson(localStorageKeys[type], localRecords);
    markTypeChanged(type);
  }

  function getCurrentUser() {
    const user = recordIndex.get('users', localStorage.getItem(currentUserKey));
    if (!user) localStorage.removeItem(currentUserKey);
    return user;
  }

  function setCurrentUserId(userId) {
    localStorage.setItem(currentUserKey, String(userId || ''));
  }

  function clearCurrentUser() {
    localStorage.removeItem(currentUserKey);
  }

  function getProfileImages() {
    return loadJson(profileImagesKey, {});
  }

  function getProfileImage(record) {
    return getProfileImages()[record.id] || record.imageUrl || '';
  }

  function saveProfileImage(id, imageData) {
    const images = getProfileImages();
    images[id] = imageData;
    saveJson(profileImagesKey, images);
  }

  function getEventAttendance() {
    return loadJson(eventAttendanceKey, {});
  }

  function getEventParticipants(record) {
    const attendance = getEventAttendance();
    return attendance[record.id] || record.participantIds || [];
  }

  function toggleEventParticipant(eventId, userId) {
    const attendance = getEventAttendance();
    const eventRecord = recordIndex.get('events', eventId);
    const participants = new Set(attendance[eventId] || eventRecord?.participantIds || []);
    if (participants.has(userId)) participants.delete(userId);
    else participants.add(userId);
    attendance[eventId] = [...participants];
    saveJson(eventAttendanceKey, attendance);
  }

  function getNotifications() {
    return loadJson(notificationKey, {});
  }

  function saveNotifications(notifications) {
    saveJson(notificationKey, notifications);
  }

  function getUserNotifications(userId) {
    return getNotifications()[userId] || [];
  }

  function addNotification(userId, message, link = '#requests') {
    if (!userId) return;
    const notifications = getNotifications();
    const userNotifications = notifications[userId] || [];
    userNotifications.unshift({
      id: `NOTIFICATION-${Date.now()}`,
      message,
      link,
      read: false,
      createdAt: new Date().toISOString()
    });
    notifications[userId] = userNotifications.slice(0, 50);
    saveNotifications(notifications);
  }

  function markNotificationsRead(userId) {
    if (!userId) return;
    const notifications = getNotifications();
    notifications[userId] = (notifications[userId] || []).map((notification) => ({
      ...notification,
      read: true
    }));
    saveNotifications(notifications);
  }

  function unreadNotificationCount(userId) {
    return getUserNotifications(userId).filter((notification) => !notification.read).length;
  }

  return {
    loadLocalRecords,
    saveRecordEdit,
    applySavedRecordEdits,
    saveLocalRecord,
    syncLocalType,
    getCurrentUser,
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
  };
};