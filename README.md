# 🔐 Sistema de Autenticación Híbrido con Node.js

Sistema completo de autenticación que combina **Passport Local**, **JWT** y **OAuth GitHub**, implementado con Node.js, Express y MongoDB.

---

## 📋 Tabla de Contenidos

- [Tecnologías](#tecnologías)
- [Arquitectura](#arquitectura)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Ejecución](#ejecución)
- [Endpoints](#endpoints)
- [Ejemplos Postman](#ejemplos-postman)
- [Estructura del Proyecto](#estructura-del-proyecto)

---

## 🛠 Tecnologías

| Tecnología | Versión | Uso |
|------------|---------|-----|
| Node.js | ≥ 18.x | Runtime |
| Express | ^4.19 | Framework HTTP |
| MongoDB | ≥ 6.x | Base de datos |
| Mongoose | ^8.4 | ODM |
| Passport.js | ^0.7 | Autenticación |
| passport-local | ^1.0 | Estrategia local |
| passport-github2 | ^0.1 | Estrategia OAuth |
| jsonwebtoken | ^9.0 | JWT |
| bcrypt | ^5.1 | Hash de contraseñas |
| express-session | ^1.18 | Gestión de sesiones |
| connect-mongo | ^5.1 | Store de sesiones en MongoDB |
| helmet | ^7.1 | Seguridad HTTP |
| cors | ^2.8 | Cross-Origin Resource Sharing |
| cookie-parser | ^1.4 | Parseo de cookies |
| dotenv | ^16.4 | Variables de entorno |

---

## 🏗 Arquitectura

```
src/
├── config/
│   ├── database.js      ← Conexión MongoDB con Mongoose
│   ├── passport.js      ← Configuración global de Passport
│   └── session.js       ← Configuración de express-session + connect-mongo
├── models/
│   ├── user.model.js    ← Schema de Usuario con Mongoose
│   └── pet.model.js     ← Schema de Mascota (feature de adopciones)
├── strategies/
│   ├── local.strategy.js  ← Passport Local (email + password)
│   └── github.strategy.js ← Passport GitHub OAuth
├── controllers/
│   ├── auth.controller.js      ← Lógica de register, login, logout, GitHub
│   ├── user.controller.js      ← Lógica de profile, admin, session
│   └── adoption.controller.js  ← Lógica CRUD de mascotas/adopciones
├── middlewares/
│   ├── auth.middleware.js       ← verifyToken, verifyAdmin
│   ├── validation.middleware.js ← validateRegister, validateLogin
│   └── error.middleware.js      ← Manejo centralizado de errores
├── routes/
│   ├── auth.routes.js          ← Rutas /api/v1/auth/*
│   ├── user.routes.js          ← Rutas /api/v1/profile, /admin, /session
│   ├── adoption.router.js      ← Rutas /api/adoptions (CRUD)
│   └── adoption.router.test.js ← Tests funcionales (Jest + Supertest)
├── app.js               ← Construye la app de Express (sin levantar el server)
└── server.js             ← Punto de entrada: conecta Mongo y levanta el server
```

---

## ⚙️ Instalación

### Prerrequisitos

- Node.js ≥ 18.x
- MongoDB (Local)
- Cuenta en GitHub (para OAuth)

### Pasos

```bash
# 1. Clonar o crear el directorio del proyecto
mkdir auth-system && cd auth-system

# 2. Instalar dependencias
npm install

# 3. Copiar el archivo de variables de entorno
cp .env.example .env

# 4. Editar .env con tus valores reales
nano .env
```

---

## 🔧 Configuración

### Variables de Entorno (`.env`)

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/auth_system
SESSION_SECRET=una_cadena_aleatoria_muy_larga_y_segura
JWT_SECRET=otra_cadena_aleatoria_muy_larga_y_segura
GITHUB_CLIENT_ID=tu_client_id_de_github
GITHUB_CLIENT_SECRET=tu_client_secret_de_github
GITHUB_CALLBACK_URL=http://localhost:3000/api/v1/auth/github/callback
NODE_ENV=development
```

### Configurar OAuth GitHub

1. Ir a **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**
2. Configurar:
   - **Application name**: `Auth System`
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/v1/auth/github/callback`
3. Copiar el **Client ID** y generar un **Client Secret**
4. Pegarlos en el `.env`

### Crear usuario Admin manualmente

```javascript
// En MongoDB Compass o mongosh:
db.users.updateOne(
  { email: "tu@email.com" },
  { $set: { role: "admin" } }
)
```

---

## 🚀 Ejecución

```bash
# Modo desarrollo (con nodemon, recarga automática)
npm run dev

# Modo producción
npm run start
```

El servidor iniciará en `http://localhost:3000`

---

## 📡 Endpoints

### Autenticación

| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| `POST` | `/api/v1/auth/register` | Registrar usuario | Público |
| `POST` | `/api/v1/auth/login` | Login local | Público |
| `GET` | `/api/v1/auth/github` | Iniciar OAuth GitHub | Público |
| `GET` | `/api/v1/auth/github/callback` | Callback OAuth | Público |
| `POST` | `/api/v1/auth/logout` | Cerrar sesión | Autenticado |

### Rutas Protegidas

| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| `GET` | `/api/v1/profile` | Perfil del usuario | JWT requerido |
| `GET` | `/api/v1/admin` | Panel admin | JWT + rol admin |
| `GET` | `/api/v1/session` | Info de sesión | Público |

### Adopciones de Mascotas

| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| `GET` | `/api/adoptions` | Listar mascotas (filtro opcional `?adopted=true\|false`) | Público |
| `GET` | `/api/adoptions/:id` | Obtener una mascota por id | Público |
| `POST` | `/api/adoptions` | Registrar mascota nueva | JWT + rol admin |
| `PUT` | `/api/adoptions/:id` | Actualizar mascota (ej. marcarla adoptada) | JWT + rol admin |
| `DELETE` | `/api/adoptions/:id` | Eliminar mascota | JWT + rol admin |

---

## 📬 Ejemplos Postman

### 1. Registro de Usuario

```http
POST http://localhost:3000/api/v1/auth/register
Content-Type: application/json

{
  "username": "juanperez",
  "email": "juan@example.com",
  "password": "miPassword123"
}
```

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "message": "Usuario registrado correctamente.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "667a1b2c3d4e5f6789012345",
    "username": "juanperez",
    "email": "juan@example.com",
    "role": "user",
    "createdAt": "2024-06-15T10:30:00.000Z"
  }
}
```

**Error email duplicado (409):**
```json
{
  "success": false,
  "message": "El email ya está registrado.",
  "code": "EMAIL_DUPLICATE"
}
```

---

### 2. Login

```http
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "email": "juan@example.com",
  "password": "miPassword123"
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Login exitoso.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "667a1b2c3d4e5f6789012345",
    "username": "juanperez",
    "email": "juan@example.com",
    "role": "user",
    "lastLogin": "2024-06-15T10:35:00.000Z"
  }
}
```

**Error credenciales inválidas (401):**
```json
{
  "success": false,
  "message": "Email o contraseña incorrectos.",
  "code": "INVALID_CREDENTIALS"
}
```

---

### 3. Perfil (ruta protegida)

```http
GET http://localhost:3000/api/v1/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Perfil obtenido correctamente.",
  "user": {
    "id": "667a1b2c3d4e5f6789012345",
    "username": "juanperez",
    "email": "juan@example.com",
    "role": "user",
    "githubUsername": null,
    "avatar": null,
    "isActive": true,
    "lastLogin": "2024-06-15T10:35:00.000Z",
    "createdAt": "2024-06-15T10:30:00.000Z"
  },
  "tokenInfo": {
    "userId": "667a1b2c3d4e5f6789012345",
    "role": "user",
    "issuedAt": "2024-06-15T10:35:00.000Z",
    "expiresAt": "2024-06-15T11:35:00.000Z"
  }
}
```

**Sin token (401):**
```json
{
  "success": false,
  "message": "Acceso denegado. Token no proporcionado.",
  "code": "NO_TOKEN"
}
```

---

### 4. Admin (JWT + rol admin)

```http
GET http://localhost:3000/api/v1/admin
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Panel de administrador.",
  "admin": {
    "id": "667a1b2c3d4e5f6789012345",
    "username": "adminuser",
    "email": "admin@example.com",
    "role": "admin"
  },
  "stats": {
    "totalUsers": 42,
    "activeUsers": 40,
    "inactiveUsers": 2,
    "githubUsers": 15,
    "adminUsers": 2,
    "localUsers": 27
  },
  "recentUsers": [...]
}
```

**Sin permisos (403):**
```json
{
  "success": false,
  "message": "Acceso denegado. Se requieren permisos de administrador.",
  "code": "FORBIDDEN"
}
```

---

### 5. Logout

```http
POST http://localhost:3000/api/v1/auth/logout
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Sesión cerrada correctamente."
}
```

---

### 6. Sesión

```http
GET http://localhost:3000/api/v1/session
```

**Con sesión activa (200):**
```json
{
  "success": true,
  "message": "Sesión activa.",
  "session": {
    "active": true,
    "sessionId": "abc123xyz789",
    "userId": "667a1b2c3d4e5f6789012345",
    "cookie": {
      "httpOnly": true,
      "secure": false,
      "sameSite": "lax",
      "maxAge": 86400000
    },
    "user": {
      "id": "667a1b2c3d4e5f6789012345",
      "username": "juanperez",
      "email": "juan@example.com",
      "role": "user"
    }
  }
}
```

---

## 🔑 Ejemplo de JWT

### Header (Base64 decodificado)
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

### Payload (Base64 decodificado)
```json
{
  "userId": "667a1b2c3d4e5f6789012345",
  "role": "user",
  "iat": 1718444100,
  "exp": 1718447700,
  "iss": "auth-system",
  "aud": "auth-system-users"
}
```

### Token completo (ejemplo)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NjdhMWIyYzNkNGU1ZjY3ODkwMTIzNDUiLCJyb2xlIjoidXNlciIsImlhdCI6MTcxODQ0NDEwMCwiZXhwIjoxNzE4NDQ3NzAwLCJpc3MiOiJhdXRoLXN5c3RlbSIsImF1ZCI6ImF1dGgtc3lzdGVtLXVzZXJzIn0.FIRMA_HMAC_SHA256
```

