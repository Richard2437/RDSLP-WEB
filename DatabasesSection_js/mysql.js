/* =====================================================
   RDSLP - Módulo Específico: MySQL
   DatabasesSection_js/mysql.js
===================================================== */
document.addEventListener('DOMContentLoaded', function () {
    const config = {
        id: "db-mysql",
        name: "MySQL",
        abbr: "MY",
        type: "mysql",
        file: "mysql.html",
        category: "relacional",
        color: "#4479a1",
        tagline: "El motor relacional open source más utilizado del mundo",
        description: "Base de datos relacional robusta con soporte ACID mediante InnoDB, replicación primaria-secundaria e indexación avanzada. Utilizada masivamente en la web por plataformas como WordPress, Meta y Twitter.",
        features: [
            "Motor InnoDB con transacciones ACID e integridad referencial",
            "Indexación B-Tree, Hash, Spatial (GIS) y Full-Text",
            "Replicación Primaria-Secundaria y Grupo de Replicación",
            "Soporte nativo JSON y funciones analíticas (Window Functions)"
        ],
        tags: ["SQL", "InnoDB", "ACID", "Web", "OpenSource"],
        code: `-- Ejemplo de DDL y DML en MySQL\nCREATE TABLE usuarios (\n    id INT AUTO_INCREMENT PRIMARY KEY,\n    nombre VARCHAR(100) NOT NULL,\n    email VARCHAR(100) UNIQUE NOT NULL,\n    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nINSERT INTO usuarios (nombre, email) VALUES ('Ana López', 'ana@ejemplo.com');\nSELECT id, nombre, email FROM usuarios WHERE email LIKE '%@ejemplo.com';`
    };

    if (window.DatabaseDetailManager) {
        window.DatabaseDetailManager.init(config);
    } else {
        console.error("DatabaseDetailManager no está cargado.");
    }
});
