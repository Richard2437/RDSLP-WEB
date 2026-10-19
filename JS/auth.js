/* =====================================================
   RDSLP - Sistema de Autenticación y Roles
   Red Social de Lenguajes de Programación
===================================================== */

// Roles disponibles
const ROLES = {
    USER: 'user',
    MODERATOR: 'moderator',
    ADMIN: 'admin'
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
        canManageEvents: false
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
        canManageEvents: true
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
        canManageEvents: true
    }
};

// Usuarios de demostración
const DEMO_USERS = [
    {
        id: 1,
        email: 'admin@rdslp.com',
        password: 'admin123',
        name: 'Administrador',
        role: 'admin',
        avatar: 'AD',
        bio: 'Administrador del sistema RDSLP',
        createdAt: '2024-01-01T00:00:00Z'
    },
    {
        id: 2,
        email: 'moderador@rdslp.com',
        password: 'mod123',
        name: 'Moderador',
        role: 'moderator',
        avatar: 'MO',
        bio: 'Moderador de contenido',
        createdAt: '2024-01-01T00:00:00Z'
    },
    {
        id: 3,
        email: 'usuario@rdslp.com',
        password: 'user123',
        name: 'Usuario Demo',
        role: 'user',
        avatar: 'US',
        bio: 'Usuario de demostración',
        createdAt: '2024-01-01T00:00:00Z'
    },
    {
        id: 4,
        email: 'dev@rdslp.com',
        password: 'dev123',
        name: 'Desarrollador',
        role: 'user',
        avatar: 'DE',
        bio: 'Desarrollador y entusiasta de la programación',
        createdAt: '2024-01-01T00:00:00Z'
    }
];

