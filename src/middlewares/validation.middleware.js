/**
 * Middleware: Validar datos de registro
 */
const validateRegister = (req, res, next) => {
  const { username, email, password } = req.body;
  const errors = [];

  // Validar username
  if (!username || typeof username !== "string") {
    errors.push("El username es obligatorio");
  } else if (username.trim().length < 3) {
    errors.push("El username debe tener al menos 3 caracteres");
  } else if (username.trim().length > 30) {
    errors.push("El username no puede superar 30 caracteres");
  }

  // Validar email
  if (!email || typeof email !== "string") {
    errors.push("El email es obligatorio");
  } else {
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email.trim())) {
      errors.push("El formato del email es inválido");
    }
  }

  // Validar password
  if (!password || typeof password !== "string") {
    errors.push("La contraseña es obligatoria");
  } else if (password.length < 6) {
    errors.push("La contraseña debe tener al menos 6 caracteres");
  } else if (password.length > 100) {
    errors.push("La contraseña no puede superar 100 caracteres");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Error de validación",
      errors,
    });
  }

  // Sanitizar
  req.body.username = username.trim();
  req.body.email = email.trim().toLowerCase();

  next();
};

/**
 * Middleware: Validar datos de login
 */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || typeof email !== "string") {
    errors.push("El email es obligatorio");
  }

  if (!password || typeof password !== "string") {
    errors.push("La contraseña es obligatoria");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Error de validación",
      errors,
    });
  }

  req.body.email = email.trim().toLowerCase();

  next();
};

module.exports = { validateRegister, validateLogin };
