/* =====================================================
   RDSLP - JavaScript de Libros
===================================================== */

document.addEventListener('DOMContentLoaded', function () {
    const auth = window.authManager;
    const content = window.contentManager;
    let currentUser = null;

    init();

    function init() {
        checkAuth();
        loadUserData();
        loadLibrosContent();
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
        document.getElementById('userAvatar').textContent = currentUser.name?.charAt(0).toUpperCase() || 'U';
        document.getElementById('userName').textContent = currentUser.name || 'Usuario';
    }

    function setupEventListeners() {
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            auth.logout();
            window.location.href = 'login.html';
        });

        document.getElementById('closeModal')?.addEventListener('click', () => {
            document.getElementById('contentModal').classList.remove('active');
        });
    }

    async function loadLibrosContent() {
        const grid = document.getElementById('librosGrid');
        if (!grid) return;

        let dbLibros = [];
        try {
            const res = await fetch('http://localhost:3000/api/libros');
            const data = await res.json();
            if (data.success) {
                dbLibros = data.libros.map(b => ({
                    id: 'db-' + b.id,
                    title: b.titulo,
                    author: b.autor || b.autor_subida,
                    description: b.descripcion,
                    cover: 'db-cover'
                }));
            }
        } catch (e) {
            console.error('Error cargando libros de BD:', e);
        }

        const defaultLibros = [
            { id: 'book-1', title: 'Clean Code', author: 'Robert C. Martin', description: 'Guía para escribir código limpio y mantenible.', cover: 'clean-code' },
            { id: 'book-2', title: 'Design Patterns', author: 'Gang of Four', description: 'Los 23 patrones de diseño fundamentales.', cover: 'design-patterns' },
            { id: 'book-3', title: 'Introduction to Algorithms', author: 'CLRS', description: 'La biblia de algoritmos y estructuras de datos.', cover: 'algorithms' },
            { id: 'book-4', title: 'The Pragmatic Programmer', author: 'David Thomas', description: 'Consejos prácticos para programadores.', cover: 'pragmatic' },
            { id: 'book-5', title: 'Refactoring', author: 'Martin Fowler', description: 'Técnicas para mejorar código existente.', cover: 'refactoring' },
            { id: 'book-6', title: 'Domain-Driven Design', author: 'Eric Evans', description: 'Modelado del dominio en software.', cover: 'ddd' }
        ];

        const todosLibros = [...dbLibros, ...defaultLibros];

        grid.innerHTML = todosLibros.map(book => {
            const rating = content.getAverageRating(book.id);
            const userRating = currentUser ? content.getUserRating(book.id, currentUser.id) : 0;
            const abbr = book.title.split(' ').map(w => w[0]).join('').substring(0, 2);
            
            let starsHtml = '<div class="stars" style="display:inline-flex; gap:2px; margin-right:8px;">';
            for (let i = 1; i <= 5; i++) {
                starsHtml += `<svg class="star-rating" data-rating="${i}" data-content="${book.id}" width="16" height="16" viewBox="0 0 24 24" fill="${i <= userRating ? 'var(--warning-color)' : 'none'}" stroke="var(--warning-color)" stroke-width="2" style="cursor:pointer;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
            }
            starsHtml += '</div>';

            return `
                <div class="book-card" data-id="${book.id}">
                    <div class="book-cover ${book.cover}">${abbr}</div>
                    <div class="book-info">
                        <h3>${book.title}</h3>
                        <p class="book-author">${book.author}</p>
                        <p class="book-description">${book.description}</p>
                        <div class="book-rating" style="display:flex; align-items:center; margin-top:8px;">
                            ${starsHtml}
                            <span class="rating-value" style="font-size:12px; color:var(--text-secondary);">${rating.average} (${rating.count})</span>
                        </div>
                        <button class="book-btn" onclick="openBookModal('${book.id}', '${book.title}')" style="margin-top:12px;">Ver detalles</button>
                    </div>
                </div>
            `;
        }).join('');

        // Eventos para las estrellas
        document.querySelectorAll('.star-rating').forEach(star => {
            star.addEventListener('click', function (e) {
                e.stopPropagation();
                if (!currentUser) {
                    alert('Debes iniciar sesión para calificar');
                    return;
                }
                const contentId = this.dataset.content;
                const ratingVal = parseInt(this.dataset.rating);
                content.rateContent(contentId, ratingVal, currentUser.id);
                loadLibrosContent();
            });
        });
    }

    window.abrirModalSubirLibro = function() {
        if (!currentUser) {
            alert('Debes iniciar sesión para subir un libro');
            return;
        }
        const modal = document.getElementById('contentModal');
        document.getElementById('modalTitle').textContent = 'Subir Nuevo Libro';
        document.getElementById('modalBody').innerHTML = `
            <div style="display:flex; flex-direction:column; gap:12px;">
                <input type="text" id="nuevoLibroTitulo" placeholder="Título del Libro" style="padding:10px; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-input); color:var(--text-primary);">
                <input type="text" id="nuevoLibroAutor" placeholder="Autor del Libro" style="padding:10px; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-input); color:var(--text-primary);">
                <textarea id="nuevoLibroDesc" placeholder="Breve descripción" style="padding:10px; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-input); color:var(--text-primary); height:80px;"></textarea>
                <input type="text" id="nuevoLibroUrl" placeholder="URL (Opcional)" style="padding:10px; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-input); color:var(--text-primary);">
                <button onclick="guardarLibro()" style="background:var(--accent-primary); color:white; padding:10px; border:none; border-radius:6px; cursor:pointer;">Guardar Libro</button>
            </div>
        `;
        modal.classList.add('active');
    };

    window.guardarLibro = async function() {
        const titulo = document.getElementById('nuevoLibroTitulo').value;
        const autor = document.getElementById('nuevoLibroAutor').value;
        const descripcion = document.getElementById('nuevoLibroDesc').value;
        const url = document.getElementById('nuevoLibroUrl').value;

        if(!titulo) return alert('El título es obligatorio');

        try {
            const res = await fetch('http://localhost:3000/api/libros', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ titulo, autor, descripcion, url, usuario_id: currentUser.id })
            });
            const data = await res.json();
            if(data.success) {
                alert('Libro subido con éxito');
                document.getElementById('contentModal').classList.remove('active');
                loadLibrosContent();
            } else {
                alert('Error al subir libro');
            }
        } catch(e) {
            console.error(e);
            alert('Error al subir libro');
        }
    };

    window.openBookModal = function (id, title) {
        const modal = document.getElementById('contentModal');
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalBody').innerHTML = `
            <p>Una lectura esencial para todo desarrollador.</p>
            <h4 style="margin: 20px 0 12px;">Por qué leerlo:</h4>
            <ul style="padding-left: 20px; color: var(--text-secondary);">
                <li>Conceptos fundamentales bien explicados</li>
                <li>Ejemplos prácticos</li>
                <li>Referencia para consultas futuras</li>
            </ul>
        `;
        modal.classList.add('active');
    };
});
