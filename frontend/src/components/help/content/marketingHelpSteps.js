import {
  ChartLineUpIcon,
  TagIcon,
  PlusCircleIcon,
  ChatTeardropTextIcon,
  CalendarIcon,
  PencilSimpleIcon,
  PaperPlaneRightIcon,
  PauseCircleIcon,
  TrashIcon,
  CopyIcon,
  TicketIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react";

export const marketingHelpMeta = {
  title: "Cómo usar Marketing",
  subtitle: "Guía paso a paso de la sección",
};

export const marketingHelpSteps = [
  {
    icon: ChartLineUpIcon,
    title: "Vista del dashboard",
    description:
      "Al entrar a Marketing ves el dashboard principal con dos secciones. Arriba están las métricas de impacto global: Conversión 1ra Visita (% de cupones de bienvenida canjeados), Referidos Activos (cupones referral que generaron uso) y Ahorro Generado ($ total ahorrado por pacientes). Abajo están los 6 módulos de campaña organizados por objetivo estratégico.",
  },
  {
    icon: TagIcon,
    title: "Módulos de campaña",
    description:
      "Hay seis tipos de campaña disponibles. Bienvenida: se envía automáticamente después de que un paciente completa su primera cita. Referidos: premia a pacientes que recomiendan la clínica a otras personas. Promos Mensuales: promociones de temporada que puedes enviar cuando lo decidas. Liquidación: se activa automáticamente cuando un producto vinculado baja de stock. Cumpleaños: regalo automático en la fecha de nacimiento del paciente. Mantenimiento: recordatorio de retoques enviado cuando se cumplen los días recomendados después de un tratamiento. Haz clic en cualquier módulo para ver sus campañas activas.",
  },
  {
    icon: PlusCircleIcon,
    title: "Crear una nueva campaña",
    description:
      "Haz clic en NUEVA CAMPAÑA (arriba a la derecha). El modal tiene tres pasos. En Parámetros: elige el objetivo (tipo de campaña), escribe el código del cupón en mayúsculas (ej: VERANO), selecciona si el descuento es porcentaje (%) o monto fijo ($), ingresa el valor y fija la fecha de vigencia (debe ser en el futuro). El código debe ser único — si ya existe en la base de datos, el sistema te avisará. Completa los siguientes pasos y haz clic en Crear Campaña para guardar.",
  },
  {
    icon: ChatTeardropTextIcon,
    title: "Plantilla de WhatsApp y variables",
    description:
      "Cada tipo de campaña usa una plantilla de WhatsApp pre-aprobada por Meta. En el paso Configuración puedes revisar cómo se verá el mensaje y completar las variables que el sistema no puede rellenar solo. Por ejemplo: Referidos requiere la recompensa para quien refiere (ej: '10% en tu próxima visita'). Cumpleaños pide el regalo y un mensaje personalizado. Mantenimiento necesita el tratamiento y los días de retoque. Temporada y Liquidación permiten vincular productos específicos de inventario para la promo.",
  },
  {
    icon: CalendarIcon,
    title: "Programar el envío",
    description:
      "En el paso Programación defines cuándo y con qué frecuencia se envía la campaña. Las campañas de Bienvenida, Liquidación, Cumpleaños y Mantenimiento se envían automáticamente según su disparador — no necesitas configurar nada. Referidos: se envía N días después de que el paciente completa una cita (configurable, por defecto 14 días). Promos Mensuales: elige entre Una vez (solo manual), Semanal o Mensual, y define la hora de envío y el día. El sistema se encarga del resto.",
  },
  {
    icon: PencilSimpleIcon,
    title: "Editar una campaña activa",
    description:
      "Haz clic en el ícono de lápiz en la tarjeta de la campaña. El modal se abre con los datos actuales pre-rellenados. Puedes modificar el valor del descuento, la fecha de vigencia, las variables de plantilla (regalo, recompensa, etc.), los productos vinculados y la programación de envío. El código del cupón y el tipo de campaña no se pueden cambiar una vez creados. Guarda los cambios con el botón Guardar Cambios.",
  },
  {
    icon: PaperPlaneRightIcon,
    title: "Enviar una campaña ahora",
    description:
      "Haz clic en el ícono de avión de papel en la tarjeta. El sistema pedirá confirmación antes de enviar. Al confirmar, el backend obtiene todos los pacientes activos que tienen WhatsApp habilitado, personaliza el mensaje con los datos de cada uno (nombre, código, variables) y los envía de inmediato. Una notificación te indicará a cuántos pacientes se envió. Este botón funciona para cualquier tipo de campaña y es la única forma de enviar las campañas de tipo Una vez.",
  },
  {
    icon: PauseCircleIcon,
    title: "Pausar una campaña",
    description:
      "Haz clic en el ícono de tacho de basura en una tarjeta activa (verde). El sistema pedirá confirmación. Al pausar, la campaña deja de enviarse automáticamente, la tarjeta cambia a rojo y aparece como Finalizada. Los canjes ya registrados se conservan. Una campaña pausada no se puede reactivar desde la interfaz — si necesitas reactivarla, comunícate con el equipo técnico.",
  },
  {
    icon: TrashIcon,
    title: "Eliminar una campaña permanentemente",
    description:
      "Solo puedes eliminar campañas que ya estén pausadas (en rojo). Haz clic en el ícono de tacho en una tarjeta pausada. El sistema pedirá una segunda confirmación porque esta acción es irreversible: la campaña se borra definitivamente de la base de datos y no se puede recuperar. Si tienes dudas, pausa primero y elimina después cuando estés seguro.",
  },
  {
    icon: CopyIcon,
    title: "Copiar el código del cupón",
    description:
      "En la parte inferior de cada tarjeta hay un botón con el código del cupón. Al hacer clic, el código se copia automáticamente al portapapeles y el botón cambia a COPIADO con un check verde por 2 segundos. Puedes usar este código para compartirlo por otros canales: teléfono, WhatsApp directo, cartelería en clínica o redes sociales. Los pacientes lo ingresan en la sección Finanzas al momento de pagar su cita.",
  },
  {
    icon: TicketIcon,
    title: "Cómo se canjea un cupón",
    description:
      "El paciente recibe el código por WhatsApp. Al momento de pagar la cita (en la pestaña Finanzas del detalle de cita en Agenda), puede ver sus cupones disponibles en su wallet o ingresar el código manualmente. El sistema valida que el cupón esté activo, no haya vencido, no se haya agotado y que el paciente no haya superado su límite de usos. Si todo está en orden, el descuento se aplica automáticamente y se muestra el Total Final con el ahorro desglosado.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Permisos según tu rol",
    description:
      "Los roles ADMIN y MARKETING tienen acceso completo: pueden crear, editar, enviar, pausar y eliminar campañas. El rol RECEPCIÓN puede ver las estadísticas y el listado de campañas, pero no puede crear ni modificar nada. Los roles DOCTOR, ENFERMERÍA y FISIOTERAPIA no tienen acceso a la sección Marketing.",
  },
];
