const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const SALT_ROUNDS = 12;

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: function () {
        return !this.githubId;
      },
      trim: true,
      minlength: [3, "El username debe tener al menos 3 caracteres"],
      maxlength: [30, "El username no puede superar 30 caracteres"],
    },
    email: {
      type: String,
      required: [true, "El email es obligatorio"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Email inválido",
      ],
    },
    password: {
      type: String,
      required: function () {
        return !this.githubId;
      },
      minlength: [6, "La contraseña debe tener al menos 6 caracteres"],
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    githubId: {
      type: String,
      default: null,
      sparse: true,
    },
    githubUsername: {
      type: String,
      default: null,
    },
    avatar: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Middleware: Hash password antes de guardar
userSchema.pre("save", async function (next) {
  // Solo hashear si el password fue modificado o es nuevo
  if (!this.isModified("password") || !this.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método de instancia: Comparar password
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Método estático: Buscar por email
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

const User = mongoose.model("User", userSchema);

module.exports = User;
