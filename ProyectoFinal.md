# Proyecto Final: Sistema de Autenticación Híbrido con Node.js

**Institución:** CoderHouse  
**Materia:** Desarrollo Web Backend 2 / Backend 3
**Alumno:** Santiago Perez 
**Realizado:** Julio 2026  
**Docente:** Jerlibgnzl

---

## Índice

1. [Introducción y Objetivos](#1-introducción-y-objetivos)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Tecnologías Utilizadas](#3-tecnologías-utilizadas)
4. [Modelo de Datos](#4-modelo-de-datos)
5. [Sistema de Autenticación Local](#5-sistema-de-autenticación-local)
6. [Autenticación OAuth con GitHub](#6-autenticación-oauth-con-github)
7. [JSON Web Tokens (JWT)](#7-json-web-tokens-jwt)
8. [Gestión de Sesiones](#8-gestión-de-sesiones)
9. [Sistema de Autorización](#9-sistema-de-autorización)
10. [Seguridad y Buenas Prácticas](#10-seguridad-y-buenas-prácticas)
11. [Endpoints y API REST](#11-endpoints-y-api-rest)
12. [Middleware y Manejo de Errores](#12-middleware-y-manejo-de-errores)
13. [Pruebas y Validación](#13-pruebas-y-validación)
14. [Conclusiones](#14-conclusiones)
15. [Referencias Bibliográficas](#15-referencias-bibliográficas)

---
## Instalación y Ejecución Local

### Requisitos Previos

* Node.js v18 o superior
* MongoDB Community Server
* Cuenta de GitHub (para probar OAuth)

### Clonar el Proyecto

```bash
git clone https://github.com/SantiagoP-1/Backend-II.git
cd Backend-II
```

### Instalar Dependencias

```bash
npm install
```

### Configurar Variables de Entorno

Crear un archivo `.env` utilizando como base el archivo `.env.example`.

Ejemplo:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/auth_system

SESSION_SECRET=your_session_secret_here
JWT_SECRET=your_jwt_secret_here

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

GITHUB_CALLBACK_URL=http://localhost:3000/api/v1/auth/github/callback

NODE_ENV=development
```

### Ejecutar el Proyecto

```bash
npm run dev
```

### Verificar Funcionamiento

Si la configuración es correcta se visualizará:

```bash
✅ Passport configurado correctamente
✅ MongoDB conectado
🚀 Servidor corriendo en http://localhost:3000
```

## 1. Introducción y Objetivos

### 1.1 Contexto del Proyecto

La autenticación y autorización son pilares fundamentales de cualquier aplicación web moderna. En un entorno donde los usuarios esperan múltiples opciones de acceso —desde el clásico formulario de email/contraseña hasta la autenticación social mediante redes de terceros— implementar un sistema robusto, seguro y escalable se convierte en una necesidad imperativa.

Este proyecto implementa un **Sistema de Autenticación Híbrido** que combina tres enfoques complementarios:

1. **Autenticación Local** mediante email y contraseña (Passport Local Strategy)
2. **Autenticación Social** mediante OAuth 2.0 con GitHub (Passport GitHub2)
3. **Autorización Stateless** mediante JSON Web Tokens (JWT)

### 1.2 Objetivos Generales

El objetivo principal del proyecto es diseñar, implementar y documentar un sistema de autenticación completo que sirva como backend API para aplicaciones web modernas. El sistema debe ser seguro por diseño, extensible para nuevos proveedores OAuth y production-ready.

### 1.3 Objetivos Específicos

- Implementar un flujo completo de registro con validación de datos y hash de contraseñas mediante bcrypt.
- Configurar Passport.js con estrategia Local para autenticación mediante credenciales propias.
- Integrar OAuth 2.0 con GitHub como proveedor externo de identidad, con creación automática de usuarios.
- Generar y validar JSON Web Tokens (JWT) con payload estructurado, expiración configurable y sistema de roles.
- Implementar un sistema de sesiones persistentes en MongoDB utilizando express-session con connect-mongo.
- Crear middleware de autorización que proteja rutas según token JWT y rol del usuario.
- Aplicar medidas de seguridad web estándar: helmet, CORS, cookies httpOnly, variables de entorno.
- Documentar completamente la API con ejemplos funcionales de requests y responses.

### 1.4 Alcance

El proyecto cubre exclusivamente el backend de autenticación como API RESTful. No incluye frontend, aunque está diseñado para integrarse con cualquier cliente (React, Vue, aplicaciones móviles, etc.). El sistema expone endpoints JSON y gestiona la autenticación de forma stateless mediante JWT, complementada con sesiones server-side para casos de uso que lo requieran.

---

### Trabajo Futuro

Como posibles mejoras futuras se proponen:

- Incrementar la cobertura de pruebas sobre middlewares y autenticación.
- Incorporar integración continua mediante GitHub Actions.
- Agregar pruebas E2E sobre OAuth GitHub.
- Implementar Refresh Tokens.
- Añadir rate limiting y auditoría de accesos.

---

## 2. Arquitectura del Sistema

### 2.1 Patrón Arquitectónico: Capas (Layered Architecture)

El sistema adopta una arquitectura en capas que separa claramente las responsabilidades de cada componente, facilitando el mantenimiento, las pruebas y la escalabilidad.

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENTE HTTP                        │
│         (Postman / Navegador / Frontend App)            │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTP Request
                      ▼
┌─────────────────────────────────────────────────────────┐
│                   CAPA DE RUTAS                          │
│              routes/auth.routes.js                       │
│              routes/user.routes.js                       │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                 CAPA DE MIDDLEWARES                      │
│    auth.middleware.js  │  validation.middleware.js       │
│    error.middleware.js │  Passport (session, JWT)        │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│               CAPA DE CONTROLADORES                      │
│           controllers/auth.controller.js                 │
│           controllers/user.controller.js                 │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│              CAPA DE ESTRATEGIAS (Passport)             │
│          strategies/local.strategy.js                    │
│          strategies/github.strategy.js                   │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                CAPA DE MODELOS (ODM)                     │
│                 models/
├                  ── user.model.js
└                  ── pet.model.js                     │
│              (Mongoose Schema + Métodos)                 │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                    BASE DE DATOS                         │
│                     MongoDB                              │
│              Colección: users, sessions                  │
└─────────────────────────────────────────────────────────┘
```

## 2.2 Estructura de Directorios

```
auth-system/
├── screenshots/
│   ├── admin-403.png
│   ├── github-authorize.png
│   ├── github-login-success.png
│   ├── login-success.png
│   ├── logout-success.png
│   ├── profile-success.png
│   ├── register-success.png
│   ├── server-running.png
│   └── user-activo.png
├── src/
│   ├── app.js
│   ├── config/
│   │   ├── database.js
│   │   ├── passport.js
│   │   └── session.js
│   ├── models/
│   │   └── user.model.js
│   ├── strategies/
│   │   ├── local.strategy.js
│   │   └── github.strategy.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   └──adoption.controller.js
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── validation.middleware.js
│   │   └── error.middleware.js
│   └── routes/
│       ├── auth.routes.js
│       ├── user.routes.js
│       ├──adoption.router.js
│       └──adoption.router.test.js
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── ProyectoFinal.md
```


### 2.3 Flujo de una Request Autenticada

```
1. Cliente envía request con JWT en header o cookie
2. Router recibe y dirige a middleware verifyToken
3. verifyToken extrae y valida el JWT
4. Si válido, busca el usuario en MongoDB
5. Adjunta usuario al objeto req
6. Continúa al controlador correspondiente
7. Controlador responde con datos del usuario
```

---

## 3. Tecnologías Utilizadas

### 3.1 Runtime y Framework

**Node.js** (v18+) es el entorno de ejecución JavaScript del lado del servidor. Su modelo event-loop no bloqueante lo hace ideal para aplicaciones con muchas operaciones de I/O como consultas a base de datos y llamadas a APIs externas.

**Express.js** (v4.19) es el framework minimalista que provee el servidor HTTP, sistema de routing, y la cadena de middleware. Su diseño modular permite agregar funcionalidades de forma progresiva.

### 3.2 Base de Datos y ODM

**MongoDB** es la base de datos NoSQL orientada a documentos utilizada para persistir usuarios y sesiones. Su esquema flexible facilita almacenar usuarios con diferentes perfiles (locales vs. OAuth).

**Mongoose** (v8.4) es el ODM (Object Document Mapper) que proporciona:
- Definición de esquemas con validaciones
- Middlewares de pre/post guardado
- Métodos de instancia y estáticos
- Conversión automática de tipos

### 3.3 Autenticación y Autorización

**Passport.js** es el middleware de autenticación más utilizado en el ecosistema Node.js. Su arquitectura basada en estrategias intercambiables permite soportar más de 500 métodos de autenticación diferentes con una API unificada.

**passport-local** implementa la estrategia de autenticación por formulario (email + contraseña), delegando la lógica de verificación al callback proporcionado.

**passport-github2** implementa el protocolo OAuth 2.0 para autenticación con GitHub como proveedor de identidad. Maneja el intercambio de códigos por tokens y la obtención del perfil del usuario.

**jsonwebtoken** (JWT) permite generar tokens firmados con HMAC SHA-256 que contienen información del usuario (claims) y pueden ser verificados sin necesidad de consultar la base de datos.

**bcrypt** implementa el algoritmo de hash adaptativo bcrypt, que incluye un factor de trabajo (salt rounds) configurable para resistir ataques de fuerza bruta y rainbow tables.

### 3.4 Sesiones y Cookies

**express-session** gestiona las sesiones del lado del servidor. A diferencia de JWT stateless, las sesiones se almacenan en el servidor y se referencian mediante una cookie en el cliente.

**connect-mongo** es el adaptador que permite a express-session almacenar las sesiones en MongoDB en lugar de en memoria, lo cual es crítico en producción para soportar múltiples instancias del servidor.

**cookie-parser** parsea las cookies enviadas en los headers de las requests y las pone disponibles en `req.cookies`.

### 3.5 Seguridad

**Helmet** configura automáticamente más de 14 headers HTTP de seguridad, incluyendo X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security, y Content-Security-Policy.

**CORS** (Cross-Origin Resource Sharing) configura los headers que controlan qué orígenes pueden hacer requests al servidor, crucial cuando el frontend se sirve desde un dominio diferente.

**dotenv** carga las variables de entorno desde el archivo `.env` al objeto `process.env`, manteniendo los secretos fuera del código fuente.

---

## 4. Modelo de Datos

### 4.1 Schema del Usuario

El modelo `User` está diseñado para soportar tanto usuarios con autenticación local como usuarios que se registran mediante OAuth. Los campos opcionales se marcan con función `required` condicional.

```javascript
const userSchema = new mongoose.Schema({
  username:      { type: String, required: function() { return !this.githubId; } },
  email:         { type: String, required: true, unique: true },
  password:      { type: String, required: function() { return !this.githubId; } },
  role:          { type: String, enum: ['user', 'admin'], default: 'user' },
  githubId:      { type: String, default: null },
  githubUsername:{ type: String, default: null },
  avatar:        { type: String, default: null },
  isActive:      { type: Boolean, default: true },
  lastLogin:     { type: Date, default: null }
}, { timestamps: true });
```

### 4.2 Middleware de Pre-guardado (Hash de Contraseña)

Antes de persistir el documento, el middleware `pre('save')` verifica si el campo `password` fue modificado. De ser así, genera un salt y hashea la contraseña:

```javascript
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
```

El uso de `isModified('password')` evita re-hashear la contraseña en actualizaciones de otros campos, lo cual es crítico para la correcta persistencia de datos.

### 4.3 Método de Comparación de Contraseña

```javascript
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};
```

### 4.4 Transformación del Output JSON

El schema configura una transformación automática en la serialización a JSON para eliminar el campo `password` y `__v` de las respuestas:

```javascript
toJSON: {
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.__v;
    return ret;
  }
}
```

### 4.5 Índices de MongoDB

- `email`: índice único (`unique: true`) para búsquedas eficientes y garantizar unicidad.
- `githubId`: índice sparse para búsquedas por ID de GitHub (solo para usuarios OAuth).

### 4.6 Ejemplo de Documento en MongoDB

**Usuario Local:**
```json
{
  "_id": { "$oid": "667a1b2c3d4e5f6789012345" },
  "username": "juanperez",
  "email": "juan@example.com",
  "password": "$2b$12$KIXlGZ6Y8hN3d.mP7wQ9iuLkjTzXoPvV5rBsI1yWlRhcMDqEfAzKm",
  "role": "user",
  "githubId": null,
  "githubUsername": null,
  "avatar": null,
  "isActive": true,
  "lastLogin": { "$date": "2024-06-15T10:35:00.000Z" },
  "createdAt": { "$date": "2024-06-15T10:30:00.000Z" },
  "updatedAt": { "$date": "2024-06-15T10:35:00.000Z" }
}
```

**Usuario OAuth GitHub:**
```json
{
  "_id": { "$oid": "667a1b2c3d4e5f6789012346" },
  "username": "octocat",
  "email": "octocat@github.com",
  "password": null,
  "role": "user",
  "githubId": "583231",
  "githubUsername": "octocat",
  "avatar": "https://avatars.githubusercontent.com/u/583231?v=4",
  "isActive": true,
  "lastLogin": { "$date": "2024-06-15T11:00:00.000Z" },
  "createdAt": { "$date": "2024-06-15T11:00:00.000Z" },
  "updatedAt": { "$date": "2024-06-15T11:00:00.000Z" }
}
```

---

## 5. Sistema de Autenticación Local

### 5.1 Flujo de Registro

```
1. Cliente POST /api/v1/auth/register { username, email, password }
2. validateRegister middleware valida campos
3. Verificación de email duplicado en BD
4. Creación del documento User (password se hashea automáticamente)
5. Generación de JWT con { userId, role }
6. Respuesta 201 con { token, user } + cookie authToken
```

El controlador de registro verifica explícitamente la existencia del email antes de intentar guardar, retornando un error `409 Conflict` con código `EMAIL_DUPLICATE`. Aunque MongoDB también fallaría con error de clave duplicada, la verificación previa permite una respuesta más clara al cliente.

### 5.2 Estrategia Passport Local

La estrategia Local (`passport-local`) recibe `usernameField: 'email'`, lo que le indica que use el campo `email` del cuerpo de la request en lugar del clásico `username`:

```javascript
const localStrategy = new LocalStrategy(
  { usernameField: 'email', passwordField: 'password' },
  async (email, password, done) => {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return done(null, false, { message: 'Credenciales inválidas' });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return done(null, false, { message: 'Credenciales inválidas' });
    user.lastLogin = new Date();
    await user.save();
    return done(null, user);
  }
);
```

El uso de `done(null, false, { message })` en lugar de lanzar un error es el patrón correcto de Passport para comunicar fallos de autenticación sin romper la cadena de middleware.

### 5.3 Flujo de Login

```
1. Cliente POST /api/v1/auth/login { email, password }
2. validateLogin valida que los campos estén presentes
3. passport.authenticate('local') ejecuta la estrategia
4. Si falla: respuesta 401 con mensaje específico
5. Si éxito: req.logIn() guarda usuario en sesión
6. Generación de JWT
7. Respuesta 200 con { token, user } + cookie authToken
```

### 5.4 Manejo de Errores de Autenticación

El sistema distingue entre diferentes tipos de fallos para dar mensajes específicos al usuario:
- Usuario no encontrado → "Email o contraseña incorrectos" (sin revelar cuál falló)
- Contraseña incorrecta → mismo mensaje genérico (seguridad por oscuridad)
- Usuario con OAuth sin password → mensaje específico indicando usar GitHub
- Cuenta inactiva → mensaje de cuenta desactivada

---

## 6. Autenticación OAuth con GitHub

### 6.1 Protocolo OAuth 2.0

OAuth 2.0 es un protocolo de autorización que permite a una aplicación obtener acceso limitado a una cuenta de usuario en otro servicio, sin necesidad de conocer las credenciales del usuario.

**Flujo Authorization Code Grant:**

```
1. Usuario hace click en "Login con GitHub"
2. App redirige a GitHub: GET /api/v1/auth/github
3. GitHub muestra página de autorización al usuario
4. Usuario autoriza → GitHub redirige a callback con código temporal
5. App intercambia código por access_token (servidor a servidor)
6. App usa access_token para obtener perfil del usuario en GitHub
7. Passport procesa el perfil y llama al callback de la estrategia
8. App crea/busca usuario y genera JWT propio
```

### 6.2 Estrategia GitHub con Creación Automática de Usuarios

La estrategia maneja tres escenarios posibles:

**Escenario 1: Usuario ya existe con GitHub ID**
```javascript
let user = await User.findOne({ githubId: profile.id });
if (user) {
  user.lastLogin = new Date();
  await user.save();
  return done(null, user);
}
```

**Escenario 2: Email ya existe (cuenta local)**
```javascript
user = await User.findOne({ email: email });
if (user) {
  user.githubId = profile.id;  // Vincular cuentas
  await user.save();
  return done(null, user);
}
```

**Escenario 3: Usuario nuevo**
```javascript
const newUser = new User({
  username: profile.username,
  email: email,
  githubId: profile.id,
  githubUsername: profile.username,
  avatar: profile.photos[0]?.value
});
await newUser.save();
return done(null, newUser);
```

### 6.3 Configuración de la OAuth App en GitHub

Para configurar la integración con GitHub se debe:
1. Acceder a **GitHub → Settings → Developer Settings → OAuth Apps**
2. Crear nueva app con:
   - `Homepage URL`: `http://localhost:3000`
   - `Authorization callback URL`: `http://localhost:3000/api/v1/auth/github/callback`
3. Las credenciales (`Client ID`, `Client Secret`) se cargan desde variables de entorno, nunca hardcodeadas.

---

## 7. JSON Web Tokens (JWT)

### 7.1 Estructura del Token

Un JWT consta de tres partes codificadas en Base64 y separadas por puntos:

**Header:**
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload (Claims):**
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

**Signature:**
```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  JWT_SECRET
)
```

### 7.2 Generación del Token

```javascript
const generateJWT = (user) => {
  const payload = {
    userId: user._id.toString(),
    role: user.role,
  };
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '1h',
    issuer: 'auth-system',
    audience: 'auth-system-users',
  });
};
```

### 7.3 Envío en Doble Canal

El JWT se envía por dos canales complementarios:

**En el body de la response:**
```json
{ "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
```
Útil para clientes SPA (React, Vue) que lo almacenan en memoria.

**En una cookie httpOnly:**
```javascript
res.cookie('authToken', token, {
  httpOnly: true,    // Inaccesible desde JavaScript del cliente
  sameSite: 'lax',  // Protección contra CSRF
  secure: process.env.NODE_ENV === 'production',  // Solo HTTPS en prod
  maxAge: 60 * 60 * 1000  // 1 hora
});
```

### 7.4 Verificación del Token (Middleware)

El middleware `verifyToken` busca el token en orden:
1. Header `Authorization: Bearer <token>`
2. Cookie `authToken`

Si encuentra el token, lo verifica con `jwt.verify()` y consulta la base de datos para confirmar que el usuario sigue existiendo y está activo.

### 7.5 Ventajas del Enfoque Stateless con JWT

- **Escalabilidad horizontal**: cualquier instancia del servidor puede verificar el token sin compartir estado.
- **Performance**: no requiere consulta a base de datos para verificar la autenticación (solo para autorización).
- **Interoperabilidad**: puede ser consumido por múltiples servicios y clientes.

---

## 8. Gestión de Sesiones

### 8.1 Motivación para el Sistema de Sesiones

Aunque JWT es stateless, el sistema implementa sesiones server-side por las siguientes razones:
- Soporte para flujo OAuth de GitHub (requiere estado entre redirects)
- Posibilidad de invalidar sesiones activas (logout real)
- Compatibilidad con clientes que no pueden manejar headers JWT

### 8.2 Configuración de express-session con connect-mongo

```javascript
session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions',
    ttl: 24 * 60 * 60,  // TTL: 1 día
    autoRemove: 'native',  // MongoDB TTL Index
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000  // 1 día
  },
  name: 'sessionId'
})
```

**Opciones clave:**
- `resave: false`: No re-guardar la sesión en cada request si no cambió
- `saveUninitialized: false`: No crear sesión para requests sin datos (GDPR friendly)
- `name: 'sessionId'`: Nombre personalizado de cookie (oculta que es express-session)

### 8.3 Serialización y Deserialización de Sesiones

Passport utiliza `serializeUser` y `deserializeUser` para persistir el ID del usuario en la sesión y recuperarlo en cada request:

```javascript
passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id).select('-password');
  done(null, user);
});
```

### 8.4 Documentos de Sesión en MongoDB

```json
{
  "_id": "abc123xyz789...",
  "expires": { "$date": "2024-06-16T10:35:00.000Z" },
  "session": {
    "cookie": { "httpOnly": true, "sameSite": "lax", "maxAge": 86400000 },
    "passport": { "user": "667a1b2c3d4e5f6789012345" }
  }
}
```

---

## 9. Sistema de Autorización

### 9.1 Middleware verifyToken

Protege rutas verificando que el JWT sea válido, no esté expirado y pertenezca a un usuario activo:

```javascript
const verifyToken = async (req, res, next) => {
  // Extraer token de header o cookie
  // Verificar firma con jwt.verify()
  // Buscar usuario en BD
  // Adjuntar usuario a req.user
  // Llamar next()
};
```

### 9.2 Middleware verifyAdmin

Extiende `verifyToken` verificando que el usuario tenga el rol `admin`:

```javascript
const verifyAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren permisos de administrador.',
      code: 'FORBIDDEN'
    });
  }
  next();
};
```

### 9.3 Composición de Middlewares en Rutas

```javascript
// Solo JWT requerido
router.get('/profile', verifyToken, getProfile);

// JWT + rol admin requerido
router.get('/admin', verifyToken, verifyAdmin, getAdminPanel);
```

### 9.4 Códigos de Respuesta HTTP

| Código | Situación |
|--------|-----------|
| `200 OK` | Request exitosa |
| `201 Created` | Recurso creado (registro) |
| `400 Bad Request` | Datos de entrada inválidos |
| `401 Unauthorized` | Sin token / token inválido o expirado |
| `403 Forbidden` | Autenticado pero sin permisos suficientes |
| `404 Not Found` | Recurso no encontrado |
| `409 Conflict` | Email duplicado |
| `500 Internal Server Error` | Error no manejado del servidor |

---

## 10. Seguridad y Buenas Prácticas

### 10.1 Hash de Contraseñas con bcrypt

bcrypt es el algoritmo de hash recomendado para contraseñas por su diseño adaptativo. El `cost factor` (salt rounds) determina el tiempo de cómputo:

- **12 rounds**: ~0.3 segundos por hash en hardware moderno
- **Protección contra rainbow tables**: cada hash incluye un salt aleatorio único
- **Protección contra fuerza bruta**: aumentar rounds a medida que el hardware mejora

### 10.2 Headers de Seguridad HTTP con Helmet

Helmet configura automáticamente:
- `X-Content-Type-Options: nosniff` → evita MIME sniffing
- `X-Frame-Options: DENY` → previene clickjacking
- `X-XSS-Protection: 1; mode=block` → activa filtro XSS del navegador
- `Strict-Transport-Security` → fuerza HTTPS (en producción)
- `Content-Security-Policy` → restringe fuentes de contenido

### 10.3 Configuración de Cookies Seguras

```javascript
res.cookie('authToken', token, {
  httpOnly: true,   // No accesible desde document.cookie
  sameSite: 'lax',  // Mitiga CSRF: no se envía en cross-site requests
  secure: process.env.NODE_ENV === 'production',  // Solo HTTPS en prod
  maxAge: 3600000   // Expira con el JWT (1 hora)
});
```

### 10.4 Variables de Entorno y Secretos

Ningún secreto está hardcodeado en el código. El archivo `.env.example` documenta las variables necesarias sin revelar valores reales. El `.gitignore` excluye `.env` del control de versiones.

### 10.5 Validación y Sanitización de Inputs

Cada endpoint con datos de entrada tiene su middleware de validación correspondiente que verifica:
- Presencia de campos obligatorios
- Formato de email mediante regex
- Longitud mínima/máxima de campos
- Sanitización (trim, lowercase) antes de procesar

### 10.6 Mensajes de Error Genéricos en Autenticación

Los errores de login no especifican si el email o la contraseña fue lo incorrecto, usando siempre "Email o contraseña incorrectos". Esto previene enumeración de usuarios.

### 10.7 Protección de la Clave JWT

- `JWT_SECRET` cargado exclusivamente desde variable de entorno
- Nunca expuesto en logs ni respuestas de error
- Algoritmo HS256 con claves de al menos 32 caracteres recomendado

---

## 11. Endpoints y API REST

| Método | Ruta               | Auth        | Descripción        |
| ------ | ------------------ | ----------- | ------------------ |
| GET    | /api/adoptions     | Pública     | Lista mascotas     |
| GET    | /api/adoptions/:id | Pública     | Mascota individual |
| POST   | /api/adoptions     | JWT + Admin | Crear mascota      |
| PUT    | /api/adoptions/:id | JWT + Admin | Actualizar         |
| DELETE | /api/adoptions/:id | JWT + Admin | Eliminar           |


### 11.1 Tabla Completa de Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/` | Ninguna | Info de la API |
| POST | `/api/v1/auth/register` | Ninguna | Registro con email/password |
| POST | `/api/v1/auth/login` | Ninguna | Login local con JWT |
| GET | `/api/v1/auth/github` | Ninguna | Inicio OAuth GitHub |
| GET | `/api/v1/auth/github/callback` | Ninguna | Callback OAuth GitHub |
| POST | `/api/v1/auth/logout` | Opcional | Destruir sesión y cookie |
| GET | `/api/v1/profile` | JWT | Perfil del usuario |
| GET | `/api/v1/admin` | JWT + Admin | Panel de administración |
| GET | `/api/v1/session` | Ninguna | Info de sesión activa |

### 11.2 Formato Estándar de Responses

**Success Response:**
```json
{
  "success": true,
  "message": "Descripción del resultado",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Descripción del error",
  "code": "ERROR_CODE",
  "errors": [ "Error 1", "Error 2" ]
}
```

### 11.3 Versionado de la API

La API utiliza versionado en la URL (`/api/v1/`) siguiendo las mejores prácticas de diseño RESTful. Esto permite introducir cambios breaking en futuras versiones (`/api/v2/`) sin afectar a clientes existentes.

---

## 12. Middleware y Manejo de Errores

### 12.1 Cadena de Middleware en Express

Express procesa los middlewares en orden de registro. La cadena típica para una request autenticada es:

```
Request → helmet → cors → express.json → cookieParser → session 
       → passport.initialize → passport.session → router 
       → validateInput → verifyToken → verifyAdmin → controller 
       → errorHandler → Response
```

### 12.2 Middleware de Manejo de Errores

El middleware `errorHandler` centraliza el manejo de todos los errores de la aplicación, distinguiendo entre tipos conocidos:

- **ValidationError (Mongoose)**: 400 con detalle de campos
- **Duplicate Key (MongoDB 11000)**: 409 con campo afectado
- **CastError (Mongoose)**: 400 para IDs inválidos
- **JWT Errors**: 401 con mensaje específico
- **Errores genéricos**: 500 con stack trace en desarrollo

### 12.3 Middleware 404 (Ruta No Encontrada)

```javascript
const notFound = (req, res, next) => {
  const error = new Error(`Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};
```

Este middleware debe registrarse **después de todas las rutas** y **antes** del `errorHandler`.

---

## 13. Pruebas y Validación

### Pruebas Automatizadas

El proyecto incorpora una suite de pruebas funcionales desarrollada con Jest y Supertest.

Cobertura actual:

- 23 tests ejecutados correctamente
- 1 suite aprobada
- 82% de statements
- 74% de branches
- 83% de funciones
- 83% de líneas

Casos cubiertos:

- GET /api/adoptions
- GET /api/adoptions/:id
- POST /api/adoptions
- PUT /api/adoptions/:id
- DELETE /api/adoptions/:id

Incluyendo:

- 200
- 201
- 400
- 401
- 403
- 404
- 500

### 13.1 Prueba: Registro Exitoso

**Request:**
```http
POST http://localhost:3000/api/v1/auth/register
Content-Type: application/json

{ "username": "testuser", "email": "test@test.com", "password": "pass123" }
```

**Expected Response (201):**
```json
{ "success": true, "token": "eyJ...", "user": { "role": "user" } }
```

### 13.2 Prueba: Login Exitoso

**Request:**
```http
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{ "email": "test@test.com", "password": "pass123" }
```

**Expected Response (200):**
```json
{ "success": true, "token": "eyJ...", "user": { "email": "test@test.com" } }
```

### 13.3 Prueba: Acceso a Ruta Protegida sin Token

**Request:**
```http
GET http://localhost:3000/api/v1/profile
```

**Expected Response (401):**
```json
{ "success": false, "message": "Acceso denegado. Token no proporcionado.", "code": "NO_TOKEN" }
```

### 13.4 Prueba: Acceso Admin con Rol User

**Request:**
```http
GET http://localhost:3000/api/v1/admin
Authorization: Bearer eyJ... (token de usuario con role: user)
```

**Expected Response (403):**
```json
{ "success": false, "message": "Acceso denegado. Se requieren permisos de administrador.", "code": "FORBIDDEN" }
```

### 13.5 Prueba: Token Expirado

Esperando más de 1 hora con el mismo token:

**Expected Response (401):**
```json
{ "success": false, "message": "Token expirado. Por favor, inicia sesión nuevamente.", "code": "TOKEN_EXPIRED" }
```

### 13.6 Verificación de Hash bcrypt

Se puede verificar que la contraseña está correctamente hasheada inspeccionando el documento en MongoDB y confirmando que el campo `password` comienza con `$2b$12$` (indicador de bcrypt con 12 rounds).

### 13.7 Evidencias de Funcionamiento

Durante el desarrollo del proyecto se realizaron pruebas utilizando Thunder Client, navegador web y MongoDB Compass para verificar el correcto funcionamiento de cada uno de los requerimientos solicitados.

Todas las evidencias se encuentran almacenadas dentro de la carpeta:

```text
/screenshots
```

#### Capturas Incluidas

| Archivo                  | Descripción                                                                                                          |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| server-running.png       | Servidor Express ejecutándose correctamente y conectado a MongoDB.                                                   |
| register-success.png     | Registro exitoso de usuario mediante email y contraseña.                                                             |
| login-success.png        | Inicio de sesión exitoso utilizando Passport Local Strategy.                                                         |
| profile-success.png      | Acceso exitoso al endpoint protegido `/api/v1/profile`.                                                              |
| admin-403.png            | Validación correcta del middleware de autorización retornando error 403 para usuarios sin permisos de administrador. |
| logout-success.png       | Cierre de sesión exitoso eliminando cookies y sesión activa.                                                         |
| github-authorize.png     | Pantalla de autorización OAuth proporcionada por GitHub.                                                             |
| github-login-success.png | Inicio de sesión exitoso mediante OAuth 2.0 con GitHub.                                                              |
| user-activo.png          | Usuario registrado y persistido correctamente en MongoDB.                                                            |

#### Resultados Obtenidos

Las pruebas realizadas permitieron verificar satisfactoriamente:

* Registro de usuarios mediante email y contraseña.
* Inicio de sesión mediante Passport Local.
* Generación y validación de JSON Web Tokens (JWT).
* Acceso a rutas protegidas utilizando autenticación basada en tokens.
* Restricción de acceso a recursos administrativos mediante control de roles.
* Gestión de sesiones utilizando express-session y connect-mongo.
* Integración completa con OAuth 2.0 mediante GitHub.
* Persistencia de usuarios y sesiones en MongoDB.
* Manejo adecuado de errores HTTP 401, 403 y 404.
* Funcionamiento correcto del sistema de logout y eliminación de cookies.

Estas evidencias permiten demostrar el correcto funcionamiento integral del sistema de autenticación híbrido implementado.

---

## 14. Conclusiones

### 14.1 Logros del Proyecto

El proyecto implementó exitosamente un sistema de autenticación híbrido completo que cumple todos los requisitos especificados:

- **Registro seguro** con hash bcrypt y validación de unicidad de email
- **Autenticación local** mediante Passport Local Strategy con JWT y cookies httpOnly
- **OAuth GitHub** con creación automática de usuarios y vinculación de cuentas
- **Sesiones persistentes** en MongoDB mediante connect-mongo
- **Autorización por roles** con middlewares JWT y verificación de rol admin
- **Seguridad multicapa** con helmet, CORS, cookies seguras y variables de entorno

### 14.2 Decisiones de Diseño

**¿Por qué Passport.js?** Passport abstrae la complejidad de múltiples estrategias de autenticación con una API unificada. Su ecosistema de más de 500 estrategias facilita agregar nuevos proveedores OAuth (Google, Facebook, Twitter) con mínimo esfuerzo adicional.

**¿Por qué JWT + Sesiones?** El sistema usa ambos de forma complementaria. JWT para proteger endpoints de la API (stateless, escalable), y sesiones para el flujo OAuth que requiere estado entre redirects y para soporte a clientes que no pueden manejar headers.

**¿Por qué MongoDB para sesiones?** Almacenar sesiones en MongoDB en lugar de en memoria permite deployar múltiples instancias del servidor (horizontal scaling) sin pérdida de sesiones al reiniciar.

### 14.3 Posibles Extensiones

- **Refresh Tokens**: implementar tokens de larga duración para renovar JWT sin re-login
- **2FA**: agregar autenticación de dos factores con TOTP (Google Authenticator)
- **Rate Limiting**: implementar express-rate-limit para prevenir ataques de fuerza bruta
- **Audit Logs**: registrar intentos de login fallidos para detectar ataques
- **Account Recovery**: flujo de recuperación de contraseña por email con tokens temporales
- **Más Proveedores OAuth**: Google, Facebook, Microsoft, Apple

### 14.4 Reflexión Final

La implementación de este sistema permitió comprender en profundidad los conceptos fundamentales de seguridad en aplicaciones web: el ciclo de vida de las credenciales, el principio de menor privilegio, la separación entre autenticación y autorización, y el balance entre usabilidad y seguridad.

El uso de Passport.js como capa de abstracción sobre los protocolos de autenticación demuestra cómo las bibliotecas bien diseñadas pueden simplificar problemáticas complejas manteniendo la flexibilidad necesaria para adaptarse a diferentes contextos de uso.

---

## 15. Referencias Bibliográficas

1. **Passport.js Documentation** - Documentación oficial de Passport.js  
   http://www.passportjs.org/docs/

2. **JSON Web Tokens (JWT)** - RFC 7519  
   https://tools.ietf.org/html/rfc7519

3. **OAuth 2.0 Authorization Framework** - RFC 6749  
   https://tools.ietf.org/html/rfc6749

4. **Mongoose Documentation** - ODM para MongoDB  
   https://mongoosejs.com/docs/

5. **Express.js Documentation** - Framework web para Node.js  
   https://expressjs.com/en/4x/api.html

6. **bcrypt** - OWASP Password Storage Cheat Sheet  
   https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html

7. **Helmet.js** - Seguridad en Express  
   https://helmetjs.github.io/

8. **connect-mongo** - MongoDB session store para Express  
   https://github.com/jdesboeufs/connect-mongo

9. **GitHub OAuth Apps** - Documentación oficial de GitHub  
   https://docs.github.com/en/apps/oauth-apps

10. **OWASP Authentication Cheat Sheet**  
    https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html

11. **Fowler, M.** - "Patterns of Enterprise Application Architecture" - Addison-Wesley, 2002

12. **Simpson, K.** - "You Don't Know JS: Async & Performance" - O'Reilly Media, 2015

13. **Node.js Security Best Practices** - Node.js Foundation  
    https://nodejs.org/en/docs/guides/security/

14. **MDN Web Docs - HTTP Cookies**  
    https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies

15. **Express Session Middleware**  
    https://github.com/expressjs/session

---

*Documento generado como parte del trabajo práctico final de la materia Desarrollo Web Backend 2.*  
*Extensión: 15 páginas aproximadas según rúbrica.*
