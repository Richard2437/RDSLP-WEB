<?php
// api/comments.php – endpoint para gestionar comentarios de posts
// -----------------------------------------------------------
// Usa Supabase table "comments" con columnas: id (auto), post_id, author, content, created_at

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
    // Obtener todos los comentarios o filtrar por post_id
    $query = '';
    if (isset($_GET['post_id'])) {
        $postId = intval($_GET['post_id']);
        $query = "?post_id=eq.$postId";
    }
    $url = rtrim($supabaseUrl, '/') . '/rest/v1/comments' . $query;

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
        echo json_encode(['error' => 'Failed to fetch comments', 'details' => $response]);
        exit;
    }
    echo $response; // ya es JSON
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $postId = $input['post_id'] ?? null;
    $author = $input['author'] ?? '';
    $content = $input['content'] ?? '';
    if (!$postId || trim($author) === '' || trim($content) === '') {
        http_response_code(400);
        echo json_encode(['error' => 'post_id, author and content are required']);
        exit;
    }
    $payload = json_encode([
        'post_id' => $postId,
        'author'  => $author,
        'content' => $content,
        'created_at' => date('Y-m-d H:i:s')
    ]);
    $url = rtrim($supabaseUrl, '/') . '/rest/v1/comments';
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
        echo json_encode(['error' => 'Failed to create comment', 'details' => $response]);
        exit;
    }
    http_response_code(201);
    echo $response; // Supabase returns the created row(s)
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
?>
