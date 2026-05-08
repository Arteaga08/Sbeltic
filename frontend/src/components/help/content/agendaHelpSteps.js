import {
  CalendarIcon,
  FunnelIcon,
  SquaresFourIcon,
  PlusCircleIcon,
  PencilSimpleIcon,
  ArrowsClockwiseIcon,
  CubeIcon,
  CurrencyDollarIcon,
  XCircleIcon,
  FilePdfIcon,
  ListBulletsIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react";

export const agendaHelpMeta = {
  title: "Cómo usar Agenda",
  subtitle: "Guía paso a paso de la sección",
};

export const agendaHelpSteps = [
  {
    icon: CalendarIcon,
    title: "Navegar entre semanas",
    description:
      "Usa los botones ◀ y ▶ para moverte a la semana anterior o siguiente. El botón Esta semana te regresa al presente de inmediato. También puedes tocar directamente la fecha para saltar a cualquier semana del año. La agenda siempre muestra de lunes a sábado; los domingos están deshabilitados porque la clínica no trabaja ese día.",
  },
  {
    icon: FunnelIcon,
    title: "Filtrar por cabina o por doctor",
    description:
      "En la parte superior hay dos filtros. El primero te permite ver solo las citas de una cabina específica (Cabina 1, 2 o 3, Spa, Consultorio, Quirófano) o todas a la vez. El segundo filtra por el profesional que atiende. Puedes combinar ambos para encontrar un espacio disponible de forma rápida.",
  },
  {
    icon: SquaresFourIcon,
    title: "Leer el calendario",
    description:
      "Cada cita aparece como un bloque de color proporcional a su duración. El color indica la categoría: rosa/rojo para Cirugía, ámbar para Consulta, púrpura para Spa, azul para Facial, rosa claro para Depilación y esmeralda para Otros. Un punto de color en el bloque indica el estado actual de la cita. Una línea roja pulsante marca la hora exacta del momento. Al abrir la agenda en el día de hoy, la vista se desplaza automáticamente a la hora actual.",
  },
  {
    icon: PlusCircleIcon,
    title: "Crear una nueva cita",
    description:
      "Haz clic en el botón Agendar (arriba a la derecha). En el modal que se abre: 1) Elige la categoría del tratamiento (Cirugía, Consulta, Spa, Facial, Depilación u Otros). 2) Busca al paciente escribiendo su nombre, teléfono o email — o crea uno nuevo con el tab + Nuevo. 3) Selecciona el doctor o personal que atiende. 4) Elige el tratamiento del dropdown (la duración se llena automáticamente). 5) Ingresa la fecha y hora de inicio (no puede ser domingo ni una fecha pasada, y el horario debe estar entre 7:00 y 23:00). 6) Selecciona la cabina y ajusta la duración con los selectores de horas y minutos (mínimo 15 minutos). Por último, haz clic en Guardar cita.",
  },
  {
    icon: PencilSimpleIcon,
    title: "Ver o editar una cita existente",
    description:
      "Haz clic en cualquier bloque del calendario para abrir el detalle de la cita. El modal tiene tres pestañas. La primera (Info) muestra los datos del paciente, el tratamiento y el doctor, y permite descargar los PDFs. La segunda (Insumos) lista los productos utilizados y permite agregar o quitar insumos buscando por nombre. La tercera (Finanzas) tiene el campo de notas de consulta, la cotización, los cupones disponibles del paciente y el total final. Haz clic en Guardar cambios en cualquier momento para confirmar.",
  },
  {
    icon: ArrowsClockwiseIcon,
    title: "Cambiar el estado de una cita",
    description:
      "Dentro del detalle de la cita (tab Info) puedes cambiar el estado usando el selector de estado. Los estados disponibles son: Pendiente (ámbar) — cita sin confirmar; Confirmada (verde) — paciente confirmado; En curso (azul pulsante) — procedimiento activo; Completada (gris) — finalizada; Cancelada (rojo) — cita cancelada; No asistió (gris) — paciente no se presentó. Al cambiar a Completada, el sistema valida automáticamente que haya stock suficiente de los insumos registrados antes de permitir el cambio.",
  },
  {
    icon: CubeIcon,
    title: "Registrar insumos utilizados",
    description:
      "En la pestaña Insumos del detalle de la cita, usa el buscador para encontrar un producto por nombre. Alterna entre Médico y Retail según el tipo de insumo. Ajusta la cantidad con los botones + / − y haz clic en Agregar. Los insumos ya agregados aparecen en la lista inferior; puedes cambiar su cantidad con el campo numérico o eliminarlos con el botón ✕. El sistema revisa el stock disponible antes de marcar la cita como Completada.",
  },
  {
    icon: CurrencyDollarIcon,
    title: "Finanzas, notas y cupones",
    description:
      "En la pestaña Finanzas puedes escribir notas de consulta u observaciones del procedimiento. El campo Cotización refleja el precio del servicio. Si el paciente tiene cupones activos en su wallet, aparecen listados — haz clic en uno para aplicarlo automáticamente. También puedes ingresar un código de cupón manual y presionar Aplicar. El resumen muestra la cotización original, el descuento aplicado y el Total Final destacado. Al presionar Finalizar y cobrar (cuando la cita está Completada) o Guardar cambios se registran todos los datos.",
  },
  {
    icon: XCircleIcon,
    title: "Cancelar una cita",
    description:
      "Abre la cita, ve a la pestaña Finanzas y haz clic en Cancelar esta cita. Confirma en el diálogo que aparece. El estado cambia a Cancelada (rojo) y la cita queda registrada en el historial. Solo se pueden cancelar citas que no estén ya Completadas o Canceladas.",
  },
  {
    icon: FilePdfIcon,
    title: "Descargar PDF de la cita",
    description:
      "Dentro de la pestaña Info del detalle de la cita hay dos botones de descarga. Descargar Registro de Cita genera un PDF con los datos completos de la cita: paciente, fecha, hora, tratamiento, doctor, cabina, estado, notas, insumos utilizados y resumen financiero con descuentos. Descargar Historial Médico PDF genera el historial completo del paciente si está disponible.",
  },
  {
    icon: ListBulletsIcon,
    title: "Panel lateral — cirugías, prioridad y resumen",
    description:
      "En desktop verás un panel fijo a la derecha con tres secciones. Próximas Cirugías lista los procedimientos quirúrgicos pendientes para los próximos 6 días con hora, cabina y paciente. Lista de Prioridad muestra los pacientes en lista de espera con estado WAITING. El Resumen Semanal indica el total de citas activas, cuántas están confirmadas o en curso, y los ingresos de la semana (suma de citas Completadas). En móvil, este panel se abre tocando el botón flotante (ícono de lista) en la esquina inferior derecha, que también muestra el número de alertas activas.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Permisos según tu rol",
    description:
      "El rol MARKETING solo puede visualizar la agenda en modo lectura: no puede crear citas, editar, cambiar estados, registrar insumos, aplicar cupones, cancelar ni descargar PDFs. El botón Agendar no aparece para este rol. Los roles ADMIN, DOCTOR, RECEPCIÓN, ENFERMERÍA y FISIOTERAPIA tienen acceso completo a todas las funciones descritas en esta guía.",
  },
];
