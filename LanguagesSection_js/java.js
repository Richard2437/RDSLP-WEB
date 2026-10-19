/* =====================================================
   RDSLP - Módulo Específico: Java
   LanguagesSection_js/java.js
===================================================== */

document.addEventListener('DOMContentLoaded', function () {
    const config = {
    "file": "java.js",
    "html": "java.html",
    "id": "lang-java",
    "name": "Java",
    "abbr": "JV",
    "colorClass": "java",
    "tagline": "Escribe una vez, ejecuta en cualquier lugar (WORA)",
    "intro": "Java es un lenguaje tipado, orientado a objetos y seguro, ampliamente adoptado por grandes corporaciones e infraestructuras bancarias por su estabilidad, escalabilidad y la robustez de la Máquina Virtual de Java (JVM).",
    "uses": [
        "Arquitecturas empresariales de misión crítica y banca (Spring Boot, Quarkus)",
        "Desarrollo nativo tradicional de Android",
        "Sistemas de Big Data y procesamiento masivo (Apache Kafka, Hadoop, Spark)",
        "Sistemas distribuidos en la nube"
    ],
    "example": "// Java: Clase orientada a objetos con encapsulamiento\npublic class Producto {\n    private String nombre;\n    private double precio;\n\n    public Producto(String nombre, double precio) {\n        this.nombre = nombre;\n        this.precio = precio;\n    }\n\n    public void aplicarDescuento(double porcentaje) {\n        this.precio -= this.precio * (porcentaje / 100);\n    }\n\n    public static void main(String[] args) {\n        Producto laptop = new Producto(\"Laptop Pro\", 1200.0);\n        laptop.aplicarDescuento(15);\n        System.out.println(\"Precio final con descuento aplicado.\");\n    }\n}\n"
};

    if (window.LanguageDetailManager) {
        window.LanguageDetailManager.init(config);
    } else {
        console.error("LanguageDetailManager no está cargado.");
    }
});
