const session = require("express-session");
const MongoStore = require("connect-mongo");

const configureSession = () => {
  return session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
      ttl: 24 * 60 * 60, // 1 día en segundos
      autoRemove: "native",
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 1 día en ms
    },
    name: "sessionId",
  });
};

module.exports = configureSession;
