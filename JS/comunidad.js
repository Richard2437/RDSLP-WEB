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

        // Sincronización en la nube con Supabase (para que los chats y comunidades se vean entre diferentes usuarios y dispositivos)
        syncCloudChat();
        syncCloudCommunities();
        setInterval(syncCloudChat, 3000);
        setInterval(syncCloudCommunities, 6000);
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
        const initial = currentUser.name?.charAt(0).toUpperCase() || 'U';
        if (nameEl) nameEl.textContent = currentUser.name || 'Usuario';

        const customs = window.rdslpCustomizer ? window.rdslpCustomizer.getUserCustomization(currentUser.id, currentUser.name) : null;
        if (customs && customs.avatar) {
            const avatarHtml = (customs.avatar.startsWith('data:image') || customs.avatar.startsWith('http'))
                ? `<img src="${customs.avatar}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%; display: block;">`
                : `<span style="font-size: 20px; line-height: 1;">${customs.avatar}</span>`;
            if (avatarEl) avatarEl.innerHTML = avatarHtml;
        } else {
            if (avatarEl) avatarEl.textContent = initial;
        }
    }

    window.addEventListener('rdslp_customization_updated', () => {
        loadUserData();
    });

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
                const chatInput = document.getElementById('chatInput');
                const layout = document.querySelector('.community-layout');
                const sectionH2 = document.querySelector('.comunidad-container .section-header h2, .section-header h2');
                const sectionP = document.querySelector('.comunidad-container .section-header p, .section-header p');

                if (this.dataset.chat === 'ayuda') {
                    if (layout) layout.classList.add('support-mode');
                    if (sectionH2) sectionH2.textContent = 'Centro de Ayuda y Soporte Oficial';
                    if (sectionP) sectionP.textContent = 'Asistencia técnica 24/7, estado de cuenta y resolución directa de dudas';
                    if (header) header.innerHTML = '💬 Chat de Ayuda y Soporte <span style="font-size: 11px; color: #10b981; font-weight: normal; margin-left: 8px;">● Asistencia Oficial 24/7</span>';
                    if (chatInput) chatInput.placeholder = "Escribe tu duda o usa '/ayuda [describe tu problema]'...";
                } else {
                    if (layout) layout.classList.remove('support-mode');
                    if (sectionH2) sectionH2.textContent = 'Conecta con otros Programadores';
                    if (sectionP) sectionP.textContent = 'Chatea y participa en eventos virtuales';
                    if (header) header.textContent = 'Chat General';
                    if (chatInput) chatInput.placeholder = "Escribe un mensaje...";
                }
                loadChatMessages(this.dataset.chat);
            });
        });

        // Detectar si se navegó con hash #ayuda o parámetro chat=ayuda (desde notificaciones)
        const checkAyudaHash = () => {
            const params = new URLSearchParams(window.location.search);
            if (window.location.hash === '#ayuda' || window.location.hash === '#soporte' || params.get('chat') === 'ayuda' || params.get('tab') === 'ayuda') {
                const ayudaTab = document.querySelector('.chat-tab[data-chat="ayuda"]');
                if (ayudaTab) {
                    ayudaTab.click();
                    const chatSection = document.getElementById('chatMessages') || document.querySelector('.community-chat') || document.querySelector('.chat-container');
                    if (chatSection) {
                        setTimeout(() => chatSection.scrollIntoView({ behavior: 'smooth', block: 'center' }), 250);
                    }
                }
            }
        };
        checkAyudaHash();
        window.addEventListener('hashchange', checkAyudaHash);

        // Escuchar actualización de mensajes de soporte en vivo
        window.addEventListener('rdslp_support_updated', () => {
            const activeTab = document.querySelector('.chat-tab.active')?.dataset.chat;
            if (activeTab === 'ayuda') {
                loadChatMessages('ayuda');
            }
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
    async function loadChatMessages(chatId = 'general') {
        const container = document.getElementById('chatMessages');
        if (!container) return;

        if (!currentEventChat && chatId === 'ayuda') {
            await renderAyudaChat(container);
            return;
        }

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

    async function renderAyudaChat(container) {
        if (!container) return;

        // Estado de moderación / sanciones
        let statusBadge = '<span style="color: #10b981; font-weight: 600;">🟢 Cuenta Activa</span>';
        if (currentUser && window.socialModeration) {
            try {
                const s = window.socialModeration.getUserSanctions(currentUser.id);
                if (s.isBanned) {
                    statusBadge = '<span style="color: #ef4444; font-weight: 600;">⛔ Cuenta Suspendida</span>';
                } else if (s.isMuted) {
                    statusBadge = '<span style="color: #fbbf24; font-weight: 600;">🔇 Silenciado</span>';
                } else if (s.warnings && s.warnings.length > 0) {
                    statusBadge = `<span style="color: #f59e0b; font-weight: 600;">⚠️ ${s.warnings.length} Strikes</span>`;
                }
            } catch (e) {}
        }

        const bannerHTML = `
            <div class="ayuda-status-card" style="background: var(--bg-card, #171717); border: 1px solid var(--border-color, rgba(255,255,255,0.1)); border-radius: 12px; padding: 14px; margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 10px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 22px;">🤖</span>
                        <div>
                            <strong style="font-size: 13.5px; color: var(--text-primary);">Canal de Asistencia y Notificaciones</strong>
                            <div style="font-size: 11px; color: #10b981; font-weight: 500;">● Bot Oficial Activo 24/7 · Mensajes Guardados</div>
                        </div>
                    </div>
                    <div style="font-size: 12px; padding: 4px 10px; border-radius: 6px; background: rgba(255,255,255,0.05); border: 1px solid var(--border-color);">
                        ${statusBadge}
                    </div>
                </div>
                <div style="background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.22); border-radius: 8px; padding: 10px 12px; font-size: 12px; color: var(--text-secondary); line-height: 1.45;">
                    💡 <strong>¿Cómo pedir ayuda o contactar al Administrador?</strong><br>
                    Escribe tu duda o usa el comando:<br>
                    <code style="background: rgba(0,0,0,0.35); color: #fbbf24; padding: 2px 6px; border-radius: 4px; font-weight: 600;">/ayuda [describe tu problema aquí]</code><br>
                    Se enviará una alerta prioritaria al Administrador y sus respuestas aparecerán aquí mismo.
                </div>
            </div>
        `;

        let messagesHTML = '';
        if (window.rdslpNotifications && window.rdslpNotifications.getSupportMessages) {
            const msgs = await window.rdslpNotifications.getSupportMessages();
            messagesHTML = msgs.map(m => {
                const isBot = m.senderRole === 'bot';
                const isAdmin = m.senderRole === 'admin';
                const isOwn = currentUser && m.userId === currentUser.id && !isBot && !isAdmin;
                const time = m.createdAt ? new Date(m.createdAt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) : '';

                if (isBot) {
                    return `
                        <div class="chat-message" style="background: rgba(99, 102, 241, 0.06); border-radius: 12px; padding: 10px; border-left: 3px solid #6366f1;">
                            <div class="message-avatar" style="background: linear-gradient(135deg, #6366f1, #4f46e5); color: #fff;">🤖</div>
                            <div class="message-content">
                                <div class="message-author" style="color: #818cf8; display: flex; align-items: center; gap: 6px;">
                                    <span>${escapeHtml(m.senderName || 'RDSLP Bot')}</span>
                                    <span style="background: rgba(99, 102, 241, 0.25); color: #a5b4fc; font-size: 10px; padding: 1px 6px; border-radius: 4px; font-weight: 700;">BOT OFICIAL</span>
                                </div>
                                <div class="message-text" style="white-space: pre-wrap; line-height: 1.45;">${parseLinksInText(escapeHtml(m.message))}</div>
                                <div class="message-time">${time}</div>
                            </div>
                        </div>
                    `;
                }

                if (isAdmin) {
                    return `
                        <div class="chat-message" style="background: rgba(234, 179, 8, 0.08); border-radius: 12px; padding: 10px; border-left: 3px solid #eab308;">
                            <div class="message-avatar" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff;">🛡️</div>
                            <div class="message-content">
                                <div class="message-author" style="color: #fbbf24; display: flex; align-items: center; gap: 6px;">
                                    <span>${escapeHtml(m.senderName || 'Administrador')}</span>
                                    <span style="background: rgba(234, 179, 8, 0.25); color: #fde047; font-size: 10px; padding: 1px 6px; border-radius: 4px; font-weight: 700;">ADMIN</span>
                                </div>
                                <div class="message-text" style="white-space: pre-wrap; line-height: 1.45;">${parseLinksInText(escapeHtml(m.message))}</div>
                                <div class="message-time">${time}</div>
                            </div>
                        </div>
                    `;
                }

                const initial = m.userName?.charAt(0).toUpperCase() || 'U';
                return `
                    <div class="chat-message own">
                        <div class="message-avatar">${initial}</div>
                        <div class="message-content">
                            <div class="message-author">Tú</div>
                            <div class="message-text" style="white-space: pre-wrap; line-height: 1.45;">${parseLinksInText(escapeHtml(m.message))}</div>
                            <div class="message-time">${time}</div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        container.innerHTML = bannerHTML + (messagesHTML || '<p style="text-align: center; color: var(--text-muted); padding: 20px;">Inicia una consulta de soporte escribiendo un mensaje abajo.</p>');
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

    async function sendMessage() {
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
            if (activeTab === 'ayuda') {
                if (window.rdslpNotifications && window.rdslpNotifications.sendSupportMessage) {
                    await window.rdslpNotifications.sendSupportMessage(text);
                    if (input) input.value = '';
                    clearImageAttachment();
                    loadChatMessages('ayuda');
                    return;
                }
            }
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
            authorName: currentUser.name || 'Usuario',
            createdAt: new Date().toISOString()
        };
        messages.push(newMessage);
        localStorage.setItem('rdslp_messages', JSON.stringify(messages));

        // Enviar a Supabase para entrega en tiempo real a otros usuarios
        if (window.rdslpSupabase && typeof window.rdslpSupabase.sendCloudMessage === 'function') {
            window.rdslpSupabase.sendCloudMessage(chatId, newMessage).catch(e => console.warn('[RDSLP Chat Cloud Error]:', e));
        }
    }

    function getEventChatMessages(eventId) {
        const chats = JSON.parse(localStorage.getItem('rdslp_event_chats') || '{}');
        return chats[eventId] || [];
    }

    function sendEventChatMessage(eventId, text, image) {
        const chats = JSON.parse(localStorage.getItem('rdslp_event_chats') || '{}');
        if (!chats[eventId]) chats[eventId] = [];

        const newMessage = {
            id: Date.now(),
            authorId: currentUser.id,
            authorName: currentUser.name || 'Usuario',
            text,
            image: image || null,
            createdAt: new Date().toISOString()
        };

        chats[eventId].push(newMessage);
        localStorage.setItem('rdslp_event_chats', JSON.stringify(chats));

        // Enviar a Supabase
        if (window.rdslpSupabase && typeof window.rdslpSupabase.sendCloudMessage === 'function') {
            window.rdslpSupabase.sendCloudMessage('event_' + eventId, newMessage).catch(e => console.warn('[RDSLP Event Chat Cloud Error]:', e));
        }
    }

    // Sincronización en segundo plano de mensajes desde Supabase
    async function syncCloudChat() {
        if (!window.rdslpSupabase || typeof window.rdslpSupabase.fetchCloudMessages !== 'function') return;
        const targetChatId = currentEventChat ? `event_${currentEventChat}` : (document.querySelector('.chat-tab.active')?.dataset.chat || 'general');

        try {
            const cloudMsgs = await window.rdslpSupabase.fetchCloudMessages(targetChatId);
            if (cloudMsgs && Array.isArray(cloudMsgs) && cloudMsgs.length > 0) {
                if (currentEventChat) {
                    const chats = JSON.parse(localStorage.getItem('rdslp_event_chats') || '{}');
                    const localMsgs = chats[currentEventChat] || [];
                    if (cloudMsgs.length !== localMsgs.length) {
                        chats[currentEventChat] = cloudMsgs;
                        localStorage.setItem('rdslp_event_chats', JSON.stringify(chats));
                        loadChatMessages();
                    }
                } else {
                    const allLocal = JSON.parse(localStorage.getItem('rdslp_messages') || '[]');
                    const chatFilteredLocal = allLocal.filter(m => (m.chatId || 'general') === targetChatId);
                    if (cloudMsgs.length !== chatFilteredLocal.length) {
                        const otherLocal = allLocal.filter(m => (m.chatId || 'general') !== targetChatId);
                        const merged = otherLocal.concat(cloudMsgs);
                        localStorage.setItem('rdslp_messages', JSON.stringify(merged));
                        loadChatMessages(targetChatId);
                    }
                }
            }
        } catch (e) {
            console.warn('[RDSLP Chat Sync Error]:', e);
        }
    }

    // Sincronización en segundo plano de comunidades desde Supabase
    async function syncCloudCommunities() {
        if (!window.rdslpSupabase || typeof window.rdslpSupabase.fetchCloudCommunities !== 'function') return;
        try {
            const cloudComms = await window.rdslpSupabase.fetchCloudCommunities();
            if (cloudComms && Array.isArray(cloudComms)) {
                const localComms = community.getEvents() || [];
                if (cloudComms.length > 0) {
                    const localSig = JSON.stringify(localComms.map(c => ({ id: c.id, parts: c.participants?.length })));
                    const cloudSig = JSON.stringify(cloudComms.map(c => ({ id: c.id, parts: c.participants?.length })));
                    if (localSig !== cloudSig) {
                        localStorage.setItem('rdslp_events', JSON.stringify(cloudComms));
                        loadEvents();
                    }
                } else if (localComms.length > 0) {
                    // Migración inicial: subir comunidades locales existentes a Supabase
                    for (const lc of localComms) {
                        await window.rdslpSupabase.createCloudCommunity(lc).catch(() => {});
                    }
                }
            }
        } catch (e) {
            console.warn('[RDSLP Comms Sync Error]:', e);
        }
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

        // Guardar la nueva comunidad en Supabase para que cualquier otro usuario la vea
        if (window.rdslpSupabase && typeof window.rdslpSupabase.createCloudCommunity === 'function') {
            window.rdslpSupabase.createCloudCommunity(created).catch(e => console.warn('[RDSLP Create Comm Cloud Error]:', e));
        }
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
        const layout = document.querySelector('.community-layout');
        if (layout) layout.classList.remove('support-mode');
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
    window.deleteCommunityGroup = async function (eventId) {
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

            // Eliminar de Supabase para que desaparezca de las demás pantallas y dispositivos
            if (window.rdslpSupabase && typeof window.rdslpSupabase.deleteCloudCommunity === 'function') {
                await window.rdslpSupabase.deleteCloudCommunity(eventId).catch(() => {});
            }

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
        if (nameEl) nameEl.textContent = displayName;
        if (handleEl) handleEl.textContent = `@${displayName.toLowerCase().replace(/\s+/g, '')}`;

        const modalProfileCover = document.getElementById('modalProfileCover') || modal.querySelector('.profile-modal-cover');
        const btnChangeCover = document.getElementById('btnChangeCover');
        const btnChangeAvatar = document.getElementById('btnChangeAvatar');

        if (window.rdslpCustomizer) {
            const customs = window.rdslpCustomizer.getUserCustomization(targetUserId, displayName);
            window.rdslpCustomizer.applyCustomizationToElement(modalProfileCover, avatarEl, customs, initial);
        } else {
            if (avatarEl) avatarEl.textContent = initial;
        }

        const isSelf = currentUser && (String(currentUser.id) === String(targetUserId) || (currentUser.name && displayName && currentUser.name.trim().toLowerCase() === displayName.trim().toLowerCase()));
        if (btnChangeCover) btnChangeCover.style.display = isSelf ? 'inline-flex' : 'none';
        if (btnChangeAvatar) btnChangeAvatar.style.display = isSelf ? 'flex' : 'none';

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

        // Configuración de pestaña de moderación para Administradores
        let currentTargetProfile = { id: targetUserId, name: displayName };
        window.currentComunidadProfileTarget = currentTargetProfile;

        const adminTab = document.getElementById('modalAdminTab');
        const userRoleLower = String(currentUser?.role || '').toLowerCase();
        const isAdmin = userRoleLower === 'admin' || userRoleLower === 'administrador' || userRoleLower === 'moderator';
        const isSelf = currentUser && (String(currentUser.id) === String(targetUserId) || currentUser.name === displayName);

        if (adminTab) {
            adminTab.style.display = (isAdmin && !isSelf) ? 'inline-flex' : 'none';
        }

        switchComunidadProfileTab('posts');

        if (isAdmin && !isSelf) {
            renderComunidadSanctionsHistory(targetUserId);
        }

        modal.classList.add('active');
    };

    function renderComunidadSanctionsHistory(targetUserId) {
        const listEl = document.getElementById('modalSanctionsHistory');
        if (!listEl) return;

        const mgr = window.SocialModerationManager;
        const status = mgr ? mgr.getSanctionStatus(targetUserId) : { isBanned: false, isMuted: false, warnings: [] };

        let html = '';
        if (status.isBanned) {
            html += `
                <div class="mod-status-badge ban" style="padding: 10px; border-radius: 6px; background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); margin-bottom: 8px;">
                    ⛔ <strong>Cuenta Suspendida:</strong> ${status.banExpires ? 'Hasta ' + new Date(status.banExpires).toLocaleDateString() : 'Permanente'} - ${escapeHtml(status.banReason || 'Sanción disciplinaria')}
                </div>
            `;
        }
        if (status.isMuted) {
            html += `
                <div class="mod-status-badge mute" style="padding: 10px; border-radius: 6px; background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); margin-bottom: 8px;">
                    🔇 <strong>Silenciado:</strong> ${status.muteExpires ? 'Hasta ' + new Date(status.muteExpires).toLocaleDateString() : 'Permanente'} - ${escapeHtml(status.muteReason || 'Restricción de moderación')}
                </div>
            `;
        }

        if (status.warnings && status.warnings.length > 0) {
            html += `<div style="margin-top: 10px; font-size: 13px; font-weight: 600; color: #f59e0b;">⚠️ Avisos Disciplinarios (${status.warnings.length} Strikes):</div>`;
            html += status.warnings.map(w => `
                <div class="mod-warning-item" style="padding: 8px; border-radius: 6px; background: var(--bg-card); border: 1px solid var(--border-color); margin-top: 6px;">
                    <div style="font-weight: 600; color: #fbbf24; font-size: 13px;">${escapeHtml(w.reason)}</div>
                    <div style="font-size: 12px; color: var(--text-secondary); margin: 3px 0;">${escapeHtml(w.note || 'Sin detalles adicionales')}</div>
                    <div style="font-size: 11px; color: var(--text-muted);">Emitido por ${escapeHtml(w.issuedBy)} · ${new Date(w.date).toLocaleDateString()}</div>
                </div>
            `).join('');
        }

        if (!html) {
            html = '<p style="color: var(--text-muted); font-size: 13px;">Este usuario tiene un expediente limpio, sin sanciones ni avisos.</p>';
        }

        listEl.innerHTML = html;
    }

    function switchComunidadProfileTab(tabName) {
        document.querySelectorAll('#userProfileModal .p-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tabName || (tabName === 'admin' && t.id === 'modalAdminTab'));
        });

        const tabPosts = document.getElementById('tabPostsContent');
        const tabAbout = document.getElementById('tabAboutContent');
        const tabAdmin = document.getElementById('tabAdminContent');

        if (tabPosts) tabPosts.style.display = tabName === 'posts' ? 'block' : 'none';
        if (tabAbout) tabAbout.style.display = tabName === 'about' ? 'block' : 'none';
        if (tabAdmin) tabAdmin.style.display = tabName === 'admin' ? 'block' : 'none';
    }

    // Funciones globales de moderación para Administradores desde la pestaña de Perfil
    window.applyMute = function (days) {
        const target = window.currentComunidadProfileTarget;
        if (!target || !window.SocialModerationManager) return;
        const durationText = days === 0 ? 'de forma permanente' : `por ${days} día(s)`;
        if (!confirm(`¿Confirmas silenciar a ${target.name} ${durationText}? No podrá publicar comentarios ni enviar mensajes.`)) return;

        const res = window.SocialModerationManager.muteUser(currentUser, target.id, days);
        if (res.success) {
            alert('✓ Silencio aplicado con éxito.');
            renderComunidadSanctionsHistory(target.id);
        } else {
            alert(res.message || 'Error al aplicar sanción.');
        }
    };

    window.applyBan = function (days) {
        const target = window.currentComunidadProfileTarget;
        if (!target || !window.SocialModerationManager) return;
        const durationText = days === 0 ? 'de forma permanente' : `por ${days} día(s)`;
        if (!confirm(`¿Confirmas suspender / banear a ${target.name} ${durationText}?`)) return;

        const res = window.SocialModerationManager.banUser(currentUser, target.id, days);
        if (res.success) {
            alert('✓ Baneo aplicado con éxito.');
            renderComunidadSanctionsHistory(target.id);
            if (window.rdslpSupabase && window.rdslpSupabase.toggleBanUser) {
                window.rdslpSupabase.toggleBanUser(target.id, true).catch(() => {});
            }
        } else {
            alert(res.message || 'Error al suspender al usuario.');
        }
    };

    window.liftSanction = function () {
        const target = window.currentComunidadProfileTarget;
        if (!target || !window.SocialModerationManager) return;
        if (!confirm(`¿Confirmas levantar todas las sanciones y silencios a ${target.name}?`)) return;

        const res = window.SocialModerationManager.liftSanctions(currentUser, target.id);
        if (res.success) {
            alert('✓ Sanciones levantadas correctamente.');
            renderComunidadSanctionsHistory(target.id);
            if (window.rdslpSupabase && window.rdslpSupabase.toggleBanUser) {
                window.rdslpSupabase.toggleBanUser(target.id, false).catch(() => {});
            }
        } else {
            alert(res.message || 'Error al levantar sanciones.');
        }
    };

    document.getElementById('btnIssueWarning')?.addEventListener('click', function () {
        const target = window.currentComunidadProfileTarget;
        if (!target || !window.SocialModerationManager) return;

        const select = document.getElementById('warnReasonSelect');
        const noteInput = document.getElementById('warnNoteInput');
        const reason = select ? select.value : 'Infracción de normas';
        const note = noteInput ? noteInput.value.trim() : '';

        const res = window.SocialModerationManager.issueWarning(currentUser, target.id, reason, note);
        if (res.success) {
            alert(`✓ Aviso disciplinario (Strike ${res.warningCount}/3) emitido con éxito.`);
            if (noteInput) noteInput.value = '';
            renderComunidadSanctionsHistory(target.id);
        } else {
            alert(res.message || 'Error al emitir el aviso.');
        }
    });

    // Vincular pestañas y botones de cierre de modales
    document.getElementById('closeCommunityInfoModal')?.addEventListener('click', window.closeCommunityInfoModal);
    document.getElementById('closeProfileModal')?.addEventListener('click', () => {
        document.getElementById('userProfileModal')?.classList.remove('active');
    });

    document.querySelectorAll('#userProfileModal .p-tab').forEach(tab => {
        tab.addEventListener('click', function () {
            const tabName = this.dataset.tab || (this.id === 'modalAdminTab' ? 'admin' : 'posts');
            switchComunidadProfileTab(tabName);
        });
    });

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});
