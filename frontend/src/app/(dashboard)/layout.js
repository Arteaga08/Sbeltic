import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* El menú lateral que acabamos de crear */}
      <Sidebar />

      {/* Contenedor principal del contenido */}
      <main className="flex-1 pb-24 md:pb-8 p-4 md:p-10">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
