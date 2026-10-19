/* =====================================================
   RDSLP - Módulo Específico: Rust
   LanguagesSection_js/rust.js
===================================================== */

document.addEventListener('DOMContentLoaded', function () {
    const config = {
    "file": "rust.js",
    "html": "rust.html",
    "id": "lang-rust",
    "name": "Rust",
    "abbr": "RS",
    "colorClass": "rust",
    "tagline": "Seguridad de memoria sin recolector y concurrencia sin carreras",
    "intro": "Rust es un lenguaje de programación de sistemas que garantiza seguridad de memoria y ausencia de carreras de datos en tiempo de compilación mediante su innovador sistema de propiedad (Ownership y Borrowing), alcanzando la velocidad de C y C++.",
    "uses": [
        "Sistemas operativos y módulos de kernel de Linux / Windows",
        "Criptografía, blockchain y desarrollo de WebAssembly (Wasm)",
        "Servicios backend de latencia ultra baja y redes distribuidas",
        "Herramientas modernas para desarrolladores (Turbopack, Biome, Tauri)"
    ],
    "example": "// Rust: Seguridad de memoria garantizada\nfn calcular_longitud(texto: &String) -> usize {\n    texto.len()\n}\n\nfn main() {\n    let saludo = String::from(\"Hola, Rustacean!\");\n    let longitud = calcular_longitud(&saludo);\n    println!(\"'{}' tiene una longitud de {} caracteres.\", saludo, longitud);\n}\n"
};

    if (window.LanguageDetailManager) {
        window.LanguageDetailManager.init(config);
    } else {
        console.error("LanguageDetailManager no está cargado.");
    }
});
