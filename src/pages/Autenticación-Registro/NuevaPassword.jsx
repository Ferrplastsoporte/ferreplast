import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

import "./css/NuevaPassword.css";

function NuevaPassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");

  const [verificando, setVerificando] = useState(true);
  const [sesionValida, setSesionValida] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("");

  useEffect(() => {
    let activo = true;

    async function comprobarSesion() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (!activo) {
        return;
      }

      if (error) {
        console.error(
          "Error al comprobar sesión para nueva contraseña:",
          error,
        );
      }

      setSesionValida(Boolean(session));
      setVerificando(false);
    }

    comprobarSesion();

    /*
     * También escuchamos cambios de Auth porque
     * el usuario puede llegar desde:
     *
     * - una invitación
     * - un correo de recuperación de contraseña
     */
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!activo) {
        return;
      }

      if (
        event === "PASSWORD_RECOVERY" ||
        event === "SIGNED_IN" ||
        event === "INITIAL_SESSION"
      ) {
        setSesionValida(Boolean(session));
        setVerificando(false);
      }
    });

    return () => {
      activo = false;
      subscription.unsubscribe();
    };
  }, []);

  function validarPassword() {
    if (!password) {
      return "Ingresa una nueva contraseña.";
    }

    if (password.length < 8) {
      return "La contraseña debe tener al menos 8 caracteres.";
    }

    if (password.length > 72) {
      return "La contraseña es demasiado larga.";
    }

    if (password !== confirmarPassword) {
      return "Las contraseñas no coinciden.";
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (guardando || !sesionValida) {
      return;
    }

    setMensaje("");
    setTipoMensaje("");

    const errorValidacion = validarPassword();

    if (errorValidacion) {
      setMensaje(errorValidacion);
      setTipoMensaje("error");
      return;
    }

    setGuardando(true);

    try {
      /*
       * El enlace de invitación o recuperación
       * ya dejó al usuario autenticado temporalmente.
       * Ahora puede definir su contraseña.
       */
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        console.error("Error al actualizar contraseña:", error);

        setMensaje(
          "No fue posible actualizar la contraseña. El enlace puede haber expirado.",
        );

        setTipoMensaje("error");
        return;
      }

      setMensaje("Tu contraseña fue establecida correctamente.");

      setTipoMensaje("success");

      setPassword("");
      setConfirmarPassword("");

      /*
       * Cerramos la sesión temporal creada por
       * el enlace para que el usuario ingrese
       * normalmente con su nueva contraseña.
       */
      await supabase.auth.signOut();

      setTimeout(() => {
        navigate("/login", {
          replace: true,
        });
      }, 1800);
    } catch (error) {
      console.error("Error inesperado al actualizar contraseña:", error);

      setMensaje("Ocurrió un error inesperado. Inténtalo nuevamente.");

      setTipoMensaje("error");
    } finally {
      setGuardando(false);
    }
  }

  if (verificando) {
    return (
      <main className="nueva-password-page">
        <section className="nueva-password-card nueva-password-card--estado">
          <div className="nueva-password-loader" />

          <h1>Verificando enlace</h1>

          <p>Estamos comprobando que el enlace sea válido.</p>
        </section>
      </main>
    );
  }

  if (!sesionValida) {
    return (
      <main className="nueva-password-page">
        <section className="nueva-password-card nueva-password-card--estado">
          <div className="nueva-password-icon nueva-password-icon--error">
            !
          </div>

          <h1>Enlace no válido</h1>

          <p>
            El enlace utilizado ha expirado, ya fue utilizado o no corresponde a
            una solicitud válida.
          </p>

          <button
            type="button"
            className="nueva-password-button"
            onClick={() => navigate("/login")}
          >
            Volver al inicio de sesión
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="nueva-password-page">
      <section className="nueva-password-card">
        <div className="nueva-password-brand">
          <strong>FERREPLAST</strong>
          <span>Seguridad de la cuenta</span>
        </div>

        <div className="nueva-password-header">
          <h1>Nueva contraseña</h1>

          <p>Define una contraseña para acceder de forma segura a tu cuenta.</p>
        </div>

        {mensaje && (
          <div
            className={`nueva-password-message nueva-password-message--${tipoMensaje}`}
            role={tipoMensaje === "error" ? "alert" : "status"}
          >
            {mensaje}
          </div>
        )}

        <form
          className="nueva-password-form"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="nueva-password-field">
            <label htmlFor="nuevaPassword">Nueva contraseña</label>

            <input
              id="nuevaPassword"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setMensaje("");
              }}
              autoComplete="new-password"
              maxLength={72}
              disabled={guardando}
            />

            <small>Utiliza al menos 8 caracteres.</small>
          </div>

          <div className="nueva-password-field">
            <label htmlFor="confirmarNuevaPassword">
              Confirmar nueva contraseña
            </label>

            <input
              id="confirmarNuevaPassword"
              type="password"
              value={confirmarPassword}
              onChange={(event) => {
                setConfirmarPassword(event.target.value);
                setMensaje("");
              }}
              autoComplete="new-password"
              maxLength={72}
              disabled={guardando}
            />
          </div>

          <button
            type="submit"
            className="nueva-password-button"
            disabled={guardando}
          >
            {guardando ? "Guardando contraseña..." : "Guardar nueva contraseña"}
          </button>
        </form>

        <div className="nueva-password-footer">
          <button
            type="button"
            onClick={() => navigate("/login")}
            disabled={guardando}
          >
            Volver al inicio de sesión
          </button>
        </div>
      </section>
    </main>
  );
}

export default NuevaPassword;
