/* =====================================================
   RDSLP - Módulo Específico: Kotlin
   LanguagesSection_js/kotlin.js
===================================================== */

document.addEventListener('DOMContentLoaded', function () {
    const config = {
    "file": "kotlin.js",
    "html": "kotlin.html",
    "id": "lang-kotlin",
    "name": "Kotlin",
    "abbr": "KT",
    "colorClass": "kotlin",
    "tagline": "Concisión, modernidad y desarrollo multiplataforma",
    "intro": "Desarrollado por JetBrains y respaldado oficialmente por Google como el lenguaje preferente para Android. Elimina las excepciones de puntero nulo (NullPointerException) y permite compartir lógica entre plataformas mediante Kotlin Multiplatform (KMP).",
    "uses": [
        "Desarrollo moderno de Android (Jetpack Compose)",
        "Desarrollo Multiplataforma para iOS, Android y Desktop (Kotlin Multiplatform)",
        "Backend con Spring Boot, Ktor y microservicios",
        "Ciencia de datos y scripts de automatización"
    ],
    "example": "// Kotlin: Data classes y extension functions\ndata class Tarea(val id: Int, val descripcion: String, val completada: Boolean = false)\n\nfun Tarea.resumen(): String = \"[${if (completada) \"OK\" else \"PENDIENTE\"}] $descripcion\"\n\nfun main() {\n    val tarea = Tarea(1, \"Aprender Kotlin Multiplatform\", true)\n    println(tarea.resumen())\n}\n"
};

    if (window.LanguageDetailManager) {
        window.LanguageDetailManager.init(config);
    } else {
        console.error("LanguageDetailManager no está cargado.");
    }
});
