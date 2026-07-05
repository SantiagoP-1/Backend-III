const Pet = require("../models/pet.model");

/**
 * GET /api/adoptions
 * Listar todas las mascotas disponibles para adopción.
 * Soporta filtro opcional ?adopted=true|false
 * @access Public
 */
const getAllPets = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.adopted === "true") filter.adopted = true;
    if (req.query.adopted === "false") filter.adopted = false;

    const pets = await Pet.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Mascotas obtenidas correctamente.",
      count: pets.length,
      pets,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/adoptions/:id
 * Obtener una mascota puntual por id.
 * @access Public
 */
const getPetById = async (req, res, next) => {
  try {
    const pet = await Pet.findById(req.params.id);

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: "Mascota no encontrada.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Mascota obtenida correctamente.",
      pet,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/adoptions
 * Crear una nueva mascota disponible para adopción.
 * @access Private (requiere JWT + rol admin)
 */
const createPet = async (req, res, next) => {
  try {
    const { name, species, breed, age } = req.body;

    if (!name || !species || age === undefined || age === null) {
      return res.status(400).json({
        success: false,
        message: "Los campos 'name', 'species' y 'age' son obligatorios.",
      });
    }

    const pet = await Pet.create({ name, species, breed, age });

    res.status(201).json({
      success: true,
      message: "Mascota creada correctamente.",
      pet,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/adoptions/:id
 * Actualizar una mascota (ej: marcarla como adoptada).
 * @access Private (requiere JWT + rol admin)
 */
const updatePet = async (req, res, next) => {
  try {
    const updates = (({ name, species, breed, age, adopted, adoptedBy }) => ({
      name,
      species,
      breed,
      age,
      adopted,
      adoptedBy,
    }))(req.body);

    // Elimina claves undefined para no pisar campos no enviados
    Object.keys(updates).forEach((key) => updates[key] === undefined && delete updates[key]);

    const pet = await Pet.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: "Mascota no encontrada.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Mascota actualizada correctamente.",
      pet,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/adoptions/:id
 * Eliminar una mascota del listado.
 * @access Private (requiere JWT + rol admin)
 */
const deletePet = async (req, res, next) => {
  try {
    const pet = await Pet.findByIdAndDelete(req.params.id);

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: "Mascota no encontrada.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Mascota eliminada correctamente.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllPets, getPetById, createPet, updatePet, deletePet };
