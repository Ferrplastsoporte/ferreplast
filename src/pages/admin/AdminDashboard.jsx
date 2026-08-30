import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

import AdminHeader from "./components/AdminHeader";
import TarjetaEstadistica from "../../components/estadisticas/TarjetaEstadistica";

import "./css/admin.css";

function AdminDashboard() {
  const [resumen, setResumen] = useState({
    trabajadores: 0,
    administradores: 0,
    bodegueros: 0,
    trabajadoresActivos: 0,
    trabajadoresInactivos: 0,
    productosPendientes: 0,
    marcasPendientes: 0,
  });

  const [cargando, setCargando] = useState(true);
  const [mensajeError, setMensajeError] = useState("");

  useEffect(() => {
    cargarResumen();
  }, []);

  async function cargarResumen() {
    setCargando(true);
    setMensajeError("");

    try {
      const [
        trabajadoresResultado,
        administradoresResultado,
        bodeguerosResultado,
        trabajadoresActivosResultado,
        trabajadoresInactivosResultado,
        productosPendientesResultado,
        marcasPendientesResultado,
      ] = await Promise.all([
        // Administradores + bodegueros
        supabase
          .from("usuario")
          .select("*", {
            count: "exact",
            head: true,
          })
          .in("rol_user", [1, 2]),

        // Administradores
        supabase
          .from("usuario")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("rol_user", 1),

        // Bodegueros
        supabase
          .from("usuario")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("rol_user", 2),

        // Trabajadores activos
        supabase
          .from("usuario")
          .select("*", {
            count: "exact",
            head: true,
          })
          .in("rol_user", [1, 2])
          .eq("est_user", true),

        // Trabajadores inactivos
        supabase
          .from("usuario")
          .select("*", {
            count: "exact",
            head: true,
          })
          .in("rol_user", [1, 2])
          .eq("est_user", false),

        // Productos pendientes
        supabase
          .from("producto")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("est_prod", 1),

        // Marcas pendientes
        supabase
          .from("marca_producto")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("est_marca", false),
      ]);

      const resultados = [
        trabajadoresResultado,
        administradoresResultado,
        bodeguerosResultado,
        trabajadoresActivosResultado,
        trabajadoresInactivosResultado,
        productosPendientesResultado,
        marcasPendientesResultado,
      ];

      const existeError = resultados.some((resultado) => resultado.error);

      if (existeError) {
        console.error(
          "Error al cargar el dashboard administrativo:",
          resultados,
        );

        setMensajeError(
          "No fue posible cargar completamente el resumen administrativo.",
        );

        return;
      }

      setResumen({
        trabajadores: trabajadoresResultado.count ?? 0,
        administradores: administradoresResultado.count ?? 0,
        bodegueros: bodeguerosResultado.count ?? 0,

        trabajadoresActivos: trabajadoresActivosResultado.count ?? 0,

        trabajadoresInactivos: trabajadoresInactivosResultado.count ?? 0,

        productosPendientes: productosPendientesResultado.count ?? 0,

        marcasPendientes: marcasPendientesResultado.count ?? 0,
      });
    } catch (error) {
      console.error("Error inesperado al cargar el dashboard:", error);

      setMensajeError("Ocurrió un error al cargar el resumen administrativo.");
    } finally {
      setCargando(false);
    }
  }

  const totalPendientes =
    resumen.productosPendientes + resumen.marcasPendientes;

  if (cargando) {
    return (
      <section className="admin-page">
        <p className="admin-loading">Cargando resumen administrativo...</p>
      </section>
    );
  }

  return (
    <section className="admin-page">
      <AdminHeader
        titulo="Panel de Administración"
        descripcion="Consulta el estado general del sistema y las tareas que requieren supervisión administrativa."
      />

      {mensajeError && (
        <div className="admin-message admin-message--error" role="alert">
          <p>{mensajeError}</p>

          <button type="button" className="admin-btn" onClick={cargarResumen}>
            Reintentar
          </button>
        </div>
      )}

      <div className="admin-stats-grid">
        <TarjetaEstadistica titulo="Trabajadores" valor={resumen.trabajadores} />

        <TarjetaEstadistica titulo="Administradores" valor={resumen.administradores} />

        <TarjetaEstadistica titulo="Bodegueros" valor={resumen.bodegueros} />

        <TarjetaEstadistica titulo="Pendientes de aprobación" valor={totalPendientes} />
      </div>

      <div className="admin-dashboard-grid">
        <section className="admin-section admin-section--dashboard">
          <div className="admin-section__header">
            <h2>Estado del personal</h2>

            <p>Resumen de las cuentas internas habilitadas en el sistema.</p>
          </div>

          <div className="admin-summary-list">
            <div className="admin-summary-item">
              <span>Administradores</span>
              <strong>{resumen.administradores}</strong>
            </div>

            <div className="admin-summary-item">
              <span>Bodegueros</span>
              <strong>{resumen.bodegueros}</strong>
            </div>

            <div className="admin-summary-item">
              <span>Cuentas activas</span>
              <strong>{resumen.trabajadoresActivos}</strong>
            </div>

            <div className="admin-summary-item">
              <span>Cuentas inactivas</span>
              <strong>{resumen.trabajadoresInactivos}</strong>
            </div>
          </div>
        </section>

        <section className="admin-section admin-section--dashboard">
          <div className="admin-section__header">
            <h2>Aprobaciones pendientes</h2>

            <p>
              Elementos enviados por bodega que requieren revisión
              administrativa.
            </p>
          </div>

          <div className="admin-summary-list">
            <div className="admin-summary-item">
              <span>Productos pendientes</span>
              <strong>{resumen.productosPendientes}</strong>
            </div>

            <div className="admin-summary-item">
              <span>Marcas pendientes</span>
              <strong>{resumen.marcasPendientes}</strong>
            </div>

            <div className="admin-summary-item">
              <span>Total por revisar</span>
              <strong>{totalPendientes}</strong>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}

export default AdminDashboard;
