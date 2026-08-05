import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";

import BodegueroHeader from "./components/BodegueroHeader";
import StatsCard from "../../components/estadisticas/StatsCard";
import ProductTable from "../../components/productos/ProductTable";

import "./css/bodeguero.css";
import "./css/productos-bodeguero.css";

const LIMITE_STOCK_BAJO = 10;

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

      setMensajeError("No fue posible cargar el resumen de productos.");

      setProductos([]);
      setCargando(false);
      return;
    }

    setProductos(data ?? []);
    setCargando(false);
  }

  const resumen = useMemo(() => {
    const pendientes = productos.filter(
      (producto) => Number(producto.est_prod) === 1,
    );

    const activos = productos.filter(
      (producto) => Number(producto.est_prod) === 2,
    );

    const noDisponibles = productos.filter(
      (producto) => Number(producto.est_prod) === 3,
    );

    const stockBajo = productos.filter(
      (producto) =>
        Number(producto.est_prod) === 2 &&
        Number(producto.stock_prod) < LIMITE_STOCK_BAJO,
    );

    return {
      pendientes,
      activos,
      noDisponibles,
      stockBajo,
    };
  }, [productos]);

  if (cargando) {
    return (
      <section className="bodeguero-page">
        <p className="bodeguero-loading">Cargando resumen...</p>
      </section>
    );
  }

  return (
    <section className="bodeguero-page">
      <BodegueroHeader
        titulo="Panel de Bodeguero"
        descripcion="Consulta el estado general del catálogo y accede rápidamente a las tareas de bodega."
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

      <div className="bodega-stats">
        <StatsCard
          titulo="Total productos"
          valor={productos.length}
          icono="📦"
          color="blue"
        />

        <StatsCard
          titulo="Activos"
          valor={resumen.activos.length}
          icono="✅"
          color="green"
        />

        <StatsCard
          titulo="Pendientes"
          valor={resumen.pendientes.length}
          icono="⏳"
          color="yellow"
        />

        <StatsCard
          titulo="Stock bajo"
          valor={resumen.stockBajo.length}
          icono="⚠️"
          color="red"
        />
      </div>

      <div className="bodega-dashboard-actions">
        <Link
          to="/bodeguero/productos"
          className="bodega-dashboard-actions__link"
        >
          Gestionar productos
        </Link>

        <Link
          to="/bodeguero/stock"
          className="bodega-dashboard-actions__link bodega-dashboard-actions__link--secondary"
        >
          Revisar stock
        </Link>

        <Link
          to="/bodeguero/solicitudes"
          className="bodega-dashboard-actions__link bodega-dashboard-actions__link--secondary"
        >
          Ver productos pendientes
        </Link>
      </div>

      <section className="bodega-section">
        <div className="bodega-section__header">
          <div>
            <h2>Últimos productos</h2>

            <p>Se muestran los diez productos registrados más recientemente.</p>
          </div>

          <Link to="/bodeguero/productos">Ver todos</Link>
        </div>

        <ProductTable productos={productos.slice(0, 10)} modo="consulta" />
      </section>
    </section>
  );
}

export default BodegueroDashboard;
