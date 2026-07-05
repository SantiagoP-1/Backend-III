const passport = require("passport");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

/**
 * Generar JWT con payload estándar
 */
const generateJWT = (user) => {
  const payload = {
    userId: user._id.toString(),
    role: user.role,
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "1h",
    issuer: "auth-system",
    audience: "auth-system-users",
  });
};

/**
 * Configurar cookie con el JWT
 */
const setAuthCookie = (res, token) => {
  res.cookie("authToken", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 1000, // 1 hora en ms
  });
};

/**
 * POST /api/v1/auth/register
 * Registrar nuevo usuario con email y contraseña
 */
const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Verificar si el email ya existe
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "El email ya está registrado.",
        code: "EMAIL_DUPLICATE",
      });
    }

    // Crear nuevo usuario (el hash del password se hace en el middleware del modelo)
    const user = new User({
      username,
      email: email.toLowerCase(),
      password,
      role: "user",
    });

    await user.save();

    // Generar JWT
    const token = generateJWT(user);

    // Establecer cookie
    setAuthCookie(res, token);

    res.status(201).json({
      success: true,
      message: "Usuario registrado correctamente.",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/login
 * Login con email y contraseña usando Passport Local
 */
const login = (req, res, next) => {
  passport.authenticate("local", { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: info?.message || "Credenciales inválidas.",
        code: "INVALID_CREDENTIALS",
      });
    }

    // Guardar usuario en sesión también
    req.logIn(user, { session: true }, async (loginErr) => {
      if (loginErr) {
        return next(loginErr);
      }

      // Generar JWT
      const token = generateJWT(user);

      // Establecer cookie
      setAuthCookie(res, token);

      res.status(200).json({
        success: true,
        message: "Login exitoso.",
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          lastLogin: user.lastLogin,
        },
      });
    });
  })(req, res, next);
};

/**
 * GET /api/v1/auth/github
 * Iniciar flujo OAuth con GitHub
 */
const githubAuth = passport.authenticate("github", {
  scope: ["user:email"],
});

/**
 * GET /api/v1/auth/github/callback
 * Callback OAuth de GitHub
 */
const githubCallback = (req, res, next) => {
  passport.authenticate("github", { session: true }, (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Autenticación con GitHub fallida.",
        code: "GITHUB_AUTH_FAILED",
      });
    }

    req.logIn(user, { session: true }, (loginErr) => {
      if (loginErr) {
        return next(loginErr);
      }

      // Generar JWT
      const token = generateJWT(user);

      // Establecer cookie
      setAuthCookie(res, token);

      // En un proyecto real, redirigir al frontend con el token
      // res.redirect(`http://localhost:3001/auth?token=${token}`);

      res.status(200).json({
        success: true,
        message: "Autenticación con GitHub exitosa.",
        token,
        user: {
          id: user._id,
          username: user.username || user.githubUsername,
          email: user.email,
          role: user.role,
          githubUsername: user.githubUsername,
          avatar: user.avatar,
        },
      });
    });
  })(req, res, next);
};

/**
 * POST /api/v1/auth/logout
 * Cerrar sesión: destruir sesión + limpiar cookie
 */
const logout = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }

    // Destruir sesión
    req.session.destroy((sessionErr) => {
      if (sessionErr) {
        console.error("Error destruyendo sesión:", sessionErr);
      }

      // Limpiar cookie
      res.clearCookie("authToken", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });

      res.clearCookie("sessionId", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });

      res.status(200).json({
        success: true,
        message: "Sesión cerrada correctamente.",
      });
    });
  });
};

module.exports = {
  register,
  login,
  githubAuth,
  githubCallback,
  logout,
};
