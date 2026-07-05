const app = require("./app");
const connectDB = require("./config/database");

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log("================================================");
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV || "development"}`);
      console.log("================================================");
      console.log("📌 Endpoints disponibles:");
      console.log(`   POST http://localhost:${PORT}/api/v1/auth/register`);
      console.log(`   POST http://localhost:${PORT}/api/v1/auth/login`);
      console.log(`   GET  http://localhost:${PORT}/api/v1/auth/github`);
      console.log(`   POST http://localhost:${PORT}/api/v1/auth/logout`);
      console.log(`   GET  http://localhost:${PORT}/api/v1/profile`);
      console.log(`   GET  http://localhost:${PORT}/api/v1/admin`);
      console.log(`   GET  http://localhost:${PORT}/api/v1/session`);
      console.log(`   GET  http://localhost:${PORT}/api/adoptions`);
      console.log("================================================");
    });
  } catch (error) {
    console.error("❌ Error iniciando servidor:", error);
    process.exit(1);
  }
};

startServer();
