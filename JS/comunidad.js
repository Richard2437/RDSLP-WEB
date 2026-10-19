/* =====================================================
   RDSLP - JavaScript de Comunidad con Chat por Evento
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
        document.getElementById('userAvatar').textContent = currentUser.name?.charAt(0).toUpperCase() || 'U';
        document.getElementById('userName').textContent = currentUser.name || 'Usuario';
    }

    function setupEventListeners() {
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            auth.logout();
            window.location.href = 'login.html';
        });

        // Chat tabs
        document.querySelectorAll('.chat-tab').forEach(tab => {
            tab.addEventListener('click', function () {
                document.querySelectorAll('.chat-tab').forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                currentEventChat = null;
                loadChatMessages(this.dataset.chat);
            });
        });

        // Send message
        document.getElementById('sendMessageBtn')?.addEventListener('click', sendMessage);
        document.getElementById('chatInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });

        // Event modal
        document.getElementById('createEventBtn')?.addEventListener('click', () => {
            document.getElementById('eventModal').classList.add('active');
        });
        document.getElementById('closeEventModal')?.addEventListener('click', closeEventModal);
        document.getElementById('cancelEvent')?.addEventListener('click', closeEventModal);
        document.getElementById('eventForm')?.addEventListener('submit', createEvent);
    }

    function loadChatMessages(chatId = 'general') {
        const container = document.getElementById('chatMessages');
        if (!container) return;

        let messages;
        if (currentEventChat) {
            messages = getEventChatMessages(currentEventChat);
        } else {
            messages = community.getMessages(chatId);
        }

        if (messages.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 40px;">No hay mensajes aún. ¡Sé el primero en escribir!</p>';
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
                        <div class="message-author">${msg.authorName}</div>
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
            alert('Debes iniciar sesión');
            return;
        }

        if (currentEventChat) {
            // Enviar al chat del evento
            sendEventChatMessage(currentEventChat, input.value.trim());
        } else {
            community.sendMessage('general', input.value.trim(), currentUser.id, currentUser.name);
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

    function loadEvents() {
        const container = document.getElementById('eventsList');
        if (!container) return;

        const events = community.getEvents();

        if (events.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px;">No hay eventos programados.</p>';
            return;
        }

        container.innerHTML = events.map(event => {
            const date = new Date(event.date);
            const dateStr = date.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' });
            const timeStr = date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
            const isJoined = currentUser && event.participants?.some(p => p.id === currentUser.id);
            const canDelete = currentUser && (event.organizer === currentUser.email || auth.hasPermission('canManageEvents'));
            const participantsCount = event.participants?.length || 0;

            // Mostrar avatares de participantes
            const participantsHTML = event.participants?.slice(0, 4).map(p =>
                `<div class="participant-avatar">${p.name?.charAt(0) || '?'}</div>`
            ).join('') || '';

            return `
                <div class="event-card">
                    <div class="event-date">${dateStr} - ${timeStr}</div>
                    <div class="event-title">${escapeHtml(event.title)}</div>
                    <div class="event-desc">${escapeHtml(event.description)}</div>
                    <div class="event-meta">
                        <span>${participantsCount}/${event.maxParticipants} participantes</span>
                        <span>Org: ${event.organizerName || 'Desconocido'}</span>
                    </div>
                    ${participantsCount > 0 ? `
                        <div class="event-participants">
                            <div class="participants-avatars">${participantsHTML}</div>
                            <span class="participants-count">${participantsCount} persona${participantsCount !== 1 ? 's' : ''}</span>
                        </div>
                    ` : ''}
                    <div class="event-actions">
                        ${isJoined
                    ? `
                                <button class="btn-join-event" onclick="openEventChat(${event.id}, '${escapeHtml(event.title)}')" style="background: var(--accent-primary);">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                    Chat
                                </button>
                                <button class="btn-leave-event" onclick="leaveEvent(${event.id})">Salir</button>
                            `
                    : `<button class="btn-join-event" onclick="joinEvent(${event.id})" ${participantsCount >= event.maxParticipants ? 'disabled' : ''}>Unirse</button>`
                }
                        ${canDelete ? `<button class="btn-delete-event" onclick="deleteEvent(${event.id})">X</button>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    function createEvent(e) {
        e.preventDefault();

        if (!currentUser) {
            alert('Debes iniciar sesión');
            return;
        }

        const eventData = {
            title: document.getElementById('eventTitle').value,
            description: document.getElementById('eventDescription').value,
            date: document.getElementById('eventDate').value,
            maxParticipants: parseInt(document.getElementById('eventMax').value),
            category: document.getElementById('eventCategory').value
        };

        community.createEvent(eventData, currentUser.email, currentUser.name);
        closeEventModal();
        document.getElementById('eventForm').reset();
        loadEvents();
    }

    function closeEventModal() {
        document.getElementById('eventModal').classList.remove('active');
    }

    window.openEventChat = function (eventId, eventTitle) {
        currentEventChat = eventId;

        // Actualizar header del chat
        const chatHeader = document.querySelector('.chat-header h3');
        if (chatHeader) {
            chatHeader.innerHTML = `Chat: ${eventTitle} <button onclick="closeEventChat()" style="margin-left: 10px; padding: 4px 10px; background: var(--bg-input); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-secondary); cursor: pointer; font-size: 12px;">X Volver</button>`;
        }

        // Quitar active de tabs
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

    window.joinEvent = function (eventId) {
        if (!currentUser) {
            alert('Debes iniciar sesión');
            return;
        }
        const result = community.joinEvent(eventId, currentUser.id, currentUser.name);
        if (result.success) {
            loadEvents();
            // Automatically open chat
            const event = community.getEvents().find(e => e.id === eventId);
            if (event) {
                openEventChat(eventId, event.title);
            }
        } else {
            alert(result.message);
        }
    };

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
        if (confirm('¿Eliminar este evento?')) {
            community.deleteEvent(eventId, currentUser.email);
            // También eliminar el chat del evento
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
