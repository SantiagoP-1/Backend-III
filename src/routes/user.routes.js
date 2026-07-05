const express = require("express");
const router = express.Router();
const {
  getProfile,
  getAdminPanel,
  getSession,
} = require("../controllers/user.controller");
const {
  verifyToken,
  verifyAdmin,
} = require("../middlewares/auth.middleware");

/**
 * @route   GET /api/v1/session
 * @desc    Obtener datos de la sesión actual
 * @access  Public (muestra sesión si existe)
 */
router.get("/session", getSession);

/**
 * @route   GET /api/v1/profile
 * @desc    Perfil del usuario autenticado
 * @access  Private (requiere JWT)
 */
router.get("/profile", verifyToken, getProfile);

/**
 * @route   GET /api/v1/admin
 * @desc    Panel de administrador con estadísticas
 * @access  Private (requiere JWT + rol admin)
 */
router.get("/admin", verifyToken, verifyAdmin, getAdminPanel);

module.exports = router;
