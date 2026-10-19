/* =====================================================
   RDSLP - JavaScript del Muro Social (Actualizado)
===================================================== */

document.addEventListener('DOMContentLoaded', function () {
    if (!window.authManager) {
        console.error('AuthManager no disponible');
        window.location.href = 'login.html';
        return;
    }

    const auth = window.authManager;
    let currentUser = null;
    let currentFilter = 'all';
    let currentLangFilter = 'all';

    init();

    function init() {
        checkAuth();
        loadUserData();
        loadFeed();
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
        const initial = currentUser.name?.charAt(0).toUpperCase() || 'U';
        document.getElementById('userAvatar').textContent = initial;
        document.getElementById('userName').textContent = currentUser.name || 'Usuario';
        document.getElementById('postAvatar').textContent = initial;
    }

    function setupEventListeners() {
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            auth.logout();
            window.location.href = 'login.html';
        });

        // Toggle inputs multimedia
        document.getElementById('addImageBtn')?.addEventListener('click', () => toggleMediaInput('image'));
        document.getElementById('addVideoBtn')?.addEventListener('click', () => toggleMediaInput('video'));

        // Publicar
        document.getElementById('publishBtn')?.addEventListener('click', createPost);

        // Filtros Tipo
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                currentFilter = this.dataset.filter;
                loadFeed();
            });
        });

        // Filtro Lenguaje
        document.getElementById('filterLanguage')?.addEventListener('change', function () {
            currentLangFilter = this.value;
            loadFeed();
        });
    }

    function toggleMediaInput(type) {
        const container = document.getElementById('mediaInputs');
        const imgInput = document.getElementById('imageUrl');
        const vidInput = document.getElementById('videoUrl');

        container.style.display = 'flex';

        if (type === 'image') {
            imgInput.style.display = 'block';
            vidInput.style.display = 'none';
            imgInput.focus();
        } else {
            imgInput.style.display = 'none';
            vidInput.style.display = 'block';
            vidInput.focus();
        }
    }

    function createPost() {
        const contentEl = document.getElementById('postContent');
        const typeEl = document.getElementById('postType');
        const langEl = document.getElementById('postLanguage');
        const imgEl = document.getElementById('imageUrl');
        const vidEl = document.getElementById('videoUrl');

        const postContent = contentEl.value.trim();
        if (!postContent) {
            alert('Escribe algo para publicar.');
            return;
        }

        const posts = JSON.parse(localStorage.getItem('rdslp_posts') || '[]');

        const newPost = {
            id: Date.now(),
            authorId: currentUser.id,
            authorName: currentUser.name,
            type: typeEl.value,
            language: langEl.value || null,
            content: postContent,
            image: imgEl.value.trim() || null,
            video: vidEl.value.trim() || null,
            likes: [],
            comments: [],
            createdAt: new Date().toISOString()
        };

        posts.unshift(newPost);
        localStorage.setItem('rdslp_posts', JSON.stringify(posts));

        // Reset inputs
        contentEl.value = '';
        imgEl.value = '';
        vidEl.value = '';
        document.getElementById('mediaInputs').style.display = 'none';

        loadFeed();
    }

    function loadFeed() {
        const container = document.getElementById('feedContainer');
        if (!container) return;

        let posts = JSON.parse(localStorage.getItem('rdslp_posts') || '[]');

        // Agregar posts de ejemplo si está vacío
        if (posts.length === 0) {
            posts = getDefaultPosts();
            localStorage.setItem('rdslp_posts', JSON.stringify(posts));
        }

        // Filtrar por Tipo
        if (currentFilter !== 'all') {
            posts = posts.filter(p => p.type === currentFilter);
        }

        // Filtrar por Lenguaje
        if (currentLangFilter !== 'all') {
            posts = posts.filter(p => p.language === currentLangFilter || (!p.language && currentLangFilter === 'all'));
        }

        if (posts.length === 0) {
            container.innerHTML = `
                <div class="feed-empty">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="3" y1="9" x2="21" y2="9"></line>
                    </svg>
                    <h3>No hay publicaciones</h3>
                    <p>No se encontraron publicaciones con los filtros seleccionados.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = posts.map(post => createPostHTML(post)).join('');
    }

    function getDefaultPosts() {
        return [
            {
                id: 1,
                authorId: 3,
                authorName: 'Usuario Demo',
                type: 'general',
                language: 'javascript',
                content: 'Acabo de empezar a aprender JavaScript. Alguna recomendación de recursos?',
                likes: [1, 2],
                comments: [
                    { id: 1, authorId: 1, authorName: 'Admin', text: 'Te recomiendo Eloquent JavaScript, es gratis online!', createdAt: new Date().toISOString() }
                ],
                createdAt: new Date(Date.now() - 86400000).toISOString()
            },
            {
                id: 2,
                authorId: 2,
                authorName: 'Moderador',
                type: 'recurso',
                language: 'general',
                content: 'Comparto esta guía de Git para principiantes que me ha sido muy útil.',
                likes: [1, 3, 4],
                comments: [],
                createdAt: new Date(Date.now() - 172800000).toISOString()
            },
            {
                id: 3,
                authorId: 1,
                authorName: 'Admin',
                type: 'ejercicio',
                language: 'javascript',
                content: 'He completado el ejercicio "Factorial de un número" con una puntuación de 95/100',
                code: 'function factorial(n) {\n  if (n <= 1) return 1;\n  return n * factorial(n - 1);\n}',
                score: 95,
                likes: [2, 3],
                comments: [],
                createdAt: new Date(Date.now() - 259200000).toISOString()
            }
        ];
    }

    function createPostHTML(post) {
        const initial = post.authorName?.charAt(0).toUpperCase() || '?';
        const timeAgo = getTimeAgo(post.createdAt);
        const isLiked = currentUser && post.likes?.includes(currentUser.id);
        const likesCount = post.likes?.length || 0;
        const commentsCount = post.comments?.length || 0;

        let mediaSection = '';
        if (post.image) {
            mediaSection += `<div class="post-media"><img src="${escapeHtml(post.image)}" alt="Imagen del post" onerror="this.style.display='none'"></div>`;
        }
        if (post.video) {
            // Simple check for YouTube
            if (post.video.includes('youtube.com') || post.video.includes('youtu.be')) {
                const videoId = post.video.split('v=')[1] || post.video.split('/').pop();
                mediaSection += `<div class="post-media"><iframe width="100%" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe></div>`;
            } else {
                mediaSection += `<div class="post-media"><video src="${escapeHtml(post.video)}" controls></video></div>`;
            }
        }

        let codeSection = '';
        if (post.code) {
            codeSection = `
                <div class="post-code">
                    <div class="post-code-header">
                        <span>${post.language || 'código'}</span>
                        <span class="code-score">Puntuación: ${post.score}/100</span>
                    </div>
                    <pre>${escapeHtml(post.code)}</pre>
                </div>
            `;
        }

        let langBadge = '';
        if (post.language && post.language !== 'general') {
            langBadge = `<span class="post-type-badge" style="background: var(--bg-tertiary); margin-left: 8px;">${post.language}</span>`;
        }

        return `
            <div class="post-card" data-post-id="${post.id}">
                <div class="post-header">
                    <div class="post-author">
                        <div class="post-author-avatar">${initial}</div>
                        <div class="post-author-details">
                            <h4>${escapeHtml(post.authorName)}</h4>
                            <span>${timeAgo}</span>
                        </div>
                    </div>
                    <div>
                        <span class="post-type-badge ${post.type}">${post.type}</span>
                        ${langBadge}
                    </div>
                </div>
                <div class="post-content">
                    <p>${escapeHtml(post.content)}</p>
                    ${mediaSection}
                    ${codeSection}
                </div>
                <div class="post-actions">
                    <button class="post-action-btn ${isLiked ? 'liked' : ''}" onclick="toggleLike(${post.id})">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                        ${likesCount} Me gusta
                    </button>
                    <button class="post-action-btn" onclick="toggleComments(${post.id})">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        ${commentsCount} Comentarios
                    </button>
                </div>
                <div class="post-comments" id="comments-${post.id}">
                    <div class="comments-list">
                        ${post.comments?.map(c => {
            const isCommentAuthor = currentUser && c.authorId === currentUser.id;
            const canDeleteOthers = currentUser && PERMISSIONS[currentUser.role]?.canDeleteOthersComments;
            const showDelete = isCommentAuthor || canDeleteOthers;
            const showEdit = isCommentAuthor;
            return `
                            <div class="comment-item" data-comment-id="${c.id}">
                                <div class="comment-avatar">${c.authorName?.charAt(0) || '?'}</div>
                                <div class="comment-content">
                                    <div class="comment-header-row">
                                        <span class="comment-author">${escapeHtml(c.authorName)}</span>
                                        <div class="comment-actions">
                                            ${showEdit ? `<button class="comment-btn-edit" onclick="editComment(${post.id}, ${c.id})" title="Editar">&#9998;</button>` : ''}
                                            ${showDelete ? `<button class="comment-btn-delete" onclick="deleteComment(${post.id}, ${c.id})" title="Eliminar">&times;</button>` : ''}
                                        </div>
                                    </div>
                                    <p class="comment-text" id="comment-text-${c.id}">${escapeHtml(c.text)}</p>
                                    <span class="comment-time">${getTimeAgo(c.createdAt)}${c.updatedAt ? ' (editado)' : ''}</span>
                                </div>
                            </div>
                        `}).join('') || ''}
                    </div>
                    <div class="add-comment">
                        <input type="text" id="comment-input-${post.id}" placeholder="Escribe un comentario...">
                        <button onclick="addComment(${post.id})">Enviar</button>
                    </div>
                </div>
            </div>
        `;
    }

    window.toggleLike = function (postId) {
        if (!currentUser) {
            alert('Debes iniciar sesión');
            return;
        }

        const posts = JSON.parse(localStorage.getItem('rdslp_posts') || '[]');
        const post = posts.find(p => p.id === postId);

        if (post) {
            if (!post.likes) post.likes = [];

            const idx = post.likes.indexOf(currentUser.id);
            if (idx > -1) {
                post.likes.splice(idx, 1);
            } else {
                post.likes.push(currentUser.id);
            }

            localStorage.setItem('rdslp_posts', JSON.stringify(posts));
            loadFeed();
        }
    };

    window.toggleComments = function (postId) {
        const el = document.getElementById('comments-' + postId);
        if (el) {
            el.classList.toggle('active');
        }
    };

    window.addComment = function (postId) {
        if (!currentUser) {
            alert('Debes iniciar sesión');
            return;
        }

        const input = document.getElementById('comment-input-' + postId);
        if (!input || !input.value.trim()) return;

        const posts = JSON.parse(localStorage.getItem('rdslp_posts') || '[]');
        const post = posts.find(p => p.id === postId);

        if (post) {
            if (!post.comments) post.comments = [];

            post.comments.push({
                id: Date.now(),
                authorId: currentUser.id,
                authorName: currentUser.name,
                text: input.value.trim(),
                createdAt: new Date().toISOString()
            });

            localStorage.setItem('rdslp_posts', JSON.stringify(posts));
            loadFeed();
        }
    };

    // Eliminar comentario
    window.deleteComment = function (postId, commentId) {
        if (!currentUser) {
            alert('Debes iniciar sesión');
            return;
        }

        const canDeleteOthers = PERMISSIONS[currentUser.role]?.canDeleteOthersComments;
        const posts = JSON.parse(localStorage.getItem('rdslp_posts') || '[]');
        const post = posts.find(p => p.id === postId);

        if (post && post.comments) {
            const comment = post.comments.find(c => c.id === commentId);
            if (!comment) return;

            if (comment.authorId !== currentUser.id && !canDeleteOthers) {
                alert('No tienes permisos para eliminar este comentario');
                return;
            }

            if (!confirm('¿Estás seguro de que deseas eliminar este comentario?')) return;

            post.comments = post.comments.filter(c => c.id !== commentId);
            localStorage.setItem('rdslp_posts', JSON.stringify(posts));
            loadFeed();
        }
    };

    // Editar comentario (activa modo edición inline)
    window.editComment = function (postId, commentId) {
        if (!currentUser) return;

        const posts = JSON.parse(localStorage.getItem('rdslp_posts') || '[]');
        const post = posts.find(p => p.id === postId);
        if (!post || !post.comments) return;

        const comment = post.comments.find(c => c.id === commentId);
        if (!comment || comment.authorId !== currentUser.id) {
            alert('Solo puedes editar tus propios comentarios');
            return;
        }

        const textEl = document.getElementById('comment-text-' + commentId);
        if (!textEl) return;

        // Reemplazar el texto con un input editable
        const container = textEl.parentElement;
        const originalText = comment.text;
        textEl.style.display = 'none';

        // Crear input de edición
        const editContainer = document.createElement('div');
        editContainer.className = 'comment-edit-container';
        editContainer.id = 'edit-container-' + commentId;
        editContainer.innerHTML = `
            <input type="text" class="comment-edit-input" id="edit-input-${commentId}" value="${escapeHtml(originalText)}">
            <div class="comment-edit-buttons">
                <button class="comment-btn-save" onclick="saveEditComment(${postId}, ${commentId})">Guardar</button>
                <button class="comment-btn-cancel" onclick="cancelEditComment(${commentId})">Cancelar</button>
            </div>
        `;
        container.insertBefore(editContainer, textEl.nextSibling);

        // Focus en el input
        const editInput = document.getElementById('edit-input-' + commentId);
        if (editInput) {
            editInput.focus();
            editInput.setSelectionRange(editInput.value.length, editInput.value.length);
        }
    };

    // Guardar edición de comentario
    window.saveEditComment = function (postId, commentId) {
        const input = document.getElementById('edit-input-' + commentId);
        if (!input || !input.value.trim()) return;

        const posts = JSON.parse(localStorage.getItem('rdslp_posts') || '[]');
        const post = posts.find(p => p.id === postId);
        if (!post || !post.comments) return;

        const comment = post.comments.find(c => c.id === commentId);
        if (!comment || comment.authorId !== currentUser.id) return;

        comment.text = input.value.trim();
        comment.updatedAt = new Date().toISOString();
        localStorage.setItem('rdslp_posts', JSON.stringify(posts));
        loadFeed();
    };

    // Cancelar edición de comentario
    window.cancelEditComment = function (commentId) {
        const editContainer = document.getElementById('edit-container-' + commentId);
        const textEl = document.getElementById('comment-text-' + commentId);
        if (editContainer) editContainer.remove();
        if (textEl) textEl.style.display = '';
    };

    function getTimeAgo(dateStr) {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;

        const mins = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (mins < 1) return 'Ahora';
        if (mins < 60) return `Hace ${mins}m`;
        if (hours < 24) return `Hace ${hours}h`;
        if (days < 7) return `Hace ${days}d`;
        return date.toLocaleDateString();
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});
