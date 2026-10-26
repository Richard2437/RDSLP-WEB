<?php
// api/posts.php – endpoint para gestionar publicaciones (posts)
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET,POST,OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Cargar variables de entorno de Supabase
$supabaseUrl = getenv('SUPABASE_URL');
$supabaseKey = getenv('SUPABASE_ANON_KEY');
if (!$supabaseUrl || !$supabaseKey) {
    http_response_code(500);
    echo json_encode(['error' => 'Supabase env vars not set']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // TODO: reemplazar con llamada real a Supabase (usando curl o SDK)
    // Simulación de respuesta: lista de posts
    $dummyPosts = [
        ['id' => 1, 'title' => 'Primer post', 'content' => 'Contenido del primer post'],
        ['id' => 2, 'title' => 'Segundo post', 'content' => 'Más contenido']
    ];
    echo json_encode($dummyPosts);
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (empty($input['title']) || empty($input['content'])) {
        http_response_code(400);
        echo json_encode(['error' => 'title and content required']);
        exit;
    }
    // Aquí deberías insertar en Supabase (ejemplo con curl) y devolver el registro creado.
    // Simulación de respuesta:
    $newPost = [
        'id' => rand(1000, 9999),
        'title' => $input['title'],
        'content' => $input['content']
    ];
    http_response_code(201);
    echo json_encode($newPost);
    exit;
}

// Métodos no soportados
http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
?>
