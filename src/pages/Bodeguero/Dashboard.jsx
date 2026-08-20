import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";

import BodegueroHeader from "./components/BodegueroHeader";
import EstadoCatalogoChart from "./components/EstadoCatalogoChart";
import StatsCard from "../../components/estadisticas/StatsCard";

import {
  obtenerResumenBodega,
  obtenerUltimosProductos,
} from "../../utils/dashboardBodeguero";

import "./css/bodeguero.css";
import "./css/dashboard.css";
import "./css/productos-bodeguero.css";

function BodegueroDashboard() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensajeError, setMensajeError] = useState("");

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
        created_prod,
        est_prod,
        stock_prod,

        estado_producto (
          id_est_prod,
          nom_est_prod
        ),

        marca_producto (
          id_marca,
          nom_marca
        ),

        subcategoria (
          id_subcategoria,
          nom_subcategoria
        )
      `,
      )
      .order("created_prod", {
        ascending: false,
      });

    if (error) {
      console.error("Error al cargar el dashboard del bodeguero:", error);

      setProductos([]);
      setMensajeError("No fue posible cargar el resumen de productos.");
    } else {
      setProductos(data ?? []);
    }

    setCargando(false);
  }

  const resumen = useMemo(() => obtenerResumenBodega(productos), [productos]);

  const ultimosProductos = useMemo(
    () => obtenerUltimosProductos(productos, 5),
    [productos],
  );

  if (cargando) {
    return (
      <section className="bodeguero-page">
        <p className="bodeguero-loading">Cargando resumen...</p>
      </section>
    );
  }

  return (
    <section className="bodeguero-page dashboard-bodega">
      <BodegueroHeader
        titulo="Panel de Bodeguero"
        descripcion="Consulta el estado general del catálogo y las tareas que requieren atención."
      />

      {mensajeError && (
        <div
          className="bodeguero-message bodeguero-message--error"
          role="alert"
        >
          <p>{mensajeError}</p>

          <button type="button" onClick={cargarProductos}>
            Reintentar
          </button>
        </div>
      )}

      <div className="dashboard-bodega__overview">
        <EstadoCatalogoChart resumen={resumen} />

        <section className="dashboard-bodega__stats">
          <StatsCard
            titulo="Total productos"
            valor={resumen.total}
            icono="📦"
            color="blue"
          />

          <StatsCard
            titulo="Pendientes"
            valor={resumen.pendientes}
            icono="⏳"
            color="yellow"
          />

          <StatsCard
            titulo="Stock bajo"
            valor={resumen.stockBajo}
            icono="⚠️"
            color="red"
          />

          <StatsCard
            titulo="No disponibles"
            valor={resumen.noDisponibles}
            icono="⛔"
            color="red"
          />
        </section>
      </div>

      {(resumen.stockBajo > 0 ||
        resumen.pendientes > 0 ||
        resumen.noDisponibles > 0) && (
        <section className="dashboard-attention">
          <div className="dashboard-attention__header">
            <div>
              <span className="dashboard-attention__eyebrow">
                Atención requerida
              </span>

              <h2>Tareas pendientes de bodega</h2>

              <p>Revisa los elementos que podrían requerir alguna acción.</p>
            </div>
          </div>

          <div className="dashboard-attention__items">
            {resumen.stockBajo > 0 && (
              <div className="dashboard-attention__item">
                <div className="dashboard-attention__info">
                  <span className="dashboard-attention__icon">⚠️</span>

                  <div>
                    <strong>
                      {resumen.stockBajo}{" "}
                      {resumen.stockBajo === 1
                        ? "producto tiene"
                        : "productos tienen"}{" "}
                      stock bajo
                    </strong>

                    <p>
                      Revisa las existencias disponibles antes de que lleguen a
                      cero.
                    </p>
                  </div>
                </div>

                <Link to="/bodeguero/stock">Revisar stock</Link>
              </div>
            )}

            {resumen.pendientes > 0 && (
              <div className="dashboard-attention__item">
                <div className="dashboard-attention__info">
                  <span className="dashboard-attention__icon">⏳</span>

                  <div>
                    <strong>
                      {resumen.pendientes}{" "}
                      {resumen.pendientes === 1
                        ? "producto está"
                        : "productos están"}{" "}
                      pendiente de revisión
                    </strong>

                    <p>
                      Consulta las solicitudes que esperan revisión del
                      administrador.
                    </p>
                  </div>
                </div>

                <Link to="/bodeguero/solicitudes">Ver solicitudes</Link>
              </div>
            )}

            {resumen.noDisponibles > 0 && (
              <div className="dashboard-attention__item">
                <div className="dashboard-attention__info">
                  <span className="dashboard-attention__icon">⛔</span>

                  <div>
                    <strong>
                      {resumen.noDisponibles}{" "}
                      {resumen.noDisponibles === 1
                        ? "producto está"
                        : "productos están"}{" "}
                      no disponible
                    </strong>

                    <p>
                      Puedes revisar su stock o información desde la gestión de
                      productos.
                    </p>
                  </div>
                </div>

                <Link to="/bodeguero/productos">Gestionar productos</Link>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="bodega-section dashboard-recent">
        <div className="bodega-section__header">
          <div>
            <span className="dashboard-section__eyebrow">
              Actividad reciente
            </span>

            <h2>Últimos productos</h2>

            <p>
              Se muestran los cinco productos registrados más recientemente.
            </p>
          </div>

          <Link to="/bodeguero/productos">Ver todos</Link>
        </div>

        {ultimosProductos.length > 0 ? (
          <div className="dashboard-products-table-wrapper">
            <table className="dashboard-products-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Marca</th>
                  <th>Stock</th>
                  <th>Precio vigente</th>
                  <th>Estado</th>
                </tr>
              </thead>

              <tbody>
                {ultimosProductos.map((producto) => {
                  const precioNormal = Number(producto.precio_prod);
                  const precioActual = Number(producto.precio_act);

                  const precioVigente =
                    precioActual > 0 ? precioActual : precioNormal;

                  const estado = Number(producto.est_prod);

                  const estadoTexto =
                    estado === 1
                      ? "Pendiente"
                      : estado === 2
                        ? "Activo"
                        : estado === 3
                          ? "No disponible"
                          : "Sin estado";

                  const estadoClase =
                    estado === 1
                      ? "dashboard-status dashboard-status--pending"
                      : estado === 2
                        ? "dashboard-status dashboard-status--active"
                        : estado === 3
                          ? "dashboard-status dashboard-status--inactive"
                          : "dashboard-status";

                  return (
                    <tr key={producto.id_prod}>
                      <td>
                        <div className="dashboard-product">
                          <strong>{producto.nom_prod}</strong>

                          <span>
                            {producto.subcategoria?.nom_subcategoria ||
                              "Sin subcategoría"}
                          </span>
                        </div>
                      </td>

                      <td>
                        {producto.marca_producto?.nom_marca || "Sin marca"}
                      </td>

                      <td>{Number(producto.stock_prod)} unidades</td>

                      <td>
                        <strong>
                          {new Intl.NumberFormat("es-CL", {
                            style: "currency",
                            currency: "CLP",
                            maximumFractionDigits: 0,
                          }).format(precioVigente)}
                        </strong>
                      </td>

                      <td>
                        <span className={estadoClase}>{estadoTexto}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="dashboard-recent__empty">
            <p>Todavía no hay productos registrados.</p>

            <Link to="/bodeguero/productos">Gestionar productos</Link>
          </div>
        )}
      </section>
    </section>
  );
}

export default BodegueroDashboard;
