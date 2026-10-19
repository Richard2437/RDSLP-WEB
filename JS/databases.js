/* =====================================================
   RDSLP - JavaScript de Bases de Datos
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
            category: 'relacional',
            description: 'Base de datos relacional open source más popular del mundo. Utilizada por gigantes tecnológicos como Meta, WordPress y Twitter.',
            features: ['Motor InnoDB con transacciones ACID', 'Indexación B-Tree y Full-Text', 'Replicación primaria-secundaria', 'Amplio ecosistema y soporte ORM'],
            code: `-- Ejemplo de SQL en MySQL\nCREATE TABLE usuarios (\n    id INT AUTO_INCREMENT PRIMARY KEY,\n    nombre VARCHAR(100) NOT NULL,\n    email VARCHAR(100) UNIQUE NOT NULL,\n    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nINSERT INTO usuarios (nombre, email) VALUES ('Ana Lopez', 'ana@ejemplo.com');\nSELECT * FROM usuarios WHERE email LIKE '%@ejemplo.com';`
        },
        {
            id: 'db-postgresql',
            name: 'PostgreSQL',
            type: 'postgresql',
            category: 'relacional',
            description: 'El motor relacional más avanzado y extensible. Soporte de primera clase para JSONB, extensiones geoespaciales (PostGIS) y concurrencia.',
            features: ['Tipos de datos avanzados (JSONB, Arrays, UUID)', 'Extensiones nativas potentes (PostGIS, pgvector)', 'Aislamiento de transacciones SSI', 'Concurrencia MVCC optimizada'],
            code: `-- Ejemplo en PostgreSQL con JSONB\nCREATE TABLE eventos (\n    id SERIAL PRIMARY KEY,\n    tipo VARCHAR(50),\n    payload JSONB\n);\n\nINSERT INTO eventos (tipo, payload) VALUES ('login', '{"ip": "192.168.1.1", "exito": true}');\nSELECT payload->>'ip' AS ip FROM eventos WHERE payload @> '{"exito": true}';`
        },
        {
            id: 'db-sqlserver',
            name: 'SQL Server',
            type: 'sqlserver',
            category: 'relacional',
            description: 'Solución empresarial líder de Microsoft. Gran integración con el ecosistema .NET, Azure, herramientas BI y seguridad de nivel gubernamental.',
            features: ['T-SQL con capacidades avanzadas', 'Integración nativa con Azure y SSIS', 'Always On Availability Groups', 'Encriptación transparente de datos (TDE)'],
            code: `-- Ejemplo en SQL Server T-SQL\nSELECT TOP 10 \n    c.Nombre,\n    COUNT(o.Id) AS TotalOrdenes,\n    SUM(o.Monto) AS TotalGastado\nFROM Clientes c\nINNER JOIN Ordenes o ON c.Id = o.ClienteId\nGROUP BY c.Nombre\nHAVING SUM(o.Monto) > 1000\nORDER BY TotalGastado DESC;`
        },
        {
            id: 'db-oracle',
            name: 'Oracle DB',
            type: 'oracle',
            category: 'relacional',
            description: 'Líder histórico del mercado corporativo para cargas de trabajo críticas con altísimo volumen transaccional y disponibilidad continua.',
            features: ['Arquitectura Multi-tenant (PDB/CDB)', 'Oracle RAC para clústeres activos', 'PL/SQL altamente optimizado', 'Recuperación de desastres Data Guard'],
            code: `-- Ejemplo en Oracle PL/SQL\nDECLARE\n    v_total NUMBER;\nBEGIN\n    SELECT COUNT(*) INTO v_total FROM empleados WHERE departamento_id = 10;\n    DBMS_OUTPUT.PUT_LINE('Total de empleados en el departamento: ' || v_total);\nEND;`
        }
    ];

    const defaultNoSQLDBs = [
        {
            id: 'db-mongodb',
            name: 'MongoDB',
            type: 'mongodb',
            category: 'norelacional',
            description: 'Base de datos NoSQL líder orientada a documentos JSON/BSON. Proporciona esquemas dinámicos, escalabilidad horizontal y consultas expresivas.',
            features: ['Documentos flexibles BSON', 'Sharding automático y Replica Sets', 'Framework de Agregación ultra potente', 'Búsqueda por texto y geoespacial'],
            code: `// Ejemplo en MongoDB Shell / Mongoose\ndb.usuarios.insertOne({\n    nombre: "Juan Perez",\n    email: "juan@ejemplo.com",\n    intereses: ["Node.js", "Bases de Datos", "Docker"],\n    activo: true\n});\n\ndb.usuarios.find({ intereses: "Node.js" }).pretty();`
        },
        {
            id: 'db-redis',
            name: 'Redis',
            type: 'redis',
            category: 'norelacional',
            description: 'Almacén de datos en memoria ultrarrápido utilizado como base de datos de clave-valor, caché distribuida, colas de mensajes y pub/sub.',
            features: ['Tiempos de respuesta en submilisegundos', 'Estructuras de datos nativas (Hashes, Sets, Lists)', 'Persistencia configurable (RDB y AOF)', 'Mecanismos Pub/Sub y Streams'],
            code: `# Comandos Redis CLI\nSET sesion:usuario_42 "token_jwt_activo" EX 3600\nGET sesion:usuario_42\n\nHSET usuario:42 nombre "Carlos" visitas 15\nHINCRBY usuario:42 visitas 1`
        },
        {
            id: 'db-cassandra',
            name: 'Apache Cassandra',
            type: 'cassandra',
            category: 'norelacional',
            description: 'Base de datos distribuida NoSQL de tipo columna ancha, creada para gestionar cantidades colosales de datos a través de múltiples nodos sin punto único de falla.',
            features: ['Arquitectura descentralizada Masterless', 'Escalabilidad horizontal lineal', 'Escrituras ultrarrápidas a gran escala', 'Lenguaje de consulta CQL similar a SQL'],
            code: `-- Consulta en CQL (Cassandra Query Language)\nCREATE KEYSPACE red_social \nWITH replication = {'class': 'SimpleStrategy', 'replication_factor': 3};\n\nSELECT * FROM red_social.publicaciones WHERE usuario_id = 998 LIMIT 20;`
        },
        {
            id: 'db-neo4j',
            name: 'Neo4j',
            type: 'neo4j',
            category: 'norelacional',
            description: 'Base de datos de grafos nativa diseñada para modelar y consultar relaciones complejas y altamente conectadas con su lenguaje Cypher.',
            features: ['Almacenamiento y procesamiento nativo de grafos', 'Lenguaje declarativo Cypher', 'Ideal para redes sociales y motores de recomendación', 'Detección de fraude y grafos de conocimiento'],
            code: `// Consulta Cypher en Neo4j\nMATCH (u:Usuario {nombre: "Laura"})-[:SIGUE]->(amigo:Usuario)\nRETURN amigo.nombre AS Siguiendo;\n\n// Encontrar amigos de amigos\nMATCH (u:Usuario {nombre: "Laura"})-[:SIGUE*2]-(sugerencia:Usuario)\nRETURN sugerencia.nombre, count(*) ORDER BY count(*) DESC;`
        }
    ];

    init();

    function init() {
        checkAuth();
        loadUserData();
        loadDatabaseContent(currentTab);
        setupEventListeners();
    }

    function checkAuth() {
        if (auth && !auth.isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }
        if (auth) currentUser = auth.getCurrentUser();
    }

    function loadUserData() {
        if (!currentUser) return;
        const userAvatar = document.getElementById('userAvatar');
        const userName = document.getElementById('userName');
        if (userAvatar) userAvatar.textContent = currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U';
        if (userName) userName.textContent = currentUser.name || 'Usuario';
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

    function setupEventListeners() {
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            if (auth) auth.logout();
            window.location.href = 'login.html';
        });

        document.querySelectorAll('.db-tab').forEach(tab => {
            tab.addEventListener('click', function () {
                document.querySelectorAll('.db-tab').forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                currentTab = this.dataset.tab;
                loadDatabaseContent(currentTab);
            });
        });

        document.getElementById('closeModal')?.addEventListener('click', closeModal);
        document.getElementById('contentModal')?.addEventListener('click', function (e) {
            if (e.target === this) closeModal();
        });
    }

    function loadDatabaseContent(tab) {
        const container = document.getElementById('dbContent');
        if (!container) return;

        const customDBs = getCustomDatabases();

        if (tab === 'relacional') {
            const relacionales = [...defaultRelationalDBs, ...customDBs.filter(d => d.category === 'relacional')];
            container.innerHTML = `
                <div class="db-info-card">
                    <h3>Bases de Datos Relacionales (SQL)</h3>
                    <p>Las bases de datos relacionales organizan la información en tablas con filas y columnas fuertemente estructuradas. Utilizan SQL estándar para manipulación de esquemas y garantizan integridad transaccional mediante principios ACID.</p>
                    
                    <h4>Bases de Datos disponibles (${relacionales.length}):</h4>
                    <div class="db-grid">
                        ${relacionales.map(db => createDBCard(db)).join('')}
                    </div>
                </div>

                <div class="db-info-card">
                    <h3>Ejemplo de SQL Estándar</h3>
                    <p>Estructura básica para definición y consultas analíticas:</p>
                    <div class="code-example">
                        <pre><span class="comment">-- Creación de tabla con claves foráneas</span>
CREATE TABLE pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    monto DECIMAL(10, 2) NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

<span class="comment">-- Consulta con JOIN y agregación</span>
SELECT u.nombre, COUNT(p.id) AS total_pedidos, SUM(p.monto) AS gasto_total
FROM usuarios u
LEFT JOIN pedidos p ON u.id = p.usuario_id
GROUP BY u.id, u.nombre
ORDER BY gasto_total DESC;</pre>
                    </div>
                </div>
            `;
            setupRatingListeners();

        } else if (tab === 'norelacional') {
            const norelacionales = [...defaultNoSQLDBs, ...customDBs.filter(d => d.category === 'norelacional')];
            container.innerHTML = `
                <div class="db-info-card">
                    <h3>Bases de Datos No Relacionales (NoSQL)</h3>
                    <p>Diseñadas para modelos de datos específicos (documentos, clave-valor, grafos, columnas) con esquemas flexibles y alta tolerancia a la partición horizontal.</p>
                    
                    <h4>Bases de Datos disponibles (${norelacionales.length}):</h4>
                    <div class="db-grid">
                        ${norelacionales.map(db => createDBCard(db)).join('')}
                    </div>
                </div>

                <div class="db-info-card">
                    <h3>Ejemplo de Operaciones Documentales (MongoDB)</h3>
                    <div class="code-example">
                        <pre><span class="comment">// Consulta avanzada con pipeline de agregación</span>
db.pedidos.aggregate([
    { $match: { estado: "completado" } },
    { $group: { _id: "$clienteId", total: { $sum: "$monto" }, cantidad: { $sum: 1 } } },
    { $sort: { total: -1 } },
    { $limit: 5 }
]);</pre>
                    </div>
                </div>
            `;
            setupRatingListeners();

        } else if (tab === 'ejercicios') {
            const ejercicios = [
                { id: 'ej-db-1', title: 'Diseño de BD para Biblioteca', level: 'beginner', description: 'Diseña un esquema relacional con tablas para libros, autores, préstamos y lectores.', tech: 'SQL' },
                { id: 'ej-db-2', title: 'Sistema de E-commerce con Carrito', level: 'intermediate', description: 'Estructura productos, inventario, usuarios y transacciones seguras.', tech: 'SQL' },
                { id: 'ej-db-3', title: 'Muro Social con MongoDB', level: 'intermediate', description: 'Modela documentos de publicaciones, comentarios anidados y reacciones.', tech: 'MongoDB' },
                { id: 'ej-db-4', title: 'Caché de Sesiones con Redis', level: 'beginner', description: 'Configura claves temporales con TTL para control de tokens de acceso.', tech: 'Redis' },
                { id: 'ej-db-5', title: 'Optimización de Índices y Queries', level: 'advanced', description: 'Analiza planes de ejecución con EXPLAIN y crea índices compuestos.', tech: 'SQL' }
            ];

            container.innerHTML = `
                <div class="db-info-card">
                    <h3>Ejercicios Prácticos de Bases de Datos</h3>
                    <p>Pon a prueba tus habilidades de modelado, consultas complejas y optimización:</p>
                </div>
                <div class="db-grid">
                    ${ejercicios.map(ej => createExerciseCard(ej)).join('')}
                </div>
            `;
            setupRatingListeners();
        }
    }

    function createDBCard(db) {
        const colors = {
            'mysql': '#4479a1',
            'postgresql': '#336791',
            'sqlserver': '#cc2927',
            'oracle': '#f80000',
            'mongodb': '#47a248',
            'redis': '#dc382d',
            'cassandra': '#1287b1',
            'neo4j': '#008cc1',
            'custom': '#6366f1'
        };

        const rating = content ? content.getAverageRating(db.id) : { average: '5.0', count: 1 };
        const userRating = (content && currentUser) ? content.getUserRating(db.id, currentUser.id) : 0;
        const abbr = db.name.substring(0, 2).toUpperCase();

        let starsHtml = '<div class="stars" style="display:inline-flex; gap:3px;">';
        for (let i = 1; i <= 5; i++) {
            starsHtml += `
                <svg class="star-rating-db" data-rating="${i}" data-content="${db.id}" width="15" height="15" viewBox="0 0 24 24" fill="${i <= userRating ? '#f59e0b' : 'none'}" stroke="#f59e0b" stroke-width="2" style="cursor:pointer;">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
            `;
        }
        starsHtml += '</div>';

        return `
            <div class="db-card" data-id="${db.id}" style="display: flex; flex-direction: column; justify-content: space-between; text-align: left; padding: 22px;">
                <div>
                    <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 12px;">
                        <div class="db-icon" style="background: ${colors[db.type] || colors.custom}; margin: 0; width: 48px; height: 48px; border-radius: 12px; font-size: 16px;">${abbr}</div>
                        <div>
                            <h4 style="margin: 0; font-size: 17px; color: var(--text-primary);">${escapeHtml(db.name)}</h4>
                            <span style="font-size: 12px; color: var(--text-muted);">${db.category === 'relacional' ? 'Relacional (SQL)' : 'NoSQL'}</span>
                        </div>
                    </div>
                    <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 14px;">${escapeHtml(db.description)}</p>
                </div>
                <div style="border-top: 1px solid var(--border-color); padding-top: 12px; margin-top: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        ${starsHtml}
                        <span style="font-size: 12px; color: var(--text-muted); font-weight: 500;">${rating.average} (${rating.count})</span>
                    </div>
                    <button class="logica-card-btn" onclick="window.openDatabaseModal('${db.id}')" style="width: 100%; padding: 10px; background: var(--bg-input); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-weight: 600; cursor: pointer; transition: all 0.2s;">
                        Ver detalles y consultas
                    </button>
                </div>
            </div>
        `;
    }

    function createExerciseCard(ej) {
        const levelNames = { 'beginner': 'Básico', 'intermediate': 'Intermedio', 'advanced': 'Avanzado' };
        const rating = content ? content.getAverageRating(ej.id) : { average: '5.0', count: 1 };

        return `
            <div class="exercise-card" data-id="${ej.id}">
                <div class="exercise-header">
                    <span class="badge badge-${ej.level}">${levelNames[ej.level]}</span>
                    <span class="exercise-tech">${ej.tech}</span>
                </div>
                <h4>${ej.title}</h4>
                <p>${ej.description}</p>
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                    ${createStarsHTML(ej.id, rating)}
                    <span style="font-size: 12px; color: var(--text-muted);">${rating.average}</span>
                </div>
                <button class="logica-card-btn" onclick="window.openExerciseModal('${ej.id}', '${ej.title}')">Ver ejercicio</button>
            </div>
        `;
    }

    function createStarsHTML(contentId, rating) {
        const userRating = (currentUser && content) ? content.getUserRating(contentId, currentUser.id) : 0;
        let html = '<div class="stars" style="display: flex; gap: 2px;">';
        for (let i = 1; i <= 5; i++) {
            html += `<svg class="star-rating-db" style="cursor: pointer;" data-rating="${i}" data-content="${contentId}" width="14" height="14" viewBox="0 0 24 24" fill="${i <= userRating ? '#f59e0b' : 'none'}" stroke="#f59e0b" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
        }
        html += '</div>';
        return html;
    }

    function setupRatingListeners() {
        document.querySelectorAll('.star-rating-db').forEach(star => {
            star.addEventListener('click', function (e) {
                e.stopPropagation();
                if (!currentUser) {
                    alert('Debes iniciar sesión para calificar');
                    return;
                }
                const contentId = this.dataset.content;
                const rating = parseInt(this.dataset.rating, 10);
                if (content) {
                    content.rateContent(contentId, rating, currentUser.id);
                    loadDatabaseContent(currentTab);
                }
            });
        });
    }

    // Modal Subir Base de Datos (Igual que en libros)
    window.abrirModalSubirDB = function () {
        if (!currentUser) {
            alert('Debes iniciar sesión para subir una base de datos');
            return;
        }

        const modal = document.getElementById('contentModal');
        document.getElementById('modalTitle').textContent = 'Subir Nueva Base de Datos / Recurso';
        document.getElementById('modalBody').innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 14px;">
                <div>
                    <label style="font-size: 13px; color: var(--text-secondary); display: block; margin-bottom: 6px;">Nombre de la Base de Datos / Motor *</label>
                    <input type="text" id="nuevaDBNombre" placeholder="Ej: SQLite, MariaDB, Supabase, Couchbase..." style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-input); color: var(--text-primary); box-sizing: border-box;">
                </div>
                <div>
                    <label style="font-size: 13px; color: var(--text-secondary); display: block; margin-bottom: 6px;">Categoría *</label>
                    <select id="nuevaDBCategoria" style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-input); color: var(--text-primary); box-sizing: border-box;">
                        <option value="relacional">Relacional (SQL)</option>
                        <option value="norelacional">No Relacional (NoSQL)</option>
                    </select>
                </div>
                <div>
                    <label style="font-size: 13px; color: var(--text-secondary); display: block; margin-bottom: 6px;">Descripción y Características *</label>
                    <textarea id="nuevaDBDesc" placeholder="Describe para qué casos de uso es ideal..." style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-input); color: var(--text-primary); height: 80px; box-sizing: border-box;"></textarea>
                </div>
                <div>
                    <label style="font-size: 13px; color: var(--text-secondary); display: block; margin-bottom: 6px;">Ejemplo de Consulta o Código</label>
                    <textarea id="nuevaDBCodigo" placeholder="// Pega un query o ejemplo de conexión..." style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-input); color: var(--text-primary); height: 90px; font-family: monospace; box-sizing: border-box;"></textarea>
                </div>
                <button type="button" onclick="window.guardarBaseDeDatos()" style="background: var(--accent-primary); color: white; padding: 12px; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; margin-top: 6px;">
                    Guardar Base de Datos
                </button>
            </div>
        `;
        modal.classList.add('active');
    };

    window.guardarBaseDeDatos = function () {
        const nombre = document.getElementById('nuevaDBNombre')?.value.trim();
        const categoria = document.getElementById('nuevaDBCategoria')?.value;
        const desc = document.getElementById('nuevaDBDesc')?.value.trim();
        const codigo = document.getElementById('nuevaDBCodigo')?.value.trim();

        if (!nombre || !desc) {
            alert('El nombre y la descripción son obligatorios.');
            return;
        }

        const nuevaDB = {
            id: 'db-' + nombre.toLowerCase().replace(/[^a-z0-9]/g, ''),
            name: nombre,
            type: 'custom',
            category: categoria,
            description: desc,
            code: codigo || `-- Ejemplo en ${nombre}\nSELECT * FROM datos;`,
            author: currentUser.name,
            createdAt: new Date().toISOString()
        };

        saveCustomDatabase(nuevaDB);
        closeModal();
        currentTab = categoria;
        document.querySelectorAll('.db-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === categoria);
        });
        loadDatabaseContent(categoria);
        alert(`¡Base de Datos "${nombre}" guardada con éxito!`);
    };

    // Modal de Detalle de Base de Datos
    window.openDatabaseModal = function (dbId) {
        const allDBs = [...defaultRelationalDBs, ...defaultNoSQLDBs, ...getCustomDatabases()];
        const db = allDBs.find(d => d.id === dbId);
        if (!db) return;

        const modal = document.getElementById('contentModal');
        document.getElementById('modalTitle').textContent = `${db.name} - Detalles y Consultas`;
        document.getElementById('modalBody').innerHTML = `
            <div style="margin-bottom: 20px;">
                <p style="font-size: 14px; color: var(--text-secondary); line-height: 1.6;">${escapeHtml(db.description)}</p>
            </div>
            ${db.features ? `
                <h4 style="margin-bottom: 10px; font-size: 15px;">Características clave:</h4>
                <ul style="padding-left: 20px; color: var(--text-secondary); font-size: 13px; line-height: 1.8; margin-bottom: 20px;">
                    ${db.features.map(f => `<li>${escapeHtml(f)}</li>`).join('')}
                </ul>
            ` : ''}
            ${db.code ? `
                <h4 style="margin-bottom: 10px; font-size: 15px;">Ejemplo de uso:</h4>
                <div style="background: #111827; border: 1px solid var(--border-color); border-radius: 8px; padding: 14px; margin-bottom: 20px; overflow-x: auto;">
                    <pre style="margin: 0; font-family: monospace; font-size: 13px; color: #e5e7eb;">${escapeHtml(db.code)}</pre>
                </div>
            ` : ''}
            ${getCommentsSection(db.id)}
        `;
        modal.classList.add('active');
    };

    window.openExerciseModal = function (id, title) {
        const modal = document.getElementById('contentModal');
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalBody').innerHTML = `
            <div style="margin-bottom: 20px;">
                <p>Práctica tus conocimientos de bases de datos con este ejercicio guiado.</p>
            </div>
            <h4 style="margin-bottom: 12px;">Instrucciones:</h4>
            <ol style="padding-left: 20px; color: var(--text-secondary); margin-bottom: 20px; line-height: 1.8;">
                <li>Lee el enunciado completo del ejercicio</li>
                <li>Diseña tu modelo entidad-relación o esquema de colecciones</li>
                <li>Implementa las consultas de creación y manipulación</li>
                <li>Prueba con datos de prueba realistas</li>
                <li>Comparte tu solución en los comentarios</li>
            </ol>
            ${getCommentsSection(id)}
        `;
        modal.classList.add('active');
    };

    function getCommentsSection(contentId) {
        const comments = content ? content.getComments(contentId) : [];
        return `
            <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--border-color);">
                <h4 style="margin-bottom: 14px; font-size: 15px;">Comentarios y Soluciones (${comments.length})</h4>
                <div style="display: flex; gap: 10px; margin-bottom: 16px;">
                    <input type="text" id="newComment" placeholder="Comparte una consulta, duda o solución..." style="flex: 1; padding: 10px 14px; background: var(--bg-input); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 13px;">
                    <button onclick="window.addCommentDB('${contentId}')" style="padding: 10px 20px; background: var(--accent-primary); border: none; border-radius: 8px; color: white; font-weight: 600; cursor: pointer;">Enviar</button>
                </div>
                <div id="commentsList">
                    ${comments.length === 0
                        ? '<p style="color: var(--text-muted); font-size: 13px;">Sé el primero en compartir una consulta o solución.</p>'
                        : comments.map(c => `
                            <div style="background: var(--bg-input); border-radius: 8px; padding: 12px; margin-bottom: 8px; border: 1px solid var(--border-color);">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                                    <strong style="font-size: 13px; color: var(--text-primary);">${escapeHtml(c.authorName)}</strong>
                                    <span style="font-size: 11px; color: var(--text-muted);">${new Date(c.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p style="font-size: 13px; color: var(--text-secondary); margin: 0; line-height: 1.4;">${escapeHtml(c.text)}</p>
                            </div>
                        `).join('')
                    }
                </div>
            </div>
        `;
    }

    window.addCommentDB = function (contentId) {
        const input = document.getElementById('newComment');
        if (!input || !input.value.trim()) return;
        if (!currentUser) {
            alert('Debes iniciar sesión para comentar.');
            return;
        }
        if (content) {
            content.addComment(contentId, input.value.trim(), currentUser.id, currentUser.name);
            input.value = '';
            window.openDatabaseModal(contentId);
        }
    };

    function closeModal() {
        document.getElementById('contentModal')?.classList.remove('active');
    }

    function escapeHtml(text) {
        if (!text) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
});
