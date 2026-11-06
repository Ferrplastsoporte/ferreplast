// Definiciones contrastadas con el SQL compartido de los reportes y admin_kpis.
// Texto de ayuda: no participa en consultas ni cálculos.
const BASE_VENTAS = 'Se consideran los pedidos con un pago autorizado. Cada pedido se cuenta una vez: se toma el pago autorizado de mayor ID y su fecha de pago; si falta esa fecha, se usa la fecha de creación del pedido. El monto utilizado es el total del pedido, no la suma de intentos de pago.';

const GENERALES = [
  ['Total vendido', 'Suma de los totales de los pedidos considerados pagados en el período. No representa utilidad ni margen.'],
  ['Pedidos pagados', 'Cantidad de esos pedidos. Los pedidos creados que aparecen como contexto se cuentan por fecha de creación, aunque todavía no tengan pago; son conjuntos diferentes.'],
  ['Ticket promedio', 'Promedio del total de los pedidos considerados pagados. Si no hay pedidos, la función devuelve cero.'],
  ['Clientes que compraron', 'Usuarios distintos de los pedidos considerados pagados. Los clientes nuevos del contexto son cuentas de rol cliente registradas en el período, hayan comprado o no.'],
  ['Cotizaciones exitosas', 'Solicitudes creadas en el período cuyo estado actual es Exitosa. El porcentaje del resumen es exitosas / todas las solicitudes de ese período, incluidas las abiertas. El monto suma sus totales cotizados, no pagos cobrados.'],
  ['Pagos fallidos', 'Cantidad de registros de pago con estado final distinto de AUTORIZADO, por fecha de creación del pago. Cuenta intentos, no pedidos ni clientes; un pedido puede tener varios intentos.'],
];

const COMUNES = [
  'Las fechas se interpretan en America/Santiago. Se incluye todo el día Hasta.',
  'La búsqueda de la tabla filtra el detalle, no las tarjetas. Los gráficos de pantalla conservan el conjunto consultado; los exportados usan las filas filtradas.',
  'Las exportaciones incluyen todas las columnas y filas filtradas. El PDF muestra hasta 800 filas y conserva los totales del conjunto completo; sus distribuciones se representan como barras.',
];

const DETALLES = {
  ventas: {
    alcance: 'Detalle agrupado por día, semana o mes dentro de las fechas seleccionadas.',
    definiciones: [
      ['Total vendido', 'Suma de totales de pedidos considerados pagados, agrupados por la fecha usada para el pago. Los intervalos sin ventas aparecen en cero.'],
      ['Pedidos, unidades y documentos', 'Cantidad de pedidos, suma de cantidades de sus líneas y clasificación de cada pedido como boleta o factura. La clasificación no confirma que el documento tributario haya sido emitido.'],
      ['Clientes y ticket', 'Clientes distintos y promedio por pedido dentro de cada intervalo. Los clientes de distintos intervalos no deben sumarse como clientes únicos del período.'],
    ],
    notas: ['Las semanas y meses de los extremos pueden ser parciales: solo incluyen las fechas seleccionadas.'],
  },
  categorias: {
    alcance: 'Productos de pedidos considerados pagados, agrupados por familia, subcategoría o marca actual.',
    definiciones: [
      ['Monto y participación', 'Cantidad × precio unitario guardado en cada línea. La participación divide el monto del grupo entre el monto de todos los grupos.'],
      ['Productos y pedidos', 'Productos y pedidos distintos por grupo. Un pedido con productos de varios grupos se cuenta en cada uno; no se deben sumar esos conteos como pedidos únicos.'],
    ],
    notas: ['La clasificación del producto es la actual, no una fotografía de su familia o marca al venderse.'],
  },
  clientes: {
    alcance: 'Usuarios que compraron o solicitaron cotizaciones en el período, y cuentas nuevas de rol cliente.',
    definiciones: [
      ['Compras', 'Pedidos considerados pagados, total comprado y ticket promedio por usuario dentro del período.'],
      ['Última compra', 'Fecha más reciente de los pedidos considerados pagados dentro del período seleccionado; no necesariamente la última compra histórica.'],
      ['Cotizaciones y Nuevo', 'Solicitudes por fecha de creación. Nuevo indica que la cuenta se registró en el período, no que hizo su primera compra.'],
    ],
    notas: [],
  },
  pedidos: {
    alcance: 'Pedidos por fecha de creación, con los filtros de estado, despacho y búsqueda seleccionados.',
    definiciones: [
      ['Total y unidades', 'Total del pedido y suma de cantidades de sus líneas. El total de esta tabla incluye los pedidos no pagados que coincidan con los filtros.'],
      ['Pago mostrado', 'Se prioriza un pago autorizado; si no lo hay, se muestra el último intento. Si hay varios autorizados, se priorizan fecha de creación e ID del pago.'],
      ['Despacho y ERP', 'Se muestra el tipo del despacho de mayor ID y la marca actual de registro en ERP. No se calculan tiempos ni costos de despacho.'],
    ],
    notas: ['Estas fechas y filtros del detalle no cambian las tarjetas generales superiores.'],
  },
  pagos: {
    alcance: 'Registros de pago por fecha de pago; si falta, se usa su fecha de creación. Se aplican los filtros de estado, método y búsqueda.',
    definiciones: [
      ['Monto', 'Monto de cada intento, autorizado, pendiente o rechazado según los filtros. Sumar todos los estados no equivale a dinero recaudado.'],
      ['Diferencia', 'Monto del intento menos total del pedido. Una diferencia en un intento no autorizado no demuestra un cobro incorrecto.'],
      ['Gráficos', 'Suman los montos de las filas por estado o método, no la cantidad de pedidos únicos.'],
    ],
    notas: ['El detalle usa fecha de pago o creación; la tarjeta general de pagos fallidos usa solo fecha de creación y estados finales no autorizados.'],
  },
  alertas: {
    alcance: 'Combina incidencias del período con problemas actuales. El contador indica filas de alerta, no pedidos únicos.',
    definiciones: [
      ['Pedidos y pagos', 'Se revisan los pedidos creados en el período y sus pagos: autorizaciones duplicadas, diferencias, factura sin datos y líneas inválidas.'],
      ['Plazos', 'Pago sin estado final tras más de una hora; pedido pagado no registrado en ERP tras más de 24 horas desde la creación del pedido; cotización pendiente creada en el período con más de dos días calendario.'],
      ['Problemas actuales', 'Stock negativo, productos activos con stock cero y cambios de productos sin revisar no dependen del rango de fechas. Los cambios sin revisar se agrupan en una fila.'],
    ],
    notas: ['Un pedido puede generar varias alertas. La columna Monto cambia de significado según el tipo: suma autorizada, diferencia o total de referencia; no se debe sumar como pérdida económica.'],
  },
};

