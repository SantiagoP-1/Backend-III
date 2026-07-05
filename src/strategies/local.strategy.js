const LocalStrategy = require("passport-local").Strategy;
const User = require("../models/user.model");

const localStrategy = new LocalStrategy(
  {
    usernameField: "email",
    passwordField: "password",
    passReqToCallback: false,
  },
  async (email, password, done) => {
    try {
      // Buscar usuario por email
      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        return done(null, false, {
          message: "Email o contraseña incorrectos",
        });
      }

      // Verificar que el usuario tenga password (no sea OAuth)
      if (!user.password) {
        return done(null, false, {
          message: "Esta cuenta usa autenticación con GitHub. Inicia sesión con GitHub.",
        });
      }

      // Verificar que la cuenta esté activa
      if (!user.isActive) {
        return done(null, false, {
          message: "Cuenta desactivada. Contacta al administrador.",
        });
      }

      // Comparar password con bcrypt
      const isMatch = await user.comparePassword(password);

      if (!isMatch) {
        return done(null, false, {
          message: "Email o contraseña incorrectos",
        });
      }

      // Actualizar último login
      user.lastLogin = new Date();
      await user.save();

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
);

module.exports = localStrategy;