// Auth Manager
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Inicializar usuarios demo si no existen
        if (!localStorage.getItem('rdslp_all_users')) {
            localStorage.setItem('rdslp_all_users', JSON.stringify(DEMO_USERS));
        }
    }

    // Obtener todos los usuarios
    getAllUsers() {
        return JSON.parse(localStorage.getItem('rdslp_all_users') || '[]');
    }

    // Buscar usuario por email
    findUserByEmail(email) {
        const users = this.getAllUsers();
        return users.find(u => u.email === email);
    }

    // Login
    login(email, password, remember = false) {
        const user = this.findUserByEmail(email);

        if (!user || user.password !== password) {
            return { success: false, message: 'Correo o contraseña incorrectos' };
        }

        if (user.isBanned) {
            return { success: false, message: 'Tu cuenta ha sido suspendida. Contacta al administrador.' };
        }

        const userData = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatar: user.avatar,
            bio: user.bio,
            loginTime: new Date().toISOString()
        };

        if (remember) {
            localStorage.setItem('rdslp_user', JSON.stringify(userData));
        } else {
            sessionStorage.setItem('rdslp_user', JSON.stringify(userData));
        }

        this.currentUser = userData;
        return { success: true, user: userData };
    }

    // Registro
    register(userData) {
        const users = this.getAllUsers();

        if (users.some(u => u.email === userData.email)) {
            return { success: false, message: 'Este correo ya está registrado' };
        }

        const newUser = {
            id: Date.now(),
            email: userData.email,
            password: userData.password,
            name: `${userData.firstName} ${userData.lastName}`,
            role: 'user', // Nuevos usuarios siempre son 'user'
            avatar: userData.firstName.charAt(0).toUpperCase() + userData.lastName.charAt(0).toUpperCase(),
            bio: '',
            isBanned: false,
            habeasDataAccepted: true,
            termsAccepted: true,
            legalConsentDate: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem('rdslp_all_users', JSON.stringify(users));
        // Notify other parts of the app that user list has changed
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('userListUpdated'));
        }
        return { success: true, user: newUser };
    }

    // Obtener usuario actual
    getCurrentUser() {
        if (this.currentUser) return this.currentUser;

        const userData = localStorage.getItem('rdslp_user') || sessionStorage.getItem('rdslp_user');
        if (userData) {
            this.currentUser = JSON.parse(userData);
            return this.currentUser;
        }
        return null;
    }

    // Verificar si está autenticado
    isAuthenticated() {
        return this.getCurrentUser() !== null;
    }

    // Obtener rol del usuario
    getUserRole() {
        const user = this.getCurrentUser();
        return user ? user.role : null;
    }

    // Verificar permiso
    hasPermission(permission) {
        const role = this.getUserRole();
        if (!role) return false;
        return PERMISSIONS[role][permission] || false;
    }

    // Actualizar perfil
    updateProfile(updates) {
        const user = this.getCurrentUser();
        if (!user) return { success: false, message: 'No autenticado' };

        const users = this.getAllUsers();
        const userIndex = users.findIndex(u => u.email === user.email);

        if (userIndex === -1) return { success: false, message: 'Usuario no encontrado' };

        // Actualizar datos
        if (updates.name) users[userIndex].name = updates.name;
        if (updates.bio) users[userIndex].bio = updates.bio;
        if (updates.password) users[userIndex].password = updates.password;

        localStorage.setItem('rdslp_all_users', JSON.stringify(users));

        // Actualizar sesión
        const updatedUser = { ...user, ...updates };
        delete updatedUser.password;

        const storage = localStorage.getItem('rdslp_user') ? localStorage : sessionStorage;
        storage.setItem('rdslp_user', JSON.stringify(updatedUser));
        this.currentUser = updatedUser;

        return { success: true, user: updatedUser };
    }

    // Cambiar rol de usuario (solo admin)
    changeUserRole(userId, newRole) {
        if (!this.hasPermission('canManageUsers')) {
            return { success: false, message: 'No tienes permisos para esta acción' };
        }

        const users = this.getAllUsers();
        const userIndex = users.findIndex(u => u.id === userId);

        if (userIndex === -1) return { success: false, message: 'Usuario no encontrado' };

        users[userIndex].role = newRole;
        localStorage.setItem('rdslp_all_users', JSON.stringify(users));

        return { success: true };
    }

    // Banear usuario (solo admin)
    banUser(userId) {
        if (!this.hasPermission('canManageUsers')) {
            return { success: false, message: 'No tienes permisos para esta acción' };
        }

        const users = this.getAllUsers();
        const userIndex = users.findIndex(u => u.id === userId);

        if (userIndex === -1) return { success: false, message: 'Usuario no encontrado' };

        // No permitir banear a otros admins
        if (users[userIndex].role === 'admin') {
            return { success: false, message: 'No puedes banear a un administrador' };
        }

        users[userIndex].isBanned = true;
        localStorage.setItem('rdslp_all_users', JSON.stringify(users));
        if (typeof window !== 'undefined' && window.dispatchEvent) { window.dispatchEvent(new CustomEvent('userListUpdated')); }

        return { success: true };
    }

    // Desbanear usuario (solo admin)
    unbanUser(userId) {
        if (!this.hasPermission('canManageUsers')) {
            return { success: false, message: 'No tienes permisos para esta acción' };
        }

        const users = this.getAllUsers();
        const userIndex = users.findIndex(u => u.id === userId);

        if (userIndex === -1) return { success: false, message: 'Usuario no encontrado' };

        users[userIndex].isBanned = false;
        localStorage.setItem('rdslp_all_users', JSON.stringify(users));
        if (typeof window !== 'undefined' && window.dispatchEvent) { window.dispatchEvent(new CustomEvent('userListUpdated')); }

        return { success: true };
    }

    // Logout
    logout() {
        localStorage.removeItem('rdslp_user');
        sessionStorage.removeItem('rdslp_user');
        this.currentUser = null;
    }
}

// Content Manager - Para manejar publicaciones, comentarios y calificaciones
class ContentManager {
    constructor() {
        this.initContent();
    }

    initContent() {
        if (!localStorage.getItem('rdslp_content')) {
            localStorage.setItem('rdslp_content', JSON.stringify([]));
        }
        if (!localStorage.getItem('rdslp_comments')) {
            localStorage.setItem('rdslp_comments', JSON.stringify([]));
        }
        if (!localStorage.getItem('rdslp_ratings')) {
            localStorage.setItem('rdslp_ratings', JSON.stringify([]));
        }
    }

    // Obtener contenido
    getContent(category = null) {
        const content = JSON.parse(localStorage.getItem('rdslp_content') || '[]');
        if (category) {
            return content.filter(c => c.category === category);
        }
        return content;
    }

