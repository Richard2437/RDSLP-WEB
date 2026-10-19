/* =====================================================
   RDSLP - Módulo Específico: JavaScript
   LanguagesSection_js/javascript.js
===================================================== */

document.addEventListener('DOMContentLoaded', function () {
    const config = {
    "file": "javascript.js",
    "html": "javascript.html",
    "id": "lang-javascript",
    "name": "JavaScript",
    "abbr": "JS",
    "colorClass": "javascript",
    "tagline": "El motor del navegador y la web moderna",
    "intro": "JavaScript es el lenguaje de programación esencial de la World Wide Web. Es dinámico, basado en prototipos y orientado a eventos. Gracias a motores como V8 y plataformas como Node.js, impulsa desde interfaces reactivas de usuario hasta servidores de alto rendimiento.",
    "uses": [
        "Desarrollo Frontend SPA y SSR (React, Next.js, Vue, Angular, Svelte)",
        "Backend y microservicios orientados a eventos (Node.js, Express, NestJS)",
        "Aplicaciones móviles multiplataforma (React Native, Capacitor)",
        "Aplicaciones de escritorio (Electron, Tauri)"
    ],
    "example": "// JavaScript: Asincronía con async/await y manipulación de datos\nasync function obtenerDatosUsuario(id) {\n    try {\n        const respuesta = await fetch(`https://api.ejemplo.com/users/${id}`);\n        const usuario = await respuesta.json();\n        console.log(`Usuario: ${usuario.nombre}, Rol: ${usuario.rol}`);\n        return usuario;\n    } catch (error) {\n        console.error(\"Error al consultar usuario:\", error);\n    }\n}\n"
};

    if (window.LanguageDetailManager) {
        window.LanguageDetailManager.init(config);
    } else {
        console.error("LanguageDetailManager no está cargado.");
    }
});
