export default function DashboardHome() {
  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-3xl font-bold text-slate-900">
          ¡Hola, Dr. Admin! 👋
        </h2>
        <p className="text-slate-500">
          Esto es lo que está pasando hoy en Sbeltic.
        </p>
      </header>

      {/* Grid de ejemplo para los "Bento Blocks" */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-slate-400 text-sm font-bold uppercase">
            Citas Hoy
          </p>
          <p className="text-4xl font-bold text-primary">12</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-slate-400 text-sm font-bold uppercase">
            En Espera
          </p>
          <p className="text-4xl font-bold text-slate-800">3</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-slate-400 text-sm font-bold uppercase">
            Stock Crítico
          </p>
          <p className="text-4xl font-bold text-accent">2</p>
        </div>
      </div>
    </div>
  );
}
