/* =====================================================
   RDSLP - Módulo Específico: Swift
   LanguagesSection_js/swift.js
===================================================== */

document.addEventListener('DOMContentLoaded', function () {
    const config = {
    "file": "swift.js",
    "html": "swift.html",
    "id": "lang-swift",
    "name": "Swift",
    "abbr": "SW",
    "colorClass": "swift",
    "tagline": "Elegancia, seguridad y velocidad para el ecosistema Apple",
    "intro": "Creado por Apple como sucesor moderno de Objective-C, Swift combina sintaxis concisa con protecciones avanzadas contra errores de punteros o nulos. Es el motor detrás de las aplicaciones más destacadas de iOS, iPadOS y macOS.",
    "uses": [
        "Desarrollo de apps nativas para iPhone y iPad con SwiftUI",
        "Aplicaciones de escritorio para macOS",
        "Desarrollo de software para Apple Watch (watchOS) y Apple TV (tvOS)",
        "Backend ligero con Vapor"
    ],
    "example": "// Swift: Interfaces declarativas con SwiftUI\nimport Foundation\n\nstruct Desarrollador {\n    let nombre: String\n    var lenguajesFavoritos: [String]\n    \n    func presentarse() -> String {\n        return \"Hola, soy \\(nombre) y programo en \\(lenguajesFavoritos.joined(separator: \", \")).\"\n    }\n}\n\nlet dev = Desarrollador(nombre: \"Carlos\", lenguajesFavoritos: [\"Swift\", \"Python\"])\nprint(dev.presentarse())\n"
};

    if (window.LanguageDetailManager) {
        window.LanguageDetailManager.init(config);
    } else {
        console.error("LanguageDetailManager no está cargado.");
    }
});
