import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";

import BodegueroHeader from "./components/BodegueroHeader";
import ProductTable from "../../components/productos/ProductTable";

import "./css/bodeguero.css";
import "./css/productos-bodeguero.css";

function BodegueroSolicitudes() {
  const [pendientes, setPendientes] =
    useState([]);

  const [cargando, setCargando] =
    useState(true);

  const [mensajeError, setMensajeError] =
    useState("");

  useEffect(() => {
    cargarPendientes();
  }, []);

  async function cargarPendientes() {
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
      `)
      .eq("est_prod", 1)
      .order("created_prod", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Error al cargar productos pendientes:",
        error,
      );

      setMensajeError(
        "No fue posible cargar los productos pendientes.",
      );

      setPendientes([]);
      setCargando(false);
      return;
    }

    setPendientes(data ?? []);
    setCargando(false);
  }

  if (cargando) {
    return (
      <section className="bodeguero-page">
        <p className="bodeguero-loading">
          Cargando productos pendientes...
        </p>
      </section>
    );
  }

  return (
    <section className="bodeguero-page">
      <BodegueroHeader
        titulo="Productos pendientes"
        descripcion="Consulta los productos que esperan revisión y aprobación del administrador."
      />

      {mensajeError && (
        <div
          className="bodeguero-message bodeguero-message--error"
          role="alert"
        >
          <p>{mensajeError}</p>

          <button
            type="button"
            onClick={cargarPendientes}
          >
            Reintentar
          </button>
        </div>
      )}

      {pendientes.length === 0 ? (
        <section className="bodega-empty-state">
          <h2>No hay productos pendientes</h2>

          <p>
            Todos los productos registrados ya
            fueron revisados o no hay productos
            nuevos esperando aprobación.
          </p>

          <Link to="/bodeguero/productos">
            Ir a gestión de productos
          </Link>
        </section>
      ) : (
        <>
          <div
            className="bodeguero-message bodeguero-message--info"
            role="status"
          >
            <p>
              {pendientes.length}{" "}
              {pendientes.length === 1
                ? "producto está"
                : "productos están"}{" "}
              esperando la revisión del
              administrador.
            </p>
          </div>

          <ProductTable
            productos={pendientes}
            modo="consulta"
          />
        </>
      )}
    </section>
  );
}

export default BodegueroSolicitudes;