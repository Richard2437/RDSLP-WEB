/* =====================================================
   RDSLP - Módulo Específico: C++
   LanguagesSection_js/cpp.js
===================================================== */

document.addEventListener('DOMContentLoaded', function () {
    const config = {
    "file": "cpp.js",
    "html": "cpp.html",
    "id": "lang-cpp",
    "name": "C++",
    "abbr": "C++",
    "colorClass": "cpp",
    "tagline": "Rendimiento extremo, control directo y abstracción sin coste",
    "intro": "C++ es el lenguaje predilecto cuando cada ciclo de reloj y cada byte de memoria cuentan. Diseñado por Bjarne Stroustrup, ofrece control total de hardware, punteros inteligentes, plantillas metaprogramadas y máxima eficiencia de ejecución.",
    "uses": [
        "Motores de videojuegos AAA (Unreal Engine, CryEngine)",
        "Sistemas operativos, controladores de dispositivos (drivers) y sistemas embebidos",
        "Sistemas de Trading de Alta Frecuencia (HFT) e infraestructura financiera",
        "Navegadores web, bases de datos (Chromium, MySQL, PostgreSQL core)"
    ],
    "example": "// C++: Manejo moderno de memoria y RAII\n#include <iostream>\n#include <vector>\n#include <memory>\n\nclass Sensor {\npublic:\n    void leerDatos() { std::cout << \"Sensor transmitiendo telemetria en tiempo real.\" << std::endl; }\n};\n\nint main() {\n    auto sensorPtr = std::make_unique<Sensor>();\n    sensorPtr->leerDatos();\n    return 0;\n}\n"
};

    if (window.LanguageDetailManager) {
        window.LanguageDetailManager.init(config);
    } else {
        console.error("LanguageDetailManager no está cargado.");
    }
});
