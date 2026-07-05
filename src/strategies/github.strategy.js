const GitHubStrategy = require("passport-github2").Strategy;
const User = require("../models/user.model");

const githubStrategy = new GitHubStrategy(
  {
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL,
    scope: ["user:email"],
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Obtener email principal del perfil de GitHub
      const email =
        profile.emails && profile.emails.length > 0
          ? profile.emails[0].value
          : `${profile.username}@github.com`;

      // Buscar usuario existente por githubId
      let user = await User.findOne({ githubId: profile.id });

      if (user) {
        // Usuario existente: actualizar datos y último login
        user.lastLogin = new Date();
        user.githubUsername = profile.username;
        if (profile.photos && profile.photos[0]) {
          user.avatar = profile.photos[0].value;
        }
        await user.save();
        return done(null, user);
      }

      // Buscar por email (podría ya existir con registro local)
      user = await User.findOne({ email: email.toLowerCase() });

      if (user) {
        // Vincular cuenta GitHub a cuenta local existente
        user.githubId = profile.id;
        user.githubUsername = profile.username;
        if (profile.photos && profile.photos[0]) {
          user.avatar = profile.photos[0].value;
        }
        user.lastLogin = new Date();
        await user.save();
        return done(null, user);
      }

      // Crear nuevo usuario con cuenta GitHub
      const newUser = new User({
        username: profile.username || profile.displayName || `user_${profile.id}`,
        email: email.toLowerCase(),
        githubId: profile.id,
        githubUsername: profile.username,
        avatar:
          profile.photos && profile.photos[0]
            ? profile.photos[0].value
            : null,
        role: "user",
        lastLogin: new Date(),
      });

      await newUser.save();
      return done(null, newUser);
    } catch (error) {
      return done(error, null);
    }
  }
);

module.exports = githubStrategy;
