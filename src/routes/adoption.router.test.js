process.env.JWT_SECRET = "test_jwt_secret_para_pruebas";
process.env.NODE_ENV = "test";

const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");

const adoptionRouter = require("./adoption.router");
const { errorHandler, notFound } = require("../middlewares/error.middleware");

/* ────────────────────────────────────────────────────────────────────────
 * FAKE de base de datos para Pet:
 * Implementación en memoria que se comporta como el modelo real de
 * Mongoose (find().sort(), findById, create, findByIdAndUpdate,
 * findByIdAndDelete) pero sin tocar una base de datos real.
 * Esto es un FAKE (implementación liviana funcional), no un simple mock.
 * ──────────────────────────────────────────────────────────────────────── */
jest.mock("../models/pet.model", () => {
  let pets = [];
  let shouldThrow = false;

  return {
    __reset: (seed = []) => {
      pets = seed.map((p) => ({ ...p }));
      shouldThrow = false;
    },
    __throwNext: () => {
      shouldThrow = true;
    },
    find: jest.fn((filter = {}) => ({
      sort: () => {
        if (shouldThrow) return Promise.reject(new Error("Fallo simulado de base de datos"));
        let result = pets;
        if (filter.adopted === true) result = pets.filter((p) => p.adopted === true);
        if (filter.adopted === false) result = pets.filter((p) => p.adopted === false);
        return Promise.resolve(result);
      },
    })),
    findById: jest.fn((id) => {
      if (shouldThrow) return Promise.reject(new Error("Fallo simulado de base de datos"));
      if (id === "not-a-valid-objectid") {
        return Promise.reject(Object.assign(new Error("Cast to ObjectId failed"), { name: "CastError" }));
      }
      return Promise.resolve(pets.find((p) => p._id === id) || null);
    }),
    create: jest.fn((data) => {
      if (shouldThrow) return Promise.reject(new Error("Fallo simulado de base de datos"));
      const newPet = { _id: `fake-${pets.length + 1}`, adopted: false, adoptedBy: null, ...data };
      pets.push(newPet);
      return Promise.resolve(newPet);
    }),
    findByIdAndUpdate: jest.fn((id, updates) => {
      if (shouldThrow) return Promise.reject(new Error("Fallo simulado de base de datos"));
      const pet = pets.find((p) => p._id === id);
      if (!pet) return Promise.resolve(null);
      Object.assign(pet, updates);
      return Promise.resolve(pet);
    }),
    findByIdAndDelete: jest.fn((id) => {
      if (shouldThrow) return Promise.reject(new Error("Fallo simulado de base de datos"));
      const idx = pets.findIndex((p) => p._id === id);
      if (idx === -1) return Promise.resolve(null);
      const [deleted] = pets.splice(idx, 1);
      return Promise.resolve(deleted);
    }),
  };
});

/* ────────────────────────────────────────────────────────────────────────
 * MOCK de servicio para User (usado internamente por verifyToken/verifyAdmin
 * en auth.middleware.js). Es un MOCK clásico: no tiene lógica propia, cada
 * test configura explícitamente qué debe devolver.
 * ──────────────────────────────────────────────────────────────────────── */
jest.mock("../models/user.model", () => ({
  findById: jest.fn(),
}));

const Pet = require("../models/pet.model");
const User = require("../models/user.model");

// ─── App de pruebas: monta SOLO el router bajo test + manejo de errores real ───
const app = express();
app.use(express.json());
app.use("/api/adoptions", adoptionRouter);
app.use(notFound);
app.use(errorHandler);

// ─── Helpers de autenticación ───────────────────────────────────────────────
const ADMIN = { _id: "admin1", role: "admin", isActive: true };
const REGULAR_USER = { _id: "user1", role: "user", isActive: true };

const tokenFor = (user) =>
  jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

const mockAuthenticatedAs = (user) => {
  User.findById.mockReturnValue({ select: () => Promise.resolve(user) });
};

const SEED_PETS = [
  { _id: "pet1", name: "Firulais", species: "perro", breed: "Mestizo", age: 3, adopted: false, adoptedBy: null },
  { _id: "pet2", name: "Michi", species: "gato", breed: "Siames", age: 2, adopted: true, adoptedBy: "user1" },
];

beforeEach(() => {
  jest.clearAllMocks();
  Pet.__reset(SEED_PETS);
});