    // Agregar contenido
    addContent(content, userId) {
        const contents = this.getContent();
        const newContent = {
            id: Date.now(),
            ...content,
            authorId: userId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        contents.push(newContent);
        localStorage.setItem('rdslp_content', JSON.stringify(contents));
        return newContent;
    }

    // Editar contenido
    editContent(contentId, updates, userId) {
        const contents = this.getContent();
        const index = contents.findIndex(c => c.id === contentId);

        if (index === -1) return { success: false, message: 'Contenido no encontrado' };

        const content = contents[index];
        const auth = new AuthManager();

        // Verificar permisos
        if (content.authorId !== userId && !auth.hasPermission('canDeleteOthersContent')) {
            return { success: false, message: 'No tienes permisos para editar este contenido' };
        }

        contents[index] = { ...content, ...updates, updatedAt: new Date().toISOString() };
        localStorage.setItem('rdslp_content', JSON.stringify(contents));
        return { success: true, content: contents[index] };
    }

    // Eliminar contenido
    deleteContent(contentId, userId) {
        const contents = this.getContent();
        const content = contents.find(c => c.id === contentId);

        if (!content) return { success: false, message: 'Contenido no encontrado' };

        const auth = new AuthManager();

        if (content.authorId !== userId && !auth.hasPermission('canDeleteOthersContent')) {
            return { success: false, message: 'No tienes permisos para eliminar este contenido' };
        }

        const filtered = contents.filter(c => c.id !== contentId);
        localStorage.setItem('rdslp_content', JSON.stringify(filtered));

        // También eliminar comentarios del contenido
        const comments = this.getComments();
        const filteredComments = comments.filter(c => c.contentId !== contentId);
        localStorage.setItem('rdslp_comments', JSON.stringify(filteredComments));

        return { success: true };
    }

    // Obtener comentarios
    getComments(contentId = null) {
        const comments = JSON.parse(localStorage.getItem('rdslp_comments') || '[]');
        if (contentId) {
            return comments.filter(c => c.contentId === contentId);
        }
        return comments;
    }

    // Agregar comentario
    addComment(contentId, text, userId, userName) {
        const comments = this.getComments();
        const newComment = {
            id: Date.now(),
            contentId,
            text,
            authorId: userId,
            authorName: userName,
            createdAt: new Date().toISOString()
        };
        comments.push(newComment);
        localStorage.setItem('rdslp_comments', JSON.stringify(comments));
        return newComment;
    }

    // Eliminar comentario
    deleteComment(commentId, userId) {
        const comments = this.getComments();
        const comment = comments.find(c => c.id === commentId);

        if (!comment) return { success: false, message: 'Comentario no encontrado' };

        const auth = new AuthManager();

        if (comment.authorId !== userId && !auth.hasPermission('canDeleteOthersComments')) {
            return { success: false, message: 'No tienes permisos para eliminar este comentario' };
        }

        const filtered = comments.filter(c => c.id !== commentId);
        localStorage.setItem('rdslp_comments', JSON.stringify(filtered));
        return { success: true };
    }

    // Editar comentario (solo el autor puede editar)
    editComment(commentId, newText, userId) {
        const comments = this.getComments();
        const comment = comments.find(c => c.id === commentId);

        if (!comment) return { success: false, message: 'Comentario no encontrado' };

        if (comment.authorId !== userId) {
            return { success: false, message: 'Solo puedes editar tus propios comentarios' };
        }

        comment.text = newText;
        comment.updatedAt = new Date().toISOString();
        localStorage.setItem('rdslp_comments', JSON.stringify(comments));
        return { success: true, comment };
    }

    // Calificar contenido
    rateContent(contentId, rating, userId) {
        const ratings = JSON.parse(localStorage.getItem('rdslp_ratings') || '[]');

        // Buscar si ya calificó
        const existingIndex = ratings.findIndex(r => r.contentId === contentId && r.userId === userId);

        if (existingIndex !== -1) {
            ratings[existingIndex].rating = rating;
            ratings[existingIndex].updatedAt = new Date().toISOString();
        } else {
            ratings.push({
                id: Date.now(),
                contentId,
                userId,
                rating,
                createdAt: new Date().toISOString()
            });
        }

        localStorage.setItem('rdslp_ratings', JSON.stringify(ratings));
        return this.getAverageRating(contentId);
    }

    // Obtener calificación promedio
    getAverageRating(contentId) {
        const ratings = JSON.parse(localStorage.getItem('rdslp_ratings') || '[]');
        const contentRatings = ratings.filter(r => r.contentId === contentId);

        if (contentRatings.length === 0) return { average: 0, count: 0 };

        const sum = contentRatings.reduce((acc, r) => acc + r.rating, 0);
        return {
            average: (sum / contentRatings.length).toFixed(1),
            count: contentRatings.length
        };
    }

    // Obtener calificación del usuario
    getUserRating(contentId, userId) {
        const ratings = JSON.parse(localStorage.getItem('rdslp_ratings') || '[]');
        const rating = ratings.find(r => r.contentId === contentId && r.userId === userId);
        return rating ? rating.rating : 0;
    }
}

// Community Manager - Para chat y eventos
class CommunityManager {
    constructor() {
        this.initCommunity();
    }

