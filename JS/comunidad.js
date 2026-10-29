/* =====================================================
   RDSLP - JavaScript de Comunidad
   Salas Públicas y Privadas (Con Invitación Directa y Código)
   Chat con Emojis, Enlaces e Imágenes
   Gestión de Permisos (Estilo WhatsApp / Facebook Groups)
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
    let currentAttachedImage = null; // DataURL de imagen seleccionada

    init();

    function init() {
        checkAuth();
        loadUserData();
        loadChatMessages();
        loadEvents();
        setupEventListeners();
        checkInviteUrlParams();
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

    // Verificar si se abrió la página mediante un Link de Invitación directo (?sala=RDSLP-XXXX)
    function checkInviteUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const inviteCode = urlParams.get('sala') || urlParams.get('invitacion');
        if (inviteCode) {
            setTimeout(() => {
                openJoinCodeModal(null, '', inviteCode);
            }, 400);
        }
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

        // Emojis Popover
        const emojiBtn = document.getElementById('emojiToggleBtn');
        const emojiPopover = document.getElementById('emojiPickerPopover');
        const closeEmojis = document.getElementById('btnCloseEmojis');

        emojiBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!emojiPopover) return;
            emojiPopover.style.display = emojiPopover.style.display === 'none' ? 'block' : 'none';
        });

        closeEmojis?.addEventListener('click', () => {
            if (emojiPopover) emojiPopover.style.display = 'none';
        });

        document.querySelectorAll('.emoji-item').forEach(item => {
            item.addEventListener('click', function () {
                const chatInput = document.getElementById('chatInput');
                if (chatInput) {
                    chatInput.value += this.textContent;
                    chatInput.focus();
                }
            });
        });

        document.addEventListener('click', (e) => {
            if (emojiPopover && !emojiPopover.contains(e.target) && e.target !== emojiBtn) {
                emojiPopover.style.display = 'none';
            }
        });

        // Adjuntar Imagen
        const attachBtn = document.getElementById('attachImageBtn');
        const fileInput = document.getElementById('chatImageInput');
        const previewBar = document.getElementById('chatImagePreview');
        const previewImg = document.getElementById('previewImg');
        const previewName = document.getElementById('previewName');
        const cancelImgBtn = document.getElementById('btnCancelImage');

        attachBtn?.addEventListener('click', () => {
            fileInput?.click();
        });

        fileInput?.addEventListener('change', function () {
            const file = this.files[0];
            if (!file) return;

            if (!file.type.startsWith('image/')) {
                alert('Por favor selecciona un archivo de imagen válido.');
                return;
            }

            const reader = new FileReader();
            reader.onload = function (e) {
                currentAttachedImage = e.target.result;
                if (previewImg) previewImg.src = currentAttachedImage;
                if (previewName) previewName.textContent = file.name;
                if (previewBar) previewBar.style.display = 'flex';
            };
            reader.readAsDataURL(file);
        });

        cancelImgBtn?.addEventListener('click', () => {
            clearImageAttachment();
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

        // Modal para unirse con código o link
        document.getElementById('joinByCodeBtn')?.addEventListener('click', () => {
            openJoinCodeModal();
        });
        document.getElementById('closeJoinInviteModal')?.addEventListener('click', closeJoinCodeModal);
        document.getElementById('cancelJoinInvite')?.addEventListener('click', closeJoinCodeModal);
        document.getElementById('joinInviteForm')?.addEventListener('submit', handleJoinByCodeSubmit);

        // Modal para ver y compartir invitación (Link y Código)
        document.getElementById('closeViewInviteModal')?.addEventListener('click', closeViewInviteModal);
        document.getElementById('closeViewInviteBtn')?.addEventListener('click', closeViewInviteModal);
        document.getElementById('btnCopyInviteCode')?.addEventListener('click', copyInviteCodeToClipboard);
        document.getElementById('btnCopyInviteLink')?.addEventListener('click', copyInviteLinkToClipboard);

        // Modal de ajustes de privacidad (Creador / Admin)
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

        // Zoom de imágenes en chat
        document.getElementById('closeZoomModal')?.addEventListener('click', () => {
            document.getElementById('imageZoomModal')?.classList.remove('active');
        });
        document.getElementById('imageZoomModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'imageZoomModal') {
                document.getElementById('imageZoomModal')?.classList.remove('active');
            }
        });
    }

    function clearImageAttachment() {
        currentAttachedImage = null;
        const fileInput = document.getElementById('chatImageInput');
        if (fileInput) fileInput.value = '';
        const previewBar = document.getElementById('chatImagePreview');
        if (previewBar) previewBar.style.display = 'none';
        const previewImg = document.getElementById('previewImg');
        if (previewImg) previewImg.src = '';
    }

    function generateInviteCode() {
        const code = 'RDSLP-' + Math.random().toString(36).substring(2, 7).toUpperCase();
        const inviteInput = document.getElementById('eventInviteCode');
        if (inviteInput) inviteInput.value = code;
    }

    // ========== CHAT CON EMOJIS, IMÁGENES Y LINKS ==========
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

            // Formatear enlaces interactivos en el texto
            const formattedText = parseLinksInText(escapeHtml(msg.text || ''));

            // Imagen adjunta si existe
            const imageHTML = msg.image
                ? `<div class="chat-message-image" onclick="openImageZoom('${msg.image}')">
                     <img src="${msg.image}" alt="Imagen adjunta">
                   </div>`
                : '';

            return `
                <div class="chat-message ${isOwn ? 'own' : ''}">
                    <div class="message-avatar">${initial}</div>
                    <div class="message-content">
                        <div class="message-author">${escapeHtml(msg.authorName || 'Usuario')}</div>
                        ${msg.text ? `<div class="message-text">${formattedText}</div>` : ''}
                        ${imageHTML}
                        <div class="message-time">${time}</div>
                    </div>
                </div>
            `;
        }).join('');

        container.scrollTop = container.scrollHeight;
    }

    // Convertir URLs en enlaces clickeables de forma segura
    function parseLinksInText(text) {
        if (!text) return '';
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.replace(urlRegex, (url) => {
            return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="chat-link">🔗 ${url}</a>`;
        });
    }

    window.openImageZoom = function (imgSrc) {
        const modal = document.getElementById('imageZoomModal');
        const modalImg = document.getElementById('zoomModalImg');
        if (modalImg) modalImg.src = imgSrc;
        modal?.classList.add('active');
    };

    function sendMessage() {
        const input = document.getElementById('chatInput');
        const text = input ? input.value.trim() : '';

        // Debe haber texto o imagen adjunta
        if (!text && !currentAttachedImage) return;

        if (!currentUser) {
            alert('Debes iniciar sesión para escribir en la comunidad.');
            return;
        }

        if (currentEventChat) {
            // Verificar permiso antes de escribir en chat de evento
            const hasAccess = community.hasAccessToEvent(currentEventChat, currentUser.id, currentUser.email) || auth.hasPermission('canManageEvents');
            if (!hasAccess) {
                alert('🔒 Acceso denegado: Esta sala es privada y requiere invitación.');
                return;
            }
            sendEventChatMessage(currentEventChat, text, currentAttachedImage);
        } else {
            const activeTab = document.querySelector('.chat-tab.active')?.dataset.chat || 'general';
            sendGeneralChatMessage(activeTab, text, currentAttachedImage);
        }

        if (input) input.value = '';
        clearImageAttachment();
        const emojiPopover = document.getElementById('emojiPickerPopover');
        if (emojiPopover) emojiPopover.style.display = 'none';
        loadChatMessages();
    }

    function sendGeneralChatMessage(chatId, text, image) {
        const messages = JSON.parse(localStorage.getItem('rdslp_messages') || '[]');
        const newMessage = {
            id: Date.now(),
            chatId,
            text,
            image: image || null,
            authorId: currentUser.id,
            authorName: currentUser.name,
            createdAt: new Date().toISOString()
        };
        messages.push(newMessage);
        localStorage.setItem('rdslp_messages', JSON.stringify(messages));
    }

    function getEventChatMessages(eventId) {
        const chats = JSON.parse(localStorage.getItem('rdslp_event_chats') || '{}');
        return chats[eventId] || [];
    }

    function sendEventChatMessage(eventId, text, image) {
        const chats = JSON.parse(localStorage.getItem('rdslp_event_chats') || '{}');
        if (!chats[eventId]) chats[eventId] = [];

        chats[eventId].push({
            id: Date.now(),
            authorId: currentUser.id,
            authorName: currentUser.name,
            text,
            image: image || null,
            createdAt: new Date().toISOString()
        });

        localStorage.setItem('rdslp_event_chats', JSON.stringify(chats));
    }

    // ========== SALAS Y COMUNIDADES (Públicas en lista, Privadas ocultas sin invitación) ==========
    function loadEvents() {
        const container = document.getElementById('eventsList');
        if (!container) return;

        const allEvents = community.getEvents() || [];

        // REGLA CLAVE: En la lista solo aparecen:
        // 1. Las salas PÚBLICAS (visibles para toda la comunidad).
        // 2. Las salas PRIVADAS donde el usuario actual ya es miembro o es el organizador.
        // Las demás salas privadas NO SE VEN (solo se ingresa con Link de Invitación o Código).
        const visibleEvents = allEvents.filter(event => {
            if (event.accessType !== 'private') return true; // Pública
            if (!currentUser) return false;
            const isOrganizer = (event.organizer === currentUser.id || event.organizer === currentUser.email);
            const isJoined = event.participants && event.participants.some(p => p.id === currentUser.id);
            return isOrganizer || isJoined || auth.hasPermission('canManageEvents');
        });

        if (visibleEvents.length === 0) {
            container.innerHTML = `
                <div class="events-empty">
                    <p style="text-align: center; color: var(--text-muted); padding: 30px;">
                        No hay salas públicas abiertas en este momento.<br>
                        <small style="color: var(--text-muted); font-size: 11px;">¡Crea una sala pública o ingresa a una privada con tu link de invitación!</small>
                    </p>
                </div>
            `;
            return;
        }

        container.innerHTML = visibleEvents.map(event => {
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
                ? '<span class="badge-access badge-private">🔒 Mi Sala Privada</span>'
                : '<span class="badge-access badge-public">🟢 Pública</span>';

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
                        <span>Admin: ${escapeHtml(event.organizerName || 'Comunidad')}</span>
                    </div>

                    ${participantsCount > 0 ? `
                        <div class="event-participants" onclick="window.openCommunityInfo(${event.id})" style="cursor: pointer;" title="Toca para ver los miembros y perfiles inscritos">
                            <div class="participants-avatars">${participantsHTML}</div>
                            <span class="participants-count" style="text-decoration: underline; text-underline-offset: 2px;">${participantsCount} miembro${participantsCount !== 1 ? 's' : ''} (Ver perfiles)</span>
                        </div>
                    ` : ''}

                    <div class="event-actions" style="margin-top: 12px; display: flex; flex-wrap: wrap; gap: 6px;">
                        <button type="button" class="btn-info-event" onclick="window.openCommunityInfo(${event.id})" title="Ver información del grupo, perfiles inscritos y gestión">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                            Info / Miembros
                        </button>

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
                            : `<button class="btn-join-event" onclick="joinEvent(${event.id})" ${participantsCount >= event.maxParticipants ? 'disabled' : ''}>Unirse</button>`
                        }

                        ${isPrivate && (isOrganizer || auth.hasPermission('canManageEvents'))
                            ? `<button class="btn-invite-info" onclick="viewInviteCode(${event.id})" title="Copiar link o código de invitación">🔗 Invitar</button>`
                            : ''
                        }

                        ${(isOrganizer || auth.hasPermission('canManageEvents'))
                            ? `<button class="btn-settings-event" onclick="openEventSettings(${event.id})" title="Ajustes de privacidad de la sala">⚙️</button>`
                            : ''
                        }

                        ${canDelete ? `<button class="btn-delete-event" onclick="window.deleteCommunityGroup(${event.id})" title="Eliminar comunidad y sala">🗑️</button>` : ''}
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
        
        // Si fue privado, mostrar el enlace y código de invitación de inmediato al creador
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
            alert('🔒 Acceso denegado: Esta sala es privada y requiere código o link de invitación.');
            return;
        }

        currentEventChat = eventId;

        const chatHeader = document.querySelector('.chat-header h3');
        if (chatHeader) {
            chatHeader.innerHTML = `
                <span>🔒 ${escapeHtml(eventTitle)}</span> 
                <button onclick="closeEventChat()" style="margin-left: 10px; padding: 4px 10px; background: var(--bg-input); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-secondary); cursor: pointer; font-size: 12px;">✕ Salir al General</button>
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

    // ========== UNIRSE A EVENTOS Y SALAS PRIVADAS CON LINK O CÓDIGO ==========
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

    window.openJoinCodeModal = function (eventId = null, eventTitle = '', presetCode = '') {
        const modal = document.getElementById('joinInviteModal');
        const targetInput = document.getElementById('joinInviteTargetEventId');
        const promptEl = document.getElementById('joinInvitePrompt');
        const codeInput = document.getElementById('joinInviteInput');
        const errEl = document.getElementById('joinInviteError');

        if (errEl) errEl.style.display = 'none';
        if (codeInput) codeInput.value = presetCode || '';

        if (targetInput) targetInput.value = eventId || '';

        if (promptEl) {
            promptEl.textContent = eventTitle 
                ? `Para unirte a "${eventTitle}", introduce el código o pega el enlace de invitación:`
                : 'Pega el enlace de invitación completo o introduce el código para acceder a la sala privada:';
        }

        modal?.classList.add('active');
        codeInput?.focus();
    };

    function closeJoinCodeModal() {
        document.getElementById('joinInviteModal')?.classList.remove('active');
    }

    function handleJoinByCodeSubmit(e) {
        e.preventDefault();
        const targetId = document.getElementById('joinInviteTargetEventId')?.value;
        let rawInput = document.getElementById('joinInviteInput')?.value.trim();
        const errEl = document.getElementById('joinInviteError');

        if (!rawInput) {
            if (errEl) { errEl.textContent = 'Por favor ingresa un código o link de invitación.'; errEl.style.display = 'block'; }
            return;
        }

        // Si pegaron una URL completa (ej: ...comunidad.html?sala=RDSLP-XYZ), extraer el código
        let extractedCode = rawInput;
        if (rawInput.includes('?')) {
            try {
                const urlObj = new URL(rawInput, window.location.origin);
                extractedCode = urlObj.searchParams.get('sala') || urlObj.searchParams.get('invitacion') || rawInput;
            } catch (err) {
                // Si no era URL válida, usar el texto directo
            }
        }
        extractedCode = extractedCode.trim().toUpperCase();

        let targetEvent = null;

        if (targetId) {
            targetEvent = (community.getEvents() || []).find(ev => ev.id == targetId);
        } else {
            targetEvent = community.getEventByInviteCode(extractedCode);
        }

        if (!targetEvent) {
            if (errEl) { 
                errEl.textContent = 'No se encontró ninguna sala privada con este código o enlace de invitación.'; 
                errEl.style.display = 'block'; 
            }
            return;
        }

        const result = community.joinEvent(targetEvent.id, currentUser.id, currentUser.name, extractedCode);

        if (result.success) {
            closeJoinCodeModal();
            loadEvents();
            openEventChat(targetEvent.id, targetEvent.title);
            alert(`¡Te has unido con éxito a la sala privada "${targetEvent.title}"!`);
        } else {
            if (errEl) { errEl.textContent = result.message || 'Código de invitación inválido.'; errEl.style.display = 'block'; }
        }
    }

    // ========== VER Y COMPARTIR INVITACIÓN (LINK DIRECTO + CÓDIGO) ==========
    window.viewInviteCode = function (eventId) {
        const event = (community.getEvents() || []).find(e => e.id === eventId);
        if (!event || !event.inviteCode) {
            alert('Esta sala no es privada o no tiene código de invitación.');
            return;
        }

        const modal = document.getElementById('viewInviteModal');
        const codeDisplay = document.getElementById('displayInviteCode');
        const linkDisplay = document.getElementById('displayInviteLink');
        const feedback = document.getElementById('copyFeedback');

        // Construir enlace directo
        const fullInviteLink = `${window.location.origin}${window.location.pathname}?sala=${encodeURIComponent(event.inviteCode)}`;

        if (codeDisplay) codeDisplay.textContent = event.inviteCode;
        if (linkDisplay) linkDisplay.value = fullInviteLink;
        if (feedback) feedback.style.display = 'none';

        modal?.classList.add('active');
    };

    function closeViewInviteModal() {
        document.getElementById('viewInviteModal')?.classList.remove('active');
    }

    function copyInviteCodeToClipboard() {
        const code = document.getElementById('displayInviteCode')?.textContent;
        if (!code) return;
        copyToClipboardText(code, '¡Código copiado al portapapeles!');
    }

    function copyInviteLinkToClipboard() {
        const link = document.getElementById('displayInviteLink')?.value;
        if (!link) return;
        copyToClipboardText(link, '¡Enlace de invitación copiado al portapapeles!');
    }

    function copyToClipboardText(text, msg) {
        navigator.clipboard.writeText(text).then(() => {
            const feedback = document.getElementById('copyFeedback');
            if (feedback) {
                feedback.textContent = msg;
                feedback.style.display = 'block';
                setTimeout(() => { feedback.style.display = 'none'; }, 2500);
            }
        }).catch(() => {
            alert(text);
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
        window.deleteCommunityGroup(eventId);
    };

    // =====================================================
    // GESTIÓN DE COMUNIDAD ESTILO WHATSAPP (INFO, MIEMBROS, EXPULSIÓN)
    // =====================================================
    window.openCommunityInfo = function (eventId) {
        const events = community.getEvents() || [];
        const event = events.find(e => String(e.id) === String(eventId));
        if (!event) {
            alert('No se encontró la información de esta comunidad.');
            return;
        }

        const modal = document.getElementById('communityInfoModal');
        if (!modal) return;

        const isOrganizer = currentUser && (String(event.organizer) === String(currentUser.id) || String(event.organizer) === String(currentUser.email));
        const isAdmin = auth.hasPermission('canManageEvents') || (currentUser && currentUser.role === 'admin');
        const isJoined = currentUser && (isOrganizer || (event.participants && event.participants.some(p => String(p.id) === String(currentUser.id))));

        // Avatar inicial
        const avatarEl = document.getElementById('modalGroupAvatar');
        if (avatarEl) avatarEl.textContent = (event.title ? event.title.substring(0, 2) : 'RD').toUpperCase();

        // Título y descripción
        const titleEl = document.getElementById('modalGroupTitle');
        if (titleEl) titleEl.textContent = event.title;

        const descEl = document.getElementById('modalGroupDescription');
        if (descEl) descEl.textContent = event.description || 'Sin descripción de la comunidad.';

        // Badges
        const badgesEl = document.getElementById('modalGroupBadges');
        if (badgesEl) {
            const isPrivate = event.accessType === 'private';
            badgesEl.innerHTML = `
                ${isPrivate
                    ? '<span class="badge-access badge-private">🔒 Sala Privada</span>'
                    : '<span class="badge-access badge-public">🟢 Sala Pública</span>'
                }
                <span class="badge-access" style="background: rgba(99, 102, 241, 0.15); color: #818cf8; text-transform: uppercase;">
                    ${escapeHtml(event.category || 'general')}
                </span>
            `;
        }

        // Meta creador y capacidad
        const creatorEl = document.getElementById('modalGroupCreator');
        if (creatorEl) creatorEl.textContent = event.organizerName || 'Comunidad';

        const capacityEl = document.getElementById('modalGroupCapacity');
        const participants = event.participants || [];
        if (capacityEl) capacityEl.textContent = `${participants.length} / ${event.maxParticipants || 20}`;

        const dateEl = document.getElementById('modalGroupDate');
        if (dateEl && event.date) {
            dateEl.textContent = `📅 ${new Date(event.date).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}`;
        }

        const countEl = document.getElementById('modalGroupMembersCount');
        if (countEl) countEl.textContent = participants.length;

        // Renderizado de lista de participantes
        const listEl = document.getElementById('modalGroupMembersList');
        if (listEl) {
            if (participants.length === 0) {
                listEl.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px;">No hay miembros registrados aún.</p>';
            } else {
                listEl.innerHTML = participants.map(p => {
                    const isGroupCreator = String(p.id) === String(event.organizer) || p.role === 'organizer';
                    const isSelf = currentUser && String(p.id) === String(currentUser.id);
                    const initial = (p.name ? p.name.charAt(0) : 'U').toUpperCase();

                    // Botón para expulsar: solo visible para el creador del grupo o un admin general, y nunca contra sí mismo o el creador
                    const canKick = (isOrganizer || isAdmin) && !isGroupCreator && !isSelf;

                    return `
                        <div class="group-member-item">
                            <div class="member-left" onclick="window.openUserProfileModal('${p.id}', '${escapeHtml(p.name)}')" title="Ver perfil de ${escapeHtml(p.name)}">
                                <div class="member-avatar">${initial}</div>
                                <div class="member-details">
                                    <div class="member-name">
                                        <span>${escapeHtml(p.name)}</span>
                                        ${isSelf ? '<span style="color: #818cf8; font-size: 11px;">(Tú)</span>' : ''}
                                        ${isGroupCreator ? '<span class="badge-creator">👑 Creador del Grupo</span>' : ''}
                                    </div>
                                    <div class="member-sub">${isGroupCreator ? 'Administrador principal del grupo' : 'Miembro de la sala'}</div>
                                </div>
                            </div>
                            <div class="member-actions">
                                <button type="button" class="btn-view-member-profile" onclick="window.openUserProfileModal('${p.id}', '${escapeHtml(p.name)}')" title="Ver perfil completo">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                    Perfil
                                </button>
                                ${canKick ? `
                                    <button type="button" class="btn-kick-member" onclick="window.kickMemberFromCommunity(${event.id}, '${p.id}', '${escapeHtml(p.name)}')" title="Sacar del grupo">
                                        ❌ Sacar
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }

        // Acciones administrativas inferiores
        const actionsEl = document.getElementById('modalGroupAdminActions');
        if (actionsEl) {
            let actionsHtml = '';
            if (isOrganizer || isAdmin) {
                actionsHtml += `
                    <button type="button" class="btn-delete-group" onclick="window.deleteCommunityGroup(${event.id})">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        Eliminar Comunidad y Grupo
                    </button>
                `;
            } else if (isJoined) {
                actionsHtml += `
                    <button type="button" class="btn-leave-group" onclick="window.leaveCommunityGroup(${event.id})">
                        🚪 Salir de la Comunidad
                    </button>
                `;
            }

            actionsHtml += `
                <button type="button" class="btn-cancel" onclick="window.closeCommunityInfoModal()">Cerrar</button>
            `;
            actionsEl.innerHTML = actionsHtml;
        }

        modal.classList.add('active');
    };

    window.closeCommunityInfoModal = function () {
        const modal = document.getElementById('communityInfoModal');
        if (modal) modal.classList.remove('active');
    };

    // Expulsar a un participante (solo creador o admin)
    window.kickMemberFromCommunity = function (eventId, targetUserId, memberName) {
        if (!currentUser) return;
        if (!confirm(`¿Confirmas que deseas sacar a "${memberName}" de este grupo? Ya no tendrá acceso a la comunidad ni a sus salas.`)) {
            return;
        }

        const res = community.kickParticipant(eventId, targetUserId, currentUser.id);
        if (res.success) {
            alert(`✓ "${memberName}" ha sido retirado del grupo.`);
            window.openCommunityInfo(eventId);
            loadEvents();
        } else {
            alert(res.message || 'Error al expulsar al miembro.');
        }
    };

    // Eliminar la comunidad y su chat
    window.deleteCommunityGroup = function (eventId) {
        if (!currentUser) return;
        if (!confirm('⚠️ ¿Estás seguro de eliminar esta comunidad y grupo por completo? Esta acción es irreversible y borrará el chat y a todos los participantes.')) {
            return;
        }

        const res = community.deleteEvent(eventId, currentUser.id);
        if (res.success) {
            const chats = JSON.parse(localStorage.getItem('rdslp_event_chats') || '{}');
            delete chats[eventId];
            localStorage.setItem('rdslp_event_chats', JSON.stringify(chats));

            if (currentEventChat === eventId) {
                closeEventChat();
            }

            window.closeCommunityInfoModal();
            loadEvents();
            alert('✓ Comunidad eliminada exitosamente.');
        } else {
            alert(res.message || 'No se pudo eliminar la comunidad.');
        }
    };

    window.leaveCommunityGroup = function (eventId) {
        if (!confirm('¿Deseas salir de este grupo comunitario?')) return;
        window.leaveEvent(eventId);
        window.closeCommunityInfoModal();
    };

    // =====================================================
    // MODAL DE PERFIL DE USUARIO
    // =====================================================
    window.openUserProfileModal = function (targetUserId, displayName) {
        const modal = document.getElementById('userProfileModal');
        if (!modal) return;

        const avatarEl = document.getElementById('modalUserAvatar');
        const nameEl = document.getElementById('modalUserName');
        const handleEl = document.getElementById('modalUserHandle');
        const badgeEl = document.getElementById('modalUserBadge');
        const socialActionsEl = document.getElementById('modalSocialActions');
        const statFollowersEl = document.getElementById('modalStatFollowers');
        const statFollowingEl = document.getElementById('modalStatFollowing');
        const statPostsEl = document.getElementById('modalStatPosts');

        const initial = (displayName.charAt(0) || 'U').toUpperCase();
        if (avatarEl) avatarEl.textContent = initial;
        if (nameEl) nameEl.textContent = displayName;
        if (handleEl) handleEl.textContent = `@${displayName.toLowerCase().replace(/\s+/g, '')}`;

        // Obtener rol si está en los usuarios
        let targetRole = 'user';
        try {
            const allUsers = auth.getAllUsers ? auth.getAllUsers() : [];
            const found = allUsers.find(u => String(u.id) === String(targetUserId) || u.name === displayName);
            if (found && found.role) targetRole = found.role;
        } catch (e) {}

        if (badgeEl) {
            badgeEl.textContent = targetRole === 'admin' ? 'ADMINISTRADOR' : (targetRole === 'moderator' ? 'MODERADOR' : 'USUARIO');
            badgeEl.className = 'user-role-badge ' + (targetRole === 'admin' ? 'admin' : (targetRole === 'moderator' ? 'moderator' : ''));
        }

        const mgr = window.SocialModerationManager;
        const followersCount = mgr ? mgr.getFollowersCount(targetUserId) : 0;
        const followingCount = mgr ? mgr.getFollowingCount(targetUserId) : 0;

        const posts = JSON.parse(localStorage.getItem('rdslp_posts') || '[]');
        const userPosts = posts.filter(p => String(p.authorId) === String(targetUserId) || p.authorName === displayName);

        if (statFollowersEl) statFollowersEl.textContent = followersCount;
        if (statFollowingEl) statFollowingEl.textContent = followingCount;
        if (statPostsEl) statPostsEl.textContent = userPosts.length;

        if (socialActionsEl) {
            socialActionsEl.innerHTML = `
                <a href="muro.html?userId=${encodeURIComponent(targetUserId)}&userName=${encodeURIComponent(displayName)}" class="btn-profile-follow" style="text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                    Ver en el Muro
                </a>
            `;
        }

        const userPostsListEl = document.getElementById('modalUserPostsList');
        if (userPostsListEl) {
            if (userPosts.length === 0) {
                userPostsListEl.innerHTML = `
                    <div style="text-align: center; padding: 25px; color: var(--text-muted);">
                        <p>Este usuario no tiene publicaciones compartidas aún.</p>
                    </div>
                `;
            } else {
                userPostsListEl.innerHTML = userPosts.map(p => `
                    <div class="user-profile-post-card" style="padding: 12px; margin-bottom: 10px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px;">
                        <div style="display: flex; justify-content: space-between; font-size: 11.5px; color: var(--text-muted); margin-bottom: 6px;">
                            <span style="font-weight: 600; color: #818cf8; text-transform: uppercase;">${escapeHtml(p.type || 'post')}</span>
                            <span>${p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ''}</span>
                        </div>
                        <p style="font-size: 13.5px; color: var(--text-primary); margin: 0; line-height: 1.4;">${escapeHtml(p.content)}</p>
                    </div>
                `).join('');
            }
        }

        switchComunidadProfileTab('posts');
        modal.classList.add('active');
    };

    function switchComunidadProfileTab(tabName) {
        document.querySelectorAll('#userProfileModal .p-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tabName);
        });

        const tabPosts = document.getElementById('tabPostsContent');
        const tabAbout = document.getElementById('tabAboutContent');

        if (tabPosts) tabPosts.style.display = tabName === 'posts' ? 'block' : 'none';
        if (tabAbout) tabAbout.style.display = tabName === 'about' ? 'block' : 'none';
    }

    // Vincular pestañas y botones de cierre de modales
    document.getElementById('closeCommunityInfoModal')?.addEventListener('click', window.closeCommunityInfoModal);
    document.getElementById('closeProfileModal')?.addEventListener('click', () => {
        document.getElementById('userProfileModal')?.classList.remove('active');
    });

    document.querySelectorAll('#userProfileModal .p-tab').forEach(tab => {
        tab.addEventListener('click', function () {
            switchComunidadProfileTab(this.dataset.tab);
        });
    });

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});
