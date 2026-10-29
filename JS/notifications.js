/* =====================================================
   RDSLP - Sistema Oficial de Notificaciones y Soporte (/ayuda)
   Notificaciones en tiempo real, Campanita con Badge,
   Chat Usuario-Máquina y Solicitudes de Soporte a Administradores
===================================================== */

(function () {
    const NOTIF_STORAGE_PREFIX = 'rdslp_notifs_';
    const SUPPORT_STORAGE_PREFIX = 'rdslp_support_';
    let pollingInterval = null;

    function getCurrentUser() {
        try {
            const raw = sessionStorage.getItem('rdslp_user') || localStorage.getItem('rdslp_user');
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function isCurrentUserAdmin() {
        const u = getCurrentUser();
        if (!u || !u.role) return false;
        const r = String(u.role).toLowerCase().trim();
        return r === 'admin' || r === 'administrador';
    }

    // =====================================================
    // 1. MÉTODOS DE BASE DE DATOS / NUBE Y LOCAL
    // =====================================================

    async function getSupabase() {
        if (window.rdslpSupabase && typeof window.rdslpSupabase.getClient === 'function') {
            try {
                return await window.rdslpSupabase.getClient();
            } catch (e) {
                return null;
            }
        }
        return null;
    }

    // Obtener notificaciones del usuario (Cloud + Local Fallback)
    async function getNotifications() {
        const user = getCurrentUser();
        if (!user) return [];

        let cloudNotifs = [];
        const client = await getSupabase();
        if (client) {
            try {
                // Notificaciones para este usuario específico o globales/para admins
                let query = client
                    .from('notificaciones')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(40);

                if (isCurrentUserAdmin()) {
                    query = query.or(`user_id.eq.${user.id},user_id.eq.all,user_id.eq.admins`);
                } else {
                    query = query.or(`user_id.eq.${user.id},user_id.eq.all`);
                }

                const { data, error } = await query;
                if (!error && Array.isArray(data)) {
                    cloudNotifs = data.map(n => ({
                        id: n.id,
                        userId: n.user_id,
                        senderName: n.sender_name || 'Sistema',
                        senderAvatar: n.sender_avatar || '🔔',
                        type: n.type || 'system',
                        title: n.title,
                        body: n.body,
                        link: n.link || '',
                        read: !!n.read,
                        createdAt: n.created_at || new Date().toISOString()
                    }));
                }
            } catch (err) {
                // fallback silencioso a local
            }
        }

        // Combinar con almacenamiento local
        let localNotifs = [];
        try {
            const raw = localStorage.getItem(NOTIF_STORAGE_PREFIX + user.id);
            localNotifs = raw ? JSON.parse(raw) : [];
        } catch (e) {
            localNotifs = [];
        }

        // Unificar evitando duplicados por id o por title+body
        const map = new Map();
        [...cloudNotifs, ...localNotifs].forEach(item => {
            const key = item.id || (item.title + '_' + item.body);
            if (!map.has(key)) map.set(key, item);
        });

        const sorted = Array.from(map.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return sorted;
    }

    // Crear notificación (para usuario, admins o global)
    async function createNotification(notif) {
        const payload = {
            userId: notif.userId || 'all',
            senderName: notif.senderName || 'Sistema',
            senderAvatar: notif.senderAvatar || '🔔',
            type: notif.type || 'system',
            title: notif.title || 'Nueva Notificación',
            body: notif.body || '',
            link: notif.link || '',
            read: false,
            createdAt: new Date().toISOString()
        };

        // Guardar en Supabase
        const client = await getSupabase();
        if (client) {
            try {
                await client.from('notificaciones').insert([{
                    user_id: String(payload.userId),
                    sender_name: payload.senderName,
                    sender_avatar: payload.senderAvatar,
                    type: payload.type,
                    title: payload.title,
                    body: payload.body,
                    link: payload.link,
                    read: false
                }]);
            } catch (e) {
                console.warn('[RDSLP] Notificación en nube pendiente:', e.message);
            }
        }

        // Guardar en local del destinatario si aplica
        try {
            const key = NOTIF_STORAGE_PREFIX + payload.userId;
            const existing = JSON.parse(localStorage.getItem(key) || '[]');
            existing.unshift({ ...payload, id: 'local_' + Date.now() });
            localStorage.setItem(key, JSON.stringify(existing.slice(0, 50)));
        } catch (e) {}

        // Disparar evento para actualizar UI inmediatamente
        window.dispatchEvent(new CustomEvent('rdslp_notification_updated'));
        return payload;
    }

    // Marcar como leída
    async function markAsRead(notifId) {
        const user = getCurrentUser();
        if (!user) return;

        const client = await getSupabase();
        if (client && typeof notifId === 'number') {
            try {
                await client.from('notificaciones').update({ read: true }).eq('id', notifId);
            } catch (e) {}
        }

        try {
            const key = NOTIF_STORAGE_PREFIX + user.id;
            const existing = JSON.parse(localStorage.getItem(key) || '[]');
            const updated = existing.map(n => (n.id == notifId ? { ...n, read: true } : n));
            localStorage.setItem(key, JSON.stringify(updated));
        } catch (e) {}

        updateBellUI();
    }

    // Marcar todas como leídas
    async function markAllAsRead() {
        const user = getCurrentUser();
        if (!user) return;

        const client = await getSupabase();
        if (client) {
            try {
                await client.from('notificaciones').update({ read: true }).eq('user_id', user.id);
            } catch (e) {}
        }

        try {
            const key = NOTIF_STORAGE_PREFIX + user.id;
            const existing = JSON.parse(localStorage.getItem(key) || '[]');
            const updated = existing.map(n => ({ ...n, read: true }));
            localStorage.setItem(key, JSON.stringify(updated));
        } catch (e) {}

        updateBellUI();
    }

    // =====================================================
    // 2. CHAT DE AYUDA / SOPORTE TÉCNICO (/ayuda)
    // =====================================================

    // Obtener historial de soporte del usuario
    async function getSupportMessages(ticketId) {
        const user = getCurrentUser();
        if (!user) return [];
        const tId = ticketId || user.id;

        let cloudMsgs = [];
        const client = await getSupabase();
        if (client) {
            try {
                const { data, error } = await client
                    .from('soporte_mensajes')
                    .select('*')
                    .eq('ticket_id', String(tId))
                    .order('created_at', { ascending: true });

                if (!error && Array.isArray(data)) {
                    cloudMsgs = data.map(m => ({
                        id: m.id,
                        ticketId: m.ticket_id,
                        userId: m.user_id,
                        userName: m.user_name,
                        userEmail: m.user_email,
                        senderRole: m.sender_role,
                        senderName: m.sender_name || (m.sender_role === 'bot' ? 'RDSLP Bot' : (m.sender_role === 'admin' ? 'Administrador' : m.user_name)),
                        message: m.message,
                        createdAt: m.created_at
                    }));
                }
            } catch (e) {}
        }

        let localMsgs = [];
        try {
            const raw = localStorage.getItem(SUPPORT_STORAGE_PREFIX + tId);
            localMsgs = raw ? JSON.parse(raw) : [];
        } catch (e) {}

        const map = new Map();
        [...localMsgs, ...cloudMsgs].forEach(m => {
            const key = m.id || (m.message + '_' + m.createdAt);
            if (!map.has(key)) map.set(key, m);
        });

        const sorted = Array.from(map.values()).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        // Si está completamente vacío, añadir mensaje de bienvenida del Bot de Ayuda
        if (sorted.length === 0) {
            const welcomeMsg = {
                id: 'welcome_' + tId,
                ticketId: tId,
                userId: tId,
                userName: user.name,
                userEmail: user.email,
                senderRole: 'bot',
                senderName: '🤖 RDSLP Asistente',
                message: '¡Hola! Bienvenido al canal oficial de Notificaciones del Sistema y Soporte Técnico de RDSLP. Aquí recibirás avisos sobre el estado de tu cuenta, infracciones, strikes o novedades.\n\n💡 Si necesitas ayuda de un moderador o administrador, escribe tu duda o usa el comando:\n/ayuda [describe tu problema aquí]\n\nSe enviará una alerta prioritaria al Administrador para responderte.',
                createdAt: new Date().toISOString()
            };
            sorted.push(welcomeMsg);
        }

        return sorted;
    }

    // Enviar mensaje en canal de soporte
    async function sendSupportMessage(text, targetTicketId) {
        const user = getCurrentUser();
        if (!user) return null;
        const isSenderAdmin = isCurrentUserAdmin();
        const ticketId = targetTicketId || user.id;

        const cleanText = String(text || '').trim();
        if (!cleanText) return null;

        const isHelpCommand = cleanText.toLowerCase().startsWith('/ayuda');
        let problemDescription = cleanText;
        if (isHelpCommand) {
            problemDescription = cleanText.replace(/^\/ayuda[\/\s]*/i, '').trim();
            if (!problemDescription) problemDescription = 'Solicitud de asistencia general';
        }

        const msgPayload = {
            ticketId: String(ticketId),
            userId: user.id,
            userName: user.name || 'Usuario',
            userEmail: user.email || '',
            senderRole: isSenderAdmin && targetTicketId ? 'admin' : 'user',
            senderName: isSenderAdmin && targetTicketId ? '🛡️ Administrador' : (user.name || 'Usuario'),
            message: cleanText,
            createdAt: new Date().toISOString()
        };

        // Guardar en Supabase
        const client = await getSupabase();
        if (client) {
            try {
                await client.from('soporte_mensajes').insert([{
                    ticket_id: msgPayload.ticketId,
                    user_id: msgPayload.userId,
                    user_name: msgPayload.userName,
                    user_email: msgPayload.userEmail,
                    sender_role: msgPayload.senderRole,
                    sender_name: msgPayload.senderName,
                    message: msgPayload.message
                }]);
            } catch (e) {
                console.warn('[RDSLP] Error guardando mensaje de soporte:', e.message);
            }
        }

        // Guardar en local
        try {
            const key = SUPPORT_STORAGE_PREFIX + ticketId;
            const msgs = JSON.parse(localStorage.getItem(key) || '[]');
            msgs.push({ ...msgPayload, id: 'local_' + Date.now() });
            localStorage.setItem(key, JSON.stringify(msgs));

            // Mantener índice de tickets
            const indexKey = 'rdslp_support_index';
            const index = JSON.parse(localStorage.getItem(indexKey) || '[]');
            if (!index.includes(String(ticketId))) {
                index.push(String(ticketId));
                localStorage.setItem(indexKey, JSON.stringify(index));
            }
        } catch (e) {}

        // Si es usuario pidiendo ayuda o usando /ayuda:
        if (!isSenderAdmin) {
            // 1. Notificar a TODOS los Administradores de forma urgente
            await createNotification({
                userId: 'admins',
                senderName: user.name,
                senderAvatar: '🚨',
                type: 'support',
                title: '🚨 Solicitud de Ayuda Recibida',
                body: `@${user.name} solicita soporte: "${problemDescription.substring(0, 90)}"`,
                link: '../Static/dashboard.html#admin'
            });

            // 2. Respuesta automática del Bot de Ayuda en el chat
            const botReply = {
                ticketId: String(ticketId),
                userId: user.id,
                userName: user.name,
                userEmail: user.email,
                senderRole: 'bot',
                senderName: '🤖 RDSLP Bot',
                message: isHelpCommand
                    ? `✅ Solicitud registrada con alta prioridad: "${problemDescription}".\nSe ha emitido una alerta oficial al Administrador con tu caso. Por favor espera su mensaje en este mismo chat.`
                    : 'Mensaje enviado a Soporte. Si deseas asistencia directa, puedes escribir "/ayuda [tu problema]" para alertar al Administrador.',
                createdAt: new Date(Date.now() + 600).toISOString()
            };

            if (client) {
                try {
                    await client.from('soporte_mensajes').insert([{
                        ticket_id: botReply.ticketId,
                        user_id: botReply.userId,
                        user_name: botReply.userName,
                        user_email: botReply.userEmail,
                        sender_role: botReply.senderRole,
                        sender_name: botReply.senderName,
                        message: botReply.message
                    }]);
                } catch (e) {}
            }

            try {
                const key = SUPPORT_STORAGE_PREFIX + ticketId;
                const msgs = JSON.parse(localStorage.getItem(key) || '[]');
                msgs.push({ ...botReply, id: 'bot_' + Date.now() });
                localStorage.setItem(key, JSON.stringify(msgs));
            } catch (e) {}
        } else {
            // Si el Admin respondió al usuario, enviarle una notificación directa al usuario
            await createNotification({
                userId: ticketId,
                senderName: '🛡️ Administrador',
                senderAvatar: '💬',
                type: 'support',
                title: '💬 Respuesta del Administrador',
                body: `El Administrador ha respondido a tu solicitud de soporte: "${cleanText.substring(0, 80)}"`,
                link: '../Static/dashboard.html#ayuda'
            });
        }

        window.dispatchEvent(new CustomEvent('rdslp_support_updated', { detail: { ticketId } }));
        return msgPayload;
    }

    // Obtener todos los tickets de soporte (exclusivo para Admin)
    async function getAllSupportTickets() {
        const client = await getSupabase();
        let ticketsMap = new Map();

        if (client) {
            try {
                const { data } = await client
                    .from('soporte_mensajes')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (Array.isArray(data)) {
                    data.forEach(m => {
                        const tId = m.ticket_id;
                        if (!ticketsMap.has(tId)) {
                            ticketsMap.set(tId, {
                                ticketId: tId,
                                userName: m.user_name || 'Usuario',
                                userEmail: m.user_email || '',
                                lastMessage: m.message,
                                lastSenderRole: m.sender_role,
                                lastSenderName: m.sender_name,
                                updatedAt: m.created_at,
                                messageCount: 1
                            });
                        } else {
                            ticketsMap.get(tId).messageCount++;
                        }
                    });
                }
            } catch (e) {}
        }

        // Revisar índice y keys de local storage
        try {
            const index = JSON.parse(localStorage.getItem('rdslp_support_index') || '[]');
            index.forEach(tId => {
                const key = SUPPORT_STORAGE_PREFIX + tId;
                const msgs = JSON.parse(localStorage.getItem(key) || '[]');
                if (msgs.length > 0 && !ticketsMap.has(tId)) {
                    const last = msgs[msgs.length - 1];
                    ticketsMap.set(tId, {
                        ticketId: tId,
                        userName: last.userName || 'Usuario',
                        userEmail: last.userEmail || '',
                        lastMessage: last.message,
                        lastSenderRole: last.senderRole,
                        lastSenderName: last.senderName,
                        updatedAt: last.createdAt,
                        messageCount: msgs.length
                    });
                }
            });
        } catch (e) {}

        return Array.from(ticketsMap.values()).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }

    // =====================================================
    // 3. RENDERIZADO DE LA CAMPANITA EN EL HEADER
    // =====================================================

    function mountNotificationBell() {
        const headerRight = document.querySelector('.main-header .header-right');
        if (!headerRight) return;

        // Si ya está montada, no duplicar
        if (document.getElementById('notificationsWrapper')) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'notifications-wrapper';
        wrapper.id = 'notificationsWrapper';
        wrapper.innerHTML = `
            <button type="button" class="btn-notification-bell" id="btnNotificationBell" title="Ver Notificaciones" aria-label="Notificaciones">
                <svg class="bell-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                <span class="notification-badge" id="notificationBadge" style="display: none;">0</span>
                <span class="bell-ping-ring"></span>
            </button>
            <div class="notifications-dropdown" id="notificationsDropdown" style="display: none;">
                <div class="notifications-header">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <h4 style="margin: 0; font-size: 15px; color: var(--text-primary); font-weight: 600;">Notificaciones</h4>
                        <span id="notifUnreadCountBadge" style="background: rgba(99, 102, 241, 0.2); color: #818cf8; padding: 2px 7px; border-radius: 10px; font-size: 11px; font-weight: 600;">0</span>
                    </div>
                    <button type="button" class="btn-mark-all-read" id="btnMarkAllRead" title="Marcar todas como leídas">Marcar leídas</button>
                </div>
                <div class="notifications-list" id="notificationsList">
                    <div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 13px;">Cargando notificaciones...</div>
                </div>
                <div class="notifications-footer">
                    <a href="../Static/dashboard.html#ayuda" id="linkToAyudaFooter" style="font-size: 12px; color: var(--accent-primary); text-decoration: none; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 6px;">
                        <span>💬 Centro de Ayuda y Soporte Oficial</span>
                    </a>
                </div>
            </div>
        `;

        // Insertar justo antes del userMenu
        const userMenu = headerRight.querySelector('.user-menu');
        if (userMenu) {
            headerRight.insertBefore(wrapper, userMenu);
        } else {
            headerRight.appendChild(wrapper);
        }

        // Listeners de la campanita
        const btnBell = wrapper.querySelector('#btnNotificationBell');
        const dropdown = wrapper.querySelector('#notificationsDropdown');
        const btnMarkAll = wrapper.querySelector('#btnMarkAllRead');

        btnBell.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = dropdown.style.display !== 'none';
            dropdown.style.display = isOpen ? 'none' : 'block';
            if (!isOpen) {
                renderNotificationsList();
            }
        });

        btnMarkAll.addEventListener('click', async (e) => {
            e.stopPropagation();
            await markAllAsRead();
            renderNotificationsList();
        });

        // Cerrar al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });

        const linkAyuda = wrapper.querySelector('#linkToAyudaFooter');
        if (linkAyuda) {
            linkAyuda.addEventListener('click', (e) => {
                dropdown.style.display = 'none';
                const ayudaTab = document.querySelector('.chat-tab[data-chat="ayuda"]');
                if (ayudaTab) {
                    e.preventDefault();
                    ayudaTab.click();
                    const chatSection = document.getElementById('chatMessages') || document.querySelector('.community-chat');
                    if (chatSection) chatSection.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }

        // Actualizar contador
        updateBellUI();
    }

    let lastKnownUnreadCount = -1;

    // Actualizar badge y efecto luminoso ("alumbre") de la campanita
    async function updateBellUI() {
        const btnBell = document.getElementById('btnNotificationBell');
        const badge = document.getElementById('notificationBadge');
        const unreadCountBadge = document.getElementById('notifUnreadCountBadge');
        if (!btnBell) return;

        const notifs = await getNotifications();
        const unreadCount = notifs.filter(n => !n.read).length;

        if (unreadCount > 0) {
            if (badge) {
                badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
                badge.style.display = 'flex';
            }
            if (unreadCountBadge) unreadCountBadge.textContent = unreadCount;

            // Activar resplandor constante ("alumbre")
            btnBell.classList.add('has-unread');

            // Si llegó una nueva notificación desde la última comprobación, lanzar destello animado
            if (lastKnownUnreadCount >= 0 && unreadCount > lastKnownUnreadCount) {
                btnBell.classList.remove('just-arrived');
                void btnBell.offsetWidth; // reiniciar animación
                btnBell.classList.add('just-arrived');
                setTimeout(() => {
                    btnBell.classList.remove('just-arrived');
                }, 1200);
            }
        } else {
            if (badge) badge.style.display = 'none';
            if (unreadCountBadge) unreadCountBadge.textContent = '0';
            btnBell.classList.remove('has-unread');
            btnBell.classList.remove('just-arrived');
        }

        lastKnownUnreadCount = unreadCount;
    }

    // Renderizar lista en el dropdown
    async function renderNotificationsList() {
        const listEl = document.getElementById('notificationsList');
        if (!listEl) return;

        const notifs = await getNotifications();
        if (notifs.length === 0) {
            listEl.innerHTML = `
                <div style="padding: 30px 20px; text-align: center; color: var(--text-muted);">
                    <div style="font-size: 28px; margin-bottom: 6px;">🔔</div>
                    <div style="font-size: 13px; font-weight: 500;">No tienes notificaciones aún</div>
                    <p style="font-size: 12px; margin: 4px 0 0 0;">Aquí verás likes, mensajes, strikes y avisos oficiales.</p>
                </div>
            `;
            return;
        }

        listEl.innerHTML = notifs.map(n => {
            const timeAgo = formatTimeAgo(n.createdAt);
            const isUnread = !n.read;
            const bgClass = isUnread ? 'style="background: rgba(99, 102, 241, 0.08);"' : '';
            const unreadDot = isUnread ? '<span style="width: 8px; height: 8px; border-radius: 50%; background: #6366f1; flex-shrink: 0;"></span>' : '';

            // Icono según tipo
            let icon = n.senderAvatar || '🔔';
            if (n.type === 'like') icon = '❤️';
            else if (n.type === 'comment') icon = '💬';
            else if (n.type === 'strike') icon = '⚠️';
            else if (n.type === 'mute') icon = '🔇';
            else if (n.type === 'support') icon = '🚨';
            else if (n.type === 'community') icon = '👥';
            else if (n.type === 'follow') icon = '👤';
            else if (n.type === 'broadcast') icon = '📢';

            return `
                <div class="notification-item ${isUnread ? 'unread' : ''}" ${bgClass} onclick="window.rdslpNotifications.handleNotificationClick('${n.id}', '${encodeURIComponent(n.link || '')}')" style="display: flex; align-items: flex-start; gap: 12px; padding: 12px 14px; border-bottom: 1px solid var(--border-color); cursor: pointer; transition: background 0.2s;">
                    <div style="font-size: 20px; line-height: 1; flex-shrink: 0; padding-top: 2px;">${icon}</div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
                            <strong style="font-size: 13px; color: var(--text-primary);">${escapeHtml(n.title)}</strong>
                            <span style="font-size: 11px; color: var(--text-muted);">${timeAgo}</span>
                        </div>
                        <p style="font-size: 12px; color: var(--text-secondary); margin: 0; line-height: 1.4; word-break: break-word;">${escapeHtml(n.body)}</p>
                    </div>
                    ${unreadDot}
                </div>
            `;
        }).join('');
    }

    function handleNotificationClick(id, encodedLink) {
        markAsRead(id);
        if (encodedLink) {
            const link = decodeURIComponent(encodedLink);
            if (link) {
                window.location.href = link;
            }
        }
    }

    function formatTimeAgo(isoDate) {
        if (!isoDate) return 'Reciente';
        const diffMs = Date.now() - new Date(isoDate).getTime();
        const mins = Math.floor(diffMs / 60000);
        if (mins < 1) return 'Ahora';
        if (mins < 60) return `Hace ${mins}m`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `Hace ${hours}h`;
        const days = Math.floor(hours / 24);
        return `Hace ${days}d`;
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Polling en segundo plano cada 5 segundos
    function startPolling() {
        if (pollingInterval) clearInterval(pollingInterval);
        pollingInterval = setInterval(() => {
            updateBellUI();
        }, 5000);
    }

    // Inicializar al cargar el DOM
    document.addEventListener('DOMContentLoaded', () => {
        mountNotificationBell();
        startPolling();
        window.addEventListener('rdslp_notification_updated', updateBellUI);
        window.addEventListener('rdslp_user_updated', updateBellUI);
    });

    // API pública global
    window.rdslpNotifications = {
        getNotifications,
        createNotification,
        markAsRead,
        markAllAsRead,
        getSupportMessages,
        sendSupportMessage,
        getAllSupportTickets,
        handleNotificationClick,
        updateBellUI,
        mountNotificationBell
    };
})();
