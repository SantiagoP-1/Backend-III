/**
 * Middleware: Manejo centralizado de errores
 */
const errorHandler = (err, req, res, next) => {
  console.error("❌ Error:", err);

  // Error de validación de Mongoose
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: "Error de validación",
      errors,
    });
  }

  // Error de clave duplicada de MongoDB (ej: email único)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      message: `El campo '${field}' ya está en uso.`,
      code: "DUPLICATE_KEY",
    });
  }

  // Error de casteo de MongoDB (ID inválido)
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "ID de recurso inválido.",
    });
  }

  // Error JWT
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token inválido o expirado.",
    });
  }

  // Error genérico
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Error interno del servidor.",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

/**
 * Middleware: Ruta no encontrada (404)
 */
const notFound = (req, res, next) => {
  const error = new Error(`Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

module.exports = { errorHandler, notFound };
