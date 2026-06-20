import mongoose from "mongoose";

let txnSupported = false;

// Indica si el despliegue de Mongo soporta transacciones (replica set o mongos).
// En standalone (entorno local/docker simple) es false y se debe operar sin sesión.
export const transactionsSupported = () => txnSupported;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📂 Active Database: ${conn.connection.name}`);

    // Detectar si el servidor soporta transacciones
    try {
      const info = await conn.connection.db.admin().command({ hello: 1 });
      txnSupported = Boolean(info.setName) || info.msg === "isdbgrid";
    } catch {
      txnSupported = false;
    }
    console.log(
      `🔁 Transacciones: ${txnSupported ? "soportadas" : "no (standalone)"}`,
    );
  } catch (error) {
    console.error(`❌ Connection Error: ${error.message}`);
    process.exit(1); // Detiene el servidor si no hay base de datos
  }
};

export default connectDB;
