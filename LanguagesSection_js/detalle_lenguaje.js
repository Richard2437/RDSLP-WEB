/* =====================================================
   RDSLP - JavaScript de Detalle de Lenguaje Específico
   LanguagesSection_js/detalle_lenguaje.js
===================================================== */

document.addEventListener('DOMContentLoaded', function () {
    const auth = window.authManager;
    const content = window.contentManager;
    let currentUser = null;

    // Base de datos de información enriquecida para todos los lenguajes
    const languagesKnowledgeBase = {
        'lang-python': {
            name: 'Python',
            abbr: 'PY',
            colorClass: 'python',
            tagline: 'Versatilidad, legibilidad y potencia científica',
            intro: 'Python es un lenguaje de programación multiparadigma de alto nivel, creado por Guido van Rossum. Su filosofía enfatiza una sintaxis extremadamente limpia y legible, convirtiéndolo en el estándar de oro para Inteligencia Artificial, Ciencia de Datos y Automatización.',
            uses: [
                'Inteligencia Artificial, Machine Learning y Deep Learning (TensorFlow, PyTorch, Scikit-learn)',
                'Desarrollo Web Backend (Django, FastAPI, Flask)',
                'Automatización, Web Scraping y Scripting de sistemas',
                'Análisis de datos cuantitativo y visualización (Pandas, NumPy, Matplotlib)'
            ],
            example: `# Python: Servidor API mínimo y procesamiento de datos
def calcular_promedio(numeros):
    if not numeros:
        return 0
    return sum(numeros) / len(numeros)

datos = [10, 20, 30, 40, 50]
promedio = calcular_promedio(datos)
print(f"El promedio de {datos} es: {promedio}")
`
        },
        'lang-javascript': {
            name: 'JavaScript',
            abbr: 'JS',
            colorClass: 'javascript',
            tagline: 'El motor del navegador y la web moderna',
            intro: 'JavaScript es el lenguaje de programación esencial de la World Wide Web. Es dinámico, basado en prototipos y orientado a eventos. Gracias a motores como V8 y plataformas como Node.js, impulsa desde interfaces reactivas de usuario hasta servidores de alto rendimiento.',
            uses: [
                'Desarrollo Frontend SPA y SSR (React, Next.js, Vue, Angular, Svelte)',
                'Backend y microservicios orientados a eventos (Node.js, Express, NestJS)',
                'Aplicaciones móviles multiplataforma (React Native, Capacitor)',
                'Aplicaciones de escritorio (Electron, Tauri)'
            ],
            example: `// JavaScript: Asincronía con async/await y manipulación de datos
async function obtenerDatosUsuario(id) {
    try {
        const respuesta = await fetch(\`https://api.ejemplo.com/users/\${id}\`);
        const usuario = await respuesta.json();
        console.log(\`Usuario: \${usuario.nombre}, Rol: \${usuario.rol}\`);
        return usuario;
    } catch (error) {
        console.error("Error al consultar usuario:", error);
    }
}
`
        },
        'lang-java': {
            name: 'Java',
            abbr: 'JV',
            colorClass: 'java',
            tagline: 'Escribe una vez, ejecuta en cualquier lugar (WORA)',
            intro: 'Java es un lenguaje tipado, orientado a objetos y seguro, ampliamente adoptado por grandes corporaciones e infraestructuras bancarias por su estabilidad, escalabilidad y la robustez de la Máquina Virtual de Java (JVM).',
            uses: [
                'Arquitecturas empresariales de misión crítica y banca (Spring Boot, Quarkus)',
                'Desarrollo nativo tradicional de Android',
                'Sistemas de Big Data y procesamiento masivo (Apache Kafka, Hadoop, Spark)',
                'Sistemas distribuidos en la nube'
            ],
            example: `// Java: Clase orientada a objetos con encapsulamiento
public class Producto {
    private String nombre;
    private double precio;

    public Producto(String nombre, double precio) {
        this.nombre = nombre;
        this.precio = precio;
    }

    public void aplicarDescuento(double porcentaje) {
        this.precio -= this.precio * (porcentaje / 100);
    }

    public static void main(String[] args) {
        Producto laptop = new Producto("Laptop Pro", 1200.0);
        laptop.aplicarDescuento(15);
        System.out.println("Precio final con descuento aplicado.");
    }
}
`
        },
        'lang-csharp': {
            name: 'C#',
            abbr: 'C#',
            colorClass: 'csharp',
            tagline: 'Modernidad, potencia y desarrollo integral en .NET',
            intro: 'C# es un lenguaje elegante y de tipos seguros desarrollado por Microsoft. Combina la potencia del bajo nivel con la productividad del alto nivel, destacando en el desarrollo de videojuegos profesionales, microservicios en la nube y aplicaciones empresariales.',
            uses: [
                'Desarrollo de videojuegos en 2D, 3D, Realidad Virtual con Unity Engine',
                'APIs web modernas y de altísimo rendimiento con ASP.NET Core',
                'Aplicaciones de escritorio modernas (WPF, .NET MAUI, WinUI)',
                'Servicios en la nube e integraciones con Microsoft Azure'
            ],
            example: `// C#: Programación funcional y LINQ
using System;
using System.Linq;
using System.Collections.Generic;

class Program {
    static void Main() {
        var puntajes = new List<int> { 85, 92, 78, 96, 88, 64 };
        var destacados = puntajes.Where(p => p >= 85).OrderByDescending(p => p);
        
        Console.WriteLine("Puntajes de honor: " + string.Join(", ", destacados));
    }
}
`
        },
        'lang-cpp': {
            name: 'C++',
            abbr: 'C++',
            colorClass: 'cpp',
            tagline: 'Rendimiento extremo, control directo y abstracción sin coste',
            intro: 'C++ es el lenguaje predilecto cuando cada ciclo de reloj y cada byte de memoria cuentan. Diseñado por Bjarne Stroustrup, ofrece control total de hardware, punteros inteligentes, plantillas metaprogramadas y máxima eficiencia de ejecución.',
            uses: [
                'Motores de videojuegos AAA (Unreal Engine, CryEngine)',
                'Sistemas operativos, controladores de dispositivos (drivers) y sistemas embebidos',
                'Sistemas de Trading de Alta Frecuencia (HFT) e infraestructura financiera',
                'Navegadores web, bases de datos (Chromium, MySQL, PostgreSQL core)'
            ],
            example: `// C++: Manejo moderno de memoria y RAII
#include <iostream>
#include <vector>
#include <memory>

class Sensor {
public:
    void leerDatos() { std::cout << "Sensor transmitiendo telemetria en tiempo real." << std::endl; }
};

int main() {
    auto sensorPtr = std::make_unique<Sensor>();
    sensorPtr->leerDatos();
    return 0;
}
`
        },
        'lang-go': {
            name: 'Go',
            abbr: 'GO',
            colorClass: 'go',
            tagline: 'Simplicidad, concurrencia nativa y velocidad de compilación',
            intro: 'Go (Golang) fue diseñado por ingenieros de Google (Ken Thompson, Rob Pike) para resolver problemas de escalabilidad en sistemas masivos. Destaca por sus Goroutines ligeras, compilación a un único binario y código sin complejidad innecesaria.',
            uses: [
                'Infraestructura cloud y orquestadores (Docker, Kubernetes, Terraform)',
                'Microservicios de alta concurrencia y pasarelas de red',
                'Servicios de streaming y mensajería en tiempo real',
                'Herramientas CLI ultrarrápidas'
            ],
            example: `// Go: Concurrencia mediante Goroutines y Canales
package main

import (
    "fmt"
    "time"
)

func trabajador(id int, canal chan string) {
    time.Sleep(time.Millisecond * 100)
    canal <- fmt.Sprintf("Trabajador %d finalizo su tarea", id)
}

func main() {
    mensajes := make(chan string)
    go trabajador(1, mensajes)
    go trabajador(2, mensajes)

    fmt.Println(<-mensajes)
    fmt.Println(<-mensajes)
}
`
        },
        'lang-rust': {
            name: 'Rust',
            abbr: 'RS',
            colorClass: 'rust',
            tagline: 'Seguridad de memoria sin recolector y concurrencia sin carreras',
            intro: 'Rust es un lenguaje de programación de sistemas que garantiza seguridad de memoria y ausencia de carreras de datos en tiempo de compilación mediante su innovador sistema de propiedad (Ownership y Borrowing), alcanzando la velocidad de C y C++.',
            uses: [
                'Sistemas operativos y módulos de kernel de Linux / Windows',
                'Criptografía, blockchain y desarrollo de WebAssembly (Wasm)',
                'Servicios backend de latencia ultra baja y redes distribuidas',
                'Herramientas modernas para desarrolladores (Turbopack, Biome, Tauri)'
            ],
            example: `// Rust: Seguridad de memoria garantizada
fn calcular_longitud(texto: &String) -> usize {
    texto.len()
}

fn main() {
    let saludo = String::from("Hola, Rustacean!");
    let longitud = calcular_longitud(&saludo);
    println!("'{}' tiene una longitud de {} caracteres.", saludo, longitud);
}
`
        },
        'lang-php': {
            name: 'PHP',
            abbr: 'PHP',
            colorClass: 'php',
            tagline: 'El pilar dinámico que mueve más del 75% de la web',
            intro: 'PHP es un lenguaje de backend maduro, versátil y en constante evolución. Con versiones modernas (PHP 8+) cuenta con compilación JIT, tipado estricto, atributos y frameworks de nivel mundial como Laravel y Symfony.',
            uses: [
                'Desarrollo web ágil y APIs RESTful (Laravel, Symfony)',
                'Gestores de contenido mundiales (WordPress, Drupal, Joomla)',
                'Plataformas de e-commerce a escala (WooCommerce, Magento)',
                'Sistemas SaaS para empresas'
            ],
            example: `<?php
// PHP 8+: Clases con Promotion y Tipado Estricto
declare(strict_types=1);

class Usuario {
    public function __construct(
        public string $nombre,
        public string $email,
        public bool $activo = true
    ) {}

    public function mensajeBienvenida(): string {
        return "Bienvenido al sistema, {$this->nombre}!";
    }
}

$user = new Usuario("Laura", "laura@ejemplo.com");
echo $user->mensajeBienvenida();
`
        },
        'lang-swift': {
            name: 'Swift',
            abbr: 'SW',
            colorClass: 'swift',
            tagline: 'Elegancia, seguridad y velocidad para el ecosistema Apple',
            intro: 'Creado por Apple como sucesor moderno de Objective-C, Swift combina sintaxis concisa con protecciones avanzadas contra errores de punteros o nulos. Es el motor detrás de las aplicaciones más destacadas de iOS, iPadOS y macOS.',
            uses: [
                'Desarrollo de apps nativas para iPhone y iPad con SwiftUI',
                'Aplicaciones de escritorio para macOS',
                'Desarrollo de software para Apple Watch (watchOS) y Apple TV (tvOS)',
                'Backend ligero con Vapor'
            ],
            example: `// Swift: Interfaces declarativas con SwiftUI
import Foundation

struct Desarrollador {
    let nombre: String
    var lenguajesFavoritos: [String]
    
    func presentarse() -> String {
        return "Hola, soy \\(nombre) y programo en \\(lenguajesFavoritos.joined(separator: ", "))."
    }
}

let dev = Desarrollador(nombre: "Carlos", lenguajesFavoritos: ["Swift", "Python"])
print(dev.presentarse())
`
        },
        'lang-kotlin': {
            name: 'Kotlin',
            abbr: 'KT',
            colorClass: 'kotlin',
            tagline: 'Concisión, modernidad y desarrollo multiplataforma',
            intro: 'Desarrollado por JetBrains y respaldado oficialmente por Google como el lenguaje preferente para Android. Elimina las excepciones de puntero nulo (NullPointerException) y permite compartir lógica entre plataformas mediante Kotlin Multiplatform (KMP).',
            uses: [
                'Desarrollo moderno de Android (Jetpack Compose)',
                'Desarrollo Multiplataforma para iOS, Android y Desktop (Kotlin Multiplatform)',
                'Backend con Spring Boot, Ktor y microservicios',
                'Ciencia de datos y scripts de automatización'
            ],
            example: `// Kotlin: Data classes y extension functions
data class Tarea(val id: Int, val descripcion: String, val completada: Boolean = false)

fun Tarea.resumen(): String = "[\${if (completada) "OK" else "PENDIENTE"}] $descripcion"

fun main() {
    val tarea = Tarea(1, "Aprender Kotlin Multiplatform", true)
    println(tarea.resumen())
}
`
        },
        'lang-typescript': {
            name: 'TypeScript',
            abbr: 'TS',
            colorClass: 'typescript',
            tagline: 'JavaScript con superpoderes de tipado estático',
            intro: 'TypeScript es un superset de código abierto creado por Microsoft que agrega tipos estáticos opcionales a JavaScript. Permite detectar errores en tiempo de edición, ofreciendo autocompletado avanzado y refactorizaciones seguras en aplicaciones de gran escala.',
            uses: [
                'Grandes aplicaciones frontend (React, Angular, Next.js)',
                'Servicios y APIs backend empresariales (NestJS, Express TS)',
                'Librerías de código abierto y paquetes NPM modernos',
                'Desarrollo Fullstack Type-Safe (tRPC, Prisma)'
            ],
            example: `// TypeScript: Interfaces y tipos genéricos
interface RespuestaServidor<T> {
    estado: 'exito' | 'error';
    datos: T;
    timestamp: number;
}

interface PerfilUsuario {
    id: string;
    nombre: string;
    esAdmin: boolean;
}

function procesarRespuesta(resp: RespuestaServidor<PerfilUsuario>): void {
    if (resp.estado === 'exito') {
        console.log(\`Cargado usuario: \${resp.datos.nombre}\`);
    }
}
`
        },
        'lang-ruby': {
            name: 'Ruby',
            abbr: 'RB',
            colorClass: 'ruby',
            tagline: 'Optimizado para la felicidad y la productividad humana',
            intro: 'Creado en Japón por Yukihiro Matsumoto (Matz), Ruby fusiona partes de Perl, Smalltalk y Lisp en un lenguaje puramente orientado a objetos, donde todo es un objeto y la sintaxis fluye de manera natural.',
            uses: [
                'Desarrollo web rápido y startups con Ruby on Rails (Shopify, GitHub, Airbnb core)',
                'Herramientas DevOps y aprovisionamiento (Chef, Vagrant, CocoaPods)',
                'Automatización y pruebas de software (RSpec, Capybara)',
                'Scripting y prototipado rápido'
            ],
            example: `# Ruby: Bloques, iteradores y sintaxis expresiva
class Saludo
  def initialize(destinatario)
    @destinatario = destinatario
  end

  def dar_bienvenida
    puts "¡Hola, #{@destinatario}! Bienvenido a la comunidad RDSLP."
  end
end

saludo = Saludo.new("Desarrollador")
saludo.dar_bienvenida
`
        }
    };

    init();

    function init() {
        checkAuth();
        loadUserData();
        loadLanguagePage();
        setupEventListeners();
    }

    function checkAuth() {
        if (auth && !auth.isAuthenticated()) {
            window.location.href = '../Static/login.html';
            return;
        }
        if (auth) currentUser = auth.getCurrentUser();
    }

    function loadUserData() {
        if (!currentUser) return;
        const avatar = document.getElementById('userAvatar');
        const name = document.getElementById('userName');
        if (avatar) avatar.textContent = currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U';
        if (name) name.textContent = currentUser.name || 'Usuario';
    }

    function setupEventListeners() {
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            if (auth) auth.logout();
            window.location.href = '../Static/login.html';
        });

        // Modal para ver código completo de archivo
        document.getElementById('closeModal')?.addEventListener('click', () => {
            document.getElementById('contentModal')?.classList.remove('active');
        });
        document.getElementById('contentModal')?.addEventListener('click', function (e) {
            if (e.target === this) this.classList.remove('active');
        });
    }

    function getLanguageContext() {
        const container = document.getElementById('dynamicContent');
        if (!container) return { langId: 'lang-python', langName: 'Python' };

        let langId = container.getAttribute('data-lang');
        let langName = container.getAttribute('data-name');

        // Revisar si viene por query string (ej: ?custom=lang-dart o ?id=lang-go)
        const urlParams = new URLSearchParams(window.location.search);
        const customParam = urlParams.get('custom') || urlParams.get('id');
        if (customParam) {
            langId = customParam;
            // Buscar si está guardado en localStorage
            const stored = localStorage.getItem('rdslp_detail_' + langId);
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    langName = parsed.name || langName;
                } catch (e) {}
            }
        }

        return { langId, langName };
    }

    function loadLanguagePage() {
        const container = document.getElementById('dynamicContent');
        if (!container) return;

        const { langId, langName } = getLanguageContext();

        // Buscar información en la base de datos local o en localStorage
        let details = languagesKnowledgeBase[langId];
        if (!details) {
            const stored = localStorage.getItem('rdslp_detail_' + langId);
            if (stored) {
                try {
                    details = JSON.parse(stored);
                } catch (e) {}
            }
        }

        if (!details) {
            details = {
                name: langName || 'Lenguaje',
                abbr: (langName || 'LN').substring(0, 2).toUpperCase(),
                colorClass: 'custom',
                tagline: 'Lenguaje de programación y herramientas',
                intro: `${langName} es un lenguaje de programación con amplia aplicación en desarrollo de software, algoritmos y soluciones tecnológicas modernas.`,
                uses: ['Desarrollo de software y aplicaciones', 'Soluciones en la nube y backend', 'Automatización y scripts'],
                example: `// Ejemplo básico en ${langName}\nconsole.log("¡Bienvenido a ${langName}!");`
            };
        }

        // Construir HTML completo con clases CSS limpias (sin estilos inline)
        const html = `
            <div class="lang-detail-wrapper">
                <!-- Tarjeta Hero del Lenguaje -->
                <div class="lang-hero-card">
                    <div class="lang-hero-main">
                        <div class="lang-hero-icon ${details.colorClass || 'custom'}">
                            ${escapeHtml(details.abbr || 'LP')}
                        </div>
                        <div class="lang-hero-info">
                            <h1>${escapeHtml(details.name || langName)}</h1>
                            <p>${escapeHtml(details.tagline || 'Lenguaje de Programación')}</p>
                            <div class="lang-hero-tags">
                                ${(details.uses ? details.uses.slice(0, 3) : []).map(u => `<span class="lang-hero-tag">${escapeHtml(u)}</span>`).join('')}
                            </div>
                        </div>
                    </div>
                    <div>
                        <a href="lenguajes.html" class="lang-back-btn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12 19 5 12 12 5"></polyline>
                            </svg>
                            Volver a Lenguajes
                        </a>
                    </div>
                </div>

                <!-- Barra de Pestañas -->
                <div class="lang-tabs-bar">
                    <button class="lang-tab-btn active" onclick="window.cambiarPestana('explicacion', this)">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                        Explicación y Guía
                    </button>
                    <button class="lang-tab-btn" onclick="window.cambiarPestana('subir', this)">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        + Subir Aporte / Código
                    </button>
                    <button class="lang-tab-btn" onclick="window.cambiarPestana('archivos', this)">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                        </svg>
                        Aportes de la Comunidad
                    </button>
                    <button class="lang-tab-btn" onclick="window.cambiarPestana('ejercicios', this)">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="16 18 22 12 16 6"></polyline>
                            <polyline points="8 6 2 12 8 18"></polyline>
                        </svg>
                        Ejercicios y Práctica
                    </button>
                </div>

                <!-- Pestaña 1: Explicación -->
                <div id="tab-explicacion" class="lang-tab-pane active">
                    <div class="lang-section-block">
                        <h3 class="lang-section-title">¿Qué es ${escapeHtml(details.name)}?</h3>
                        <p class="lang-text-content">${escapeHtml(details.intro)}</p>
                    </div>

                    <div class="lang-section-block">
                        <h3 class="lang-section-title">Casos de Uso Principales</h3>
                        <ul class="lang-features-list">
                            ${(details.uses || []).map(u => `
                                <li class="lang-feature-item">
                                    <span class="lang-feature-bullet"></span>
                                    <span>${escapeHtml(u)}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>

                    <div class="lang-section-block">
                        <h3 class="lang-section-title">Ejemplo de Código Representativo</h3>
                        <div class="code-container">
                            <div class="code-header">
                                <span class="code-lang-label">${escapeHtml(details.name.toLowerCase())}</span>
                                <button class="btn-copy-code" onclick="window.copiarCodigoEjemplo()">Copiar Código</button>
                            </div>
                            <pre class="code-pre" id="codigoEjemploPre">${escapeHtml(details.example)}</pre>
                        </div>
                    </div>

                    <!-- Sección de Comentarios y Discusión -->
                    <div class="lang-comments-container">
                        ${renderCommentsSection(langId, details.name)}
                    </div>
                </div>

                <!-- Pestaña 2: Subir Cosas para el Lenguaje -->
                <div id="tab-subir" class="lang-tab-pane">
                    <div class="lang-upload-card">
                        <h3>Subir Recurso o Código para ${escapeHtml(details.name)}</h3>
                        <p>Comparte scripts, funciones reutilizables, ejercicios resueltos o proyectos con la comunidad de ${escapeHtml(details.name)}.</p>

                        <form id="formSubirAporte" onsubmit="return false;">
                            <div class="lang-form-grid">
                                <div class="form-group">
                                    <label class="form-label">Título o Nombre del Recurso *</label>
                                    <input type="text" id="aporteTitulo" class="form-input" placeholder="Ej: Algoritmo de Búsqueda Binaria, API con FastAPI..." required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Dificultad *</label>
                                    <select id="aporteDificultad" class="form-select">
                                        <option value="Fácil">Fácil (Básico)</option>
                                        <option value="Medio" selected>Medio (Intermedio)</option>
                                        <option value="Difícil">Difícil (Avanzado)</option>
                                    </select>
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Tipo de Recurso</label>
                                <select id="aporteTipo" class="form-select">
                                    <option value="Snippet">Snippet de Código</option>
                                    <option value="Script">Script / Utilidad</option>
                                    <option value="Ejercicio">Ejercicio Resuelto</option>
                                    <option value="Guía">Guía o Proyecto</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Código o Contenido del Archivo *</label>
                                <textarea id="aporteContenido" class="form-textarea" placeholder="Pega aquí tu código, explicación o solución..." style="height: 180px; font-family: monospace;" required></textarea>
                            </div>

                            <button type="button" class="btn-submit-modal" onclick="window.guardarAporteLenguaje('${langId}')">
                                Publicar Aporte para ${escapeHtml(details.name)}
                            </button>
                        </form>
                    </div>
                </div>

                <!-- Pestaña 3: Aportes de la Comunidad -->
                <div id="tab-archivos" class="lang-tab-pane">
                    <div class="lang-resources-header">
                        <h3>Aportes y Archivos de la Comunidad</h3>
                        <button class="btn-upload-lang" onclick="window.cambiarPestana('subir')">+ Subir Nuevo Aporte</button>
                    </div>
                    <div class="lang-resources-grid" id="listaArchivos-${langId}">
                        <div class="empty-state" style="grid-column: 1/-1; text-align:center; padding: 30px; color: var(--text-muted);">Cargando aportes comunitarios...</div>
                    </div>
                </div>

                <!-- Pestaña 4: Ejercicios -->
                <div id="tab-ejercicios" class="lang-tab-pane">
                    <div class="lang-section-block">
                        <h3 class="lang-section-title">Practica ${escapeHtml(details.name)} con Retos Reales</h3>
                        <p class="lang-text-content">Entra a nuestra plataforma de ejercicios interactivos con feedback inteligente y clasificaciones de la comunidad.</p>
                        <div style="margin-top: 20px;">
                            <button class="btn-submit-modal" style="max-width: 250px;" onclick="window.location.href='../Static/ejercicios.html?lang=${encodeURIComponent(details.name.toLowerCase())}'">
                                Ir al Módulo de Ejercicios &rarr;
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
        window.cargarArchivosLenguaje(langId);
    }

    // Navegación de pestañas
    window.cambiarPestana = function (tabName, btnEl = null) {
        document.querySelectorAll('.lang-tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.lang-tab-pane').forEach(pane => pane.classList.remove('active'));

        const targetPane = document.getElementById('tab-' + tabName);
        if (targetPane) targetPane.classList.add('active');

        if (btnEl) {
            btnEl.classList.add('active');
        } else {
            // Seleccionar botón correspondiente
            const buttons = document.querySelectorAll('.lang-tab-btn');
            const map = { 'explicacion': 0, 'subir': 1, 'archivos': 2, 'ejercicios': 3 };
            if (map[tabName] !== undefined && buttons[map[tabName]]) {
                buttons[map[tabName]].classList.add('active');
            }
        }
    };

    // Copiar código de ejemplo
    window.copiarCodigoEjemplo = function () {
        const code = document.getElementById('codigoEjemploPre')?.innerText || '';
        navigator.clipboard.writeText(code).then(() => {
            alert('¡Código copiado al portapapeles!');
        }).catch(() => {
            alert('No se pudo copiar automáticamente.');
        });
    };

    // Cargar aportes de lenguaje (API + LocalStorage Fallback)
    window.cargarArchivosLenguaje = async function (lenguajeId) {
        const container = document.getElementById(`listaArchivos-${lenguajeId}`);
        if (!container) return;

        let archivos = [];

        // 1. Intentar API del servidor
        try {
            const res = await fetch(`/api/archivos/${lenguajeId}`);
            const data = await res.json();
            if (data.success && Array.isArray(data.archivos)) {
                archivos = data.archivos;
            }
        } catch (e) {
            // Servidor no disponible o tabla en proceso
        }

        // 2. Unir con aportes de localStorage
        try {
            const local = JSON.parse(localStorage.getItem(`rdslp_archivos_${lenguajeId}`) || '[]');
            archivos = [...local, ...archivos];
        } catch (e) {}

        if (archivos.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1; text-align:center; padding: 40px; color: var(--text-muted); background: var(--bg-input); border-radius: 10px;">
                    <p>Aún no hay archivos ni aportes subidos para este lenguaje.</p>
                    <button class="btn-upload-lang" style="margin-top: 14px;" onclick="window.cambiarPestana('subir')">¡Sé el primero en subir uno!</button>
                </div>
            `;
            return;
        }

        container.innerHTML = archivos.map((a, idx) => {
            const diffClass = a.dificultad === 'Fácil' ? 'badge-facil' : (a.dificultad === 'Difícil' ? 'badge-dificil' : 'badge-medio');
            const autor = a.autor_subida || a.autor || 'Comunidad';
            const fecha = a.created_at ? new Date(a.created_at).toLocaleDateString() : 'Reciente';

            return `
                <div class="lang-file-card">
                    <div>
                        <div class="lang-file-top">
                            <span class="lang-file-title">${escapeHtml(a.nombre_archivo || a.titulo)}</span>
                            <span class="badge-difficulty ${diffClass}">${escapeHtml(a.dificultad || 'Normal')}</span>
                        </div>
                        <div class="lang-file-author">Subido por ${escapeHtml(autor)} &bull; ${fecha}</div>
                        <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.4; margin-bottom: 12px;">
                            ${escapeHtml((a.contenido || '').substring(0, 100))}${a.contenido && a.contenido.length > 100 ? '...' : ''}
                        </p>
                    </div>
                    <div class="lang-file-actions">
                        <button class="btn-file-view" onclick="window.verAporteModal('${lenguajeId}', ${idx})">Ver Código Completo</button>
                    </div>
                </div>
            `;
        }).join('');

        // Guardar lista en memoria de ventana para el modal
        window[`cached_archivos_${lenguajeId}`] = archivos;
    };

    // Ver archivo completo en modal
    window.verAporteModal = function (lenguajeId, index) {
        const archivos = window[`cached_archivos_${lenguajeId}`] || [];
        const item = archivos[index];
        if (!item) return;

        const modal = document.getElementById('contentModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');

        if (!modal) return;

        modalTitle.textContent = item.nombre_archivo || item.titulo || 'Detalle del Aporte';
        modalBody.innerHTML = `
            <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 13px; color: var(--text-secondary);">Subido por: <strong>${escapeHtml(item.autor_subida || item.autor || 'Usuario')}</strong></span>
                <span style="font-size: 12px; padding: 3px 10px; border-radius: 12px; background: var(--bg-input); border: 1px solid var(--border-color);">${escapeHtml(item.dificultad || 'Normal')}</span>
            </div>
            <div class="code-container">
                <div class="code-header">
                    <span class="code-lang-label">Código Fuente</span>
                    <button class="btn-copy-code" onclick="navigator.clipboard.writeText(document.getElementById('modalCodigoPre').innerText); alert('¡Código copiado!');">Copiar</button>
                </div>
                <pre class="code-pre" id="modalCodigoPre">${escapeHtml(item.contenido || '')}</pre>
            </div>
        `;

        modal.classList.add('active');
    };

    // Subir archivo o código para el lenguaje
    window.guardarAporteLenguaje = async function (lenguajeId) {
        const titulo = document.getElementById('aporteTitulo')?.value.trim();
        const dificultad = document.getElementById('aporteDificultad')?.value;
        const contenido = document.getElementById('aporteContenido')?.value.trim();

        if (!titulo || !contenido) {
            alert('Por favor completa el título y el contenido del aporte.');
            return;
        }

        if (!currentUser) {
            alert('Debes iniciar sesión para subir aportes.');
            return;
        }

        const nuevoAporte = {
            lenguaje_id: lenguajeId,
            nombre_archivo: titulo,
            dificultad: dificultad,
            contenido: contenido,
            usuario_id: currentUser.id,
            autor_subida: currentUser.name,
            created_at: new Date().toISOString()
        };

        // 1. Guardar en API si responde
        try {
            await fetch('/api/archivos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nuevoAporte)
            });
        } catch (e) {
            console.log('Guardando en almacenamiento local...');
        }

        // 2. Guardar en localStorage para respaldo garantizado
        try {
            const list = JSON.parse(localStorage.getItem(`rdslp_archivos_${lenguajeId}`) || '[]');
            list.unshift(nuevoAporte);
            localStorage.setItem(`rdslp_archivos_${lenguajeId}`, JSON.stringify(list));
        } catch (e) {}

        // Limpiar formulario
        document.getElementById('aporteTitulo').value = '';
        document.getElementById('aporteContenido').value = '';

        alert('¡Aporte publicado con éxito para este lenguaje!');
        window.cambiarPestana('archivos');
        window.cargarArchivosLenguaje(lenguajeId);
    };

    // Comentarios
    function renderCommentsSection(langId, langName) {
        const comments = content ? content.getComments(langId) : [];
        return `
            <h3 class="lang-section-title">Comentarios y Discusión sobre ${escapeHtml(langName)} (${comments.length})</h3>
            <div class="comment-input-row">
                <input type="text" id="nuevoComentarioLang" class="comment-input" placeholder="Deja una duda, recomendación o experiencia con ${escapeHtml(langName)}...">
                <button type="button" class="btn-comment-submit" onclick="window.enviarComentarioLang('${langId}')">Comentar</button>
            </div>
            <div class="comments-list" id="listaComentariosLang">
                ${comments.length === 0
                    ? `<p style="color: var(--text-muted); font-size: 13px; margin-top: 10px;">Aún no hay comentarios. ¡Sé el primero en participar!</p>`
                    : comments.map(c => `
                        <div class="comment-card">
                            <div class="comment-header">
                                <span class="comment-author">${escapeHtml(c.authorName || 'Usuario')}</span>
                                <span class="comment-date">${new Date(c.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div class="comment-body">${escapeHtml(c.text)}</div>
                        </div>
                    `).join('')
                }
            </div>
        `;
    }

    window.enviarComentarioLang = function (langId) {
        const input = document.getElementById('nuevoComentarioLang');
        if (!input || !input.value.trim()) return;
        if (!currentUser) {
            alert('Debes iniciar sesión para comentar.');
            return;
        }

        if (content) {
            content.addComment(langId, input.value.trim(), currentUser.id, currentUser.name);
            input.value = '';
            loadLanguagePage();
        }
    };

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
});
