<?php
// api/auth.php – endpoint de autenticación con Supabase
// ---------------------------------------------------
// Requisitos:
//   - PHP 8.2 (runtime Vercel)
//   - Extensión curl habilitada (incluida por defecto en PHP de Vercel)
//   - Variables de entorno: SUPABASE_URL, SUPABASE_ANON_KEY, JWT_SECRET
//   - Opcional: composer require firebase/php-jwt para generar JWT

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST,OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$supabaseUrl = getenv('SUPABASE_URL');
$supabaseKey = getenv('SUPABASE_ANON_KEY');
$jwtSecret   = getenv('JWT_SECRET');

if (!$supabaseUrl || !$supabaseKey || !$jwtSecret) {
    http_response_code(500);
    echo json_encode(['error' => 'Supabase env vars or JWT secret not set']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$email    = $input['email'] ?? '';
$password = $input['password'] ?? '';

// ------------------- Validación y sanitización -------------------
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid email format']);
    exit;
}
$password = trim($password);
if (strlen($password) < 6) {
    http_response_code(400);
    echo json_encode(['error' => 'Password must be at least 6 characters']);
    exit;
}

// ------------------- Llamada a Supabase (auth) -------------------
$authEndpoint = rtrim($supabaseUrl, '/') . '/auth/v1/token';
$postData = http_build_query([
    'grant_type' => 'password',
    'email'      => $email,
    'password'   => $password
]);

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL            => $authEndpoint,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $postData,
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/x-www-form-urlencoded',
        'apikey: ' . $supabaseKey,
        'Accept: application/json'
    ]
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    http_response_code(401);
    echo json_encode(['error' => 'Supabase authentication failed', 'details' => json_decode($response, true)]);
    exit;
}

$authData = json_decode($response, true);
$accessToken = $authData['access_token'] ?? '';
$refreshToken = $authData['refresh_token'] ?? '';

// ------------------- Generar JWT propio (opcional) -------------------
// Si deseas firmar tu propio JWT, usa la librería firebase/php-jwt.
// Aquí se muestra un ejemplo sin dependencia (solo base64 sin firma) por simplicidad.
$payload = [
    'sub' => $email,
    'iat' => time(),
    'exp' => time() + 3600, // 1 hour
    'supabase_access' => $accessToken
];
$header = ['alg' => 'HS256', 'typ' => 'JWT'];
$base64UrlHeader = rtrim(strtr(base64_encode(json_encode($header)), '+/', '-_'), '=');
$base64UrlPayload = rtrim(strtr(base64_encode(json_encode($payload)), '+/', '-_'), '=');
$signature = hash_hmac('sha256', "$base64UrlHeader.$base64UrlPayload", $jwtSecret, true);
$base64UrlSignature = rtrim(strtr(base64_encode($signature), '+/', '-_'), '=');
$jwt = "$base64UrlHeader.$base64UrlPayload.$base64UrlSignature";

http_response_code(200);
echo json_encode([
    'message'       => 'Authenticated',
    'access_token'  => $accessToken,
    'refresh_token' => $refreshToken,
    'jwt'           => $jwt
]);
?>
