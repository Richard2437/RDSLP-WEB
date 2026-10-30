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
        // =====================================================
        // SEGUIDORES Y AMISTADES MUTUAS (CON SINCRONIZACIÓN CLOUD)
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

        isFollowing: function (followerId, targetId, followerName, targetName) {
            if (!followerId && !followerName) return false;
            if (!targetId && !targetName) return false;
            const follows = this.getFollows();
            const fId = followerId && followerId !== 'null' && followerId !== 'undefined' ? String(followerId) : '';
            const tId = targetId && targetId !== 'null' && targetId !== 'undefined' ? String(targetId) : '';
            const fName = followerName ? String(followerName).trim().toLowerCase() : '';
            const tName = targetName ? String(targetName).trim().toLowerCase() : '';

            return follows.some(f => {
                const matchFollower = (fId && String(f.followerId) === fId) ||
                                      (fName && f.followerName && String(f.followerName).trim().toLowerCase() === fName);
                const matchTarget = (tId && String(f.targetId) === tId) ||
                                    (tName && f.targetName && String(f.targetName).trim().toLowerCase() === tName);
                return matchFollower && matchTarget;
            });
        },

        // Dos personas son amigos mutuos SOLO si ambos se siguen mutuamente
        isMutual: function (userAId, userBId, userAName, userBName) {
            const aFollowsB = this.isFollowing(userAId, userBId, userAName, userBName);
            const bFollowsA = this.isFollowing(userBId, userAId, userBName, userAName);
            return aFollowsB && bFollowsA;
        },

        getFollowersCount: function (targetId, targetName) {
            const follows = this.getFollows();
            const tId = targetId && targetId !== 'null' && targetId !== 'undefined' ? String(targetId) : '';
            const tName = targetName ? String(targetName).trim().toLowerCase() : '';

            return follows.filter(f => {
                return (tId && String(f.targetId) === tId) ||
                       (tName && f.targetName && String(f.targetName).trim().toLowerCase() === tName);
            }).length;
        },

        getFollowingCount: function (userId, userName) {
            const follows = this.getFollows();
            const uId = userId && userId !== 'null' && userId !== 'undefined' ? String(userId) : '';
            const uName = userName ? String(userName).trim().toLowerCase() : '';

            return follows.filter(f => {
                return (uId && String(f.followerId) === uId) ||
                       (uName && f.followerName && String(f.followerName).trim().toLowerCase() === uName);
            }).length;
        },

        toggleFollow: async function (followerUser, targetUser) {
            if (!followerUser || !targetUser) return { success: false, message: 'Usuario inválido' };

            const followerId = String(followerUser.id || followerUser.name);
            const followerName = followerUser.name || 'Usuario';
            const targetId = String(targetUser.id || targetUser.name);
            const targetName = targetUser.name || 'Usuario';

            if (followerId === targetId || followerName.toLowerCase() === targetName.toLowerCase()) {
                return { success: false, message: 'No puedes seguirte a ti mismo' };
            }

            let follows = this.getFollows();
            const isCurrentlyFollowing = this.isFollowing(followerId, targetId, followerName, targetName);
            let isNowFollowing = false;

            if (isCurrentlyFollowing) {
                // Dejar de seguir: eliminar coincidencias
                follows = follows.filter(f => {
                    const matchF = (String(f.followerId) === followerId) || (f.followerName && f.followerName.toLowerCase() === followerName.toLowerCase());
                    const matchT = (String(f.targetId) === targetId) || (f.targetName && f.targetName.toLowerCase() === targetName.toLowerCase());
                    return !(matchF && matchT);
                });
                isNowFollowing = false;
                this.syncCloudFollow({ followerId, followerName, targetId, targetName, action: 'unfollow' });
            } else {
                // Comenzar a seguir
                const newFollow = {
                    followerId: followerId,
                    followerName: followerName,
                    targetId: targetId,
                    targetName: targetName,
                    createdAt: new Date().toISOString()
                };
                follows.push(newFollow);
                isNowFollowing = true;

                // Sincronizar en la nube Supabase para soporte multi-dispositivo real
                this.syncCloudFollow({ followerId, followerName, targetId, targetName, action: 'follow' });

                // Enviar notificación al usuario seguido para que se marque en su campanita y alumbre
                try {
                    if (window.rdslpNotifications && typeof window.rdslpNotifications.createNotification === 'function') {
                        window.rdslpNotifications.createNotification({
                            userId: String(targetId),
                            senderId: String(followerId),
                            senderName: followerName,
                            senderAvatar: '👤',
                            type: 'follow',
                            title: '👤 Nuevo Seguidor',
                            body: `@${followerName} ha comenzado a seguirte. Toca para ver su perfil.`,
                            link: `muro.html?openProfile=${encodeURIComponent(followerId)}&name=${encodeURIComponent(followerName)}`,
                            metadata: {
                                action: 'profile',
                                targetUserId: String(followerId),
                                targetUserName: followerName
                            }
                        }).catch(() => {});
                    }
                } catch (e) {}
            }

            this.saveFollows(follows);
            const isMutual = this.isMutual(followerId, targetId, followerName, targetName);

            return {
                success: true,
                isFollowing: isNowFollowing,
                isMutual: isMutual,
                followerCount: this.getFollowersCount(targetId, targetName)
            };
        },

        // Sincronizar un follow/unfollow a Supabase (tabla mensajes con chat_id = '__FOLLOW__')
        syncCloudFollow: async function (data) {
            try {
                if (!window.rdslpSupabase || typeof window.rdslpSupabase.getClient !== 'function') return;
                const client = await window.rdslpSupabase.getClient();
                if (!client) return;

                if (data.action === 'unfollow') {
                    await client
                        .from('mensajes')
                        .delete()
                        .eq('chat_id', '__FOLLOW__')
                        .eq('author_id', String(data.followerId));
                } else {
                    await client
                        .from('mensajes')
                        .insert([{
                            chat_id: '__FOLLOW__',
                            author_id: String(data.followerId),
                            author_name: data.followerName,
                            text: JSON.stringify({
                                followerId: String(data.followerId),
                                followerName: data.followerName,
                                targetId: String(data.targetId),
                                targetName: data.targetName,
                                createdAt: new Date().toISOString()
                            })
                        }]);
                }
            } catch (e) {
                console.warn('[RDSLP] Error sincronizando follow en Supabase:', e);
            }
        },

        // Cargar follows desde Supabase y sincronizar entre dispositivos
        loadCloudFollows: async function () {
            try {
                if (!window.rdslpSupabase || typeof window.rdslpSupabase.getClient !== 'function') return;
                const client = await window.rdslpSupabase.getClient();
                if (!client) return;

                const { data, error } = await client
                    .from('mensajes')
                    .select('*')
                    .eq('chat_id', '__FOLLOW__')
                    .order('created_at', { ascending: false });

                if (!error && Array.isArray(data)) {
                    const cloudFollows = [];
                    data.forEach(item => {
                        try {
                            const parsed = JSON.parse(item.text);
                            if (parsed && (parsed.followerId || parsed.followerName) && (parsed.targetId || parsed.targetName)) {
                                cloudFollows.push(parsed);
                            }
                        } catch (e) {}
                    });

                    // Subir los locales existentes que no estén en la nube aún (migración inicial transparente)
                    const localFollows = this.getFollows();
                    for (const lf of localFollows) {
                        const existsInCloud = cloudFollows.some(cf => 
                            (cf.followerName?.toLowerCase() === lf.followerName?.toLowerCase() || String(cf.followerId) === String(lf.followerId)) &&
                            (cf.targetName?.toLowerCase() === lf.targetName?.toLowerCase() || String(cf.targetId) === String(lf.targetId))
                        );
                        if (!existsInCloud && lf.followerId && lf.targetId) {
                            this.syncCloudFollow({ ...lf, action: 'follow' });
                            cloudFollows.push(lf);
                        }
                    }

                    // Fusionar en un mapa único evitando duplicados
                    const map = new Map();
                    localFollows.concat(cloudFollows).forEach(f => {
                        const key = `${(f.followerName || f.followerId || '').toLowerCase()}_${(f.targetName || f.targetId || '').toLowerCase()}`;
                        if (key && key !== '_') map.set(key, f);
                    });

                    const merged = Array.from(map.values());
                    localStorage.setItem('rdslp_follows', JSON.stringify(merged));
                    window.dispatchEvent(new CustomEvent('rdslp_follows_updated'));
                }
            } catch (e) {
                console.warn('[RDSLP] Error cargando follows desde Supabase:', e);
            }
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

        getChatKey: function (userAId, userBId, userAName, userBName) {
            const nameA = String(userAName || userAId || 'userA').trim().toLowerCase();
            const nameB = String(userBName || userBId || 'userB').trim().toLowerCase();
            const sorted = [nameA, nameB].sort();
            return `chat_${sorted[0]}_${sorted[1]}`;
        },

        getMessages: function (userAId, userBId, userAName, userBName) {
            const chats = this.getChats();
            const key = this.getChatKey(userAId, userBId, userAName, userBName);
            return chats[key] || [];
        },

        sendDirectMessage: async function (fromUser, targetUserId, text, targetUserName) {
            if (!fromUser || !targetUserId || !text.trim()) {
                return { success: false, message: 'Datos incompletos' };
            }

            // Verificar si el usuario está silenciado
            const sanction = this.getSanctionStatus(fromUser.id);
            if (sanction.isMuted) {
                return { success: false, message: `Estás silenciado: ${sanction.muteReason || 'Restricción de moderación'}` };
            }

            // REGLA CLAVE: Solo se permite chat si ambos se siguen mutuamente
            if (!this.isMutual(fromUser.id, targetUserId, fromUser.name, targetUserName)) {
                return {
                    success: false,
                    isBlocked: true,
                    message: 'No puedes enviar mensajes: ambos usuarios deben seguirse mutuamente para habilitar el chat privado.'
                };
            }

            const chats = this.getChats();
            const key = this.getChatKey(fromUser.id, targetUserId, fromUser.name, targetUserName);
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

            // Guardar en Supabase para sincronización multi-dispositivo en tiempo real
            if (window.rdslpSupabase && typeof window.rdslpSupabase.getClient === 'function') {
                try {
                    const client = await window.rdslpSupabase.getClient();
                    if (client) {
                        await client.from('mensajes').insert([{
                            chat_id: 'dm_' + key,
                            author_id: String(fromUser.id),
                            author_name: fromUser.name || 'Usuario',
                            text: text.trim()
                        }]);
                    }
                } catch (e) {
                    console.warn('[RDSLP] Error guardando DM en Supabase:', e);
                }
            }

            if (window.rdslpNotifications && window.rdslpNotifications.createNotification) {
                window.rdslpNotifications.createNotification({
                    userId: String(targetUserId),
                    senderId: String(fromUser.id),
                    senderName: fromUser.name || 'Usuario',
                    senderAvatar: '💬',
                    type: 'message',
                    title: '💬 Nuevo Mensaje Directo',
                    body: `@${fromUser.name || 'Usuario'}: "${text.trim().substring(0, 60)}"`,
                    link: `muro.html?openChat=${fromUser.id}&chatName=${encodeURIComponent(fromUser.name || 'Usuario')}`,
                    metadata: {
                        action: 'chat',
                        targetUserId: String(fromUser.id),
                        targetUserName: fromUser.name || 'Usuario'
                    }
                }).catch(() => {});
            }

            return { success: true, message: newMessage };
        },

        // Sincronizar mensajes directos desde Supabase
        syncCloudDirectMessages: async function (userAId, userBId, userAName, userBName) {
            const key = this.getChatKey(userAId, userBId, userAName, userBName);
            try {
                if (!window.rdslpSupabase || typeof window.rdslpSupabase.getClient !== 'function') return;
                const client = await window.rdslpSupabase.getClient();
                if (!client) return;

                const { data, error } = await client
                    .from('mensajes')
                    .select('*')
                    .eq('chat_id', 'dm_' + key)
                    .order('created_at', { ascending: true });

                if (!error && Array.isArray(data)) {
                    const chats = this.getChats();
                    const cloudMsgs = data.map(d => ({
                        id: d.id,
                        senderId: String(d.author_id),
                        senderName: d.author_name || 'Usuario',
                        senderAvatar: (d.author_name ? d.author_name.charAt(0) : 'U').toUpperCase(),
                        text: d.text,
                        time: d.created_at
                    }));
                    if (cloudMsgs.length > 0) {
                        chats[key] = cloudMsgs;
                        localStorage.setItem('rdslp_direct_chats', JSON.stringify(chats));
                        window.dispatchEvent(new CustomEvent('rdslp_chat_synced', { detail: { key } }));
                    }
                }
            } catch (e) {
                console.warn('[RDSLP] Error sincronizando DMs desde Supabase:', e);
            }
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
                    link: 'comunidad.html?chat=ayuda#ayuda',
                    metadata: {
                        action: 'support_user',
                        chat: 'ayuda'
                    }
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
                    link: 'comunidad.html?chat=ayuda#ayuda',
                    metadata: {
                        action: 'support_user',
                        chat: 'ayuda'
                    }
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
                    link: 'comunidad.html?chat=ayuda#ayuda',
                    metadata: {
                        action: 'support_user',
                        chat: 'ayuda'
                    }
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
