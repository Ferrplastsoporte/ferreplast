import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

import BodegueroHeader from "./components/BodegueroHeader";

import "./css/bodeguero.css";
import "./css/productos-bodeguero.css";

const LIMITE_STOCK_BAJO = 10;

function formatearPrecio(valor) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(Number(valor) || 0);
}

function BodegueroStock() {
  const [productos, setProductos] =
    useState([]);

  const [cargando, setCargando] =
    useState(true);

  const [actualizando, setActualizando] =
    useState(false);

  const [mensajeError, setMensajeError] =
    useState("");

  const [mensajeExito, setMensajeExito] =
    useState("");

  const [busqueda, setBusqueda] =
    useState("");

  const [soloStockBajo, setSoloStockBajo] =
    useState(false);

  const [
    productoPorAjustar,
    setProductoPorAjustar,
  ] = useState(null);

  const [nuevoStock, setNuevoStock] =
    useState("");

  useEffect(() => {
    cargarProductos();
  }, []);

  async function cargarProductos() {
    setCargando(true);
    setMensajeError("");

    const { data, error } = await supabase
      .from("producto")
      .select(`
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
      `)
      .order("stock_prod", {
        ascending: true,
      });

    if (error) {
      console.error(
        "Error al cargar el stock:",
        error,
      );

      setMensajeError(
        "No fue posible cargar el inventario.",
      );

      setProductos([]);
      setCargando(false);
      return;
    }

    setProductos(data ?? []);
    setCargando(false);
  }

  const productosStockBajo = useMemo(
    () =>
      productos.filter(
        (producto) =>
          Number(producto.est_prod) === 2 &&
          Number(producto.stock_prod) <
            LIMITE_STOCK_BAJO,
      ),
    [productos],
  );

  const productosFiltrados = useMemo(() => {
    const texto =
      busqueda.trim().toLocaleLowerCase(
        "es-CL",
      );

    return productos.filter((producto) => {
      const coincideBusqueda =
        !texto ||
        producto.nom_prod
          ?.toLocaleLowerCase("es-CL")
          .includes(texto);

      const coincideStock =
        !soloStockBajo ||
        (Number(producto.est_prod) === 2 &&
          Number(producto.stock_prod) <
            LIMITE_STOCK_BAJO);

      return (
        coincideBusqueda &&
        coincideStock
      );
    });
  }, [
    productos,
    busqueda,
    soloStockBajo,
  ]);

  function abrirAjusteStock(producto) {
    setProductoPorAjustar(producto);

    setNuevoStock(
      String(
        Number(producto.stock_prod) || 0,
      ),
    );

    setMensajeError("");
    setMensajeExito("");
  }

  function cerrarAjusteStock() {
    if (actualizando) {
      return;
    }

    setProductoPorAjustar(null);
    setNuevoStock("");
  }

  function cambiarNuevoStock(valor) {
    setNuevoStock(
      String(valor).replace(/\D/g, ""),
    );
  }

  async function guardarAjusteStock(
    evento,
  ) {
    evento.preventDefault();

    if (
      !productoPorAjustar ||
      actualizando
    ) {
      return;
    }

    const stock = Number(nuevoStock);

    if (
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      setMensajeError(
        "El stock debe ser un número entero igual o mayor que cero.",
      );

      return;
    }

    setActualizando(true);
    setMensajeError("");
    setMensajeExito("");

    const { error } = await supabase
      .from("producto")
      .update({
        stock_prod: stock,
      })
      .eq(
        "id_prod",
        productoPorAjustar.id_prod,
      );

    if (error) {
      console.error(
        "Error al ajustar el stock:",
        error,
      );

      setMensajeError(
        "No fue posible actualizar el stock del producto.",
      );

      setActualizando(false);
      return;
    }

    setMensajeExito(
      `El stock de "${productoPorAjustar.nom_prod}" fue actualizado correctamente.`,
    );

    setProductoPorAjustar(null);
    setNuevoStock("");

    await cargarProductos();

    setActualizando(false);
  }

  if (cargando) {
    return (
      <section className="bodeguero-page">
        <p className="bodeguero-loading">
          Cargando inventario...
        </p>
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

          <strong>
            {productos.length}
          </strong>
        </div>

        <div>
          <span>Productos con stock bajo</span>

          <strong>
            {productosStockBajo.length}
          </strong>
        </div>
      </div>

      <div className="stock-toolbar">
        <div className="stock-toolbar__search">
          <label htmlFor="buscarStock">
            Buscar producto
          </label>

          <input
            id="buscarStock"
            type="search"
            value={busqueda}
            onChange={(evento) =>
              setBusqueda(
                evento.target.value,
              )
            }
            placeholder="Buscar por nombre..."
          />
        </div>

        <label className="stock-toolbar__filter">
          <input
            type="checkbox"
            checked={soloStockBajo}
            onChange={(evento) =>
              setSoloStockBajo(
                evento.target.checked,
              )
            }
          />

          Mostrar solo stock bajo
        </label>
      </div>

      <div className="stock-table-wrapper">
        <table className="stock-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Estado</th>
              <th>Precio vigente</th>
              <th>Stock actual</th>
              <th>Unidad</th>
              <th>Acción</th>
            </tr>
          </thead>

          <tbody>
            {productosFiltrados.length ===
            0 ? (
              <tr>
                <td colSpan="6">
                  No hay productos que coincidan
                  con los filtros.
                </td>
              </tr>
            ) : (
              productosFiltrados.map(
                (producto) => {
                  const precioNormal = Number(
                    producto.precio_prod,
                  );

                  const precioActual = Number(
                    producto.precio_act,
                  );

                  const precioVigente =
                    precioActual > 0
                      ? precioActual
                      : precioNormal;

                  const stock = Number(
                    producto.stock_prod,
                  );

                  const stockBajo =
                    Number(
                      producto.est_prod,
                    ) === 2 &&
                    stock <
                      LIMITE_STOCK_BAJO;

                  return (
                    <tr
                      key={
                        producto.id_prod
                      }
                    >
                      <td>
                        <strong>
                          {
                            producto.nom_prod
                          }
                        </strong>
                      </td>

                      <td>
                        {producto
                          .estado_producto
                          ?.nom_est_prod ||
                          "Sin estado"}
                      </td>

                      <td>
                        {formatearPrecio(
                          precioVigente,
                        )}
                      </td>

                      <td>
                        <span
                          className={
                            stockBajo
                              ? "stock-badge stock-bajo"
                              : "stock-badge"
                          }
                        >
                          {stock}
                        </span>
                      </td>

                      <td>
                        {producto
                          .unidad_medida
                          ?.nom_und_medida ||
                          "Sin unidad"}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="stock-table__adjust"
                          onClick={() =>
                            abrirAjusteStock(
                              producto,
                            )
                          }
                        >
                          Ajustar stock
                        </button>
                      </td>
                    </tr>
                  );
                },
              )
            )}
          </tbody>
        </table>
      </div>

      {productoPorAjustar && (
        <div
          className="productos-modal-backdrop"
          role="presentation"
          onMouseDown={
            cerrarAjusteStock
          }
        >
          <form
            className="productos-modal"
            onSubmit={
              guardarAjusteStock
            }
            onMouseDown={(evento) =>
              evento.stopPropagation()
            }
          >
            <h2>Ajustar stock</h2>

            <p>
              Producto:{" "}
              <strong>
                {
                  productoPorAjustar.nom_prod
                }
              </strong>
            </p>

            <div className="stock-modal__field">
              <label htmlFor="nuevoStock">
                Nuevo stock
              </label>

              <input
                id="nuevoStock"
                type="text"
                inputMode="numeric"
                value={nuevoStock}
                onChange={(evento) =>
                  cambiarNuevoStock(
                    evento.target.value,
                  )
                }
                disabled={actualizando}
                autoFocus
              />
            </div>

            <p className="productos-modal__note">
              Este cambio actualizará las
              existencias disponibles del
              producto.
            </p>

            <div className="productos-modal__actions">
              <button
                type="submit"
                className="stock-modal__confirm"
                disabled={actualizando}
              >
                {actualizando
                  ? "Actualizando..."
                  : "Guardar stock"}
              </button>

              <button
                type="button"
                className="productos-modal__cancel"
                onClick={
                  cerrarAjusteStock
                }
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