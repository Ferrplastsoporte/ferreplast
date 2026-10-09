import { useEffect, useState } from "react";

import { supabase } from "../../lib/supabase";

import BodegueroHeader from "./components/BodegueroHeader";

import "./css/pedidos-bodeguero.css";

const ESTADO_CONFIRMADO = 1;

const ESTADO_PREPARACION = 2;

const ESTADO_DESPACHADO = 3;

function Pedidos() {

  const [pedidos, setPedidos] = useState([]);

  const [pestana, setPestana] = useState("preparar");

  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);

  const [cargando, setCargando] = useState(true);

  const [procesando, setProcesando] = useState(null);

  const [error, setError] = useState("");

  // ==========================================

  // ESTADOS DEL MODAL DE DESPACHO

  // ==========================================

  const [mostrarModalDespacho, setMostrarModalDespacho] =

    useState(false);

  const [transportista, setTransportista] = useState("");

  const [numSeguimiento, setNumSeguimiento] = useState("");

  const [fechaDespacho, setFechaDespacho] = useState(

    new Date().toISOString().split("T")[0]

  );

  const [errorDespacho, setErrorDespacho] = useState("");

  const [guardandoDatosDespacho, setGuardandoDatosDespacho] = useState(false);
  const [errorEditarDespacho, setErrorEditarDespacho] = useState("");

  // ==========================================

  // CARGAR PEDIDOS

  // ==========================================

  useEffect(() => {

    cargarPedidos();

  }, []);

  async function cargarPedidos() {

    try {

      setCargando(true);

      setError("");

      const { data, error: errorPedidos } = await supabase

        .from("pedido")

        .select(`

          id_pedido,

          fecha_predido,

          total_pedido,

          id_estado,

          es_factura,

          usuario:id_user (

            id_user,

            nom_user,

            phone_user,

            direc_user

          ),

          detalle_pedido (

            id_detalle,

            id_prod,

            cantidad,

            precio_unitario,

            nom_prod

          ),

          despacho (

            id_despacho,

            transportista,

            num_seguimiento,

            fecha_despacho,

            direccion_despacho,

            comuna_despacho,

            costo_envio,

            id_tipo_despacho,

            tipo_despacho:id_tipo_despacho (

              id_tipo_despacho,

              nom_tipo_despacho,

              costo,

              requiere_coordinacion

            )

          )

        `)

        .in("id_estado", [

          ESTADO_CONFIRMADO,

          ESTADO_PREPARACION,

          ESTADO_DESPACHADO,

        ])

        .order("fecha_predido", {

          ascending: false,

        });

      if (errorPedidos) {

        throw errorPedidos;

      }

      setPedidos(data || []);

    } catch (error) {

      console.error("Error al cargar pedidos:", error);

      setError(

        error.message ||

          "No fue posible cargar los pedidos."

      );

    } finally {

      setCargando(false);

    }

  }

  // ==========================================

  // CAMBIAR ESTADO

  // ==========================================

  async function cambiarEstado(idPedido, nuevoEstado) {

    try {

      setProcesando(idPedido);

      setError("");

      const { error: errorActualizacion } =

        await supabase.rpc(

          "cambiar_estado_pedido_bodeguero",

          {

            p_id_pedido: idPedido,

            p_nuevo_estado: nuevoEstado,

          }

        );

      if (errorActualizacion) {

        throw errorActualizacion;

      }

      setPedidoSeleccionado(null);

      await cargarPedidos();

    } catch (error) {

      console.error(

        "Error al actualizar pedido:",

        error

      );

      setError(

        error.message ||

          "No fue posible actualizar el estado del pedido."

      );

    } finally {

      setProcesando(null);

    }

  }

  // ==========================================

  // ABRIR MODAL DE DESPACHO

  // ==========================================

  function abrirModalDespacho(pedido) {

    setPedidoSeleccionado(pedido);

    const despacho = pedido.despacho?.[0];

    setTransportista(

      despacho?.transportista || ""

    );

    setNumSeguimiento(

      despacho?.num_seguimiento || ""

    );

    setFechaDespacho(
      despacho?.fecha_despacho
        ? despacho.fecha_despacho.slice(0, 10)
        : new Date().toISOString().split("T")[0]
    );

    setErrorDespacho("");

    setMostrarModalDespacho(true);

  }

  // ==========================================

  // CERRAR MODAL DE DESPACHO

  // ==========================================

  function cerrarModalDespacho() {

    if (procesando) return;

    setMostrarModalDespacho(false);

    setErrorDespacho("");

  }

  // ==========================================

  // REGISTRAR DESPACHO

  // ==========================================

  async function registrarDespacho() {

    if (!pedidoSeleccionado) {

      return;

    }

    if (!transportista.trim()) {

      setErrorDespacho(

        "Debes ingresar un transportista."

      );

      return;

    }

    if (!fechaDespacho) {

      setErrorDespacho(

        "Debes seleccionar una fecha de despacho."

      );

      return;

    }

    try {

      setProcesando(

        pedidoSeleccionado.id_pedido

      );

      setErrorDespacho("");

      const {

        error: errorRegistro,

      } = await supabase.rpc(

        "registrar_despacho_bodeguero",

        {

          p_id_pedido:

            pedidoSeleccionado.id_pedido,

          p_transportista:

            transportista.trim(),

          p_num_seguimiento:

            numSeguimiento.trim() || null,

          p_fecha_despacho:

            fechaDespacho,

        }

      );

      if (errorRegistro) {

        throw errorRegistro;

      }

      // Cerrar modal

      setMostrarModalDespacho(false);

      // Cerrar detalle

      setPedidoSeleccionado(null);

      // Limpiar formulario

      setTransportista("");

      setNumSeguimiento("");

      setFechaDespacho(

        new Date().toISOString().split("T")[0]

      );

      // Recargar pedidos

      await cargarPedidos();

    } catch (error) {

      console.error(

        "Error al registrar despacho:",

        error

      );

      setErrorDespacho(

        error.message ||

          "No fue posible registrar el despacho."

      );

    } finally {

      setProcesando(null);

    }

  }

  // ==========================================

  // FILTROS

  // ==========================================

  const pedidosPreparar = pedidos.filter(

    (pedido) =>

      pedido.id_estado === ESTADO_CONFIRMADO ||

      pedido.id_estado === ESTADO_PREPARACION

  );

  const pedidosEnviados = pedidos.filter(

    (pedido) =>

      pedido.id_estado === ESTADO_DESPACHADO

  );

  const pedidosMostrar =

    pestana === "preparar"

      ? pedidosPreparar

      : pedidosEnviados;

  const pedidosConfirmados = pedidos.filter(

    (pedido) =>

      pedido.id_estado === ESTADO_CONFIRMADO

  );

  const pedidosEnPreparacion = pedidos.filter(

    (pedido) =>

      pedido.id_estado === ESTADO_PREPARACION

  );

  // ==========================================

  // FORMATEAR FECHA

  // ==========================================

  function formatearFecha(fecha) {

    if (!fecha) {

      return "Sin fecha";

    }

    return new Date(fecha).toLocaleDateString(

      "es-CL",

      {

        day: "2-digit",

        month: "2-digit",

        year: "numeric",

      }

    );

  }

  // ==========================================

  // FORMATEAR FECHA Y HORA

  // ==========================================

  function formatearFechaHora(fecha) {

    if (!fecha) {

      return "Sin fecha";

    }

    return new Date(fecha).toLocaleString(

      "es-CL",

      {

        day: "2-digit",

        month: "2-digit",

        year: "numeric",

        hour: "2-digit",

        minute: "2-digit",

      }

    );

  }

  // ==========================================

  // FORMATEAR PRECIO

  // ==========================================

  function formatearPrecio(valor) {

    return Number(valor || 0).toLocaleString(

      "es-CL",

      {

        style: "currency",

        currency: "CLP",

        maximumFractionDigits: 0,

      }

    );

  }

  // ==========================================

  // OBTENER DESPACHO

  // ==========================================

  function obtenerDespacho(pedido) {

    return pedido?.despacho?.[0] || null;

  }

  // ==========================================

  // OBTENER TIPO DE DESPACHO

  // ==========================================

  function obtenerTipoDespacho(pedido) {

    const despacho = obtenerDespacho(pedido);

    return (

      despacho?.tipo_despacho

        ?.nom_tipo_despacho ||

      "No informado"

    );

  }

  // ==========================================

  // OBTENER NOMBRE DEL ESTADO

  // ==========================================

  function obtenerNombreEstado(idEstado) {

    if (idEstado === ESTADO_CONFIRMADO) {

      return "Confirmado";

    }

    if (idEstado === ESTADO_PREPARACION) {

      return "En preparación";

    }

    if (idEstado === ESTADO_DESPACHADO) {

      return "Despachado";

    }

    return "Desconocido";

  }

  // ==========================================

  // CLASE DEL ESTADO

  // ==========================================

  function obtenerClaseEstado(idEstado) {

    if (idEstado === ESTADO_DESPACHADO) {

      return "pedido-bodeguero-card__estado pedido-bodeguero-card__estado--enviado";

    }

    if (idEstado === ESTADO_PREPARACION) {

      return "pedido-bodeguero-card__estado pedido-bodeguero-card__estado--preparacion";

    }

    return "pedido-bodeguero-card__estado";

  }

  // ==========================================

  // CANTIDAD DE PRODUCTOS

  // ==========================================

  function obtenerCantidadProductos(pedido) {

    return pedido.detalle_pedido?.length || 0;

  }

  // ==========================================

  // CANTIDAD DE UNIDADES

  // ==========================================

  function obtenerCantidadUnidades(pedido) {

    return (

      pedido.detalle_pedido?.reduce(

        (total, detalle) =>

          total +

          Number(detalle.cantidad || 0),

        0

      ) || 0

    );

  }

  // ==========================================

  // ABRIR DETALLE

  // ==========================================

  function abrirDetalle(pedido) {
    setPedidoSeleccionado(pedido);

    const despacho = obtenerDespacho(pedido);
    setTransportista(despacho?.transportista || "");
    setNumSeguimiento(despacho?.num_seguimiento || "");
    setFechaDespacho(
      despacho?.fecha_despacho
        ? despacho.fecha_despacho.slice(0, 10)
        : ""
    );
    setErrorEditarDespacho("");
  }

  async function actualizarDatosDespacho() {
    const despacho = obtenerDespacho(pedidoSeleccionado);

    if (!despacho?.id_despacho) {
      setErrorEditarDespacho("No se encontró el registro de despacho de este pedido.");
      return;
    }

    if (!transportista.trim()) {
      setErrorEditarDespacho("Debes ingresar un transportista.");
      return;
    }

    if (!fechaDespacho) {
      setErrorEditarDespacho("Debes seleccionar una fecha de despacho.");
      return;
    }

    try {
      setGuardandoDatosDespacho(true);
      setErrorEditarDespacho("");

      const { error: errorActualizacion } = await supabase.rpc(
        "actualizar_datos_despacho_bodeguero",
        {
          p_id_despacho: despacho.id_despacho,
          p_transportista: transportista.trim(),
          p_num_seguimiento: numSeguimiento.trim() || null,
          p_fecha_despacho: fechaDespacho,
        }
      );

      if (errorActualizacion) throw errorActualizacion;

      const datosActualizados = {
        transportista: transportista.trim(),
        num_seguimiento: numSeguimiento.trim() || null,
        fecha_despacho: fechaDespacho,
      };

      // Reflejar los cambios en el listado sin cambiar el estado del pedido.
      setPedidos((actuales) => actuales.map((pedido) => {
        if (pedido.id_pedido !== pedidoSeleccionado.id_pedido) return pedido;
        return {
          ...pedido,
          despacho: (pedido.despacho || []).map((item) =>
            item.id_despacho === despacho.id_despacho
              ? { ...item, ...datosActualizados }
              : item
          ),
        };
      }));

      setPedidoSeleccionado((actual) => {
        if (!actual) return actual;
        return {
          ...actual,
          despacho: (actual.despacho || []).map((item) =>
            item.id_despacho === despacho.id_despacho
              ? { ...item, ...datosActualizados }
              : item
          ),
        };
      });

      setErrorEditarDespacho("");
    } catch (error) {
      console.error("Error al actualizar despacho:", error);
      setErrorEditarDespacho(
        error.message || "No fue posible guardar los cambios."
      );
    } finally {
      setGuardandoDatosDespacho(false);
    }
  }

  // CERRAR DETALLE

  // ==========================================

  function cerrarDetalle() {

    if (!procesando) {

      setPedidoSeleccionado(null);

    }

  }

  return (

    <div className="pedidos-bodeguero">

      <BodegueroHeader

        titulo="Pedidos"

        descripcion="Gestiona los pedidos pendientes de preparación y los pedidos enviados."

      />

      <section className="pedidos-bodeguero__content">

        {/* =====================================

            RESUMEN

        ====================================== */}

        <div className="pedidos-bodeguero__resumen">

          <div className="pedidos-bodeguero__resumen-card pedidos-bodeguero__resumen-card--pendiente">

            <span>🟠</span>

            <div>

              <strong>

                {pedidosConfirmados.length}

              </strong>

              <p>Por preparar</p>

            </div>

          </div>

          <div className="pedidos-bodeguero__resumen-card pedidos-bodeguero__resumen-card--preparacion">

            <span>🔵</span>

            <div>

              <strong>

                {pedidosEnPreparacion.length}

              </strong>

              <p>En preparación</p>

            </div>

          </div>

          <div className="pedidos-bodeguero__resumen-card pedidos-bodeguero__resumen-card--enviado">

            <span>🟢</span>

            <div>

              <strong>

                {pedidosEnviados.length}

              </strong>

              <p>Enviados</p>

            </div>

          </div>

          <div className="pedidos-bodeguero__resumen-card">

            <span>📦</span>

            <div>

              <strong>

                {pedidos.length}

              </strong>

              <p>Total</p>

            </div>

          </div>

        </div>

        {/* =====================================

            PESTAÑAS

        ====================================== */}

        <div className="pedidos-bodeguero__tabs">

          <button

            type="button"

            className={

              pestana === "preparar"

                ? "pedidos-bodeguero__tab pedidos-bodeguero__tab--active"

                : "pedidos-bodeguero__tab"

            }

            onClick={() =>

              setPestana("preparar")

            }

          >

            🟠 A preparar

            <span>

              {pedidosPreparar.length}

            </span>

          </button>

          <button

            type="button"

            className={

              pestana === "enviados"

                ? "pedidos-bodeguero__tab pedidos-bodeguero__tab--active"

                : "pedidos-bodeguero__tab"

            }

            onClick={() =>

              setPestana("enviados")

            }

          >

            🟢 Hechos y enviados

            <span>

              {pedidosEnviados.length}

            </span>

          </button>

        </div>

        {/* =====================================

            ERROR GENERAL

        ====================================== */}

        {error && (

          <div

            className="pedidos-bodeguero__error"

            role="alert"

          >

            {error}

          </div>

        )}

        {/* =====================================

            LISTADO

        ====================================== */}

        {cargando ? (

          <div className="pedidos-bodeguero__empty">

            <strong>

              Cargando pedidos...

            </strong>

          </div>

        ) : pedidosMostrar.length === 0 ? (

          <div className="pedidos-bodeguero__empty">

            <strong>

              {pestana === "preparar"

                ? "No hay pedidos por preparar"

                : "No hay pedidos enviados"}

            </strong>

            <p>

              {pestana === "preparar"

                ? "Cuando llegue un pedido confirmado aparecerá aquí."

                : "Los pedidos despachados aparecerán aquí."}

            </p>

          </div>

        ) : (

          <div className="pedidos-bodeguero__lista">

            {pedidosMostrar.map((pedido) => {

              const despacho =

                obtenerDespacho(pedido);

              return (

                <article

                  key={pedido.id_pedido}

                  className="pedido-bodeguero-card"

                >

                  {/* CABECERA */}

                  <div className="pedido-bodeguero-card__header">

                    <div>

                      <span className="pedido-bodeguero-card__label">

                        PEDIDO

                      </span>

                      <h2>

                        #{pedido.id_pedido}

                      </h2>

                      <span className="pedido-bodeguero-card__fecha">

                        {formatearFechaHora(

                          pedido.fecha_predido

                        )}

                      </span>

                    </div>

                    <span

                      className={obtenerClaseEstado(

                        pedido.id_estado

                      )}

                    >

                      {obtenerNombreEstado(

                        pedido.id_estado

                      )}

                    </span>

                  </div>

                  {/* PROGRESO */}

                  <div className="pedido-bodeguero-card__progreso">

                    <div className="pedido-bodeguero-card__paso pedido-bodeguero-card__paso--activo">

                      <span>✓</span>

                      <small>Confirmado</small>

                    </div>

                    <div

                      className={

                        pedido.id_estado >=

                        ESTADO_PREPARACION

                          ? "pedido-bodeguero-card__linea pedido-bodeguero-card__linea--activa"

                          : "pedido-bodeguero-card__linea"

                      }

                    />

                    <div

                      className={

                        pedido.id_estado >=

                        ESTADO_PREPARACION

                          ? "pedido-bodeguero-card__paso pedido-bodeguero-card__paso--activo"

                          : "pedido-bodeguero-card__paso"

                      }

                    >

                      <span>

                        {pedido.id_estado >=

                        ESTADO_PREPARACION

                          ? "✓"

                          : "2"}

                      </span>

                      <small>

                        Preparación

                      </small>

                    </div>

                    <div

                      className={

                        pedido.id_estado >=

                        ESTADO_DESPACHADO

                          ? "pedido-bodeguero-card__linea pedido-bodeguero-card__linea--activa"

                          : "pedido-bodeguero-card__linea"

                      }

                    />

                    <div

                      className={

                        pedido.id_estado >=

                        ESTADO_DESPACHADO

                          ? "pedido-bodeguero-card__paso pedido-bodeguero-card__paso--activo"

                          : "pedido-bodeguero-card__paso"

                      }

                    >

                      <span>

                        {pedido.id_estado >=

                        ESTADO_DESPACHADO

                          ? "✓"

                          : "3"}

                      </span>

                      <small>Enviado</small>

                    </div>

                  </div>

                  {/* INFORMACIÓN RESUMIDA */}

                  <div className="pedido-bodeguero-card__resumen">

                    <div>

                      <span>👤 Cliente</span>

                      <strong>

                        {pedido.usuario?.nom_user ||

                          "Cliente sin nombre"}

                      </strong>

                    </div>

                    <div>

                      <span>📦 Productos</span>

                      <strong>

                        {obtenerCantidadProductos(

                          pedido

                        )}{" "}

                        productos ·{" "}

                        {obtenerCantidadUnidades(

                          pedido

                        )}{" "}

                        unidades

                      </strong>

                    </div>

                    <div>

                      <span>🚚 Tipo de despacho</span>

                      <strong>

                        {obtenerTipoDespacho(

                          pedido

                        )}

                      </strong>

                    </div>

                    <div>

                      <span>📍 Comuna</span>

                      <strong>

                        {despacho?.comuna_despacho ||

                          "No informada"}

                      </strong>

                    </div>

                    <div>

                      <span>💰 Total</span>

                      <strong>

                        {formatearPrecio(

                          pedido.total_pedido

                        )}

                      </strong>

                    </div>

                  </div>

                  {/* ACCIONES */}

                  <div className="pedido-bodeguero-card__footer">

                    <button

                      type="button"

                      className="pedido-bodeguero-card__boton-detalle"

                      onClick={() =>

                        abrirDetalle(pedido)

                      }

                    >

                      Ver pedido

                    </button>

                    {pedido.id_estado ===

                      ESTADO_CONFIRMADO && (

                      <button

                        type="button"

                        className="pedido-bodeguero-card__boton-principal"

                        disabled={

                          procesando ===

                          pedido.id_pedido

                        }

                        onClick={() =>

                          cambiarEstado(

                            pedido.id_pedido,

                            ESTADO_PREPARACION

                          )

                        }

                      >

                        {procesando ===

                        pedido.id_pedido

                          ? "Actualizando..."

                          : "Comenzar preparación"}

                      </button>

                    )}

                    {pedido.id_estado ===

                      ESTADO_PREPARACION && (

                      <button

                        type="button"

                        className="pedido-bodeguero-card__boton-principal"

                        disabled={

                          procesando ===

                          pedido.id_pedido

                        }

                        onClick={() =>

                          abrirModalDespacho(pedido)

                        }

                      >

                        Marcar como enviado

                      </button>

                    )}

                    {pedido.id_estado ===

                      ESTADO_DESPACHADO && (

                      <span className="pedido-bodeguero-card__completado">

                        ✓ Pedido enviado

                      </span>

                    )}

                  </div>

                </article>

              );

            })}

          </div>

        )}

      </section>

      {/* =====================================

          MODAL DE DETALLE

      ====================================== */}

      {pedidoSeleccionado &&

        !mostrarModalDespacho && (

        <div

          className="pedido-bodeguero-modal"

          onMouseDown={(event) => {

            if (

              event.target ===

              event.currentTarget

            ) {

              cerrarDetalle();

            }

          }}

        >

          <div className="pedido-bodeguero-modal__contenido">

            <div className="pedido-bodeguero-modal__header">

              <div>

                <span>PEDIDO</span>

                <h2>

                  #{pedidoSeleccionado.id_pedido}

                </h2>

                <p>

                  {formatearFechaHora(

                    pedidoSeleccionado.fecha_predido

                  )}

                </p>

              </div>

              <div>

                <span

                  className={obtenerClaseEstado(

                    pedidoSeleccionado.id_estado

                  )}

                >

                  {obtenerNombreEstado(

                    pedidoSeleccionado.id_estado

                  )}

                </span>

                <button

                  type="button"

                  className="pedido-bodeguero-modal__cerrar"

                  onClick={cerrarDetalle}

                >

                  ×

                </button>

              </div>

            </div>

            {/* CLIENTE */}

            <section className="pedido-bodeguero-modal__seccion">

              <h3>

                👤 Información del cliente

              </h3>

              <div className="pedido-bodeguero-modal__grid">

                <div>

                  <span>Nombre</span>

                  <strong>

                    {pedidoSeleccionado

                      .usuario?.nom_user ||

                      "No informado"}

                  </strong>

                </div>

                <div>

                  <span>Teléfono</span>

                  <strong>

                    {pedidoSeleccionado

                      .usuario?.phone_user ||

                      "No informado"}

                  </strong>

                </div>

              </div>

            </section>

            {/* DESPACHO DEL CLIENTE */}

            <section className="pedido-bodeguero-modal__seccion">

              <h3>

                📍 Datos de entrega

              </h3>

              <div className="pedido-bodeguero-modal__grid">

                <div>

                  <span>

                    Tipo de despacho

                  </span>

                  <strong>

                    {obtenerTipoDespacho(

                      pedidoSeleccionado

                    )}

                  </strong>

                </div>

                <div>

                  <span>

                    Comuna

                  </span>

                  <strong>

                    {obtenerDespacho(

                      pedidoSeleccionado

                    )?.comuna_despacho ||

                      "No informada"}

                  </strong>

                </div>

                <div>

                  <span>

                    Dirección

                  </span>

                  <strong>

                    {obtenerDespacho(

                      pedidoSeleccionado

                    )?.direccion_despacho ||

                      "No registrada en el pedido"}

                  </strong>

                </div>

                <div>

                  <span>

                    Costo de envío

                  </span>

                  <strong>

                    {formatearPrecio(

                      obtenerDespacho(

                        pedidoSeleccionado

                      )?.costo_envio

                    )}

                  </strong>

                </div>

              </div>

            </section>

            {/* PRODUCTOS */}

            <section className="pedido-bodeguero-modal__seccion">

              <h3>

                📦 Productos del pedido

              </h3>

              <div className="pedido-bodeguero-modal__productos">

                {pedidoSeleccionado

                  .detalle_pedido?.length > 0 ? (

                  pedidoSeleccionado.detalle_pedido.map(

                    (detalle) => {

                      const subtotal =

                        Number(

                          detalle.precio_unitario ||

                            0

                        ) *

                        Number(

                          detalle.cantidad || 0

                        );

                      return (

                        <div

                          key={

                            detalle.id_detalle

                          }

                          className="pedido-bodeguero-modal__producto"

                        >

                          <div>

                            <strong>

                              {detalle.nom_prod ||

                                "Producto"}

                            </strong>

                            <span>

                              {detalle.cantidad}{" "}

                              ×{" "}

                              {formatearPrecio(

                                detalle.precio_unitario

                              )}

                            </span>

                          </div>

                          <strong>

                            {formatearPrecio(

                              subtotal

                            )}

                          </strong>

                        </div>

                      );

                    }

                  )

                ) : (

                  <p>

                    No hay productos registrados.

                  </p>

                )}

              </div>

              <div className="pedido-bodeguero-modal__total">

                <span>

                  Total del pedido

                </span>

                <strong>

                  {formatearPrecio(

                    pedidoSeleccionado.total_pedido

                  )}

                </strong>

              </div>

            </section>

            {/* INFORMACIÓN DEL DESPACHO */}
            {pedidoSeleccionado.despacho?.length > 0 && (
              <section className="pedido-bodeguero-modal__seccion">
                <h3>🚚 Información del despacho</h3>

                <div className="pedido-bodeguero-modal__grid">
                  <div>
                    <span>Tipo de despacho</span>
                    <strong>{obtenerTipoDespacho(pedidoSeleccionado)}</strong>
                  </div>
                  <div>
                    <span>Dirección</span>
                    <strong>{obtenerDespacho(pedidoSeleccionado)?.direccion_despacho || "No registrada"}</strong>
                  </div>
                  <div>
                    <span>Comuna</span>
                    <strong>{obtenerDespacho(pedidoSeleccionado)?.comuna_despacho || "No informada"}</strong>
                  </div>
                  <div>
                    <span>Costo de envío</span>
                    <strong>{formatearPrecio(obtenerDespacho(pedidoSeleccionado)?.costo_envio)}</strong>
                  </div>
                </div>

                <div className="pedido-bodeguero-modal__formulario">
                  <label>
                    <span>Transportista *</span>
                    <input
                      type="text"
                      value={transportista}
                      onChange={(event) => setTransportista(event.target.value)}
                      placeholder="Ej: Starken, Chilexpress..."
                      disabled={guardandoDatosDespacho || procesando !== null}
                    />
                  </label>

                  <label>
                    <span>Número de seguimiento</span>
                    <input
                      type="text"
                      value={numSeguimiento}
                      onChange={(event) => setNumSeguimiento(event.target.value)}
                      placeholder="Opcional"
                      disabled={guardandoDatosDespacho || procesando !== null}
                    />
                  </label>

                  <label>
                    <span>Fecha de despacho *</span>
                    <input
                      type="date"
                      value={fechaDespacho}
                      onChange={(event) => setFechaDespacho(event.target.value)}
                      disabled={guardandoDatosDespacho || procesando !== null}
                    />
                  </label>
                </div>

                {errorEditarDespacho && (
                  <div className="pedidos-bodeguero__error" role="alert">
                    {errorEditarDespacho}
                  </div>
                )}

                <div className="pedido-bodeguero-modal__footer">
                  <button
                    type="button"
                    className="pedido-bodeguero-card__boton-principal"
                    onClick={actualizarDatosDespacho}
                    disabled={guardandoDatosDespacho || procesando !== null}
                  >
                    {guardandoDatosDespacho ? "Guardando cambios..." : "Guardar cambios"}
                  </button>
                </div>
              </section>
            )}

            {/* FOOTER MODAL */}

            <div className="pedido-bodeguero-modal__footer">

              <button

                type="button"

                className="pedido-bodeguero-card__boton-detalle"

                onClick={cerrarDetalle}

              >

                Cerrar

              </button>

              {pedidoSeleccionado.id_estado ===

                ESTADO_CONFIRMADO && (

                <button

                  type="button"

                  className="pedido-bodeguero-card__boton-principal"

                  disabled={

                    procesando ===

                    pedidoSeleccionado.id_pedido

                  }

                  onClick={() =>

                    cambiarEstado(

                      pedidoSeleccionado.id_pedido,

                      ESTADO_PREPARACION

                    )

                  }

                >

                  {procesando ===

                  pedidoSeleccionado.id_pedido

                    ? "Actualizando..."

                    : "Comenzar preparación"}

                </button>

              )}

              {pedidoSeleccionado.id_estado ===

                ESTADO_PREPARACION && (

                <button

                  type="button"

                  className="pedido-bodeguero-card__boton-principal"

                  disabled={

                    procesando ===

                    pedidoSeleccionado.id_pedido

                  }

                  onClick={() =>

                    abrirModalDespacho(

                      pedidoSeleccionado

                    )

                  }

                >

                  Marcar como enviado

                </button>

              )}

            </div>

          </div>

        </div>

      )}

      {/* =====================================

          MODAL DE DESPACHO

      ====================================== */}

      {mostrarModalDespacho &&

        pedidoSeleccionado && (

        <div

          className="pedido-bodeguero-modal pedido-bodeguero-modal--despacho"

          onMouseDown={(event) => {

            if (

              event.target ===

              event.currentTarget

            ) {

              cerrarModalDespacho();

            }

          }}

        >

          <div className="pedido-bodeguero-modal__contenido pedido-bodeguero-modal__contenido--despacho">

            <div className="pedido-bodeguero-modal__header">

              <div>

                <span>DESPACHO</span>

                <h2>

                  Pedido #

                  {pedidoSeleccionado.id_pedido}

                </h2>

                <p>

                  Completa los datos para

                  registrar el despacho.

                </p>

              </div>

              <button

                type="button"

                className="pedido-bodeguero-modal__cerrar"

                onClick={cerrarModalDespacho}

                disabled={

                  procesando !== null

                }

              >

                ×

              </button>

            </div>

            <section className="pedido-bodeguero-modal__seccion">

              <h3>

                🚚 Información del despacho

              </h3>

              {/* DATOS ELEGIDOS POR EL CLIENTE */}

              <div className="pedido-bodeguero-modal__grid">

                <div>

                  <span>

                    Tipo de despacho

                  </span>

                  <strong>

                    {obtenerTipoDespacho(

                      pedidoSeleccionado

                    )}

                  </strong>

                </div>

                <div>

                  <span>

                    Comuna

                  </span>

                  <strong>

                    {obtenerDespacho(

                      pedidoSeleccionado

                    )?.comuna_despacho ||

                      "No informada"}

                  </strong>

                </div>

                <div>

                  <span>

                    Dirección

                  </span>

                  <strong>

                    {obtenerDespacho(

                      pedidoSeleccionado

                    )?.direccion_despacho ||

                      "No registrada"}

                  </strong>

                </div>

                <div>

                  <span>

                    Costo de envío

                  </span>

                  <strong>

                    {formatearPrecio(

                      obtenerDespacho(

                        pedidoSeleccionado

                      )?.costo_envio

                    )}

                  </strong>

                </div>

              </div>

              <div className="pedido-bodeguero-modal__formulario">

                {/* TRANSPORTISTA */}

                <label>

                  <span>

                    Transportista *

                  </span>

                  <input

                    type="text"

                    value={transportista}

                    onChange={(event) =>

                      setTransportista(

                        event.target.value

                      )

                    }

                    placeholder="Ej: Starken, Blue Express, Chilexpress..."

                    disabled={

                      procesando !== null

                    }

                  />

                  <small>

                    Ingresa manualmente el

                    nombre del transportista.

                  </small>

                </label>

                {/* SEGUIMIENTO */}

                <label>

                  <span>

                    Número de seguimiento

                  </span>

                  <input

                    type="text"

                    value={numSeguimiento}

                    onChange={(event) =>

                      setNumSeguimiento(

                        event.target.value

                      )

                    }

                    placeholder="Opcional"

                    disabled={

                      procesando !== null

                    }

                  />

                  <small>

                    Puedes dejar este campo

                    vacío.

                  </small>

                </label>

                {/* FECHA */}

                <label>

                  <span>

                    Fecha de despacho *

                  </span>

                  <input

                    type="date"

                    value={fechaDespacho}

                    onChange={(event) =>

                      setFechaDespacho(

                        event.target.value

                      )

                    }

                    disabled={

                      procesando !== null

                    }

                  />

                </label>

              </div>

              {errorDespacho && (

                <div

                  className="pedidos-bodeguero__error"

                  role="alert"

                >

                  {errorDespacho}

                </div>

              )}

            </section>

            <div className="pedido-bodeguero-modal__footer">

              <button

                type="button"

                className="pedido-bodeguero-card__boton-detalle"

                onClick={

                  cerrarModalDespacho

                }

                disabled={

                  procesando !== null

                }

              >

                Cancelar

              </button>

              <button

                type="button"

                className="pedido-bodeguero-card__boton-principal"

                onClick={

                  registrarDespacho

                }

                disabled={

                  procesando ===

                  pedidoSeleccionado.id_pedido

                }

              >

                {procesando ===

                pedidoSeleccionado.id_pedido

                  ? "Registrando..."

                  : "Confirmar despacho"}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  );

}

export default Pedidos;
