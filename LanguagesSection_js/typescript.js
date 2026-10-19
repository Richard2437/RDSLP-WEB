/* =====================================================
   RDSLP - Módulo Específico: TypeScript
   LanguagesSection_js/typescript.js
===================================================== */

document.addEventListener('DOMContentLoaded', function () {
    const config = {
    "file": "typescript.js",
    "html": "typescript.html",
    "id": "lang-typescript",
    "name": "TypeScript",
    "abbr": "TS",
    "colorClass": "typescript",
    "tagline": "JavaScript con superpoderes de tipado estático",
    "intro": "TypeScript es un superset de código abierto creado por Microsoft que agrega tipos estáticos opcionales a JavaScript. Permite detectar errores en tiempo de edición, ofreciendo autocompletado avanzado y refactorizaciones seguras en aplicaciones de gran escala.",
    "uses": [
        "Grandes aplicaciones frontend (React, Angular, Next.js)",
        "Servicios y APIs backend empresariales (NestJS, Express TS)",
        "Librerías de código abierto y paquetes NPM modernos",
        "Desarrollo Fullstack Type-Safe (tRPC, Prisma)"
    ],
    "example": "// TypeScript: Interfaces y tipos genéricos\ninterface RespuestaServidor<T> {\n    estado: 'exito' | 'error';\n    datos: T;\n    timestamp: number;\n}\n\ninterface PerfilUsuario {\n    id: string;\n    nombre: string;\n    esAdmin: boolean;\n}\n\nfunction procesarRespuesta(resp: RespuestaServidor<PerfilUsuario>): void {\n    if (resp.estado === 'exito') {\n        console.log(`Cargado usuario: ${resp.datos.nombre}`);\n    }\n}\n"
};

    if (window.LanguageDetailManager) {
        window.LanguageDetailManager.init(config);
    } else {
        console.error("LanguageDetailManager no está cargado.");
    }
});
