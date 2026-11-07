import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { contextoEnlacePassword, supabase } from "../../lib/supabase";
import "./css/NuevaPassword.css";

const CLAVE_CONTEXTO = "ferreplast:auth:cambio-password";
const REQUISITOS = "Entre 8 y 72 caracteres, una mayúscula, una minúscula, un número y un símbolo.";
const CODIGOS_SESION_INVALIDA = [
  "bad_jwt", "session_not_found", "session_expired", "refresh_token_not_found",
  "refresh_token_already_used", "otp_expired",
];

// Solo identifica la sesión del flujo; Auth verifica el token en el servidor.
function obtenerIdSesion(session) {
  try {
    const payload = session?.access_token?.split(".")[1];
    const claims = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof claims.session_id === "string" ? claims.session_id : null;
  } catch {
    return null;
  }
}

function leerContexto() {
  try {
    return JSON.parse(window.sessionStorage.getItem(CLAVE_CONTEXTO));
  } catch {
    return null;
  }
}

function limpiarContexto() {
  contextoEnlacePassword.usado = true;
  try {
    window.sessionStorage.removeItem(CLAVE_CONTEXTO);
  } catch {
    // El formulario también funciona sin almacenamiento durante esta visita.
  }
}

function esSesionInvalida(error) {
  return error?.status === 401 || error?.status === 403
    || CODIGOS_SESION_INVALIDA.includes(error?.code);
}

function mensajeErrorPassword(error) {
  if (error?.code === "same_password") return "La nueva contraseña debe ser diferente de la anterior.";
  if (error?.code === "weak_password" || error?.name === "AuthWeakPasswordError") {
    return "La contraseña no cumple con los requisitos de seguridad. " + REQUISITOS;
  }
  if (error?.status === 429) return "Has realizado demasiados intentos. Espera unos minutos.";
  if (error?.code === "reauthentication_needed" || error?.code === "reauthentication_not_valid") {
    return "Necesitas verificar nuevamente tu identidad. Solicita otro enlace de recuperación.";
  }
  return "No se pudo guardar la contraseña. Revisa tu conexión e inténtalo nuevamente.";
}

function NuevaPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [verificando, setVerificando] = useState(true);
  const [sesionValida, setSesionValida] = useState(false);
  const [errorVerificacion, setErrorVerificacion] = useState("");
  const [correoCuenta, setCorreoCuenta] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [actualizada, setActualizada] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const [errorCierre, setErrorCierre] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const sesionVerificada = useRef(null);
  const envioEnCurso = useRef(false);
  const cierreEnCurso = useRef(false);
  const montado = useRef(false);
  const redireccion = useRef(null);

  useEffect(() => {
    let activo = true;
    montado.current = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!activo) return;
      const anterior = sesionVerificada.current;
      const cambioCuenta = anterior && (
        session?.user?.id !== anterior.idUsuario || obtenerIdSesion(session) !== anterior.idSesion
      );
      if (event === "SIGNED_OUT" || cambioCuenta) {
        sesionVerificada.current = null;
        limpiarContexto();
        setSesionValida(false);
        setVerificando(false);
      }
    });

    async function comprobarSesion() {
      try {
        // Esperar el procesamiento del enlace antes de aceptar una sesión guardada.
        const { error: errorInicial } = await supabase.auth.initialize();
        if (!activo) return;
        if (errorInicial || contextoEnlacePassword.error) {
          if (errorInicial && !esSesionInvalida(errorInicial)
            && (errorInicial.status >= 500 || errorInicial.name === "AuthRetryableFetchError")) {
            throw errorInicial;
          }
          limpiarContexto();
          return;
        }

        const { data: { session }, error: errorSesion } = await supabase.auth.getSession();
        if (!activo) return;
        if (errorSesion) throw errorSesion;
        const idSesion = obtenerIdSesion(session);
        if (!session || !idSesion) return;

        const guardado = leerContexto();
        const desdeEnlace = !contextoEnlacePassword.usado
          && ["recovery", "invite"].includes(contextoEnlacePassword.tipo)
          && contextoEnlacePassword.idSesion === idSesion;
        const desdeRecarga = guardado?.idUsuario === session.user.id
          && guardado?.idSesion === idSesion
          && ["recovery", "invite"].includes(guardado?.tipo);
        if (!desdeEnlace && !desdeRecarga) return;

        const contexto = {
          idUsuario: session.user.id, idSesion,
          tipo: desdeEnlace ? contextoEnlacePassword.tipo : guardado.tipo,
        };
        try {
          // Guardar solo el contexto de la sesión que procesó Auth.
          // Una recarga volverá a verificar el usuario con el servidor.
          window.sessionStorage.setItem(CLAVE_CONTEXTO, JSON.stringify(contexto));
        } catch {
          // El enlace también funciona sin sessionStorage durante esta visita.
        }

        const { data: { user }, error: errorUsuario } = await supabase.auth.getUser(session.access_token);
        if (errorUsuario) throw errorUsuario;
        if (!activo) return;
        const { data: { session: vigente }, error: errorVigente } = await supabase.auth.getSession();
        if (!activo) return;
        if (errorVigente) throw errorVigente;
        if (!user || user.id !== session.user.id || vigente?.user?.id !== user.id
          || obtenerIdSesion(vigente) !== idSesion) return;

        contextoEnlacePassword.usado = true;
        sesionVerificada.current = contexto;
        setCorreoCuenta(user.email ?? "");
        setSesionValida(true);
      } catch (error) {
        if (!activo) return;
        console.error("Error al verificar el enlace:", { codigo: error?.code, estado: error?.status });
        if (esSesionInvalida(error)) limpiarContexto();
        else setErrorVerificacion("No se pudo comprobar la sesión. Revisa tu conexión y recarga la página.");
      } finally {
        if (activo) setVerificando(false);
      }
    }
    comprobarSesion();
    return () => {
      activo = false;
      montado.current = false;
      subscription.unsubscribe();
      window.clearTimeout(redireccion.current);
    };
  }, []);

  function validarPassword() {
    if (!password) return "Ingresa una nueva contraseña.";
    if (password.length < 8 || password.length > 72 || !/[A-Z]/.test(password)
      || !/[a-z]/.test(password) || !/[0-9]/.test(password)
      || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) return REQUISITOS;
    if (!confirmarPassword) return "Repite la nueva contraseña.";
    if (password !== confirmarPassword) return "Las contraseñas no coinciden.";
    return "";
  }

  async function cerrarSesion() {
    if (cierreEnCurso.current) return;
    cierreEnCurso.current = true;
    setCerrando(true);
    setErrorCierre(false);
    try {
      // Conservar el alcance global que ya utilizaba esta pantalla.
      const { error } = await supabase.auth.signOut({ scope: "global" });
      if (error) throw error;
      if (!montado.current) return;
      redireccion.current = window.setTimeout(() => navigate("/login", { replace: true }), 1800);
    } catch (error) {
      if (!montado.current) return;
      console.error("Error al cerrar la sesión tras cambiar contraseña:", { codigo: error?.code, estado: error?.status });
      setErrorCierre(true);
      setCerrando(false);
      cierreEnCurso.current = false;
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (envioEnCurso.current || guardando || !sesionValida || actualizada) return;
    const errorValidacion = validarPassword();
    setMensaje(errorValidacion);
    if (errorValidacion) return;
    envioEnCurso.current = true;
    setGuardando(true);
    try {
      // Evitar aplicar el cambio a otra cuenta si la sesión cambió de pestaña.
      const esperado = sesionVerificada.current;
      const { data: { session }, error: errorSesion } = await supabase.auth.getSession();
      if (errorSesion) throw errorSesion;
      if (!esperado || session?.user?.id !== esperado.idUsuario
        || obtenerIdSesion(session) !== esperado.idSesion) {
        limpiarContexto();
        setSesionValida(false);
        return;
      }
      const { data, error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      if (!data?.user) throw new Error("Auth no confirmó el cambio.");
      if (!montado.current) return;
      limpiarContexto();
      setActualizada(true);
      setPassword("");
      setConfirmarPassword("");
      await cerrarSesion();
    } catch (error) {
      if (!montado.current) return;
      console.error("Error al actualizar contraseña:", { codigo: error?.code, estado: error?.status });
      if (esSesionInvalida(error)) {
        limpiarContexto();
        setSesionValida(false);
      } else setMensaje(mensajeErrorPassword(error));
    } finally {
      if (montado.current) setGuardando(false);
      envioEnCurso.current = false;
    }
  }

  if (verificando) return (
    <main className="nueva-password-page">
      <section className="nueva-password-card nueva-password-card--estado">
        <div className="nueva-password-loader" />
        <h1>Verificando enlace</h1><p>Estamos comprobando que el enlace sea válido.</p>
      </section>
    </main>
  );

  if (actualizada) return (
    <main className="nueva-password-page">
      <section className="nueva-password-card nueva-password-card--estado">
        <h1>Contraseña actualizada</h1>
        <p role={errorCierre ? "alert" : "status"}>{errorCierre
          ? "Tu contraseña ya cambió, pero no se pudo cerrar la sesión. Reintenta el cierre."
          : "Tu contraseña fue establecida correctamente. Volverás al inicio de sesión."}</p>
        <button type="button" className="nueva-password-button" disabled={cerrando} onClick={cerrarSesion}>
          {cerrando ? "Cerrando sesión..." : "Reintentar cierre de sesión"}
        </button>
      </section>
    </main>
  );

  if (!sesionValida) return (
    <main className="nueva-password-page">
      <section className="nueva-password-card nueva-password-card--estado">
        <div className="nueva-password-icon nueva-password-icon--error">!</div>
        <h1>{errorVerificacion ? "No se pudo verificar" : "Enlace no válido"}</h1>
        <p>{errorVerificacion || "Abre un enlace vigente de recuperación o invitación para establecer tu contraseña."}</p>
        {errorVerificacion && <button type="button" className="nueva-password-button" onClick={() => window.location.reload()}>Reintentar verificación</button>}
        <button type="button" className="nueva-password-button" onClick={() => navigate("/RecuperarContrasena")}>Solicitar otro enlace</button>
        <div className="nueva-password-footer"><button type="button" onClick={() => navigate("/login")}>Volver al inicio de sesión</button></div>
      </section>
    </main>
  );

  return (
    <main className="nueva-password-page">
      <section className="nueva-password-card">
        <div className="nueva-password-brand"><strong>FERREPLAST</strong><span>Seguridad de la cuenta</span></div>
        <div className="nueva-password-header">
          <h1>Nueva contraseña</h1>
          <p>{correoCuenta ? "Establece la contraseña de " + correoCuenta + "." : "Define una contraseña para acceder a tu cuenta."}</p>
        </div>
        {mensaje && <div className="nueva-password-message nueva-password-message--error" role="alert">{mensaje}</div>}
        <form className="nueva-password-form" onSubmit={handleSubmit} noValidate>
          <div className="nueva-password-field">
            <label htmlFor="nuevaPassword">Nueva contraseña</label>
            <input id="nuevaPassword" type="password" value={password} onChange={(event) => { setPassword(event.target.value); setMensaje(""); }}
              autoComplete="new-password" maxLength={72} disabled={guardando} aria-describedby="requisitosPassword" required />
            <small id="requisitosPassword">{REQUISITOS}</small>
          </div>
          <div className="nueva-password-field">
            <label htmlFor="confirmarNuevaPassword">Confirmar nueva contraseña</label>
            <input id="confirmarNuevaPassword" type="password" value={confirmarPassword} onChange={(event) => { setConfirmarPassword(event.target.value); setMensaje(""); }}
              autoComplete="new-password" maxLength={72} disabled={guardando} required />
          </div>
          <button type="submit" className="nueva-password-button" disabled={guardando}>{guardando ? "Guardando contraseña..." : "Guardar nueva contraseña"}</button>
        </form>
        <div className="nueva-password-footer"><button type="button" onClick={() => navigate("/login")} disabled={guardando}>Volver al inicio de sesión</button></div>
      </section>
    </main>
  );
}

export default NuevaPassword;
