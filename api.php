<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Add user plans constants
define('PLAN_FREE', 'free');
define('PLAN_PREMIUM', 'premium');

// Add user data structure
$users = [
    // Example structure:
    // 'user@email.com' => [
    //     'name' => 'User Name',
    //     'plan' => PLAN_FREE,
    //     'created_at' => timestamp
    // ]
];

// Load users data if exists
if (file_exists('users.json')) {
    $users = json_decode(file_get_contents('users.json'), true) ?? [];
}

// Save users data
function saveUsers() {
    global $users;
    file_put_contents('users.json', json_encode($users));
}

// Handle user registration
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'register') {
    $email = $_POST['email'] ?? '';
    $name = $_POST['name'] ?? '';
    $plan = $_POST['plan'] ?? PLAN_FREE;
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid email']);
        exit;
    }
    
    if (isset($users[$email])) {
        http_response_code(400);
        echo json_encode(['error' => 'User already exists']);
        exit;
    }
    
    $users[$email] = [
        'name' => $name,
        'plan' => $plan,
        'created_at' => time()
    ];
    
    saveUsers();
    
    echo json_encode(['success' => true]);
    exit;
}

// Handle user login
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'login') {
    $email = $_POST['email'] ?? '';
    
    if (!isset($users[$email])) {
        http_response_code(400);
        echo json_encode(['error' => 'User not found']);
        exit;
    }
    
    echo json_encode([
        'success' => true,
        'user' => [
            'email' => $email,
            'name' => $users[$email]['name'],
            'plan' => $users[$email]['plan']
        ]
    ]);
    exit;
}

// Handle mindmap operations
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'get') {
    $filename = $_GET['filename'] ?? '';
    
    if (empty($filename)) {
        http_response_code(400);
        echo json_encode(['error' => 'Filename required']);
        exit;
    }
    
    $filepath = "data/{$filename}.json";
    
    if (file_exists($filepath)) {
        $data = json_decode(file_get_contents($filepath), true);
        
        // Check if this is a free user's mindmap
        $email = str_replace('_', '@', $filename);
        if (isset($users[$email]) && $users[$email]['plan'] === PLAN_FREE) {
            // Add visibility flag for free user mindmaps
            $data['is_public'] = true;
        }
        
        echo json_encode($data);
    } else {
        echo json_encode(null);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['filename'])) {
    $filename = $_POST['filename'];
    $data = $_POST['data'];
    
    if (empty($filename)) {
        http_response_code(400);
        echo json_encode(['error' => 'Filename required']);
        exit;
    }
    
    // Create data directory if it doesn't exist
    if (!file_exists('data')) {
        mkdir('data', 0777, true);
    }
    
    $filepath = "data/{$filename}.json";
    file_put_contents($filepath, json_encode($data));
    
    echo json_encode(['success' => true]);
    exit;
}

// Handle user plan upgrade
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'upgrade') {
    $email = $_POST['email'] ?? '';
    
    if (!isset($users[$email])) {
        http_response_code(400);
        echo json_encode(['error' => 'User not found']);
        exit;
    }
    
    $users[$email]['plan'] = PLAN_PREMIUM;
    saveUsers();
    
    echo json_encode(['success' => true]);
    exit;
}

// Handle public mindmaps list
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'public_mindmaps') {
    $public_mindmaps = [];
    
    foreach ($users as $email => $user) {
        if ($user['plan'] === PLAN_FREE) {
            $filename = str_replace('@', '_', $email);
            $filepath = "data/{$filename}.json";
            
            if (file_exists($filepath)) {
                $data = json_decode(file_get_contents($filepath), true);
                $public_mindmaps[] = [
                    'email' => $email,
                    'name' => $user['name'],
                    'title' => $data['text'] ?? 'Untitled',
                    'created_at' => $user['created_at']
                ];
            }
        }
    }
    
    echo json_encode($public_mindmaps);
    exit;
} 