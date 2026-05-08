import {
  UsersThreeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  UserPlusIcon,
  LockIcon,
  PencilSimpleIcon,
  TrashIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react";

export const equipoHelpMeta = {
  title: "Cómo usar Equipo",
  subtitle: "Guía paso a paso de la sección",
};

export const equipoHelpSteps = [
  {
    icon: UsersThreeIcon,
    title: "Visualizar el equipo",
    description:
      "Las tarjetas se agrupan por rol (Dirección, Recepción, Colaboradores, Marketing, Enfermería, Fisioterapia). Cada tarjeta muestra el avatar con la inicial del nombre, el rol, el email y el teléfono. El punto verde pulsante indica que el miembro está activo.",
  },
  {
    icon: MagnifyingGlassIcon,
    title: "Buscar un miembro",
    description:
      "Usa la barra de búsqueda en la parte superior izquierda. El listado se filtra en tiempo real por nombre o email a medida que escribes.",
  },
  {
    icon: FunnelIcon,
    title: "Filtrar por rol",
    description:
      "A la derecha de la búsqueda están los botones de rol: Todos, Admin, Recepción, Doctor, Marketing, Enfermería y Fisioterapia. Selecciona uno para ver únicamente a los miembros de esa categoría.",
  },
  {
    icon: UserPlusIcon,
    title: "Dar de alta a un miembro",
    description:
      "Solo el rol ADMIN puede crear miembros. Click en el botón ALTA DE PERSONAL arriba a la derecha y completa el formulario: nombre completo, email, contraseña, teléfono (10 dígitos) y rol. Al guardar, el miembro aparece de inmediato en su grupo correspondiente.",
  },
  {
    icon: LockIcon,
    title: "Requisitos de la contraseña",
    description:
      "La contraseña debe tener mínimo 8 caracteres, al menos una mayúscula, un número y un carácter especial. Aplica tanto al alta como al cambio de contraseña.",
  },
  {
    icon: PencilSimpleIcon,
    title: "Editar un miembro",
    description:
      "Click en el ícono de lápiz dentro de la tarjeta del miembro. Disponible para los roles ADMIN y RECEPCIÓN. Si no quieres cambiar la contraseña, déjala vacía: los demás campos se actualizan igual.",
  },
  {
    icon: TrashIcon,
    title: "Dar de baja a un miembro",
    description:
      "Solo el rol ADMIN puede dar de baja. Click en el ícono del tacho y confirma en el modal. Es una baja lógica (soft-delete): el miembro deja de aparecer en el listado, pero su historial dentro del sistema se conserva.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Permisos por rol",
    description:
      "ADMIN puede crear, editar y desactivar miembros. RECEPCIÓN puede editar. DOCTOR, MARKETING, ENFERMERÍA y FISIOTERAPIA solo visualizan el equipo.",
  },
];
