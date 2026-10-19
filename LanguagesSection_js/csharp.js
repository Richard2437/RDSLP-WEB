/* =====================================================
   RDSLP - Módulo Específico: C#
   LanguagesSection_js/csharp.js
===================================================== */

document.addEventListener('DOMContentLoaded', function () {
    const config = {
    "file": "csharp.js",
    "html": "csharp.html",
    "id": "lang-csharp",
    "name": "C#",
    "abbr": "C#",
    "colorClass": "csharp",
    "tagline": "Modernidad, potencia y desarrollo integral en .NET",
    "intro": "C# es un lenguaje elegante y de tipos seguros desarrollado por Microsoft. Combina la potencia del bajo nivel con la productividad del alto nivel, destacando en el desarrollo de videojuegos profesionales, microservicios en la nube y aplicaciones empresariales.",
    "uses": [
        "Desarrollo de videojuegos en 2D, 3D, Realidad Virtual con Unity Engine",
        "APIs web modernas y de altísimo rendimiento con ASP.NET Core",
        "Aplicaciones de escritorio modernas (WPF, .NET MAUI, WinUI)",
        "Servicios en la nube e integraciones con Microsoft Azure"
    ],
    "example": "// C#: Programación funcional y LINQ\nusing System;\nusing System.Linq;\nusing System.Collections.Generic;\n\nclass Program {\n    static void Main() {\n        var puntajes = new List<int> { 85, 92, 78, 96, 88, 64 };\n        var destacados = puntajes.Where(p => p >= 85).OrderByDescending(p => p);\n        \n        Console.WriteLine(\"Puntajes de honor: \" + string.Join(\", \", destacados));\n    }\n}\n"
};

    if (window.LanguageDetailManager) {
        window.LanguageDetailManager.init(config);
    } else {
        console.error("LanguageDetailManager no está cargado.");
    }
});
