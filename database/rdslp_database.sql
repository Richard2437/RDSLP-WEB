-- RDSLP - Red Social de Lenguajes de Programación


CREATE DATABASE IF NOT EXISTS rdslp_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE rdslp_db;

-- Tabla de ROLES

CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(10) NOT NULL UNIQUE,
    descripcion VARCHAR(100),
    -- Permisos del rol
    can_publish BOOLEAN DEFAULT TRUE,
    can_comment BOOLEAN DEFAULT TRUE,
    can_rate BOOLEAN DEFAULT TRUE,
    can_edit_own_content BOOLEAN DEFAULT TRUE,
    can_delete_own_content BOOLEAN DEFAULT TRUE,
    can_delete_others_content BOOLEAN DEFAULT FALSE,
    can_delete_others_comments BOOLEAN DEFAULT FALSE,
    can_manage_users BOOLEAN DEFAULT FALSE,
    can_manage_events BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Tabla de USUARIOS

CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    avatar VARCHAR(3) DEFAULT 'U',
    bio TEXT,
    rol_id INT NOT NULL DEFAULT 1,
    is_banned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (rol_id) REFERENCES roles(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;


-- Tabla de PUBLICACIONES (Muro Social)
-- Posts del muro con soporte para texto, imágenes,
-- videos y código compartido

CREATE TABLE IF NOT EXISTS publicaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    autor_id INT NOT NULL,
    tipo ENUM('general', 'recurso', 'pregunta', 'ejercicio') DEFAULT 'general',
    lenguaje VARCHAR(30),
    contenido TEXT NOT NULL,
    imagen_url VARCHAR(500),
    video_url VARCHAR(500),
    codigo TEXT,
    puntuacion_codigo INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (autor_id) REFERENCES usuarios(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tabla de LIKES (Me gusta)
-- relacion muchos a muchos

CREATE TABLE IF NOT EXISTS likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    publicacion_id INT NOT NULL,
    usuario_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_like (publicacion_id, usuario_id),

    FOREIGN KEY (publicacion_id) REFERENCES publicaciones(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tabla de COMENTARIOS

CREATE TABLE IF NOT EXISTS comentarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    publicacion_id INT NOT NULL,
    autor_id INT NOT NULL,
    texto TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (publicacion_id) REFERENCES publicaciones(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    FOREIGN KEY (autor_id) REFERENCES usuarios(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tabla de CONTENIDO
-- Contenido publicado en las secciones de lenguajes,
-- lógica, bases de datos, etc.

CREATE TABLE IF NOT EXISTS contenido (
    id INT AUTO_INCREMENT PRIMARY KEY,
    autor_id INT NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(50),
    tipo VARCHAR(50),
    url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (autor_id) REFERENCES usuarios(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tabla de CALIFICACIONES (Ratings)
-- Sistema de estrellas para calificar contenido

CREATE TABLE IF NOT EXISTS calificaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    contenido_id INT NOT NULL,
    usuario_id INT NOT NULL,
    calificacion INT NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_rating (contenido_id, usuario_id),

    FOREIGN KEY (contenido_id) REFERENCES contenido(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tabla de EJERCICIOS
-- Ejercicios de programación realizados por los usuarios
-- con su evaluación de IA

CREATE TABLE IF NOT EXISTS ejercicios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    titulo VARCHAR(100) NOT NULL,
    lenguaje VARCHAR(30) NOT NULL,
    codigo TEXT NOT NULL,
    puntuacion_total INT DEFAULT 0,
    funcionalidad INT DEFAULT 0,
    codigo_limpio INT DEFAULT 0,
    eficiencia INT DEFAULT 0,
    buenas_practicas INT DEFAULT 0,
    feedback TEXT,
    compartido BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tabla de EVENTOS
-- Eventos de la comunidad (talleres, charlas, etc.)


CREATE TABLE IF NOT EXISTS eventos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    fecha DATETIME NOT NULL,
    organizador_id INT NOT NULL,
    categoria VARCHAR(50),
    max_participantes INT DEFAULT 20,
    tipo_acceso ENUM('public', 'private') DEFAULT 'public',
    codigo_invitacion VARCHAR(50) DEFAULT NULL,
    estado ENUM('upcoming', 'active', 'finished', 'cancelled') DEFAULT 'upcoming',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (organizador_id) REFERENCES usuarios(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- de PARTICIPANTES DE EVENTOS
-- Relación muchos a muchos entre usuarios y eventos

CREATE TABLE IF NOT EXISTS evento_participantes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    evento_id INT NOT NULL,
    usuario_id INT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_participation (evento_id, usuario_id),

    FOREIGN KEY (evento_id) REFERENCES eventos(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tabla de MENSAJES (Chat General)
-- Mensajes del chat de la comunidad

CREATE TABLE IF NOT EXISTS mensajes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chat_id VARCHAR(100) DEFAULT 'general',
    autor_id INT NOT NULL,
    texto TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (autor_id) REFERENCES usuarios(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tabla de CHATS PRIVADOS
-- Conversaciones privadas entre dos usuarios

CREATE TABLE IF NOT EXISTS chats_privados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario1_id INT NOT NULL,
    usuario2_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_chat (usuario1_id, usuario2_id),

    FOREIGN KEY (usuario1_id) REFERENCES usuarios(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    FOREIGN KEY (usuario2_id) REFERENCES usuarios(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;


-- Tabla de LIBROS
CREATE TABLE IF NOT EXISTS libros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    autor VARCHAR(100),
    descripcion TEXT,
    url VARCHAR(500),
    usuario_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tabla de ARCHIVOS DE LENGUAJES / BD (Aportes comunitarios)
CREATE TABLE IF NOT EXISTS archivos_lenguajes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lenguaje_id VARCHAR(50) NOT NULL,
    nombre_archivo VARCHAR(200) NOT NULL,
    dificultad VARCHAR(20) DEFAULT 'Fácil',
    contenido TEXT NOT NULL,
    usuario_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tabla de MOTORES DE BASES DE DATOS
CREATE TABLE IF NOT EXISTS motores_db (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    abbr VARCHAR(10) NOT NULL,
    type VARCHAR(30) NOT NULL,
    file VARCHAR(100) NOT NULL,
    category VARCHAR(30) NOT NULL,
    color VARCHAR(20) NOT NULL,
    tagline VARCHAR(255),
    description TEXT NOT NULL,
    features TEXT NOT NULL,
    tags TEXT NOT NULL,
    code TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================
-- =====================================================
--               DATOS DE PRUEBA
-- =====================================================
-- Insertar ROLES
-- =====================================================
INSERT IGNORE INTO roles (nombre, descripcion, can_publish, can_comment, can_rate, can_edit_own_content, can_delete_own_content, can_delete_others_content, can_delete_others_comments, can_manage_users, can_manage_events) VALUES
('user', 'Usuario estándar', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, FALSE, FALSE, FALSE),
('moderator', 'Moderador de contenido', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, TRUE),
('admin', 'Administrador del sistema', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE);

-- =====================================================
-- Insertar USUARIOS DE PRUEBA
-- Contraseñas en texto plano (en producción usar hash)
-- =====================================================
INSERT IGNORE INTO usuarios (email, password, nombre, avatar, bio, rol_id, is_banned) VALUES
('admin@rdslp.com','admin123', 'Administrador',  'AD', 'Administrador del sistema RDSLP', 3, FALSE),
('moderador@rdslp.com',  'mod123',   'Moderador',      'MO', 'Moderador de contenido',          2, FALSE),
('usuario@rdslp.com',    'user123',  'Usuario Demo',   'US', 'Usuario de demostración',         1, FALSE),
('dev@rdslp.com',        'dev123',   'Desarrollador',  'DE', 'Desarrollador y entusiasta de la programación', 1, FALSE);

-- =====================================================
-- Insertar PUBLICACIONES DE PRUEBA (Muro)
-- =====================================================
INSERT INTO publicaciones (autor_id, tipo, lenguaje, contenido, codigo, puntuacion_codigo) VALUES
(3, 'general',   'javascript', 'Acabo de empezar a aprender JavaScript. Alguna recomendación de recursos?', NULL, NULL),
(2, 'recurso',   'general',    'Comparto esta guía de Git para principiantes que me ha sido muy útil.', NULL, NULL),
(1, 'ejercicio', 'javascript', 'He completado el ejercicio "Factorial de un número" con una puntuación de 95/100',
    'function factorial(n) {\n  if (n <= 1) return 1;\n  return n * factorial(n - 1);\n}', 95),
(4, 'pregunta',  'python',     'Alguien sabe cuál es la diferencia entre una lista y una tupla en Python?', NULL, NULL),
(1, 'recurso',   'java',       'Les comparto un tutorial completo de Spring Boot para APIs REST.', NULL, NULL);

-- =====================================================
-- Insertar LIKES DE PRUEBA
-- =====================================================
INSERT IGNORE INTO likes (publicacion_id, usuario_id) VALUES
(1, 1), (1, 2),          -- Post 1 tiene 2 likes
(2, 1), (2, 3), (2, 4),  -- Post 2 tiene 3 likes
(3, 2), (3, 3),          -- Post 3 tiene 2 likes
(4, 1), (4, 3),          -- Post 4 tiene 2 likes
(5, 2), (5, 3), (5, 4);  -- Post 5 tiene 3 likes

-- =====================================================
-- Insertar COMENTARIOS DE PRUEBA
-- =====================================================
INSERT IGNORE INTO comentarios (publicacion_id, autor_id, texto) VALUES
(1, 1, 'Te recomiendo Eloquent JavaScript, es gratis online!'),
(1, 4, 'También puedes ver los tutoriales de MDN Web Docs.'),
(3, 2, 'Excelente solución recursiva!'),
(3, 3, 'Podrías optimizarla con programación dinámica.'),
(4, 2, 'Las listas son mutables y las tuplas son inmutables.'),
(4, 1, 'Las tuplas también son más rápidas para iterar.');

-- =====================================================
-- Insertar CONTENIDO EDUCATIVO DE PRUEBA
-- =====================================================
INSERT IGNORE INTO contenido (autor_id, titulo, descripcion, categoria, tipo, url) VALUES
(1, 'Introducción a JavaScript',   'Conceptos básicos de JS para principiantes',       'lenguajes',  'tutorial',  NULL),
(1, 'Python desde cero',           'Guía completa de Python 3',                        'lenguajes',  'guia',      NULL),
(2, 'Patrones de diseño en Java',  'Los patrones más usados en desarrollo Java',       'lenguajes',  'articulo',  NULL),
(4, 'SQL para principiantes',      'Aprende consultas SQL desde lo básico',            'databases',  'tutorial',  NULL),
(1, 'Algoritmos de ordenamiento',  'Bubble Sort, Quick Sort, Merge Sort explicados',   'logica',     'tutorial',  NULL),
(2, 'Lógica de programación',      'Ejercicios de pensamiento lógico',                 'logica',     'ejercicio', NULL);

-- =====================================================
-- Insertar CALIFICACIONES DE PRUEBA
-- =====================================================
INSERT IGNORE INTO calificaciones (contenido_id, usuario_id, calificacion) VALUES
(1, 2, 5), (1, 3, 4), (1, 4, 5),   -- JS: promedio 4.7
(2, 1, 4), (2, 3, 5),               -- Python: promedio 4.5
(3, 1, 5), (3, 4, 4),               -- Java: promedio 4.5
(4, 1, 5), (4, 2, 4), (4, 3, 5),   -- SQL: promedio 4.7
(5, 2, 4), (5, 3, 5);               -- Algoritmos: promedio 4.5

-- =====================================================
-- Insertar EJERCICIOS DE PRUEBA
-- =====================================================
INSERT IGNORE INTO ejercicios (usuario_id, titulo, lenguaje, codigo, puntuacion_total, funcionalidad, codigo_limpio, eficiencia, buenas_practicas, feedback, compartido) VALUES
(1, 'Factorial de un número', 'javascript',
    'function factorial(n) {\n  if (n <= 1) return 1;\n  return n * factorial(n - 1);\n}',
    95, 100, 90, 95, 85,
    'El código es legible y sigue una estructura lógica.|Excelente uso de recursividad.|Considera manejar números negativos.',
    TRUE),
(3, 'Suma de dos números', 'python',
    'def suma(a, b):\n    return a + b\n\nprint(suma(2, 3))',
    80, 85, 80, 75, 80,
    'Buena implementación de la solución.|Te sugiero agregar validación de tipos.|La eficiencia algorítmica es adecuada.',
    FALSE),
(4, 'Verificar palíndromo', 'javascript',
    'function esPalindromo(str) {\n  const limpio = str.toLowerCase().replace(/[^a-z]/g, "");\n  return limpio === limpio.split("").reverse().join("");\n}',
    90, 95, 90, 85, 90,
    'Excelente manejo de casos especiales.|Buena limpieza de la cadena.|Código limpio y bien estructurado.',
    TRUE);

-- =====================================================
-- Insertar EVENTOS DE PRUEBA
-- =====================================================
INSERT IGNORE INTO eventos (titulo, descripcion, fecha, organizador_id, categoria, max_participantes, estado) VALUES
('Introducción a Python',
    'Sesión para principiantes sobre los fundamentos de Python',
    '2026-04-15 18:00:00', 1, 'lenguajes', 20, 'upcoming'),
('Patrones de Diseño en JavaScript',
    'Exploramos los patrones de diseño más usados en JS',
    '2026-04-20 19:00:00', 4, 'lenguajes', 15, 'upcoming'),
('SQL vs NoSQL: Cuándo usar cada uno',
    'Debate sobre bases de datos relacionales y no relacionales',
    '2026-04-25 17:00:00', 2, 'databases', 25, 'upcoming');

-- =====================================================
-- Insertar PARTICIPANTES DE EVENTOS
-- =====================================================
INSERT IGNORE INTO evento_participantes (evento_id, usuario_id) VALUES
(1, 3), (1, 4),   -- Evento Python: 2 participantes
(2, 1), (2, 3),   -- Evento JS: 2 participantes
(3, 1), (3, 4);   -- Evento SQL/NoSQL: 2 participantes

-- =====================================================
-- Insertar MENSAJES DE CHAT DE PRUEBA
-- =====================================================
INSERT IGNORE INTO mensajes (chat_id, autor_id, texto) VALUES
('general', 1, 'Bienvenidos al chat de RDSLP!'),
('general', 3, 'Hola a todos! Soy nuevo aquí.'),
('general', 2, 'Bienvenido! Si tienes dudas no dudes en preguntar.'),
('general', 4, 'Alguien tiene experiencia con React?'),
('general', 1, 'Sí, puedo ayudarte. Qué necesitas?');

-- =====================================================
-- Insertar MOTORES DE BASES DE DATOS DE PRUEBA (SQL)
-- =====================================================
INSERT IGNORE INTO motores_db (id, name, abbr, type, file, category, color, tagline, description, features, tags, code) VALUES
('db-mysql', 'MySQL', 'MY', 'mysql', 'mysql.html', 'relacional', '#4479a1',
 'El motor relacional open source más utilizado del mundo',
 'Base de datos relacional robusta con soporte ACID mediante InnoDB, replicación primaria-secundaria e indexación avanzada.',
 'Motor InnoDB con transacciones ACID|Indexación B-Tree y Full-Text|Replicación primaria-secundaria|Amplio ecosistema y soporte ORM',
 'SQL,InnoDB,ACID,Web',
 'CREATE TABLE usuarios (\n    id INT AUTO_INCREMENT PRIMARY KEY,\n    nombre VARCHAR(100) NOT NULL,\n    email VARCHAR(100) UNIQUE NOT NULL,\n    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nINSERT INTO usuarios (nombre, email) VALUES (\'Ana Lopez\', \'ana@ejemplo.com\');\nSELECT * FROM usuarios WHERE email LIKE \'%@ejemplo.com\';'),

('db-postgresql', 'PostgreSQL', 'PG', 'postgresql', 'postgresql.html', 'relacional', '#336791',
 'La base de datos relacional de código abierto más avanzada',
 'Soporte nativo para JSONB, extensiones potentes como PostGIS y pgvector, concurrencia MVCC e integridad transaccional estricta.',
 'Tipos de datos avanzados (JSONB, Arrays, UUID)|Extensiones nativas potentes (PostGIS, pgvector)|Aislamiento de transacciones SSI|Concurrencia MVCC optimizada',
 'SQL,JSONB,PostGIS,Extensible',
 'CREATE TABLE eventos (\n    id SERIAL PRIMARY KEY,\n    tipo VARCHAR(50),\n    payload JSONB\n);\n\nINSERT INTO eventos (tipo, payload) VALUES (\'login\', \'{"ip": "192.168.1.1", "exito": true}\');\nSELECT payload->>\'ip\' AS ip FROM eventos WHERE payload @> \'{"exito": true}\';'),

('db-sqlserver', 'SQL Server', 'MS', 'sqlserver', 'sqlserver.html', 'relacional', '#cc2927',
 'Plataforma empresarial integral de Microsoft con Azure',
 'Excelente para el ecosistema .NET con T-SQL, grupos de disponibilidad Always On, cifrado transparente de datos y Business Intelligence.',
 'T-SQL con capacidades avanzadas|Integración nativa con Azure y SSIS|Always On Availability Groups|Encriptación transparente de datos (TDE)',
 'T-SQL,Enterprise,Azure,.NET',
 'SELECT TOP 10 \n    c.Nombre,\n    COUNT(o.Id) AS TotalOrdenes,\n    SUM(o.Monto) AS TotalGastado\nFROM Clientes c\nINNER JOIN Ordenes o ON c.Id = o.ClienteId\nGROUP BY c.Nombre\nHAVING SUM(o.Monto) > 1000\nORDER BY TotalGastado DESC;'),

('db-oracle', 'Oracle DB', 'OR', 'oracle', 'oracle.html', 'relacional', '#f80000',
 'Líder en infraestructura de misión crítica corporativa',
 'Arquitectura multitenant, Oracle RAC para clústeres de alta disponibilidad, PL/SQL de máximo desempeño y resiliencia bancaria.',
 'Arquitectura Multi-tenant (PDB/CDB)|Oracle RAC para clústeres activos|PL/SQL altamente optimizado|Recuperación de desastres Data Guard',
 'PL/SQL,Banking,Clustering,Corporativo',
 'DECLARE\n    v_total NUMBER;\nBEGIN\n    SELECT COUNT(*) INTO v_total FROM empleados WHERE departamento_id = 10;\n    DBMS_OUTPUT.PUT_LINE(\'Total de empleados en el departamento: \' || v_total);\nEND;'),

('db-mongodb', 'MongoDB', 'MG', 'mongodb', 'mongodb.html', 'norelacional', '#47a248',
 'La base de datos de documentos NoSQL por excelencia',
 'Documentos flexibles BSON/JSON, sharding automático para escalabilidad horizontal y framework de agregación expresivo.',
 'Documentos flexibles BSON|Sharding automático y Replica Sets|Framework de Agregación ultra potente|Búsqueda por texto y geoespacial',
 'NoSQL,Documentos,BSON,Escalable',
 'db.usuarios.insertOne({\n    nombre: "Juan Perez",\n    email: "juan@ejemplo.com",\n    intereses: ["Node.js", "Bases de Datos", "Docker"],\n    activo: true\n});\n\ndb.usuarios.find({ intereses: "Node.js" }).pretty();'),

('db-redis', 'Redis', 'RD', 'redis', 'redis.html', 'norelacional', '#dc382d',
 'Almacenamiento en memoria ultrarrápido y caché distribuida',
 'Latencia en submilisegundos, estructuras de datos en memoria (Strings, Hashes, Lists, Sets), pub/sub y colas de alta velocidad.',
 'Tiempos de respuesta en submilisegundos|Estructuras de datos nativas (Hashes, Sets, Lists)|Persistencia configurable (RDB y AOF)|Mecanismos Pub/Sub y Streams',
 'En Memoria,Caché,Clave-Valor,Rápido',
 'SET sesion:usuario_42 "token_jwt_activo" EX 3600\nGET sesion:usuario_42\n\nHSET usuario:42 nombre "Carlos" visitas 15\nHINCRBY usuario:42 visitas 1'),

('db-cassandra', 'Cassandra', 'CS', 'cassandra', 'cassandra.html', 'norelacional', '#1287b1',
 'Base de datos distribuida de columnas anchas para Big Data',
 'Arquitectura sin punto único de falla (masterless), escritura ultrarrápida a escala planetaria y consultas mediante CQL.',
 'Arquitectura descentralizada Masterless|Escalabilidad horizontal lineal|Escrituras ultrarrápidas a gran escala|Lenguaje de consulta CQL similar a SQL',
 'Big Data,Distribuida,Columnar,High Write',
 'CREATE KEYSPACE red_social \nWITH replication = {\'class\': \'SimpleStrategy\', \'replication_factor\': 3};\n\nSELECT * FROM red_social.publicaciones WHERE usuario_id = 998 LIMIT 20;'),

('db-neo4j', 'Neo4j', 'N4', 'neo4j', 'neo4j.html', 'norelacional', '#008cc1',
 'Base de datos de grafos nativa para relaciones complejas',
 'Modelado directo de nodos, relaciones y propiedades, consultable con el lenguaje Cypher. Ideal para redes sociales y recomendaciones.',
 'Almacenamiento y procesamiento nativo de grafos|Lenguaje declarativo Cypher|Ideal para redes sociales y motores de recomendación|Detección de fraude y grafos de conocimiento',
 'Grafos,Cypher,Redes,Relaciones',
 'MATCH (u:Usuario {nombre: "Laura"})-[:SIGUE]->(amigo:Usuario)\nRETURN amigo.nombre AS Siguiendo;\n\nMATCH (u:Usuario {nombre: "Laura"})-[:SIGUE*2]-(sugerencia:Usuario)\nRETURN sugerencia.nombre, count(*) ORDER BY count(*) DESC;');

-- =====================================================
-- Insertar LIBROS DE PRUEBA
-- =====================================================
INSERT IGNORE INTO libros (titulo, autor, descripcion, url, usuario_id) VALUES
('Designing Data-Intensive Applications', 'Martin Kleppmann', 'El libro definitivo sobre arquitectura de datos, escalabilidad, consistencia y sistemas distribuidos.', 'https://dataintensive.net/', 1),
('Clean Code: A Handbook of Agile Software Craftsmanship', 'Robert C. Martin', 'Guía fundamental para escribir código limpio, mantenible y legible en cualquier lenguaje.', 'https://www.oreilly.com/', 1),
('MySQL High Performance (4th Edition)', 'Silvia Botros & Jeremy Tinley', 'Optimización avanzada de índices, consultas y arquitecturas de replicación en MySQL.', 'https://www.oreilly.com/', 2),
('Learning SQL: Generate, Manipulate, and Retrieve Data', 'Alan Beaulieu', 'Introducción y guía práctica sobre consultas SQL relacionales para cualquier motor.', 'https://www.oreilly.com/', 4);

-- =====================================================
-- Insertar ARCHIVOS DE LENGUAJES Y BD (Aportes)
-- =====================================================
INSERT IGNORE INTO archivos_lenguajes (lenguaje_id, nombre_archivo, dificultad, contenido, usuario_id) VALUES
('db-mysql', 'Optimización de Índices Compuestos', 'Medio', '-- Ejemplo de creación de índices compuestos para optimizar JOINs y WHEREs\nCREATE INDEX idx_usuario_fecha ON pedidos(usuario_id, fecha DESC);', 1),
('db-mysql', 'Procedimiento Almacenado de Facturación', 'Difícil', 'DELIMITER //\nCREATE PROCEDURE GenerarFactura(IN p_usuario_id INT)\nBEGIN\n    SELECT * FROM pedidos WHERE usuario_id = p_usuario_id;\nEND //\nDELIMITER ;', 2),
('db-postgresql', 'Búsqueda por Vector en JSONB', 'Medio', 'SELECT id, payload->>\'nombre\' AS cliente\nFROM ordenes\nWHERE payload @> \'{"estado": "aprobado"}\';', 4),
('db-mongodb', 'Pipeline de Agregación con $lookup', 'Difícil', 'db.pedidos.aggregate([\n  { $match: { estado: "completado" } },\n  { $lookup: { from: "usuarios", localField: "usuario_id", foreignField: "_id", as: "usuario" } }\n]);', 1);


-- =====================================================
-- =====================================================
--          VISTAS ÚTILES (CONSULTAS RÁPIDAS)
-- =====================================================
-- =====================================================

-- =====================================================
-- Vista: Lista de usuarios con su rol
-- =====================================================
CREATE OR REPLACE VIEW vista_usuarios AS
SELECT
    u.id,
    u.email,
    u.nombre,
    u.avatar,
    u.bio,
    r.nombre AS rol,
    u.is_banned,
    u.created_at
FROM usuarios u
JOIN roles r ON u.rol_id = r.id
ORDER BY u.id;

-- =====================================================
-- Vista: Publicaciones con información del autor
-- =====================================================
CREATE OR REPLACE VIEW vista_publicaciones AS
SELECT
    p.id,
    p.tipo,
    p.lenguaje,
    p.contenido,
    p.imagen_url,
    p.video_url,
    p.codigo,
    p.puntuacion_codigo,
    u.nombre AS autor,
    u.avatar AS autor_avatar,
    (SELECT COUNT(*) FROM likes l WHERE l.publicacion_id = p.id) AS total_likes,
    (SELECT COUNT(*) FROM comentarios c WHERE c.publicacion_id = p.id) AS total_comentarios,
    p.created_at
FROM publicaciones p
JOIN usuarios u ON p.autor_id = u.id
ORDER BY p.created_at DESC;

-- =====================================================
-- Vista: Eventos con información del organizador
-- =====================================================
CREATE OR REPLACE VIEW vista_eventos AS
SELECT
    e.id,
    e.titulo,
    e.descripcion,
    e.fecha,
    u.nombre AS organizador,
    e.categoria,
    e.max_participantes,
    (SELECT COUNT(*) FROM evento_participantes ep WHERE ep.evento_id = e.id) AS total_participantes,
    e.estado,
    e.created_at
FROM eventos e
JOIN usuarios u ON e.organizador_id = u.id
ORDER BY e.fecha;

-- =====================================================
-- Vista: Promedio de calificaciones por contenido
-- =====================================================
CREATE OR REPLACE VIEW vista_calificaciones AS
SELECT
    c.id,
    c.titulo,
    c.categoria,
    u.nombre AS autor,
    ROUND(AVG(cal.calificacion), 1) AS promedio,
    COUNT(cal.id) AS total_votos
FROM contenido c
JOIN usuarios u ON c.autor_id = u.id
LEFT JOIN calificaciones cal ON cal.contenido_id = c.id
GROUP BY c.id, c.titulo, c.categoria, u.nombre
ORDER BY promedio DESC;


-- =====================================================
-- =====================================================
--          CONSULTAS DE EJEMPLO
-- =====================================================
-- =====================================================

-- Ver todos los usuarios con su rol:
-- SELECT * FROM vista_usuarios;

-- Ver publicaciones del muro:
-- SELECT * FROM vista_publicaciones;

-- Ver eventos próximos:
-- SELECT * FROM vista_eventos WHERE estado = 'upcoming';

-- Ver calificaciones promedio:
-- SELECT * FROM vista_calificaciones;

-- Buscar usuario por email:
-- SELECT * FROM vista_usuarios WHERE email = 'admin@rdslp.com';

-- Ver ejercicios de un usuario:
-- SELECT * FROM ejercicios WHERE usuario_id = 1;

-- Ver comentarios de una publicación:
-- SELECT c.texto, u.nombre AS autor, c.created_at
-- FROM comentarios c
-- JOIN usuarios u ON c.autor_id = u.id
-- WHERE c.publicacion_id = 1;

-- Contar likes por publicación:
-- SELECT publicacion_id, COUNT(*) AS total_likes
-- FROM likes
-- GROUP BY publicacion_id
-- ORDER BY total_likes DESC;

