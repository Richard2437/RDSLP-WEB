/* =====================================================
   RDSLP - JavaScript de Comunidad
   Salas Abiertas y Privadas (Con Invitación y Código)
   Gestión de Permisos y Chat en Tiempo Real
===================================================== */

document.addEventListener('DOMContentLoaded', function () {
    if (!window.authManager) {
        console.error('AuthManager no disponible');
        window.location.href = 'login.html';
        return;
    }

    const auth = window.authManager;
    const community = window.communityManager;
    let currentUser = null;
    let currentEventChat = null;
    let currentFilter = 'all'; // 'all', 'public', 'private'

    init();

    function init() {
        checkAuth();
        loadUserData();
        loadChatMessages();
        loadEvents();
        setupEventListeners();
    }

    function checkAuth() {
        if (!auth.isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }
        currentUser = auth.getCurrentUser();
    }

    function loadUserData() {
        if (!currentUser) return;
        const avatarEl = document.getElementById('userAvatar');
        const nameEl = document.getElementById('userName');
        if (avatarEl) avatarEl.textContent = currentUser.name?.charAt(0).toUpperCase() || 'U';
        if (nameEl) nameEl.textContent = currentUser.name || 'Usuario';
    }

    function setupEventListeners() {
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            auth.logout();
            window.location.href = 'login.html';
        });

        // Tabs del chat principal (General / Ayuda)
        document.querySelectorAll('.chat-tab').forEach(tab => {
            tab.addEventListener('click', function () {
                document.querySelectorAll('.chat-tab').forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                currentEventChat = null;
                const header = document.querySelector('.chat-header h3');
                if (header) header.textContent = this.dataset.chat === 'ayuda' ? 'Chat de Ayuda y Soporte' : 'Chat General';
                loadChatMessages(this.dataset.chat);
            });
        });

        // Enviar mensaje
        document.getElementById('sendMessageBtn')?.addEventListener('click', sendMessage);
        document.getElementById('chatInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });

        // Filtros de eventos (Todos / Abiertos / Privados)
        document.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', function () {
                document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
                this.classList.add('active');
                currentFilter = this.dataset.filter || 'all';
                loadEvents();
            });
        });

        // Modal para crear evento
        document.getElementById('createEventBtn')?.addEventListener('click', () => {
            document.getElementById('eventModal')?.classList.add('active');
        });
        document.getElementById('closeEventModal')?.addEventListener('click', closeEventModal);
        document.getElementById('cancelEvent')?.addEventListener('click', closeEventModal);
        document.getElementById('eventForm')?.addEventListener('submit', createEvent);

        // Control dinámico de privacidad en creación
        const accessSelect = document.getElementById('eventAccessType');
        const inviteGroup = document.getElementById('inviteCodeGroup');
        const inviteInput = document.getElementById('eventInviteCode');

        accessSelect?.addEventListener('change', function () {
            if (this.value === 'private') {
                if (inviteGroup) inviteGroup.style.display = 'block';
                if (inviteInput && !inviteInput.value) generateInviteCode();
            } else {
                if (inviteGroup) inviteGroup.style.display = 'none';
            }
        });

        document.getElementById('btnGenInviteCode')?.addEventListener('click', generateInviteCode);

        // Modal para unirse con código
        document.getElementById('joinByCodeBtn')?.addEventListener('click', () => {
            openJoinCodeModal();
        });
        document.getElementById('closeJoinInviteModal')?.addEventListener('click', closeJoinCodeModal);
        document.getElementById('cancelJoinInvite')?.addEventListener('click', closeJoinCodeModal);
        document.getElementById('joinInviteForm')?.addEventListener('submit', handleJoinByCodeSubmit);

        // Modal para ver y copiar código de invitación
        document.getElementById('closeViewInviteModal')?.addEventListener('click', closeViewInviteModal);
        document.getElementById('closeViewInviteBtn')?.addEventListener('click', closeViewInviteModal);
        document.getElementById('btnCopyInviteCode')?.addEventListener('click', copyInviteCodeToClipboard);

        // Modal de ajustes de privacidad de la sala (Creador / Admin - Estilo WhatsApp/FB)
        document.getElementById('closeSettingsModal')?.addEventListener('click', closeSettingsModal);
        document.getElementById('cancelSettingsModal')?.addEventListener('click', closeSettingsModal);
        document.getElementById('settingsCommunityForm')?.addEventListener('submit', handleSettingsSubmit);

        const editAccessSelect = document.getElementById('editEventAccessType');
        const editInviteGroup = document.getElementById('editInviteCodeGroup');
        const editInviteInput = document.getElementById('editEventInviteCode');

        editAccessSelect?.addEventListener('change', function () {
            if (this.value === 'private') {
                if (editInviteGroup) editInviteGroup.style.display = 'block';
                if (editInviteInput && !editInviteInput.value) {
                    editInviteInput.value = 'RDSLP-' + Math.random().toString(36).substring(2, 7).toUpperCase();
                }
            } else {
                if (editInviteGroup) editInviteGroup.style.display = 'none';
            }
        });

        document.getElementById('btnRegenInviteCode')?.addEventListener('click', function () {
            if (editInviteInput) {
                editInviteInput.value = 'RDSLP-' + Math.random().toString(36).substring(2, 7).toUpperCase();
            }
        });
    }

    function generateInviteCode() {
        const code = 'RDSLP-' + Math.random().toString(36).substring(2, 7).toUpperCase();
        const inviteInput = document.getElementById('eventInviteCode');
        if (inviteInput) inviteInput.value = code;
    }

    // ========== CHAT ==========
    function loadChatMessages(chatId = 'general') {
        const container = document.getElementById('chatMessages');
        if (!container) return;

        let messages;
        if (currentEventChat) {
            messages = getEventChatMessages(currentEventChat);
        } else {
            messages = community.getMessages(chatId);
        }

        if (!messages || messages.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 40px;">No hay mensajes aún en esta sala. ¡Sé el primero en escribir!</p>';
            return;
        }

        container.innerHTML = messages.map(msg => {
            const isOwn = currentUser && msg.authorId === currentUser.id;
            const initial = msg.authorName?.charAt(0).toUpperCase() || '?';
            const time = new Date(msg.createdAt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });

            return `
                <div class="chat-message ${isOwn ? 'own' : ''}">
                    <div class="message-avatar">${initial}</div>
                    <div class="message-content">
                        <div class="message-author">${escapeHtml(msg.authorName || 'Usuario')}</div>
                        <div class="message-text">${escapeHtml(msg.text)}</div>
                        <div class="message-time">${time}</div>
                    </div>
                </div>
            `;
        }).join('');

        container.scrollTop = container.scrollHeight;
    }

    function sendMessage() {
        const input = document.getElementById('chatInput');
        if (!input || !input.value.trim()) return;

        if (!currentUser) {
            alert('Debes iniciar sesión para escribir en la comunidad.');
            return;
        }

        const text = input.value.trim();

        if (currentEventChat) {
            // Verificar permiso antes de escribir en chat de evento
            const hasAccess = community.hasAccessToEvent(currentEventChat, currentUser.id, currentUser.email) || auth.hasPermission('canManageEvents');
            if (!hasAccess) {
                alert('🔒 Acceso denegado: Esta sala es privada y requiere invitación.');
                return;
            }
            sendEventChatMessage(currentEventChat, text);
        } else {
            const activeTab = document.querySelector('.chat-tab.active')?.dataset.chat || 'general';
            community.sendMessage(activeTab, text, currentUser.id, currentUser.name);
        }

        input.value = '';
        loadChatMessages();
    }

    function getEventChatMessages(eventId) {
        const chats = JSON.parse(localStorage.getItem('rdslp_event_chats') || '{}');
        return chats[eventId] || [];
    }

    function sendEventChatMessage(eventId, text) {
        const chats = JSON.parse(localStorage.getItem('rdslp_event_chats') || '{}');
        if (!chats[eventId]) chats[eventId] = [];

        chats[eventId].push({
            id: Date.now(),
            authorId: currentUser.id,
            authorName: currentUser.name,
            text,
            createdAt: new Date().toISOString()
        });

        localStorage.setItem('rdslp_event_chats', JSON.stringify(chats));
    }

    // ========== EVENTOS Y SALAS ==========
    function loadEvents() {
        const container = document.getElementById('eventsList');
        if (!container) return;

        let events = community.getEvents() || [];

        // Aplicar filtro (Todos, Abiertos, Privados)
        if (currentFilter === 'public') {
            events = events.filter(e => e.accessType !== 'private');
        } else if (currentFilter === 'private') {
            events = events.filter(e => e.accessType === 'private');
        }

        if (events.length === 0) {
            container.innerHTML = `
                <div class="events-empty">
                    <p style="text-align: center; color: var(--text-muted); padding: 30px;">
                        No hay encuentros programados en esta sección.
                    </p>
                </div>
            `;
            return;
        }

        container.innerHTML = events.map(event => {
            const date = new Date(event.date);
            const dateStr = date.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' });
            const timeStr = date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
            
            const isOrganizer = currentUser && (event.organizer === currentUser.id || event.organizer === currentUser.email);
            const isJoined = currentUser && (isOrganizer || (event.participants && event.participants.some(p => p.id === currentUser.id)));
            const canDelete = isOrganizer || auth.hasPermission('canManageEvents');
            const participantsCount = event.participants?.length || 0;
            const isPrivate = event.accessType === 'private';

            // Badge de privacidad
            const badgeHTML = isPrivate
                ? '<span class="badge-access badge-private">🔒 Privado (Invitación)</span>'
                : '<span class="badge-access badge-public">🟢 Abierto</span>';

            // Avatares de participantes
            const participantsHTML = event.participants?.slice(0, 4).map(p =>
                `<div class="participant-avatar" title="${escapeHtml(p.name || '')}">${p.name?.charAt(0).toUpperCase() || '?'}</div>`
            ).join('') || '';

            return `
                <div class="event-card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <div class="event-date">${dateStr} - ${timeStr}</div>
                        ${badgeHTML}
                    </div>
                    <div class="event-title">${escapeHtml(event.title)}</div>
                    <div class="event-desc">${escapeHtml(event.description)}</div>
                    <div class="event-meta">
                        <span>${participantsCount}/${event.maxParticipants} participantes</span>
                        <span>Org: ${escapeHtml(event.organizerName || 'Comunidad')}</span>
                    </div>

                    ${participantsCount > 0 ? `
                        <div class="event-participants">
                            <div class="participants-avatars">${participantsHTML}</div>
                            <span class="participants-count">${participantsCount} inscrito${participantsCount !== 1 ? 's' : ''}</span>
                        </div>
                    ` : ''}

                    <div class="event-actions" style="margin-top: 14px; display: flex; flex-wrap: wrap; gap: 8px;">
                        ${isJoined
                            ? `
                                <button class="btn-join-event" onclick="openEventChat(${event.id}, '${escapeHtml(event.title)}')" style="background: var(--accent-primary);">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;">
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                    </svg>
                                    Entrar al Chat
                                </button>
                                ${!isOrganizer ? `<button class="btn-leave-event" onclick="leaveEvent(${event.id})">Salir</button>` : ''}
                            `
                            : isPrivate
                                ? `<button class="btn-join-event" onclick="promptPrivateJoin(${event.id}, '${escapeHtml(event.title)}')">🔑 Unirse con Código</button>`
                                : `<button class="btn-join-event" onclick="joinEvent(${event.id})" ${participantsCount >= event.maxParticipants ? 'disabled' : ''}>Unirse</button>`
                        }

                        ${isPrivate && (isOrganizer || auth.hasPermission('canManageEvents'))
                            ? `<button class="btn-invite-info" onclick="viewInviteCode(${event.id})" title="Ver y compartir código de invitación">🔑 Ver Invitación</button>`
                            : ''
                        }

                        ${(isOrganizer || auth.hasPermission('canManageEvents'))
                            ? `<button class="btn-settings-event" onclick="openEventSettings(${event.id})" title="Ajustes de privacidad del grupo (Público/Privado)">⚙️ Ajustes</button>`
                            : ''
                        }

                        ${canDelete ? `<button class="btn-delete-event" onclick="deleteEvent(${event.id})" title="Eliminar encuentro">✕</button>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    function createEvent(e) {
        e.preventDefault();

        if (!currentUser) {
            alert('Debes iniciar sesión para crear un encuentro');
            return;
        }

        const accessType = document.getElementById('eventAccessType')?.value || 'public';
        const inviteCode = accessType === 'private'
            ? document.getElementById('eventInviteCode')?.value.trim().toUpperCase()
            : null;

        const eventData = {
            title: document.getElementById('eventTitle').value.trim(),
            description: document.getElementById('eventDescription').value.trim(),
            date: document.getElementById('eventDate').value,
            maxParticipants: parseInt(document.getElementById('eventMax').value) || 20,
            category: document.getElementById('eventCategory').value,
            accessType,
            inviteCode
        };

        const created = community.createEvent(eventData, currentUser.id, currentUser.name);
        closeEventModal();
        document.getElementById('eventForm').reset();
        
        // Si fue privado, mostrar el código de inmediato al creador
        if (created.accessType === 'private') {
            window.viewInviteCode(created.id);
        }

        loadEvents();
    }

    function closeEventModal() {
        document.getElementById('eventModal')?.classList.remove('active');
        const inviteGroup = document.getElementById('inviteCodeGroup');
        if (inviteGroup) inviteGroup.style.display = 'none';
    }

    // ========== CHAT DEL EVENTO ==========
    window.openEventChat = function (eventId, eventTitle) {
        // Validación de permisos
        const hasAccess = community.hasAccessToEvent(eventId, currentUser.id, currentUser.email) || auth.hasPermission('canManageEvents');
        if (!hasAccess) {
            alert('🔒 Acceso denegado: Este evento es privado y requiere código de invitación.');
            return;
        }

        currentEventChat = eventId;

        const chatHeader = document.querySelector('.chat-header h3');
        if (chatHeader) {
            chatHeader.innerHTML = `
                <span>🔒 ${escapeHtml(eventTitle)}</span> 
                <button onclick="closeEventChat()" style="margin-left: 10px; padding: 4px 10px; background: var(--bg-input); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-secondary); cursor: pointer; font-size: 12px;">✕ Salir a General</button>
            `;
        }

        document.querySelectorAll('.chat-tab').forEach(t => t.classList.remove('active'));
        loadChatMessages();
    };

    window.closeEventChat = function () {
        currentEventChat = null;
        const chatHeader = document.querySelector('.chat-header h3');
        if (chatHeader) {
            chatHeader.textContent = 'Chat General';
        }
        document.querySelector('.chat-tab[data-chat="general"]')?.classList.add('active');
        loadChatMessages('general');
    };

    // ========== UNIRSE A EVENTOS ==========
    window.joinEvent = function (eventId) {
        if (!currentUser) {
            alert('Debes iniciar sesión');
            return;
        }
        const result = community.joinEvent(eventId, currentUser.id, currentUser.name);
        if (result.success) {
            loadEvents();
            const event = (community.getEvents() || []).find(e => e.id === eventId);
            if (event) {
                openEventChat(eventId, event.title);
            }
        } else {
            alert(result.message);
        }
    };

    window.promptPrivateJoin = function (eventId, eventTitle) {
        openJoinCodeModal(eventId, eventTitle);
    };

    function openJoinCodeModal(eventId = null, eventTitle = '') {
        const modal = document.getElementById('joinInviteModal');
        const targetInput = document.getElementById('joinInviteTargetEventId');
        const promptEl = document.getElementById('joinInvitePrompt');
        const codeInput = document.getElementById('joinInviteInput');
        const errEl = document.getElementById('joinInviteError');

        if (errEl) errEl.style.display = 'none';
        if (codeInput) codeInput.value = '';

        if (targetInput) targetInput.value = eventId || '';

        if (promptEl) {
            promptEl.textContent = eventTitle 
                ? `Para unirte a "${eventTitle}", introduce el código de invitación que te compartió el organizador:`
                : 'Introduce el código de invitación para unirte a una sala o encuentro privado:';
        }

        modal?.classList.add('active');
        codeInput?.focus();
    }

    function closeJoinCodeModal() {
        document.getElementById('joinInviteModal')?.classList.remove('active');
    }

    function handleJoinByCodeSubmit(e) {
        e.preventDefault();
        const targetId = document.getElementById('joinInviteTargetEventId')?.value;
        const inputCode = document.getElementById('joinInviteInput')?.value.trim().toUpperCase();
        const errEl = document.getElementById('joinInviteError');

        if (!inputCode) {
            if (errEl) { errEl.textContent = 'Por favor ingresa un código.'; errEl.style.display = 'block'; }
            return;
        }

        let targetEvent = null;

        if (targetId) {
            targetEvent = (community.getEvents() || []).find(ev => ev.id == targetId);
        } else {
            targetEvent = community.getEventByInviteCode(inputCode);
        }

        if (!targetEvent) {
            if (errEl) { errEl.textContent = 'No se encontró ningún evento privado con este código.'; errEl.style.display = 'block'; }
            return;
        }

        const result = community.joinEvent(targetEvent.id, currentUser.id, currentUser.name, inputCode);

        if (result.success) {
            closeJoinCodeModal();
            loadEvents();
            openEventChat(targetEvent.id, targetEvent.title);
        } else {
            if (errEl) { errEl.textContent = result.message || 'Código de invitación inválido.'; errEl.style.display = 'block'; }
        }
    }

    // ========== VER Y COMPARTIR INVITACIÓN ==========
    window.viewInviteCode = function (eventId) {
        const event = (community.getEvents() || []).find(e => e.id === eventId);
        if (!event || !event.inviteCode) {
            alert('Este evento no tiene código de invitación privado.');
            return;
        }

        const modal = document.getElementById('viewInviteModal');
        const codeDisplay = document.getElementById('displayInviteCode');
        const feedback = document.getElementById('copyFeedback');

        if (codeDisplay) codeDisplay.textContent = event.inviteCode;
        if (feedback) feedback.style.display = 'none';

        modal?.classList.add('active');
    };

    function closeViewInviteModal() {
        document.getElementById('viewInviteModal')?.classList.remove('active');
    }

    function copyInviteCodeToClipboard() {
        const code = document.getElementById('displayInviteCode')?.textContent;
        if (!code) return;

        navigator.clipboard.writeText(code).then(() => {
            const feedback = document.getElementById('copyFeedback');
            if (feedback) {
                feedback.style.display = 'block';
                setTimeout(() => { feedback.style.display = 'none'; }, 2500);
            }
        }).catch(() => {
            alert(`Código de invitación: ${code}`);
        });
    }

    // ========== AJUSTES DE SALA Y PRIVACIDAD (Creador / Admin) ==========
    window.openEventSettings = function (eventId) {
        const event = (community.getEvents() || []).find(e => e.id === eventId);
        if (!event) return;

        const idInput = document.getElementById('editEventId');
        const titleInput = document.getElementById('editEventTitle');
        const descInput = document.getElementById('editEventDescription');
        const accessSelect = document.getElementById('editEventAccessType');
        const inviteGroup = document.getElementById('editInviteCodeGroup');
        const inviteInput = document.getElementById('editEventInviteCode');

        if (idInput) idInput.value = event.id;
        if (titleInput) titleInput.value = event.title || '';
        if (descInput) descInput.value = event.description || '';
        if (accessSelect) accessSelect.value = event.accessType || 'public';

        if (event.accessType === 'private') {
            if (inviteGroup) inviteGroup.style.display = 'block';
            if (inviteInput) inviteInput.value = event.inviteCode || '';
        } else {
            if (inviteGroup) inviteGroup.style.display = 'none';
            if (inviteInput) inviteInput.value = '';
        }

        document.getElementById('settingsCommunityModal')?.classList.add('active');
    };

    function closeSettingsModal() {
        document.getElementById('settingsCommunityModal')?.classList.remove('active');
    }

    function handleSettingsSubmit(e) {
        e.preventDefault();
        const eventId = parseInt(document.getElementById('editEventId')?.value);
        const title = document.getElementById('editEventTitle')?.value.trim();
        const description = document.getElementById('editEventDescription')?.value.trim();
        const accessType = document.getElementById('editEventAccessType')?.value;
        let inviteCode = document.getElementById('editEventInviteCode')?.value.trim().toUpperCase();

        if (accessType === 'private' && !inviteCode) {
            inviteCode = 'RDSLP-' + Math.random().toString(36).substring(2, 7).toUpperCase();
        }

        const res = community.updateEvent(eventId, {
            title,
            description,
            accessType,
            inviteCode: accessType === 'private' ? inviteCode : null
        }, currentUser.id);

        if (res.success) {
            closeSettingsModal();
            loadEvents();
            alert('¡Configuración de privacidad y sala actualizada con éxito!');
        } else {
            alert(res.message || 'Error al actualizar los ajustes.');
        }
    }

    window.leaveEvent = function (eventId) {
        if (!currentUser) return;
        community.leaveEvent(eventId, currentUser.id);
        if (currentEventChat === eventId) {
            closeEventChat();
        }
        loadEvents();
    };

    window.deleteEvent = function (eventId) {
        if (!currentUser) return;
        if (confirm('¿Eliminar este encuentro comunitario?')) {
            community.deleteEvent(eventId, currentUser.id);
            const chats = JSON.parse(localStorage.getItem('rdslp_event_chats') || '{}');
            delete chats[eventId];
            localStorage.setItem('rdslp_event_chats', JSON.stringify(chats));

            if (currentEventChat === eventId) {
                closeEventChat();
            }
            loadEvents();
        }
    };

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});
