/* =====================================================
   RDSLP - JavaScript del Dashboard
   Red Social de Lenguajes de Programación
===================================================== */

document.addEventListener('DOMContentLoaded', function () {
    // Verificar que auth.js esté cargado
    if (typeof AuthManager === 'undefined') {
        console.error('auth.js debe cargarse antes de dashboard.js');
        return;
    }

    // Elementos del DOM
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const navLinks = document.querySelectorAll('.nav-link');
    const contentSections = document.querySelectorAll('.content-section');
    const pageTitle = document.getElementById('pageTitle');
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const userRoleBadge = document.getElementById('userRoleBadge');
    const quickCards = document.querySelectorAll('.quick-card');
    const settingsForm = document.getElementById('settingsForm');
    const cancelChanges = document.getElementById('cancelChanges');
    const settingsMessage = document.getElementById('settingsMessage');
    const adminNavItem = document.getElementById('adminNavItem');

    // Managers
    const auth = window.authManager;
    const content = window.contentManager;
    const community = window.communityManager;

    // Usuario actual
    let currentUser = null;

    // Inicializar
    init();

    function init() {
        checkAuth();
        loadUserData();
        setupEventListeners();
        loadContent();
        updateProfileSection();
        setupRoleBasedUI();

        // Escuchar actualización de usuario en vivo (solo si hay cambios reales para evitar parpadeos)
        const handleUserUpdate = (e) => {
            const updated = e.detail || auth.getCurrentUser();
            if (updated && currentUser && updated.role === currentUser.role && updated.name === currentUser.name && updated.id === currentUser.id) {
                return;
            }
            currentUser = updated;
            loadUserData();
            setupRoleBasedUI();
        };
        window.addEventListener('userSynced', handleUserUpdate);
        window.addEventListener('rdslp_user_updated', handleUserUpdate);

        // Revisar si la URL trae hash (ej: dashboard.html#admin)
        const checkHash = () => {
            const h = window.location.hash.replace('#', '');
            if (h) navigateTo(h);
        };
        checkHash();
        window.addEventListener('hashchange', checkHash);
    }

    // Verificar autenticación
    function checkAuth() {
        if (!auth.isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }
        currentUser = auth.getCurrentUser();
    }

    // Cargar datos del usuario en la UI
    function loadUserData() {
        if (!currentUser) return;

        const initial = currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U';
        if (userAvatar && userAvatar.textContent !== initial) userAvatar.textContent = initial;
        if (userName && userName.textContent !== currentUser.name) userName.textContent = currentUser.name || 'Usuario';

        // Badge de rol coordinado en mayúsculas (idéntico a auth.js para cero saltos)
        const roleNames = {
            'admin': 'ADMINISTRADOR',
            'moderator': 'MODERADOR',
            'user': 'USUARIO'
        };
        const roleText = roleNames[currentUser.role] || 'USUARIO';
        if (userRoleBadge) {
            if (userRoleBadge.textContent !== roleText) userRoleBadge.textContent = roleText;
            userRoleBadge.className = 'user-role-badge ' + (currentUser.role || 'user');
        }
    }

    // Helper robusto para validar permisos de administrador (soporta 'admin', 'administrador', mayúsculas y fallback de sesión)
    function checkIsAdmin() {
        let u = currentUser;
        if (!u && auth && auth.getCurrentUser) {
            u = auth.getCurrentUser();
        }
        if (!u) {
            try {
                const raw = localStorage.getItem('rdslp_user') || sessionStorage.getItem('rdslp_user');
                if (raw) u = JSON.parse(raw);
            } catch (e) {}
        }
        if (!u) return false;
        currentUser = u;
        const role = String(u.role || u.rol || '').toLowerCase().trim();
        const email = String(u.email || '').toLowerCase().trim();
        return role === 'admin' || role === 'administrador' || email === 'richard@gmail.com' || email === 'admin@rdslp.com' || email.includes('admin');
    }

    // Configurar UI basada en rol
    function setupRoleBasedUI() {
        const isAdmin = checkIsAdmin();
        if (adminNavItem) {
            adminNavItem.style.display = isAdmin ? 'block' : 'none';
        }
    }

    // Configurar event listeners
    function setupEventListeners() {
        // Toggle sidebar (en desktop colapsa, en móvil cierra)
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                if (window.innerWidth <= 900) {
                    if (typeof window.toggleMobileSidebar === 'function') {
                        window.toggleMobileSidebar(false);
                    } else {
                        sidebar.classList.remove('mobile-open');
                    }
                } else {
                    sidebar.classList.toggle('collapsed');
                }
            });
        }

        // Mobile menu (asigna onclick coordinado con auth.js para evitar dobles eventos)
        if (mobileMenuBtn) {
            mobileMenuBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (typeof window.toggleMobileSidebar === 'function') {
                    window.toggleMobileSidebar();
                } else {
                    sidebar.classList.toggle('mobile-open');
                }
            };
        }

        // Cerrar sidebar al hacer clic fuera en mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 900) {
                if (mobileMenuBtn && mobileMenuBtn.contains(e.target)) return;
                if (!sidebar.contains(e.target)) {
                    if (typeof window.toggleMobileSidebar === 'function') {
                        window.toggleMobileSidebar(false);
                    } else {
                        sidebar.classList.remove('mobile-open');
                    }
                }
            }
        });

        // Navegación
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const section = link.dataset.section;
                if (section) {
                    e.preventDefault();
                    navigateTo(section);
                }

                if (window.innerWidth <= 900) {
                    if (typeof window.toggleMobileSidebar === 'function') {
                        window.toggleMobileSidebar(false);
                    } else {
                        sidebar.classList.remove('mobile-open');
                    }
                }
            });
        });

        // Quick cards
        quickCards.forEach(card => {
            card.addEventListener('click', () => {
                const section = card.dataset.go;
                if (section) navigateTo(section);
            });
        });

        // Logout
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (window.rdslpSupabase) {
                    window.rdslpSupabase.signOut();
                } else if (auth) {
                    auth.logout();
                } else {
                    localStorage.removeItem('rdslp_user');
                    sessionStorage.removeItem('rdslp_user');
                    window.location.href = 'login.html';
                }
            });
        }

        // Settings form
        if (settingsForm) {
            settingsForm.addEventListener('submit', handleSettingsSubmit);
        }

        // Cancel changes
        if (cancelChanges) {
            cancelChanges.addEventListener('click', () => {
                updateProfileSection();
                hideSettingsMessage();
            });
        }

        // Database tabs
        document.querySelectorAll('.db-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.db-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                loadDatabaseContent(tab.dataset.tab);
            });
        });

        // Chat
        setupChatListeners();

        // Events
        setupEventListeners2();

        // Modals
        setupModalListeners();
    }

    // Navegar a sección
    function navigateTo(sectionId) {
        navLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.section === sectionId);
        });

        contentSections.forEach(section => {
            section.classList.toggle('active', section.id === `section-${sectionId}`);
        });

        // Sincronizar hash en la barra de URL
        if (sectionId === 'admin') {
            if (window.location.hash !== '#admin') {
                try { history.replaceState(null, '', '#admin'); } catch (e) { window.location.hash = 'admin'; }
            }
        } else if (sectionId === 'home') {
            if (window.location.hash) {
                try { history.replaceState(null, '', window.location.pathname); } catch (e) { window.location.hash = ''; }
            }
        } else {
            if (window.location.hash !== '#' + sectionId) {
                try { history.replaceState(null, '', '#' + sectionId); } catch (e) { window.location.hash = sectionId; }
            }
        }

        const titles = {
            'home': 'Inicio',
            'logica': 'Lógica de Programación',
            'lenguajes': 'Lenguajes de Programación',
            'databases': 'Bases de Datos',
            'libros': 'Libros Recomendados',
            'comunidad': 'Comunidad',
            'perfil': 'Mi Perfil',
            'admin': 'Panel de Administración',
            'ayuda': 'Centro de Ayuda y Soporte'
        };
        pageTitle.textContent = titles[sectionId] || 'Dashboard';

        // Cargar contenido específico de la sección
        switch (sectionId) {
            case 'perfil':
                updateProfileSection();
                break;
            case 'admin':
                loadAdminPanel();
                break;
            case 'ayuda':
                navigateTo('comunidad');
                setTimeout(() => {
                    const ayudaTab = document.querySelector('.chat-tab[data-chat="ayuda"]');
                    if (ayudaTab) ayudaTab.click();
                }, 60);
                return;
            case 'comunidad':
                loadCommunity();
                break;
            case 'databases':
                loadDatabaseContent('relacional');
                break;
        }
    }

    // ========== CONTENIDO ==========
    function loadContent() {
        loadLogicaContent();
        loadLenguajesContent();
        loadLibrosContent();
        loadDatabaseContent('relacional');
    }

    // Contenido de Lógica
    function loadLogicaContent() {
        const grid = document.getElementById('logicaGrid');
        if (!grid) return;

        const logicaItems = [
            {
                id: 'logica-1',
                title: 'Algoritmos Básicos',
                description: 'Aprende los fundamentos de los algoritmos y cómo estructurar soluciones paso a paso.',
                level: 'beginner',
                lessons: 8,
                duration: '2 horas',
                category: 'logica'
            },
            {
                id: 'logica-2',
                title: 'Variables y Tipos de Datos',
                description: 'Entiende cómo funcionan las variables y los diferentes tipos de datos.',
                level: 'beginner',
                lessons: 6,
                duration: '1.5 horas',
                category: 'logica'
            },
            {
                id: 'logica-3',
                title: 'Estructuras de Control',
                description: 'Domina condicionales, bucles y estructuras de control de flujo.',
                level: 'intermediate',
                lessons: 10,
                duration: '3 horas',
                category: 'logica'
            },
            {
                id: 'logica-4',
                title: 'Funciones y Modularidad',
                description: 'Aprende a crear funciones reutilizables y código modular.',
                level: 'intermediate',
                lessons: 12,
                duration: '4 horas',
                category: 'logica'
            },
            {
                id: 'logica-5',
                title: 'Recursividad',
                description: 'Comprende el concepto de recursividad y cuándo aplicarlo.',
                level: 'advanced',
                lessons: 8,
                duration: '3 horas',
                category: 'logica'
            },
            {
                id: 'logica-6',
                title: 'Estructuras de Datos',
                description: 'Arrays, listas, pilas, colas, árboles y grafos.',
                level: 'advanced',
                lessons: 15,
                duration: '6 horas',
                category: 'logica'
            }
        ];

        grid.innerHTML = logicaItems.map(item => createContentCard(item)).join('');
        setupCardListeners(grid);
    }

    // Contenido de Lenguajes
    function loadLenguajesContent() {
        const grid = document.getElementById('lenguajesGrid');
        if (!grid) return;

        const lenguajes = [
            { id: 'lang-python', name: 'Python', icon: 'python', abbr: 'PY', description: 'Lenguaje versátil ideal para principiantes, ciencia de datos e IA.', tags: ['Backend', 'Data Science', 'IA'] },
            { id: 'lang-javascript', name: 'JavaScript', icon: 'javascript', abbr: 'JS', description: 'El lenguaje de la web, esencial para desarrollo frontend y backend.', tags: ['Frontend', 'Backend', 'Web'] },
            { id: 'lang-java', name: 'Java', icon: 'java', abbr: 'JV', description: 'Lenguaje robusto para aplicaciones empresariales y Android.', tags: ['Enterprise', 'Android', 'Backend'] },
            { id: 'lang-csharp', name: 'C#', icon: 'csharp', abbr: 'C#', description: 'Lenguaje de Microsoft para desarrollo de juegos y aplicaciones Windows.', tags: ['Unity', 'Windows', 'Web'] },
            { id: 'lang-cpp', name: 'C++', icon: 'cpp', abbr: 'C++', description: 'Alto rendimiento para sistemas, juegos y aplicaciones críticas.', tags: ['Sistemas', 'Juegos', 'IoT'] },
            { id: 'lang-go', name: 'Go', icon: 'go', abbr: 'GO', description: 'Lenguaje moderno de Google para sistemas distribuidos.', tags: ['Cloud', 'Backend', 'DevOps'] },
            { id: 'lang-rust', name: 'Rust', icon: 'rust', abbr: 'RS', description: 'Seguridad y rendimiento para sistemas de bajo nivel.', tags: ['Sistemas', 'WebAssembly', 'Seguridad'] },
            { id: 'lang-php', name: 'PHP', icon: 'php', abbr: 'PHP', description: 'Lenguaje del lado del servidor para desarrollo web.', tags: ['Web', 'Backend', 'CMS'] },
            { id: 'lang-swift', name: 'Swift', icon: 'swift', abbr: 'SW', description: 'Lenguaje de Apple para iOS y macOS.', tags: ['iOS', 'macOS', 'Mobile'] }
        ];

        grid.innerHTML = lenguajes.map(lang => `
            <div class="content-card language-card" data-id="${lang.id}" data-category="lenguajes">
                <div class="language-icon ${lang.icon}">${lang.abbr}</div>
                <h3>${lang.name}</h3>
                <p>${lang.description}</p>
                <div class="card-tags">
                    ${lang.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                ${createRatingHTML(lang.id)}
                <button class="card-btn" onclick="openContentModal('${lang.id}', '${lang.name}', 'lenguajes')">Explorar</button>
            </div>
        `).join('');

        setupRatingListeners(grid);
    }

    // Contenido de Libros
    function loadLibrosContent() {
        const grid = document.getElementById('librosGrid');
        if (!grid) return;

        const libros = [
            { id: 'book-1', title: 'Clean Code', author: 'Robert C. Martin', description: 'Guía para escribir código limpio y mantenible.', cover: '', coverClass: '' },
            { id: 'book-2', title: 'Design Patterns', author: 'Gang of Four', description: 'Patrones de diseño reutilizables en software orientado a objetos.', cover: 'design', coverClass: 'design' },
            { id: 'book-3', title: 'Introduction to Algorithms', author: 'Cormen, Leiserson, Rivest, Stein', description: 'La biblia de los algoritmos y estructuras de datos.', cover: 'algo', coverClass: 'algo' },
            { id: 'book-4', title: 'The Pragmatic Programmer', author: 'David Thomas, Andrew Hunt', description: 'Consejos prácticos para convertirse en mejor programador.', cover: 'pragmatic', coverClass: 'pragmatic' },
            { id: 'book-5', title: 'Refactoring', author: 'Martin Fowler', description: 'Mejora el diseño del código existente.', cover: 'refactor', coverClass: 'refactor' },
            { id: 'book-6', title: 'Domain-Driven Design', author: 'Eric Evans', description: 'Aborda la complejidad en el corazón del software.', cover: 'ddd', coverClass: 'ddd' }
        ];

        grid.innerHTML = libros.map(book => `
            <div class="content-card book-card" data-id="${book.id}" data-category="libros">
                <div class="book-cover ${book.coverClass}">${book.title.split(' ').map(w => w[0]).join('').substring(0, 2)}</div>
                <div class="book-info">
                    <h3>${book.title}</h3>
                    <p class="book-author">${book.author}</p>
                    <p class="book-desc">${book.description}</p>
                    ${createRatingHTML(book.id)}
                    <button class="card-btn" onclick="openContentModal('${book.id}', '${book.title}', 'libros')">Ver detalles</button>
                </div>
            </div>
        `).join('');

        setupRatingListeners(grid);
    }

    // Contenido de Bases de Datos
    function loadDatabaseContent(tab) {
        const container = document.getElementById('dbContent');
        if (!container) return;

        if (tab === 'relacional') {
            container.innerHTML = `
                <div class="db-info-card">
                    <h3>¿Qué son las Bases de Datos Relacionales?</h3>
                    <p>Las bases de datos relacionales organizan la información en tablas con filas y columnas, donde las relaciones entre los datos se establecen mediante claves primarias y foráneas. Utilizan SQL (Structured Query Language) para manipular y consultar datos.</p>
                    
                    <h4 style="margin-top: 20px; margin-bottom: 12px;">Características principales:</h4>
                    <ul>
                        <li>Estructura tabular con esquema definido</li>
                        <li>Soporte para transacciones ACID</li>
                        <li>Integridad referencial mediante claves</li>
                        <li>Lenguaje SQL estandarizado</li>
                        <li>Escalabilidad vertical</li>
                    </ul>

                    <h4 style="margin-top: 20px; margin-bottom: 12px;">Ejemplos populares:</h4>
                    <div class="cards-grid" style="margin-top: 16px;">
                        ${createDBCard('MySQL', 'mysql', 'Base de datos open source más popular, usada por WordPress, Facebook y Twitter.')}
                        ${createDBCard('PostgreSQL', 'postgresql', 'BD relacional avanzada con soporte para JSON, búsqueda de texto completo y extensiones.')}
                        ${createDBCard('SQL Server', 'sqlserver', 'Solución empresarial de Microsoft con integración con Azure y herramientas BI.')}
                        ${createDBCard('Oracle', 'oracle', 'Líder en el mercado empresarial con características avanzadas de seguridad y rendimiento.')}
                    </div>
                </div>

                <div class="db-info-card">
                    <h3>Ejemplo de SQL</h3>
                    <p>Aquí tienes un ejemplo básico de cómo crear una tabla y realizar consultas:</p>
                    
                    <div class="code-example">
                        <pre><span class="comment">-- Crear tabla de usuarios</span>
<span class="keyword">CREATE TABLE</span> usuarios (
    id <span class="keyword">INT PRIMARY KEY AUTO_INCREMENT</span>,
    nombre <span class="keyword">VARCHAR</span>(100) <span class="keyword">NOT NULL</span>,
    email <span class="keyword">VARCHAR</span>(150) <span class="keyword">UNIQUE</span>,
    fecha_registro <span class="keyword">DATETIME DEFAULT CURRENT_TIMESTAMP</span>
);

<span class="comment">-- Insertar datos</span>
<span class="keyword">INSERT INTO</span> usuarios (nombre, email) 
<span class="keyword">VALUES</span> (<span class="string">'Juan Perez'</span>, <span class="string">'juan@email.com'</span>);

<span class="comment">-- Consultar datos</span>
<span class="keyword">SELECT</span> * <span class="keyword">FROM</span> usuarios 
<span class="keyword">WHERE</span> fecha_registro > <span class="string">'2024-01-01'</span>
<span class="keyword">ORDER BY</span> nombre;</pre>
                    </div>
                </div>
            `;
        } else if (tab === 'norelacional') {
            container.innerHTML = `
                <div class="db-info-card">
                    <h3>¿Qué son las Bases de Datos No Relacionales (NoSQL)?</h3>
                    <p>Las bases de datos NoSQL están diseñadas para manejar grandes volúmenes de datos no estructurados o semi-estructurados. No utilizan el modelo tabular tradicional y ofrecen mayor flexibilidad en el esquema de datos.</p>
                    
                    <h4 style="margin-top: 20px; margin-bottom: 12px;">Tipos de bases NoSQL:</h4>
                    <ul>
                        <li><strong>Documentales:</strong> Almacenan datos en documentos JSON/BSON (MongoDB, CouchDB)</li>
                        <li><strong>Clave-Valor:</strong> Pares simples de clave y valor (Redis, DynamoDB)</li>
                        <li><strong>Columnares:</strong> Optimizadas para consultas en columnas (Cassandra, HBase)</li>
                        <li><strong>Grafos:</strong> Para datos altamente conectados (Neo4j, Amazon Neptune)</li>
                    </ul>

                    <h4 style="margin-top: 20px; margin-bottom: 12px;">Cuándo usar NoSQL:</h4>
                    <ul>
                        <li>Datos no estructurados o semi-estructurados</li>
                        <li>Necesidad de escalabilidad horizontal</li>
                        <li>Alta velocidad de escritura/lectura</li>
                        <li>Esquemas flexibles que cambian frecuentemente</li>
                    </ul>

                    <h4 style="margin-top: 20px; margin-bottom: 12px;">Ejemplos populares:</h4>
                    <div class="cards-grid" style="margin-top: 16px;">
                        ${createDBCard('MongoDB', 'mongodb', 'BD documental más popular. Almacena datos en documentos JSON flexibles.')}
                        ${createDBCard('Redis', 'redis', 'Base de datos en memoria ultra rápida, ideal para caché y sesiones.')}
                        ${createDBCard('Cassandra', 'cassandra', 'Diseñada para manejar grandes cantidades de datos distribuidos.')}
                        ${createDBCard('Neo4j', 'neo4j', 'Base de datos de grafos para relaciones complejas entre datos.')}
                    </div>
                </div>

                <div class="db-info-card">
                    <h3>Ejemplo de MongoDB</h3>
                    <p>Aquí tienes un ejemplo de cómo trabajar con MongoDB:</p>
                    
                    <div class="code-example">
                        <pre><span class="comment">// Insertar un documento</span>
db.usuarios.<span class="function">insertOne</span>({
    nombre: <span class="string">"Juan Perez"</span>,
    email: <span class="string">"juan@email.com"</span>,
    edad: 28,
    intereses: [<span class="string">"programacion"</span>, <span class="string">"musica"</span>],
    direccion: {
        ciudad: <span class="string">"Madrid"</span>,
        pais: <span class="string">"Espana"</span>
    }
});

<span class="comment">// Buscar documentos</span>
db.usuarios.<span class="function">find</span>({
    edad: { $gte: 25 },
    <span class="string">"direccion.ciudad"</span>: <span class="string">"Madrid"</span>
});

<span class="comment">// Actualizar documento</span>
db.usuarios.<span class="function">updateOne</span>(
    { email: <span class="string">"juan@email.com"</span> },
    { $set: { edad: 29 } }
);</pre>
                    </div>
                </div>
            `;
        } else if (tab === 'ejercicios') {
            container.innerHTML = `
                <div class="db-info-card">
                    <h3>Ejercicios Prácticos de Bases de Datos</h3>
                    <p>Pon a prueba tus conocimientos con estos ejercicios:</p>
                </div>

                <div class="cards-grid">
                    ${createExerciseCard('ej-db-1', 'Crear una BD de Biblioteca', 'beginner', 'Diseña un esquema relacional para gestionar libros, autores y préstamos.', 'SQL')}
                    ${createExerciseCard('ej-db-2', 'Sistema de E-commerce', 'intermediate', 'Crea las tablas para productos, usuarios, pedidos y carrito de compras.', 'SQL')}
                    ${createExerciseCard('ej-db-3', 'Red Social Simple', 'intermediate', 'Modela usuarios, publicaciones, comentarios y amistades.', 'SQL/NoSQL')}
                    ${createExerciseCard('ej-db-4', 'Blog con MongoDB', 'beginner', 'Diseña la estructura de documentos para un blog con posts y comentarios.', 'MongoDB')}
                    ${createExerciseCard('ej-db-5', 'Caché con Redis', 'advanced', 'Implementa un sistema de caché para sesiones de usuario.', 'Redis')}
                    ${createExerciseCard('ej-db-6', 'Optimización de Queries', 'advanced', 'Analiza y optimiza consultas SQL lentas usando índices.', 'SQL')}
                </div>
            `;

            setupRatingListeners(container);
        }
    }

    function createDBCard(name, type, description) {
        const colors = {
            'mysql': '#4479a1',
            'postgresql': '#336791',
            'sqlserver': '#cc2927',
            'oracle': '#f80000',
            'mongodb': '#47a248',
            'redis': '#dc382d',
            'cassandra': '#1287b1',
            'neo4j': '#008cc1'
        };

        return `
            <div class="content-card language-card" style="text-align: center;">
                <div class="language-icon" style="background: ${colors[type] || '#6366f1'};">${name.substring(0, 2).toUpperCase()}</div>
                <h3>${name}</h3>
                <p>${description}</p>
            </div>
        `;
    }

    function createExerciseCard(id, title, level, description, tech) {
        const levelNames = { 'beginner': 'Básico', 'intermediate': 'Intermedio', 'advanced': 'Avanzado' };
        return `
            <div class="content-card" data-id="${id}" data-category="databases">
                <div class="card-header">
                    <span class="card-badge ${level}">${levelNames[level]}</span>
                    <span class="tag">${tech}</span>
                </div>
                <h3>${title}</h3>
                <p>${description}</p>
                ${createRatingHTML(id)}
                <button class="card-btn" onclick="openContentModal('${id}', '${title}', 'databases')">Ver ejercicio</button>
            </div>
        `;
    }

    // Crear tarjeta de contenido
    function createContentCard(item) {
        const levelNames = { 'beginner': 'Básico', 'intermediate': 'Intermedio', 'advanced': 'Avanzado' };
        return `
            <div class="content-card" data-id="${item.id}" data-category="${item.category}">
                <div class="card-header">
                    <span class="card-badge ${item.level}">${levelNames[item.level]}</span>
                </div>
                <h3>${item.title}</h3>
                <p>${item.description}</p>
                <div class="card-meta">
                    <span>${item.lessons} lecciones</span>
                    <span>${item.duration}</span>
                </div>
                ${createRatingHTML(item.id)}
                <button class="card-btn" onclick="openContentModal('${item.id}', '${item.title}', '${item.category}')">Ver contenido</button>
            </div>
        `;
    }

    // Crear HTML de rating
    function createRatingHTML(contentId) {
        const rating = content.getAverageRating(contentId);
        const userRating = currentUser ? content.getUserRating(contentId, currentUser.id) : 0;

        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            const filled = i <= userRating ? 'filled' : '';
            starsHtml += `
                <svg class="star ${filled}" data-rating="${i}" data-content="${contentId}" width="18" height="18" viewBox="0 0 24 24" fill="${i <= userRating ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
            `;
        }

        return `
            <div class="card-rating">
                <div class="stars">${starsHtml}</div>
                <span class="rating-count">${rating.average} (${rating.count} votos)</span>
            </div>
        `;
    }

    // Setup rating listeners
    function setupRatingListeners(container) {
        container.querySelectorAll('.star').forEach(star => {
            star.addEventListener('click', function () {
                if (!currentUser) {
                    alert('Debes iniciar sesión para calificar');
                    return;
                }

                const contentId = this.dataset.content;
                const rating = parseInt(this.dataset.rating);

                content.rateContent(contentId, rating, currentUser.id);

                // Actualizar UI
                const card = this.closest('.content-card') || this.closest('.book-card');
                if (card) {
                    const ratingContainer = card.querySelector('.card-rating');
                    if (ratingContainer) {
                        ratingContainer.outerHTML = createRatingHTML(contentId);
                        setupRatingListeners(card);
                    }
                }
            });
        });
    }

    // Setup card listeners
    function setupCardListeners(container) {
        setupRatingListeners(container);
    }

    // ========== COMUNIDAD ==========
    function loadCommunity() {
        loadChatMessages();
        loadEvents();
    }

    function setupChatListeners() {
        const sendBtn = document.getElementById('sendMessageBtn');
        const chatInput = document.getElementById('chatInput');

        if (sendBtn && chatInput) {
            sendBtn.addEventListener('click', sendMessage);
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') sendMessage();
            });
        }

        document.querySelectorAll('.chat-tab').forEach(tab => {
            tab.addEventListener('click', function () {
                document.querySelectorAll('.chat-tab').forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                const chatHeader = document.querySelector('#section-comunidad .chat-header h3');
                const chatInput = document.getElementById('chatInput');
                const layout = document.querySelector('#section-comunidad .community-layout');
                const sectionH2 = document.querySelector('#section-comunidad .section-header h2');
                const sectionP = document.querySelector('#section-comunidad .section-header p');

                if (this.dataset.chat === 'ayuda') {
                    if (layout) layout.classList.add('support-mode');
                    if (sectionH2) sectionH2.textContent = 'Centro de Ayuda y Soporte Oficial';
                    if (sectionP) sectionP.textContent = 'Asistencia técnica 24/7, estado de cuenta y resolución directa de dudas';
                    if (chatHeader) chatHeader.innerHTML = '💬 Chat de Ayuda y Soporte <span style="font-size: 11px; color: #10b981; font-weight: normal; margin-left: 8px;">● Asistencia Oficial 24/7</span>';
                    if (chatInput) chatInput.placeholder = "Escribe tu consulta o usa '/ayuda [describe tu problema]'...";
                } else {
                    if (layout) layout.classList.remove('support-mode');
                    if (sectionH2) sectionH2.textContent = 'Comunidad';
                    if (sectionP) sectionP.textContent = 'Conecta con otros programadores y participa en eventos';
                    if (chatHeader) chatHeader.textContent = 'Chat General';
                    if (chatInput) chatInput.placeholder = "Escribe un mensaje...";
                }
                loadChatMessages(this.dataset.chat);
            });
        });

        // Escuchar actualizaciones de soporte en tiempo real
        window.addEventListener('rdslp_support_updated', () => {
            const activeTab = document.querySelector('.chat-tab.active');
            if (activeTab && activeTab.dataset.chat === 'ayuda') {
                loadChatMessages('ayuda');
            }
        });
    }

    async function loadChatMessages(chatId = 'general') {
        const container = document.getElementById('chatMessages');
        if (!container) return;

        if (chatId === 'ayuda') {
            await renderAyudaChat(container);
            return;
        }

        const messages = community.getMessages(chatId);

        if (messages.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 40px;">No hay mensajes aún. ¡Sé el primero en escribir!</p>';
            return;
        }

        container.innerHTML = messages.map(msg => {
            const isOwn = currentUser && msg.authorId === currentUser.id;
            const initial = msg.authorName ? msg.authorName.charAt(0).toUpperCase() : '?';
            const time = new Date(msg.createdAt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });

            return `
                <div class="chat-message ${isOwn ? 'own' : ''}">
                    <div class="message-avatar">${initial}</div>
                    <div class="message-content">
                        <div class="message-author">${msg.authorName}</div>
                        <div class="message-text">${escapeHtml(msg.text)}</div>
                        <div class="message-time">${time}</div>
                    </div>
                </div>
            `;
        }).join('');

        container.scrollTop = container.scrollHeight;
    }

    async function renderAyudaChat(container) {
        if (!container) return;

        // Estado de moderación / sanciones del usuario
        let statusBadge = '<span style="color: #10b981; font-weight: 600;">🟢 Cuenta Activa</span>';
        if (currentUser && window.socialModeration) {
            try {
                const s = window.socialModeration.getUserSanctions(currentUser.id);
                if (s.isBanned) {
                    statusBadge = '<span style="color: #ef4444; font-weight: 600;">⛔ Cuenta Suspendida</span>';
                } else if (s.isMuted) {
                    statusBadge = '<span style="color: #fbbf24; font-weight: 600;">🔇 Silenciado</span>';
                } else if (s.warnings && s.warnings.length > 0) {
                    statusBadge = `<span style="color: #f59e0b; font-weight: 600;">⚠️ ${s.warnings.length} Strikes</span>`;
                }
            } catch (e) {}
        }

        const bannerHTML = `
            <div class="ayuda-status-card" style="background: var(--bg-card, #171717); border: 1px solid var(--border-color, rgba(255,255,255,0.1)); border-radius: 12px; padding: 14px; margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 10px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 22px;">🤖</span>
                        <div>
                            <strong style="font-size: 13.5px; color: var(--text-primary);">Canal de Asistencia y Notificaciones</strong>
                            <div style="font-size: 11px; color: #10b981; font-weight: 500;">● Bot Oficial Activo 24/7 · Mensajes Guardados</div>
                        </div>
                    </div>
                    <div style="font-size: 12px; padding: 4px 10px; border-radius: 6px; background: rgba(255,255,255,0.05); border: 1px solid var(--border-color);">
                        ${statusBadge}
                    </div>
                </div>
                <div style="background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.22); border-radius: 8px; padding: 10px 12px; font-size: 12px; color: var(--text-secondary); line-height: 1.45;">
                    💡 <strong>¿Necesitas contactar al Administrador?</strong><br>
                    Escribe tu consulta o usa el comando: <code style="background: rgba(0,0,0,0.35); color: #fbbf24; padding: 2px 6px; border-radius: 4px; font-weight: 600;">/ayuda [describe tu problema]</code><br>
                    Se enviará una alerta prioritaria al Administrador y sus respuestas llegarán directamente a este chat.
                </div>
            </div>
        `;

        let messagesHTML = '';
        if (window.rdslpNotifications && window.rdslpNotifications.getSupportMessages) {
            const msgs = await window.rdslpNotifications.getSupportMessages();
            messagesHTML = msgs.map(m => {
                const isBot = m.senderRole === 'bot';
                const isAdmin = m.senderRole === 'admin';
                const isOwn = currentUser && m.userId === currentUser.id && !isBot && !isAdmin;
                const time = m.createdAt ? new Date(m.createdAt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) : '';

                if (isBot) {
                    return `
                        <div class="chat-message" style="background: rgba(99, 102, 241, 0.06); border-radius: 12px; padding: 10px; border-left: 3px solid #6366f1;">
                            <div class="message-avatar" style="background: linear-gradient(135deg, #6366f1, #4f46e5); color: #fff;">🤖</div>
                            <div class="message-content">
                                <div class="message-author" style="color: #818cf8; display: flex; align-items: center; gap: 6px;">
                                    <span>${escapeHtml(m.senderName || 'RDSLP Bot')}</span>
                                    <span style="background: rgba(99, 102, 241, 0.25); color: #a5b4fc; font-size: 10px; padding: 1px 6px; border-radius: 4px; font-weight: 700;">BOT OFICIAL</span>
                                </div>
                                <div class="message-text" style="white-space: pre-wrap; line-height: 1.45;">${escapeHtml(m.message)}</div>
                                <div class="message-time">${time}</div>
                            </div>
                        </div>
                    `;
                }

                if (isAdmin) {
                    return `
                        <div class="chat-message" style="background: rgba(234, 179, 8, 0.08); border-radius: 12px; padding: 10px; border-left: 3px solid #eab308;">
                            <div class="message-avatar" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff;">🛡️</div>
                            <div class="message-content">
                                <div class="message-author" style="color: #fbbf24; display: flex; align-items: center; gap: 6px;">
                                    <span>${escapeHtml(m.senderName || 'Administrador')}</span>
                                    <span style="background: rgba(234, 179, 8, 0.25); color: #fde047; font-size: 10px; padding: 1px 6px; border-radius: 4px; font-weight: 700;">ADMIN</span>
                                </div>
                                <div class="message-text" style="white-space: pre-wrap; line-height: 1.45;">${escapeHtml(m.message)}</div>
                                <div class="message-time">${time}</div>
                            </div>
                        </div>
                    `;
                }

                const initial = m.userName?.charAt(0).toUpperCase() || 'U';
                return `
                    <div class="chat-message own">
                        <div class="message-avatar">${initial}</div>
                        <div class="message-content">
                            <div class="message-author">Tú</div>
                            <div class="message-text" style="white-space: pre-wrap; line-height: 1.45;">${escapeHtml(m.message)}</div>
                            <div class="message-time">${time}</div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        container.innerHTML = bannerHTML + (messagesHTML || '<p style="text-align: center; color: var(--text-muted); padding: 20px;">Inicia una consulta de soporte escribiendo un mensaje abajo.</p>');
        container.scrollTop = container.scrollHeight;
    }

    async function sendMessage() {
        const input = document.getElementById('chatInput');
        if (!input || !input.value.trim()) return;

        if (!currentUser) {
            alert('Debes iniciar sesión para enviar mensajes');
            return;
        }

        // Obtener el chat activo
        const activeTab = document.querySelector('.chat-tab.active');
        const chatId = activeTab ? activeTab.dataset.chat : 'general';

        if (chatId === 'ayuda') {
            if (window.rdslpNotifications && window.rdslpNotifications.sendSupportMessage) {
                const text = input.value.trim();
                input.value = '';
                await window.rdslpNotifications.sendSupportMessage(text);
                loadChatMessages('ayuda');
                return;
            }
        }

        community.sendMessage(chatId, input.value.trim(), currentUser.id, currentUser.name);
        input.value = '';
        loadChatMessages(chatId);
    }

    function loadEvents() {
        const container = document.getElementById('eventsList');
        if (!container) return;

        const events = community.getEvents();

        if (events.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px;">No hay eventos programados.</p>';
            return;
        }

        container.innerHTML = events.map(event => {
            const date = new Date(event.date);
            const dateStr = date.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' });
            const timeStr = date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
            const isJoined = currentUser && event.participants.some(p => p.id === currentUser.id);
            const isOrganizer = currentUser && event.organizer === currentUser.email;
            const canDelete = isOrganizer || (currentUser && auth.hasPermission('canManageEvents'));

            return `
                <div class="event-card" data-event-id="${event.id}">
                    <div class="event-title">${escapeHtml(event.title)}</div>
                    <div class="event-desc">${escapeHtml(event.description)}</div>
                    <div class="event-meta">
                        <span>${dateStr} ${timeStr}</span>
                        <span>${event.participants.length}/${event.maxParticipants} participantes</span>
                    </div>
                    <div class="event-actions">
                        ${isJoined
                    ? `<button class="btn-leave-event" onclick="leaveEvent(${event.id})">Salir</button>`
                    : `<button class="btn-join-event" onclick="joinEvent(${event.id})">Unirse</button>`
                }
                        ${canDelete ? `<button class="btn-delete-event" onclick="deleteEvent(${event.id})">Eliminar</button>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    function setupEventListeners2() {
        const createEventBtn = document.getElementById('createEventBtn');
        const eventModal = document.getElementById('eventModal');
        const closeEventModal = document.getElementById('closeEventModal');
        const cancelEvent = document.getElementById('cancelEvent');
        const eventForm = document.getElementById('eventForm');

        if (createEventBtn) {
            createEventBtn.addEventListener('click', () => {
                eventModal.classList.add('active');
            });
        }

        if (closeEventModal) {
            closeEventModal.addEventListener('click', () => {
                eventModal.classList.remove('active');
            });
        }

        if (cancelEvent) {
            cancelEvent.addEventListener('click', () => {
                eventModal.classList.remove('active');
            });
        }

        if (eventForm) {
            eventForm.addEventListener('submit', (e) => {
                e.preventDefault();

                if (!currentUser) {
                    alert('Debes iniciar sesión para crear eventos');
                    return;
                }

                const eventData = {
                    title: document.getElementById('eventTitle').value,
                    description: document.getElementById('eventDescription').value,
                    date: document.getElementById('eventDate').value,
                    maxParticipants: parseInt(document.getElementById('eventMax').value),
                    category: document.getElementById('eventCategory').value
                };

                community.createEvent(eventData, currentUser.email, currentUser.name);
                eventModal.classList.remove('active');
                eventForm.reset();
                loadEvents();
            });
        }
    }

    // Funciones globales para eventos
    window.joinEvent = function (eventId) {
        if (!currentUser) {
            alert('Debes iniciar sesión');
            return;
        }
        const result = community.joinEvent(eventId, currentUser.id, currentUser.name);
        if (!result.success) {
            alert(result.message);
        }
        loadEvents();
    };

    window.leaveEvent = function (eventId) {
        if (!currentUser) return;
        community.leaveEvent(eventId, currentUser.id);
        loadEvents();
    };

    window.deleteEvent = function (eventId) {
        if (!currentUser) return;
        if (confirm('¿Estás seguro de eliminar este evento?')) {
            const result = community.deleteEvent(eventId, currentUser.email);
            if (!result.success) {
                alert(result.message);
            }
            loadEvents();
        }
    };

    // ========== MODALES ==========
    function setupModalListeners() {
        const contentModal = document.getElementById('contentModal');
        const closeContentModal = document.getElementById('closeContentModal');

        if (closeContentModal) {
            closeContentModal.addEventListener('click', () => {
                contentModal.classList.remove('active');
            });
        }

        // Cerrar modal al hacer clic fuera
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('active');
            }
        });
    }

    // Abrir modal de contenido
    window.openContentModal = function (id, title, category) {
        const modal = document.getElementById('contentModal');
        const modalTitle = document.getElementById('contentModalTitle');
        const modalBody = document.getElementById('contentModalBody');

        modalTitle.textContent = title;

        // Simular contenido detallado
        let contentHTML = '';
        if (category === 'libros') {
            contentHTML = `
                <div class="modal-detail">
                    <div class="detail-image book-cover-large">📖</div>
                    <div class="detail-info">
                        <h4>Detalles del Libro</h4>
                        <p>Este es un excelente recurso para aprender sobre ${title}. Incluye ejemplos prácticos y ejercicios.</p>
                        <button class="btn-primary" style="margin-top: 20px;">Descargar PDF (Demo)</button>
                    </div>
                </div>
            `;
        } else {
            contentHTML = `
                <div class="modal-detail">
                    <div class="detail-info">
                        <h4>Contenido del Curso</h4>
                        <p>En este módulo aprenderás los conceptos fundamentales de ${title}.</p>
                        <ul style="margin-top: 15px; margin-left: 20px;">
                            <li>Introducción y conceptos básicos</li>
                            <li>Ejemplos prácticos</li>
                            <li>Ejercicios de evaluación</li>
                            <li>Proyecto final</li>
                        </ul>
                        <button class="btn-primary" style="margin-top: 20px;">Comenzar Lección</button>
                    </div>
                </div>
            `;
        }

        modalBody.innerHTML = contentHTML;
        modal.classList.add('active');
    };

    // Funciones de logout
    function logout() {
        auth.logout();
        window.location.href = 'login.html';
    }

    function handleSettingsSubmit(e) {
        e.preventDefault();

        const name = document.getElementById('editName').value;
        const bio = document.getElementById('editBio').value;
        const currentPass = document.getElementById('currentPassword').value;
        const newPass = document.getElementById('newPassword').value;
        const confirmPass = document.getElementById('confirmNewPassword').value;

        const updates = { name, bio };

        if (newPass) {
            if (newPass !== confirmPass) {
                showSettingsMessage('Las contraseñas no coinciden', 'error');
                return;
            }
            updates.password = newPass;
        }

        const result = auth.updateProfile(updates);

        if (result.success) {
            showSettingsMessage('Perfil actualizado correctamente', 'success');
            loadUserData();
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmNewPassword').value = '';
        } else {
            showSettingsMessage(result.message, 'error');
        }
    }

    function showSettingsMessage(msg, type) {
        settingsMessage.textContent = msg;
        settingsMessage.className = 'settings-message ' + type;
        settingsMessage.style.display = 'block';
        setTimeout(hideSettingsMessage, 3000);
    }

    function hideSettingsMessage() {
        settingsMessage.style.display = 'none';
    }

    function updateProfileSection() {
        if (!currentUser) return;

        document.getElementById('profileName').textContent = currentUser.name;
        document.getElementById('profileEmail').textContent = currentUser.email;
        document.getElementById('profileRole').textContent = currentUser.role === 'admin' ? 'Administrador' : 'Usuario';
        document.getElementById('profileAvatar').textContent = currentUser.name.charAt(0).toUpperCase();

        document.getElementById('editName').value = currentUser.name;
        document.getElementById('editEmail').value = currentUser.email;
        document.getElementById('editBio').value = currentUser.bio || '';
    }

    let adminTabsInitialized = false;

    async function loadAdminPanel(targetTab) {
        const tabs = document.querySelectorAll('.admin-tab');
        if (!adminTabsInitialized) {
            tabs.forEach(tab => {
                tab.addEventListener('click', (e) => {
                    e.preventDefault();
                    tabs.forEach(t => {
                        t.classList.remove('active');
                        t.style.color = 'var(--text-secondary)';
                        t.style.borderBottom = '2px solid transparent';
                        t.style.fontWeight = '500';
                    });
                    tab.classList.add('active');
                    tab.style.color = 'var(--text-primary)';
                    tab.style.borderBottom = '2px solid var(--accent-primary)';
                    tab.style.fontWeight = '600';
                    renderUserList(tab.dataset.tab);
                });
            });
            adminTabsInitialized = true;
        }

        const tabToActivate = targetTab || document.querySelector('.admin-tab.active')?.dataset.tab || 'all-users';
        tabs.forEach(t => {
            const isActive = t.dataset.tab === tabToActivate;
            t.classList.toggle('active', isActive);
            t.style.color = isActive ? 'var(--text-primary)' : 'var(--text-secondary)';
            t.style.borderBottom = isActive ? '2px solid var(--accent-primary)' : '2px solid transparent';
            t.style.fontWeight = isActive ? '600' : '500';
        });

        await renderUserList(tabToActivate);
    }

    async function renderUserList(filter = 'all-users') {
        const usersList = document.getElementById('adminUsersList');
        const listTitle = document.getElementById('adminListTitle');
        const listCount = document.getElementById('adminListCount');

        if (!usersList) return;

        usersList.innerHTML = '<div style="padding: 20px; color: var(--text-secondary); text-align: center;"><div class="loader-small" style="display: inline-block; margin-right: 8px;"></div> Cargando datos del sistema...</div>';

        let allUsers = [];
        try {
            if (window.rdslpSupabase && window.rdslpSupabase.getAllUsers) {
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500));
                allUsers = await Promise.race([window.rdslpSupabase.getAllUsers(), timeoutPromise]);
            }
        } catch (err) {
            console.warn('[RDSLP] getAllUsers fallback local:', err.message);
        }

        if (!allUsers || allUsers.length === 0) {
            if (auth && typeof auth.getAllUsers === 'function') {
                allUsers = auth.getAllUsers() || [];
            }
            if (allUsers.length === 0) {
                const u = currentUser || JSON.parse(sessionStorage.getItem('rdslp_user') || localStorage.getItem('rdslp_user') || '{}');
                if (u && u.email) {
                    allUsers = [{
                        id: u.id || 'usr_current',
                        email: u.email,
                        name: u.name || 'richard JG',
                        role: u.role || 'admin',
                        isBanned: false,
                        avatar: (u.name ? u.name.charAt(0) : 'R').toUpperCase()
                    }];
                }
            }
        }

        // Obtener comunidades creadas con timeout estricto de 1.5s para no congelar la UI
        let allCommunities = [];
        try {
            if (filter === 'created-communities' || !document.getElementById('totalCommunities')?.textContent || document.getElementById('totalCommunities')?.textContent === '0') {
                if (window.rdslpSupabase && window.rdslpSupabase.fetchCloudCommunities) {
                    const timeoutComms = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500));
                    allCommunities = await Promise.race([window.rdslpSupabase.fetchCloudCommunities(), timeoutComms]);
                }
            }
        } catch (e) {
            console.warn('[RDSLP] fetchCloudCommunities fallback local:', e.message);
        }

        if (!allCommunities || allCommunities.length === 0) {
            if (typeof community !== 'undefined' && community.getEvents) {
                allCommunities = community.getEvents() || [];
            } else {
                try {
                    allCommunities = JSON.parse(localStorage.getItem('rdslp_events') || '[]');
                } catch (e) {
                    allCommunities = [];
                }
            }
        }

        allUsers = (allUsers || []).filter(u => u && typeof u === 'object');
        allCommunities = (allCommunities || []).filter(c => c && typeof c === 'object');

        // Actualizar contadores del resumen
        const totalUsersEl = document.getElementById('totalUsers');
        if (totalUsersEl) totalUsersEl.textContent = allUsers.length;

        const totalCommunitiesEl = document.getElementById('totalCommunities');
        if (totalCommunitiesEl) totalCommunitiesEl.textContent = allCommunities.length;

        const totalCommentsEl = document.getElementById('totalComments');
        if (totalCommentsEl && typeof content !== 'undefined') {
            totalCommentsEl.textContent = content.getComments ? content.getComments().length : 0;
        }

        const bannedCount = allUsers.filter(u => u.isBanned || u.role === 'banned').length;
        const totalBannedEl = document.getElementById('totalBanned');
        if (totalBannedEl) totalBannedEl.textContent = bannedCount;

        // ── Pestaña: Solicitudes de Soporte (/ayuda) ──────────────────────
        if (filter === 'support-tickets') {
            listTitle.textContent = 'Solicitudes de Soporte Técnico y /ayuda';
            usersList.innerHTML = '<div style="padding: 20px; color: var(--text-secondary); text-align: center;"><div class="loader-small" style="display: inline-block; margin-right: 8px;"></div> Cargando tickets de soporte...</div>';

            let tickets = [];
            try {
                if (window.rdslpNotifications && window.rdslpNotifications.getAllSupportTickets) {
                    tickets = await window.rdslpNotifications.getAllSupportTickets();
                }
            } catch (e) {
                tickets = [];
            }

            if (listCount) listCount.textContent = `${tickets.length} solicitudes`;

            if (tickets.length === 0) {
                usersList.innerHTML = '<p style="color: var(--text-muted); padding: 35px; text-align: center;">No hay solicitudes de ayuda activas en este momento.</p>';
                return;
            }

            usersList.innerHTML = tickets.map(t => {
                const dateStr = t.updatedAt ? new Date(t.updatedAt).toLocaleDateString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Reciente';
                return `
                    <div class="support-ticket-item" style="display: flex; align-items: center; justify-content: space-between; padding: 18px; border-bottom: 1px solid var(--border-color); gap: 15px; flex-wrap: wrap;">
                        <div style="flex: 1; min-width: 250px;">
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                                <strong style="font-size: 15px; color: var(--text-primary);">${escapeHtml(t.userName)}</strong>
                                <span style="font-size: 12px; color: var(--text-muted);">${escapeHtml(t.userEmail || '')}</span>
                                <span style="padding: 2px 8px; border-radius: 6px; font-size: 11px; background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3);">🚨 Ayuda</span>
                            </div>
                            <p style="font-size: 13px; color: var(--text-secondary); margin: 4px 0 8px 0; background: rgba(255, 255, 255, 0.03); padding: 8px 12px; border-radius: 6px; border-left: 3px solid var(--accent-primary);">${escapeHtml(t.lastMessage)}</p>
                            <span style="font-size: 11.5px; color: var(--text-muted);">🕒 ${dateStr} · ${t.messageCount} mensajes en el hilo</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <button onclick="window.replyToSupportTicket('${t.ticketId}', '${escapeHtml(t.userName)}')" style="padding: 8px 16px; border-radius: 6px; background: var(--accent-primary); color: white; border: none; cursor: pointer; font-size: 13px; font-weight: 600;">💬 Responder al Usuario</button>
                        </div>
                    </div>
                `;
            }).join('');
            return;
        }

        // ── Pestaña: Comunicados Globales a Toda la Comunidad ───────────
        if (filter === 'broadcast-announcements') {
            listTitle.textContent = '📢 Comunicados Oficiales para Toda la Comunidad';
            if (listCount) listCount.textContent = 'Llegará a la campanita de todos los usuarios registrados';

            let history = [];
            try {
                history = JSON.parse(localStorage.getItem('rdslp_broadcast_history') || '[]');
            } catch (e) {}

            const historyHTML = history.length === 0
                ? '<p style="color: var(--text-muted); font-size: 13px; margin: 10px 0 0 0;">No has emitido comunicados aún.</p>'
                : history.map(b => {
                    const d = b.date ? new Date(b.date).toLocaleDateString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
                    return `
                        <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; margin-bottom: 10px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                <strong style="color: var(--text-primary); font-size: 13.5px;">${escapeHtml(b.title)}</strong>
                                <span style="font-size: 11px; color: var(--text-muted);">${d}</span>
                            </div>
                            <p style="color: var(--text-secondary); font-size: 12.5px; margin: 0; line-height: 1.4;">${escapeHtml(b.body)}</p>
                            <div style="margin-top: 6px; font-size: 11px; color: #10b981; font-weight: 500;">✓ Notificación entregada a todos los miembros</div>
                        </div>
                    `;
                }).join('');

            usersList.innerHTML = `
                <div style="padding: 10px 0;">
                    <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 22px; margin-bottom: 24px;">
                        <h4 style="margin: 0 0 8px 0; font-size: 16px; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                            <span>📢</span> Redactar Anuncio para Toda la Comunidad
                        </h4>
                        <p style="font-size: 13px; color: var(--text-secondary); margin: 0 0 18px 0; line-height: 1.4;">
                            Este mensaje llegará instantáneamente a la campanita de notificaciones de cada usuario registrado, haciendo que se ilumine y muestre la alerta en tiempo real.
                        </p>

                        <form id="formAdminBroadcast" onsubmit="window.handleSendBroadcast(event)" style="display: flex; flex-direction: column; gap: 14px;">
                            <div>
                                <label style="display: block; font-size: 12.5px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px;">Título del Comunicado</label>
                                <input type="text" id="broadcastTitle" placeholder="Ej: 🎉 ¡Gran actualización disponible en RDSLP!" required style="width: 100%; padding: 10px 14px; border-radius: 8px; background: var(--bg-input, #1f2937); border: 1px solid var(--border-color); color: #fff; font-size: 13.5px;">
                            </div>

                            <div style="display: flex; gap: 14px; flex-wrap: wrap;">
                                <div style="flex: 1; min-width: 200px;">
                                    <label style="display: block; font-size: 12.5px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px;">Tipo de Notificación</label>
                                    <select id="broadcastType" style="width: 100%; padding: 10px 14px; border-radius: 8px; background: var(--bg-input, #1f2937); border: 1px solid var(--border-color); color: #fff; font-size: 13.5px; cursor: pointer;">
                                        <option value="📢 Anuncio General">📢 Anuncio General</option>
                                        <option value="🚀 Novedades y Actualizaciones">🚀 Novedades y Actualizaciones</option>
                                        <option value="⚠️ Aviso Importante del Sistema">⚠️ Aviso Importante del Sistema</option>
                                        <option value="🏆 Evento Comunitario">🏆 Evento Comunitario</option>
                                    </select>
                                </div>
                                <div style="flex: 1; min-width: 200px;">
                                    <label style="display: block; font-size: 12.5px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px;">Enlace Opcional al hacer clic</label>
                                    <input type="text" id="broadcastLink" placeholder="Ej: ../Static/comunidad.html o #muro" style="width: 100%; padding: 10px 14px; border-radius: 8px; background: var(--bg-input, #1f2937); border: 1px solid var(--border-color); color: #fff; font-size: 13.5px;">
                                </div>
                            </div>

                            <div>
                                <label style="display: block; font-size: 12.5px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px;">Mensaje / Contenido</label>
                                <textarea id="broadcastBody" rows="4" placeholder="Escribe el mensaje detallado que leerán todos los usuarios en sus notificaciones..." required style="width: 100%; padding: 10px 14px; border-radius: 8px; background: var(--bg-input, #1f2937); border: 1px solid var(--border-color); color: #fff; font-size: 13.5px; resize: vertical; line-height: 1.4;"></textarea>
                            </div>

                            <div style="display: flex; justify-content: flex-end; margin-top: 4px;">
                                <button type="submit" id="btnSubmitBroadcast" style="background: linear-gradient(135deg, #6366f1, #4f46e5); color: #fff; border: none; padding: 11px 22px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4); transition: transform 0.2s;">
                                    <span>🚀 Enviar a Toda la Comunidad</span>
                                </button>
                            </div>
                        </form>
                    </div>

                    <div>
                        <h4 style="font-size: 14px; color: var(--text-primary); margin: 0 0 12px 0;">Historial de Comunicados Emitidos</h4>
                        ${historyHTML}
                    </div>
                </div>
            `;
            return;
        }

        // ── Pestaña: Comunidades Creadas ─────────────────────────────────
        if (filter === 'created-communities') {
            listTitle.textContent = 'Comunidades y Salas Creadas';
            if (listCount) listCount.textContent = `${allCommunities.length} en total`;

            if (allCommunities.length === 0) {
                usersList.innerHTML = '<p style="color: var(--text-muted); padding: 35px; text-align: center;">No hay ninguna comunidad o sala creada aún.</p>';
                return;
            }

            usersList.innerHTML = allCommunities.map(c => {
                const isPrivate = c.accessType === 'private';
                const accessBadge = isPrivate
                    ? `<span style="padding: 4px 8px; border-radius: 6px; font-size: 11.5px; font-weight: 600; background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3);">🔒 Privada ${c.inviteCode ? `(${escapeHtml(c.inviteCode)})` : ''}</span>`
                    : `<span style="padding: 4px 8px; border-radius: 6px; font-size: 11.5px; font-weight: 600; background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3);">🟢 Pública</span>`;

                const categoryBadge = `<span style="padding: 4px 8px; border-radius: 6px; font-size: 11.5px; font-weight: 600; background: rgba(99, 102, 241, 0.15); color: #818cf8; text-transform: uppercase;">${escapeHtml(c.category || 'general')}</span>`;

                const participantsCount = c.participants?.length || 0;
                const dateStr = c.date ? new Date(c.date).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Sin fecha';

                return `
                    <div class="community-admin-item" style="display: flex; align-items: center; justify-content: space-between; padding: 18px; border-bottom: 1px solid var(--border-color); gap: 15px; flex-wrap: wrap;">
                        <div style="flex: 1; min-width: 250px;">
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; flex-wrap: wrap;">
                                <strong style="font-size: 15px; color: var(--text-primary);">${escapeHtml(c.title)}</strong>
                                ${accessBadge}
                                ${categoryBadge}
                            </div>
                            <p style="font-size: 13px; color: var(--text-secondary); margin: 0 0 8px 0; line-height: 1.4;">${escapeHtml(c.description || 'Sin descripción')}</p>
                            <div style="display: flex; gap: 15px; font-size: 12px; color: var(--text-muted); flex-wrap: wrap;">
                                <span>👤 Creador: <strong style="color: var(--text-secondary);">${escapeHtml(c.organizerName || c.organizer || 'Anónimo')}</strong></span>
                                <span>👥 Miembros: <strong style="color: var(--text-secondary);">${participantsCount} / ${c.maxParticipants || 20}</strong></span>
                                <span>📅 Fecha: ${dateStr}</span>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <a href="comunidad.html" style="padding: 8px 14px; border-radius: 6px; background: rgba(99, 102, 241, 0.15); color: #818cf8; text-decoration: none; font-size: 13px; font-weight: 500; border: 1px solid rgba(99, 102, 241, 0.3);">Ver en Comunidad</a>
                            <button onclick="deleteCommunityAdmin('${c.id}')" style="padding: 8px 14px; border-radius: 6px; background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); cursor: pointer; font-size: 13px; font-weight: 500;">Eliminar</button>
                        </div>
                    </div>
                `;
            }).join('');
            return;
        }

        // ── Pestañas de Usuarios: all-users, active-users, banned-users ───
        let usersToRender = [];
        if (filter === 'active-users') {
            usersToRender = allUsers.filter(u => !u.isBanned && u.role !== 'banned');
            listTitle.textContent = 'Usuarios Activos';
            if (listCount) listCount.textContent = `${usersToRender.length} de ${allUsers.length} usuarios`;
        } else if (filter === 'banned-users') {
            usersToRender = allUsers.filter(u => u.isBanned || u.role === 'banned');
            listTitle.textContent = 'Usuarios Baneados';
            if (listCount) listCount.textContent = `${usersToRender.length} usuarios baneados`;
        } else {
            // all-users (Por defecto: muestra a todos)
            usersToRender = allUsers;
            listTitle.textContent = 'Usuarios Registrados (Todos)';
            if (listCount) listCount.textContent = `${allUsers.length} usuarios en total`;
        }

        if (usersToRender.length === 0) {
            usersList.innerHTML = '<p style="color: var(--text-muted); padding: 30px; text-align: center;">No hay usuarios en esta categoría.</p>';
            return;
        }

        usersList.innerHTML = usersToRender.map(u => {
            const isSelf = currentUser && (u.id === currentUser.id || u.email === currentUser.email);
            const isAdmin = u.role === 'admin';
            const isBanned = u.isBanned || u.role === 'banned';

            // Badge de Estado (Activo / Baneado)
            const statusBadge = isBanned
                ? `<span style="padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); margin-right: 8px;">🚫 Baneado</span>`
                : `<span style="padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3); margin-right: 8px;">🟢 Activo</span>`;

            // Badge de Rol
            let roleBadge = '';
            if (u.role === 'admin') {
                roleBadge = `<span style="padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; background: rgba(168, 85, 247, 0.18); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.35); margin-right: 8px;">Administrador</span>`;
            } else if (u.role === 'moderator') {
                roleBadge = `<span style="padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; background: rgba(59, 130, 246, 0.18); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.35); margin-right: 8px;">Moderador</span>`;
            } else {
                roleBadge = `<span style="padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; background: rgba(148, 163, 184, 0.15); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.25); margin-right: 8px;">Usuario</span>`;
            }

            // Select de roles
            let roleSelect = '';
            if (!isSelf && !isBanned) {
                roleSelect = `
                    <select onchange="window.changeUserRole('${u.id}', this.value)" class="role-select" style="padding: 6px 10px; border-radius: 6px; background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-color); margin-right: 10px; cursor: pointer; font-size: 13px;">
                        <option value="user" ${u.role === 'user' ? 'selected' : ''}>Usuario</option>
                        <option value="moderator" ${u.role === 'moderator' ? 'selected' : ''}>Moderador</option>
                        <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Administrador</option>
                    </select>
                `;
            }

            // Botón de ban / desbanear
            let banBtn = '';
            if (!isSelf && !isAdmin) {
                if (isBanned) {
                    banBtn = `<button onclick="window.toggleBanUser('${u.id}', false)" style="padding: 6px 14px; border-radius: 6px; background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3); cursor: pointer; font-weight: 500; font-size: 13px;">Desbanear</button>`;
                } else {
                    banBtn = `<button onclick="window.toggleBanUser('${u.id}', true)" style="padding: 6px 14px; border-radius: 6px; background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); cursor: pointer; font-weight: 500; font-size: 13px;">Banear</button>`;
                }
            }

            const initial = (u.name ? u.name.charAt(0) : 'U').toUpperCase();

            return `
                <div class="user-item" style="display: flex; align-items: center; justify-content: space-between; padding: 16px; border-bottom: 1px solid var(--border-color); transition: background 0.2s; flex-wrap: wrap; gap: 12px;">
                    <div class="user-info" style="display: flex; align-items: center; gap: 14px; min-width: 240px; cursor: pointer;" onclick="window.openUserProfileModal('${u.id}', '${escapeHtml(u.name)}')" title="Ver perfil de ${escapeHtml(u.name)}">
                        <div class="user-avatar-small" style="width: 42px; height: 42px; background: var(--gradient-primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; flex-shrink: 0;">${initial}</div>
                        <div>
                            <div class="user-name" style="font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                                <span style="text-decoration: underline; text-underline-offset: 3px;">${escapeHtml(u.name)}</span>
                                ${isSelf ? '<span style="color: #818cf8; font-size: 11.5px; font-weight: normal;">(Tú)</span>' : ''}
                            </div>
                            <div class="user-email" style="font-size: 13px; color: var(--text-secondary); margin-top: 2px;">${escapeHtml(u.email)}</div>
                        </div>
                    </div>
                    <div class="user-actions" style="display: flex; align-items: center; flex-wrap: wrap; gap: 6px;">
                        <button type="button" onclick="window.openUserProfileModal('${u.id}', '${escapeHtml(u.name)}')" style="padding: 6px 12px; border-radius: 6px; background: rgba(99, 102, 241, 0.15); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.35); cursor: pointer; font-weight: 500; font-size: 13px; display: inline-flex; align-items: center; gap: 4px;" title="Ver perfil completo y moderación">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                            <span>Perfil</span>
                        </button>
                        ${statusBadge}
                        ${roleBadge}
                        ${roleSelect}
                        ${banBtn}
                    </div>
                </div>
            `;
        }).join('');
    }

    // Funciones globales para admin conectadas con Supabase y Comunidades
    window.changeUserRole = async function (userId, newRole) {
        if (!checkIsAdmin()) {
            alert('Acción restringida: Se requieren permisos de Administrador.');
            return;
        }

        if (confirm(`¿Estás seguro de cambiar los permisos/rol de este usuario a "${newRole}" en Supabase?`)) {
            try {
                if (window.rdslpSupabase && window.rdslpSupabase.changeUserRole) {
                    await window.rdslpSupabase.changeUserRole(userId, newRole);
                } else {
                    auth.changeUserRole(userId, newRole);
                }
                const activeTab = document.querySelector('.admin-tab.active');
                await renderUserList(activeTab ? activeTab.dataset.tab : 'all-users');
            } catch (err) {
                alert('Error al actualizar rol en Supabase: ' + err.message);
                const activeTab = document.querySelector('.admin-tab.active');
                await renderUserList(activeTab ? activeTab.dataset.tab : 'all-users');
            }
        } else {
            const activeTab = document.querySelector('.admin-tab.active');
            await renderUserList(activeTab ? activeTab.dataset.tab : 'all-users');
        }
    };

    window.toggleBanUser = async function (userId, ban) {
        if (!checkIsAdmin()) {
            alert('Acción restringida: Se requieren permisos de Administrador.');
            return;
        }

        const action = ban ? 'banear' : 'desbanear';
        if (confirm(`¿Estás seguro de ${action} a este usuario en Supabase?`)) {
            try {
                if (window.rdslpSupabase && window.rdslpSupabase.toggleBanUser) {
                    await window.rdslpSupabase.toggleBanUser(userId, ban);
                } else {
                    if (ban) auth.banUser(userId); else auth.unbanUser(userId);
                }
                const activeTab = document.querySelector('.admin-tab.active');
                await renderUserList(activeTab ? activeTab.dataset.tab : 'all-users');
            } catch (err) {
                alert(`Error al ${action} usuario en Supabase: ` + err.message);
            }
        }
    };

    window.deleteCommunityAdmin = async function (eventId) {
        if (!checkIsAdmin()) {
            alert('Acción restringida: Se requieren permisos de Administrador.');
            return;
        }
        if (confirm('¿Estás seguro de eliminar esta comunidad / sala como administrador? Esta acción la removerá para todos los usuarios.')) {
            try {
                if (window.rdslpSupabase && window.rdslpSupabase.deleteCloudCommunity) {
                    await window.rdslpSupabase.deleteCloudCommunity(eventId);
                }
                if (typeof community !== 'undefined' && community.deleteEvent) {
                    community.deleteEvent(Number(eventId) || eventId, currentUser.id);
                } else {
                    let events = JSON.parse(localStorage.getItem('rdslp_events') || '[]');
                    events = events.filter(e => String(e.id) !== String(eventId));
                    localStorage.setItem('rdslp_events', JSON.stringify(events));
                }
                await renderUserList('created-communities');
            } catch (err) {
                alert('Error al eliminar comunidad: ' + err.message);
            }
        }
    };

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // =====================================================
    // MODAL DE PERFIL DE USUARIO DESDE PANEL ADMIN
    // =====================================================
    let currentProfileTarget = null;

    window.openUserProfileModal = function (targetId, targetName) {
        if (!targetId && !targetName) return;
        const targetUserId = String(targetId || targetName);
        const displayName = targetName || 'Usuario';

        let targetRole = 'usuario';
        if (String(targetId) === '1' || displayName.toLowerCase().includes('admin')) targetRole = 'admin';
        else if (String(targetId) === '2' || displayName.toLowerCase().includes('moderador')) targetRole = 'moderator';

        try {
            const allUsers = auth.getAllUsers ? auth.getAllUsers() : [];
            const found = allUsers.find(u => String(u.id) === targetUserId || u.name === displayName || u.email === targetUserId);
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
        const isMutual = currentUser && mgr && !isSelf ? mgr.isMutual(currentUser.id, targetUserId) : false;

        if (statMutualWrap) {
            statMutualWrap.style.display = isMutual ? 'inline-flex' : 'none';
        }

        if (socialActionsEl) {
            socialActionsEl.innerHTML = `
                <a href="muro.html?userId=${encodeURIComponent(targetUserId)}&userName=${encodeURIComponent(displayName)}" class="btn-profile-follow" style="text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                    Ver en el Muro
                </a>
            `;
        }

        // Renderizar publicaciones del usuario
        const userPostsListEl = document.getElementById('modalUserPostsList');
        if (userPostsListEl) {
            if (userPosts.length === 0) {
                userPostsListEl.innerHTML = `
                    <div style="text-align: center; padding: 30px; color: var(--text-muted);">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 8px;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line></svg>
                        <p>Este usuario no tiene publicaciones en el muro aún.</p>
                    </div>
                `;
            } else {
                userPostsListEl.innerHTML = userPosts.map(p => `
                    <div class="user-profile-post-card">
                        <div class="upp-header">
                            <span class="upp-type ${p.type}">${(p.type || 'post').toUpperCase()}</span>
                            <span class="upp-time">${p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ''}</span>
                        </div>
                        <div class="upp-content">
                            <p>${escapeHtml(p.content)}</p>
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

        switchDashboardProfileTab('posts');

        if (isAdmin && !isSelf) {
            renderDashboardSanctions(targetUserId);
        }

        modal.classList.add('active');
    };

    function switchDashboardProfileTab(tabName) {
        document.querySelectorAll('#userProfileModal .profile-modal-tabs .p-tab').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName || (tabName === 'admin' && btn.id === 'modalAdminTab'));
        });
        const postsTab = document.getElementById('tabPostsContent');
        const aboutTab = document.getElementById('tabAboutContent');
        const adminTab = document.getElementById('tabAdminContent');

        if (postsTab) postsTab.style.display = tabName === 'posts' ? 'block' : 'none';
        if (aboutTab) aboutTab.style.display = tabName === 'about' ? 'block' : 'none';
        if (adminTab) adminTab.style.display = tabName === 'admin' ? 'block' : 'none';
    }

    document.querySelectorAll('#userProfileModal .profile-modal-tabs .p-tab').forEach(btn => {
        btn.addEventListener('click', function () {
            const tab = this.dataset.tab || (this.id === 'modalAdminTab' ? 'admin' : 'posts');
            switchDashboardProfileTab(tab);
        });
    });

    const closeProfileBtn = document.getElementById('closeProfileModal');
    if (closeProfileBtn) {
        closeProfileBtn.addEventListener('click', () => {
            const m = document.getElementById('userProfileModal');
            if (m) m.classList.remove('active');
        });
    }

    function renderDashboardSanctions(userId) {
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
            renderDashboardSanctions(currentProfileTarget.id);
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
            renderDashboardSanctions(currentProfileTarget.id);
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
            renderDashboardSanctions(currentProfileTarget.id);
        } else {
            alert(res.message || 'Error al levantar sanciones.');
        }
    };

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
                renderDashboardSanctions(currentProfileTarget.id);
            } else {
                alert(res.message || 'Error al emitir aviso.');
            }
        });
    }

    // Refresh admin user list when users are added/updated
    window.addEventListener('userListUpdated', () => {
        if (checkIsAdmin()) {
            const activeTab = document.querySelector('.admin-tab.active');
            renderUserList(activeTab ? activeTab.dataset.tab : 'all-users');
        }
    });

    // ========== SECCIÓN DE AYUDA Y SOPORTE TÉCNICO ==========
    let ayudaInitialized = false;
    async function loadAyudaSection() {
        const statusBox = document.getElementById('ayudaAccountStatusBox');
        const messagesContainer = document.getElementById('supportChatMessages');
        const chatForm = document.getElementById('supportChatForm');
        const chatInput = document.getElementById('supportChatInput');

        if (!statusBox || !messagesContainer) return;

        // 1. Mostrar estado de moderación/cuenta del usuario actual
        if (currentUser) {
            try {
                if (window.socialModeration) {
                    const status = window.socialModeration.getUserSanctions(currentUser.id);
                    if (status.isBanned) {
                        statusBox.innerHTML = `
                            <div style="color: #ef4444; font-weight: 600; display: flex; align-items: center; gap: 6px;">
                                <span>⛔</span> Cuenta Suspendida / Baneada
                            </div>
                            <p style="margin: 6px 0 0 0; color: #f87171; font-size: 12px;">Motivo: ${escapeHtml(status.banReason || 'Infracción de normas')} (${status.banExpires ? 'Expira: ' + new Date(status.banExpires).toLocaleDateString() : 'Permanente'})</p>
                        `;
                    } else if (status.isMuted) {
                        statusBox.innerHTML = `
                            <div style="color: #fbbf24; font-weight: 600; display: flex; align-items: center; gap: 6px;">
                                <span>🔇</span> Chat y Comentarios Silenciados
                            </div>
                            <p style="margin: 6px 0 0 0; color: #fde68a; font-size: 12px;">Motivo: ${escapeHtml(status.muteReason || 'Infracción')} (${status.muteExpires ? 'Expira: ' + new Date(status.muteExpires).toLocaleDateString() : 'Permanente'})</p>
                        `;
                    } else if (status.warnings && status.warnings.length > 0) {
                        statusBox.innerHTML = `
                            <div style="color: #f59e0b; font-weight: 600; display: flex; align-items: center; gap: 6px;">
                                <span>⚠️</span> ${status.warnings.length} Aviso(s) Disciplinario(s)
                            </div>
                            <p style="margin: 6px 0 0 0; color: var(--text-secondary); font-size: 11.5px;">Último aviso: ${escapeHtml(status.warnings[status.warnings.length - 1].reason)}</p>
                        `;
                    } else {
                        statusBox.innerHTML = `
                            <div style="color: #10b981; font-weight: 600; display: flex; align-items: center; gap: 6px;">
                                <span>🟢</span> Cuenta en Excelente Estado
                            </div>
                            <p style="margin: 6px 0 0 0; color: var(--text-muted); font-size: 11.5px;">Sin strikes ni sanciones registradas.</p>
                        `;
                    }
                }
            } catch (e) {}
        }

        // 2. Cargar mensajes del chat
        async function renderChat() {
            if (!window.rdslpNotifications) return;
            const msgs = await window.rdslpNotifications.getSupportMessages();
            messagesContainer.innerHTML = msgs.map(m => {
                const isUser = m.senderRole === 'user';
                const isAdmin = m.senderRole === 'admin';
                const isBot = m.senderRole === 'bot';
                const bubbleClass = isUser ? 'user' : (isAdmin ? 'admin' : 'bot');
                const timeStr = m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                return `
                    <div class="support-bubble ${bubbleClass}">
                        <div style="font-weight: 600; font-size: 12px; margin-bottom: 3px; color: ${isAdmin ? '#c084fc' : (isBot ? '#818cf8' : '#ffffff')};">
                            ${escapeHtml(m.senderName)}
                        </div>
                        <div>${escapeHtml(m.message)}</div>
                        <div class="support-bubble-meta">
                            <span>${timeStr}</span>
                            ${isAdmin ? '<span>· Oficial</span>' : ''}
                        </div>
                    </div>
                `;
            }).join('');
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        await renderChat();

        if (!ayudaInitialized && chatForm && chatInput) {
            chatForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const text = chatInput.value.trim();
                if (!text) return;
                chatInput.value = '';
                await window.rdslpNotifications.sendSupportMessage(text);
                await renderChat();
            });

            window.addEventListener('rdslp_support_updated', () => {
                renderChat();
            });
            ayudaInitialized = true;
        }
    }

    window.replyToSupportTicket = async function (ticketId, userName) {
        const text = prompt(`Escribe la respuesta oficial para ${userName}:`);
        if (!text || !text.trim()) return;
        if (window.rdslpNotifications && window.rdslpNotifications.sendSupportMessage) {
            await window.rdslpNotifications.sendSupportMessage(text.trim(), ticketId);
            alert(`✅ Respuesta enviada exitosamente a ${userName}.`);
            renderUserList('support-tickets');
        }
    };

    window.handleSendBroadcast = async function (e) {
        if (e && e.preventDefault) e.preventDefault();
        if (!checkIsAdmin()) {
            alert('Acción restringida: Se requieren permisos de Administrador.');
            return;
        }

        const titleInput = document.getElementById('broadcastTitle');
        const bodyInput = document.getElementById('broadcastBody');
        const typeSelect = document.getElementById('broadcastType');
        const linkInput = document.getElementById('broadcastLink');
        const submitBtn = document.getElementById('btnSubmitBroadcast');

        if (!titleInput || !bodyInput) return;
        const title = titleInput.value.trim();
        const body = bodyInput.value.trim();
        const link = linkInput ? linkInput.value.trim() : '';
        const typeChoice = typeSelect ? typeSelect.value : '📢 Anuncio General';

        if (!title || !body) {
            alert('Por favor completa el título y el mensaje del comunicado.');
            return;
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>⏳ Emitiendo a todos...</span>';
        }

        try {
            let avatar = '📢';
            if (typeChoice.includes('🚀')) avatar = '🚀';
            else if (typeChoice.includes('⚠️')) avatar = '⚠️';
            else if (typeChoice.includes('🏆')) avatar = '🏆';

            if (window.rdslpNotifications && window.rdslpNotifications.createNotification) {
                await window.rdslpNotifications.createNotification({
                    userId: 'all', // Llega a todos los usuarios de la plataforma
                    senderName: '🛡️ Administrador',
                    senderAvatar: avatar,
                    type: 'broadcast',
                    title: title,
                    body: body,
                    link: link || '../Static/comunidad.html'
                });
            }

            // Guardar en el historial de comunicados del administrador
            const historyKey = 'rdslp_broadcast_history';
            const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
            history.unshift({
                id: 'b_' + Date.now(),
                title,
                body,
                link,
                date: new Date().toISOString()
            });
            localStorage.setItem(historyKey, JSON.stringify(history.slice(0, 30)));

            // Limpiar inputs
            if (titleInput) titleInput.value = '';
            if (bodyInput) bodyInput.value = '';
            if (linkInput) linkInput.value = '';

            // Actualizar campanita de notificaciones de inmediato
            if (window.rdslpNotifications && window.rdslpNotifications.updateBellUI) {
                await window.rdslpNotifications.updateBellUI();
            }

            alert('✅ ¡Comunicado global emitido exitosamente!\nHa sido enviado a la campanita de notificaciones de toda la comunidad.');
            renderUserList('broadcast-announcements');
        } catch (err) {
            alert('Error al emitir comunicado: ' + (err.message || 'Error desconocido'));
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span>🚀 Enviar a Toda la Comunidad</span>';
            }
        }
    };
});


