/* =====================================================
   RDSLP - Módulo Específico: PostgreSQL
   DatabasesSection_js/postgresql.js
===================================================== */
document.addEventListener('DOMContentLoaded', function () {
    const config = {
        id: "db-postgresql",
        name: "PostgreSQL",
        abbr: "PG",
        type: "postgresql",
        file: "postgresql.html",
        category: "relacional",
        color: "#336791",
        tagline: "La base de datos relacional de código abierto más avanzada",
        description: "PostgreSQL es un sistema de base de datos relacional de código abierto orientado a objetos con más de 30 años de desarrollo activo. Destaca por su fiabilidad, robustez en características y alto rendimiento.",
        features: [
            "Tipos de datos avanzados (JSONB, Arrays, HSTORE, UUID)",
            "Extensiones nativas potentes (PostGIS para GIS, pgvector para Inteligencia Artificial)",
            "Aislamiento de transacciones SSI (Serializable Snapshot Isolation)",
            "Concurrencia MVCC optimizada y consultas paralelas"
        ],
        tags: ["SQL", "JSONB", "PostGIS", "Extensible", "ACID"],
        code: `-- Ejemplo en PostgreSQL con consulta JSONB\nCREATE TABLE eventos (\n    id SERIAL PRIMARY KEY,\n    tipo VARCHAR(50),\n    payload JSONB\n);\n\nINSERT INTO eventos (tipo, payload) VALUES ('login', '{"ip": "192.168.1.1", "exito": true}');\nSELECT payload->>'ip' AS ip_cliente FROM eventos WHERE payload @> '{"exito": true}';`
    };

    if (window.DatabaseDetailManager) {
        window.DatabaseDetailManager.init(config);
    } else {
        console.error("DatabaseDetailManager no está cargado.");
    }
});
