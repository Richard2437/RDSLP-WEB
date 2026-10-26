/* =====================================================
   RDSLP - API Client con Fallback a localStorage
===================================================== */

class ApiClient {
    constructor() {
        this.baseUrl = this._detectBaseUrl();
        this.serverAvailable = null; // null = no verificado aún
        this._checkPromise = this.checkServer();
    }

    _detectBaseUrl() {
        if (typeof window !== 'undefined' && window.location && window.location.origin && !window.location.origin.startsWith('file:')) {
            return window.location.origin;
        }
        return '';
    }

    async checkServer() {
        try {
            const response = await fetch(`${this.baseUrl}/api/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(2000) // 2 segundos máximo
            });
            if (response.ok) {
                this.serverAvailable = true;
                console.log('Servidor RDSLP conectado - usando base de datos MySQL');
                return true;
            }
        } catch (e) {
            // Servidor no disponible
        }
        this.serverAvailable = false;
        console.log('Servidor en modo local - usando almacenamiento localStorage');
        return false;
    }

    async isServerUp() {
        if (this.serverAvailable === null) {
            await this._checkPromise;
        }
        return this.serverAvailable;
    }

    async _fetch(url, options = {}) {
        try {
            const response = await fetch(`${this.baseUrl}${url}`, {
                headers: { 'Content-Type': 'application/json' },
                ...options
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.warn(`API error (${url}):`, error.message);
            this.serverAvailable = false;
            return null; // null indica que falló, el caller usa fallback
        }
    }

    // ==================== AUTH ====================
    async login(email, password, remember) {
        if (await this.isServerUp()) {
            const result = await this._fetch('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
            if (result) {
                if (result.success) {
                    const storage = remember ? localStorage : sessionStorage;
                    storage.setItem('rdslp_user', JSON.stringify(result.user));
                }
                return result;
            }
        }
        return null; // fallback al AuthManager local
    }

    async register(userData) {
        if (await this.isServerUp()) {
            const result = await this._fetch('/api/auth/register', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
            if (result) return result;
        }
        return null;
    }

    async updateProfile(userId, updates) {
        if (await this.isServerUp()) {
            const result = await this._fetch('/api/auth/profile', {
                method: 'PUT',
                body: JSON.stringify({ userId, ...updates })
            });
            if (result) return result;
        }
        return null;
    }

    async getAllUsers() {
        if (await this.isServerUp()) {
            const result = await this._fetch('/api/auth/users');
            if (result && result.success) return result.users;
        }
        return null;
    }

    async changeUserRole(userId, role) {
        if (await this.isServerUp()) {
            const result = await this._fetch(`/api/auth/users/${userId}/role`, {
                method: 'PUT',
                body: JSON.stringify({ role })
            });
            if (result) return result;
        }
        return null;
    }

    async banUser(userId, ban) {
        if (await this.isServerUp()) {
            const result = await this._fetch(`/api/auth/users/${userId}/ban`, {
                method: 'PUT',
                body: JSON.stringify({ ban })
            });
            if (result) return result;
        }
        return null;
    }

    // ==================== POSTS ====================
    async getPosts(type, language) {
        if (await this.isServerUp()) {
            let url = '/api/posts?';
            if (type && type !== 'all') url += `type=${type}&`;
            if (language && language !== 'all') url += `language=${language}`;
            const result = await this._fetch(url);
            if (result && result.success) return result.posts;
        }
        return null;
    }

    async createPost(postData) {
        if (await this.isServerUp()) {
            const result = await this._fetch('/api/posts', {
                method: 'POST',
                body: JSON.stringify(postData)
            });
            if (result) return result;
        }
        return null;
    }

    async deletePost(postId) {
        if (await this.isServerUp()) {
            const result = await this._fetch(`/api/posts/${postId}`, { method: 'DELETE' });
            if (result) return result;
        }
        return null;
    }

    async toggleLike(postId, userId) {
        if (await this.isServerUp()) {
            const result = await this._fetch(`/api/posts/${postId}/like`, {
                method: 'POST',
                body: JSON.stringify({ userId })
            });
            if (result) return result;
        }
        return null;
    }

    async addComment(postId, authorId, text) {
        if (await this.isServerUp()) {
            const result = await this._fetch(`/api/posts/${postId}/comments`, {
                method: 'POST',
                body: JSON.stringify({ authorId, text })
            });
            if (result) return result;
        }
        return null;
    }

    async editComment(postId, commentId, text) {
        if (await this.isServerUp()) {
            const result = await this._fetch(`/api/posts/${postId}/comments/${commentId}`, {
                method: 'PUT',
                body: JSON.stringify({ text })
            });
            if (result) return result;
        }
        return null;
    }

    async deleteComment(postId, commentId) {
        if (await this.isServerUp()) {
            const result = await this._fetch(`/api/posts/${postId}/comments/${commentId}`, {
                method: 'DELETE'
            });
            if (result) return result;
        }
        return null;
    }

    // ==================== COMMUNITY ====================
    async getMessages(chatId) {
        if (await this.isServerUp()) {
            const result = await this._fetch(`/api/community/messages/${chatId || 'general'}`);
            if (result && result.success) return result.messages;
        }
        return null;
    }

    async sendMessage(chatId, text, authorId) {
        if (await this.isServerUp()) {
            const result = await this._fetch('/api/community/messages', {
                method: 'POST',
                body: JSON.stringify({ chatId, text, authorId })
            });
            if (result) return result;
        }
        return null;
    }

    async getEvents() {
        if (await this.isServerUp()) {
            const result = await this._fetch('/api/community/events');
            if (result && result.success) return result.events;
        }
        return null;
    }

    async createEvent(eventData) {
        if (await this.isServerUp()) {
            const result = await this._fetch('/api/community/events', {
                method: 'POST',
                body: JSON.stringify(eventData)
            });
            if (result) return result;
        }
        return null;
    }

    async joinEvent(eventId, userId) {
        if (await this.isServerUp()) {
            const result = await this._fetch(`/api/community/events/${eventId}/join`, {
                method: 'POST',
                body: JSON.stringify({ userId })
            });
            if (result) return result;
        }
        return null;
    }

    async leaveEvent(eventId, userId) {
        if (await this.isServerUp()) {
            const result = await this._fetch(`/api/community/events/${eventId}/leave`, {
                method: 'POST',
                body: JSON.stringify({ userId })
            });
            if (result) return result;
        }
        return null;
    }

    async deleteEvent(eventId) {
        if (await this.isServerUp()) {
            const result = await this._fetch(`/api/community/events/${eventId}`, { method: 'DELETE' });
            if (result) return result;
        }
        return null;
    }

    // ==================== CONTENT/RATINGS ====================
    async rateContent(contentId, userId, rating) {
        if (await this.isServerUp()) {
            const result = await this._fetch(`/api/content/${contentId}/rate`, {
                method: 'POST',
                body: JSON.stringify({ userId, rating })
            });
            if (result) return result;
        }
        return null;
    }

    async getRating(contentId, userId) {
        if (await this.isServerUp()) {
            const result = await this._fetch(`/api/content/${contentId}/rating?userId=${userId || ''}`);
            if (result && result.success) return result;
        }
        return null;
    }

    // ==================== EXERCISES ====================
    async getExercises(userId) {
        if (await this.isServerUp()) {
            const result = await this._fetch(`/api/exercises?userId=${userId || ''}`);
            if (result && result.success) return result.exercises;
        }
        return null;
    }

    async saveExercise(data) {
        if (await this.isServerUp()) {
            const result = await this._fetch('/api/exercises', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            if (result) return result;
        }
        return null;
    }

    // ==================== DATABASES ====================
    async getDatabases(category) {
        if (await this.isServerUp()) {
            const url = category && category !== 'todos' ? `/api/databases?category=${category}` : '/api/databases';
            const result = await this._fetch(url);
            if (result && result.success) return result.databases;
        }
        return null;
    }

    async createDatabase(dbData) {
        if (await this.isServerUp()) {
            const result = await this._fetch('/api/databases', {
                method: 'POST',
                body: JSON.stringify(dbData)
            });
            if (result) return result;
        }
        return null;
    }
}

// Crear instancia global
window.apiClient = new ApiClient();