    initCommunity() {
        if (!localStorage.getItem('rdslp_messages')) {
            localStorage.setItem('rdslp_messages', JSON.stringify([]));
        }
        if (!localStorage.getItem('rdslp_events')) {
            localStorage.setItem('rdslp_events', JSON.stringify(this.getDefaultEvents()));
        }
        if (!localStorage.getItem('rdslp_chats')) {
            localStorage.setItem('rdslp_chats', JSON.stringify([]));
        }
    }

    getDefaultEvents() {
        return [
            {
                id: 1,
                title: 'Introduccion a Python',
                description: 'Sesion para principiantes sobre los fundamentos de Python',
                date: '2026-01-15T18:00:00',
                organizer: 'admin@rdslp.com',
                organizerName: 'Administrador',
                category: 'lenguajes',
                maxParticipants: 20,
                participants: [],
                status: 'upcoming'
            },
            {
                id: 2,
                title: 'Patrones de Diseno en JavaScript',
                description: 'Exploramos los patrones de diseno mas usados en JS',
                date: '2026-01-20T19:00:00',
                organizer: 'dev@rdslp.com',
                organizerName: 'Desarrollador',
                category: 'lenguajes',
                maxParticipants: 15,
                participants: [],
                status: 'upcoming'
            },
            {
                id: 3,
                title: 'SQL vs NoSQL: Cuando usar cada uno',
                description: 'Debate sobre bases de datos relacionales y no relacionales',
                date: '2026-01-25T17:00:00',
                organizer: 'moderador@rdslp.com',
                organizerName: 'Moderador',
                category: 'databases',
                maxParticipants: 25,
                participants: [],
                status: 'upcoming'
            }
        ];
    }

    // Mensajes
    getMessages(chatId = 'general') {
        const messages = JSON.parse(localStorage.getItem('rdslp_messages') || '[]');
        return messages.filter(m => m.chatId === chatId);
    }

    sendMessage(chatId, text, userId, userName) {
        const messages = JSON.parse(localStorage.getItem('rdslp_messages') || '[]');
        const newMessage = {
            id: Date.now(),
            chatId,
            text,
            authorId: userId,
            authorName: userName,
            createdAt: new Date().toISOString()
        };
        messages.push(newMessage);
        localStorage.setItem('rdslp_messages', JSON.stringify(messages));
        return newMessage;
    }

    // Chats privados
    getPrivateChats(userId) {
        const chats = JSON.parse(localStorage.getItem('rdslp_chats') || '[]');
        return chats.filter(c => c.participants.includes(userId));
    }

    createPrivateChat(user1Id, user2Id) {
        const chats = JSON.parse(localStorage.getItem('rdslp_chats') || '[]');

        // Verificar si ya existe
        const existing = chats.find(c =>
            c.participants.includes(user1Id) && c.participants.includes(user2Id)
        );

        if (existing) return existing;

        const newChat = {
            id: `chat_${Date.now()}`,
            participants: [user1Id, user2Id],
            createdAt: new Date().toISOString()
        };
        chats.push(newChat);
        localStorage.setItem('rdslp_chats', JSON.stringify(chats));
        return newChat;
    }

    // Eventos (con soporte Abierto / Privado con invitación)
    getEvents(status = null) {
        const events = JSON.parse(localStorage.getItem('rdslp_events') || '[]');
        if (status) {
            return events.filter(e => e.status === status);
        }
        return events;
    }

