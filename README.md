<p align="center">
  <strong>🌐 RDSLP</strong><br>
  <em>Red Social de Lenguajes de Programación</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5">
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase">
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel">
  <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="MIT License">
</p>

---

## 📋 Descripción

**RDSLP** es una plataforma web educativa tipo red social enfocada en lenguajes de programación. Permite a los usuarios registrarse, iniciar sesión, explorar contenido educativo de lógica, lenguajes, bases de datos y libros, además de interactuar en un muro comunitario y participar en eventos.

### Características principales

- 🔐 **Autenticación segura** con Supabase (email/contraseña + Google OAuth)
- 👥 **Sistema de roles**: `user`, `moderator`, `admin`, `banned`
- 📝 **Muro social** con publicaciones, likes y comentarios
- 💻 **Editor de ejercicios** con ejecución de código en vivo
- 📚 **Biblioteca de libros** recomendados de programación
- 🧠 **Sección de lógica** de programación
- 🗄️ **Sección de bases de datos** con contenido educativo
- 🏘️ **Comunidades** públicas y privadas con código de invitación
- ⚖️ **Cumplimiento legal** Habeas Data (Ley 1581 de 2012) y Términos de Servicio
- 🛡️ **Panel de Administración** con gestión de usuarios, roles y baneos

---

## 🏗️ Arquitectura del Proyecto

```
RDSLP-WEB/
├── Static/                    # Páginas HTML del sitio
│   ├── login.html             # Inicio de sesión
│   ├── sesion.html            # Registro de nuevos usuarios
│   ├── dashboard.html         # Panel principal
│   ├── muro.html              # Muro de publicaciones
│   ├── ejercicios.html        # Editor de ejercicios
│   ├── logica.html            # Contenido de lógica
│   ├── libros.html            # Biblioteca de libros
│   ├── comunidad.html         # Salas y comunidades
│   ├── perfil.html            # Perfil del usuario
│   └── databases.html         # Sección de bases de datos
├── JS/                        # Lógica JavaScript del frontend
│   ├── supabase-client.js     # Cliente oficial de Supabase (Auth, DB, OAuth)
│   ├── auth.js                # Autenticación, roles, ban/unban
│   ├── login.js               # Lógica del formulario de login
│   ├── sesion.js              # Registro y validación legal
│   ├── dashboard.js           # Panel principal y administración
│   ├── muro.js                # Publicaciones y comentarios
│   ├── ejercicios.js          # Editor de código y ejecución
│   ├── comunidad.js           # Salas públicas/privadas
│   ├── perfil.js              # Perfil del usuario
│   ├── logica.js              # Contenido de lógica
│   ├── libros.js              # Biblioteca
│   ├── databases.js           # Bases de datos
│   ├── legal.js               # Módulo legal (Habeas Data / TOS)
│   └── api-client.js          # Cliente API para backend serverless
├── Styles/                    # Hojas de estilo CSS
├── api/                       # Funciones serverless (Vercel)
│   ├── config.js              # Expone variables de entorno públicas
│   ├── auth.js                # Autenticación backend con JWT
│   ├── posts.js               # CRUD de publicaciones
│   ├── comments.js            # CRUD de comentarios
│   └── likes.js               # Sistema de likes
├── database/                  # Scripts SQL
│   └── supabase_setup.sql     # Schema de Supabase (tablas, RLS, triggers)
├── .env.example               # Plantilla de variables de entorno
├── .gitignore                 # Reglas de exclusión DevSecOps
├── vercel.json                # Configuración de despliegue en Vercel
├── package.json               # Metadata del proyecto
└── LICENSE                    # Licencia MIT
```

---

## 🚀 Instalación y Despliegue

### Requisitos previos

