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
        userAvatar.textContent = initial;
        userName.textContent = currentUser.name || 'Usuario';

        // Badge de rol
        const roleNames = {
            'admin': 'Administrador',
            'moderator': 'Moderador',
            'user': 'Usuario'
        };
        userRoleBadge.textContent = roleNames[currentUser.role] || 'Usuario';
        userRoleBadge.className = 'user-role-badge ' + currentUser.role;
    }

    // Configurar UI basada en rol
    function setupRoleBasedUI() {
        if (!currentUser) return;

        // Mostrar panel de admin solo para admins
        if (currentUser.role === 'admin' && adminNavItem) {
            adminNavItem.style.display = 'block';
        }
    }

    // Configurar event listeners
    function setupEventListeners() {
        // Toggle sidebar
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });

        // Mobile menu
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('mobile-open');
        });

        // Cerrar sidebar al hacer clic fuera en mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 900) {
                if (!sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                    sidebar.classList.remove('mobile-open');
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
                    sidebar.classList.remove('mobile-open');
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
        logoutBtn.addEventListener('click', logout);

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

        const titles = {
            'home': 'Inicio',
            'logica': 'Lógica de Programación',
            'lenguajes': 'Lenguajes de Programación',
            'databases': 'Bases de Datos',
            'libros': 'Libros Recomendados',
            'comunidad': 'Comunidad',
            'perfil': 'Mi Perfil',
            'admin': 'Panel de Administración'
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
                loadChatMessages(this.dataset.chat);
            });
        });
    }

    function loadChatMessages(chatId = 'general') {
        const container = document.getElementById('chatMessages');
        if (!container) return;

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

    function sendMessage() {
        const input = document.getElementById('chatInput');
        if (!input || !input.value.trim()) return;

        if (!currentUser) {
            alert('Debes iniciar sesión para enviar mensajes');
            return;
        }

        // Obtener el chat activo
        const activeTab = document.querySelector('.chat-tab.active');
        const chatId = activeTab ? activeTab.dataset.chat : 'general';

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

    async function loadAdminPanel() {
        // Tabs logic
        const tabs = document.querySelectorAll('.admin-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
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

        // Initial render
        await renderUserList('active-users');
    }

    async function renderUserList(filter) {
        const usersList = document.getElementById('adminUsersList');
        const listTitle = document.getElementById('adminListTitle');

        if (!usersList) return;

        usersList.innerHTML = '<div style="padding: 20px; color: var(--text-secondary); text-align: center;"><div class="loader-small" style="display: inline-block; margin-right: 8px;"></div> Cargando usuarios desde Supabase...</div>';

        let allUsers = [];
        try {
            if (window.rdslpSupabase) {
                allUsers = await window.rdslpSupabase.getAllUsers();
            } else {
                allUsers = auth.getAllUsers();
            }
        } catch (err) {
            console.error('Error cargando usuarios:', err);
            usersList.innerHTML = `<div style="padding: 20px; color: #ef4444; text-align: center;">Error al conectar con Supabase: ${escapeHtml(err.message)}</div>`;
            return;
        }

        // Actualizar contador
        const totalUsersEl = document.getElementById('totalUsers');
        if (totalUsersEl) totalUsersEl.textContent = allUsers.length;

        const totalCommentsEl = document.getElementById('totalComments');
        if (totalCommentsEl && typeof content !== 'undefined') {
            totalCommentsEl.textContent = content.getComments ? content.getComments().length : 0;
        }

        const totalEventsEl = document.getElementById('totalEvents');
        if (totalEventsEl && typeof community !== 'undefined') {
            totalEventsEl.textContent = community.getEvents ? community.getEvents().length : 0;
        }

        let usersToRender = [];
        if (filter === 'active-users') {
            usersToRender = allUsers.filter(u => !u.isBanned && u.role !== 'banned');
            listTitle.textContent = 'Usuarios Activos (' + usersToRender.length + ')';
        } else {
            usersToRender = allUsers.filter(u => u.isBanned || u.role === 'banned');
            listTitle.textContent = 'Usuarios Baneados (' + usersToRender.length + ')';
        }

        if (usersToRender.length === 0) {
            usersList.innerHTML = '<p style="color: var(--text-muted); padding: 25px; text-align: center;">No hay usuarios en esta lista.</p>';
            return;
        }

        usersList.innerHTML = usersToRender.map(u => {
            const isSelf = currentUser && (u.id === currentUser.id || u.email === currentUser.email);
            const isAdmin = u.role === 'admin';
            const isBanned = u.isBanned || u.role === 'banned';

            // Select de roles
            let roleSelect = '';
            if (!isSelf && !isBanned) {
                roleSelect = `
                    <select onchange="changeUserRole('${u.id}', this.value)" class="role-select" style="padding: 6px 10px; border-radius: 6px; background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-color); margin-right: 10px; cursor: pointer;">
                        <option value="user" ${u.role === 'user' ? 'selected' : ''}>Usuario</option>
                        <option value="moderator" ${u.role === 'moderator' ? 'selected' : ''}>Moderador</option>
                        <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Administrador</option>
                    </select>
                `;
            } else {
                roleSelect = `<span class="user-role-badge ${u.role}" style="margin-right: 10px; padding: 4px 10px; border-radius: 6px; font-size: 12px; background: rgba(99,102,241,0.15); color: #818cf8;">${u.role}</span>`;
            }

            // Botón de ban / desbanear
            let banBtn = '';
            if (!isSelf && !isAdmin) {
                if (isBanned) {
                    banBtn = `<button onclick="toggleBanUser('${u.id}', false)" style="padding: 6px 14px; border-radius: 6px; background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3); cursor: pointer; font-weight: 500;">Desbanear</button>`;
                } else {
                    banBtn = `<button onclick="toggleBanUser('${u.id}', true)" style="padding: 6px 14px; border-radius: 6px; background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); cursor: pointer; font-weight: 500;">Banear</button>`;
                }
            }

            const initial = (u.name ? u.name.charAt(0) : 'U').toUpperCase();

            return `
                <div class="user-item" style="display: flex; align-items: center; justify-content: space-between; padding: 16px; border-bottom: 1px solid var(--border-color); transition: background 0.2s;">
                    <div class="user-info" style="display: flex; align-items: center; gap: 15px;">
                        <div class="user-avatar-small" style="width: 42px; height: 42px; background: var(--gradient-primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">${initial}</div>
                        <div>
                            <div class="user-name" style="font-weight: 600; color: var(--text-primary);">${escapeHtml(u.name)} ${isSelf ? '<span style="color: #818cf8; font-size: 12px;">(Tú)</span>' : ''}</div>
                            <div class="user-email" style="font-size: 13px; color: var(--text-secondary);">${escapeHtml(u.email)}</div>
                        </div>
                    </div>
                    <div class="user-actions" style="display: flex; align-items: center;">
                        ${roleSelect}
                        ${banBtn}
                    </div>
                </div>
            `;
        }).join('');
    }

    // Funciones globales para admin conectadas con Supabase
    window.changeUserRole = async function (userId, newRole) {
        if (!currentUser || currentUser.role !== 'admin') return;

        if (confirm(`¿Estás seguro de cambiar los permisos/rol de este usuario a "${newRole}" en Supabase?`)) {
            try {
                if (window.rdslpSupabase) {
                    await window.rdslpSupabase.changeUserRole(userId, newRole);
                } else {
                    auth.changeUserRole(userId, newRole);
                }
                const activeTab = document.querySelector('.admin-tab.active');
                await renderUserList(activeTab ? activeTab.dataset.tab : 'active-users');
            } catch (err) {
                alert('Error al actualizar rol en Supabase: ' + err.message);
                const activeTab = document.querySelector('.admin-tab.active');
                await renderUserList(activeTab ? activeTab.dataset.tab : 'active-users');
            }
        } else {
            const activeTab = document.querySelector('.admin-tab.active');
            await renderUserList(activeTab ? activeTab.dataset.tab : 'active-users');
        }
    };

    window.toggleBanUser = async function (userId, ban) {
        if (!currentUser || currentUser.role !== 'admin') return;

        const action = ban ? 'banear' : 'desbanear';
        if (confirm(`¿Estás seguro de ${action} a este usuario en Supabase?`)) {
            try {
                if (window.rdslpSupabase) {
                    await window.rdslpSupabase.toggleBanUser(userId, ban);
                } else {
                    if (ban) auth.banUser(userId); else auth.unbanUser(userId);
                }
                const activeTab = document.querySelector('.admin-tab.active');
                await renderUserList(activeTab ? activeTab.dataset.tab : 'active-users');
            } catch (err) {
                alert(`Error al ${action} usuario en Supabase: ` + err.message);
            }
        }
    };

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
// Refresh admin user list when users are added/updated
window.addEventListener('userListUpdated', () => {
    if (currentUser && currentUser.role === 'admin') {
        const activeTab = document.querySelector('.admin-tab.active');
        renderUserList(activeTab ? activeTab.dataset.tab : 'active-users');
        const users = auth.getAllUsers();
        document.getElementById('totalUsers').textContent = users.length;
    }
});
});

