import {
  SquaresFourIcon,
  WarningIcon,
  FirstAidKitIcon,
  ToteIcon,
  PlusCircleIcon,
  ListMagnifyingGlassIcon,
  PackageIcon,
  PencilSimpleIcon,
  FunnelIcon,
  TagIcon,
  ProhibitIcon,
  ArrowsClockwiseIcon,
} from "@phosphor-icons/react";

export const inventoryHelpMeta = {
  title: "Cómo usar Inventario",
  subtitle: "Guía paso a paso de la sección",
};

export const inventoryHelpSteps = [
  {
    icon: SquaresFourIcon,
    title: "Vista Hub — pantalla principal",
    description:
      "Al entrar a Inventario ves el Hub con dos módulos: Insumos Médicos (productos para uso clínico como toxinas, cremas e inyectables) y Productos Venta (artículos para comercialización directa al paciente). Cada módulo muestra cuántos registros activos tiene. Encima de los módulos aparece el panel de Alertas Urgentes con los productos que requieren atención inmediata. Haz clic en cualquier módulo para entrar y gestionar sus productos.",
  },
  {
    icon: WarningIcon,
    title: "Alertas urgentes de inventario",
    description:
      "El panel de alertas aparece automáticamente en el Hub cuando hay productos que necesitan atención. Stock Bajo (en rojo): el producto llegó o bajó del mínimo configurado — hay que reabastecerse. Próximo a Vencer (en ámbar): hay un lote que caduca en los próximos 30 días. Caducado (en rojo oscuro): un lote ya superó su fecha de vencimiento. Estas alertas también activan automáticamente cupones de Liquidación en el módulo Marketing cuando aplica.",
  },
  {
    icon: FirstAidKitIcon,
    title: "Módulo Insumos Médicos",
    description:
      "Contiene todos los productos que se consumen durante los procedimientos de la clínica: toxinas botulínicas, ácido hialurónico, anestésicos, cremas, sueros, ampolletas, etc. Cada insumo tiene seguimiento de lotes con número de lote y fecha de caducidad. El sistema descuenta stock automáticamente cuando una cita se marca como Completada, usando el método FEFO (primero los que vencen antes). Este módulo es el que se vincula directamente con los insumos registrados en las citas de la Agenda.",
  },
  {
    icon: ToteIcon,
    title: "Módulo Productos Venta (Retail)",
    description:
      "Contiene los productos que la clínica comercializa directamente al paciente: suplementos, cosméticos, kits de cuidado en casa, tratamientos tópicos, etc. Tienen las mismas funcionalidades que los insumos (lotes, alertas, categorías, QR) y también pueden vincularse a campañas de Marketing del tipo Temporada o Liquidación.",
  },
  {
    icon: PlusCircleIcon,
    title: "Agregar un nuevo producto",
    description:
      "Dentro de Insumos o Retail, haz clic en Nuevo Producto. El formulario tiene tres secciones. Datos Básicos: nombre (obligatorio), marca, categoría (obligatoria) y SKU interno — si lo dejas vacío se genera automáticamente a partir del nombre. Presentación: contenido neto con unidad (ml, pza, viales, mg, caja, amp), precio de venta y stock mínimo (la cantidad que activa la alerta roja). Ingreso Inicial (opcional): si ya tienes stock, ingresa la cantidad, el número de lote y la fecha de caducidad. Al guardar, el sistema genera un código QR descargable con el SKU del producto para identificación física en la clínica.",
  },
  {
    icon: ListMagnifyingGlassIcon,
    title: "Ver detalles de un producto",
    description:
      "Haz clic en cualquier tarjeta de producto para abrir el panel lateral derecho. Muestra: categoría, marca, SKU, presentación, stock actual, precio de venta, stock mínimo configurado y la fecha de caducidad del lote más próximo a vencer. Más abajo aparece el desglose de lotes activos con el número de lote, cantidad actual sobre la inicial, fecha de ingreso y fecha de caducidad de cada uno. También puedes descargar el QR del producto desde aquí. Desde este panel accedes a Editar, Ingresar Lote y Desactivar.",
  },
  {
    icon: PackageIcon,
    title: "Ingresar un nuevo lote de stock",
    description:
      "Cuando llega mercancía nueva para un producto ya existente, abre su panel de detalles y haz clic en Ingresar Lote. Ingresa la cantidad recibida, el número de lote del proveedor y la fecha de caducidad (todos obligatorios). Al guardar, la cantidad se suma automáticamente al stock total del producto. El sistema organiza los lotes por fecha de caducidad (FEFO) para que al consumir insumos en una cita siempre se descuenten primero los que vencen antes.",
  },
  {
    icon: PencilSimpleIcon,
    title: "Editar un producto existente",
    description:
      "Desde el panel de detalles del producto, haz clic en Editar. Puedes modificar: nombre, marca, categoría, presentación, precio de venta y stock mínimo. El SKU no se puede cambiar una vez creado porque es el identificador único del producto en el sistema y está grabado en el código QR. Los cambios se reflejan de inmediato en el catálogo.",
  },
  {
    icon: FunnelIcon,
    title: "Filtrar productos por categoría",
    description:
      "Dentro de Insumos o Retail, en la parte superior del listado aparecen botones de filtro con todas las categorías activas de ese módulo. Haz clic en una categoría para ver solo los productos de ese grupo. El botón Todos muestra el catálogo completo. Los filtros cambian en tiempo real sin recargar la página. En móvil, los botones se pueden deslizar horizontalmente si hay muchas categorías.",
  },
  {
    icon: TagIcon,
    title: "Gestionar categorías",
    description:
      "Solo el rol ADMIN puede crear y eliminar categorías. Haz clic en el botón Categorías (arriba a la derecha en Insumos o Retail). Para crear: escribe el nombre y confirma — se asocia automáticamente al módulo actual. Para eliminar: haz clic en el icono de tacho junto a la categoría. Asegúrate de que no tenga productos asignados antes de eliminar. Las categorías son independientes para cada módulo: las de Insumos no aparecen en Retail y viceversa.",
  },
  {
    icon: ProhibitIcon,
    title: "Desactivar un producto",
    description:
      "Desde el panel de detalles del producto, haz clic en Desactivar y confirma. El producto deja de aparecer en el catálogo activo y no se puede asignar a nuevas citas. Es una baja lógica (soft delete): los datos, lotes e historial de consumo se conservan para auditoría. Si necesitas reactivar un producto desactivado, contacta al equipo técnico.",
  },
  {
    icon: ArrowsClockwiseIcon,
    title: "Relación con citas y sistema FEFO",
    description:
      "Los insumos registrados en la pestaña Insumos de una cita (en Agenda) se descuentan automáticamente del inventario cuando la cita se marca como Completada. El sistema usa FEFO (First Expired, First Out): descuenta primero del lote con la fecha de caducidad más próxima, y si ese lote se agota continúa con el siguiente. Si el stock de algún insumo es insuficiente, el sistema bloquea el cambio de estado a Completada y muestra qué productos faltan, permitiéndote ingresar un lote antes de finalizar la cita.",
  },
];
