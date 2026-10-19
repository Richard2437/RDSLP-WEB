/* =====================================================
   RDSLP - Módulo Específico: Go
   LanguagesSection_js/go.js
===================================================== */

document.addEventListener('DOMContentLoaded', function () {
    const config = {
    "file": "go.js",
    "html": "go.html",
    "id": "lang-go",
    "name": "Go",
    "abbr": "GO",
    "colorClass": "go",
    "tagline": "Simplicidad, concurrencia nativa y velocidad de compilación",
    "intro": "Go (Golang) fue diseñado por ingenieros de Google (Ken Thompson, Rob Pike) para resolver problemas de escalabilidad en sistemas masivos. Destaca por sus Goroutines ligeras, compilación a un único binario y código sin complejidad innecesaria.",
    "uses": [
        "Infraestructura cloud y orquestadores (Docker, Kubernetes, Terraform)",
        "Microservicios de alta concurrencia y pasarelas de red",
        "Servicios de streaming y mensajería en tiempo real",
        "Herramientas CLI ultrarrápidas"
    ],
    "example": "// Go: Concurrencia mediante Goroutines y Canales\npackage main\n\nimport (\n    \"fmt\"\n    \"time\"\n)\n\nfunc trabajador(id int, canal chan string) {\n    time.Sleep(time.Millisecond * 100)\n    canal <- fmt.Sprintf(\"Trabajador %d finalizo su tarea\", id)\n}\n\nfunc main() {\n    mensajes := make(chan string)\n    go trabajador(1, mensajes)\n    go trabajador(2, mensajes)\n\n    fmt.Println(<-mensajes)\n    fmt.Println(<-mensajes)\n}\n"
};

    if (window.LanguageDetailManager) {
        window.LanguageDetailManager.init(config);
    } else {
        console.error("LanguageDetailManager no está cargado.");
    }
});