---

## 🍃 Ejemplos de Documentos MongoDB

### Usuario Local
```json
{
  "_id": "ObjectId('667a1b2c3d4e5f6789012345')",
  "username": "juanperez",
  "email": "juan@example.com",
  "password": "$2b$12$KIXlGZ6Y8hN3d.mP7wQ9iuLkjTzXoPvV5rBsI1yWlRhcMDqEfAzKm",
  "role": "user",
  "githubId": null,
  "githubUsername": null,
  "avatar": null,
  "isActive": true,
  "lastLogin": "2024-06-15T10:35:00.000Z",
  "createdAt": "2024-06-15T10:30:00.000Z",
  "updatedAt": "2024-06-15T10:35:00.000Z"
}
```

### Usuario OAuth GitHub
```json
{
  "_id": "ObjectId('667a1b2c3d4e5f6789012346')",
  "username": "githubuser",
  "email": "githubuser@users.noreply.github.com",
  "password": null,
  "role": "user",
  "githubId": "12345678",
  "githubUsername": "githubuser",
  "avatar": "https://avatars.githubusercontent.com/u/12345678?v=4",
  "isActive": true,
  "lastLogin": "2024-06-15T11:00:00.000Z",
  "createdAt": "2024-06-15T11:00:00.000Z",
  "updatedAt": "2024-06-15T11:00:00.000Z"
}
```

