const User = require("../models/user.model");

/**
 * GET /api/v1/profile
 * Perfil del usuario autenticado (protegido con JWT)
 */
const getProfile = async (req, res, next) => {
  try {
    // req.user viene del middleware verifyToken
    const user = await User.findById(req.user._id).select("-password -__v");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Perfil obtenido correctamente.",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        githubUsername: user.githubUsername,
        avatar: user.avatar,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      tokenInfo: {
        userId: req.tokenPayload.userId,
        role: req.tokenPayload.role,
        issuedAt: new Date(req.tokenPayload.iat * 1000).toISOString(),
        expiresAt: new Date(req.tokenPayload.exp * 1000).toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin
 * Panel de administrador (protegido con JWT + rol admin)
 */
const getAdminPanel = async (req, res, next) => {
  try {
    // Solo accesible por admins (verificado en middleware verifyAdmin)
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const githubUsers = await User.countDocuments({ githubId: { $ne: null } });
    const adminUsers = await User.countDocuments({ role: "admin" });

    const recentUsers = await User.find()
      .select("username email role createdAt lastLogin githubId")
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      message: "Panel de administrador.",
      admin: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
      },
      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        githubUsers,
        adminUsers,
        localUsers: totalUsers - githubUsers,
      },
      recentUsers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/session
 * Información de la sesión actual
 */
const getSession = (req, res) => {
  if (!req.session || !req.session.passport) {
    return res.status(200).json({
      success: true,
      message: "No hay sesión activa.",
      session: {
        active: false,
        sessionId: req.sessionID || null,
      },
    });
  }

  res.status(200).json({
    success: true,
    message: "Sesión activa.",
    session: {
      active: true,
      sessionId: req.sessionID,
      userId: req.session.passport.user,
      cookie: {
        httpOnly: req.session.cookie.httpOnly,
        secure: req.session.cookie.secure,
        sameSite: req.session.cookie.sameSite,
        maxAge: req.session.cookie.maxAge,
        expires: req.session.cookie.expires,
      },
      user: req.user
        ? {
            id: req.user._id,
            username: req.user.username,
            email: req.user.email,
            role: req.user.role,
          }
        : null,
    },
  });
};

module.exports = { getProfile, getAdminPanel, getSession };
