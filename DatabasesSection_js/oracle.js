/* =====================================================
   RDSLP - Módulo Específico: Oracle DB
   DatabasesSection_js/oracle.js
===================================================== */
document.addEventListener('DOMContentLoaded', function () {
    const config = {
        id: "db-oracle",
        name: "Oracle DB",
        abbr: "OR",
        type: "oracle",
        file: "oracle.html",
        category: "relacional",
        color: "#f80000",
        tagline: "Líder en infraestructura de misión crítica corporativa",
        description: "Oracle Database es el estándar de oro para aplicaciones corporativas críticas en bancos, telecomunicaciones y gobiernos, ofreciendo máxima escalabilidad, rendimiento y disponibilidad.",
        features: [
            "Arquitectura Multitenant (PDB/CDB) para consolidación de bases de datos",
            "Oracle Real Application Clusters (RAC) para clústeres activo-activo",
            "Lenguaje procedimental PL/SQL de máximo rendimiento",
            "Oracle Data Guard para réplicas y recuperación ante desastres"
        ],
        tags: ["PL/SQL", "Banking", "Clustering", "Corporativo", "Enterprise"],
        code: `-- Ejemplo en Oracle PL/SQL\nDECLARE\n    v_total NUMBER;\nBEGIN\n    SELECT COUNT(*) INTO v_total FROM empleados WHERE departamento_id = 10;\n    DBMS_OUTPUT.PUT_LINE('Total de empleados en el departamento 10: ' || v_total);\nEND;`
    };

    if (window.DatabaseDetailManager) {
        window.DatabaseDetailManager.init(config);
    } else {
        console.error("DatabaseDetailManager no está cargado.");
    }
});
