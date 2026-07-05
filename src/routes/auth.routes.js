const express = require("express");
const router = express.Router();
const {
  register,
  login,
  githubAuth,
  githubCallback,
  logout,
} = require("../controllers/auth.controller");
const {
  validateRegister,
  validateLogin,
} = require("../middlewares/validation.middleware");

/**
 * @route   POST /api/v1/auth/register
 * @desc    Registrar nuevo usuario con email y contraseña
 * @access  Public
 */
router.post("/register", validateRegister, register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login con Passport Local + JWT
 * @access  Public
 */
router.post("/login", validateLogin, login);

/**
 * @route   GET /api/v1/auth/github
 * @desc    Iniciar flujo OAuth con GitHub
 * @access  Public
 */
router.get("/github", githubAuth);

/**
 * @route   GET /api/v1/auth/github/callback
 * @desc    Callback de GitHub OAuth
 * @access  Public
 */
router.get("/github/callback", githubCallback);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Cerrar sesión (destruir sesión + limpiar cookie)
 * @access  Private
 */
router.post("/logout", logout);

module.exports = router;
