"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import TeamModal from "@/components/modal/TeamModal";
import DeleteModal from "@/components/modal/DeleteModal";
import { useBreakpoint } from "@/hooks/useBreakpoint";

// ICONOS SELECCIONADOS
import {
  EnvelopeSimple,
  Phone,
  UserPlus,
  MagnifyingGlass,
  PencilSimple,
  Trash,
} from "@phosphor-icons/react";

export default function TeamPage() {
  const { isTablet, isMobile } = useBreakpoint();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // ESTADOS DE BÚSQUEDA Y FILTRO
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("ALL");

  // 🛡️ LÓGICA: ESTADO PARA EL ROL DEL USUARIO
  const [currentUserRole, setCurrentUserRole] = useState("");

  const initialUserState = {
    name: "",
    email: "",
    password: "",
    role: "RECEPTIONIST",
    phone: "",
  };

  const [newUser, setNewUser] = useState(initialUserState);

  const closeAndReset = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setNewUser(initialUserState);
  };

  const roleConfig = {
    ADMIN: {
      label: "Dirección Médica",
      color: "bg-rose-500",
      light: "bg-rose-50",
      text: "text-rose-600",
      border: "border-rose-100",
    },
    RECEPTIONIST: {
      label: "Recepción y Tratamientos",
      color: "bg-purple-500",
      light: "bg-purple-50",
      text: "text-purple-600",
      border: "border-purple-100",
    },
    DOCTOR: {
      label: "Colaboradores",
      color: "bg-pink-400",
      light: "bg-pink-50",
      text: "text-pink-600",
      border: "border-pink-100",
    },
    MARKETING: {
      label: "Marketing",
      color: "bg-amber-500",
      light: "bg-amber-50",
      text: "text-amber-600",
      border: "border-amber-100",
    },
  };

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem("sbeltic_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      setStaff(result.data || []);
    } catch (error) {
      toast.error("Error al cargar el equipo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 🛡️ LÓGICA: OBTENER EL ROL AL CARGAR LA PÁGINA
    const userStr = localStorage.getItem("sbeltic_user");
    try {
      const userObj = userStr ? JSON.parse(userStr) : null;
      setCurrentUserRole(userObj?.role?.toUpperCase() || "");
    } catch (err) {
      setCurrentUserRole("");
    }

    fetchStaff();
  }, []);

  const handleSubmitUser = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("sbeltic_token");
    const url = editingId
      ? `${process.env.NEXT_PUBLIC_API_URL}/users/${editingId}`
      : `${process.env.NEXT_PUBLIC_API_URL}/users`;
    const method = editingId ? "PUT" : "POST";
    const payload = { ...newUser };
    if (payload.phone) payload.phone = payload.phone.trim().replace(/\D/g, "");
    if (editingId && !payload.password) delete payload.password;
    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success(
          editingId ? "¡Perfil actualizado!" : "¡Miembro registrado!",
        );
        closeAndReset();
        fetchStaff();
      } else {
        const result = await res.json();
        toast.error(result.message || "Error en la operación");
      }
    } catch (err) {
      toast.error("Error de conexión");
    }
  };

  const handleEditClick = (user) => {
    setEditingId(user._id);
    setNewUser({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      phone: user.phone || "",
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      const token = localStorage.getItem("sbeltic_token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/${userToDelete._id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        toast.success(`${userToDelete.name} ha sido desactivado`);
        fetchStaff();
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
      }
    } catch (err) {
      toast.error("Error al procesar la baja");
    }
  };

  // Lógica de Filtrado
  const filteredStaff = staff.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole =
      selectedRole === "ALL" || user.role?.toUpperCase() === selectedRole;
    return matchesSearch && matchesRole;
  });

  const groupedStaff = filteredStaff.reduce((acc, user) => {
    const role = user.role?.toUpperCase().trim() || "DOCTOR";
    if (!acc[role]) acc[role] = [];
    acc[role].push(user);
    return acc;
  }, {});

  return (
    <div className="space-y-10 p-4 md:p-8 pb-24 md:pb-8 max-w-full overflow-x-hidden">
      {/* HEADER ORIGINAL */}
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
        <div className="space-y-2 text-center md:text-left">
          <h2 className="text-4xl md:text-5xl font-extrabold italic uppercase text-slate-900 leading-none">
            Gestión de Equipo
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-label">
            Estructura organizacional Sbeltic
          </p>
        </div>

        {/* 🛡️ LÓGICA: SOLO ADMIN PUEDE DAR DE ALTA */}
        {currentUserRole === "ADMIN" && (
          <button
            onClick={() => {
              setEditingId(null);
              setNewUser(initialUserState);
              setIsModalOpen(true);
            }}
            className="w-full md:w-auto px-8 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-rose-500 transition-all text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg hover:shadow-rose-500/30"
          >
            <UserPlus size={18} weight="bold" /> ALTA DE PERSONAL
          </button>
        )}
      </header>

      {/* TOOLBAR REPARADA: Grid en móvil para evitar empujes */}
      <div className="grid grid-cols-1 md:flex md:items-center gap-4 mb-8">
        <div className="relative w-full md:w-80 shrink-0">
          <MagnifyingGlass
            size={20}
            weight="bold"
            className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="BUSCAR..."
            className="w-full pl-14 pr-6 py-5 bg-white border-2 border-slate-100 rounded-2xl font-bold text-[11px] uppercase tracking-widest outline-none focus:border-slate-900 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Contenedor de filtros: Scrollable pero contenido */}
        <div className="w-full md:flex-1 overflow-hidden">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 md:pb-0">
            {["ALL", "ADMIN", "RECEPTIONIST", "DOCTOR", "MARKETING"].map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRole(r)}
                className={`px-6 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border-2 whitespace-nowrap shrink-0 ${selectedRole === r ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-400 border-slate-100 hover:border-slate-900"}`}
              >
                {r === "ALL" ? "TODOS" : roleConfig[r]?.label.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <TeamModal
        isOpen={isModalOpen}
        onClose={closeAndReset}
        newUser={newUser}
        setNewUser={setNewUser}
        onSubmit={handleSubmitUser}
        isEditing={!!editingId}
      />
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        userName={userToDelete?.name}
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-slate-100 rounded-4xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-12">
          {Object.keys(roleConfig).map((role) => {
            const usersInRole = groupedStaff[role];
            if (!usersInRole || usersInRole.length === 0) return null;
            const config = roleConfig[role];
            return (
              <section key={role} className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className={`h-8 w-1.5 rounded-full ${config.color}`} />
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-label">
                    {config.label}
                  </h3>
                  <div className="flex-1 h-px bg-slate-100" />
                </div>

                {/* GRID ORIGINAL INTACTO */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                  {usersInRole.map((user) => (
                    <div
                      key={user._id}
                      className="relative bg-white border border-slate-100 p-6 rounded-4xl shadow-sm hover:shadow-md transition-all group overflow-hidden h-full flex flex-col justify-between"
                    >
                      <div>
                        <div className="absolute top-4 right-4 flex items-center gap-1.5">
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${user.isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`}
                          />
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                            {user.isActive ? "Online" : "Off"}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mb-4">
                          <div
                            className={`w-12 h-12 aspect-square shrink-0 flex items-center justify-center font-black text-lg rounded-2xl ${config.light} ${config.text}`}
                          >
                            {user.name.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1 pr-2">
                            <p className="font-black text-slate-800 leading-tight truncate">
                              {user.name}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                              {config.label}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2 border-t border-slate-50 pt-4 text-xs text-slate-500 font-medium">
                          <div className="flex items-center gap-2 truncate">
                            <EnvelopeSimple
                              size={14}
                              weight="bold"
                              className="shrink-0"
                            />
                            <span className="truncate">{user.email}</span>
                          </div>
                          <div className="flex items-center gap-2 font-bold text-slate-800 truncate">
                            <Phone
                              size={14}
                              weight="bold"
                              className="shrink-0"
                            />
                            <span className="truncate">
                              {user.phone || "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 🛡️ LÓGICA: OCULTAR BOTONES SI ES DOCTOR */}
                      {(currentUserRole === "ADMIN" ||
                        currentUserRole === "RECEPTIONIST") && (
                        <div className="mt-6 flex gap-2">
                          {/* EDIT: Visible para ADMIN y RECEPTIONIST */}
                          <button
                            onClick={() => handleEditClick(user)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${config.light} ${config.text} hover:bg-slate-900 hover:text-white`}
                          >
                            <PencilSimple size={14} weight="bold" /> Edit
                          </button>

                          {/* DELETE: Solo visible para ADMIN */}
                          {currentUserRole === "ADMIN" && (
                            <button
                              onClick={() => handleDeleteClick(user)}
                              className="flex items-center justify-center gap-1.5 px-4 py-3 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase hover:bg-rose-600 hover:text-white transition-colors"
                            >
                              <Trash size={14} weight="bold" /> Del
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
