/* =====================================================
   RDSLP - Módulo Específico: Neo4j
   DatabasesSection_js/neo4j.js
===================================================== */
document.addEventListener('DOMContentLoaded', function () {
    const config = {
        id: "db-neo4j",
        name: "Neo4j",
        abbr: "N4",
        type: "neo4j",
        file: "neo4j.html",
        category: "norelacional",
        color: "#008cc1",
        tagline: "Base de datos de grafos nativa para relaciones complejas",
        description: "Neo4j es la base de datos de grafos nativa líder que permite almacenar nodos y relaciones directamente sin costosos JOINs. Es ideal para redes sociales, recomendadores, análisis de fraude y grafos de conocimiento.",
        features: [
            "Almacenamiento y motor de procesamiento nativo de grafos",
            "Lenguaje declarativo potente Cypher enfocado en patrones de grafos",
            "Búsquedas de caminos más cortos (Shortest Path) y algoritmos de centralidad",
            "Transacciones ACID completas con alta disponibilidad en clúster Causal"
        ],
        tags: ["Grafos", "Cypher", "Redes", "Relaciones", "NoSQL"],
        code: `// Consultas Cypher en Neo4j\nMATCH (u:Usuario {nombre: "Laura"})-[:SIGUE]->(amigo:Usuario)\nRETURN amigo.nombre AS Siguiendo;\n\n// Encontrar sugerencias de amigos (amigos de amigos)\nMATCH (u:Usuario {nombre: "Laura"})-[:SIGUE*2]-(sugerencia:Usuario)\nRETURN sugerencia.nombre, count(*) ORDER BY count(*) DESC;`
    };

    if (window.DatabaseDetailManager) {
        window.DatabaseDetailManager.init(config);
    } else {
        console.error("DatabaseDetailManager no está cargado.");
    }
});
