import {
  SquaresFourIcon,
  MagnifyingGlassIcon,
  UserPlusIcon,
  PencilSimpleIcon,
  WhatsappLogoIcon,
  PenNibIcon,
  HeartbeatIcon,
  PillIcon,
  NotePencilIcon,
  TagIcon,
  ClipboardTextIcon,
} from "@phosphor-icons/react";

export const pacientesHelpMeta = {
  title: "Cómo usar Pacientes",
  subtitle: "Guía paso a paso de la sección",
};

export const pacientesHelpSteps = [
  {
    icon: SquaresFourIcon,
    title: "Directorio y categorías",
    description:
      "La vista principal muestra tarjetas por categoría: Spa/Retail, Inyectables, Cotización, Cirugía, Post-Op y Otros, cada una con el conteo de pacientes registrados. Haz clic en una tarjeta para ir al listado filtrado de esa categoría. Usa el botón \"Volver al Directorio\" para regresar al dashboard.",
  },
  {
    icon: MagnifyingGlassIcon,
    title: "Buscar un paciente",
    description:
      "Usa la barra de búsqueda para filtrar en tiempo real por nombre completo o número de teléfono. El resultado se actualiza al instante mientras escribes.",
  },
  {
    icon: UserPlusIcon,
    title: "Registrar un nuevo paciente",
    description:
      "Haz clic en NUEVO REGISTRO (botón índigo). El modal tiene tres pasos: primero elige la categoría del paciente, luego captura nombre, teléfono, email, fecha de nacimiento y cómo nos conoció. Para pacientes clínicos (Inyectables, Cotización, Cirugía, Post-Op) se agrega un tercer paso con el historial médico completo: alergias, enfermedades, hábitos, antecedentes familiares y ginecológicos. Al guardar, el paciente queda registrado de inmediato.",
  },
  {
    icon: PencilSimpleIcon,
    title: "Editar información del paciente",
    description:
      "Abre el expediente haciendo clic en la tarjeta del paciente. En la pestaña Historial, haz clic en el ícono de lápiz para activar el modo edición. Modifica cualquier campo (nombre, teléfono, categoría, historial médico) y guarda los cambios. Roles habilitados: ADMIN, RECEPCIÓN, DOCTOR, ENFERMERÍA y FISIOTERAPIA.",
  },
  {
    icon: WhatsappLogoIcon,
    title: "Enviar formulario de historial al paciente",
    description:
      "Desde la pestaña Historial del expediente, haz clic en el botón de WhatsApp para generar un enlace temporal (válido 1 hora para pacientes clínicos, 24 horas para los demás). El paciente recibe el link y puede llenar o firmar su historial desde su teléfono sin necesidad de estar en la clínica. También está disponible en la pantalla de éxito al registrar un nuevo paciente.",
  },
  {
    icon: PenNibIcon,
    title: "Firma digital del expediente",
    description:
      "En la pestaña Firmas del expediente aparece el texto de consentimiento legal (NOM-004-SSA3-2012). Si el paciente está presente, puede dibujar su firma directamente en el canvas; el ícono de borrador limpia el trazo. Si el paciente no está, usa el botón de WhatsApp para enviarle un enlace de firma remota. Al guardar queda vinculada permanentemente al expediente con el sello \"Documento Firmado Digitalmente\".",
  },
  {
    icon: HeartbeatIcon,
    title: "Agregar una evolución clínica",
    description:
      "En la pestaña Evolución haz clic en Nueva Evolución (solo rol DOCTOR). Registra signos vitales (TA, FC, FR, temperatura, IMC), exploración física por segmento corporal, diagnóstico, pronóstico e indicaciones terapéuticas. Al guardar puedes descargar el PDF de la evolución o solicitar la firma del paciente vía WhatsApp. Las evoluciones se muestran en orden cronológico inverso con el nombre del médico.",
  },
  {
    icon: PillIcon,
    title: "Crear una receta médica",
    description:
      "En la pestaña Recetas haz clic en Nueva Receta (DOCTOR o ADMIN). Opcionalmente carga una plantilla existente para agilizar el proceso. Agrega tantos medicamentos como necesites con columnas de nombre, presentación, dosis, vía, frecuencia y duración. Añade indicaciones generales y los datos del médico. Al guardar puedes descargar el PDF oficial de la receta.",
  },
  {
    icon: NotePencilIcon,
    title: "Notas Post-Operatorias",
    description:
      "En la pestaña Post-Op haz clic en Nueva Nota (DOCTOR o ADMIN). Puedes cargar una plantilla predefinida para procedimientos frecuentes (p. ej. \"Nota Post-Op Mamoplastía\"). Escribe el título y el contenido clínico. Las notas quedan en la línea de tiempo del expediente con fecha y autor. Usa el botón Plantillas para crear, editar o eliminar plantillas reutilizables.",
  },
  {
    icon: TagIcon,
    title: "Cupones del paciente",
    description:
      "La pestaña Cupones muestra los códigos de descuento asignados al paciente: tipo (bienvenida, referido, temporada, etc.), porcentaje o monto de descuento, canjes disponibles y días restantes. Haz clic en el ícono de copiar para copiar el código al portapapeles. Los cupones expirados o agotados aparecen en una sección separada.",
  },
  {
    icon: ClipboardTextIcon,
    title: "Gestionar el catálogo de tratamientos",
    description:
      "El botón Tratamientos (ícono pastilla, arriba a la derecha) abre el gestor del catálogo. Desde aquí puedes agregar nuevos tratamientos con nombre, duración, rol del ejecutante y días sugeridos de retoque, organizados por categoría. Solo el rol ADMIN puede crear, editar o desactivar categorías de tratamiento.",
  },
];
