/* =====================================================
   RDSLP - Sistema Social, Amistades y Moderación tipo Facebook
   Gestiona seguidores, amigos mutuos, chats privados,
   reportes, avisos/strikes y sanciones temporales/permanentes.
===================================================== */

(function () {
    const SocialModeration = {
        // =====================================================
        // SEGUIDORES Y AMISTADES MUTUAS
        // =====================================================
        getFollows: function () {
            try {
                return JSON.parse(localStorage.getItem('rdslp_follows') || '[]');
            } catch (e) {
                return [];
            }
        },

        saveFollows: function (follows) {
            localStorage.setItem('rdslp_follows', JSON.stringify(follows));
            window.dispatchEvent(new CustomEvent('rdslp_follows_updated'));
        },

        isFollowing: function (followerId, targetId) {
            if (!followerId || !targetId) return false;
            const follows = this.getFollows();
            return follows.some(f => String(f.followerId) === String(followerId) && String(f.targetId) === String(targetId));
        },

        toggleFollow: function (followerUser, targetUser) {
            if (!followerUser || !targetUser) return { success: false, message: 'Usuario inválido' };
            if (String(followerUser.id) === String(targetUser.id)) {
                return { success: false, message: 'No puedes seguirte a ti mismo' };
            }

            let follows = this.getFollows();
            const index = follows.findIndex(f => String(f.followerId) === String(followerUser.id) && String(f.targetId) === String(targetUser.id));
            let isNowFollowing = false;

            if (index >= 0) {
                // Dejar de seguir
                follows.splice(index, 1);
                isNowFollowing = false;
            } else {
                // Comenzar a seguir
                follows.push({
                    followerId: String(followerUser.id),
                    followerName: followerUser.name || 'Usuario',
                    targetId: String(targetUser.id),
                    targetName: targetUser.name || 'Usuario',
                    createdAt: new Date().toISOString()
                });
                isNowFollowing = true;

                // Enviar notificación al usuario seguido para que se marque en su campanita y alumbre
                try {
                    if (window.rdslpNotifications && typeof window.rdslpNotifications.createNotification === 'function') {
                        window.rdslpNotifications.createNotification({
                            userId: String(targetUser.id),
                            senderName: followerUser.name || 'Usuario',
                            senderAvatar: '👤',
                            type: 'follow',
                            title: '👤 Nuevo Seguidor',
                            body: `@${followerUser.name || 'Un usuario'} ha comenzado a seguirte en la red social.`,
                            link: '../Static/dashboard.html#perfil'
                        }).catch(() => {});
                    }
                } catch (e) {}
            }

            this.saveFollows(follows);
            const isMutual = this.isMutual(followerUser.id, targetUser.id);

            return {
                success: true,
                isFollowing: isNowFollowing,
                isMutual: isMutual,
                followerCount: this.getFollowersCount(targetUser.id)
            };
        },

        // Dos personas son amigos mutuos SOLO si ambos se siguen mutuamente
        isMutual: function (userAId, userBId) {
            if (!userAId || !userBId) return false;
            const aFollowsB = this.isFollowing(userAId, userBId);
            const bFollowsA = this.isFollowing(userBId, userAId);
            return aFollowsB && bFollowsA;
        },

        getFollowersCount: function (targetId) {
            const follows = this.getFollows();
            return follows.filter(f => String(f.targetId) === String(targetId)).length;
        },

        getFollowingCount: function (userId) {
            const follows = this.getFollows();
            return follows.filter(f => String(f.followerId) === String(userId)).length;
        },

        // =====================================================
        // CHATS PRIVADOS (SOLO SI SE SIGUEN MUTUAMENTE)
        // =====================================================
        getChats: function () {
            try {
                return JSON.parse(localStorage.getItem('rdslp_direct_chats') || '{}');
            } catch (e) {
                return {};
            }
        },

        getChatKey: function (userAId, userBId) {
            const sorted = [String(userAId), String(userBId)].sort();
            return `chat_${sorted[0]}_${sorted[1]}`;
        },

        getMessages: function (userAId, userBId) {
            const chats = this.getChats();
            const key = this.getChatKey(userAId, userBId);
            return chats[key] || [];
        },

        sendDirectMessage: function (fromUser, targetUserId, text) {
            if (!fromUser || !targetUserId || !text.trim()) {
                return { success: false, message: 'Datos incompletos' };
            }

            // Verificar si el usuario está silenciado
            const sanction = this.getSanctionStatus(fromUser.id);
            if (sanction.isMuted) {
                return { success: false, message: `Estás silenciado: ${sanction.muteReason || 'Restricción de moderación'}` };
            }

            // REGLA CLAVE: Solo se permite chat si ambos se siguen mutuamente
            if (!this.isMutual(fromUser.id, targetUserId)) {
                return {
                    success: false,
                    isBlocked: true,
                    message: 'No puedes enviar mensajes: ambos usuarios deben seguirse mutuamente para habilitar el chat privado.'
                };
            }

            const chats = this.getChats();
            const key = this.getChatKey(fromUser.id, targetUserId);
            if (!chats[key]) chats[key] = [];

            const newMessage = {
                id: Date.now(),
                senderId: String(fromUser.id),
                senderName: fromUser.name || 'Usuario',
                senderAvatar: (fromUser.name ? fromUser.name.charAt(0) : 'U').toUpperCase(),
                text: text.trim(),
                time: new Date().toISOString()
            };

            chats[key].push(newMessage);
            localStorage.setItem('rdslp_direct_chats', JSON.stringify(chats));
            window.dispatchEvent(new CustomEvent('rdslp_chat_message', { detail: { key, message: newMessage } }));

            if (window.rdslpNotifications && window.rdslpNotifications.createNotification) {
                window.rdslpNotifications.createNotification({
                    userId: String(targetUserId),
                    senderName: fromUser.name || 'Usuario',
                    senderAvatar: '💬',
                    type: 'message',
                    title: '💬 Nuevo Mensaje Directo',
                    body: `@${fromUser.name || 'Usuario'}: "${text.trim().substring(0, 60)}"`,
                    link: '../Static/muro.html'
                });
            }

            return { success: true, message: newMessage };
        },

        // =====================================================
        // SANCIONES Y MODERACIÓN TIPO FACEBOOK (ADMIN / MODERADOR)
        // =====================================================
        getSanctions: function () {
            try {
                return JSON.parse(localStorage.getItem('rdslp_sanctions') || '{}');
            } catch (e) {
                return {};
            }
        },

        saveSanctions: function (sanctions) {
            localStorage.setItem('rdslp_sanctions', JSON.stringify(sanctions));
            window.dispatchEvent(new CustomEvent('rdslp_sanctions_updated'));
        },

        getSanctionStatus: function (userId) {
            if (!userId) return { isBanned: false, isMuted: false, warnings: [] };
            const sanctions = this.getSanctions();
            const userSanction = sanctions[String(userId)] || { warnings: [] };

            const now = new Date().getTime();
            let isBanned = false;
            let banExpires = null;
            let banReason = userSanction.banReason || '';

            if (userSanction.bannedUntil) {
                if (userSanction.bannedUntil === 'permanent') {
                    isBanned = true;
                } else {
                    const until = new Date(userSanction.bannedUntil).getTime();
                    if (until > now) {
                        isBanned = true;
                        banExpires = userSanction.bannedUntil;
                    }
                }
            }

            let isMuted = false;
            let muteExpires = null;
            let muteReason = userSanction.muteReason || '';

            if (userSanction.mutedUntil) {
                if (userSanction.mutedUntil === 'permanent') {
                    isMuted = true;
                } else {
                    const until = new Date(userSanction.mutedUntil).getTime();
                    if (until > now) {
                        isMuted = true;
                        muteExpires = userSanction.mutedUntil;
                    }
                }
            }

            return {
                isBanned,
                banExpires,
                banReason,
                isMuted,
                muteExpires,
                muteReason,
                warnings: userSanction.warnings || []
            };
        },

        // 1. Enviar Aviso / Reporte Oficial (Strike)
        issueWarning: function (adminUser, targetUserId, targetUserName, reason, note) {
            if (!this._canModerate(adminUser)) {
                return { success: false, message: 'No tienes permisos de moderación' };
            }

            const sanctions = this.getSanctions();
            const id = String(targetUserId);
            if (!sanctions[id]) sanctions[id] = { warnings: [] };

            const warning = {
                id: 'warn_' + Date.now(),
                reason: reason || 'Incumplimiento de normas comunitarias',
                note: note || '',
                issuedBy: adminUser.name || 'Moderador',
                date: new Date().toISOString(),
                acknowledged: false
            };

            sanctions[id].warnings.push(warning);
            this.saveSanctions(sanctions);

            if (window.rdslpNotifications && window.rdslpNotifications.createNotification) {
                window.rdslpNotifications.createNotification({
                    userId: String(targetUserId),
                    senderName: adminUser.name || 'Moderador',
                    senderAvatar: '⚠️',
                    type: 'strike',
                    title: '⚠️ Aviso Oficial de la Comunidad (Strike)',
                    body: `Has recibido un strike por: ${reason || 'Infracción de normas'}. ${note ? 'Nota: ' + note : ''}`,
                    link: '../Static/dashboard.html#ayuda'
                });
            }

            return { success: true, warning, count: sanctions[id].warnings.length };
        },

        // 2. Silenciar de Chat y Comentarios (Días o Permanente)
        muteUser: function (adminUser, targetUserId, durationDays, reason) {
            if (!this._canModerate(adminUser)) {
                return { success: false, message: 'No tienes permisos de moderación' };
            }

            const sanctions = this.getSanctions();
            const id = String(targetUserId);
            if (!sanctions[id]) sanctions[id] = { warnings: [] };

            let mutedUntil = 'permanent';
            if (durationDays && Number(durationDays) > 0) {
                const expires = new Date();
                expires.setDate(expires.getDate() + Number(durationDays));
                mutedUntil = expires.toISOString();
            }

            sanctions[id].mutedUntil = mutedUntil;
            sanctions[id].muteReason = reason || 'Comportamiento no adecuado en comentarios/chat';
            sanctions[id].mutedBy = adminUser.name;
            sanctions[id].mutedAt = new Date().toISOString();

            this.saveSanctions(sanctions);

            if (window.rdslpNotifications && window.rdslpNotifications.createNotification) {
                window.rdslpNotifications.createNotification({
                    userId: String(targetUserId),
                    senderName: adminUser.name || 'Moderador',
                    senderAvatar: '🔇',
                    type: 'mute',
                    title: '🔇 Silenciado de Chat y Comentarios',
                    body: `Tu cuenta ha sido silenciada (${durationDays ? durationDays + ' días' : 'Permanente'}). Motivo: ${reason || 'Comportamiento inapropiado'}`,
                    link: '../Static/dashboard.html#ayuda'
                });
            }

            return { success: true, mutedUntil };
        },

        // 3. Banear Cuenta (Días o Permanente)
        banUser: function (adminUser, targetUserId, durationDays, reason) {
            if (!this._canModerate(adminUser)) {
                return { success: false, message: 'No tienes permisos de moderación' };
            }

            const sanctions = this.getSanctions();
            const id = String(targetUserId);
            if (!sanctions[id]) sanctions[id] = { warnings: [] };

            let bannedUntil = 'permanent';
            if (durationDays && Number(durationDays) > 0) {
                const expires = new Date();
                expires.setDate(expires.getDate() + Number(durationDays));
                bannedUntil = expires.toISOString();
            }

            sanctions[id].bannedUntil = bannedUntil;
            sanctions[id].banReason = reason || 'Violación grave de términos y condiciones';
            sanctions[id].bannedBy = adminUser.name;
            sanctions[id].bannedAt = new Date().toISOString();

            this.saveSanctions(sanctions);

            if (window.rdslpNotifications && window.rdslpNotifications.createNotification) {
                window.rdslpNotifications.createNotification({
                    userId: String(targetUserId),
                    senderName: adminUser.name || 'Moderador',
                    senderAvatar: '⛔',
                    type: 'system',
                    title: '⛔ Cuenta Suspendida / Baneada',
                    body: `Tu cuenta ha sido suspendida (${durationDays ? durationDays + ' días' : 'Permanente'}). Motivo: ${reason || 'Violación de normas'}`,
                    link: '../Static/dashboard.html#ayuda'
                });
            }

            // Intentar registrar en Supabase
            if (window.rdslpSupabase && bannedUntil === 'permanent') {
                window.rdslpSupabase.toggleBanUser(targetUserId, true).catch(() => {});
            }

            return { success: true, bannedUntil };
        },

        // 4. Levantar todas las sanciones (Perdonar / Desbanear)
        liftSanctions: function (adminUser, targetUserId) {
            if (!this._canModerate(adminUser)) {
                return { success: false, message: 'No tienes permisos de moderación' };
            }

            const sanctions = this.getSanctions();
            const id = String(targetUserId);
            if (sanctions[id]) {
                delete sanctions[id].bannedUntil;
                delete sanctions[id].banReason;
                delete sanctions[id].mutedUntil;
                delete sanctions[id].muteReason;
                this.saveSanctions(sanctions);
            }

            if (window.rdslpSupabase) {
                window.rdslpSupabase.toggleBanUser(targetUserId, false).catch(() => {});
            }

            return { success: true };
        },

        // 5. Reportar Publicación (por cualquier usuario)
        reportPost: function (reportingUser, postId, reason, details) {
            try {
                const reports = JSON.parse(localStorage.getItem('rdslp_reports') || '[]');
                const newReport = {
                    id: 'rep_' + Date.now(),
                    postId,
                    reportingUserId: reportingUser ? reportingUser.id : 'anon',
                    reportingUserName: reportingUser ? reportingUser.name : 'Usuario',
                    reason,
                    details: details || '',
                    date: new Date().toISOString(),
                    status: 'pending'
                };
                reports.push(newReport);
                localStorage.setItem('rdslp_reports', JSON.stringify(reports));
                return { success: true, report: newReport };
            } catch (e) {
                return { success: false, message: e.message };
            }
        },

        _canModerate: function (user) {
            if (!user) return false;
            return user.role === 'admin' || user.role === 'moderator';
        }
    };

    window.SocialModerationManager = SocialModeration;
})();
