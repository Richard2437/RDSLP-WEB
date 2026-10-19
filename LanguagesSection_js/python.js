/* =====================================================
   RDSLP - Módulo Específico: Python
   LanguagesSection_js/python.js
===================================================== */

document.addEventListener('DOMContentLoaded', function () {
    const config = {
    "file": "python.js",
    "html": "python.html",
    "id": "lang-python",
    "name": "Python",
    "abbr": "PY",
    "colorClass": "python",
    "tagline": "Versatilidad, legibilidad y potencia científica",
    "intro": "Python es un lenguaje de programación multiparadigma de alto nivel, creado por Guido van Rossum. Su filosofía enfatiza una sintaxis extremadamente limpia y legible, convirtiéndolo en el estándar de oro para Inteligencia Artificial, Ciencia de Datos y Automatización.",
    "uses": [
        "Inteligencia Artificial, Machine Learning y Deep Learning (TensorFlow, PyTorch, Scikit-learn)",
        "Desarrollo Web Backend (Django, FastAPI, Flask)",
        "Automatización, Web Scraping y Scripting de sistemas",
        "Análisis de datos cuantitativo y visualización (Pandas, NumPy, Matplotlib)"
    ],
    "example": "# Python: Servidor API mínimo y procesamiento de datos\ndef calcular_promedio(numeros):\n    if not numeros:\n        return 0\n    return sum(numeros) / len(numeros)\n\ndatos = [10, 20, 30, 40, 50]\npromedio = calcular_promedio(datos)\nprint(f\"El promedio de {datos} es: {promedio}\")\n"
};

    if (window.LanguageDetailManager) {
        window.LanguageDetailManager.init(config);
    } else {
        console.error("LanguageDetailManager no está cargado.");
    }
});
