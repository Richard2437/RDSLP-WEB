/* =====================================================
   RDSLP - JavaScript de Lógica de Programación
===================================================== */

document.addEventListener('DOMContentLoaded', function () {
    const auth = window.authManager;
    const content = window.contentManager;
    let currentUser = null;
    let currentFilter = 'all';

    const defaultLogicaItems = [
        {
            id: 'logica-1',
            title: 'Algoritmos Básicos y Pensamiento Secuencial',
            description: 'Aprende los fundamentos de los algoritmos y cómo descomponer problemas complejos paso a paso.',
            level: 'beginner',
            lessons: 8,
            duration: '2 horas',
            explanation: 'Un algoritmo es una secuencia finita de instrucciones no ambiguas para resolver un problema. Los tres pilares esenciales son entrada, proceso y salida.',
            code: `// Pseudocódigo: Búsqueda del mayor de dos números\nInicio\n    Leer numero1\n    Leer numero2\n    Si numero1 > numero2 Entonces\n        Escribir "El mayor es ", numero1\n    Sino\n        Escribir "El mayor es ", numero2\n    FinSi\nFin`
        },
        {
            id: 'logica-2',
            title: 'Variables, Memoria y Tipos de Datos',
            description: 'Comprende el almacenamiento en memoria, asignación, mutabilidad y tipos primitivos vs complejos.',
            level: 'beginner',
            lessons: 6,
            duration: '1.5 horas',
            explanation: 'Las variables son referencias simbólicas a direcciones en la memoria RAM con un tipo y tamaño determinado.',
            code: `// Ejemplo conceptual de tipos de datos\nentero edad = 25\nflotante pi = 3.14159\ntexto saludo = "Hola RDSLP"\nbooleano activo = Verdadero`
        },
        {
            id: 'logica-3',
            title: 'Estructuras de Control y Bucles',
            description: 'Domina condicionales simples y múltiples (if-else, switch) e iteradores (for, while, do-while).',
            level: 'intermediate',
            lessons: 10,
            duration: '3 horas',
            explanation: 'El flujo de un programa deja de ser puramente lineal gracias a la bifurcación condicional y la repetición controlada.',
            code: `// Bucle para sumar primeros N números\nentero n = 10\nentero suma = 0\nPara i desde 1 hasta n Hacer\n    suma = suma + i\nFinPara\nEscribir "La suma total es: ", suma`
        },
        {
            id: 'logica-4',
            title: 'Funciones, Ámbito y Modularidad',
            description: 'Aprende el principio DRY (Don\'t Repeat Yourself), parámetros por valor/referencia y scopes.',
            level: 'intermediate',
            lessons: 12,
            duration: '4 horas',
            explanation: 'Las funciones encapsulan lógica reutilizable, reciben entradas (parámetros) y retornan resultados predecibles sin efectos secundarios no deseados.',
            code: `// Función para verificar si un número es par\nFuncion esPar(entero num) -> Booleano\n    Retornar (num MOD 2 == 0)\nFinFuncion`
        },
        {
            id: 'logica-5',
            title: 'Recursividad y Casos Base',
            description: 'Comprende la pila de llamadas (call stack), el caso base de parada y algoritmos divisivos.',
            level: 'advanced',
            lessons: 8,
            duration: '3 horas',
            explanation: 'Una función recursiva se llama a sí misma reduciendo progresivamente el tamaño de la entrada hasta alcanzar el caso base.',
            code: `// Cálculo recursivo del Factorial\nFuncion factorial(entero n) -> Entero\n    Si n <= 1 Entonces\n        Retornar 1 // Caso base\n    Sino\n        Retornar n * factorial(n - 1) // Paso recursivo\n    FinSi\nFinFuncion`
        },
        {
            id: 'logica-6',
            title: 'Estructuras de Datos Fundamentales',
            description: 'Arrays, pilas (LIFO), colas (FIFO), tablas hash y conceptos básicos de árboles y grafos.',
            level: 'advanced',
            lessons: 15,
            duration: '6 horas',
            explanation: 'La forma en que se organizan los datos determina directamente la eficiencia computacional de búsqueda, inserción y borrado.',
            code: `// Operaciones clásicas de Pila (Stack)\nPila pilaNumeros = nueva Pila()\npilaNumeros.push(10)\npilaNumeros.push(20)\nentero cima = pilaNumeros.pop() // Retorna 20`
        },
        {
            id: 'logica-7',
            title: 'Pseudocódigo y Especificación Formal',
            description: 'Aprende a planificar la arquitectura de algoritmos en lenguaje natural antes de escribir código.',
            level: 'beginner',
            lessons: 5,
            duration: '1 hora',
            explanation: 'El pseudocódigo es el puente entre el razonamiento humano y la sintaxis estricta de cualquier lenguaje de programación.',
            code: `// Pseudocódigo estándar\nAlgoritmo PromedioNotas\n    Dimension notas[3]\n    notas[1] = 85\n    notas[2] = 90\n    notas[3] = 95\n    promedio = (notas[1] + notas[2] + notas[3]) / 3\n    Escribir "Promedio: ", promedio\nFinAlgoritmo`
        },
        {
            id: 'logica-8',
            title: 'Diagramas de Flujo y Notación UML',
            description: 'Visualiza la toma de decisiones, bucles y transiciones mediante símbolos estandarizados.',
            level: 'beginner',
            lessons: 4,
            duration: '1 hora',
            explanation: 'Los diagramas de flujo utilizan figuras geométricas (óvalos, rombos, rectángulos) para representar gráficamente el proceso algorítmico.',
            code: `// Representación de decisiones\n[Óvalo Inicio] -> [Rectángulo Leer Datos] -> <Rombo ¿Edad >= 18?>\n  |-- SI --> [Imprimir "Mayor de Edad"]\n  |-- NO --> [Imprimir "Menor de Edad"]`
        },
        {
            id: 'logica-9',
            title: 'Complejidad Algorítmica y Big O',
            description: 'Aprende a medir el tiempo y espacio asintótico: O(1), O(log n), O(n), O(n²) y cómo optimizar.',
            level: 'advanced',
            lessons: 10,
            duration: '4 horas',
            explanation: 'La notación Big O describe el comportamiento del tiempo de ejecución o espacio consumido a medida que el tamaño de entrada (n) crece hacia el infinito.',
            code: `// Búsqueda lineal O(n) vs Búsqueda Binaria O(log n)\n// Un arreglo ordenado de 1,000,000 elementos:\n// - Búsqueda lineal: hasta 1,000,000 operaciones\n// - Búsqueda binaria: máximo ~20 comparaciones`
        }
    ];

    init();

    function init() {
        checkAuth();
        loadUserData();
        loadLogicaContent();
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

    function getCustomLogica() {
        try {
            return JSON.parse(localStorage.getItem('rdslp_custom_logica') || '[]');
        } catch (e) {
            return [];
        }
    }

    function saveCustomLogica(item) {
        const list = getCustomLogica();
        list.push(item);
        localStorage.setItem('rdslp_custom_logica', JSON.stringify(list));
    }

    function getAllLogica() {
        const custom = getCustomLogica();
        return [...defaultLogicaItems, ...custom];
    }

    function setupEventListeners() {
        // Logout
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            if (auth) auth.logout();
            window.location.href = 'login.html';
        });

        // Filtros
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                currentFilter = this.dataset.filter;
                filterContent(currentFilter);
            });
        });

        // Modal
        document.getElementById('closeModal')?.addEventListener('click', closeModal);
        document.getElementById('contentModal')?.addEventListener('click', function (e) {
            if (e.target === this) closeModal();
        });
    }

    function loadLogicaContent() {
        const grid = document.getElementById('logicaGrid');
        if (!grid) return;

        const all = getAllLogica();
        grid.innerHTML = all.map(item => createLogicaCard(item)).join('');
        setupRatingListeners();
    }

    function filterContent(level) {
        const cards = document.querySelectorAll('.logica-card');
        cards.forEach(card => {
            if (level === 'all' || card.dataset.level === level) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    function createLogicaCard(item) {
        const levelNames = { 'beginner': 'Básico', 'intermediate': 'Intermedio', 'advanced': 'Avanzado' };
        const rating = content ? content.getAverageRating(item.id) : { average: '5.0', count: 1 };
        const userRating = (currentUser && content) ? content.getUserRating(item.id, currentUser.id) : 0;

        let starsHtml = '<div class="stars" style="display:inline-flex; gap:3px;">';
        for (let i = 1; i <= 5; i++) {
            starsHtml += `
                <svg class="star-rating-logica" data-rating="${i}" data-content="${item.id}" width="15" height="15" viewBox="0 0 24 24" fill="${i <= userRating ? '#f59e0b' : 'none'}" stroke="#f59e0b" stroke-width="2" style="cursor:pointer;">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
            `;
        }
        starsHtml += '</div>';

        return `
            <div class="logica-card" data-id="${item.id}" data-level="${item.level}">
                <div class="logica-card-header">
                    <span class="badge badge-${item.level}">${levelNames[item.level] || 'General'}</span>
                    <div class="logica-card-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="16 18 22 12 16 6"></polyline>
                            <polyline points="8 6 2 12 8 18"></polyline>
                        </svg>
                    </div>
                </div>
                <h3>${escapeHtml(item.title)}</h3>
                <p>${escapeHtml(item.description)}</p>
                <div class="logica-card-meta">
                    <span>${item.lessons} lecciones</span>
                    <span>${item.duration}</span>
                </div>
                <div class="logica-card-rating" style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px; padding-top: 10px; border-top: 1px solid var(--border-color);">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        ${starsHtml}
                        <span class="rating-value" style="font-size: 12px; color: var(--text-muted);">${rating.average} (${rating.count})</span>
                    </div>
                </div>
                <button class="logica-card-btn" onclick="window.openLogicaModal('${item.id}')" style="margin-top: 12px; width: 100%;">Ver lección y ejercicios</button>
            </div>
        `;
    }

    function setupRatingListeners() {
        document.querySelectorAll('.star-rating-logica').forEach(star => {
            star.addEventListener('click', function (e) {
                e.stopPropagation();
                if (!currentUser) {
                    alert('Debes iniciar sesión para calificar');
                    return;
                }
                const contentId = this.dataset.content;
                const ratingVal = parseInt(this.dataset.rating, 10);
                if (content) {
                    content.rateContent(contentId, ratingVal, currentUser.id);
                    loadLogicaContent();
                    filterContent(currentFilter);
                }
            });
        });
    }

    // Modal Subir Tema / Ejercicio (Igual que en libros)
    window.abrirModalSubirLogica = function () {
        if (!currentUser) {
            alert('Debes iniciar sesión para subir un tema o ejercicio');
            return;
        }

        const modal = document.getElementById('contentModal');
        document.getElementById('modalTitle').textContent = 'Subir Nuevo Tema o Ejercicio de Lógica';
        document.getElementById('modalBody').innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 14px;">
                <div>
                    <label style="font-size: 13px; color: var(--text-secondary); display: block; margin-bottom: 6px;">Título del Tema o Reto *</label>
                    <input type="text" id="nuevoLogicaTitulo" placeholder="Ej: Algoritmo de Dijkstra, Tablas de Verdad, Torres de Hanoi..." style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-input); color: var(--text-primary); box-sizing: border-box;">
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                    <div>
                        <label style="font-size: 13px; color: var(--text-secondary); display: block; margin-bottom: 6px;">Dificultad *</label>
                        <select id="nuevoLogicaNivel" style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-input); color: var(--text-primary); box-sizing: border-box;">
                            <option value="beginner">Básico</option>
                            <option value="intermediate" selected>Intermedio</option>
                            <option value="advanced">Avanzado</option>
                        </select>
                    </div>
                    <div>
                        <label style="font-size: 13px; color: var(--text-secondary); display: block; margin-bottom: 6px;">Nº Lecciones</label>
                        <input type="number" id="nuevoLogicaLecciones" value="6" min="1" max="50" style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-input); color: var(--text-primary); box-sizing: border-box;">
                    </div>
                    <div>
                        <label style="font-size: 13px; color: var(--text-secondary); display: block; margin-bottom: 6px;">Duración Est.</label>
                        <input type="text" id="nuevoLogicaDuracion" value="2 horas" style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-input); color: var(--text-primary); box-sizing: border-box;">
                    </div>
                </div>
                <div>
                    <label style="font-size: 13px; color: var(--text-secondary); display: block; margin-bottom: 6px;">Descripción y Objetivo *</label>
                    <textarea id="nuevoLogicaDesc" placeholder="Explica de qué trata este concepto o desafío lógico..." style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-input); color: var(--text-primary); height: 75px; box-sizing: border-box;"></textarea>
                </div>
                <div>
                    <label style="font-size: 13px; color: var(--text-secondary); display: block; margin-bottom: 6px;">Explicación y Pseudocódigo / Código</label>
                    <textarea id="nuevoLogicaCodigo" placeholder="// Escribe aquí el algoritmo o pseudocódigo guiado..." style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-input); color: var(--text-primary); height: 95px; font-family: monospace; box-sizing: border-box;"></textarea>
                </div>
                <button type="button" onclick="window.guardarTemaLogica()" style="background: var(--accent-primary); color: white; padding: 12px; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; margin-top: 6px;">
                    Publicar Tema de Lógica
                </button>
            </div>
        `;
        modal.classList.add('active');
    };

    window.guardarTemaLogica = function () {
        const titulo = document.getElementById('nuevoLogicaTitulo')?.value.trim();
        const nivel = document.getElementById('nuevoLogicaNivel')?.value;
        const lecciones = parseInt(document.getElementById('nuevoLogicaLecciones')?.value || '5', 10);
        const duracion = document.getElementById('nuevoLogicaDuracion')?.value.trim() || '1 hora';
        const desc = document.getElementById('nuevoLogicaDesc')?.value.trim();
        const codigo = document.getElementById('nuevoLogicaCodigo')?.value.trim();

        if (!titulo || !desc) {
            alert('El título y la descripción son obligatorios.');
            return;
        }

        const nuevoItem = {
            id: 'logica-' + Date.now(),
            title: titulo,
            description: desc,
            level: nivel,
            lessons: lecciones,
            duration: duracion,
            explanation: desc,
            code: codigo || `// Pseudocódigo del algoritmo ${titulo}\nInicio\n    // Lógica propuesta por ${currentUser.name}\nFin`,
            author: currentUser.name,
            createdAt: new Date().toISOString()
        };

        saveCustomLogica(nuevoItem);
        closeModal();
        loadLogicaContent();
        filterContent(currentFilter);
        alert(`¡Tema de lógica "${titulo}" publicado con éxito!`);
    };

    // Modal de Detalle
    window.openLogicaModal = function (itemId) {
        const all = getAllLogica();
        const item = all.find(i => i.id === itemId);
        if (!item) return;

        const modal = document.getElementById('contentModal');
        document.getElementById('modalTitle').textContent = item.title;
        document.getElementById('modalBody').innerHTML = `
            <div style="margin-bottom: 20px;">
                <p style="font-size: 14px; color: var(--text-secondary); line-height: 1.6;">${escapeHtml(item.explanation || item.description)}</p>
            </div>
            ${item.code ? `
                <h4 style="margin-bottom: 10px; font-size: 15px;">Pseudocódigo / Algoritmo:</h4>
                <div style="background: #111827; border: 1px solid var(--border-color); border-radius: 8px; padding: 14px; margin-bottom: 20px; overflow-x: auto;">
                    <pre style="margin: 0; font-family: monospace; font-size: 13px; color: #e5e7eb;">${escapeHtml(item.code)}</pre>
                </div>
            ` : ''}
            <div style="margin-bottom: 20px;">
                <h4 style="margin-bottom: 8px; font-size: 15px;">Pasos recomendados para resolver:</h4>
                <ol style="padding-left: 20px; color: var(--text-secondary); font-size: 13px; line-height: 1.8;">
                    <li>Identificar claramente las variables de entrada y el tipo de salida requerida.</li>
                    <li>Trazar una prueba de escritorio (seguimiento manual en papel con valores de prueba).</li>
                    <li>Considerar los casos borde (listas vacías, números negativos, ceros).</li>
                    <li>Escribir una implementación limpia y modular.</li>
                </ol>
            </div>
            ${getCommentsSection(item.id)}
        `;
        modal.classList.add('active');
    };

    function getCommentsSection(contentId) {
        const comments = content ? content.getComments(contentId) : [];
        return `
            <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--border-color);">
                <h4 style="margin-bottom: 14px; font-size: 15px;">Comentarios y Discusión (${comments.length})</h4>
                <div style="display: flex; gap: 10px; margin-bottom: 16px;">
                    <input type="text" id="newComment" placeholder="Comparte una duda, optimización o aporte sobre este tema..." style="flex: 1; padding: 10px 14px; background: var(--bg-input); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 13px;">
                    <button onclick="window.addCommentLogica('${contentId}')" style="padding: 10px 20px; background: var(--accent-primary); border: none; border-radius: 8px; color: white; font-weight: 600; cursor: pointer;">Enviar</button>
                </div>
                <div id="commentsList">
                    ${comments.length === 0
                        ? '<p style="color: var(--text-muted); font-size: 13px;">Sé el primero en compartir tu pensamiento o solución.</p>'
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

    window.addCommentLogica = function (contentId) {
        const input = document.getElementById('newComment');
        if (!input || !input.value.trim()) return;
        if (!currentUser) {
            alert('Debes iniciar sesión para comentar.');
            return;
        }
        if (content) {
            content.addComment(contentId, input.value.trim(), currentUser.id, currentUser.name);
            input.value = '';
            window.openLogicaModal(contentId);
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
