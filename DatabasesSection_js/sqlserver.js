/* =====================================================
   RDSLP - Módulo Específico: SQL Server
   DatabasesSection_js/sqlserver.js
===================================================== */
document.addEventListener('DOMContentLoaded', function () {
    const config = {
        id: "db-sqlserver",
        name: "SQL Server",
        abbr: "MS",
        type: "sqlserver",
        file: "sqlserver.html",
        category: "relacional",
        color: "#cc2927",
        tagline: "Plataforma empresarial integral de Microsoft con Azure",
        description: "Microsoft SQL Server ofrece seguridad líder en la industria, disponibilidad continua y herramientas avanzadas de Business Intelligence. Se integra de forma fluida con la plataforma .NET y servicios en la nube Microsoft Azure.",
        features: [
            "T-SQL (Transact-SQL) con procedimientos almacenados complejos y triggeers",
            "Integración nativa con Azure SQL Database y SSIS (Integration Services)",
            "Grupos de disponibilidad Always On para alta disponibilidad y desastres",
            "Encriptación transparente de datos (TDE) y celda de seguridad Always Encrypted"
        ],
        tags: ["T-SQL", "Enterprise", "Azure", ".NET", "Microsoft"],
        code: `-- Ejemplo en SQL Server T-SQL\nSELECT TOP 10 \n    c.Nombre,\n    COUNT(o.Id) AS TotalOrdenes,\n    SUM(o.Monto) AS TotalGastado\nFROM Clientes c\nINNER JOIN Ordenes o ON c.Id = o.ClienteId\nGROUP BY c.Nombre\nHAVING SUM(o.Monto) > 1000\nORDER BY TotalGastado DESC;`
    };

    if (window.DatabaseDetailManager) {
        window.DatabaseDetailManager.init(config);
    } else {
        console.error("DatabaseDetailManager no está cargado.");
    }
});
