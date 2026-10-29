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

        // Escuchar sincronización con Supabase para actualizar rol y permisos en vivo (con detección de cambios para evitar parpadeo del feed)
        const handleUserUpdate = (e) => {
            const updated = e.detail || auth.getCurrentUser();
            if (currentUser && updated &&
                currentUser.id === updated.id &&
                currentUser.role === updated.role &&
                currentUser.name === updated.name &&
                currentUser.avatar === updated.avatar) {
                return; // Evita re-render y parpadeo innecesario si los datos no cambiaron
            }
            currentUser = updated;
            loadUserData();
            loadFeed();
        };
        window.addEventListener('userSynced', handleUserUpdate);
        window.addEventListener('rdslp_user_updated', handleUserUpdate);
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
        if (window.SocialModerationManager && currentUser) {
            const sanction = window.SocialModerationManager.getSanctionStatus(currentUser.id);
            if (sanction.isBanned) {
                alert(`Tu cuenta se encuentra suspendida: ${sanction.banReason || 'Sanción disciplinaria'}.`);
                return;
            }
            if (sanction.isMuted) {
                alert(`Tu cuenta se encuentra silenciada para publicar: ${sanction.muteReason || 'Restricción de moderación'}.`);
                return;
            }
        }

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

        const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'moderator');
        const isPostAuthor = currentUser && (String(post.authorId) === String(currentUser.id) || post.authorName === currentUser.name || post.authorEmail === currentUser.email);
        const canDeletePost = isAdmin || isPostAuthor;

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
                    <div class="post-author" onclick="window.openUserProfile('${post.authorId}', '${escapeHtml(post.authorName)}')" style="cursor: pointer;" title="Ver perfil de ${escapeHtml(post.authorName)}">
                        <div class="post-author-avatar">${initial}</div>
                        <div class="post-author-details">
                            <h4>${escapeHtml(post.authorName)}</h4>
                            <span>${timeAgo}</span>
                        </div>
                    </div>
                    <div class="post-header-right" style="display: flex; align-items: center; gap: 8px;">
                        <span class="post-type-badge ${post.type}">${post.type}</span>
                        ${langBadge}
                        <div class="post-menu-container" style="position: relative;">
                            <button type="button" class="post-menu-btn" onclick="window.togglePostMenu(${post.id}, event)" title="Opciones" aria-label="Opciones">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <circle cx="5" cy="12" r="2"></circle>
                                    <circle cx="12" cy="12" r="2"></circle>
                                    <circle cx="19" cy="12" r="2"></circle>
                                </svg>
                            </button>
                            <div class="post-menu-dropdown" id="postDropdown-${post.id}">
                                <button type="button" class="post-menu-item" onclick="window.openUserProfile('${post.authorId}', '${escapeHtml(post.authorName)}')">
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                    <span>Ver Perfil</span>
                                </button>
                                <button type="button" class="post-menu-item" onclick="window.openReportModal(${post.id})">
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
                                    <span>Reportar a Moderación</span>
                                </button>
                                ${canDeletePost ? `
                                <div class="post-menu-separator"></div>
                                <button type="button" class="post-menu-item item-danger" onclick="deletePost(${post.id})">
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                    <span>Eliminar Publicación</span>
                                </button>
                                ` : ''}
                            </div>
                        </div>
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
            const isCommentAuthor = currentUser && (String(c.authorId) === String(currentUser.id) || c.authorName === currentUser.name);
            const canDeleteComment = isCommentAuthor || isAdmin || (currentUser && PERMISSIONS[currentUser.role]?.canDeleteOthersComments);
            const showDelete = canDeleteComment;
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

        if (window.SocialModerationManager) {
            const sanction = window.SocialModerationManager.getSanctionStatus(currentUser.id);
            if (sanction.isBanned || sanction.isMuted) {
                alert('No puedes comentar mientras tu cuenta tenga una sanción o silencio activo.');
                return;
            }
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

    // Eliminar publicación (solo autor o administrador/moderador)
    window.deletePost = function (postId) {
        if (!currentUser) {
            alert('Debes iniciar sesión');
            return;
        }

        const isAdmin = currentUser.role === 'admin' || currentUser.role === 'moderator';
        const posts = JSON.parse(localStorage.getItem('rdslp_posts') || '[]');
        const postIndex = posts.findIndex(p => p.id === postId || String(p.id) === String(postId));

        if (postIndex === -1) return;

        const post = posts[postIndex];
        const isAuthor = String(post.authorId) === String(currentUser.id) || post.authorName === currentUser.name || post.authorEmail === currentUser.email;

        if (!isAdmin && !isAuthor) {
            alert('No tienes permisos para eliminar esta publicación');
            return;
        }

        if (!confirm('¿Estás seguro de que deseas eliminar esta publicación del muro?')) return;

        posts.splice(postIndex, 1);
        localStorage.setItem('rdslp_posts', JSON.stringify(posts));
        loadFeed();
    };

    // Eliminar comentario (solo autor o administrador/moderador)
    window.deleteComment = function (postId, commentId) {
        if (!currentUser) {
            alert('Debes iniciar sesión');
            return;
        }

        const isAdmin = currentUser.role === 'admin' || currentUser.role === 'moderator' || PERMISSIONS[currentUser.role]?.canDeleteOthersComments;
        const posts = JSON.parse(localStorage.getItem('rdslp_posts') || '[]');
        const post = posts.find(p => p.id === postId || String(p.id) === String(postId));

        if (post && post.comments) {
            const comment = post.comments.find(c => c.id === commentId || String(c.id) === String(commentId));
            if (!comment) return;

            const isAuthor = String(comment.authorId) === String(currentUser.id) || comment.authorName === currentUser.name;

            if (!isAuthor && !isAdmin) {
                alert('No tienes permisos para eliminar este comentario');
                return;
            }

            if (!confirm('¿Estás seguro de que deseas eliminar este comentario?')) return;

            post.comments = post.comments.filter(c => c.id !== commentId && String(c.id) !== String(commentId));
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

    // =====================================================
    // SISTEMA SOCIAL, PERFIL DE USUARIO Y MODERACIÓN (FACEBOOK STYLE)
    // =====================================================
    let currentProfileTarget = null;
    let activeReportPostId = null;
    let activeChatTarget = null;

    // Menú de opciones de cada publicación (...)
    window.togglePostMenu = function (postId, event) {
        if (event) event.stopPropagation();
        const dropdown = document.getElementById(`postDropdown-${postId}`);
        const wasOpen = dropdown && dropdown.classList.contains('show');
        document.querySelectorAll('.post-menu-dropdown.show').forEach(d => d.classList.remove('show'));
        if (dropdown && !wasOpen) {
            dropdown.classList.add('show');
        }
    };

    document.addEventListener('click', function () {
        document.querySelectorAll('.post-menu-dropdown.show').forEach(d => d.classList.remove('show'));
    });

    // Pestañas del Perfil
    function switchProfileTab(tabName) {
        document.querySelectorAll('.profile-modal-tabs .p-tab').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName || (tabName === 'admin' && btn.id === 'modalAdminTab'));
        });
        const postsTab = document.getElementById('tabPostsContent');
        const aboutTab = document.getElementById('tabAboutContent');
        const adminTab = document.getElementById('tabAdminContent');

        if (postsTab) postsTab.style.display = tabName === 'posts' ? 'block' : 'none';
        if (aboutTab) aboutTab.style.display = tabName === 'about' ? 'block' : 'none';
        if (adminTab) adminTab.style.display = tabName === 'admin' ? 'block' : 'none';
    }

    document.querySelectorAll('.profile-modal-tabs .p-tab').forEach(btn => {
        btn.addEventListener('click', function () {
            const tab = this.dataset.tab || (this.id === 'modalAdminTab' ? 'admin' : 'posts');
            switchProfileTab(tab);
        });
    });

    // Abrir Perfil de Usuario
    window.openUserProfile = function (targetId, targetName) {
        if (!targetId && !targetName) return;
        const targetUserId = String(targetId || targetName);
        const displayName = targetName || 'Usuario';

        // Determinar rol
        let targetRole = 'usuario';
        if (String(targetId) === '1' || displayName.toLowerCase().includes('admin')) targetRole = 'admin';
        else if (String(targetId) === '2' || displayName.toLowerCase().includes('moderador')) targetRole = 'moderator';

        try {
            const storedUsers = JSON.parse(localStorage.getItem('rdslp_users') || '[]');
            const found = storedUsers.find(u => String(u.id) === targetUserId || u.name === displayName || u.email === targetUserId);
            if (found && found.role) targetRole = found.role;
        } catch (e) {}

        currentProfileTarget = { id: targetUserId, name: displayName, role: targetRole };

        const modal = document.getElementById('userProfileModal');
        const avatarEl = document.getElementById('modalUserAvatar');
        const nameEl = document.getElementById('modalUserName');
        const handleEl = document.getElementById('modalUserHandle');
        const badgeEl = document.getElementById('modalUserBadge');
        const socialActionsEl = document.getElementById('modalSocialActions');
        const statFollowersEl = document.getElementById('modalStatFollowers');
        const statFollowingEl = document.getElementById('modalStatFollowing');
        const statPostsEl = document.getElementById('modalStatPosts');
        const statMutualWrap = document.getElementById('modalStatMutualWrap');
        const adminTab = document.getElementById('modalAdminTab');

        if (!modal) return;

        const initial = (displayName.charAt(0) || 'U').toUpperCase();
        if (avatarEl) avatarEl.textContent = initial;
        if (nameEl) nameEl.textContent = displayName;
        if (handleEl) handleEl.textContent = `@${displayName.toLowerCase().replace(/\s+/g, '')}`;

        if (badgeEl) {
            badgeEl.textContent = targetRole === 'admin' ? 'ADMINISTRADOR' : (targetRole === 'moderator' ? 'MODERADOR' : 'USUARIO');
            badgeEl.className = 'user-role-badge ' + (targetRole === 'admin' ? 'admin' : (targetRole === 'moderator' ? 'moderator' : ''));
        }

        const mgr = window.SocialModerationManager;
        const followersCount = mgr ? mgr.getFollowersCount(targetUserId) : 0;
        const followingCount = mgr ? mgr.getFollowingCount(targetUserId) : 0;

        const posts = JSON.parse(localStorage.getItem('rdslp_posts') || '[]');
        const userPosts = posts.filter(p => String(p.authorId) === targetUserId || p.authorName === displayName);

        if (statFollowersEl) statFollowersEl.textContent = followersCount;
        if (statFollowingEl) statFollowingEl.textContent = followingCount;
        if (statPostsEl) statPostsEl.textContent = userPosts.length;

        const isSelf = currentUser && (String(currentUser.id) === targetUserId || currentUser.name === displayName);
        const isFollowing = currentUser && mgr && !isSelf ? mgr.isFollowing(currentUser.id, targetUserId) : false;
        const isMutual = currentUser && mgr && !isSelf ? mgr.isMutual(currentUser.id, targetUserId) : false;

        if (statMutualWrap) {
            statMutualWrap.style.display = isMutual ? 'inline-flex' : 'none';
        }

        if (socialActionsEl) {
            if (isSelf) {
                socialActionsEl.innerHTML = `
                    <span class="profile-own-badge">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        Tu Perfil
                    </span>
                `;
            } else {
                socialActionsEl.innerHTML = `
                    <button type="button" class="btn-profile-follow ${isFollowing ? 'following' : ''}" onclick="window.toggleFollowUser('${targetUserId}', '${escapeHtml(displayName)}')">
                        ${isFollowing ? '✓ Siguiendo' : '+ Seguir'}
                    </button>
                    ${isMutual ? `
                        <button type="button" class="btn-profile-chat" onclick="window.openDirectChat('${targetUserId}', '${escapeHtml(displayName)}')">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                            Mensaje
                        </button>
                    ` : `
                        <button type="button" class="btn-profile-chat disabled" title="Los chats privados solo se habilitan cuando ambos se siguen mutuamente" onclick="alert('🔒 Chat bloqueado: Para chatear en privado, ambos usuarios deben seguirse mutuamente (Amigos mutuos).')">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                            Chat (Solo Mutuos)
                        </button>
                    `}
                `;
            }
        }

        // Renderizar publicaciones del usuario
        const userPostsListEl = document.getElementById('modalUserPostsList');
        if (userPostsListEl) {
            if (userPosts.length === 0) {
                userPostsListEl.innerHTML = `
                    <div style="text-align: center; padding: 30px; color: var(--text-muted);">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 8px;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line></svg>
                        <p>Este usuario aún no ha realizado publicaciones en el muro.</p>
                    </div>
                `;
            } else {
                userPostsListEl.innerHTML = userPosts.map(p => `
                    <div class="user-profile-post-card">
                        <div class="upp-header">
                            <span class="upp-type ${p.type}">${p.type.toUpperCase()}</span>
                            <span class="upp-time">${getTimeAgo(p.createdAt)}</span>
                        </div>
                        <div class="upp-content">
                            <p>${escapeHtml(p.content)}</p>
                            ${p.code ? `<pre class="upp-code">${escapeHtml(p.code)}</pre>` : ''}
                            ${p.image ? `<img src="${escapeHtml(p.image)}" class="upp-img" alt="Post">` : ''}
                        </div>
                        <div class="upp-footer">
                            <span>❤️ ${p.likes?.length || 0} Me gusta</span>
                            <span>💬 ${p.comments?.length || 0} Comentarios</span>
                        </div>
                    </div>
                `).join('');
            }
        }

        // Pestaña Admin / Moderación
        const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'moderator');
        if (adminTab) {
            adminTab.style.display = (isAdmin && !isSelf) ? 'inline-flex' : 'none';
        }

        switchProfileTab('posts');

        if (isAdmin && !isSelf) {
            renderSanctionsHistory(targetUserId);
        }

        modal.classList.add('active');
    };

    // Cerrar Perfil
    const closeProfileBtn = document.getElementById('closeProfileModal');
    if (closeProfileBtn) {
        closeProfileBtn.addEventListener('click', () => {
            const m = document.getElementById('userProfileModal');
            if (m) m.classList.remove('active');
        });
    }

    // Toggle Seguir Usuario
    window.toggleFollowUser = function (targetId, targetName) {
        if (!currentUser) {
            alert('Debes iniciar sesión para seguir usuarios.');
            return;
        }
        if (!window.SocialModerationManager) return;

        const res = window.SocialModerationManager.toggleFollow(currentUser, { id: targetId, name: targetName });
        if (!res.success) {
            alert(res.message);
            return;
        }

        window.openUserProfile(targetId, targetName);
    };

    // Chat Privado (Solo Amigos Mutuos)
    window.openDirectChat = function (targetId, targetName) {
        if (!currentUser) {
            alert('Debes iniciar sesión para usar el chat.');
            return;
        }
        if (!window.SocialModerationManager) return;

        if (!window.SocialModerationManager.isMutual(currentUser.id, targetId)) {
            alert('🔒 Chat bloqueado: Para chatear en privado, ambos usuarios deben seguirse mutuamente.');
            return;
        }

        activeChatTarget = { id: targetId, name: targetName };
        const chatModal = document.getElementById('directChatModal');
        const avatarEl = document.getElementById('chatTargetAvatar');
        const nameEl = document.getElementById('chatTargetName');

        if (avatarEl) avatarEl.textContent = (targetName.charAt(0) || 'U').toUpperCase();
        if (nameEl) nameEl.textContent = targetName;

        renderDirectMessages();
        if (chatModal) chatModal.classList.add('active');
    };

    function renderDirectMessages() {
        if (!activeChatTarget || !window.SocialModerationManager || !currentUser) return;
        const container = document.getElementById('directChatMessages');
        if (!container) return;

        const messages = window.SocialModerationManager.getMessages(currentUser.id, activeChatTarget.id);
        if (messages.length === 0) {
            container.innerHTML = `
                <div class="chat-empty-state">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    <h4>¡Amistad Mutua Confirmada!</h4>
                    <p>Ambos se siguen mutuamente. Inicia la conversación con un mensaje privado seguro.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = messages.map(m => {
            const isMine = String(m.senderId) === String(currentUser.id);
            const timeStr = new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return `
                <div class="direct-chat-row ${isMine ? 'mine' : 'theirs'}">
                    ${!isMine ? `<div class="chat-bubble-avatar">${m.senderAvatar || 'U'}</div>` : ''}
                    <div class="chat-bubble ${isMine ? 'mine' : 'theirs'}">
                        <p class="chat-bubble-text">${escapeHtml(m.text)}</p>
                        <span class="chat-bubble-time">${timeStr}</span>
                    </div>
                </div>
            `;
        }).join('');

        container.scrollTop = container.scrollHeight;
    }

    const closeChatBtn = document.getElementById('closeChatModal');
    if (closeChatBtn) {
        closeChatBtn.addEventListener('click', () => {
            const m = document.getElementById('directChatModal');
            if (m) m.classList.remove('active');
        });
    }

    const chatForm = document.getElementById('directChatForm');
    if (chatForm) {
        chatForm.addEventListener('submit', function (e) {
            e.preventDefault();
            if (!activeChatTarget || !currentUser || !window.SocialModerationManager) return;

            const input = document.getElementById('directChatMessageInput');
            const text = input ? input.value.trim() : '';
            if (!text) return;

            const res = window.SocialModerationManager.sendDirectMessage(currentUser, activeChatTarget.id, text);
            if (!res.success) {
                alert(res.message);
                return;
            }

            if (input) input.value = '';
            renderDirectMessages();
        });
    }

    // Modal de Reportes de Publicación
    window.openReportModal = function (postId) {
        activeReportPostId = postId;
        const modal = document.getElementById('reportModal');
        if (modal) modal.classList.add('active');
    };

    const closeReportBtn = document.getElementById('closeReportModal');
    const cancelReportBtn = document.getElementById('cancelReport');
    function hideReportModal() {
        const m = document.getElementById('reportModal');
        if (m) m.classList.remove('active');
    }
    if (closeReportBtn) closeReportBtn.addEventListener('click', hideReportModal);
    if (cancelReportBtn) cancelReportBtn.addEventListener('click', hideReportModal);

    const reportForm = document.getElementById('reportForm');
    if (reportForm) {
        reportForm.addEventListener('submit', function (e) {
            e.preventDefault();
            if (!activeReportPostId || !window.SocialModerationManager) return;

            const reasonEl = document.getElementById('reportReason');
            const detailsEl = document.getElementById('reportDetails');
            const reason = reasonEl ? reasonEl.value : 'Contenido inapropiado';
            const details = detailsEl ? detailsEl.value.trim() : '';

            window.SocialModerationManager.reportPost(currentUser, activeReportPostId, reason, details);
            alert('✓ Reporte enviado a los moderadores. Revisaremos el contenido para mantener la comunidad segura.');
            hideReportModal();
            if (detailsEl) detailsEl.value = '';
        });
    }

    // =====================================================
    // HERRAMIENTAS DE MODERACIÓN (ADMIN / MODERADOR)
    // =====================================================
    function renderSanctionsHistory(userId) {
        const listEl = document.getElementById('modalSanctionsHistory');
        if (!listEl || !window.SocialModerationManager) return;
        const status = window.SocialModerationManager.getSanctionStatus(userId);

        let html = '';
        if (status.isBanned) {
            html += `
                <div class="mod-status-badge ban">
                    ⛔ <strong>Baneado:</strong> ${status.banExpires ? 'Hasta ' + new Date(status.banExpires).toLocaleDateString() : 'Permanente'} - ${escapeHtml(status.banReason)}
                </div>
            `;
        }
        if (status.isMuted) {
            html += `
                <div class="mod-status-badge mute">
                    🔇 <strong>Silenciado:</strong> ${status.muteExpires ? 'Hasta ' + new Date(status.muteExpires).toLocaleDateString() : 'Permanente'} - ${escapeHtml(status.muteReason)}
                </div>
            `;
        }

        if (status.warnings && status.warnings.length > 0) {
            html += `<div style="margin-top: 10px; font-size: 13px; font-weight: 600; color: #f59e0b;">⚠️ Avisos Disciplinarios (${status.warnings.length} Strikes):</div>`;
            html += status.warnings.map(w => `
                <div class="mod-warning-item">
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

    window.applyMute = function (days) {
        if (!currentProfileTarget || !window.SocialModerationManager) return;
        const durationText = days === 0 ? 'de forma permanente' : `por ${days} día(s)`;
        if (!confirm(`¿Confirmas silenciar a ${currentProfileTarget.name} ${durationText}? No podrá publicar comentarios ni enviar mensajes.`)) return;

        const res = window.SocialModerationManager.muteUser(currentUser, currentProfileTarget.id, days);
        if (res.success) {
            alert('✓ Silencio aplicado con éxito.');
            renderSanctionsHistory(currentProfileTarget.id);
        } else {
            alert(res.message || 'Error al aplicar sanción.');
        }
    };

    window.applyBan = function (days) {
        if (!currentProfileTarget || !window.SocialModerationManager) return;
        const durationText = days === 0 ? 'de forma permanente' : `por ${days} día(s)`;
        if (!confirm(`¿Confirmas suspender / banear a ${currentProfileTarget.name} ${durationText}?`)) return;

        const res = window.SocialModerationManager.banUser(currentUser, currentProfileTarget.id, days);
        if (res.success) {
            alert('✓ Baneo aplicado con éxito.');
            renderSanctionsHistory(currentProfileTarget.id);
        } else {
            alert(res.message || 'Error al aplicar baneo.');
        }
    };

    window.liftSanction = function () {
        if (!currentProfileTarget || !window.SocialModerationManager) return;
        if (!confirm(`¿Deseas levantar todas las sanciones y reactivar a ${currentProfileTarget.name}?`)) return;

        const res = window.SocialModerationManager.liftSanctions(currentUser, currentProfileTarget.id);
        if (res.success) {
            alert(`✓ Todas las sanciones de ${currentProfileTarget.name} han sido levantadas.`);
            renderSanctionsHistory(currentProfileTarget.id);
        } else {
            alert(res.message || 'Error al levantar sanciones.');
        }
    };

    // Emitir Aviso Oficial (Strike)
    const btnIssueWarning = document.getElementById('btnIssueWarning');
    if (btnIssueWarning) {
        btnIssueWarning.addEventListener('click', function () {
            if (!currentProfileTarget || !window.SocialModerationManager) return;
            const reasonEl = document.getElementById('warnReasonSelect');
            const noteEl = document.getElementById('warnNoteInput');

            const reason = reasonEl ? reasonEl.value : 'Infracción de normas';
            const note = noteEl ? noteEl.value.trim() : '';

            const res = window.SocialModerationManager.issueWarning(currentUser, currentProfileTarget.id, currentProfileTarget.name, reason, note);
            if (res.success) {
                alert(`✓ Aviso disciplinario (Strike #${res.count}) emitido contra ${currentProfileTarget.name}.`);
                if (noteEl) noteEl.value = '';
                renderSanctionsHistory(currentProfileTarget.id);
            } else {
                alert(res.message || 'Error al emitir aviso.');
            }
        });
    }
});
