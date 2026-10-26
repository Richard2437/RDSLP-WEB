/* =====================================================
   RDSLP - JavaScript de Lenguajes de Programación
   LanguagesSection_js/lenguajes.js
   ===================================================== */

import { getItem, setItem, getJSON, setJSON, removeItem } from "../JS/storage.js";

document.addEventListener('DOMContentLoaded', function () {
    const auth = window.authManager;
    const content = window.contentManager;
    let currentUser = null;

    const defaultLanguages = [
        { id: 'lang-python', name: 'Python', icon: 'python', abbr: 'PY', file: 'python.html', description: 'Lenguaje versátil ideal para ciencia de datos, machine learning, desarrollo web y automatización.', tags: ['Data Science', 'IA', 'Backend', 'Scripting'] },
        { id: 'lang-javascript', name: 'JavaScript', icon: 'javascript', abbr: 'JS', file: 'javascript.html', description: 'El lenguaje central de la web, indispensable en frontend (React, Vue) y backend con Node.js.', tags: ['Frontend', 'Backend', 'Fullstack', 'Web'] },
        { id: 'lang-java', name: 'Java', icon: 'java', abbr: 'JV', file: 'java.html', description: 'Plataforma empresarial de alto desempeño y base del ecosistema Android tradicional.', tags: ['Enterprise', 'Backend', 'Android', 'JVM'] },
        { id: 'lang-csharp', name: 'C#', icon: 'csharp', abbr: 'C#', file: 'csharp.html', description: 'Lenguaje potente del ecosistema .NET, desarrollo de videojuegos con Unity y servicios cloud.', tags: ['Unity', '.NET', 'Windows', 'Cloud'] },
        { id: 'lang-cpp', name: 'C++', icon: 'cpp', abbr: 'C++', file: 'cpp.html', description: 'Control de hardware y máximo rendimiento en sistemas operativos, motores gráficos e IoT.', tags: ['Sistemas', 'Videojuegos', 'Embedded', 'Performance'] },
        { id: 'lang-go', name: 'Go', icon: 'go', abbr: 'GO', file: 'go.html', description: 'Concurrencia nativa y simplicidad diseñada por Google para microservicios e infraestructura.', tags: ['Microservicios', 'Cloud', 'DevOps', 'Concurrencia'] },
        { id: 'lang-rust', name: 'Rust', icon: 'rust', abbr: 'RS', file: 'rust.html', description: 'Seguridad de memoria sin recolector de basura, velocidad extrema y arquitectura moderna.', tags: ['Seguridad', 'Sistemas', 'WebAssembly', 'Low-level'] },
        { id: 'lang-php', name: 'PHP', icon: 'php', abbr: 'PHP', file: 'php.html', description: 'El motor dominante de la web dinámica, frameworks modernos como Laravel y sistemas CMS.', tags: ['Web', 'Backend', 'Laravel', 'APIs'] },
        { id: 'lang-swift', name: 'Swift', icon: 'swift', abbr: 'SW', file: 'swift.html', description: 'Lenguaje elegante, intuitivo y veloz para aplicaciones en el ecosistema Apple (iOS, macOS).', tags: ['iOS', 'macOS', 'Mobile', 'Apple'] },
        { id: 'lang-kotlin', name: 'Kotlin', icon: 'kotlin', abbr: 'KT', file: 'kotlin.html', description: 'El lenguaje moderno estándar para desarrollo Android, interoperable al 100% con Java.', tags: ['Android', 'Mobile', 'Multiplatform', 'JVM'] },
        { id: 'lang-typescript', name: 'TypeScript', icon: 'typescript', abbr: 'TS', file: 'typescript.html', description: 'Superset tipado de JavaScript que añade robustez, interfaces y escala a aplicaciones grandes.', tags: ['Frontend', 'Backend', 'Tipado', 'Escalabilidad'] },
        { id: 'lang-ruby', name: 'Ruby', icon: 'ruby', abbr: 'RB', file: 'ruby.html', description: 'Enfocado en la felicidad del desarrollador y desarrollo ágil de aplicaciones con Ruby on Rails.', tags: ['Rails', 'Web', 'Startups', 'Productividad'] }
    ];

    init();

    async function init() {
        checkAuth();
        loadUserData();
        await loadLenguajes();
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

    async function getCustomLanguages() {
        return await getJSON('rdslp_custom_languages', []);
    }

    async function saveCustomLanguage(langObj) {
        const list = await getCustomLanguages();
        list.push(langObj);
        await setJSON('rdslp_custom_languages', list);
    }

    async function getAllLanguages() {
        const custom = await getCustomLanguages();
        return [...defaultLanguages, ...custom];
    }

    async function loadLenguajes(filterText = '') {
        const grid = document.getElementById('lenguajesGrid');
        if (!grid) return;
        const all = await getAllLanguages();
        const filtered = all.filter(l => {
            const query = filterText.toLowerCase();
            return l.name.toLowerCase().includes(query) ||
                l.description.toLowerCase().includes(query) ||
                l.tags.some(t => t.toLowerCase().includes(query));
        });
        if (filtered.length === 0) {
            grid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1; text-align:center; padding: 40px; color: var(--text-muted);">No se encontraron lenguajes coincidentes.</div>`;
            return;
        }
        grid.innerHTML = filtered.map(lang => renderLanguageCard(lang)).join('');
        setupStarEvents();
    }

    function renderLanguageCard(lang) {
        const rating = content ? content.getAverageRating(lang.id) : { average: '5.0', count: 1 };
        const userRating = (content && currentUser) ? content.getUserRating(lang.id, currentUser.id) : 0;
        const targetUrl = lang.file || `custom.html?id=${encodeURIComponent(lang.id)}`;
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            const isFilled = i <= userRating;
            starsHtml += `
                <svg class="star-icon" data-rating="${i}" data-lang="${lang.id}" width="15" height="15" viewBox="0 0 24 24" fill="${isFilled ? '#f59e0b' : 'none'}" stroke="#f59e0b" stroke-width="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
            `;
        }
        const tagsHtml = (lang.tags || []).map(t => `<span class="language-tag">${escapeHtml(t)}</span>`).join('');
        const iconClass = lang.icon || 'custom';
        const customStyle = lang.color ? `style="background: ${lang.color};"` : '';
        return `
            <div class="language-card" data-id="${lang.id}">
                <div>
                    <div class="language-card-top">
                        <div class="language-icon ${iconClass}" ${customStyle}>${escapeHtml(lang.abbr || lang.name.substring(0, 2).toUpperCase())}</div>
                        <div class="language-card-title">
                            <h3>${escapeHtml(lang.name)}</h3>
                            <span>${(lang.tags && lang.tags[0]) || 'Lenguaje'}</span>
                        </div>
                    </div>
                    <div class="language-card-body">
                        <p>${escapeHtml(lang.description)}</p>
                        <div class="language-tags">${tagsHtml}</div>
                    </div>
                </div>
                <div class="language-card-footer">
                    <div class="language-rating-row">
                        <div class="stars-rating-container">${starsHtml}</div>
                        <span class="rating-text">${rating.average} (${rating.count})</span>
                    </div>
                    <a href="${targetUrl}" class="language-btn">Explorar ${escapeHtml(lang.name)} &rarr;</a>
                </div>
            </div>
        `;
    }

    function setupStarEvents() {
        document.querySelectorAll('.star-icon').forEach(star => {
            star.addEventListener('click', async function (e) {
                e.preventDefault();
                e.stopPropagation();
                if (!currentUser) {
                    alert('Debes iniciar sesión para calificar');
                    return;
                }
                const langId = this.dataset.lang;
                const ratingVal = parseInt(this.dataset.rating, 10);
                if (content) {
                    await content.rateContent(langId, ratingVal, currentUser.id);
                    await loadLenguajes(document.getElementById('buscarLenguaje')?.value || '');
                }
            });
        });
    }

    function setupEventListeners() {
        // Logout
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            if (auth) auth.logout();
            window.location.href = '../Static/login.html';
        });
        // Búsqueda
        document.getElementById('buscarLenguaje')?.addEventListener('input', async function () {
            await loadLenguajes(this.value);
        });
        // Botón Subir Lenguaje
        document.getElementById('btnSubirLenguaje')?.addEventListener('click', () => {
            abrirModalSubirLenguaje();
        });
        // Cerrar Modal
        document.getElementById('closeModal')?.addEventListener('click', cerrarModal);
        document.getElementById('contentModal')?.addEventListener('click', function (e) {
            if (e.target === this) cerrarModal();
        });
    }

    function abrirModalSubirLenguaje() {
        if (!currentUser) {
            alert('Debes iniciar sesión para agregar un lenguaje');
            return;
        }
        const modal = document.getElementById('contentModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        modalTitle.textContent = 'Subir Nuevo Lenguaje de Programación';
        modalBody.innerHTML = `
            <form id="formNuevoLenguaje" onsubmit="return false;">
                <div class="form-group">
                    <label class="form-label">Nombre del Lenguaje *</label>
                    <input type="text" id="nuevoLangNombre" class="form-input" placeholder="Ej: Dart, Elixir, Scala, Julia..." required>
                </div>
                <div class="form-group">
                    <label class="form-label">Abreviatura / Siglas (2-3 letras) *</label>
                    <input type="text" id="nuevoLangAbbr" class="form-input" placeholder="Ej: DT, EX, SC, JL" maxlength="4" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Color Representativo (Hexadecimal o selección)</label>
                    <input type="color" id="nuevoLangColor" class="form-input" value="#6366f1">
                </div>
                <div class="form-group">
                    <label class="form-label">Etiquetas / Usos Principales (separados por coma)</label>
                    <input type="text" id="nuevoLangTags" class="form-input" placeholder="Ej: Frontend, Flutter, Mobile, Backend">
                </div>
                <div class="form-group">
                    <label class="form-label">Descripción General *</label>
                    <textarea id="nuevoLangDesc" class="form-textarea" placeholder="¿Para qué se utiliza y cuáles son sus ventajas principales?" required></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Código de Ejemplo Básico</label>
                    <textarea id="nuevoLangCodigo" class="form-textarea" placeholder="// Escribe un ejemplo representativo..."></textarea>
                </div>
                <button type="button" id="btnGuardarLenguaje" class="btn-submit-modal">Publicar Lenguaje</button>
            </form>
        `;
        document.getElementById('btnGuardarLenguaje')?.addEventListener('click', guardarNuevoLenguaje);
        modal.classList.add('active');
    }

    async function guardarNuevoLenguaje() {
        const nombre = document.getElementById('nuevoLangNombre').value.trim();
        const abbr = document.getElementById('nuevoLangAbbr').value.trim().toUpperCase();
        const color = document.getElementById('nuevoLangColor').value;
        const tagsInput = document.getElementById('nuevoLangTags').value.trim();
        const desc = document.getElementById('nuevoLangDesc').value.trim();
        const codigo = document.getElementById('nuevoLangCodigo').value.trim();
        if (!nombre || !abbr || !desc) {
            alert('Por favor completa todos los campos requeridos (*)');
            return;
        }
        const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(Boolean) : ['Desarrollo'];
        const langId = 'lang-' + nombre.toLowerCase().replace(/[^a-z0-9]/g, '');
        const newLang = {
            id: langId,
            name: nombre,
            abbr: abbr,
            color: color,
            icon: 'custom',
            description: desc,
            tags: tags,
            intro: desc,
            uses: tags,
            example: codigo || `// Ejemplo de código en ${nombre}\nconsole.log("Hola desde ${nombre}");`,
            createdBy: currentUser.name,
            createdAt: new Date().toISOString()
        };
        const langDetailsKey = 'rdslp_detail_' + langId;
        await setItem(langDetailsKey, JSON.stringify(newLang));
        await saveCustomLanguage(newLang);
        cerrarModal();
        await loadLenguajes();
        alert(`¡Lenguaje "${nombre}" subido con éxito! Ya puedes explorarlo y subir archivos.`);
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
   RDSLP - JavaScript de Lenguajes de Programación
   LanguagesSection_js/lenguajes.js
   ===================================================== */

import { getItem, setItem, getJSON, setJSON, removeItem } from "../JS/storage.js";

document.addEventListener('DOMContentLoaded', function () {
    const auth = window.authManager;
    const content = window.contentManager;
    let currentUser = null;

    const defaultLanguages = [
        { id: 'lang-python', name: 'Python', icon: 'python', abbr: 'PY', file: 'python.html', description: 'Lenguaje versátil ideal para ciencia de datos, machine learning, desarrollo web y automatización.', tags: ['Data Science', 'IA', 'Backend', 'Scripting'] },
        { id: 'lang-javascript', name: 'JavaScript', icon: 'javascript', abbr: 'JS', file: 'javascript.html', description: 'El lenguaje central de la web, indispensable en frontend (React, Vue) y backend con Node.js.', tags: ['Frontend', 'Backend', 'Fullstack', 'Web'] },
        { id: 'lang-java', name: 'Java', icon: 'java', abbr: 'JV', file: 'java.html', description: 'Plataforma empresarial de alto desempeño y base del ecosistema Android tradicional.', tags: ['Enterprise', 'Backend', 'Android', 'JVM'] },
        { id: 'lang-csharp', name: 'C#', icon: 'csharp', abbr: 'C#', file: 'csharp.html', description: 'Lenguaje potente del ecosistema .NET, desarrollo de videojuegos con Unity y servicios cloud.', tags: ['Unity', '.NET', 'Windows', 'Cloud'] },
        { id: 'lang-cpp', name: 'C++', icon: 'cpp', abbr: 'C++', file: 'cpp.html', description: 'Control de hardware y máximo rendimiento en sistemas operativos, motores gráficos e IoT.', tags: ['Sistemas', 'Videojuegos', 'Embedded', 'Performance'] },
        { id: 'lang-go', name: 'Go', icon: 'go', abbr: 'GO', file: 'go.html', description: 'Concurrencia nativa y simplicidad diseñada por Google para microservicios e infraestructura.', tags: ['Microservicios', 'Cloud', 'DevOps', 'Concurrencia'] },
        { id: 'lang-rust', name: 'Rust', icon: 'rust', abbr: 'RS', file: 'rust.html', description: 'Seguridad de memoria sin recolector de basura, velocidad extrema y arquitectura moderna.', tags: ['Seguridad', 'Sistemas', 'WebAssembly', 'Low-level'] },
        { id: 'lang-php', name: 'PHP', icon: 'php', abbr: 'PHP', file: 'php.html', description: 'El motor dominante de la web dinámica, frameworks modernos como Laravel y sistemas CMS.', tags: ['Web', 'Backend', 'Laravel', 'APIs'] },
        { id: 'lang-swift', name: 'Swift', icon: 'swift', abbr: 'SW', file: 'swift.html', description: 'Lenguaje elegante, intuitivo y veloz para aplicaciones en el ecosistema Apple (iOS, macOS).', tags: ['iOS', 'macOS', 'Mobile', 'Apple'] },
        { id: 'lang-kotlin', name: 'Kotlin', icon: 'kotlin', abbr: 'KT', file: 'kotlin.html', description: 'El lenguaje moderno estándar para desarrollo Android, interoperable al 100% con Java.', tags: ['Android', 'Mobile', 'Multiplatform', 'JVM'] },
        { id: 'lang-typescript', name: 'TypeScript', icon: 'typescript', abbr: 'TS', file: 'typescript.html', description: 'Superset tipado de JavaScript que añade robustez, interfaces y escala a aplicaciones grandes.', tags: ['Frontend', 'Backend', 'Tipado', 'Escalabilidad'] },
        { id: 'lang-ruby', name: 'Ruby', icon: 'ruby', abbr: 'RB', file: 'ruby.html', description: 'Enfocado en la felicidad del desarrollador y desarrollo ágil de aplicaciones con Ruby on Rails.', tags: ['Rails', 'Web', 'Startups', 'Productividad'] }
    ];

    init();

    async function init() {
        checkAuth();
        loadUserData();
        await loadLenguajes();
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

    async function getCustomLanguages() {
        return await getJSON('rdslp_custom_languages', []);
    }

    async function saveCustomLanguage(langObj) {
        const list = await getCustomLanguages();
        list.push(langObj);
        await setJSON('rdslp_custom_languages', list);
    }

    async function getAllLanguages() {
        const custom = await getCustomLanguages();
        return [...defaultLanguages, ...custom];
    }

    async function loadLenguajes(filterText = '') {
        const grid = document.getElementById('lenguajesGrid');
        if (!grid) return;
        const all = await getAllLanguages();
        const filtered = all.filter(l => {
            const query = filterText.toLowerCase();
            return l.name.toLowerCase().includes(query) ||
                l.description.toLowerCase().includes(query) ||
                l.tags.some(t => t.toLowerCase().includes(query));
        });
        if (filtered.length === 0) {
            grid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1; text-align:center; padding: 40px; color: var(--text-muted);">No se encontraron lenguajes coincidentes.</div>`;
            return;
        }
        grid.innerHTML = filtered.map(lang => renderLanguageCard(lang)).join('');
        setupStarEvents();
    }

    function renderLanguageCard(lang) {
        const rating = content ? content.getAverageRating(lang.id) : { average: '5.0', count: 1 };
        const userRating = (content && currentUser) ? content.getUserRating(lang.id, currentUser.id) : 0;
        const targetUrl = lang.file || `custom.html?id=${encodeURIComponent(lang.id)}`;
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            const isFilled = i <= userRating;
            starsHtml += `
                <svg class="star-icon" data-rating="${i}" data-lang="${lang.id}" width="15" height="15" viewBox="0 0 24 24" fill="${isFilled ? '#f59e0b' : 'none'}" stroke="#f59e0b" stroke-width="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
            `;
        }
        const tagsHtml = (lang.tags || []).map(t => `<span class="language-tag">${escapeHtml(t)}</span>`).join('');
        const iconClass = lang.icon || 'custom';
        const customStyle = lang.color ? `style="background: ${lang.color};"` : '';
        return `
            <div class="language-card" data-id="${lang.id}">
                <div>
                    <div class="language-card-top">
                        <div class="language-icon ${iconClass}" ${customStyle}>${escapeHtml(lang.abbr || lang.name.substring(0, 2).toUpperCase())}</div>
                        <div class="language-card-title">
                            <h3>${escapeHtml(lang.name)}</h3>
                            <span>${(lang.tags && lang.tags[0]) || 'Lenguaje'}</span>
                        </div>
                    </div>
                    <div class="language-card-body">
                        <p>${escapeHtml(lang.description)}</p>
                        <div class="language-tags">${tagsHtml}</div>
                    </div>
                </div>
                <div class="language-card-footer">
                    <div class="language-rating-row">
                        <div class="stars-rating-container">${starsHtml}</div>
                        <span class="rating-text">${rating.average} (${rating.count})</span>
                    </div>
                    <a href="${targetUrl}" class="language-btn">Explorar ${escapeHtml(lang.name)} &rarr;</a>
                </div>
            </div>
        `;
    }

    function setupStarEvents() {
        document.querySelectorAll('.star-icon').forEach(star => {
            star.addEventListener('click', async function (e) {
                e.preventDefault();
                e.stopPropagation();
                if (!currentUser) {
                    alert('Debes iniciar sesión para calificar');
                    return;
                }
                const langId = this.dataset.lang;
                const ratingVal = parseInt(this.dataset.rating, 10);
                if (content) {
                    await content.rateContent(langId, ratingVal, currentUser.id);
                    await loadLenguajes(document.getElementById('buscarLenguaje')?.value || '');
                }
            });
        });
    }

    function setupEventListeners() {
        // Logout
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            if (auth) auth.logout();
            window.location.href = '../Static/login.html';
        });
        // Búsqueda
        document.getElementById('buscarLenguaje')?.addEventListener('input', async function () {
            await loadLenguajes(this.value);
        });
        // Botón Subir Lenguaje
        document.getElementById('btnSubirLenguaje')?.addEventListener('click', () => {
            abrirModalSubirLenguaje();
        });
        // Cerrar Modal
        document.getElementById('closeModal')?.addEventListener('click', cerrarModal);
        document.getElementById('contentModal')?.addEventListener('click', function (e) {
            if (e.target === this) cerrarModal();
        });
    }

    function abrirModalSubirLenguaje() {
        if (!currentUser) {
            alert('Debes iniciar sesión para agregar un lenguaje');
            return;
        }
        const modal = document.getElementById('contentModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        modalTitle.textContent = 'Subir Nuevo Lenguaje de Programación';
        modalBody.innerHTML = `
            <form id="formNuevoLenguaje" onsubmit="return false;">
                <div class="form-group">
                    <label class="form-label">Nombre del Lenguaje *</label>
                    <input type="text" id="nuevoLangNombre" class="form-input" placeholder="Ej: Dart, Elixir, Scala, Julia..." required>
                </div>
                <div class="form-group">
                    <label class="form-label">Abreviatura / Siglas (2-3 letras) *</label>
                    <input type="text" id="nuevoLangAbbr" class="form-input" placeholder="Ej: DT, EX, SC, JL" maxlength="4" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Color Representativo (Hexadecimal o selección)</label>
                    <input type="color" id="nuevoLangColor" class="form-input" value="#6366f1">
                </div>
                <div class="form-group">
                    <label class="form-label">Etiquetas / Usos Principales (separados por coma)</label>
                    <input type="text" id="nuevoLangTags" class="form-input" placeholder="Ej: Frontend, Flutter, Mobile, Backend">
                </div>
                <div class="form-group">
                    <label class="form-label">Descripción General *</label>
                    <textarea id="nuevoLangDesc" class="form-textarea" placeholder="¿Para qué se utiliza y cuáles son sus ventajas principales?" required></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Código de Ejemplo Básico</label>
                    <textarea id="nuevoLangCodigo" class="form-textarea" placeholder="// Escribe un ejemplo representativo..."></textarea>
                </div>
                <button type="button" id="btnGuardarLenguaje" class="btn-submit-modal">Publicar Lenguaje</button>
            </form>
        `;
        document.getElementById('btnGuardarLenguaje')?.addEventListener('click', guardarNuevoLenguaje);
        modal.classList.add('active');
    }

    async function guardarNuevoLenguaje() {
        const nombre = document.getElementById('nuevoLangNombre').value.trim();
        const abbr = document.getElementById('nuevoLangAbbr').value.trim().toUpperCase();
        const color = document.getElementById('nuevoLangColor').value;
        const tagsInput = document.getElementById('nuevoLangTags').value.trim();
        const desc = document.getElementById('nuevoLangDesc').value.trim();
        const codigo = document.getElementById('nuevoLangCodigo').value.trim();
        if (!nombre || !abbr || !desc) {
            alert('Por favor completa todos los campos requeridos (*)');
            return;
        }
        const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(Boolean) : ['Desarrollo'];
        const langId = 'lang-' + nombre.toLowerCase().replace(/[^a-z0-9]/g, '');
        const newLang = {
            id: langId,
            name: nombre,
            abbr: abbr,
            color: color,
            icon: 'custom',
            description: desc,
            tags: tags,
            intro: desc,
            uses: tags,
            example: codigo || `// Ejemplo de código en ${nombre}\nconsole.log("Hola desde ${nombre}");`,
            createdBy: currentUser.name,
            createdAt: new Date().toISOString()
        };
        const langDetailsKey = 'rdslp_detail_' + langId;
        await setItem(langDetailsKey, JSON.stringify(newLang));
        await saveCustomLanguage(newLang);
        cerrarModal();
        await loadLenguajes();
        alert(`¡Lenguaje "${nombre}" subido con éxito! Ya puedes explorarlo y subir archivos.`);
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

   RDSLP - JavaScript de Lenguajes de Programación
   LanguagesSection_js/lenguajes.js
===================================================== */

document.addEventListener('DOMContentLoaded', function () {
    const auth = window.authManager;
    const content = window.contentManager;
    let currentUser = null;

    const defaultLanguages = [
        { id: 'lang-python', name: 'Python', icon: 'python', abbr: 'PY', file: 'python.html', description: 'Lenguaje versátil ideal para ciencia de datos, machine learning, desarrollo web y automatización.', tags: ['Data Science', 'IA', 'Backend', 'Scripting'] },
        { id: 'lang-javascript', name: 'JavaScript', icon: 'javascript', abbr: 'JS', file: 'javascript.html', description: 'El lenguaje central de la web, indispensable en frontend (React, Vue) y backend con Node.js.', tags: ['Frontend', 'Backend', 'Fullstack', 'Web'] },
        { id: 'lang-java', name: 'Java', icon: 'java', abbr: 'JV', file: 'java.html', description: 'Plataforma empresarial de alto desempeño y base del ecosistema Android tradicional.', tags: ['Enterprise', 'Backend', 'Android', 'JVM'] },
        { id: 'lang-csharp', name: 'C#', icon: 'csharp', abbr: 'C#', file: 'csharp.html', description: 'Lenguaje potente del ecosistema .NET, desarrollo de videojuegos con Unity y servicios cloud.', tags: ['Unity', '.NET', 'Windows', 'Cloud'] },
        { id: 'lang-cpp', name: 'C++', icon: 'cpp', abbr: 'C++', file: 'cpp.html', description: 'Control de hardware y máximo rendimiento en sistemas operativos, motores gráficos e IoT.', tags: ['Sistemas', 'Videojuegos', 'Embedded', 'Performance'] },
        { id: 'lang-go', name: 'Go', icon: 'go', abbr: 'GO', file: 'go.html', description: 'Concurrencia nativa y simplicidad diseñada por Google para microservicios e infraestructura.', tags: ['Microservicios', 'Cloud', 'DevOps', 'Concurrencia'] },
        { id: 'lang-rust', name: 'Rust', icon: 'rust', abbr: 'RS', file: 'rust.html', description: 'Seguridad de memoria sin recolector de basura, velocidad extrema y arquitectura moderna.', tags: ['Seguridad', 'Sistemas', 'WebAssembly', 'Low-level'] },
        { id: 'lang-php', name: 'PHP', icon: 'php', abbr: 'PHP', file: 'php.html', description: 'El motor dominante de la web dinámica, frameworks modernos como Laravel y sistemas CMS.', tags: ['Web', 'Backend', 'Laravel', 'APIs'] },
        { id: 'lang-swift', name: 'Swift', icon: 'swift', abbr: 'SW', file: 'swift.html', description: 'Lenguaje elegante, intuitivo y veloz para aplicaciones en el ecosistema Apple (iOS, macOS).', tags: ['iOS', 'macOS', 'Mobile', 'Apple'] },
        { id: 'lang-kotlin', name: 'Kotlin', icon: 'kotlin', abbr: 'KT', file: 'kotlin.html', description: 'El lenguaje moderno estándar para desarrollo Android, interoperable al 100% con Java.', tags: ['Android', 'Mobile', 'Multiplatform', 'JVM'] },
        { id: 'lang-typescript', name: 'TypeScript', icon: 'typescript', abbr: 'TS', file: 'typescript.html', description: 'Superset tipado de JavaScript que añade robustez, interfaces y escala a aplicaciones grandes.', tags: ['Frontend', 'Backend', 'Tipado', 'Escalabilidad'] },
        { id: 'lang-ruby', name: 'Ruby', icon: 'ruby', abbr: 'RB', file: 'ruby.html', description: 'Enfocado en la felicidad del desarrollador y desarrollo ágil de aplicaciones con Ruby on Rails.', tags: ['Rails', 'Web', 'Startups', 'Productividad'] }
    ];

    init();

    async function init() {
        checkAuth();
        loadUserData();
        await loadLenguajes();
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

    async function getCustomLanguages() {
        return await getJSON('rdslp_custom_languages', []);
    }

    async function saveCustomLanguage(langObj) {
        const list = await getCustomLanguages();
        list.push(langObj);
        await setJSON('rdslp_custom_languages', list);
    }

    async function getAllLanguages() {
        const custom = await getCustomLanguages();
        return [...defaultLanguages, ...custom];
    }

    async function loadLenguajes(filterText = '') {
        const grid = document.getElementById('lenguajesGrid');
        if (!grid) return;

        const all = await getAllLanguages();
        const filtered = all.filter(l => {
            const query = filterText.toLowerCase();
            return l.name.toLowerCase().includes(query) ||
                   l.description.toLowerCase().includes(query) ||
                   l.tags.some(t => t.toLowerCase().includes(query));
        });

        if (filtered.length === 0) {
            grid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1; text-align:center; padding: 40px; color: var(--text-muted);">No se encontraron lenguajes coincidentes.</div>`;
            return;
        }

        grid.innerHTML = filtered.map(lang => renderLanguageCard(lang)).join('');
        setupStarEvents();
    }

    function renderLanguageCard(lang) {
        const rating = content ? content.getAverageRating(lang.id) : { average: '5.0', count: 1 };
        const userRating = (content && currentUser) ? content.getUserRating(lang.id, currentUser.id) : 0;
        const targetUrl = lang.file || `custom.html?id=${encodeURIComponent(lang.id)}`;

        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            const isFilled = i <= userRating;
            starsHtml += `
                <svg class="star-icon" data-rating="${i}" data-lang="${lang.id}" width="15" height="15" viewBox="0 0 24 24" fill="${isFilled ? '#f59e0b' : 'none'}" stroke="#f59e0b" stroke-width="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
            `;
        }

        const tagsHtml = (lang.tags || []).map(t => `<span class="language-tag">${escapeHtml(t)}</span>`).join('');
        const iconClass = lang.icon || 'custom';
        const customStyle = lang.color ? `style="background: ${lang.color};"` : '';

        return `
            <div class="language-card" data-id="${lang.id}">
                <div>
                    <div class="language-card-top">
                        <div class="language-icon ${iconClass}" ${customStyle}>${escapeHtml(lang.abbr || lang.name.substring(0, 2).toUpperCase())}</div>
                        <div class="language-card-title">
                            <h3>${escapeHtml(lang.name)}</h3>
                            <span>${(lang.tags && lang.tags[0]) || 'Lenguaje'}</span>
                        </div>
                    </div>
                    <div class="language-card-body">
                        <p>${escapeHtml(lang.description)}</p>
                        <div class="language-tags">${tagsHtml}</div>
                    </div>
                </div>
                <div class="language-card-footer">
                    <div class="language-rating-row">
                        <div class="stars-rating-container">${starsHtml}</div>
                        <span class="rating-text">${rating.average} (${rating.count})</span>
                    </div>
                    <a href="${targetUrl}" class="language-btn">Explorar ${escapeHtml(lang.name)} &rarr;</a>
                </div>
            </div>
        `;
    }

    function setupStarEvents() {
        document.querySelectorAll('.star-icon').forEach(star => {
            star.addEventListener('click', async function (e) {
                e.preventDefault();
                e.stopPropagation();
                if (!currentUser) {
                    alert('Debes iniciar sesión para calificar');
                    return;
                }
                const langId = this.dataset.lang;
                const ratingVal = parseInt(this.dataset.rating, 10);
                if (content) {
                    content.rateContent(langId, ratingVal, currentUser.id);
                    loadLenguajes(document.getElementById('buscarLenguaje')?.value || '');
                }
            });
        });
    }

    function setupEventListeners() {
        // Logout
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            if (auth) auth.logout();
            window.location.href = '../Static/login.html';
        });

        // Búsqueda
        document.getElementById('buscarLenguaje')?.addEventListener('input', async function () {
            await loadLenguajes(this.value);
        });

        // Botón Subir Lenguaje
        document.getElementById('btnSubirLenguaje')?.addEventListener('click', () => {
            abrirModalSubirLenguaje();
        });

        // Cerrar Modal
        document.getElementById('closeModal')?.addEventListener('click', cerrarModal);
        document.getElementById('contentModal')?.addEventListener('click', function (e) {
            if (e.target === this) cerrarModal();
        });
    }

    function abrirModalSubirLenguaje() {
        if (!currentUser) {
            alert('Debes iniciar sesión para agregar un lenguaje');
            return;
        }

        const modal = document.getElementById('contentModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');

        modalTitle.textContent = 'Subir Nuevo Lenguaje de Programación';
        modalBody.innerHTML = `
            <form id="formNuevoLenguaje" onsubmit="return false;">
                <div class="form-group">
                    <label class="form-label">Nombre del Lenguaje *</label>
                    <input type="text" id="nuevoLangNombre" class="form-input" placeholder="Ej: Dart, Elixir, Scala, Julia..." required>
                </div>
                <div class="form-group">
                    <label class="form-label">Abreviatura / Siglas (2-3 letras) *</label>
                    <input type="text" id="nuevoLangAbbr" class="form-input" placeholder="Ej: DT, EX, SC, JL" maxlength="4" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Color Representativo (Hexadecimal o selección)</label>
                    <input type="color" id="nuevoLangColor" class="form-input" value="#6366f1">
                </div>
                <div class="form-group">
                    <label class="form-label">Etiquetas / Usos Principales (separados por coma)</label>
                    <input type="text" id="nuevoLangTags" class="form-input" placeholder="Ej: Frontend, Flutter, Mobile, Backend">
                </div>
                <div class="form-group">
                    <label class="form-label">Descripción General *</label>
                    <textarea id="nuevoLangDesc" class="form-textarea" placeholder="¿Para qué se utiliza y cuáles son sus ventajas principales?" required></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Código de Ejemplo Básico</label>
                    <textarea id="nuevoLangCodigo" class="form-textarea" placeholder="// Escribe un ejemplo representativo..."></textarea>
                </div>
                <button type="button" id="btnGuardarLenguaje" class="btn-submit-modal">Publicar Lenguaje</button>
            </form>
        `;

        document.getElementById('btnGuardarLenguaje')?.addEventListener('click', guardarNuevoLenguaje);
        modal.classList.ad    async function guardarNuevoLenguaje() {
        const nombre = document.getElementById('nuevoLangNombre').value.trim();
        const abbr = document.getElementById('nuevoLangAbbr').value.trim().toUpperCase();
        const color = document.getElementById('nuevoLangColor').value;
        const tagsInput = document.getElementById('nuevoLangTags').value.trim();
        const desc = document.getElementById('nuevoLangDesc').value.trim();
        const codigo = document.getElementById('nuevoLangCodigo').value.trim();

        if (!nombre || !abbr || !desc) {
            alert('Por favor completa todos los campos requeridos (*)');
            return;
        }

        const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(Boolean) : ['Desarrollo'];
        const langId = 'lang-' + nombre.toLowerCase().replace(/[^a-z0-9]/g, '');

        const newLang = {
            id: langId,
            name: nombre,
            abbr: abbr,
            color: color,
            icon: 'custom',
            description: desc,
            tags: tags,
            intro: desc,
            uses: tags,
            example: codigo || `// Ejemplo de código en ${nombre}\\nconsole.log("Hola desde ${nombre}");`,
            createdBy: currentUser.name,
            createdAt: new Date().toISOString()
        };

        const langDetailsKey = 'rdslp_detail_' + langId;
        await setItem(langDetailsKey, JSON.stringify(newLang));

        await saveCustomLanguage(newLang);
        cerrarModal();
        await loadLenguajes();
        alert(`¡Lenguaje "${nombre}" subido con éxito! Ya puedes explorarlo y subir archivos.`);
    }y subir archivos.`);
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
