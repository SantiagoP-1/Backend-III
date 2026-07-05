const mongoose = require("mongoose");

const petSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "El nombre de la mascota es obligatorio"],
      trim: true,
      minlength: [2, "El nombre debe tener al menos 2 caracteres"],
      maxlength: [40, "El nombre no puede superar 40 caracteres"],
    },
    species: {
      type: String,
      required: [true, "La especie es obligatoria"],
      enum: {
        values: ["perro", "gato", "otro"],
        message: "La especie debe ser 'perro', 'gato' u 'otro'",
      },
    },
    breed: {
      type: String,
      trim: true,
      default: "Mestizo",
    },
    age: {
      type: Number,
      required: [true, "La edad es obligatoria"],
      min: [0, "La edad no puede ser negativa"],
      max: [30, "La edad no puede superar 30 años"],
    },
    adopted: {
      type: Boolean,
      default: false,
    },
    adoptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

const Pet = mongoose.model("Pet", petSchema);

module.exports = Pet;
