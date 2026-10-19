/* =====================================================
   RDSLP - Módulo Específico: MongoDB
   DatabasesSection_js/mongodb.js
===================================================== */
document.addEventListener('DOMContentLoaded', function () {
    const config = {
        id: "db-mongodb",
        name: "MongoDB",
        abbr: "MG",
        type: "mongodb",
        file: "mongodb.html",
        category: "norelacional",
        color: "#47a248",
        tagline: "La base de datos de documentos NoSQL por excelencia",
        description: "MongoDB almacena datos en documentos BSON similares a JSON con esquemas flexibles. Es perfecta para desarrollo rápido de aplicaciones web, móviles y analítica en tiempo real.",
        features: [
            "Documentos BSON con estructuras anidadas y arreglos nativos",
            "Sharding horizontal automático para petabytes de datos",
            "Aggregation Framework extremadamente potente para pipelines de datos",
            "Indexación secundaria y soporte geoespacial 2DSphere"
        ],
        tags: ["NoSQL", "Documentos", "BSON", "Escalable", "JSON"],
        code: `// Ejemplo en MongoDB Shell\ndb.usuarios.insertOne({\n    nombre: "Juan Perez",\n    email: "juan@ejemplo.com",\n    intereses: ["Node.js", "Bases de Datos", "Docker"],\n    activo: true\n});\n\ndb.usuarios.find({ intereses: "Node.js" }).pretty();`
    };

    if (window.DatabaseDetailManager) {
        window.DatabaseDetailManager.init(config);
    } else {
        console.error("DatabaseDetailManager no está cargado.");
    }
});
