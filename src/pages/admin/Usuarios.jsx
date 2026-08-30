import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

import AdminHeader from "./components/AdminHeader";
import TablaUsuarios from "../../components/usuarios/TablaUsuarios";

import "./css/admin.css";

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensajeError, setMensajeError] = useState("");

  useEffect(() => {
    cargarUsuarios();
  }, []);

  async function cargarUsuarios() {
    setCargando(true);
    setMensajeError("");

    try {
      const { data, error } = await supabase
        .from("usuario")
        .select(`
          id_user,
          nom_user,
          rut_user,
          phone_user,
          est_user,
          rol_user,
          rol_user (
            id_rol,
            nom_rol
          )
        `)
        .in("rol_user", [1, 2])
        .order("nom_user", { ascending: true });

      if (error) {
        console.error(
          "Error al cargar los trabajadores:",
          error,
        );

        setMensajeError(
          "No fue posible cargar los trabajadores.",
        );

        return;
      }

      setUsuarios(data ?? []);
    } catch (error) {
      console.error(
        "Error inesperado al cargar los trabajadores:",
        error,
      );

      setMensajeError(
        "Ocurrió un error al cargar los trabajadores.",
      );
    } finally {
      setCargando(false);
    }
  }

  function manejarEditar(usuario) {
    console.log("Editar trabajador:", usuario);
  }

  function manejarCambiarEstado(usuario) {
    console.log(
      usuario.est_user
        ? "Deshabilitar trabajador:"
        : "Habilitar trabajador:",
      usuario,
    );
  }

  return (
    <section className="admin-page">
      <AdminHeader
        titulo="Gestión de trabajadores"
        descripcion="Consulta y administra las cuentas internas con acceso al sistema."
      />

      {mensajeError && (
        <div
          className="admin-message admin-message--error"
          role="alert"
        >
          <p>{mensajeError}</p>

          <button
            type="button"
            className="admin-btn"
            onClick={cargarUsuarios}
          >
            Reintentar
          </button>
        </div>
      )}

      <section className="admin-section">
        <div className="admin-section__header">
          <div>
            <h2>Trabajadores</h2>

            <p>
              Administradores y bodegueros registrados en el sistema.
            </p>
          </div>
        </div>

        {cargando ? (
          <p className="admin-loading">
            Cargando trabajadores...
          </p>
        ) : (
          <TablaUsuarios
            usuarios={usuarios}
            onEditar={manejarEditar}
            onCambiarEstado={manejarCambiarEstado}
          />
        )}
      </section>
    </section>
  );
}

export default Usuarios;
