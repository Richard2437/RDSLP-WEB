/* =====================================================
   RDSLP - Módulo Específico: Redis
   DatabasesSection_js/redis.js
===================================================== */
document.addEventListener('DOMContentLoaded', function () {
    const config = {
        id: "db-redis",
        name: "Redis",
        abbr: "RD",
        type: "redis",
        file: "redis.html",
        category: "norelacional",
        color: "#dc382d",
        tagline: "Almacenamiento en memoria ultrarrápido y caché distribuida",
        description: "Redis (Remote Dictionary Server) es una base de datos clave-valor en memoria de respuesta sub-milisegundo. Es la opción estándar para caché de sesiones, colas de tareas y tableros en tiempo real.",
        features: [
            "Respuesta en submilisegundos basada en almacenamiento en RAM",
            "Estructuras de datos enriquecidas (Strings, Hashes, Lists, Sets, Sorted Sets, Bitmaps)",
            "Persistencia en disco configurable (Snapshots RDB y Append-Only File AOF)",
            "Mensajería Pub/Sub y Streams de alta velocidad"
        ],
        tags: ["En Memoria", "Caché", "Clave-Valor", "Rápido", "PubSub"],
        code: `# Comandos en Redis CLI\nSET sesion:usuario_42 "token_jwt_activo" EX 3600\nGET sesion:usuario_42\n\nHSET usuario:42 nombre "Carlos" visitas 15\nHINCRBY usuario:42 visitas 1`
    };

    if (window.DatabaseDetailManager) {
        window.DatabaseDetailManager.init(config);
    } else {
        console.error("DatabaseDetailManager no está cargado.");
    }
});
