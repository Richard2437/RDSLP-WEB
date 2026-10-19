/* =====================================================
   RDSLP - Módulo Específico: PHP
   LanguagesSection_js/php.js
===================================================== */

document.addEventListener('DOMContentLoaded', function () {
    const config = {
    "file": "php.js",
    "html": "php.html",
    "id": "lang-php",
    "name": "PHP",
    "abbr": "PHP",
    "colorClass": "php",
    "tagline": "El pilar dinámico que mueve más del 75% de la web",
    "intro": "PHP es un lenguaje de backend maduro, versátil y en constante evolución. Con versiones modernas (PHP 8+) cuenta con compilación JIT, tipado estricto, atributos y frameworks de nivel mundial como Laravel y Symfony.",
    "uses": [
        "Desarrollo web ágil y APIs RESTful (Laravel, Symfony)",
        "Gestores de contenido mundiales (WordPress, Drupal, Joomla)",
        "Plataformas de e-commerce a escala (WooCommerce, Magento)",
        "Sistemas SaaS para empresas"
    ],
    "example": "<?php\n// PHP 8+: Clases con Promotion y Tipado Estricto\ndeclare(strict_types=1);\n\nclass Usuario {\n    public function __construct(\n        public string $nombre,\n        public string $email,\n        public bool $activo = true\n    ) {}\n\n    public function mensajeBienvenida(): string {\n        return \"Bienvenido al sistema, {$this->nombre}!\";\n    }\n}\n\n$user = new Usuario(\"Laura\", \"laura@ejemplo.com\");\necho $user->mensajeBienvenida();\n"
};

    if (window.LanguageDetailManager) {
        window.LanguageDetailManager.init(config);
    } else {
        console.error("LanguageDetailManager no está cargado.");
    }
});
