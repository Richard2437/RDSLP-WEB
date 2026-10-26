/* =====================================================
   RDSLP - Sistema de Autenticación y Roles
   Red Social de Lenguajes de Programación
   ===================================================== */

// Import async storage helpers (Supabase-backed KV store)
import { getItem, setItem, removeItem, getJSON, setJSON } from "./storage.js";

// Roles disponibles
const ROLES = {
    USER: "user",
    MODERATOR: "moderator",
    ADMIN: "admin",
};

// Permisos por rol
const PERMISSIONS = {
    user: {
        canPublish: true,
        canComment: true,
        canRate: true,
        canEditOwnContent: true,
        canDeleteOwnContent: true,
        canDeleteOthersContent: false,
        canDeleteOthersComments: false,
        canManageUsers: false,
        canManageEvents: false,
    },
    moderator: {
        canPublish: true,
        canComment: true,
        canRate: true,
        canEditOwnContent: true,
        canDeleteOwnContent: true,
        canDeleteOthersContent: true,
        canDeleteOthersComments: true,
        canManageUsers: false,
        canManageEvents: true,
    },
    admin: {
        canPublish: true,
        canComment: true,
        canRate: true,
        canEditOwnContent: true,
        canDeleteOwnContent: true,
        canDeleteOthersContent: true,
        canDeleteOthersComments: true,
        canManageUsers: true,
        canManageEvents: true,
    },
};

/** Auth Manager conectado con Supabase */
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.cachedUsers = [];
        this.init();
    }

    async init() {
        await this.syncCurrentUser();
    }

    async syncCurrentUser() {
        if (window.rdslpSupabase) {
            try {
                const user = await window.rdslpSupabase.getCurrentUser();
                if (user) this.currentUser = user;
            } catch (err) {
                console.warn("[RDSLP] Supabase sync error:", err.message);
            }
        }
    }

    getAllUsers() { return this.cachedUsers; }
    async fetchAllUsers() {
        if (window.rdslpSupabase) {
            try { this.cachedUsers = await window.rdslpSupabase.getAllUsers(); return this.cachedUsers; }
            catch (e) { console.error("[RDSLP] Error obteniendo usuarios de Supabase:", e); }
        }
        return this.cachedUsers;
    }
    findUserByEmail(email) { return this.cachedUsers.find(u => u.email === email); }

    async login(email, password, remember = true) {
        if (window.rdslpSupabase) {
            try {
                await window.rdslpSupabase.signInWithEmail(email, password);
                this.currentUser = await window.rdslpSupabase.getCurrentUser();
                if (remember) await setItem('rdslp_user', JSON.stringify(this.currentUser));
                return { success: true, user: this.currentUser };
            } catch (err) { return { success: false, message: err.message || 'Error al iniciar sesión' }; }
        }
        return { success: false, message: 'Cliente de Supabase no disponible' };
    }

    async register(userData) {
        if (window.rdslpSupabase) {
            try {
                const data = await window.rdslpSupabase.signUpWithEmail({ email: userData.email, password: userData.password, firstName: userData.firstName, lastName: userData.lastName });
                return { success: true, user: data.user };
            } catch (err) { return { success: false, message: err.message || 'Error al registrar' }; }
        }
        return { success: false, message: 'Cliente de Supabase no disponible' };
    }

    async getCurrentUser() {
        if (this.currentUser) return this.currentUser;
        const data = await getItem('rdslp_user');
        if (data) { this.currentUser = JSON.parse(data); return this.currentUser; }
        return null;
    }
    async isAuthenticated() { return (await this.getCurrentUser()) !== null; }
    async getUserRole() { const u = await this.getCurrentUser(); return u ? u.role : null; }
    async hasPermission(p) { const role = await this.getUserRole(); return role ? PERMISSIONS[role][p] || false : false; }

    async updateProfile(updates) {
        const user = await this.getCurrentUser();
        if (!user) return { success: false, message: 'No autenticado' };
        let users = await getJSON('rdslp_all_users', []);
        const idx = users.findIndex(u => u.email === user.email);
        if (idx === -1) return { success: false, message: 'Usuario no encontrado' };
        if (updates.name) users[idx].name = updates.name;
        if (updates.bio) users[idx].bio = updates.bio;
        if (updates.password) users[idx].password = updates.password;
        await setJSON('rdslp_all_users', users);
        const updated = { ...user, ...updates };
        delete updated.password;
        await setItem('rdslp_user', JSON.stringify(updated));
        this.currentUser = updated;
        return { success: true, user: updated };
    }

    async changeUserRole(userId, newRole) {
        if (!(await this.hasPermission('canManageUsers'))) return { success: false, message: 'No tienes permisos para esta acción' };
        if (window.rdslpSupabase) {
            try { await window.rdslpSupabase.changeUserRole(userId, newRole); return { success: true }; }
            catch (err) { return { success: false, message: err.message }; }
        }
        return { success: true };
    }
    async banUser(userId) { return await this._toggleBan(userId, true); }
    async unbanUser(userId) { return await this._toggleBan(userId, false); }
    async _toggleBan(userId, ban) {
        if (!(await this.hasPermission('canManageUsers'))) return { success: false, message: 'No tienes permisos para esta acción' };
        if (window.rdslpSupabase) {
            try { await window.rdslpSupabase.toggleBanUser(userId, ban); return { success: true }; }
            catch (err) { return { success: false, message: err.message }; }
        }
        return { success: true };
    }

    async logout() {
        if (window.rdslpSupabase) await window.rdslpSupabase.signOut();
        await removeItem('rdslp_user');
        this.currentUser = null;
        window.location.href = 'login.html';
    }
}

