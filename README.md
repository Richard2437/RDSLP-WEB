# RDSLP-WEB

Bienvenido a la plataforma de Redes de Soporte de Lenguaje de Programación (RDSLP).

##  Características Principales

-  **Autenticación Segura**: Inicio de sesión y registro verificados por Supabase Auth.
-  **Comunidad Dinámica**:
  -  Grupos de interés organizados por tecnologías.
  -  Eventos con sistema de registro público/privado.
  -  Sistema de invitaciones con códigos QR.
-  **Recursos de Aprendizaje**:
  -  Editor colaborativo en tiempo real para crear y compartir archivos.
  -  Organización jerárquica de archivos por lenguaje.
  -  Control de versiones y diff viewer.
-  **Herramientas de Productividad**:
  -  Chat en tiempo real con moderación inteligente.
  -  Desafíos de código integrados.
  -  Sistema de gestión de tareas.

##  Instalación y Configuración

### Requisitos Previos

- Node.js (v16 o superior recomendado)
- MySQL 8.0+ o MariaDB

### Configuración del Entorno

1. Copia el archivo `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```

2. Configura las variables de entorno:
   ```bash
   # Base de datos MySQL
   DB_HOST=localhost
   DB_USER=tu_usuario
   DB_PASSWORD=tu_contraseña
   DB_NAME=rdslp_db
   DB_PORT=3306
   
   # Supabase (opcional, para autenticación)
   SUPABASE_URL=tu_supabase_url
   SUPABASE_ANON_KEY=tu_supabase_anon_key
   ```

### Configuración de la Base de Datos

1. Ejecuta las migraciones para crear las tablas:
   ```bash
   node setup_database.js
   ```

##  Desarrollo

### Estructura del Proyecto

- `api/`: Lógica del backend y rutas API
- `routes/`: Definiciones de rutas
- `public/`: Archivos estáticos (HTML, CSS, JS)
- `Static/`: Activos estáticos y plantillas HTML
- `setup_database.js`: Script de inicialización de base de datos

### Ejecución del Servidor

1. Instala las dependencias:
   ```bash
   npm install
   ```

2. Inicia el servidor:
   ```bash
   node server.js
   ```

El servidor se iniciará en `http://localhost:3000`.

##  Seguridad

### Integración con Supabase Auth

La plataforma utiliza Supabase Auth para:
- Registro y login de usuarios
- Verificación de correo electrónico
- Recuperación de contraseña
- Gestión de sesiones seguras

### Configuración de Seguridad

- Asegúrate de configurar `SESSION_SECRET` en el archivo `.env`
- Utiliza HTTPS en producción
- Implementa rate limiting para prevenir abusos
- Configura políticas de seguridad de CSP (Content Security Policy)

##  Colaboración

### Contribuyendo al Proyecto

1. Crea una rama para tu feature:
   ```bash
   git checkout -b feature/nombre-de-la-feature
   ```

2. Desarrolla tu feature y haz commits descriptivos:
   ```bash
   git add .
   git commit -m "feat: descripción de la feature"
   ```

3. Crea un Pull Request para revisión

### Convenciones de Código

- Sigue las guías de estilo de Airbnb
- Utiliza comentarios descriptivos
- Nombra variables de forma clara y concisa
- Sigue el patrón de diseño MVC (Model-View-Controller)

##  Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

##  Soporte

Si tienes problemas o preguntas:
- Revisa la documentación del proyecto
- Consulta los logs del servidor (`logs/server.log`)
- Si eres administrador, revisa `server.js` para opciones de depuración

---

**RDSLP - Redes de Soporte de Lenguaje de Programación**

*Construyendo comunidades de aprendizaje en tecnología*

Creado por: Ricardo Jaraba Gallego