- Cuenta en [Supabase](https://supabase.com) (proyecto creado)
- Cuenta en [Vercel](https://vercel.com) (para despliegue)
- [Node.js](https://nodejs.org) ≥ 18 (para desarrollo local opcional)

### 1. Clonar el repositorio

```bash
git clone https://github.com/Richard2437/RDSLP-WEB.git
cd RDSLP-WEB
```

### 2. Configurar variables de entorno

Copia el archivo de ejemplo y completa con tus credenciales:

```bash
cp .env.example .env
```

Edita `.env` con tus valores:

```env
# Puerto del servidor (solo desarrollo local)
PORT=3000

# Supabase - Configuración pública
SUPABASE_URL=https://TU_PROJECT_ID.supabase.co
SUPABASE_ANON_KEY=tu_anon_key_publica

# JWT Secret para el backend serverless
JWT_SECRET=tu_secreto_jwt_seguro
```

> ⚠️ **IMPORTANTE**: Nunca subas el archivo `.env` al repositorio. Está incluido en `.gitignore`.

### 3. Configurar Supabase

1. Ve a tu [Dashboard de Supabase](https://supabase.com/dashboard)
2. Abre el **SQL Editor** de tu proyecto
3. Ejecuta el script [`database/supabase_setup.sql`](database/supabase_setup.sql) para crear las tablas, políticas RLS y triggers

### 4. Configurar Google OAuth (opcional)

Para habilitar el login con Google:

1. **En Google Cloud Console:**
   - Crea un proyecto en [Google Cloud Console](https://console.cloud.google.com)
   - Ve a **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
   - Tipo de aplicación: **Web Application**
   - Agrega como **Authorized redirect URIs**: `https://TU_PROJECT_ID.supabase.co/auth/v1/callback`
   - Copia el **Client ID** y **Client Secret**

2. **En el Dashboard de Supabase:**
   - Ve a **Authentication → Providers → Google**
   - Habilita el toggle de **Google**
   - Pega el **Client ID** y **Client Secret** de Google Cloud
   - Guarda la configuración

> 📌 Sin esta configuración, el botón "Continuar con Google" mostrará el error:  
> `{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}`

### 5. Desplegar en Vercel

1. Conecta tu repositorio en [Vercel](https://vercel.com/new)
2. Configura las **Environment Variables** en Vercel:

   | Variable | Valor |
   |---|---|
   | `SUPABASE_URL` | `https://TU_PROJECT_ID.supabase.co` |
   | `SUPABASE_ANON_KEY` | Tu clave pública (anon key) |
   | `JWT_SECRET` | Un secreto fuerte para firmar JWT |

3. Despliega el proyecto

### 6. Asignar roles

Desde el SQL Editor de Supabase, puedes asignar roles a cualquier usuario:

```sql
SELECT public.asignar_rol('correo@ejemplo.com', 'admin');
-- Roles disponibles: 'user', 'moderator', 'admin', 'banned'
```

---

## 🛡️ Seguridad (DevSecOps)

### Gestión de secretos

| Práctica | Implementación |
|---|---|
| **No hardcodear credenciales** | Las claves de Supabase se inyectan desde variables de entorno via `/api/config` |
| **`.env` en `.gitignore`** | El archivo `.env` nunca se sube al repositorio |
| **Variables de entorno en Vercel** | Las credenciales se configuran en el panel de Vercel, no en el código |
| **Separación cliente/servidor** | Los secretos (`JWT_SECRET`) solo se usan en funciones serverless (`/api/*`) |

### Row Level Security (RLS)

La base de datos en Supabase usa **Row Level Security** para proteger los datos:

- **Perfiles**: Lectura pública, escritura autenticada
- **Roles**: Solo modificables desde funciones SQL con `SECURITY DEFINER`
- **Trigger automático**: Los perfiles se sincronizan automáticamente al registrar un usuario

### Buenas prácticas implementadas

- ✅ Credenciales servidas desde endpoint serverless (`/api/config`)
- ✅ `.gitignore` con reglas DevSecOps (archivos `.env`, certificados, IDE, etc.)
- ✅ Validación de inputs en cliente y servidor
- ✅ CORS configurado en funciones serverless
- ✅ JWT firmado con secreto del lado del servidor
- ✅ Políticas RLS en Supabase para control de acceso a nivel de fila
- ✅ Sesión gestionada por Supabase Auth (tokens seguros)
- ✅ Headers de seguridad configurados en Vercel

---

## 🔑 Roles de Usuario

| Rol | Permisos |
|---|---|
| `user` | Acceso básico: publicar, comentar, explorar contenido |
| `moderator` | Permisos intermedios de moderación |
| `admin` | Acceso total: gestionar usuarios, banear, cambiar roles |
| `banned` | Cuenta suspendida: sin acceso a la plataforma |

---

## ⚖️ Cumplimiento Legal

- **Habeas Data (Ley 1581 de 2012)**: Política de tratamiento de datos personales con derechos ARCO
- **Términos de Servicio**: Reglas de convivencia, prohibición de código malicioso
- **Consentimiento informado**: Checkbox obligatorio en el registro con fecha ISO de aceptación
- **No venta de datos**: RDSLP no cede datos a terceros con fines comerciales

---

## 🛠️ Tecnologías

| Categoría | Tecnología |
|---|---|
| Frontend | HTML5, CSS3, JavaScript (Vanilla) |
| Tipografía | Google Fonts (Inter) |
| UI Framework | Bootstrap 5.3 (CDN) |
| Backend (BaaS) | Supabase (Auth, Database, RLS) |
| Serverless | Vercel Functions (Node.js) |
| Hosting | Vercel |
| Base de datos | PostgreSQL (Supabase) |

---

## 📄 Licencia

Este proyecto está bajo la [Licencia MIT](LICENSE).

---

<p align="center">
  <sub>Desarrollado como proyecto ABP Final · 2026</sub>
</p>