---

## 🧪 Testing

El proyecto incluye tests funcionales para `adoption.router.js` escritos con **Jest** + **Supertest**, usando un fake en memoria para el modelo `Pet` y mocks para `User` (reutilizado por los middlewares de autenticación existentes).

```bash
# Instalar dependencias (incluye jest y supertest)
npm install

# Correr toda la suite con reporte de cobertura
npm test
```

Cobertura cubierta por la suite:

- **GET** `/api/adoptions` y `/api/adoptions/:id` — casos exitosos, filtros, lista vacía, 404, 400 (id inválido), 500 (error simulado de base de datos).
- **POST** `/api/adoptions` — 401 (sin token), 403 (sin rol admin), 400 (validación de campos obligatorios), 201 (éxito), 500 (error simulado).
- **PUT** `/api/adoptions/:id` — 401, 403, 404, 200 (éxito), 500.
- **DELETE** `/api/adoptions/:id` — 401, 403, 404, 200 (éxito), 500.

Los tests **no** requieren una base de datos real corriendo: el modelo `Pet` se reemplaza por un fake en memoria y `User.findById` se mockea explícitamente para simular usuarios admin/no-admin.

---

## 🐳 Docker

### Build de la imagen

```bash
docker build -t santixpz/adoption-api:1.0.0 .
```

### Ejecutar el contenedor

```bash
docker run -d \
  --name adoption-api \
  -p 3000:3000 \
  --env-file .env \
  -e MONGO_URI="mongodb://host.docker.internal:27017/auth_system" \
  santixpz/adoption-api:1.0.0
```

O, más simple, levantando API + MongoDB juntos:

```bash
docker compose up --build
```

### Verificar que está corriendo

```bash
docker ps
```

### Escaneo básico de seguridad

```bash
docker scout quickview santixpz/adoption-api:1.0.0
docker scout cves santixpz/adoption-api:1.0.0
```

### Publicar en DockerHub

```bash
docker login
docker push santixpz/adoption-api:1.0.0
```

La imagen queda disponible en:
`https://hub.docker.com/r/santixpz/adoption-api`

### Notas de la imagen

- Base `node:24-alpine` (LTS activa; Node 18 y 20 ya llegaron a su fin de soporte).
- Build multi-stage: las herramientas de compilación que necesita `bcrypt` (python3, make, g++) solo existen en la etapa de build y no viajan a la imagen final.
- Corre como usuario sin privilegios (`nodejs`), no como root.
- Incluye `HEALTHCHECK` para que `docker ps` reporte el estado real del contenedor.
- `.dockerignore` excluye `node_modules`, `.env` y archivos que no deben viajar a producción.

---

## 🔒 Características de Seguridad

- **bcrypt** con 12 salt rounds para hash de contraseñas
- **JWT** con expiración de 1 hora
- **Cookies httpOnly** para evitar acceso desde JavaScript
- **Helmet** para headers de seguridad HTTP
- **CORS** configurado con origen específico
- **Validación** de inputs en cada endpoint
- **Sesiones** almacenadas en MongoDB (no en memoria)
- **Variables de entorno** para datos sensibles

---

## 📝 Licencia

MIT License - Proyecto educativo
