const express = require("express");
const router = express.Router();
const {
  getAllPets,
  getPetById,
  createPet,
  updatePet,
  deletePet,
} = require("../controllers/adoption.controller");
const { verifyToken, verifyAdmin } = require("../middlewares/auth.middleware");

/**
 * @route   GET /api/adoptions
 * @desc    Listar todas las mascotas disponibles para adopción
 * @access  Public
 */
router.get("/", getAllPets);

/**
 * @route   GET /api/adoptions/:id
 * @desc    Obtener una mascota por id
 * @access  Public
 */
router.get("/:id", getPetById);

/**
 * @route   POST /api/adoptions
 * @desc    Registrar una nueva mascota para adopción
 * @access  Private (JWT + rol admin)
 */
router.post("/", verifyToken, verifyAdmin, createPet);

/**
 * @route   PUT /api/adoptions/:id
 * @desc    Actualizar una mascota (ej: marcarla como adoptada)
 * @access  Private (JWT + rol admin)
 */
router.put("/:id", verifyToken, verifyAdmin, updatePet);

/**
 * @route   DELETE /api/adoptions/:id
 * @desc    Eliminar una mascota del listado
 * @access  Private (JWT + rol admin)
 */
router.delete("/:id", verifyToken, verifyAdmin, deletePet);

module.exports = router;
