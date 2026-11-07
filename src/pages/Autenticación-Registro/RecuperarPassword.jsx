import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import Captcha from "../../components/auth/Captcha";
import useCaptcha from "../../hooks/useCaptcha";
import {
  LONGITUD_MAXIMA_CORREO,
  sanitizarCorreo,
  validarCorreo,
} from "../../utils/comunes/correo";
import "./css/RecuperarPassword.css";

export default function RecuperarPassword() {
  const captcha = useCaptcha();
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const envioEnCurso = useRef(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (envioEnCurso.current || enviando || captcha.pendiente) return;

    setMensaje("");
    setError("");

    const correo = sanitizarCorreo(email);
    const errorCorreo = validarCorreo(correo);

    if (errorCorreo) {
      setError(errorCorreo);
      return;
    }

    envioEnCurso.current = true;
    setEnviando(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        correo,
        {
          redirectTo: `${window.location.origin}/NuevaContrasena`,
          captchaToken: captcha.token,
        },
      );

      if (resetError && !["user_not_found", "email_not_confirmed"].includes(resetError.code)) {
        if (resetError.code === "captcha_failed" || /captcha/i.test(resetError.message)) {
          setError("La verificación de seguridad falló o venció. Complétala nuevamente.");
          return;
        }
        if (resetError.status === 429) {
          setError("Has realizado demasiados intentos. Espera unos minutos.");
          return;
        }
        console.error(
          "Error al solicitar recuperación de contraseña:",
          { codigo: resetError?.code, estado: resetError?.status },
        );
        setError("No se pudo procesar la solicitud. Revisa tu conexión e inténtalo nuevamente.");
        return;
      }

      setMensaje(
        "Si existe una cuenta asociada a ese correo, recibirás un enlace para restablecer tu contraseña.",
      );

      setEmail("");
    } catch (err) {
      console.error("Error inesperado al recuperar contraseña:", { codigo: err?.code, estado: err?.status });
      setError("No se pudo procesar la solicitud. Revisa tu conexión e inténtalo nuevamente.");
    } finally {
      captcha.reiniciar();
      setEnviando(false);
      envioEnCurso.current = false;
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

        <form className="recuperar-password-form" onSubmit={handleSubmit} noValidate>
          <div className="recuperar-password-field">
            <label htmlFor="email">Correo electrónico</label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(sanitizarCorreo(e.target.value));
                if (error) setError("");
                if (mensaje) setMensaje("");
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

          <Captcha onToken={captcha.setToken} intento={captcha.intento} />
          <button
            className="recuperar-password-button"
            type="submit"
            disabled={enviando || captcha.pendiente}
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
