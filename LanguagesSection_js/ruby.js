/* =====================================================
   RDSLP - Módulo Específico: Ruby
   LanguagesSection_js/ruby.js
===================================================== */

document.addEventListener('DOMContentLoaded', function () {
    const config = {
    "file": "ruby.js",
    "html": "ruby.html",
    "id": "lang-ruby",
    "name": "Ruby",
    "abbr": "RB",
    "colorClass": "ruby",
    "tagline": "Optimizado para la felicidad y la productividad humana",
    "intro": "Creado en Japón por Yukihiro Matsumoto (Matz), Ruby fusiona partes de Perl, Smalltalk y Lisp en un lenguaje puramente orientado a objetos, donde todo es un objeto y la sintaxis fluye de manera natural.",
    "uses": [
        "Desarrollo web rápido y startups con Ruby on Rails (Shopify, GitHub, Airbnb core)",
        "Herramientas DevOps y aprovisionamiento (Chef, Vagrant, CocoaPods)",
        "Automatización y pruebas de software (RSpec, Capybara)",
        "Scripting y prototipado rápido"
    ],
    "example": "# Ruby: Bloques, iteradores y sintaxis expresiva\nclass Saludo\n  def initialize(destinatario)\n    @destinatario = destinatario\n  end\n\n  def dar_bienvenida\n    puts \"¡Hola, #{@destinatario}! Bienvenido a la comunidad RDSLP.\"\n  end\nend\n\nsaludo = Saludo.new(\"Desarrollador\")\nsaludo.dar_bienvenida\n"
};

    if (window.LanguageDetailManager) {
        window.LanguageDetailManager.init(config);
    } else {
        console.error("LanguageDetailManager no está cargado.");
    }
});