export function ayudaReporte(tipo, vista) {
  let ayuda;
  if (tipo === 'productos') ayuda = {
    alcance: 'Ventas de productos en las fechas seleccionadas, con stock y presentación actuales.',
    definiciones: [
      ['Productos vendidos', 'Grupos por ID de producto con líneas en pedidos considerados pagados.'],
      ['Monto vendido', 'Suma de cantidad × precio unitario de todas esas líneas; puede diferir del total de pedidos.'],
      ['Vendidos sin stock actual', 'Productos vendidos en el período cuyo stock actual es cero o negativo. No indica qué stock tenían cuando se vendieron.'],
      ['Participación del ranking', 'Monto de los productos del top seleccionado dividido entre el monto de todos los productos vendidos. Siempre se calcula por monto, aunque el ranking se ordene por unidades.'],
    ],
    notas: [BASE_VENTAS, 'El ranking se selecciona de forma independiente por monto o unidades. Los indicadores consideran todos los productos vendidos, excepto la participación del ranking. Los totales de la tabla solo abarcan el top mostrado.', 'Las cantidades corresponden a cada presentación; no se suman como litros, kilos u otras unidades físicas equivalentes.'],
  };
  else if (tipo === 'inventario') ayuda = {
    alcance: 'Stock actual de todos los productos y ventas del período elegido. No es un inventario histórico a la fecha Hasta.',
    definiciones: [
      ['Productos revisados', 'Todos los productos registrados, incluidos los no activos.'],
      ['Activos agotados', 'Productos activos en catálogo con stock exactamente cero. Los stocks negativos se cuentan por separado.'],
      ['Stock negativo', 'Todos los productos con stock menor que cero, sean activos o no.'],
      ['Con stock sin ventas', 'Productos activos con stock positivo, creados antes del período y sin ventas en el rango. Se distinguen los nuevos, posteriores al rango y de antigüedad desconocida.'],
      ['Vendidas en el período', 'Suma de cantidades por producto en pedidos considerados pagados. La tabla clasifica primero stock negativo, luego activo agotado y después el resto de situaciones.'],
    ],
    notas: [BASE_VENTAS, 'No tener ventas no implica obsolescencia. No se calcula costo del inventario, stock mínimo ni recomendación automática de reposición.'],
  };
  else if (tipo === 'cotizaciones') {
    if (vista === 'cierres') ayuda = {
      alcance: 'Cotizaciones actualmente Exitosas o Fallidas cuya fecha de resolución está dentro del período y coincide con los filtros.',
      definiciones: [
        ['Cierres registrados', 'Cantidad de cotizaciones con un resultado y fecha de resolución dentro del rango.'],
        ['Exitosas y Fallidas', 'Conteos según el resultado actual de la cotización completa; no confirman el resultado individual de cada producto ni un cobro.'],
        ['Días promedio hasta cierre', 'Promedio de la diferencia entre solicitud y resolución, en días de 24 horas. Se excluyen duraciones negativas.'],
      ],
      notas: ['Los cierres antiguos sin fecha de resolución no se incluyen. Cambiar el resultado actualiza la fecha y puede mover la cotización a otro período; esta columna no es un historial de todos sus resultados.'],
    };
    else if (vista === 'catalogo' || vista === 'externos') ayuda = {
      alcance: 'Demanda de las solicitudes creadas en el período, cualquiera sea su estado. Solo se incluyen las líneas del tipo elegido: catálogo o externas.',
      definiciones: [
        ['Solicitudes y clientes', 'Cotizaciones y usuarios distintos con al menos una línea de ese tipo. Repetir un producto en la misma solicitud no duplica los conteos.'],
        ['Productos solicitados', vista === 'catalogo' ? 'Productos agrupados por ID del catálogo, con nombre, marca y presentación actuales.' : 'Grupos de nombre + marca escritos por el cliente. Solo se normalizan mayúsculas y espacios; medidas, acentos y marcas diferentes permanecen separados.'],
        ['Demanda recurrente', 'Grupos de productos solicitados por al menos dos clientes distintos. No basta con que un mismo cliente los pida varias veces.'],
        ['Cantidad solicitada', 'Suma de cantidades de las líneas, incluidas las repetidas. No representa unidades vendidas ni una cantidad física comparable entre productos externos.'],
      ],
      notas: ['La cotización puede ser mixta: aporta líneas al reporte del catálogo y al externo, pero sigue siendo una sola solicitud. No se deben sumar ambos conteos como solicitudes únicas.', 'Los gráficos muestran hasta diez productos por frecuencia de solicitudes. No se atribuye el éxito de toda una cotización a cada producto.'],
    };
    else ayuda = {
      alcance: 'Solicitudes creadas en el período, con su estado actual y los filtros de estado y búsqueda seleccionados.',
      definiciones: [
        ['Solicitudes recibidas', 'Cantidad de cotizaciones que cumplen esas fechas y filtros. No cuenta líneas de productos.'],
        ['Por completar', 'Cotizaciones cuyo estado actual es Pendiente. No significa que nunca se haya contactado al cliente.'],
        ['Con productos externos', 'Solicitudes con al menos una línea fuera del catálogo; incluye las que combinan catálogo y externos.'],
        ['Exitosas', 'Cantidad con estado actual Exitosa. El contexto divide exitosas entre exitosas + fallidas; si no hay resueltas, no se calcula un porcentaje. Las pendientes y completadas quedan fuera del denominador.'],
        ['Origen de los productos', 'Solo del catálogo, Solo externos o Catálogo + externos según las líneas de cada solicitud. Sin líneas, si aparece, es una categoría adicional.'],
        ['Fechas del detalle', 'Días pendiente usa días calendario desde la solicitud hasta hoy. Días hasta emisión usa la fecha calendario de emisión, sin precisión horaria; no mide primera respuesta.'],
      ],
      notas: ['Exitosa y Fallida son resultados de toda la cotización, no ventas cobradas. Completada es un estado distinto de Exitosa.', 'Este porcentaje entre resueltas es diferente del resumen general de otras pestañas, que divide exitosas entre todas las solicitudes.'],
    };
  }
  else ayuda = DETALLES[tipo];
  if (!ayuda) return { alcance: '', tarjetas: [], definiciones: [], notas: COMUNES };
  const general = !['productos','inventario','cotizaciones'].includes(tipo);
  return {
    ...ayuda,
    tarjetas: general ? GENERALES : [],
    notas: [
      ...(general ? [BASE_VENTAS, 'Las tarjetas generales solo dependen de las fechas, no de los filtros del detalle. La variación compara con el período inmediatamente anterior de igual cantidad de días, no necesariamente el mes anterior.'] : []),
      ...ayuda.notas,
      ...COMUNES,
    ],
  };
}
