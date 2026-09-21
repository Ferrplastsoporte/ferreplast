import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import {
  LONGITUD_MAXIMA_CORREO,
  sanitizarCorreo,
  validarCorreo,
} from "../../utils/comunes/correo";
import "./css/RecuperarPassword.css";

export default function RecuperarPassword() {
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMensaje("");
    setError("");

    const correo = sanitizarCorreo(email);
    const errorCorreo = validarCorreo(correo);

    if (errorCorreo) {
      setError(errorCorreo);
      return;
    }

    setEnviando(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        correo,
        {
          redirectTo: `${window.location.origin}/NuevaContrasena`,
        },
      );

      if (resetError) {
        console.error(
          "Error al solicitar recuperación de contraseña:",
          resetError,
        );
      }

      setMensaje(
        "Si existe una cuenta asociada a ese correo, recibirás un enlace para restablecer tu contraseña.",
      );

      setEmail("");
    } catch (err) {
      console.error("Error inesperado al recuperar contraseña:", err);

      setMensaje(
        "Si existe una cuenta asociada a ese correo, recibirás un enlace para restablecer tu contraseña.",
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="recuperar-password-page">
      <section className="recuperar-password-card">
        <div className="recuperar-password-header">
          <h1>Restablecer contraseña</h1>

          <p>
            Ingresa el correo electrónico asociado a tu cuenta. Te enviaremos un
            enlace para crear una nueva contraseña.
          </p>
        </div>

        <form className="recuperar-password-form" onSubmit={handleSubmit}>
          <div className="recuperar-password-field">
            <label htmlFor="email">Correo electrónico</label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(sanitizarCorreo(e.target.value));
                if (error) setError("");
              }}
              placeholder="correo@ejemplo.cl"
              autoComplete="email"
              disabled={enviando}
              maxLength={LONGITUD_MAXIMA_CORREO}
              aria-invalid={Boolean(error)}
              required
            />
          </div>

          {error && (
            <div
              className="recuperar-password-message recuperar-password-message--error"
              role="alert"
            >
              {error}
            </div>
          )}

          {mensaje && (
            <div
              className="recuperar-password-message recuperar-password-message--success"
              role="status"
            >
              {mensaje}
            </div>
          )}

          <button
            className="recuperar-password-button"
            type="submit"
            disabled={enviando}
          >
            {enviando ? "Enviando..." : "Enviar enlace de recuperación"}
          </button>
        </form>

        <div className="recuperar-password-footer">
          <Link to="/login">Volver a iniciar sesión</Link>
        </div>
      </section>
    </main>
  );
}
