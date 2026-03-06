const allowedOrigins = [
  "http://localhost:3000", // Tu Frontend de Next.js
  "http://127.0.0.1:3000",
];

const corsOptions = {
  origin: (origin, callback) => {
    // Permitir peticiones sin origen (como Postman) o las que estén en la lista
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("No permitido por CORS - Vidix Security"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true, // Vital si luego usamos Cookies o JWT
  optionsSuccessStatus: 200,
};

export default corsOptions;
