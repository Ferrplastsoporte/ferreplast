import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "../../hooks/useForm";
import { useAuth } from "../../hooks/useAuth";
import { isValidEmail, isValidPassword } from "../../utils/validators";
import Input from "../ui/Input";
import Button from "../ui/Button";
import Modal from "../ui/Modal";

const INITIAL_VALUES = { email: "", password: "" };

const validateField = (name, value, form) => {
  const val = typeof value === "string" ? value.trim() : value;

  switch (name) {
    case "email":
      if (!val) return "Debes ingresar tu correo electrónico.";
      if (!isValidEmail(val)) return "Correo inválido.";
      return "";

    case "password":
      if (!val) return "Debes ingresar tu contraseña.";
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

  const { values, errors, handleChange, handleBlur, validateForm } = useForm(
    INITIAL_VALUES,
    validateField,
  );

  const { login, loading, modal, hideModal, profile } = useAuth(); // ← AGREGAR profile

  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const resultado = await login(values.email, values.password);

    if (resultado === true) {
      // 🔹 Redirigir según el rol del usuario
      if (profile?.rol_user === 2) {
        navigate("/bodeguero", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  };

  return (
    <form className="login-form" onSubmit={handleSubmit} noValidate>
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
        maxLength={120}
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
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "Ocultar" : "Mostrar"}
          </button>
        </div>

        {errors.password && (
          <span className="login-error">{errors.password}</span>
        )}
      </div>

      <Button type="submit" loading={loading} className="login-submit">
        {loading ? "Iniciando sesión..." : "Iniciar sesión"}
      </Button>

      <p className="login-register">
        ¿Todavía no tienes una cuenta?{" "}
        <button type="button" onClick={() => navigate("/registro")}>
          Crear cuenta
        </button>
      </p>

      <Modal {...modal} onClose={hideModal} />
    </form>
  );
};

export default LoginForm;