/* ══════════════════════════════ GET /api/adoptions ══════════════════════ */
describe("GET /api/adoptions", () => {
  test("200 - devuelve la lista completa de mascotas (caso exitoso)", async () => {
    const res = await request(app).get("/api/adoptions");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(2);
    expect(res.body.pets).toHaveLength(2);
    expect(Pet.find).toHaveBeenCalledTimes(1);
  });

  test("200 - filtra correctamente por ?adopted=false", async () => {
    const res = await request(app).get("/api/adoptions?adopted=false");

    expect(res.status).toBe(200);
    expect(res.body.pets).toHaveLength(1);
    expect(res.body.pets[0].name).toBe("Firulais");
  });

  test("200 - devuelve lista vacía cuando no hay mascotas cargadas", async () => {
    Pet.__reset([]);
    const res = await request(app).get("/api/adoptions");

    expect(res.status).toBe(200);
    expect(res.body.pets).toEqual([]);
    expect(res.body.count).toBe(0);
  });

  test("500 - error simulado de base de datos", async () => {
    Pet.__throwNext();
    const res = await request(app).get("/api/adoptions");

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

/* ═══════════════════════════ GET /api/adoptions/:id ══════════════════════ */
describe("GET /api/adoptions/:id", () => {
  test("200 - devuelve una mascota existente (caso exitoso)", async () => {
    const res = await request(app).get("/api/adoptions/pet1");

    expect(res.status).toBe(200);
    expect(res.body.pet.name).toBe("Firulais");
  });

  test("404 - mascota inexistente", async () => {
    const res = await request(app).get("/api/adoptions/no-existe");

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test("400 - id con formato inválido (CastError de Mongoose)", async () => {
    const res = await request(app).get("/api/adoptions/not-a-valid-objectid");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test("500 - error simulado de base de datos", async () => {
    Pet.__throwNext();
    const res = await request(app).get("/api/adoptions/pet1");

    expect(res.status).toBe(500);
  });
});

/* ══════════════════════════════ POST /api/adoptions ══════════════════════ */
describe("POST /api/adoptions", () => {
  const validPet = { name: "Rocky", species: "perro", breed: "Bóxer", age: 1 };

  test("401 - sin token de autenticación", async () => {
    const res = await request(app).post("/api/adoptions").send(validPet);

    expect(res.status).toBe(401);
    expect(res.body.code).toBe("NO_TOKEN");
  });

  test("403 - autenticado pero sin rol admin", async () => {
    mockAuthenticatedAs(REGULAR_USER);
    const res = await request(app)
      .post("/api/adoptions")
      .set("Authorization", `Bearer ${tokenFor(REGULAR_USER)}`)
      .send(validPet);

    expect(res.status).toBe(403);
  });

  test("400 - validación: faltan campos obligatorios", async () => {
    mockAuthenticatedAs(ADMIN);
    const res = await request(app)
      .post("/api/adoptions")
      .set("Authorization", `Bearer ${tokenFor(ADMIN)}`)
      .send({ name: "Sin especie ni edad" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test("201 - crea la mascota correctamente (caso exitoso, admin autenticado)", async () => {
    mockAuthenticatedAs(ADMIN);
    const res = await request(app)
      .post("/api/adoptions")
      .set("Authorization", `Bearer ${tokenFor(ADMIN)}`)
      .send(validPet);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.pet.name).toBe("Rocky");
    expect(Pet.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Rocky", species: "perro" })
    );
  });

  test("500 - error simulado de base de datos", async () => {
    mockAuthenticatedAs(ADMIN);
    Pet.__throwNext();
    const res = await request(app)
      .post("/api/adoptions")
      .set("Authorization", `Bearer ${tokenFor(ADMIN)}`)
      .send(validPet);

    expect(res.status).toBe(500);
  });
});

/* ═══════════════════════════ PUT /api/adoptions/:id ═══════════════════════ */
describe("PUT /api/adoptions/:id", () => {
  test("401 - sin token de autenticación", async () => {
    const res = await request(app).put("/api/adoptions/pet1").send({ adopted: true });

    expect(res.status).toBe(401);
  });

  test("403 - autenticado pero sin rol admin", async () => {
    mockAuthenticatedAs(REGULAR_USER);
    const res = await request(app)
      .put("/api/adoptions/pet1")
      .set("Authorization", `Bearer ${tokenFor(REGULAR_USER)}`)
      .send({ adopted: true });

    expect(res.status).toBe(403);
  });

  test("404 - mascota inexistente", async () => {
    mockAuthenticatedAs(ADMIN);
    const res = await request(app)
      .put("/api/adoptions/no-existe")
      .set("Authorization", `Bearer ${tokenFor(ADMIN)}`)
      .send({ adopted: true });

    expect(res.status).toBe(404);
  });

  test("200 - actualiza la mascota correctamente (caso exitoso)", async () => {
    mockAuthenticatedAs(ADMIN);
    const res = await request(app)
      .put("/api/adoptions/pet1")
      .set("Authorization", `Bearer ${tokenFor(ADMIN)}`)
      .send({ adopted: true, adoptedBy: "user1" });

    expect(res.status).toBe(200);
    expect(res.body.pet.adopted).toBe(true);
  });

  test("500 - error simulado de base de datos", async () => {
    mockAuthenticatedAs(ADMIN);
    Pet.__throwNext();
    const res = await request(app)
      .put("/api/adoptions/pet1")
      .set("Authorization", `Bearer ${tokenFor(ADMIN)}`)
      .send({ adopted: true });

    expect(res.status).toBe(500);
  });
});

/* ═══════════════════════════ DELETE /api/adoptions/:id ═══════════════════ */
describe("DELETE /api/adoptions/:id", () => {
  test("401 - sin token de autenticación", async () => {
    const res = await request(app).delete("/api/adoptions/pet1");

    expect(res.status).toBe(401);
  });

  test("403 - autenticado pero sin rol admin", async () => {
    mockAuthenticatedAs(REGULAR_USER);
    const res = await request(app)
      .delete("/api/adoptions/pet1")
      .set("Authorization", `Bearer ${tokenFor(REGULAR_USER)}`);

    expect(res.status).toBe(403);
  });

  test("404 - mascota inexistente", async () => {
    mockAuthenticatedAs(ADMIN);
    const res = await request(app)
      .delete("/api/adoptions/no-existe")
      .set("Authorization", `Bearer ${tokenFor(ADMIN)}`);

    expect(res.status).toBe(404);
  });

  test("200 - elimina la mascota correctamente (caso exitoso)", async () => {
    mockAuthenticatedAs(ADMIN);
    const res = await request(app)
      .delete("/api/adoptions/pet1")
      .set("Authorization", `Bearer ${tokenFor(ADMIN)}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Pet.findByIdAndDelete).toHaveBeenCalledWith("pet1");
  });

  test("500 - error simulado de base de datos", async () => {
    mockAuthenticatedAs(ADMIN);
    Pet.__throwNext();
    const res = await request(app)
      .delete("/api/adoptions/pet1")
      .set("Authorization", `Bearer ${tokenFor(ADMIN)}`);

    expect(res.status).toBe(500);
  });
});
