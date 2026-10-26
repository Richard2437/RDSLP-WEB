<?php
// api/likes.php – endpoint para gestionar "likes" en los posts
// -----------------------------------------------------------
// Tabla Supabase esperada: "likes" con columnas id (auto), post_id, user_id, created_at

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET,POST,OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$supabaseUrl = getenv('SUPABASE_URL');
$supabaseKey = getenv('SUPABASE_ANON_KEY');
if (!$supabaseUrl || !$supabaseKey) {
    http_response_code(500);
    echo json_encode(['error' => 'Supabase env vars not set']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Opcional: filtrar por post_id o user_id
    $query = '';
    $params = [];
    if (isset($_GET['post_id'])) {
        $params[] = 'post_id=eq.' . intval($_GET['post_id']);
    }
    if (isset($_GET['user_id'])) {
        $params[] = 'user_id=eq.' . intval($_GET['user_id']);
    }
    if ($params) {
        $query = '?' . implode('&', $params);
    }
    $url = rtrim($supabaseUrl, '/') . '/rest/v1/likes' . $query;

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL            => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => [
            'apikey: ' . $supabaseKey,
            'Authorization: Bearer ' . $supabaseKey,
            'Accept: application/json'
        ]
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch likes', 'details' => $response]);
        exit;
    }
    echo $response;
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $postId = $input['post_id'] ?? null;
    $userId = $input['user_id'] ?? null;
    if (!$postId || !$userId) {
        http_response_code(400);
        echo json_encode(['error' => 'post_id and user_id are required']);
        exit;
    }
    $payload = json_encode([
        'post_id'    => $postId,
        'user_id'    => $userId,
        'created_at' => date('Y-m-d H:i:s')
    ]);
    $url = rtrim($supabaseUrl, '/') . '/rest/v1/likes';
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL            => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_HTTPHEADER     => [
            'apikey: ' . $supabaseKey,
            'Authorization: Bearer ' . $supabaseKey,
            'Content-Type: application/json',
            'Prefer: return=representation'
        ]
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if (!in_array($httpCode, [201, 200])) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create like', 'details' => $response]);
        exit;
    }
    http_response_code(201);
    echo $response;
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
?>
