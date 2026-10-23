// ==========================================================
// ESTADOS DE PEDIDO
// Fuente única de las reglas de estado que usan las vistas
// del cliente y del bodeguero.
//
// Los nombres que se muestran ("Listo para despacho", etc.)
// vienen de la tabla estado_pedido. Aquí solo se definen
// qué estados ve cada vista y qué mensaje recibe el cliente.
// ==========================================================

import {
  ID_DESPACHO_COORDINAR,
  ID_RETIRO_TIENDA,
} from "../despacho/despacho";

export const ESTADO_PEDIDO = {
  PENDIENTE: 0,
  CONFIRMADO: 1,
  PREPARACION: 2,
  LISTO_DESPACHO: 3,
  LISTO_RETIRO: 4,
  FINALIZADO: 5,
  CONGELADO: 6,
  CANCELADO: 7,
  EXPIRADO: 8,
  REVISION_MANUAL: 9,
};

// Pagados y aún no preparados (el 2 es del flujo antiguo)
export const ESTADOS_PENDIENTES = [
  ESTADO_PEDIDO.CONFIRMADO,
  ESTADO_PEDIDO.PREPARACION,
];

// Preparados por bodega
export const ESTADOS_LISTOS = [
  ESTADO_PEDIDO.LISTO_DESPACHO,
  ESTADO_PEDIDO.LISTO_RETIRO,
];

// Entregados o retirados por el cliente
export const ESTADOS_FINALIZADOS = [ESTADO_PEDIDO.FINALIZADO];

// Lo que el cliente ve en "Mis pedidos".
// Quedan fuera: pagos no completados (0), cancelados (7),
// expirados (8) y otros estados internos.
export const ESTADOS_VISIBLES_CLIENTE = [
  ...ESTADOS_PENDIENTES,
  ...ESTADOS_LISTOS,
  ESTADO_PEDIDO.FINALIZADO,
];

export const MENSAJES_PEDIDO_LISTO = {
  retiro:
    "Tu pedido está listo. Puedes retirarlo en nuestro local de ventas.",
  despacho:
    "Tu pedido está listo. Ferreplast se pondrá en contacto contigo para coordinar la entrega.",
  coordinar:
    "Tu pedido está listo. Ferreplast se pondrá en contacto contigo para coordinar el envío a tu ciudad y su costo.",
};

export const MENSAJES_PEDIDO_FINALIZADO = {
  retiro: "Retiraste tu pedido. ¡Gracias por comprar en Ferreplast!",
  despacho: "Tu pedido fue entregado. ¡Gracias por comprar en Ferreplast!",
};

// ----------------------------------------------------------
// Lectura del pedido
// (funciona con los datos de la tabla y con los de las RPC)
// ----------------------------------------------------------

export function obtenerDespachoPedido(pedido) {
  if (Array.isArray(pedido?.despacho)) {
    return pedido.despacho[0] ?? null;
  }

  return pedido?.despacho ?? null;
}

function obtenerIdTipoDespacho(pedido) {
  const despacho = obtenerDespachoPedido(pedido);

  return Number(
    despacho?.id_tipo_despacho ??
      despacho?.tipo_despacho?.id_tipo_despacho,
  );
}

export function esRetiroTienda(pedido) {
  return obtenerIdTipoDespacho(pedido) === ID_RETIRO_TIENDA;
}

export function requiereCoordinacion(pedido) {
  const despacho = obtenerDespachoPedido(pedido);

  return (
    despacho?.requiere_coordinacion === true ||
    despacho?.tipo_despacho?.requiere_coordinacion === true ||
    obtenerIdTipoDespacho(pedido) === ID_DESPACHO_COORDINAR
  );
}

export function esPedidoPendiente(pedido) {
  return ESTADOS_PENDIENTES.includes(Number(pedido?.id_estado));
}

export function esPedidoListo(pedido) {
  return ESTADOS_LISTOS.includes(Number(pedido?.id_estado));
}

export function esPedidoFinalizado(pedido) {
  return ESTADOS_FINALIZADOS.includes(Number(pedido?.id_estado));
}

export function esVisibleParaCliente(pedido) {
  return ESTADOS_VISIBLES_CLIENTE.includes(Number(pedido?.id_estado));
}

export function obtenerNombreEstado(pedido) {
  return pedido?.estado_pedido?.nom_estado || "Pendiente";
}

// ----------------------------------------------------------
// Mensajes
// ----------------------------------------------------------

// Mensaje que recibe el cliente cuando el pedido esté listo,
// según su tipo de despacho. El bodeguero lo ve antes de confirmar.
export function obtenerMensajePedidoListo(pedido) {
  if (esRetiroTienda(pedido)) return MENSAJES_PEDIDO_LISTO.retiro;
  if (requiereCoordinacion(pedido)) return MENSAJES_PEDIDO_LISTO.coordinar;
  return MENSAJES_PEDIDO_LISTO.despacho;
}

// Mensaje que recibe el cliente cuando el pedido se finaliza
// (retiro en el local o entrega en su dirección).
export function obtenerMensajePedidoFinalizado(pedido) {
  return esRetiroTienda(pedido)
    ? MENSAJES_PEDIDO_FINALIZADO.retiro
    : MENSAJES_PEDIDO_FINALIZADO.despacho;
}

// Aviso para la vista del cliente: solo si el pedido ya está
// listo o finalizado.
export function obtenerAvisoCliente(pedido) {
  if (esPedidoFinalizado(pedido)) return obtenerMensajePedidoFinalizado(pedido);
  if (esPedidoListo(pedido)) return obtenerMensajePedidoListo(pedido);
  return null;
}