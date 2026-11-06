import { nombreComposicion } from "./reportesPresentacion";
// Configuración de los tres reportes comerciales. Sin dependencias de gráficos.
const col = (c, t, tipo, extra = {}) => ({ c, t, tipo, ...extra });
const ranking = (titulo, valor, formato = 'numero') => ({ tipo: 'ranking', titulo, etiqueta: 'etiqueta', valor, formato });
const conteo = (titulo, campo) => ({ tipo: 'conteo', titulo, campo });

export const VISTAS_COTIZACION = [
  ['seguimiento', 'Seguimiento'],
  ['catalogo', 'Del catálogo'],
  ['externos', 'Fuera del catálogo'],
  ['cierres', 'Cierres'],
];

export function reporteComercial(tipo, filtros) {
  if (tipo === 'productos') {
    const porUnidades = filtros.ordenProducto === 'unidades';
    return {
      titulo: 'Productos más vendidos',
      descripcion: 'Ranking independiente por monto o por unidades de cada presentación. Las ventas corresponden a pedidos con pago autorizado. Stock actual; no es stock histórico. Los indicadores abarcan todos los productos vendidos, salvo la participación del ranking.',
      funcion: 'reporte_productos_comercial_admin', comercial: true,
      columnasPrincipales: ['producto','presentacion','marca','unidades','monto','stock_actual'],
      filtros: ['ordenProducto', 'limiteComercial'],
      parametros: (f) => ({ p_orden: f.ordenProducto, p_limite: Number(f.limite) }),
      graficos: () => [ranking(porUnidades ? 'Top 10 por unidades de cada presentación' : 'Top 10 por monto vendido', porUnidades ? 'unidades' : 'monto', porUnidades ? 'numero' : 'moneda')],
      columnas: [col('id_prod','ID','numero'),col('producto','Producto'),col('presentacion','Presentación'),col('marca','Marca'),col('familia','Familia'),col('unidades','Unidades de la presentación','numero'),col('pedidos','Pedidos distintos','numero'),col('monto','Monto vendido','moneda',{total:true}),col('participacion','Participación por monto','porcentaje'),col('stock_actual','Stock actual','numero')],
    };
  }
  if (tipo === 'inventario') return {
    titulo: 'Inventario', comercial: true,
    descripcion: 'Existencias actuales y unidades vendidas en el período elegido. Se distinguen productos nuevos y no activos. La ausencia de ventas no demuestra obsolescencia; no se estiman costos ni cantidades de reposición.',
    columnasPrincipales: ['situacion','producto','presentacion','stock','vendidas_periodo'],
    funcion: 'reporte_stock_comercial_admin', parametros: () => ({}),
    graficos: () => [conteo('Productos por situación', 'situacion')],
    columnas: [col('situacion','Situación',undefined,{nivel:(f)=> f.situacion==='Stock negativo'?'alta':f.situacion==='Activo sin stock'?'media':'baja'}),col('id_prod','ID','numero'),col('producto','Producto'),col('presentacion','Presentación'),col('familia','Familia'),col('marca','Marca'),col('estado','Estado actual'),col('stock','Stock actual','numero'),col('vendidas_periodo','Vendidas en el período','numero'),col('creado_en','Alta del producto','fecha')],
  };
  if (tipo !== 'cotizaciones') return null;
  const vista = filtros.vistaCotizacion;
  const demanda = vista === 'catalogo' || vista === 'externos';
  const cierre = vista === 'cierres';
  const descripcion = demanda
    ? (vista === 'catalogo'
      ? 'Demanda de las solicitudes recibidas en el período, cualquiera sea su estado. Se cuentan cotizaciones y clientes distintos por producto; las cantidades no equivalen a ventas.'
      : 'Demanda externa de las solicitudes recibidas en el período, cualquiera sea su estado. Se agrupan nombre y marca ignorando solo mayúsculas y espacios. Las variantes originales permiten revisar coincidencias; no se deducen ventas ni unidades físicas equivalentes.')
    : cierre
      ? 'Resultados por fecha del último cambio a Exitosa o Fallida. Los cierres antiguos sin fecha de resolución no se incluyen; no se les asignan fechas estimadas. El estado corresponde a toda la cotización, no a cada producto.'
      : 'Estado actual de las solicitudes recibidas en el período, con los filtros seleccionados. Pendientes significa sin completar, no sin ningún contacto. Los días hasta emisión se calculan por fecha calendario. Los indicadores no cambian al filtrar texto dentro de la tabla.';
  return {
    titulo: VISTAS_COTIZACION.find(([id]) => id === vista)?.[1] ?? 'Cotizaciones',
    comercial: true, descripcion,
    columnasPrincipales: demanda ? ['producto','marca',...(vista==='catalogo'?['presentacion']:[]),'solicitudes','clientes','cantidad_solicitada'] : cierre ? ['folio','cliente','estado','fecha_resolucion','dias_hasta_cierre','total_bruto'] : ['folio','fecha_solicitud','cliente','estado','composicion','total_bruto'],
    funcion: 'reporte_cotizaciones_comercial_admin',
    filtros: ['vistaCotizacion', ...(demanda ? [] : ['estadoCotizacion','busqueda'])],
    parametros: (f, busqueda) => ({ p_vista:f.vistaCotizacion, p_id_estado:demanda?null:(f.estadoCotizacion===''?null:Number(f.estadoCotizacion)),p_folio:demanda?null:(busqueda||null) }),
    graficos: () => demanda ? [ranking('Productos por cantidad de solicitudes', 'solicitudes')]
      : cierre ? [{ ...conteo('Resultado de los cierres', 'estado'), vista:'anillo', categorias:['Exitosa','Fallida'] }]
      : [{ ...conteo('Estado de las cotizaciones','estado'), vista:'anillo', categorias:['Pendiente','Completada','Exitosa','Fallida'] },{ ...conteo('Origen de los productos','composicion'), vista:'anillo', categorias:['Solo del catálogo','Solo externos','Catálogo + externos'] }],
    columnas: demanda ? [
      ...(vista==='catalogo'?[col('id_prod','ID','numero')]:[]),
      col('producto','Producto solicitado'),col('marca','Marca'),
      ...(vista==='catalogo'?[col('presentacion','Presentación')]:[]),
      col('solicitudes','Cotizaciones distintas','numero'),col('clientes','Clientes distintos','numero'),col('cantidad_solicitada','Cantidad solicitada','numero'),
      ...(vista==='externos'?[col('variantes','Textos originales',undefined,{largo:true})]:[]),
    ] : [col('folio','Folio'),col('fecha_solicitud','Solicitud','fechahora'),col('cliente','Cliente'),col('estado','Estado actual'),col('composicion','Productos'),
      ...(cierre?[col('fecha_resolucion','Resolución','fechahora'),col('dias_hasta_cierre','Días hasta cierre','numero')]
        :[col('dias_pendiente','Días pendiente','numero'),col('fecha_emision','Emisión','fecha'),col('dias_hasta_emision','Días hasta emisión','numero'),col('fecha_validez','Válida hasta','fecha')]),
      col('total_bruto','Monto cotizado','moneda')],
  };
}

export function validarRespuestaComercial(data) {
  if (!data || !Array.isArray(data.datos) || !Array.isArray(data.indicadores)) {
    throw new Error('El reporte devolvió una estructura inesperada. Revisa la versión de las funciones comerciales.');
  }
  return { datos: data.datos.map((fila) => ({ ...fila, ...(fila.composicion != null ? { composicion: nombreComposicion(fila.composicion) } : {}) })), indicadores: data.indicadores };
}
