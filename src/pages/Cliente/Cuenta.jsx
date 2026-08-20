import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import "../css/cuenta.css";
function Cuenta() {
  const [usuario, setUsuario] = useState(null);
  const [correo, setCorreo] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarUsuario();
  }, []);

  async function cargarUsuario() {
    setCargando(true);
    setError("");

    // Obtener usuario autenticado
    const {
      data: { user },
      error: errorAuth,
    } = await supabase.auth.getUser();

    if (errorAuth) {
      console.error("Error obteniendo usuario:", errorAuth);
      setError("No fue posible obtener tu sesión.");
      setCargando(false);
      return;
    }

    if (!user) {
      setError("Debes iniciar sesión para ver tu cuenta.");
      setCargando(false);
      return;
    }

    // Correo obtenido desde Supabase Auth
    setCorreo(user.email || "");

    // Obtener información del usuario desde nuestra tabla
    const { data, error: errorUsuario } = await supabase
      .from("usuario")
      .select(`
        id_user,
        nom_user,
        rut_user,
        create_user,
        direc_user,
        phone_user,
        id_comuna,

        comuna (
          id_comuna,
          nom_comuna,

          region (
            id_reg,
            nom_reg
          )
        )
      `)
      .eq("id_user", user.id)
      .single();

    if (errorUsuario) {
      console.error(
        "Error cargando información del usuario:",
        errorUsuario
      );

      setError(
        errorUsuario.message ||
          "No fue posible cargar tu información."
      );

      setCargando(false);
      return;
    }

    setUsuario(data);
    setCargando(false);
  }

  function formatearFecha(fecha) {
    if (!fecha) {
      return "No disponible";
    }

    return new Intl.DateTimeFormat("es-CL", {
      dateStyle: "medium",
    }).format(new Date(fecha));
  }

  return (
    <main className="cuenta-page">

      {/* Encabezado */}

      <section className="cuenta-header">

        <span className="cuenta-eyebrow">
          MI CUENTA
        </span>

        <h1>
          Mi cuenta
        </h1>

        <p>
          Administra tu información personal y tus
          datos de contacto.
        </p>

      </section>


      {/* Cargando */}

      {cargando && (
        <div className="cuenta-status">
          <p>
            Cargando información...
          </p>
        </div>
      )}


      {/* Error */}

      {!cargando && error && (
        <div className="cuenta-status cuenta-status--error">

          <h2>
            No pudimos cargar tu cuenta
          </h2>

          <p>
            {error}
          </p>

          <button
            type="button"
            onClick={cargarUsuario}
          >
            Reintentar
          </button>

        </div>
      )}


      {/* Información de la cuenta */}

      {!cargando && !error && usuario && (
        <section className="cuenta-content">

          {/* Información personal */}

          <article className="cuenta-card">

            <div className="cuenta-card__header">

              <div>
                <span className="cuenta-card__eyebrow">
                  PERFIL
                </span>

                <h2>
                  Información personal
                </h2>
              </div>

              <div className="cuenta-card__icon">
                👤
              </div>

            </div>


            <div className="cuenta-fields">

              <div className="cuenta-field">
                <span>
                  Nombre
                </span>

                <strong>
                  {usuario.nom_user || "No registrado"}
                </strong>
              </div>


              <div className="cuenta-field">
                <span>
                  RUT
                </span>

                <strong>
                  {usuario.rut_user || "No registrado"}
                </strong>
              </div>


              <div className="cuenta-field">
                <span>
                  Teléfono
                </span>

                <strong>
                  {usuario.phone_user || "No registrado"}
                </strong>
              </div>

            </div>

          </article>


          {/* Ubicación */}

          <article className="cuenta-card">

            <div className="cuenta-card__header">

              <div>
                <span className="cuenta-card__eyebrow">
                  UBICACIÓN
                </span>

                <h2>
                  Datos de ubicación
                </h2>
              </div>

              <div className="cuenta-card__icon">
                📍
              </div>

            </div>


            <div className="cuenta-fields">

              <div className="cuenta-field">
                <span>
                  Dirección
                </span>

                <strong>
                  {usuario.direc_user || "No registrada"}
                </strong>
              </div>


              <div className="cuenta-field">
                <span>
                  Comuna
                </span>

                <strong>
                  {usuario.comuna?.nom_comuna ||
                    "No registrada"}
                </strong>
              </div>


              <div className="cuenta-field">
                <span>
                  Región
                </span>

                <strong>
                  {usuario.comuna?.region?.nom_reg ||
                    "No registrada"}
                </strong>
              </div>

            </div>

          </article>


          {/* Información de acceso */}

          <article className="cuenta-card">

            <div className="cuenta-card__header">

              <div>
                <span className="cuenta-card__eyebrow">
                  CUENTA
                </span>

                <h2>
                  Información de acceso
                </h2>
              </div>

              <div className="cuenta-card__icon">
                🔐
              </div>

            </div>


            <div className="cuenta-fields">

              <div className="cuenta-field">
                <span>
                  Correo
                </span>

                <strong>
                  {correo || "No registrado"}
                </strong>
              </div>


              <div className="cuenta-field">
                <span>
                  Cuenta creada
                </span>

                <strong>
                  {formatearFecha(
                    usuario.create_user
                  )}
                </strong>
              </div>

            </div>

          </article>

        </section>
      )}

    </main>
  );
}

export default Cuenta;