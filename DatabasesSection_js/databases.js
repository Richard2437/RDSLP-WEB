/* =====================================================
   RDSLP - JavaScript de Catálogo de Bases de Datos
   DatabasesSection_js/databases.js
===================================================== */

document.addEventListener('DOMContentLoaded', function () {
    const auth = window.authManager;
    const content = window.contentManager;
    let currentUser = null;
    let currentTab = 'relacional';

    const defaultRelationalDBs = [
        {
            id: 'db-mysql',
            name: 'MySQL',
            type: 'mysql',
            abbr: 'MY',
            file: 'mysql.html',
            category: 'relacional',
            color: '#4479a1',
            tagline: 'El motor relacional open source más utilizado del mundo',
            description: 'Base de datos relacional robusta con soporte ACID mediante InnoDB, replicación primaria-secundaria e indexación avanzada.',
            tags: ['SQL', 'InnoDB', 'ACID', 'Web']
        },
        {
            id: 'db-postgresql',
            name: 'PostgreSQL',
            type: 'postgresql',
            abbr: 'PG',
            file: 'postgresql.html',
            category: 'relacional',
            color: '#336791',
            tagline: 'La base de datos relacional de código abierto más avanzada',
            description: 'Soporte nativo para JSONB, extensiones potentes como PostGIS y pgvector, concurrencia MVCC e integridad transaccional estricta.',
            tags: ['SQL', 'JSONB', 'PostGIS', 'Extensible']
        },
        {
            id: 'db-sqlserver',
            name: 'SQL Server',
            type: 'sqlserver',
            abbr: 'MS',
            file: 'sqlserver.html',
            category: 'relacional',
            color: '#cc2927',
            tagline: 'Plataforma empresarial integral de Microsoft con Azure',
            description: 'Excelente para el ecosistema .NET con T-SQL, grupos de disponibilidad Always On, cifrado transparente de datos y Business Intelligence.',
            tags: ['T-SQL', 'Enterprise', 'Azure', '.NET']
        },
        {
            id: 'db-oracle',
            name: 'Oracle DB',
            type: 'oracle',
            abbr: 'OR',
            file: 'oracle.html',
            category: 'relacional',
            color: '#f80000',
            tagline: 'Líder en infraestructura de misión crítica corporativa',
            description: 'Arquitectura multitenant, Oracle RAC para clústeres de alta disponibilidad, PL/SQL de máximo desempeño y resiliencia bancaria.',
            tags: ['PL/SQL', 'Banking', 'Clustering', 'Corporativo']
        }
    ];

    const defaultNoSQLDBs = [
        {
            id: 'db-mongodb',
            name: 'MongoDB',
            type: 'mongodb',
            abbr: 'MG',
            file: 'mongodb.html',
            category: 'norelacional',
            color: '#47a248',
            tagline: 'La base de datos de documentos NoSQL por excelencia',
            description: 'Documentos flexibles BSON/JSON, sharding automático para escalabilidad horizontal y framework de agregación expresivo.',
            tags: ['NoSQL', 'Documentos', 'BSON', 'Escalable']
        },
        {
            id: 'db-redis',
            name: 'Redis',
            type: 'redis',
            abbr: 'RD',
            file: 'redis.html',
            category: 'norelacional',
            color: '#dc382d',
            tagline: 'Almacenamiento en memoria ultrarrápido y caché distribuida',
            description: 'Latencia en submilisegundos, estructuras de datos en memoria (Strings, Hashes, Lists, Sets), pub/sub y colas de alta velocidad.',
            tags: ['En Memoria', 'Caché', 'Clave-Valor', 'Rápido']
        },
        {
            id: 'db-cassandra',
            name: 'Cassandra',
            type: 'cassandra',
            abbr: 'CS',
            file: 'cassandra.html',
            category: 'norelacional',
            color: '#1287b1',
            tagline: 'Base de datos distribuida de columnas anchas para Big Data',
            description: 'Arquitectura sin punto único de falla (masterless), escritura ultrarrápida a escala planetaria y consultas mediante CQL.',
            tags: ['Big Data', 'Distribuida', 'Columnar', 'High Write']
        },
        {
            id: 'db-neo4j',
            name: 'Neo4j',
            type: 'neo4j',
            abbr: 'N4',
            file: 'neo4j.html',
            category: 'norelacional',
            color: '#008cc1',
            tagline: 'Base de datos de grafos nativa para relaciones complejas',
            description: 'Modelado directo de nodos, relaciones y propiedades, consultable con el lenguaje Cypher. Ideal para redes sociales y recomendaciones.',
            tags: ['Grafos', 'Cypher', 'Redes', 'Relaciones']
        }
    ];

    init();

    function init() {
        checkAuth();
        loadUserData();
        loadDatabases();
        setupEventListeners();
    }

    function checkAuth() {
        if (auth && !auth.isAuthenticated()) {
            window.location.href = '../Static/login.html';
            return;
        }
        if (auth) currentUser = auth.getCurrentUser();
    }

    function loadUserData() {
        if (!currentUser) return;
        const avatar = document.getElementById('userAvatar');
        const name = document.getElementById('userName');
        if (avatar) avatar.textContent = currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U';
        if (name) name.textContent = currentUser.name || 'Usuario';
    }

    function getCustomDatabases() {
        try {
            return JSON.parse(localStorage.getItem('rdslp_custom_databases') || '[]');
        } catch (e) {
            return [];
        }
    }

    function saveCustomDatabase(dbObj) {
        const list = getCustomDatabases();
        list.push(dbObj);
        localStorage.setItem('rdslp_custom_databases', JSON.stringify(list));
    }

    async function getAllDatabases() {
        if (window.apiClient) {
            const apiDBs = await window.apiClient.getDatabases(currentTab);
            if (apiDBs && apiDBs.length > 0) {
                const custom = getCustomDatabases();
                // Combinar los datos de MySQL con los locales
                const combinedMap = new Map();
                apiDBs.forEach(d => combinedMap.set(d.id, d));
                custom.forEach(d => { if (!combinedMap.has(d.id)) combinedMap.set(d.id, d); });
                return Array.from(combinedMap.values());
            }
        }
        const custom = getCustomDatabases();
        return [...defaultRelationalDBs, ...defaultNoSQLDBs, ...custom];
    }

    async function loadDatabases(filterText = '') {
        const grid = document.getElementById('databasesGrid');
        if (!grid) return;

        const all = await getAllDatabases();
        const tabFiltered = currentTab === 'todos' ? all : all.filter(d => d.category === currentTab);

        const query = filterText.toLowerCase();
        const searchFiltered = tabFiltered.filter(d => {
            return d.name.toLowerCase().includes(query) ||
                   d.description.toLowerCase().includes(query) ||
                   (d.tags && d.tags.some(t => t.toLowerCase().includes(query)));
        });

        if (searchFiltered.length === 0) {
            grid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1; text-align:center; padding: 40px; color: var(--text-muted); background: var(--bg-card); border-radius: 12px;">No se encontraron bases de datos en esta categoría.</div>`;
            return;
        }

        grid.innerHTML = searchFiltered.map(db => renderDBCard(db)).join('');
        setupStarEvents();
    }

    function renderDBCard(db) {
        const rating = content ? content.getAverageRating(db.id) : { average: '5.0', count: 1 };
        const userRating = (content && currentUser) ? content.getUserRating(db.id, currentUser.id) : 0;
        const targetUrl = db.file || `custom.html?id=${encodeURIComponent(db.id)}`;

        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            const isFilled = i <= userRating;
            starsHtml += `
                <svg class="star-db" data-rating="${i}" data-db="${db.id}" width="15" height="15" viewBox="0 0 24 24" fill="${isFilled ? '#f59e0b' : 'none'}" stroke="#f59e0b" stroke-width="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
            `;
        }

        const tagsHtml = (db.tags || []).map(t => `<span class="db-hero-tag" style="background:var(--bg-input); border:1px solid var(--border-color);">${escapeHtml(t)}</span>`).join('');
        const iconStyle = db.color ? `style="background: ${db.color};"` : '';

        return `
            <div class="db-card" data-id="${db.id}">
                <div>
                    <div class="db-card-top">
                        <div class="db-icon ${db.type || 'custom'}" ${iconStyle}>${escapeHtml(db.abbr || db.name.substring(0, 2).toUpperCase())}</div>
                        <div class="db-card-title">
                            <h4>${escapeHtml(db.name)}</h4>
                            <span>${db.category === 'relacional' ? 'Relacional (SQL)' : 'No Relacional (NoSQL)'}</span>
                        </div>
                    </div>
                    <div class="db-card-body">
                        <p>${escapeHtml(db.description)}</p>
                        <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:14px;">${tagsHtml}</div>
                    </div>
                </div>
                <div class="db-card-footer">
                    <div class="db-rating-row">
                        <div class="stars-container">${starsHtml}</div>
                        <span style="font-size:12px; color:var(--text-muted); font-weight:500;">${rating.average} (${rating.count})</span>
                    </div>
                    <a href="${targetUrl}" class="db-btn-explore">Explorar ${escapeHtml(db.name)} &rarr;</a>
                </div>
            </div>
        `;
    }

    function setupStarEvents() {
        document.querySelectorAll('.star-db').forEach(star => {
            star.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                if (!currentUser) {
                    alert('Debes iniciar sesión para calificar');
                    return;
                }
                const dbId = this.dataset.db;
                const ratingVal = parseInt(this.dataset.rating, 10);
                if (content) {
                    content.rateContent(dbId, ratingVal, currentUser.id);
                    loadDatabases(document.getElementById('buscarDatabase')?.value || '');
                }
            });
        });
    }

    function setupEventListeners() {
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            if (auth) auth.logout();
            window.location.href = '../Static/login.html';
        });

        // Tabs
        document.querySelectorAll('.db-tab').forEach(tab => {
            tab.addEventListener('click', function () {
                document.querySelectorAll('.db-tab').forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                currentTab = this.dataset.tab;
                loadDatabases(document.getElementById('buscarDatabase')?.value || '');
            });
        });

        // Búsqueda
        document.getElementById('buscarDatabase')?.addEventListener('input', function () {
            loadDatabases(this.value);
        });

        // Botón Subir Base de Datos
        document.getElementById('btnSubirDatabase')?.addEventListener('click', () => {
            abrirModalSubirDatabase();
        });

        // Modal
        document.getElementById('closeModal')?.addEventListener('click', cerrarModal);
        document.getElementById('contentModal')?.addEventListener('click', function (e) {
            if (e.target === this) cerrarModal();
        });
    }

    function abrirModalSubirDatabase() {
        if (!currentUser) {
            alert('Debes iniciar sesión para subir una base de datos');
            return;
        }

        const modal = document.getElementById('contentModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');

        modalTitle.textContent = 'Subir Nueva Base de Datos / Motor';
        modalBody.innerHTML = `
            <form id="formNuevaDB" onsubmit="return false;">
                <div class="form-group">
                    <label class="form-label">Nombre del Motor de Base de Datos *</label>
                    <input type="text" id="nuevaDBNombre" class="form-input" placeholder="Ej: SQLite, MariaDB, Supabase, Couchbase..." required>
                </div>
                <div class="form-group">
                    <label class="form-label">Siglas / Iniciales (2-3 letras) *</label>
                    <input type="text" id="nuevaDBAbbr" class="form-input" placeholder="Ej: SL, MB, SB, CB" maxlength="4" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Tipo / Categoría *</label>
                    <select id="nuevaDBCategoria" class="form-select">
                        <option value="relacional">Relacional (SQL)</option>
                        <option value="norelacional">No Relacional (NoSQL)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Color de Marca Representativo</label>
                    <input type="color" id="nuevaDBColor" class="form-input" value="#6366f1">
                </div>
                <div class="form-group">
                    <label class="form-label">Etiquetas Clave (separadas por coma)</label>
                    <input type="text" id="nuevaDBTags" class="form-input" placeholder="Ej: Serverless, Cloud, Realtime, Open Source">
                </div>
                <div class="form-group">
                    <label class="form-label">Descripción General *</label>
                    <textarea id="nuevaDBDesc" class="form-textarea" placeholder="Describe para qué casos de uso es ideal..." required></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Ejemplo de Consulta o Código</label>
                    <textarea id="nuevaDBCodigo" class="form-textarea" placeholder="-- Pega un query o ejemplo de uso..." style="font-family: monospace;"></textarea>
                </div>
                <button type="button" id="btnGuardarDBModal" class="btn-submit-modal">Publicar Base de Datos</button>
            </form>
        `;

        document.getElementById('btnGuardarDBModal')?.addEventListener('click', guardarNuevaDatabase);
        modal.classList.add('active');
    }

    function guardarNuevaDatabase() {
        const nombre = document.getElementById('nuevaDBNombre').value.trim();
        const abbr = document.getElementById('nuevaDBAbbr').value.trim().toUpperCase();
        const categoria = document.getElementById('nuevaDBCategoria').value;
        const color = document.getElementById('nuevaDBColor').value;
        const tagsInput = document.getElementById('nuevaDBTags').value.trim();
        const desc = document.getElementById('nuevaDBDesc').value.trim();
        const codigo = document.getElementById('nuevaDBCodigo').value.trim();

        if (!nombre || !abbr || !desc) {
            alert('Por favor completa todos los campos requeridos (*)');
            return;
        }

        const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(Boolean) : ['Base de Datos'];
        const dbId = 'db-' + nombre.toLowerCase().replace(/[^a-z0-9]/g, '');

        const newDB = {
            id: dbId,
            name: nombre,
            abbr: abbr,
            type: 'custom',
            category: categoria,
            color: color,
            tagline: `Motor de Base de Datos ${nombre}`,
            description: desc,
            features: tags,
            tags: tags,
            code: codigo || `-- Consulta de ejemplo en ${nombre}\nSELECT * FROM datos;`,
            author: currentUser.name,
            createdAt: new Date().toISOString()
        };

        // Guardar en MySQL via API
        if (window.apiClient) {
            window.apiClient.createDatabase(newDB);
        }

        // Guardar detalles en localStorage para su sección personalizada
        localStorage.setItem('rdslp_dbdetail_' + dbId, JSON.stringify(newDB));
        saveCustomDatabase(newDB);
        cerrarModal();
        currentTab = categoria;
        document.querySelectorAll('.db-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === categoria);
        });
        loadDatabases();
        alert(`¡Base de Datos "${nombre}" publicada con éxito! Ya puedes explorarla y subir recursos.`);
    }

    function cerrarModal() {
        document.getElementById('contentModal')?.classList.remove('active');
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
});
