import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFormulario } from "../../hooks/useFormulario";
import { useAutenticacion } from "../../hooks/useAutenticacion";
import {
  isValidEmail,
  isValidPassword,
} from "../../utils/auth/validacionAutenticacion";
import { obtenerRutaInicialPorRol } from "../../utils/auth/autorizacion";
import {
  LONGITUD_MAXIMA_CORREO,
  sanitizarCorreo,
} from "../../utils/comunes/correo";
import Input from "../ui/Input";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import LoginMascot from "./LoginMascot";
import Captcha from "./Captcha";
import useCaptcha from "../../hooks/useCaptcha";

const RESEND_COOLDOWN_MS = 5 * 60_000;
const RESEND_COOLDOWN_STORAGE_KEY =
  "ferreplast:auth:resend-confirmation-available-at";

const getStoredResendAvailableAt = () => {
  try {
    const storedValue = Number(
      window.localStorage.getItem(RESEND_COOLDOWN_STORAGE_KEY),
    );

    return Number.isFinite(storedValue) && storedValue > Date.now()
      ? storedValue
      : 0;
  } catch {
    return 0;
  }
};

const INITIAL_VALUES = {
  email: "",
  password: "",
};

const sanitizeField = (name, value) =>
  name === "email" ? sanitizarCorreo(value) : value;

const validateField = (name, value) => {
  const val = typeof value === "string" ? value.trim() : value;

  switch (name) {
    case "email":
      if (!val) {
        return "Debes ingresar tu correo electrónico.";
      }

      if (!isValidEmail(val)) {
        return "Correo inválido.";
      }

      return "";

    case "password":
      if (!val) {
        return "Debes ingresar tu contraseña.";
      }

      if (!isValidPassword(val)) {
        return "Mínimo 8 caracteres, una mayúscula, una minúscula, un número y un símbolo.";
      }

      return "";

    default:
      return "";
  }
};

const LoginForm = () => {
  const navigate = useNavigate();
  const captcha = useCaptcha();

  const {
    values,
    errors,
    handleChange,
    handleBlur,
    validateForm,
  } = useFormulario(INITIAL_VALUES, validateField, sanitizeField);

  const {
    login,
    resendConfirmation,
    loading,
    resendingConfirmation,
    modal,
    hideModal,
  } = useAutenticacion();

  const [showPassword, setShowPassword] = useState(false);
  const [resendAvailableAt, setResendAvailableAt] = useState(
    getStoredResendAvailableAt,
  );
  const [resendCooldown, setResendCooldown] = useState(() =>
    Math.max(0, Math.ceil((getStoredResendAvailableAt() - Date.now()) / 1000)),
  );
  const resendCaptcha = useCaptcha();

  useEffect(() => {
    if (resendAvailableAt <= Date.now()) {
      try {
        window.localStorage.removeItem(RESEND_COOLDOWN_STORAGE_KEY);
      } catch {
        // El almacenamiento puede estar deshabilitado; Supabase mantiene su límite.
      }

      return undefined;
    }

    const timer = window.setInterval(() => {
      const remainingSeconds = Math.max(
        0,
        Math.ceil((resendAvailableAt - Date.now()) / 1000),
      );

      setResendCooldown(remainingSeconds);

      if (remainingSeconds === 0) {
        window.clearInterval(timer);

        try {
          window.localStorage.removeItem(RESEND_COOLDOWN_STORAGE_KEY);
        } catch {
          // El almacenamiento puede estar deshabilitado; Supabase mantiene su límite.
        }
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendAvailableAt]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading || captcha.pendiente) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    let perfilAutenticado;
    try {
      perfilAutenticado = await login(values.email, values.password, captcha.token);
    } finally {
      captcha.reiniciar();
    }

    if (!perfilAutenticado) {
      return;
    }

    navigate(obtenerRutaInicialPorRol(perfilAutenticado.rol_user), {
      replace: true,
    });
  };

  const handleResendConfirmation = async () => {
    if (
      resendingConfirmation ||
      resendCooldown > 0 ||
      resendCaptcha.pendiente
    ) {
      return;
    }

    try {
      const enviado = await resendConfirmation(
        values.email,
        resendCaptcha.token,
      );

      if (enviado) {
        const availableAt = Date.now() + RESEND_COOLDOWN_MS;

        setResendAvailableAt(availableAt);
        setResendCooldown(Math.ceil(RESEND_COOLDOWN_MS / 1000));

        try {
          window.localStorage.setItem(
            RESEND_COOLDOWN_STORAGE_KEY,
            String(availableAt),
          );
        } catch {
          // El contador seguirá funcionando mientras la página permanezca abierta.
        }
      }
    } finally {
      resendCaptcha.reiniciar();
    }
  };

  return (
    <form className="login-form" onSubmit={handleSubmit} noValidate>
      <LoginMascot />
      <Input
        label="Correo electrónico"
        name="email"
        type="email"
        value={values.email}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.email}
        placeholder="correo@ejemplo.cl"
        autoComplete="email"
        maxLength={LONGITUD_MAXIMA_CORREO}
      />

      <div className="login-group">
        <label htmlFor="password">Contraseña</label>

        <div className="login-password-wrapper">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            className={`login-control ${
              errors.password ? "login-control--error" : ""
            }`}
            value={values.password}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Ingresa tu contraseña"
            autoComplete="current-password"
          />

          <button
            type="button"
            className="login-password-toggle"
            onClick={() => setShowPassword((actual) => !actual)}
          >
            {showPassword ? "Ocultar" : "Mostrar"}
          </button>
        </div>

        {errors.password && (
          <span className="login-error">{errors.password}</span>
        )}

        <div className="login-forgot">
          <button
            type="button"
            onClick={() => navigate("/RecuperarContrasena")}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>
      </div>

      <Captcha onToken={captcha.setToken} intento={captcha.intento} />
      <Button type="submit" loading={loading} disabled={captcha.pendiente} className="login-submit">
        {loading ? "Iniciando sesión..." : "Iniciar sesión"}
      </Button>

      <p className="login-register">
        ¿Todavía no tienes una cuenta?{" "}
        <button type="button" onClick={() => navigate("/registro")}>
          Crear cuenta
        </button>
      </p>

      <Modal
        {...modal}
        onClose={hideModal}
        accionSecundaria={
          modal.codigo === "email_not_confirmed"
            ? handleResendConfirmation
            : undefined
        }
        textoAccionSecundaria={
          resendingConfirmation
            ? "Reenviando..."
            : resendCooldown > 0
              ? `Reenviar en ${resendCooldown} s`
              : "Reenviar correo"
        }
        accionSecundariaDeshabilitada={
          resendingConfirmation ||
          resendCooldown > 0 ||
          resendCaptcha.pendiente
        }
      >
        {modal.codigo === "email_not_confirmed" && (
          <div className="login-resend-captcha">
            <p>Completa la verificación para solicitar un nuevo enlace.</p>
            <Captcha
              onToken={resendCaptcha.setToken}
              intento={resendCaptcha.intento}
            />
          </div>
        )}
      </Modal>
    </form>
  );
};

export default LoginForm;
