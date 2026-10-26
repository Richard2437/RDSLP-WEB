<?php
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if ($requestUri !== '/' && substr($requestUri, -1) === '/') {
    $requestUri = rtrim($requestUri, '/');
}
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
];
if (array_key_exists($requestUri, $staticRedirects)) {
    header('Location: ' . $staticRedirects[$requestUri]);
    exit;
}
$localPath = __DIR__ . $requestUri;
if (is_file($localPath)) {
    $mime = mime_content_type($localPath);
    header('Content-Type: ' . $mime);
    readfile($localPath);
    exit;
}
http_response_code(404);
echo "404 – Página no encontrada";
?>
