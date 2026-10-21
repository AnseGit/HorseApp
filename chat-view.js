window.HesteVennChatView = function createHesteVennChatView(context) {
  const {
    app,
    data,
    idPrefixes,
    getCurrentUser,
    getRecordById,
    getUserName,
    escapeHtml,
    saveLocalRecord,
    syncLocalType,
    addNotification,
    updateNavigation
  } = context;

  function isConversationParticipant(conversation, userId) {
    if (!conversation || !Array.isArray(conversation.participantIds)) return false;
    return conversation.participantIds.includes(userId);
  }

  function byNewest(left, right) {
    const leftAt = new Date(left?.lastMessageAt || left?.updatedAt || left?.createdAt || 0).getTime();
    const rightAt = new Date(right?.lastMessageAt || right?.updatedAt || right?.createdAt || 0).getTime();
    return rightAt - leftAt;
  }

  function findConversationForRequest(request) {
    if (!request) return null;
    return data.conversations.find((conversation) => {
      if (conversation.requestId !== request.id) return false;
      const participants = conversation.participantIds || [];
      return participants.includes(request.sender) && participants.includes(request.mottaker);
    }) || null;
  }

  function updateConversationMetadata(conversationId) {
    const conversation = getRecordById('conversations', conversationId);
    if (!conversation) return;
    const orderedMessages = data.messages
      .filter((message) => message.conversationId === conversationId)
      .sort((left, right) => new Date(left.createdAt || 0).getTime() - new Date(right.createdAt || 0).getTime());
    const latestMessage = orderedMessages[orderedMessages.length - 1] || null;
    conversation.lastMessageAt = latestMessage?.createdAt || conversation.updatedAt || conversation.createdAt;
    conversation.lastMessagePreview = latestMessage ? String(latestMessage.body || '').slice(0, 120) : '';
    conversation.updatedAt = conversation.lastMessageAt;
    syncLocalType('conversations');
  }

  function ensureConversationForRequest(requestId) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      window.location.hash = '#login';
      return null;
    }
    const request = getRecordById('requests', requestId);
    if (!request) return null;
    const isParticipant = request.sender === currentUser.id || request.mottaker === currentUser.id;
    if (!isParticipant) return null;

    const existing = findConversationForRequest(request);
    if (existing) return existing;

    const counterpartId = request.sender === currentUser.id ? request.mottaker : request.sender;
    const conversation = {
      id: `${idPrefixes.conversations}-LOCAL-${Date.now()}`,
      name: `Samtale om ${request.name}`,
      requestId: request.id,
      participantIds: [request.sender, request.mottaker],
      status: 'Aktiv',
      createdBy: currentUser.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString(),
      lastMessagePreview: 'Samtalen er startet.'
    };
    saveLocalRecord('conversations', conversation);

    const message = {
      id: `${idPrefixes.messages}-LOCAL-${Date.now() + 1}`,
      conversationId: conversation.id,
      requestId: request.id,
      senderId: currentUser.id,
      body: `Hei! Jeg oppretter en samtale for ${request.name} så vi kan avtale tidspunkt og detaljer her.`,
      createdAt: new Date().toISOString(),
      readByUserIds: [currentUser.id],
      type: 'text'
    };
    saveLocalRecord('messages', message);
    updateConversationMetadata(conversation.id);

    addNotification(counterpartId, `${currentUser.name} startet en samtale for ${request.name}.`, `#message/${encodeURIComponent(conversation.id)}`);
    return conversation;
  }

  function unreadCountForConversation(conversation, userId) {
    if (!conversation || !userId) return 0;
    return data.messages
      .filter((message) => message.conversationId === conversation.id)
      .filter((message) => message.senderId !== userId)
      .filter((message) => !Array.isArray(message.readByUserIds) || !message.readByUserIds.includes(userId)).length;
  }

  function markConversationRead(conversationId, userId) {
    let changed = false;
    data.messages
      .filter((message) => message.conversationId === conversationId)
      .forEach((message) => {
        if (message.senderId === userId) return;
        if (!Array.isArray(message.readByUserIds)) message.readByUserIds = [];
        if (!message.readByUserIds.includes(userId)) {
          message.readByUserIds.push(userId);
          changed = true;
        }
      });
    if (changed) syncLocalType('messages');
  }

  function renderInbox() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      window.location.hash = '#login';
      return;
    }

    const conversations = data.conversations
      .filter((conversation) => isConversationParticipant(conversation, currentUser.id))
      .sort(byNewest);

    app.innerHTML = `<a class="back-link" href="#home">← Til Min Side</a><section class="page-heading"><div><p class="eyebrow">Meldinger</p><h1>Innboks</h1><p class="lede">Samtaler knyttet til forespørsler.</p></div></section><section class="detail-panel">${conversations.length ? `<div class="chat-inbox-list">${conversations.map((conversation) => { const counterpartId = (conversation.participantIds || []).find((id) => id !== currentUser.id) || ''; const request = conversation.requestId ? getRecordById('requests', conversation.requestId) : null; const unread = unreadCountForConversation(conversation, currentUser.id); return `<a class="chat-inbox-item" href="#message/${encodeURIComponent(conversation.id)}"><div><strong>${escapeHtml(getUserName(counterpartId) || 'Ukjent bruker')}</strong><p>${escapeHtml(conversation.lastMessagePreview || 'Ingen meldinger ennå.')}</p><small>${request ? `Forespørsel: ${escapeHtml(request.name)}` : 'Ikke knyttet til forespørsel'}</small></div><div class="chat-inbox-meta"><small>${escapeHtml(new Date(conversation.lastMessageAt || conversation.updatedAt || conversation.createdAt || Date.now()).toLocaleString('nb-NO'))}</small>${unread ? `<span class="badge">${unread} ulest</span>` : ''}</div></a>`; }).join('')}</div>` : '<div class="empty-state compact"><h3>Ingen samtaler ennå.</h3><p>Åpne en forespørsel og trykk Send melding for å starte.</p></div>'}</section>`;
    updateNavigation('');
  }

  function renderConversation(conversationId) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      window.location.hash = '#login';
      return;
    }

    const conversation = getRecordById('conversations', conversationId);
    if (!conversation || !isConversationParticipant(conversation, currentUser.id)) {
      window.location.hash = '#messages';
      return;
    }

    const request = conversation.requestId ? getRecordById('requests', conversation.requestId) : null;
    const counterpartId = (conversation.participantIds || []).find((id) => id !== currentUser.id) || '';

    const messages = data.messages
      .filter((message) => message.conversationId === conversation.id)
      .sort((left, right) => new Date(left.createdAt || 0).getTime() - new Date(right.createdAt || 0).getTime());

    markConversationRead(conversation.id, currentUser.id);

    app.innerHTML = `<a class="back-link" href="#messages">← Til Innboks</a><section class="page-heading"><div><p class="eyebrow">Samtale</p><h1>${escapeHtml(getUserName(counterpartId) || 'Ukjent bruker')}</h1><p class="lede">${request ? `Knyttet til ${escapeHtml(request.name)}.` : 'Denne samtalen er ikke knyttet til en forespørsel.'}</p></div><div class="page-actions">${request ? `<a class="button button-secondary" href="#request/${encodeURIComponent(request.id)}">Se forespørsel</a>` : ''}</div></section><section class="detail-panel chat-thread">${messages.length ? messages.map((message) => { const mine = message.senderId === currentUser.id; return `<article class="chat-message ${mine ? 'is-mine' : ''}"><header><strong>${escapeHtml(getUserName(message.senderId))}</strong><small>${escapeHtml(new Date(message.createdAt || Date.now()).toLocaleString('nb-NO'))}</small></header><p>${escapeHtml(message.body || '')}</p></article>`; }).join('') : '<div class="empty-state compact"><h3>Ingen meldinger ennå.</h3></div>'}</section><form class="profile-form detail-panel" id="chat-message-form"><div class="form-grid"><label class="form-wide"><span>Melding</span><textarea name="body" rows="4" required placeholder="Skriv en melding om tidspunkt, sted eller annet praktisk..."></textarea></label></div><div class="form-actions"><button class="button" type="submit">Send melding</button></div><p class="form-error" role="alert" hidden></p></form>`;

    document.querySelector('#chat-message-form').addEventListener('submit', (event) => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(event.currentTarget));
      const body = String(values.body || '').trim();
      const messageElement = event.currentTarget.querySelector('.form-error');
      if (!body) {
        messageElement.textContent = 'Skriv en melding før du sender.';
        messageElement.hidden = false;
        return;
      }
      const newMessage = {
        id: `${idPrefixes.messages}-LOCAL-${Date.now()}`,
        conversationId: conversation.id,
        requestId: conversation.requestId || '',
        senderId: currentUser.id,
        body,
        createdAt: new Date().toISOString(),
        readByUserIds: [currentUser.id],
        type: 'text'
      };
      saveLocalRecord('messages', newMessage);

      conversation.updatedAt = newMessage.createdAt;
      conversation.lastMessageAt = newMessage.createdAt;
      conversation.lastMessagePreview = body.slice(0, 120);
      syncLocalType('conversations');

      if (counterpartId) addNotification(counterpartId, `Ny melding i ${request ? request.name : 'samtalen'}.`, `#message/${encodeURIComponent(conversation.id)}`);
      renderConversation(conversation.id);
    });

    updateNavigation('');
  }

  function openConversationForRequest(requestId) {
    const conversation = ensureConversationForRequest(requestId);
    if (!conversation) {
      window.location.hash = '#requests';
      return;
    }
    window.location.hash = `#message/${encodeURIComponent(conversation.id)}`;
  }

  return {
    renderInbox,
    renderConversation,
    openConversationForRequest
  };
};