/** Content Manager */
class ContentManager {
    constructor() { this.initContent(); }
    async initContent() {
        const defaults = { rdslp_content: [], rdslp_comments: [], rdslp_ratings: [] };
        for (const [k, v] of Object.entries(defaults)) {
            const existing = await getItem(k);
            if (existing === null) await setJSON(k, v);
        }
    }
    async getContent(cat = null) {
        const c = await getJSON('rdslp_content', []);
        return cat ? c.filter(i => i.category === cat) : c;
    }
    async addContent(content, userId) {
        const list = await this.getContent();
        const newC = { id: Date.now(), ...content, authorId: userId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        list.push(newC);
        await setJSON('rdslp_content', list);
        return newC;
    }
    async editContent(id, updates, userId) {
        const list = await this.getContent();
        const i = list.findIndex(c => c.id === id);
        if (i === -1) return { success: false, message: 'Contenido no encontrado' };
        const auth = new AuthManager();
        if (list[i].authorId !== userId && !(await auth.hasPermission('canDeleteOthersContent'))) return { success: false, message: 'No tienes permisos para editar este contenido' };
        list[i] = { ...list[i], ...updates, updatedAt: new Date().toISOString() };
        await setJSON('rdslp_content', list);
        return { success: true, content: list[i] };
    }
    async deleteContent(id, userId) {
        const list = await this.getContent();
        const item = list.find(c => c.id === id);
        if (!item) return { success: false, message: 'Contenido no encontrado' };
        const auth = new AuthManager();
        if (item.authorId !== userId && !(await auth.hasPermission('canDeleteOthersContent'))) return { success: false, message: 'No tienes permisos para eliminar este contenido' };
        const filtered = list.filter(c => c.id !== id);
        await setJSON('rdslp_content', filtered);
        const comments = await this.getComments();
        await setJSON('rdslp_comments', comments.filter(c => c.contentId !== id));
        return { success: true };
    }
    async getComments(contentId = null) { const arr = await getJSON('rdslp_comments', []); return contentId ? arr.filter(c => c.contentId === contentId) : arr; }
    async addComment(contentId, text, userId, userName) { const arr = await this.getComments(); const newC = { id: Date.now(), contentId, text, authorId: userId, authorName: userName, createdAt: new Date().toISOString() }; arr.push(newC); await setJSON('rdslp_comments', arr); return newC; }
    async deleteComment(commentId, userId) { const arr = await this.getComments(); const c = arr.find(x => x.id === commentId); if (!c) return { success: false, message: 'Comentario no encontrado' }; const auth = new AuthManager(); if (c.authorId !== userId && !(await auth.hasPermission('canDeleteOthersComments'))) return { success: false, message: 'No tienes permisos para eliminar este comentario' }; const filtered = arr.filter(x => x.id !== commentId); await setJSON('rdslp_comments', filtered); return { success: true }; }
    async editComment(commentId, newText, userId) { const arr = await this.getComments(); const c = arr.find(x => x.id === commentId); if (!c) return { success: false, message: 'Comentario no encontrado' }; if (c.authorId !== userId) return { success: false, message: 'Solo puedes editar tus propios comentarios' }; c.text = newText; c.updatedAt = new Date().toISOString(); await setJSON('rdslp_comments', arr); return { success: true, comment: c }; }
    async rateContent(contentId, rating, userId) { let ratings = await getJSON('rdslp_ratings', []); const idx = ratings.findIndex(r => r.contentId === contentId && r.userId === userId); if (idx !== -1) { ratings[idx].rating = rating; ratings[idx].updatedAt = new Date().toISOString(); } else { ratings.push({ id: Date.now(), contentId, userId, rating, createdAt: new Date().toISOString() }); } await setJSON('rdslp_ratings', ratings); return this.getAverageRating(contentId); }
    async getAverageRating(contentId) { const all = await getJSON('rdslp_ratings', []); const list = all.filter(r => r.contentId === contentId); if (!list.length) return { average: 0, count: 0 }; const sum = list.reduce((a,r) => a + r.rating, 0); return { average: (sum / list.length).toFixed(1), count: list.length }; }
    async getUserRating(contentId, userId) { const all = await getJSON('rdslp_ratings', []); const r = all.find(x => x.contentId === contentId && x.userId === userId); return r ? r.rating : 0; }
}

/** Community Manager */
class CommunityManager {
    constructor() { this.initCommunity(); }
    async initCommunity() {
        const defaults = { rdslp_messages: [], rdslp_events: this.getDefaultEvents(), rdslp_chats: [] };
        for (const [k, v] of Object.entries(defaults)) { const existing = await getItem(k); if (existing === null) await setJSON(k, v); }
    }
    getDefaultEvents() { return [{ id:1, title:'Introduccion a Python', description:'Sesion para principiantes sobre los fundamentos de Python', date:'2026-01-15T18:00:00', organizer:'admin@rdslp.com', organizerName:'Administrador', category:'lenguajes', maxParticipants:20, participants:[], status:'upcoming' },{ id:2, title:'Patrones de Diseno en JavaScript', description:'Exploramos los patrones de diseno mas usados en JS', date:'2026-01-20T19:00:00', organizer:'dev@rdslp.com', organizerName:'Desarrollador', category:'lenguajes', maxParticipants:15, participants:[], status:'upcoming' },{ id:3, title:'SQL vs NoSQL: Cuando usar cada uno', description:'Debate sobre bases de datos relacionales y no relacionales', date:'2026-01-25T17:00:00', organizer:'moderador@rdslp.com', organizerName:'Moderador', category:'databases', maxParticipants:25, participants:[], status:'upcoming' }]; }
    async getMessages(chatId='general') { const msgs = await getJSON('rdslp_messages', []); return msgs.filter(m => m.chatId===chatId); }
    async sendMessage(chatId,text,userId,userName) { const msgs = await getJSON('rdslp_messages', []); const newM = { id: Date.now(), chatId, text, authorId:userId, authorName:userName, createdAt: new Date().toISOString() }; msgs.push(newM); await setJSON('rdslp_messages', msgs); return newM; }
    async getPrivateChats(userId) { const chats = await getJSON('rdslp_chats', []); return chats.filter(c => c.participants.includes(userId)); }
    async createPrivateChat(u1,u2) { const chats = await getJSON('rdslp_chats', []); const existing = chats.find(c=>c.participants.includes(u1)&&c.participants.includes(u2)); if (existing) return existing; const newChat={id:`chat_${Date.now()}`,participants:[u1,u2],createdAt:new Date().toISOString()}; chats.push(newChat); await setJSON('rdslp_chats', chats); return newChat; }
    async getEvents(status=null) { const ev = await getJSON('rdslp_events', []); return status? ev.filter(e=>e.status===status): ev; }
    async createEvent(eventData,userId,userName){ const ev = await this.getEvents(); const access = eventData.accessType==='private' ? 'private':'public'; const invite = access==='private'? (eventData.inviteCode?.trim().toUpperCase()||`RDSLP-${Math.random().toString(36).substring(2,7).toUpperCase()}`):null; const newE={id:Date.now(),...eventData,accessType:access,inviteCode:invite,organizer:userId,organizerName:userName,participants:[{id:userId,name:userName,role:'organizer',joinedAt:new Date().toISOString()}],status:'upcoming',createdAt:new Date().toISOString()}; ev.push(newE); await setJSON('rdslp_events', ev); return newE; }
    async joinEvent(eventId,userId,userName,inviteCode=null){ const ev = await this.getEvents(); const idx=ev.findIndex(e=>e.id===eventId); if(idx===-1) return {success:false,message:'Evento no encontrado'}; const e=ev[idx]; if(e.participants?.some(p=>p.id===userId)) return {success:false,message:'Ya estás inscrito en este evento'}; if(e.participants?.length>=e.maxParticipants) return {success:false,message:'El evento está lleno'}; if(e.accessType==='private' && e.organizer!==userId){ const inCode=(inviteCode||'').trim().toUpperCase(); const target=(e.inviteCode||'').trim().toUpperCase(); if(!inCode||inCode!==target) return {success:false,message:'Código de invitación incorrecto o no suministrado.'}; } if(!e.participants) e.participants=[]; e.participants.push({id:userId,name:userName,joinedAt:new Date().toISOString()}); await setJSON('rdslp_events', ev); return {success:true,event:e}; }
    hasAccessToEvent(eventId,userId,userEmail=null){ const ev=this.getEvents(); const e=ev.find(x=>x.id===eventId); if(!e) return false; if(e.accessType!=='private') return true; if(e.organizer===userId || (userEmail && e.organizer===userEmail)) return true; return e.participants?.some(p=>p.id===userId); }
    getEventByInviteCode(code){ if(!code) return null; const c=code.trim().toUpperCase(); const ev=this.getEvents(); return ev.find(e=>e.accessType==='private' && (e.inviteCode||'').toUpperCase()===c); }
    async updateEvent(eventId, data, userId){ const ev=await this.getEvents(); const idx=ev.findIndex(e=>e.id===eventId); if(idx===-1) return {success:false,message:'Encuentro no encontrado'}; const e=ev[idx]; const auth=new AuthManager(); if(e.organizer!==userId && !(await auth.hasPermission('canManageEvents'))) return {success:false,message:'Solo el creador o un administrador puede modificar los ajustes y la privacidad de esta comunidad.'}; ev[idx]={...e,...data,updatedAt:new Date().toISOString()}; await setJSON('rdslp_events', ev); return {success:true,event:ev[idx]}; }
    async leaveEvent(eventId,userId){ const ev=await this.getEvents(); const idx=ev.findIndex(e=>e.id===eventId); if(idx===-1) return {success:false,message:'Evento no encontrado'}; ev[idx].participants = (ev[idx].participants||[]).filter(p=>p.id!==userId); await setJSON('rdslp_events', ev); return {success:true}; }
    async deleteEvent(eventId,userId){ const ev=await this.getEvents(); const e=ev.find(x=>x.id===eventId); if(!e) return {success:false,message:'Evento no encontrado'}; const auth=new AuthManager(); if(e.organizer!==userId && !(await auth.hasPermission('canManageEvents'))) return {success:false,message:'No tienes permisos para eliminar este evento'}; const filtered=ev.filter(x=>x.id!==eventId); await setJSON('rdslp_events', filtered); return {success:true}; }
}

// Exportar instancias globales
window.authManager = new AuthManager();
window.contentManager = new ContentManager();
window.communityManager = new CommunityManager();
window.ROLES = ROLES;
window.PERMISSIONS = PERMISSIONS;
