const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

/**
 * Middleware: Verificar JWT
 * Busca el token en: Authorization header (Bearer) o cookie authToken
 */
const verifyToken = async (req, res, next) => {
  try {
    let token = null;

    // 1. Buscar en Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    // 2. Si no hay header, buscar en cookie
    if (!token && req.cookies && req.cookies.authToken) {
      token = req.cookies.authToken;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Acceso denegado. Token no proporcionado.",
        code: "NO_TOKEN",
      });
    }

    // Verificar y decodificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar usuario en BD para confirmar que sigue existiendo
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Token inválido. Usuario no encontrado.",
        code: "USER_NOT_FOUND",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Cuenta desactivada.",
        code: "ACCOUNT_DISABLED",
      });
    }

    // Adjuntar usuario y payload al request
    req.user = user;
    req.tokenPayload = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expirado. Por favor, inicia sesión nuevamente.",
        code: "TOKEN_EXPIRED",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Token inválido.",
        code: "INVALID_TOKEN",
      });
    }

    next(error);
  }
};

/**
 * Middleware: Verificar rol Admin
 * Debe usarse DESPUÉS de verifyToken
 */
const verifyAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "No autenticado.",
      code: "NOT_AUTHENTICATED",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Acceso denegado. Se requieren permisos de administrador.",
      code: "FORBIDDEN",
    });
  }

  next();
};

module.exports = { verifyToken, verifyAdmin };
