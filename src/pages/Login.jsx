import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "./Login.css";

const FORMULARIO_INICIAL = {
  email: "",
  password: "",
};

function Login() {
  const navigate = useNavigate();

  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);
  const [errores, setErrores] = useState({});
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [modal, setModal] = useState({
    visible: false,
    tipo: "",
    titulo: "",
    mensaje: "",
  });

  function actualizarCampo(e) {
    const { name, value } = e.target;

    const formularioActualizado = {
      ...formulario,
      [name]: value,
    };

    setFormulario(formularioActualizado);

    if (errores[name]) {
      setErrores((anteriores) => ({
        ...anteriores,
        [name]: validarCampo(name, value),
      }));
    }
  }

  function validarCampo(nombreCampo, valor) {
    const valorLimpio =
      typeof valor === "string" ? valor.trim() : valor;

    switch (nombreCampo) {
      case "email":
        if (!valorLimpio) {
          return "Debes ingresar tu correo electrónico.";
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valorLimpio)) {
          return "Ingresa un correo electrónico válido.";
        }

        return "";

      case "password":
        if (!valor) {
          return "Debes ingresar tu contraseña.";
        }

        if (valor.length < 8) {
          return "La contraseña debe tener al menos 8 caracteres.";
        }

        return "";

      default:
        return "";
    }
  }

  function validarAlSalir(e) {
    const { name, value } = e.target;

    setErrores((anteriores) => ({
      ...anteriores,
      [name]: validarCampo(name, value),
    }));
  }

  function validarFormulario() {
    const nuevosErrores = {
      email: validarCampo("email", formulario.email),
      password: validarCampo("password", formulario.password),
    };

    Object.keys(nuevosErrores).forEach((campo) => {
      if (!nuevosErrores[campo]) {
        delete nuevosErrores[campo];
      }
    });

    setErrores(nuevosErrores);

    return Object.keys(nuevosErrores).length === 0;
  }

  function abrirModal(tipo, titulo, mensaje) {
    setModal({
      visible: true,
      tipo,
      titulo,
      mensaje,
    });
  }

  function cerrarModal() {
    setModal({
      visible: false,
      tipo: "",
      titulo: "",
      mensaje: "",
    });
  }

  function traducirErrorLogin(error) {
    const mensaje = error?.message?.toLowerCase() ?? "";

    if (
      mensaje.includes("invalid login credentials") ||
      mensaje.includes("invalid credentials")
    ) {
      return "El correo o la contraseña ingresados no son correctos.";
    }

    if (
      mensaje.includes("email not confirmed") ||
      mensaje.includes("email_not_confirmed")
    ) {
      return "Debes confirmar tu correo electrónico antes de iniciar sesión.";
    }

    if (
      mensaje.includes("too many requests") ||
      mensaje.includes("rate limit")
    ) {
      return "Se realizaron demasiados intentos. Espera unos minutos antes de intentarlo nuevamente.";
    }

    if (mensaje.includes("network")) {
      return "No fue posible conectarse con el servidor. Revisa tu conexión a internet.";
    }

    return "No fue posible iniciar sesión. Inténtalo nuevamente.";
  }

  async function cerrarSesionSegura() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("No se pudo cerrar la sesión:", error);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();

    if (loading || !validarFormulario()) {
      return;
    }

    setLoading(true);

    try {
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: formulario.email.trim().toLowerCase(),
          password: formulario.password,
        });

      if (error) {
        abrirModal(
          "error",
          "No se pudo iniciar sesión",
          traducirErrorLogin(error)
        );

        return;
      }

      if (!data?.user || !data?.session) {
        abrirModal(
          "error",
          "Sesión no disponible",
          "No fue posible obtener la sesión del usuario."
        );

        return;
      }

      const { data: usuario, error: errorUsuario } = await supabase
        .from("usuario")
        .select("id_user, nom_user, est_user, rol_user")
        .eq("id_user", data.user.id)
        .single();

      if (errorUsuario || !usuario) {
        console.error(
          "No se pudo obtener el perfil:",
          errorUsuario
        );

        await cerrarSesionSegura();

        abrirModal(
          "error",
          "Perfil no disponible",
          "No fue posible encontrar la información asociada a tu cuenta."
        );

        return;
      }

      if (usuario.est_user !== true) {
        await cerrarSesionSegura();

        abrirModal(
          "warning",
          "Cuenta pendiente de activación",
          "Debes confirmar tu correo electrónico antes de iniciar sesión."
        );

        return;
      }

      setFormulario(FORMULARIO_INICIAL);
      setErrores({});

      // Cambia "/" si tu página principal utiliza otra ruta.
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Error inesperado al iniciar sesión:", error);

      await cerrarSesionSegura();

      abrirModal(
        "error",
        "Ocurrió un problema inesperado",
        "No fue posible completar el inicio de sesión."
      );
    } finally {
      setLoading(false);
    }
  }

  function claseCampo(nombreCampo) {
    return errores[nombreCampo]
      ? "login-control login-control--error"
      : "login-control";
  }

  return (
    <main className="login-container">
      <section className="login-card">
        <div className="login-header">
          <h1>Iniciar sesión</h1>

          <p>
            Ingresa con tu correo electrónico y contraseña.
          </p>
        </div>

        <form
          className="login-form"
          onSubmit={handleLogin}
          noValidate
        >
          <div className="login-group">
            <label htmlFor="email">
              Correo electrónico
            </label>

            <input
              id="email"
              name="email"
              type="email"
              className={claseCampo("email")}
              value={formulario.email}
              onChange={actualizarCampo}
              onBlur={validarAlSalir}
              autoComplete="email"
              maxLength={120}
              placeholder="correo@ejemplo.cl"
              aria-invalid={Boolean(errores.email)}
              aria-describedby="login-error-email"
            />

            {errores.email && (
              <span
                id="login-error-email"
                className="login-error"
              >
                {errores.email}
              </span>
            )}
          </div>

          <div className="login-group">
            <label htmlFor="password">
              Contraseña
            </label>

            <div className="login-password-wrapper">
              <input
                id="password"
                name="password"
                type={mostrarPassword ? "text" : "password"}
                className={claseCampo("password")}
                value={formulario.password}
                onChange={actualizarCampo}
                onBlur={validarAlSalir}
                autoComplete="current-password"
                placeholder="Ingresa tu contraseña"
                aria-invalid={Boolean(errores.password)}
                aria-describedby="login-error-password"
              />

              <button
                type="button"
                className="login-password-toggle"
                onClick={() =>
                  setMostrarPassword((estado) => !estado)
                }
                aria-label={
                  mostrarPassword
                    ? "Ocultar contraseña"
                    : "Mostrar contraseña"
                }
              >
                {mostrarPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>

            {errores.password && (
              <span
                id="login-error-password"
                className="login-error"
              >
                {errores.password}
              </span>
            )}
          </div>

          <button
            type="submit"
            className="login-submit"
            disabled={loading}
          >
            {loading
              ? "Iniciando sesión..."
              : "Iniciar sesión"}
          </button>
        </form>

        <p className="login-register">
          ¿Todavía no tienes una cuenta?{" "}
          <button
            type="button"
            onClick={() => navigate("/registro")}
          >
            Crear cuenta
          </button>
        </p>
      </section>

      {modal.visible && (
        <div
          className="login-modal-overlay"
          role="presentation"
          onMouseDown={cerrarModal}
        >
          <div
            className={`login-modal login-modal--${modal.tipo}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-modal-title"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h2 id="login-modal-title">
              {modal.titulo}
            </h2>

            <p>{modal.mensaje}</p>

            <button
              type="button"
              onClick={cerrarModal}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default Login;