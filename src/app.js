require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const passport = require("passport");

const configurePassport = require("./config/passport");
const configureSession = require("./config/session");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const adoptionRouter = require("./routes/adoption.router");
const { errorHandler, notFound } = require("./middlewares/error.middleware");

const app = express();

// ─── Seguridad ────────────────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })
);

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL
        : ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000"],
    credentials: true, // Permite envío de cookies
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ─── Body Parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ─── Cookie Parser ────────────────────────────────────────────────────────────
app.use(cookieParser());

// ─── Sesiones ─────────────────────────────────────────────────────────────────
app.use(configureSession());

// ─── Passport ─────────────────────────────────────────────────────────────────
configurePassport();
app.use(passport.initialize());
app.use(passport.session());

// ─── Rutas ────────────────────────────────────────────────────────────────────

// Ruta raíz de bienvenida
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🔐 Sistema de Autenticación Híbrido - API",
    version: "1.0.0",
    endpoints: {
      register: "POST /api/v1/auth/register",
      login: "POST /api/v1/auth/login",
      githubAuth: "GET /api/v1/auth/github",
      githubCallback: "GET /api/v1/auth/github/callback",
      logout: "POST /api/v1/auth/logout",
      profile: "GET /api/v1/profile [JWT requerido]",
      admin: "GET /api/v1/admin [JWT + rol admin requerido]",
      session: "GET /api/v1/session",
    },
  });
});

// Rutas de autenticación
app.use("/api/v1/auth", authRoutes);

// Rutas de usuario (perfil, admin, sesión)
app.use("/api/v1", userRoutes);

// Rutas de adopción de mascotas
app.use("/api/adoptions", adoptionRouter);

// ─── Manejo de Errores ────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
