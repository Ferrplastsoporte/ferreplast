import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import BodegueroHeader from "./components/BodegueroHeader";
import {
  LONGITUD_MAXIMA_BUSQUEDA,
  sanitizarTerminoBusqueda,
} from "../../utils/comunes/busqueda";

import "./css/bodeguero.css";
import "./css/productos-bodeguero.css";
import "./css/stock.css";

const LIMITE_STOCK_BAJO = 10;

function formatearPrecio(valor) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(Number(valor) || 0);
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
  const [orden, setOrden] = useState("stock-asc");

  const [productoPorAjustar, setProductoPorAjustar] = useState(null);
  const [nuevoStock, setNuevoStock] = useState("");

  useEffect(() => {
    cargarProductos();
  }, []);

  async function cargarProductos() {
    setCargando(true);
    setMensajeError("");

    const { data, error } = await supabase
      .from("producto")
      .select(
        `
        id_prod,
        nom_prod,
        precio_prod,
        precio_act,
        imagen_url,
        est_prod,
        stock_prod,

        estado_producto (
          id_est_prod,
          nom_est_prod
        ),

        unidad_medida (
          id_und_medida,
          nom_und_medida
        )
      `,
      )
      .order("stock_prod", {
        ascending: true,
      });

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
          Number(producto.est_prod) === 2 &&
          Number(producto.stock_prod) > 0 &&
          Number(producto.stock_prod) < LIMITE_STOCK_BAJO,
      ),
    [productos],
  );

  const productosSinStock = useMemo(
    () =>
      productos.filter(
        (producto) =>
          Number(producto.est_prod) === 2 &&
          Number(producto.stock_prod) <= 0,
      ),
    [productos],
  );

  const unidadesDisponibles = useMemo(
    () =>
      productos
        .filter((producto) => Number(producto.est_prod) === 2)
        .reduce(
          (total, producto) => total + Math.max(Number(producto.stock_prod) || 0, 0),
          0,
        ),
    [productos],
  );

  const productosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLocaleLowerCase("es-CL");

    const productosCoincidentes = productos.filter((producto) => {
      const stock = Number(producto.stock_prod) || 0;
      const estado = Number(producto.est_prod);

      const coincideBusqueda =
        !texto || producto.nom_prod?.toLocaleLowerCase("es-CL").includes(texto);

      const coincideEstado =
        filtroEstado === "todos" || estado === Number(filtroEstado);

      const coincideStock =
        filtroStock === "todos" ||
        (filtroStock === "sin-stock" && stock <= 0) ||
        (filtroStock === "bajo" &&
          stock > 0 &&
          stock < LIMITE_STOCK_BAJO) ||
        (filtroStock === "suficiente" && stock >= LIMITE_STOCK_BAJO);

      return coincideBusqueda && coincideEstado && coincideStock;
    });

    return [...productosCoincidentes].sort((productoA, productoB) => {
      if (orden === "stock-desc") {
        return Number(productoB.stock_prod) - Number(productoA.stock_prod);
      }

      if (orden === "nombre-asc") {
        return (productoA.nom_prod || "").localeCompare(
          productoB.nom_prod || "",
          "es-CL",
        );
      }

      return Number(productoA.stock_prod) - Number(productoB.stock_prod);
    });
  }, [productos, busqueda, filtroEstado, filtroStock, orden]);

  const hayFiltrosActivos =
    busqueda.trim() ||
    filtroEstado !== "todos" ||
    filtroStock !== "todos" ||
    orden !== "stock-asc";

  function limpiarFiltros() {
    setBusqueda("");
    setFiltroEstado("todos");
    setFiltroStock("todos");
    setOrden("stock-asc");
  }

  function abrirAjusteStock(producto) {
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

    if (!Number.isInteger(stock) || stock < 0) {
      setMensajeError(
        "El stock debe ser un número entero igual o mayor que cero.",
      );
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
        `El stock de "${nombreProducto}" fue actualizado correctamente.`,
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

  if (cargando) {
    return (
      <section className="bodeguero-page">
        <p className="bodeguero-loading">Cargando inventario...</p>
      </section>
    );
  }

  return (
    <section className="bodeguero-page stock-page">
      <BodegueroHeader
        titulo="Gestión de stock"
        descripcion="Consulta y actualiza las existencias disponibles de los productos."
      />

      {mensajeExito && (
        <p
          className="bodeguero-message bodeguero-message--success"
          role="status"
        >
          {mensajeExito}
        </p>
      )}

      {mensajeError && (
        <div
          className="bodeguero-message bodeguero-message--error"
          role="alert"
        >
          <p>{mensajeError}</p>
        </div>
      )}

      <div className="stock-summary">
        <div>
          <span>Productos registrados</span>
          <strong>{productos.length}</strong>
        </div>

        <div>
          <span>Unidades disponibles</span>
          <strong>{unidadesDisponibles}</strong>
        </div>

        <div className={productosSinStock.length > 0 ? "stock-summary--danger" : ""}>
          <span>Productos sin stock</span>
          <strong>{productosSinStock.length}</strong>
        </div>

        <div className={productosStockBajo.length > 0 ? "stock-summary--warning" : ""}>
          <span>Productos con stock bajo</span>
          <strong>{productosStockBajo.length}</strong>
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
            placeholder="Buscar por nombre..."
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
            <option value="bajo">Bajo (1–{LIMITE_STOCK_BAJO - 1})</option>
            <option value="suficiente">
              Suficiente ({LIMITE_STOCK_BAJO} o más)
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
              <th>Unidad</th>
              <th>Estado</th>
              <th>Precio vigente</th>
              <th>Acción</th>
            </tr>
          </thead>

          <tbody>
            {productosFiltrados.length === 0 ? (
              <tr>
                <td colSpan="6">
                  No hay productos que coincidan con los filtros.
                </td>
              </tr>
            ) : (
              productosFiltrados.map((producto) => {
                const precioNormal = Number(producto.precio_prod);
                const precioActual = Number(producto.precio_act);

                const precioVigente =
                  precioActual > 0 ? precioActual : precioNormal;

                const stock = Number(producto.stock_prod);

                const stockBajo = stock > 0 && stock < LIMITE_STOCK_BAJO;

                return (
                  <tr key={producto.id_prod}>
                    <td>
                      <div className="stock-table__product">
                        <strong>{producto.nom_prod}</strong>
                        <small>Producto #{producto.id_prod}</small>
                      </div>
                    </td>

                    <td>
                      <span
                        className={
                          stock <= 0
                            ? "stock-badge stock-agotado"
                            : stockBajo
                              ? "stock-badge stock-bajo"
                              : "stock-badge"
                        }
                      >
                        {stock <= 0 ? "Sin stock" : stock}
                      </span>
                    </td>

                    <td>
                      {producto.unidad_medida?.nom_und_medida || "Sin unidad"}
                    </td>

                    <td>
                      <span className={`stock-status stock-status--${producto.est_prod}`}>
                        {producto.estado_producto?.nom_est_prod || "Sin estado"}
                      </span>
                    </td>

                    <td>{formatearPrecio(precioVigente)}</td>

                    <td>
                      <button
                        type="button"
                        className="stock-table__adjust"
                        onClick={() => abrirAjusteStock(producto)}
                      >
                        Ajustar stock
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
            onSubmit={guardarAjusteStock}
            onMouseDown={(evento) => evento.stopPropagation()}
          >
            <h2>Ajustar stock</h2>

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

            <p className="productos-modal__note">
              Este cambio actualizará las existencias disponibles del producto.
            </p>

            <div className="productos-modal__actions">
              <button
                type="submit"
                className="stock-modal__confirm"
                disabled={actualizando}
              >
                {actualizando ? "Actualizando..." : "Guardar stock"}
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
