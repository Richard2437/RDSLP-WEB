/* =====================================================
   RDSLP - Módulo Base Reutilizable para Detalle de Bases de Datos
   DatabasesSection_js/detalle_database_base.js
===================================================== */

(function () {
    window.DatabaseDetailManager = {
        init: function (config) {
            const auth = window.authManager;
            const content = window.contentManager;
            let currentUser = null;

            if (auth && !auth.isAuthenticated()) {
                window.location.href = '../Static/login.html';
                return;
            }
            if (auth) currentUser = auth.getCurrentUser();

            if (currentUser) {
                const avatar = document.getElementById('userAvatar');
                const name = document.getElementById('userName');
                if (avatar) avatar.textContent = currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U';
                if (name) name.textContent = currentUser.name || 'Usuario';
            }

            this.renderPage(config, currentUser, content);
            this.setupEventListeners(auth, config.id);
            this.cargarArchivos(config.id);
        },

        renderPage: function (config, currentUser, content) {
            const container = document.getElementById('dynamicContent');
            if (!container) return;

            const html = `
                <div class="db-detail-wrapper">
                    <!-- Hero de la Base de Datos -->
                    <div class="db-hero-card">
                        <div class="db-hero-main">
                            <div class="db-hero-icon ${config.colorClass || 'custom'}" style="${config.color ? `background:${config.color};` : ''}">
                                ${this.escapeHtml(config.abbr || 'DB')}
                            </div>
                            <div class="db-hero-info">
                                <h1>${this.escapeHtml(config.name)}</h1>
                                <p>${this.escapeHtml(config.tagline || 'Motor de Base de Datos')}</p>
                                <div class="db-hero-tags">
                                    ${(config.features || []).slice(0, 3).map(f => `<span class="db-hero-tag">${this.escapeHtml(f)}</span>`).join('')}
                                </div>
                            </div>
                        </div>
                        <div>
                            <a href="databases.html" class="db-back-btn">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="19" y1="12" x2="5" y2="12"></line>
                                    <polyline points="12 19 5 12 12 5"></polyline>
                                </svg>
                                Volver a Bases de Datos
                            </a>
                        </div>
                    </div>

                    <!-- Barra de Pestañas -->
                    <div class="db-tabs-bar">
                        <button class="db-tab-btn active" onclick="window.DatabaseDetailManager.cambiarPestana('explicacion', this)">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="16" x2="12" y2="12"></line>
                                <line x1="12" y1="8" x2="12.01" y2="8"></line>
                            </svg>
                            Explicación y Consultas
                        </button>
                        <button class="db-tab-btn" onclick="window.DatabaseDetailManager.cambiarPestana('subir', this)">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="17 8 12 3 7 8"></polyline>
                                <line x1="12" y1="3" x2="12" y2="15"></line>
                            </svg>
                            + Subir Aporte para ${this.escapeHtml(config.name)}
                        </button>
                        <button class="db-tab-btn" onclick="window.DatabaseDetailManager.cambiarPestana('archivos', this)">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                            </svg>
                            Aportes de la Comunidad
                        </button>
                        <button class="db-tab-btn" onclick="window.DatabaseDetailManager.cambiarPestana('ejercicios', this)">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="16 18 22 12 16 6"></polyline>
                                <polyline points="8 6 2 12 8 18"></polyline>
                            </svg>
                            Ejercicios de Práctica
                        </button>
                    </div>

                    <!-- Pestaña 1: Explicación -->
                    <div id="tab-explicacion" class="db-tab-pane active">
                        <div class="db-section-block">
                            <h3 class="db-section-title">¿Qué es ${this.escapeHtml(config.name)}?</h3>
                            <p class="db-text-content">${this.escapeHtml(config.description)}</p>
                        </div>

                        <div class="db-section-block">
                            <h3 class="db-section-title">Características Principales y Arquitectura</h3>
                            <ul class="db-features-list">
                                ${(config.features || []).map(f => `
                                    <li class="db-feature-item">
                                        <span class="db-feature-bullet"></span>
                                        <span>${this.escapeHtml(f)}</span>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>

                        <div class="db-section-block">
                            <h3 class="db-section-title">Ejemplo de Consulta y Uso Real</h3>
                            <div class="code-container">
                                <div class="code-header">
                                    <span class="code-lang-label">${this.escapeHtml((config.category === 'relacional' ? 'sql' : 'nosql'))}</span>
                                    <button class="btn-copy-code" onclick="window.DatabaseDetailManager.copiarCodigoEjemplo()">Copiar Consulta</button>
                                </div>
                                <pre class="code-pre" id="codigoEjemploPre">${this.escapeHtml(config.code)}</pre>
                            </div>
                        </div>

                        <!-- Sección de Comentarios -->
                        <div class="db-comments-container">
                            ${this.renderCommentsSection(config.id, config.name, content)}
                        </div>
                    </div>

                    <!-- Pestaña 2: Subir Aporte de esta BD -->
                    <div id="tab-subir" class="db-tab-pane">
                        <div class="db-upload-card">
                            <h3>Subir Recurso, Script o Esquema para ${this.escapeHtml(config.name)}</h3>
                            <p>Comparte scripts de creación de tablas/colecciones, consultas optimizadas, procedimientos almacenados o ejercicios.</p>

                            <form id="formSubirAporte" onsubmit="return false;">
                                <div class="db-form-grid">
                                    <div class="form-group">
                                        <label class="form-label">Título o Nombre del Recurso *</label>
                                        <input type="text" id="aporteTitulo" class="form-input" placeholder="Ej: Esquema de Facturación con Índices, Pipeline de Agregación..." required>
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Dificultad *</label>
                                        <select id="aporteDificultad" class="form-select">
                                            <option value="Fácil">Fácil (Básico)</option>
                                            <option value="Medio" selected>Medio (Intermedio)</option>
                                            <option value="Difícil">Difícil (Avanzado)</option>
                                        </select>
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label class="form-label">Tipo de Recurso</label>
                                    <select id="aporteTipo" class="form-select">
                                        <option value="Consulta">Consulta / Query Optimizado</option>
                                        <option value="Esquema">Esquema DDL / Tablas / Índices</option>
                                        <option value="Script">Script de Migración / Procedimiento</option>
                                        <option value="Ejercicio">Ejercicio con Solución</option>
                                    </select>
                                </div>

                                <div class="form-group">
                                    <label class="form-label">Código SQL / NoSQL del Aporte *</label>
                                    <textarea id="aporteContenido" class="form-textarea" placeholder="Pega aquí tus consultas o código de ${this.escapeHtml(config.name)}..." style="height: 180px; font-family: monospace;" required></textarea>
                                </div>

                                <button type="button" class="btn-submit-modal" onclick="window.DatabaseDetailManager.guardarAporte('${config.id}')">
                                    Publicar Aporte para ${this.escapeHtml(config.name)}
                                </button>
                            </form>
                        </div>
                    </div>

                    <!-- Pestaña 3: Aportes de la Comunidad -->
                    <div id="tab-archivos" class="db-tab-pane">
                        <div class="db-resources-header">
                            <h3>Aportes y Recursos de la Comunidad (${this.escapeHtml(config.name)})</h3>
                            <button class="btn-upload-db" onclick="window.DatabaseDetailManager.cambiarPestana('subir')">+ Subir Nuevo Aporte</button>
                        </div>
                        <div class="db-resources-grid" id="listaArchivos-${config.id}">
                            <div class="empty-state" style="grid-column: 1/-1; text-align:center; padding: 30px; color: var(--text-muted);">Cargando aportes comunitarios...</div>
                        </div>
                    </div>

                    <!-- Pestaña 4: Ejercicios -->
                    <div id="tab-ejercicios" class="db-tab-pane">
                        <div class="db-section-block">
                            <h3 class="db-section-title">Práctica con Ejercicios de ${this.escapeHtml(config.name)}</h3>
                            <p class="db-text-content">Desafíos de modelado, consultas JOIN/Agregaciones y optimización de rendimiento.</p>
                            <div style="margin-top: 20px;">
                                <button class="btn-submit-modal" style="max-width: 260px;" onclick="window.location.href='databases.html'">
                                    Ver Todos los Ejercicios de BD &rarr;
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            container.innerHTML = html;
        },

        cambiarPestana: function (tabName, btnEl = null) {
            document.querySelectorAll('.db-tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.db-tab-pane').forEach(pane => pane.classList.remove('active'));

            const targetPane = document.getElementById('tab-' + tabName);
            if (targetPane) targetPane.classList.add('active');

            if (btnEl) {
                btnEl.classList.add('active');
            } else {
                const buttons = document.querySelectorAll('.db-tab-btn');
                const map = { 'explicacion': 0, 'subir': 1, 'archivos': 2, 'ejercicios': 3 };
                if (map[tabName] !== undefined && buttons[map[tabName]]) {
                    buttons[map[tabName]].classList.add('active');
                }
            }
        },

        copiarCodigoEjemplo: function () {
            const code = document.getElementById('codigoEjemploPre')?.innerText || '';
            navigator.clipboard.writeText(code).then(() => {
                alert('¡Consulta copiada al portapapeles!');
            }).catch(() => {
                alert('No se pudo copiar automáticamente.');
            });
        },

        cargarArchivos: async function (dbId) {
            const container = document.getElementById(`listaArchivos-${dbId}`);
            if (!container) return;

            let archivos = [];

            try {
                const res = await fetch(`http://localhost:3000/api/archivos/${dbId}`);
                const data = await res.json();
                if (data.success && Array.isArray(data.archivos)) {
                    archivos = data.archivos;
                }
            } catch (e) {}

            try {
                const local = JSON.parse(localStorage.getItem(`rdslp_archivos_${dbId}`) || '[]');
                archivos = [...local, ...archivos];
            } catch (e) {}

            if (archivos.length === 0) {
                container.innerHTML = `
                    <div class="empty-state" style="grid-column: 1/-1; text-align:center; padding: 40px; color: var(--text-muted); background: var(--bg-input); border-radius: 10px;">
                        <p>Aún no hay aportes ni consultas compartidas para esta base de datos.</p>
                        <button class="btn-upload-db" style="margin-top: 14px;" onclick="window.DatabaseDetailManager.cambiarPestana('subir')">¡Sé el primero en aportar!</button>
                    </div>
                `;
                return;
            }

            container.innerHTML = archivos.map((a, idx) => {
                const diffClass = a.dificultad === 'Fácil' ? 'badge-facil' : (a.dificultad === 'Difícil' ? 'badge-dificil' : 'badge-medio');
                const autor = a.autor_subida || a.autor || 'Comunidad';
                const fecha = a.created_at ? new Date(a.created_at).toLocaleDateString() : 'Reciente';

                return `
                    <div class="db-file-card">
                        <div>
                            <div class="db-file-top">
                                <span class="db-file-title">${this.escapeHtml(a.nombre_archivo || a.titulo)}</span>
                                <span class="badge-difficulty ${diffClass}">${this.escapeHtml(a.dificultad || 'Normal')}</span>
                            </div>
                            <div class="db-file-author">Subido por ${this.escapeHtml(autor)} &bull; ${fecha}</div>
                            <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.4; margin-bottom: 12px;">
                                ${this.escapeHtml((a.contenido || '').substring(0, 100))}${a.contenido && a.contenido.length > 100 ? '...' : ''}
                            </p>
                        </div>
                        <div class="db-file-actions">
                            <button class="btn-file-view" onclick="window.DatabaseDetailManager.verAporteModal('${dbId}', ${idx})">Ver Consulta Completa</button>
                        </div>
                    </div>
                `;
            }).join('');

            window[`cached_archivos_${dbId}`] = archivos;
        },

        verAporteModal: function (dbId, index) {
            const archivos = window[`cached_archivos_${dbId}`] || [];
            const item = archivos[index];
            if (!item) return;

            const modal = document.getElementById('contentModal');
            const modalTitle = document.getElementById('modalTitle');
            const modalBody = document.getElementById('modalBody');

            if (!modal) return;

            modalTitle.textContent = item.nombre_archivo || item.titulo || 'Detalle del Aporte';
            modalBody.innerHTML = `
                <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 13px; color: var(--text-secondary);">Subido por: <strong>${this.escapeHtml(item.autor_subida || item.autor || 'Usuario')}</strong></span>
                    <span style="font-size: 12px; padding: 3px 10px; border-radius: 12px; background: var(--bg-input); border: 1px solid var(--border-color);">${this.escapeHtml(item.dificultad || 'Normal')}</span>
                </div>
                <div class="code-container">
                    <div class="code-header">
                        <span class="code-lang-label">Código / Consulta</span>
                        <button class="btn-copy-code" onclick="navigator.clipboard.writeText(document.getElementById('modalCodigoPre').innerText); alert('¡Código copiado!');">Copiar</button>
                    </div>
                    <pre class="code-pre" id="modalCodigoPre">${this.escapeHtml(item.contenido || '')}</pre>
                </div>
            `;

            modal.classList.add('active');
        },

        guardarAporte: async function (dbId) {
            const auth = window.authManager;
            const currentUser = auth ? auth.getCurrentUser() : null;

            const titulo = document.getElementById('aporteTitulo')?.value.trim();
            const dificultad = document.getElementById('aporteDificultad')?.value;
            const contenido = document.getElementById('aporteContenido')?.value.trim();

            if (!titulo || !contenido) {
                alert('Por favor completa el título y el contenido del aporte.');
                return;
            }

            if (!currentUser) {
                alert('Debes iniciar sesión para subir aportes.');
                return;
            }

            const nuevoAporte = {
                lenguaje_id: dbId,
                nombre_archivo: titulo,
                dificultad: dificultad,
                contenido: contenido,
                usuario_id: currentUser.id,
                autor_subida: currentUser.name,
                created_at: new Date().toISOString()
            };

            try {
                await fetch('http://localhost:3000/api/archivos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(nuevoAporte)
                });
            } catch (e) {}

            try {
                const list = JSON.parse(localStorage.getItem(`rdslp_archivos_${dbId}`) || '[]');
                list.unshift(nuevoAporte);
                localStorage.setItem(`rdslp_archivos_${dbId}`, JSON.stringify(list));
            } catch (e) {}

            document.getElementById('aporteTitulo').value = '';
            document.getElementById('aporteContenido').value = '';

            alert('¡Aporte publicado con éxito para esta base de datos!');
            this.cambiarPestana('archivos');
            this.cargarArchivos(dbId);
        },

        renderCommentsSection: function (dbId, dbName, content) {
            const comments = content ? content.getComments(dbId) : [];
            return `
                <h3 class="db-section-title">Comentarios y Discusión sobre ${this.escapeHtml(dbName)} (${comments.length})</h3>
                <div class="comment-input-row">
                    <input type="text" id="nuevoComentarioDB" class="comment-input" placeholder="Deja una duda, optimización o experiencia con ${this.escapeHtml(dbName)}...">
                    <button type="button" class="btn-comment-submit" onclick="window.DatabaseDetailManager.enviarComentario('${dbId}')">Comentar</button>
                </div>
                <div class="comments-list" id="listaComentariosDB">
                    ${comments.length === 0
                        ? `<p style="color: var(--text-muted); font-size: 13px; margin-top: 10px;">Aún no hay comentarios. ¡Sé el primero en participar!</p>`
                        : comments.map(c => `
                            <div class="comment-card">
                                <div class="comment-header">
                                    <span class="comment-author">${this.escapeHtml(c.authorName || 'Usuario')}</span>
                                    <span class="comment-date">${new Date(c.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div class="comment-body">${this.escapeHtml(c.text)}</div>
                            </div>
                        `).join('')
                    }
                </div>
            `;
        },

        enviarComentario: function (dbId) {
            const auth = window.authManager;
            const content = window.contentManager;
            const currentUser = auth ? auth.getCurrentUser() : null;
            const input = document.getElementById('nuevoComentarioDB');

            if (!input || !input.value.trim()) return;
            if (!currentUser) {
                alert('Debes iniciar sesión para comentar.');
                return;
            }

            if (content) {
                content.addComment(dbId, input.value.trim(), currentUser.id, currentUser.name);
                input.value = '';
                const listContainer = document.getElementById('listaComentariosDB');
                if (listContainer) {
                    const comments = content.getComments(dbId);
                    listContainer.innerHTML = comments.map(c => `
                        <div class="comment-card">
                            <div class="comment-header">
                                <span class="comment-author">${this.escapeHtml(c.authorName || 'Usuario')}</span>
                                <span class="comment-date">${new Date(c.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div class="comment-body">${this.escapeHtml(c.text)}</div>
                        </div>
                    `).join('');
                }
            }
        },

        setupEventListeners: function (auth, dbId) {
            document.getElementById('logoutBtn')?.addEventListener('click', () => {
                if (auth) auth.logout();
                window.location.href = '../Static/login.html';
            });

            document.getElementById('closeModal')?.addEventListener('click', () => {
                document.getElementById('contentModal')?.classList.remove('active');
            });
            document.getElementById('contentModal')?.addEventListener('click', function (e) {
                if (e.target === this) this.classList.remove('active');
            });
        },

        escapeHtml: function (str) {
            if (!str) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }
    };
})();
