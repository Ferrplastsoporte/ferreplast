import { useEffect, useMemo, useState } from "react";
import { FiRefreshCw } from "react-icons/fi";
import { supabase } from "../../lib/supabase";
import BodegueroHeader from "./components/BodegueroHeader";
import { obtenerUrlImagenProducto } from "../../services/productoStorageService";
import {
  LONGITUD_MAXIMA_BUSQUEDA,
  sanitizarTerminoBusqueda,
} from "../../utils/comunes/busqueda";

import "./css/bodeguero.css";
import "./css/productos-bodeguero.css";
import "./css/stock.css";

const LIMITE_STOCK_BAJO = 10;

function ImagenProductoStock({ ruta, nombre }) {
  const [urlFallida, setUrlFallida] = useState(null);
  const url = obtenerUrlImagenProducto(ruta);

  if (!url || url === urlFallida) {
    return <span className="stock-table__image stock-table__image--empty">Sin imagen</span>;
  }

  return (
    <img
      className="stock-table__image"
      src={url}
      alt={`Imagen de ${nombre}`}
      loading="lazy"
      onError={() => setUrlFallida(url)}
    />
  );
}

function BodegueroStock() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);

  const [mensajeError, setMensajeError] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroStock, setFiltroStock] = useState("todos");
  const [orden, setOrden] = useState("prioridad");

  const [productoPorAjustar, setProductoPorAjustar] = useState(null);
  const [nuevoStock, setNuevoStock] = useState("");

  useEffect(() => {
    cargarProductos();
  }, []);

  async function cargarProductos() {
    setCargando(true);
    setMensajeError("");

    const { data, error } = await supabase.rpc("kpi_alerta_stock");

    if (error) {
      console.error("Error al cargar el stock:", error);

      setProductos([]);
      setMensajeError("No fue posible cargar el inventario.");
    } else {
      setProductos(data ?? []);
    }

    setCargando(false);
  }

  const productosStockBajo = useMemo(
    () =>
      productos.filter(
        (producto) =>
          Number(producto.prioridad_stock) !== 7 && producto.stock_bajo,
      ),
    [productos],
  );

  const productosSinStock = useMemo(
    () =>
      productos.filter(
        (producto) =>
          Number(producto.prioridad_stock) !== 7 && producto.sin_stock,
      ),
    [productos],
  );

  const productosCoberturaCorta = useMemo(
    () => productos.filter((producto) =>
      [2, 3].includes(Number(producto.prioridad_stock)),
    ),
    [productos],
  );

  const productosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLocaleLowerCase("es-CL");

    const productosCoincidentes = productos.filter((producto) => {
      const stock = producto.stock_prod == null ? null : Number(producto.stock_prod);
      const estado = Number(producto.est_prod);

      const coincideBusqueda =
        !texto ||
        producto.nom_prod?.toLocaleLowerCase("es-CL").includes(texto) ||
        String(producto.id_prod ?? "").includes(texto);

      const coincideEstado =
        filtroEstado === "todos" || estado === Number(filtroEstado);

      const coincideStock =
        filtroStock === "todos" ||
        (filtroStock === "sin-stock" && producto.sin_stock) ||
        (filtroStock === "cobertura" &&
          [2, 3].includes(Number(producto.prioridad_stock))) ||
        (filtroStock === "bajo" &&
          producto.stock_bajo) ||
        (filtroStock === "suficiente" && stock !== null && stock >= LIMITE_STOCK_BAJO);

      return coincideBusqueda && coincideEstado && coincideStock;
    });

    return [...productosCoincidentes].sort((productoA, productoB) => {
      // Mantiene el orden calculado por SQL: urgencia, marca y cobertura.
      if (orden === "prioridad") return 0;

      if (orden === "nombre-asc") {
        return (productoA.nom_prod || "").localeCompare(
          productoB.nom_prod || "",
          "es-CL",
        );
      }

      if (productoA.stock_prod == null || productoB.stock_prod == null) {
        if (productoA.stock_prod == null && productoB.stock_prod == null) return 0;
        return productoA.stock_prod == null ? 1 : -1;
      }

      if (orden === "stock-desc") {
        return Number(productoB.stock_prod) - Number(productoA.stock_prod);
      }

      return Number(productoA.stock_prod) - Number(productoB.stock_prod);
    });
  }, [productos, busqueda, filtroEstado, filtroStock, orden]);

  const hayFiltrosActivos =
    busqueda.trim() ||
    filtroEstado !== "todos" ||
    filtroStock !== "todos" ||
    orden !== "prioridad";

  function limpiarFiltros() {
    setBusqueda("");
    setFiltroEstado("todos");
    setFiltroStock("todos");
    setOrden("prioridad");
  }

  function abrirAjusteStock(producto) {
    if (![2, 3, 4].includes(Number(producto.est_prod))) {
      setMensajeExito("");
      setMensajeError("El producto está pendiente de revisión. Espera la resolución del administrador antes de solicitar otro ajuste.");
      return;
    }
    setProductoPorAjustar(producto);
    setNuevoStock(String(Number(producto.stock_prod) || 0));

    setMensajeError("");
    setMensajeExito("");
  }

  function cerrarAjusteStock() {
    if (actualizando) return;

    setProductoPorAjustar(null);
    setNuevoStock("");
  }

  function cambiarNuevoStock(valor) {
    setNuevoStock(String(valor).replace(/\D/g, ""));
  }

  async function guardarAjusteStock(evento) {
    evento.preventDefault();

    if (!productoPorAjustar || actualizando) return;

    const stock = Number(nuevoStock);

    if (!nuevoStock.trim() || !Number.isInteger(stock) || stock < 0 || stock > 2147483647) {
      setMensajeError(
        "El stock debe ser un número entero entre 0 y 2147483647.",
      );
      return;
    }

    if (productoPorAjustar.stock_prod != null && stock === Number(productoPorAjustar.stock_prod)) {
      setMensajeError("Debes ingresar un stock diferente al actual.");
      return;
    }

    setActualizando(true);
    setMensajeError("");
    setMensajeExito("");

    try {
      const { error } = await supabase.rpc("ajustar_stock_producto", {
        p_id_producto: productoPorAjustar.id_prod,
        p_nuevo_stock: stock,
      });

      if (error) throw error;

      const nombreProducto = productoPorAjustar.nom_prod;

      setProductoPorAjustar(null);
      setNuevoStock("");

      await cargarProductos();

      setMensajeExito(
        `El ajuste de stock de "${nombreProducto}" quedó pendiente de aprobación. Las existencias reales todavía no cambian y el producto queda fuera del catálogo mientras se revisa.`,
      );
    } catch (error) {
      console.error("Error al ajustar el stock:", error);

      setMensajeError(
        error?.message || "No fue posible actualizar el stock del producto.",
      );
    } finally {
      setActualizando(false);
    }
  }

  const encabezado = (
    <BodegueroHeader
      titulo="Gestión de stock"
      descripcion="Consulta las existencias y solicita ajustes de stock para aprobación del administrador."
      acciones={
        <button
          type="button"
          className="stock-refresh"
          onClick={cargarProductos}
          disabled={cargando || actualizando}
          aria-label="Actualizar inventario e indicadores"
          title="Actualizar inventario e indicadores"
        >
          <FiRefreshCw aria-hidden="true" />
        </button>
      }
    />
  );

  if (cargando) {
    return (
      <section className="bodeguero-page stock-page">
        {encabezado}
        <p className="bodeguero-loading">Cargando inventario...</p>
      </section>
    );
  }

  return (
    <section className="bodeguero-page stock-page">
      {encabezado}

      <div className="stock-kpi-heading">
        <div>
          <h2>Prioridad de reposición</h2>
          <p>Revisa primero los productos que necesitan atención.</p>
        </div>
      </div>

      {mensajeExito && (
        <p
          className="bodeguero-message bodeguero-message--success"
          role="status"
        >
          {mensajeExito}
        </p>
      )}

      {mensajeError && !productoPorAjustar && (
        <div
          className="bodeguero-message bodeguero-message--error"
          role="alert"
        >
          <p>{mensajeError}</p>
        </div>
      )}

      <div className="stock-summary">
        <div className={productosSinStock.length > 0 ? "stock-summary--danger" : ""}>
          <span>Productos sin stock</span>
          <strong>{productosSinStock.length}</strong>
        </div>

        <div className={productosStockBajo.length > 0 ? "stock-summary--warning" : ""}>
          <span>Productos con stock bajo</span>
          <strong>{productosStockBajo.length}</strong>
        </div>

        <div className={productosCoberturaCorta.length > 0 ? "stock-summary--warning" : ""}>
          <span>Por agotarse según ventas</span>
          <strong>{productosCoberturaCorta.length}</strong>
        </div>
      </div>

      <div className="stock-toolbar">
        <div className="stock-toolbar__field stock-toolbar__search">
          <label htmlFor="buscarStock">Buscar producto</label>

          <input
            id="buscarStock"
            type="search"
            value={busqueda}
            onChange={(evento) =>
              setBusqueda(sanitizarTerminoBusqueda(evento.target.value))
            }
            maxLength={LONGITUD_MAXIMA_BUSQUEDA}
            placeholder="Buscar por nombre o ID..."
          />
        </div>

        <div className="stock-toolbar__field">
          <label htmlFor="filtroEstadoStock">Estado</label>

          <select
            id="filtroEstadoStock"
            value={filtroEstado}
            onChange={(evento) => setFiltroEstado(evento.target.value)}
          >
            <option value="todos">Todos los estados</option>
            <option value="2">Activos</option>
            <option value="1">Pendientes</option>
            <option value="3">No disponibles</option>
            <option value="4">Rechazados</option>
          </select>
        </div>

        <div className="stock-toolbar__field">
          <label htmlFor="filtroNivelStock">Nivel de stock</label>

          <select
            id="filtroNivelStock"
            value={filtroStock}
            onChange={(evento) => setFiltroStock(evento.target.value)}
          >
            <option value="todos">Todos los niveles</option>
            <option value="sin-stock">Sin stock</option>
            <option value="cobertura">Cobertura de hasta 14 días</option>
            <option value="bajo">Bajo (1–{LIMITE_STOCK_BAJO - 1})</option>
            <option value="suficiente">
              {LIMITE_STOCK_BAJO} unidades o más
            </option>
          </select>
        </div>

        <div className="stock-toolbar__field">
          <label htmlFor="ordenStock">Ordenar por</label>

          <select
            id="ordenStock"
            value={orden}
            onChange={(evento) => setOrden(evento.target.value)}
          >
            <option value="prioridad">Prioridad de reposición</option>
            <option value="stock-asc">Menor stock primero</option>
            <option value="stock-desc">Mayor stock primero</option>
            <option value="nombre-asc">Nombre A–Z</option>
          </select>
        </div>

        <div className="stock-toolbar__footer">
          <span>
            Mostrando <strong>{productosFiltrados.length}</strong> de{" "}
            <strong>{productos.length}</strong> productos
          </span>

          {hayFiltrosActivos && (
            <button type="button" onClick={limpiarFiltros}>
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      <div className="stock-table-wrapper">
        <table className="stock-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Stock actual</th>
              <th>Prioridad de reposición</th>
              <th>Acción</th>
            </tr>
          </thead>

          <tbody>
            {productosFiltrados.length === 0 ? (
              <tr>
                <td colSpan="4">
                  No hay productos que coincidan con los filtros.
                </td>
              </tr>
            ) : (
              productosFiltrados.map((producto) => {
                const stock = producto.stock_prod == null ? null : Number(producto.stock_prod);
                const permiteAjuste = [2, 3, 4].includes(Number(producto.est_prod));

                const stockBajo = stock > 0 && stock < LIMITE_STOCK_BAJO;

                return (
                  <tr key={producto.id_prod}>
                    <td>
                      <div className="stock-table__identity">
                      <ImagenProductoStock ruta={producto.imagen_url} nombre={producto.nom_prod} />
                      <div className="stock-table__product">
                        <strong>{producto.nom_prod}</strong>
                        <small>Producto #{producto.id_prod}</small>
                        <span className="stock-brand">
                          {producto.nom_marca || "Sin marca"}
                          {producto.marca_destacar && (
                            <span className="stock-brand__featured">Destacada</span>
                          )}
                        </span>
                      </div>
                      </div>
                    </td>

                    <td>
                      <span
                        className={
                          stock !== null && stock <= 0
                            ? "stock-badge stock-agotado"
                            : stockBajo
                              ? "stock-badge stock-bajo"
                              : "stock-badge"
                        }
                      >
                        {stock === null ? "Sin registrar" : stock <= 0 ? "Sin stock" : stock}
                      </span>
                    </td>

                    <td>
                      <span className={`stock-alert stock-alert--${producto.prioridad_stock}`}>
                        {producto.alerta_stock}
                      </span>
                      <details className="stock-details">
                        <summary aria-label={`Ver detalle de ${producto.nom_prod}`}>Ver detalle</summary>
                        <dl>
                          <div>
                            <dt>Ventas en 30 días</dt>
                            <dd>{producto.unidades_vendidas_30_dias ?? 0}</dd>
                          </div>
                          <div>
                            <dt>Stock estimado para</dt>
                            <dd>
                              {producto.dias_cobertura == null
                                ? "Sin estimación"
                                : `${new Intl.NumberFormat("es-CL", { maximumFractionDigits: 1 }).format(producto.dias_cobertura)} días`}
                            </dd>
                          </div>
                          <div>
                            <dt>Estado del producto</dt>
                            <dd>{producto.nom_est_prod || "Sin estado"}</dd>
                          </div>
                        </dl>
                      </details>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="stock-table__adjust"
                        onClick={() => abrirAjusteStock(producto)}
                        disabled={actualizando || !permiteAjuste}
                        title={permiteAjuste ? "Solicitar un ajuste de stock" : "Espera la resolución de la solicitud pendiente"}
                      >
                        {permiteAjuste ? "Ajustar stock" : "En revisión"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {productoPorAjustar && (
        <div
          className="productos-modal-backdrop"
          role="presentation"
          onMouseDown={cerrarAjusteStock}
        >
          <form
            className="productos-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-ajuste-stock"
            onSubmit={guardarAjusteStock}
            onMouseDown={(evento) => evento.stopPropagation()}
          >
            <h2 id="titulo-ajuste-stock">Solicitar ajuste de stock</h2>

            <p>
              Producto: <strong>{productoPorAjustar.nom_prod}</strong>
            </p>

            <div className="stock-modal__field">
              <label htmlFor="nuevoStock">Nuevo stock</label>

              <input
                id="nuevoStock"
                type="text"
                inputMode="numeric"
                value={nuevoStock}
                onChange={(evento) => cambiarNuevoStock(evento.target.value)}
                disabled={actualizando}
                autoFocus
              />
            </div>

            {mensajeError && <p className="stock-modal__error" role="alert">{mensajeError}</p>}

            <p className="productos-modal__note">
              Se enviará la cantidad propuesta al administrador sin modificar el
              stock real. El producto quedará pendiente y fuera del catálogo.
              Al aprobar, quedará activo con existencias o no disponible con cero.
              Si se rechaza, conservará el stock real y quedará rechazado.
            </p>

            <div className="productos-modal__actions">
              <button
                type="submit"
                className="stock-modal__confirm"
                disabled={actualizando}
              >
                {actualizando ? "Enviando..." : "Enviar a aprobación"}
              </button>

              <button
                type="button"
                className="productos-modal__cancel"
                onClick={cerrarAjusteStock}
                disabled={actualizando}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

export default BodegueroStock;
