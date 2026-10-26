<?php
// index.php – router simple para Vercel
// Redirige a la página de login si la ruta es '/' o '/login'
// Sirve archivos estáticos existentes y devuelve 404 para lo desconocido.

// Obtén la ruta solicitada sin query string
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Normaliza la ruta (quitar barra final) excepto la raíz
if ($requestUri !== '/' && substr($requestUri, -1) === '/') {
    $requestUri = rtrim($requestUri, '/');
}

// Rutas especiales que deben redirigir a archivos HTML concretos
$staticRedirects = [
    '/'               => '/Static/login.html',
    '/login'          => '/Static/login.html',
    '/dashboard'      => '/Static/dashboard.html',
    '/sesion'         => '/Static/sesion.html',
    '/registro'       => '/Static/sesion.html',
    '/muro'           => '/Static/muro.html',
    '/comunidad'      => '/Static/comunidad.html',
    '/ejercicios'     => '/Static/ejercicios.html',
    '/libros'         => '/Static/libros.html',
    '/logica'         => '/Static/logica.html',
    '/perfil'         => '/Static/perfil.html',
    '/databases'      => '/DatabasesSection/databases.html',
    // Añade más rutas estáticas según necesites
];

if (array_key_exists($requestUri, $staticRedirects)) {
    header('Location: ' . $staticRedirects[$requestUri]);
    exit;
}

// Si la ruta apunta a un archivo físico dentro del proyecto, lo entregamos
$localPath = __DIR__ . $requestUri;
if (is_file($localPath)) {
    $mime = mime_content_type($localPath);
    header('Content-Type: ' . $mime);
    readfile($localPath);
    exit;
}

// Para cualquier otra ruta, devolvemos 404 genérico
http_response_code(404);
echo "404 – Página no encontrada";
?>
