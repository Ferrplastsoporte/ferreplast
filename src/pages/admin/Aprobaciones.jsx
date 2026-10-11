import { useEffect, useMemo, useState } from "react";
import { FiRefreshCw } from "react-icons/fi";
import { supabase } from "../../lib/supabase";
import {
  NOMBRES_ACCIONES,
  formatearFecha,
  obtenerDetalleCambios,
} from "../../utils/solicitudes/solicitudes";
import { obtenerNombresReferenciasCambios } from "../../services/solicitudesService";
import AdminHeader from "./components/AdminHeader";
import "./css/Aprobaciones.css";

const BUCKET_IMAGENES = "imagenes_productos";

function obtenerUrlPublica(ruta) {
  if (!ruta) return "";
  if (/^https?:\/\//i.test(ruta)) return ruta;

  return supabase.storage.from(BUCKET_IMAGENES).getPublicUrl(ruta).data
    .publicUrl;
}

function obtenerNombreAccion(tipoAccion) {
  return NOMBRES_ACCIONES[tipoAccion] || tipoAccion || "Cambio de producto";
}

function Aprobaciones() {
  const [productos, setProductos] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [marcasSeleccionadas, setMarcasSeleccionadas] = useState([]);
  const [productosExpandidos, setProductosExpandidos] = useState([]);
  const [nombresReferencias, setNombresReferencias] = useState({});
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [confirmacion, setConfirmacion] = useState(null);

  useEffect(() => {
    cargarAprobaciones();
  }, []);

  async function cargarAprobaciones({ conservarMensaje = false } = {}) {
    setCargando(true);
    if (!conservarMensaje) setMensaje(null);

    try {
      const [resultadoCambios, resultadoMarcas] = await Promise.all([
        supabase
          .from("producto_cambio")
          .select(
            `
              id_cambio,
              id_prod,
              id_user,
              fecha_cambio,
              tipo_accion,
              campos_modificados,
              estado_anterior,
              estado_nuevo,
              revisado,
              usuario (nom_user)
            `,
          )
          .not("id_user", "is", null)
          .eq("revisado", false)
          .order("fecha_cambio", { ascending: false }),
        supabase
          .from("marca_producto")
          .select("id_marca, nom_marca, logo_url, marca_destacar, id_estado_marca")
          .eq("id_estado_marca", 1)
          .order("nom_marca", { ascending: true }),
      ]);

      if (resultadoCambios.error) throw resultadoCambios.error;
      if (resultadoMarcas.error) throw resultadoMarcas.error;

      const cambios = resultadoCambios.data ?? [];
      const referencias = await obtenerNombresReferenciasCambios(cambios);
      const idsProductos = [...new Set(cambios.map((cambio) => cambio.id_prod))];
      let productosPendientes = [];

      if (idsProductos.length > 0) {
        const { data, error } = await supabase
          .from("producto")
          .select(
            `
              id_prod,
              nom_prod,
              imagen_url,
              precio_prod,
              precio_act,
              stock_prod,
              est_prod,
              marca_producto (nom_marca),
              subcategoria (nom_subcategoria)
            `,
          )
          .in("id_prod", idsProductos)
          .eq("est_prod", 1)
          .order("created_prod", { ascending: false });

        if (error) throw error;

        const cambiosPorProducto = cambios.reduce((mapa, cambio) => {
          const lista = mapa.get(cambio.id_prod) ?? [];
          lista.push(cambio);
          mapa.set(cambio.id_prod, lista);
          return mapa;
        }, new Map());

        productosPendientes = (data ?? []).map((producto) => ({
          ...producto,
          cambios: cambiosPorProducto.get(producto.id_prod) ?? [],
        }));
      }

      setProductos(productosPendientes);
      setMarcas(resultadoMarcas.data ?? []);
      setNombresReferencias(referencias);
      setProductosSeleccionados([]);
      setMarcasSeleccionadas([]);
      setProductosExpandidos([]);
    } catch (error) {
      console.error("Error al cargar las aprobaciones:", error);
      setMensaje({
        tipo: "error",
        texto:
          error?.message || "No fue posible cargar las aprobaciones pendientes.",
      });
    } finally {
      setCargando(false);
    }
  }

  const todosLosProductosSeleccionados =
    productos.length > 0 && productosSeleccionados.length === productos.length;

  const todasLasMarcasSeleccionadas =
    marcas.length > 0 && marcasSeleccionadas.length === marcas.length;

  const resumen = useMemo(
    () => ({
      productos: productos.length,
      marcas: marcas.length,
      total: productos.length + marcas.length,
    }),
    [productos.length, marcas.length],
  );

  function alternarSeleccion(valor, actualizarSeleccionados) {
    actualizarSeleccionados((actuales) =>
      actuales.includes(valor)
        ? actuales.filter((id) => id !== valor)
        : [...actuales, valor],
    );
  }

  function alternarDetalleProducto(idProducto) {
    setProductosExpandidos((actuales) =>
      actuales.includes(idProducto)
        ? actuales.filter((id) => id !== idProducto)
        : [...actuales, idProducto],
    );
  }

  function solicitarResolucionProductos(ids, accion) {
    const idsValidos = ids.filter((id) =>
      productos.some((producto) => producto.id_prod === id),
    );

    if (idsValidos.length === 0) return;
    setConfirmacion({ tipo: "producto", accion, ids: idsValidos });
  }

  function solicitarResolucionMarcas(ids, accion) {
    const idsValidos = ids.filter((id) =>
      marcas.some((marca) => marca.id_marca === id),
    );

    if (idsValidos.length === 0) return;
    setConfirmacion({ tipo: "marca", accion, ids: idsValidos });
  }

  async function confirmarResolucion() {
    if (!confirmacion || procesando) return;

    setProcesando(true);
    setMensaje(null);

    try {
      if (confirmacion.tipo === "producto") {
        const { data, error } = await supabase.rpc(
          "resolver_aprobaciones_productos",
          {
            p_ids_productos: confirmacion.ids,
            p_aprobar: confirmacion.accion === "aprobar",
          },
        );

        if (error) throw error;

        const cantidad = Number(data) || confirmacion.ids.length;
        setMensaje({
          tipo: "success",
          texto: `${cantidad} ${cantidad === 1 ? "producto fue resuelto" : "productos fueron resueltos"} correctamente.`,
        });
      } else {
        const { data, error } = await supabase.rpc(
          "resolver_aprobaciones_marcas",
          {
            p_ids_marcas: confirmacion.ids,
            p_aprobar: confirmacion.accion === "aprobar",
          },
        );

        if (error) throw error;

        const cantidad = Number(data);
        if (!Number.isInteger(cantidad) || cantidad < 1) {
          throw new Error(
            "Las marcas seleccionadas ya no se encuentran pendientes.",
          );
        }

        const aprobando = confirmacion.accion === "aprobar";
        setMensaje({
          tipo: "success",
          texto: `${cantidad === 1 ? "La marca fue" : `Las ${cantidad} marcas fueron`} ${aprobando ? "aprobada" : "rechazada"}${cantidad === 1 ? "" : "s"} correctamente.`,
        });
      }

      setConfirmacion(null);
      await cargarAprobaciones({ conservarMensaje: true });
    } catch (error) {
      console.error("Error al resolver las aprobaciones:", error);
      setConfirmacion(null);
      setMensaje({
        tipo: "error",
        texto:
          error?.message || "No fue posible completar la acción solicitada.",
      });
    } finally {
      setProcesando(false);
    }
  }

  function textoConfirmacion() {
    if (!confirmacion) return "";

    const cantidad = confirmacion.ids.length;
    if (confirmacion.tipo === "marca") {
      const verbo = confirmacion.accion === "aprobar" ? "aprobará" : "rechazará";
      return `Se ${verbo}${cantidad > 1 ? "n" : ""} ${cantidad === 1 ? "la marca seleccionada" : `${cantidad} marcas seleccionadas`}.`;
    }

    const verbo = confirmacion.accion === "aprobar" ? "aprobará" : "rechazará";
    return `Se ${verbo}${cantidad > 1 ? "n" : ""} ${cantidad} ${cantidad === 1 ? "producto pendiente" : "productos pendientes"}.`;
  }

  return (
    <section className="admin-page aprobaciones-page">
      <AdminHeader
        titulo="Aprobaciones"
        descripcion="Revisa y resuelve los cambios de productos y las marcas enviadas por bodega."
        acciones={
          <button
            type="button"
            className="aprobaciones-recargar"
            onClick={() => cargarAprobaciones()}
            disabled={cargando}
            aria-label="Actualizar aprobaciones"
            title="Actualizar aprobaciones"
          >
            <FiRefreshCw aria-hidden="true" />
          </button>
        }
      />

      <div className="aprobaciones-resumen" aria-label="Resumen de aprobaciones">
        <article><span>Total pendiente</span><strong>{resumen.total}</strong></article>
        <article><span>Cambios de productos</span><strong>{resumen.productos}</strong></article>
        <article><span>Marcas por validar</span><strong>{resumen.marcas}</strong></article>
      </div>

      {mensaje && (
        <div
          className={`aprobaciones-mensaje aprobaciones-mensaje--${mensaje.tipo}`}
          role={mensaje.tipo === "error" ? "alert" : "status"}
        >
          <span>{mensaje.texto}</span>
          {mensaje.tipo === "error" && (
            <button type="button" onClick={cargarAprobaciones}>Reintentar</button>
          )}
        </div>
      )}

      {cargando ? (
        <div className="aprobaciones-cargando">Cargando aprobaciones pendientes…</div>
      ) : (
        <>
          <section className="aprobaciones-panel" aria-labelledby="productos-pendientes">
            <div className="aprobaciones-panel__cabecera">
              <div>
                <span className="aprobaciones-panel__etiqueta">Productos</span>
                <h2 id="productos-pendientes">Cambios pendientes</h2>
                <p>Solicitudes realizadas por usuarios de bodega que aún requieren revisión.</p>
              </div>

              {productosSeleccionados.length > 0 && (
                <div className="aprobaciones-acciones-masivas">
                  <span>{productosSeleccionados.length} seleccionados</span>
                  <button
                    type="button"
                    className="aprobaciones-btn aprobaciones-btn--rechazar"
                    onClick={() => solicitarResolucionProductos(productosSeleccionados, "rechazar")}
                  >Rechazar</button>
                  <button
                    type="button"
                    className="aprobaciones-btn aprobaciones-btn--aprobar"
                    onClick={() => solicitarResolucionProductos(productosSeleccionados, "aprobar")}
                  >Aprobar</button>
                </div>
              )}
            </div>

            {productos.length === 0 ? (
              <div className="aprobaciones-vacio">
                <strong>No hay cambios de productos pendientes</strong>
                <span>Las nuevas solicitudes aparecerán en esta sección.</span>
              </div>
            ) : (
              <div className="aprobaciones-tabla-contenedor">
                <table className="aprobaciones-tabla">
                  <thead>
                    <tr>
                      <th className="aprobaciones-tabla__seleccion">
                        <input
                          type="checkbox"
                          checked={todosLosProductosSeleccionados}
                          onChange={() => setProductosSeleccionados(
                            todosLosProductosSeleccionados ? [] : productos.map((producto) => producto.id_prod),
                          )}
                          aria-label="Seleccionar todos los productos"
                        />
                      </th>
                      <th>Producto</th><th>Solicitado por</th><th>Último cambio</th><th>Detalle</th><th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productos.map((producto) => {
                      const ultimoCambio = producto.cambios[0];
                      const expandido = productosExpandidos.includes(producto.id_prod);
                      const seleccionado = productosSeleccionados.includes(producto.id_prod);

                      return (
                        <tr key={producto.id_prod} className={seleccionado ? "is-selected" : ""}>
                          <td className="aprobaciones-tabla__seleccion">
                            <input
                              type="checkbox"
                              checked={seleccionado}
                              onChange={() => alternarSeleccion(producto.id_prod, setProductosSeleccionados)}
                              aria-label={`Seleccionar ${producto.nom_prod}`}
                            />
                          </td>
                          <td>
                            <div className="aprobaciones-elemento">
                              {producto.imagen_url ? (
                                <img src={obtenerUrlPublica(producto.imagen_url)} alt="" className="aprobaciones-elemento__imagen" />
                              ) : (
                                <span className="aprobaciones-elemento__imagen aprobaciones-elemento__imagen--vacia">Sin imagen</span>
                              )}
                              <div>
                                <strong>{producto.nom_prod}</strong>
                                <span>{producto.marca_producto?.nom_marca || "Sin marca"} · {producto.subcategoria?.nom_subcategoria || "Sin subcategoría"}</span>
                                <small>ID #{producto.id_prod}</small>
                              </div>
                            </div>
                          </td>
                          <td><strong className="aprobaciones-usuario">{ultimoCambio?.usuario?.nom_user || "Usuario de bodega"}</strong></td>
                          <td>
                            <div className="aprobaciones-fecha">
                              <strong>{obtenerNombreAccion(ultimoCambio?.tipo_accion)}</strong>
                              <span>{formatearFecha(ultimoCambio?.fecha_cambio)}</span>
                              {producto.cambios.length > 1 && <small>{producto.cambios.length} movimientos pendientes</small>}
                            </div>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="aprobaciones-btn-detalle"
                              onClick={() => alternarDetalleProducto(producto.id_prod)}
                              aria-expanded={expandido}
                            >{expandido ? "Ocultar cambios" : "Ver cambios"}</button>
                            {expandido && (
                              <div className="aprobaciones-cambios">
                                {producto.cambios.map((cambio) => {
                                  const detalles = obtenerDetalleCambios(
                                    cambio.campos_modificados,
                                    nombresReferencias,
                                  );
                                  return (
                                    <article key={cambio.id_cambio}>
                                      <header><strong>{obtenerNombreAccion(cambio.tipo_accion)}</strong><span>{formatearFecha(cambio.fecha_cambio)}</span></header>
                                      {detalles.length > 0 ? (
                                        <ul>
                                          {detalles.map((detalle, indice) => (
                                            <li key={`${cambio.id_cambio}-${detalle.campo}-${indice}`}>
                                              <strong>{detalle.campo}</strong><span>{detalle.anterior}</span><b aria-hidden="true">→</b><span>{detalle.nuevo}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      ) : <p>El cambio no contiene campos comparables.</p>}
                                    </article>
                                  );
                                })}
                              </div>
                            )}
                          </td>
                          <td>
                            <div className="aprobaciones-acciones-fila">
                              <button type="button" className="aprobaciones-btn aprobaciones-btn--rechazar" onClick={() => solicitarResolucionProductos([producto.id_prod], "rechazar")}>Rechazar</button>
                              <button type="button" className="aprobaciones-btn aprobaciones-btn--aprobar" onClick={() => solicitarResolucionProductos([producto.id_prod], "aprobar")}>Aprobar</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="aprobaciones-panel" aria-labelledby="marcas-pendientes">
            <div className="aprobaciones-panel__cabecera">
              <div>
                <span className="aprobaciones-panel__etiqueta">Marcas</span>
                <h2 id="marcas-pendientes">Marcas por validar</h2>
                <p>Aprueba o rechaza las marcas enviadas por bodega.</p>
              </div>
              {marcasSeleccionadas.length > 0 && (
                <div className="aprobaciones-acciones-masivas">
                  <span>{marcasSeleccionadas.length} seleccionadas</span>
                  <button type="button" className="aprobaciones-btn aprobaciones-btn--rechazar" onClick={() => solicitarResolucionMarcas(marcasSeleccionadas, "rechazar")}>Rechazar</button>
                  <button type="button" className="aprobaciones-btn aprobaciones-btn--aprobar" onClick={() => solicitarResolucionMarcas(marcasSeleccionadas, "aprobar")}>Aprobar</button>
                </div>
              )}
            </div>

            {marcas.length === 0 ? (
              <div className="aprobaciones-vacio"><strong>No hay marcas pendientes</strong><span>Las marcas nuevas aparecerán en esta sección.</span></div>
            ) : (
              <div className="aprobaciones-tabla-contenedor">
                <table className="aprobaciones-tabla aprobaciones-tabla--marcas">
                  <thead>
                    <tr>
                      <th className="aprobaciones-tabla__seleccion">
                        <input
                          type="checkbox"
                          checked={todasLasMarcasSeleccionadas}
                          onChange={() => setMarcasSeleccionadas(todasLasMarcasSeleccionadas ? [] : marcas.map((marca) => marca.id_marca))}
                          aria-label="Seleccionar todas las marcas"
                        />
                      </th>
                      <th>Marca</th><th>Tipo</th><th>Estado</th><th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marcas.map((marca) => {
                      const seleccionada = marcasSeleccionadas.includes(marca.id_marca);
                      return (
                        <tr key={marca.id_marca} className={seleccionada ? "is-selected" : ""}>
                          <td className="aprobaciones-tabla__seleccion">
                            <input type="checkbox" checked={seleccionada} onChange={() => alternarSeleccion(marca.id_marca, setMarcasSeleccionadas)} aria-label={`Seleccionar ${marca.nom_marca}`} />
                          </td>
                          <td>
                            <div className="aprobaciones-elemento">
                              {marca.logo_url ? (
                                <img src={obtenerUrlPublica(marca.logo_url)} alt="" className="aprobaciones-elemento__imagen aprobaciones-elemento__imagen--logo" />
                              ) : (
                                <span className="aprobaciones-elemento__imagen aprobaciones-elemento__imagen--vacia">Sin logo</span>
                              )}
                              <div><strong>{marca.nom_marca}</strong><small>ID #{marca.id_marca}</small></div>
                            </div>
                          </td>
                          <td>{marca.marca_destacar ? "Destacada" : "Normal"}</td>
                          <td><span className="aprobaciones-estado">Pendiente</span></td>
                          <td>
                            <div className="aprobaciones-acciones-fila">
                              <button type="button" className="aprobaciones-btn aprobaciones-btn--rechazar" onClick={() => solicitarResolucionMarcas([marca.id_marca], "rechazar")}>Rechazar</button>
                              <button type="button" className="aprobaciones-btn aprobaciones-btn--aprobar" onClick={() => solicitarResolucionMarcas([marca.id_marca], "aprobar")}>Aprobar</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {confirmacion && (
        <div className="aprobaciones-modal" role="presentation">
          <div className="aprobaciones-modal__contenido" role="dialog" aria-modal="true" aria-labelledby="titulo-confirmacion-aprobacion">
            <span className={`aprobaciones-modal__icono aprobaciones-modal__icono--${confirmacion.accion}`}>{confirmacion.accion === "aprobar" ? "✓" : "!"}</span>
            <h2 id="titulo-confirmacion-aprobacion">{confirmacion.accion === "aprobar" ? "Confirmar aprobación" : "Confirmar rechazo"}</h2>
            <p>{textoConfirmacion()}</p>
            <p>Esta acción retirará los elementos de la lista de pendientes.</p>
            <div className="aprobaciones-modal__acciones">
              <button type="button" className="aprobaciones-btn aprobaciones-btn--secundario" onClick={() => setConfirmacion(null)} disabled={procesando}>Cancelar</button>
              <button type="button" className={`aprobaciones-btn aprobaciones-btn--${confirmacion.accion}`} onClick={confirmarResolucion} disabled={procesando}>
                {procesando ? "Procesando…" : confirmacion.accion === "aprobar" ? "Sí, aprobar" : "Sí, rechazar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default Aprobaciones;
