"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Apuntamos a la ruta real de tu backend: /users/login
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        },
      );

      const result = await response.json();

      if (response.ok) {
        // 2. Tu backend estructurado manda todo dentro de "data"
        const { token, user } = result.data;

        // 3. Guardamos el "gafete" y la información del usuario
        localStorage.setItem("sbeltic_token", token);
        localStorage.setItem("sbeltic_user", JSON.stringify(user));

        toast.success(result.message || `¡Bienvenido, ${user.name}!`);

        // 4. Lo mandamos directo a la agenda
        router.push("/agenda");
      } else {
        // Captura los errores de AppError (ej. "Correo o contraseña incorrectos")
        toast.error(result.message || "Error al iniciar sesión");
      }
    } catch (error) {
      console.error("Error en login:", error);
      toast.error("Error al conectar con el servidor Sbeltic");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">
            SBELTIC
          </h1>
          <p className="text-sm font-bold text-slate-400 mt-2 uppercase tracking-widest">
            Acceso Autorizado
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none transition-all"
              placeholder="ejemplo@sbeltic.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">
              Contraseña
            </label>
            <input
              type="password"
              required
              className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl shadow-lg shadow-slate-900/20 hover:bg-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? "Verificando..." : "INGRESAR AL SISTEMA"}
          </button>
        </form>
      </div>

      <p className="mt-8 text-xs font-bold text-slate-400 uppercase tracking-widest">
        Powered by Vidix Studio
      </p>
    </div>
  );
}