    createEvent(eventData, userId, userName) {
        const events = this.getEvents();
        const accessType = eventData.accessType === 'private' ? 'private' : 'public';
        const inviteCode = accessType === 'private'
            ? (eventData.inviteCode?.trim().toUpperCase() || ('RDSLP-' + Math.random().toString(36).substring(2, 7).toUpperCase()))
            : null;

        const newEvent = {
            id: Date.now(),
            ...eventData,
            accessType,
            inviteCode,
            organizer: userId,
            organizerName: userName,
            participants: [
                { id: userId, name: userName, role: 'organizer', joinedAt: new Date().toISOString() }
            ],
            status: 'upcoming',
            createdAt: new Date().toISOString()
        };
        events.push(newEvent);
        localStorage.setItem('rdslp_events', JSON.stringify(events));
        return newEvent;
    }

    joinEvent(eventId, userId, userName, inviteCode = null) {
        const events = this.getEvents();
        const eventIndex = events.findIndex(e => e.id === eventId);

        if (eventIndex === -1) return { success: false, message: 'Evento no encontrado' };

        const event = events[eventIndex];

        if (event.participants && event.participants.some(p => p.id === userId)) {
            return { success: false, message: 'Ya estás inscrito en este evento' };
        }

        if (event.participants && event.participants.length >= event.maxParticipants) {
            return { success: false, message: 'El evento está lleno' };
        }

        // Validación de permisos para eventos privados
        if (event.accessType === 'private' && event.organizer !== userId) {
            const cleanInput = (inviteCode || '').trim().toUpperCase();
            const cleanTarget = (event.inviteCode || '').trim().toUpperCase();
            if (!cleanInput || cleanInput !== cleanTarget) {
                return { success: false, message: 'Código de invitación incorrecto o no suministrado.' };
            }
        }

        if (!event.participants) event.participants = [];
        event.participants.push({ id: userId, name: userName, joinedAt: new Date().toISOString() });
        localStorage.setItem('rdslp_events', JSON.stringify(events));
        return { success: true, event };
    }

    hasAccessToEvent(eventId, userId, userEmail = null) {
        const events = this.getEvents();
        const event = events.find(e => e.id === eventId);
        if (!event) return false;
        if (event.accessType !== 'private') return true;
        if (event.organizer === userId || (userEmail && event.organizer === userEmail)) return true;
        return event.participants && event.participants.some(p => p.id === userId);
    }

    getEventByInviteCode(code) {
        if (!code) return null;
        const clean = code.trim().toUpperCase();
        const events = this.getEvents();
        return events.find(e => e.accessType === 'private' && (e.inviteCode || '').toUpperCase() === clean);
    }

    updateEvent(eventId, updatedData, userId) {
        const events = this.getEvents();
        const eventIndex = events.findIndex(e => e.id === eventId);
        if (eventIndex === -1) return { success: false, message: 'Encuentro no encontrado' };

        const event = events[eventIndex];
        const auth = new AuthManager();
        if (event.organizer !== userId && !auth.hasPermission('canManageEvents')) {
            return { success: false, message: 'Solo el creador o un administrador puede modificar los ajustes y la privacidad de esta comunidad.' };
        }

        events[eventIndex] = {
            ...event,
            ...updatedData,
            updatedAt: new Date().toISOString()
        };

        localStorage.setItem('rdslp_events', JSON.stringify(events));
        return { success: true, event: events[eventIndex] };
    }

    leaveEvent(eventId, userId) {
        const events = this.getEvents();
        const eventIndex = events.findIndex(e => e.id === eventId);

        if (eventIndex === -1) return { success: false, message: 'Evento no encontrado' };

        events[eventIndex].participants = (events[eventIndex].participants || []).filter(p => p.id !== userId);
        localStorage.setItem('rdslp_events', JSON.stringify(events));
        return { success: true };
    }

    deleteEvent(eventId, userId) {
        const events = this.getEvents();
        const event = events.find(e => e.id === eventId);

        if (!event) return { success: false, message: 'Evento no encontrado' };

        const auth = new AuthManager();
        if (event.organizer !== userId && !auth.hasPermission('canManageEvents')) {
            return { success: false, message: 'No tienes permisos para eliminar este evento' };
        }

        const filtered = events.filter(e => e.id !== eventId);
        localStorage.setItem('rdslp_events', JSON.stringify(filtered));
        return { success: true };
    }
}

// Exportar instancias globales
window.authManager = new AuthManager();
window.contentManager = new ContentManager();
window.communityManager = new CommunityManager();
window.ROLES = ROLES;
window.PERMISSIONS = PERMISSIONS;
