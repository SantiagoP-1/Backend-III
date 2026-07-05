const passport = require("passport");
const localStrategy = require("../strategies/local.strategy");
const githubStrategy = require("../strategies/github.strategy");
const User = require("../models/user.model");

const configurePassport = () => {
  // Serializar usuario en sesión
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserializar usuario desde sesión
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id).select("-password");
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Registrar estrategias
  passport.use("local", localStrategy);
  passport.use("github", githubStrategy);

  console.log("✅ Passport configurado correctamente");
};

module.exports = configurePassport;
