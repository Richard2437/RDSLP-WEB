/* =====================================================
   RDSLP - Módulo Específico: Cassandra
   DatabasesSection_js/cassandra.js
===================================================== */
document.addEventListener('DOMContentLoaded', function () {
    const config = {
        id: "db-cassandra",
        name: "Apache Cassandra",
        abbr: "CS",
        type: "cassandra",
        file: "cassandra.html",
        category: "norelacional",
        color: "#1287b1",
        tagline: "Base de datos distribuida de columnas anchas para Big Data",
        description: "Apache Cassandra es una base de datos NoSQL distribuida diseñada para manejar grandes volúmenes de datos a través de muchos servidores sin punto único de falla (single point of failure).",
        features: [
            "Arquitectura descentralizada Masterless con topología Anillo (Ring)",
            "Escalabilidad lineal horizontal sin degradación del rendimiento",
            "Escrituras ultrarrápidas a escala planetaria optimizadas en memtables y SSTables",
            "Lenguaje de consulta CQL (Cassandra Query Language) similar a SQL"
        ],
        tags: ["Big Data", "Distribuida", "Columnar", "High Write", "NoSQL"],
        code: `-- Consulta en CQL (Cassandra Query Language)\nCREATE KEYSPACE red_social \nWITH replication = {'class': 'SimpleStrategy', 'replication_factor': 3};\n\nSELECT * FROM red_social.publicaciones WHERE usuario_id = 998 LIMIT 20;`
    };

    if (window.DatabaseDetailManager) {
        window.DatabaseDetailManager.init(config);
    } else {
        console.error("DatabaseDetailManager no está cargado.");
    }
});
