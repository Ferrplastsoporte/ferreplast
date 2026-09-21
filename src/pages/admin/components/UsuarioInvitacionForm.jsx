import { useState } from "react";
import {
  normalizarUsuarioAdministrativo,
  sanitizarCorreoUsuario,
  sanitizarNombreUsuario,
  sanitizarRutUsuario,
  sanitizarTelefonoUsuario,
  validarUsuarioAdministrativo,
} from "../../../utils/usuarios/validacionUsuarios";
import { LONGITUD_MAXIMA_CORREO } from "../../../utils/comunes/correo";

const VALORES_INICIALES = {
  nombre: "",
  rut: "",
  email: "",
  telefono: "",
  rol: "",
};

const ROLES = [
  {
    value: "1",
    label: "Administrador",
  },
  {
    value: "2",
    label: "Bodeguero",
  },
  {
    value: "3",
    label: "Vendedor",
  },
];

function UsuarioFormAdmin({ onEnviar, cargando = false }) {
  const [valores, setValores] = useState(VALORES_INICIALES);

  const [errores, setErrores] = useState({});

  function actualizarCampo(campo, valor) {
    setValores((estadoAnterior) => ({
      ...estadoAnterior,
      [campo]: valor,
    }));

    setErrores((erroresAnteriores) => ({
      ...erroresAnteriores,
      [campo]: "",
    }));
  }

  function validarFormulario() {
    const nuevosErrores = validarUsuarioAdministrativo(valores, {
      modo: "crear",
      rolesPermitidos: [1, 2, 3],
    });

    setErrores(nuevosErrores);

    return Object.keys(nuevosErrores).length === 0;
  }

  async function manejarEnvio(evento) {
    evento.preventDefault();

    if (cargando) {
      return;
    }

    if (!validarFormulario()) {
      return;
    }

    const valoresNormalizados = normalizarUsuarioAdministrativo(valores);
    const datos = {
      nombre: valoresNormalizados.nombre,
      rut: valoresNormalizados.rut,
      email: valoresNormalizados.email,
      telefono: valoresNormalizados.telefono,
      rol_user: Number(valoresNormalizados.rol),
    };

    /*
     * En el paso 2 esta función
     * llamará a la Edge Function.
     */
    const resultado = await onEnviar?.(datos);

    if (resultado === true) {
      setValores(VALORES_INICIALES);

      setErrores({});
    }
  }

  return (
    <form className="usuario-admin-form" onSubmit={manejarEnvio} noValidate>
      <div className="usuario-admin-form__header">
        <span className="usuario-admin-form__eyebrow">Datos del usuario</span>
        <h2>Crear usuario interno</h2>

        <p>
          Todos los campos son obligatorios. Verifica la información antes de
          enviar la invitación.
        </p>
      </div>

      <div className="usuario-admin-form__grid">
        <div className="usuario-admin-form__field">
          <label htmlFor="adminNombre">Nombre y apellidos</label>

          <input
            id="adminNombre"
            type="text"
            value={valores.nombre}
            onChange={(evento) =>
              actualizarCampo(
                "nombre",
                sanitizarNombreUsuario(evento.target.value),
              )
            }
            maxLength={80}
            autoComplete="name"
            placeholder="Ej: María González"
            disabled={cargando}
            aria-invalid={Boolean(errores.nombre)}
            aria-describedby={errores.nombre ? "adminNombreError" : undefined}
          />

          {errores.nombre && (
            <small id="adminNombreError" className="usuario-admin-form__error">
              {errores.nombre}
            </small>
          )}
        </div>

        <div className="usuario-admin-form__field">
          <label htmlFor="adminRut">RUT</label>

          <input
            id="adminRut"
            type="text"
            value={valores.rut}
            onChange={(evento) =>
              actualizarCampo("rut", sanitizarRutUsuario(evento.target.value))
            }
            placeholder="12345678-5"
            maxLength={10}
            disabled={cargando}
            aria-invalid={Boolean(errores.rut)}
            aria-describedby={errores.rut ? "adminRutError" : undefined}
          />

          {errores.rut && (
            <small id="adminRutError" className="usuario-admin-form__error">
              {errores.rut}
            </small>
          )}
        </div>

        <div className="usuario-admin-form__field">
          <label htmlFor="adminEmail">Correo electrónico</label>

          <input
            id="adminEmail"
            type="email"
            value={valores.email}
            onChange={(evento) =>
              actualizarCampo(
                "email",
                sanitizarCorreoUsuario(evento.target.value),
              )
            }
            maxLength={LONGITUD_MAXIMA_CORREO}
            autoComplete="email"
            placeholder="nombre@ferreplast.cl"
            disabled={cargando}
            aria-invalid={Boolean(errores.email)}
            aria-describedby={errores.email ? "adminEmailError" : undefined}
          />

          {errores.email && (
            <small id="adminEmailError" className="usuario-admin-form__error">
              {errores.email}
            </small>
          )}
        </div>

        <div className="usuario-admin-form__field">
          <label htmlFor="adminTelefono">Teléfono</label>

          <input
            id="adminTelefono"
            type="tel"
            value={valores.telefono}
            onChange={(evento) =>
              actualizarCampo(
                "telefono",
                sanitizarTelefonoUsuario(evento.target.value),
              )
            }
            placeholder="+56912345678"
            maxLength={12}
            autoComplete="tel"
            disabled={cargando}
            aria-invalid={Boolean(errores.telefono)}
            aria-describedby={
              errores.telefono ? "adminTelefonoError" : undefined
            }
          />

          {errores.telefono && (
            <small
              id="adminTelefonoError"
              className="usuario-admin-form__error"
            >
              {errores.telefono}
            </small>
          )}
        </div>

        <div className="usuario-admin-form__field usuario-admin-form__field--full">
          <label htmlFor="adminRol">Rol</label>

          <select
            id="adminRol"
            value={valores.rol}
            onChange={(evento) => actualizarCampo("rol", evento.target.value)}
            disabled={cargando}
            aria-invalid={Boolean(errores.rol)}
            aria-describedby={errores.rol ? "adminRolError" : undefined}
          >
            <option value="">Selecciona un rol</option>

            {ROLES.map((rol) => (
              <option key={rol.value} value={rol.value}>
                {rol.label}
              </option>
            ))}
          </select>

          {errores.rol && (
            <small id="adminRolError" className="usuario-admin-form__error">
              {errores.rol}
            </small>
          )}
        </div>
      </div>

      <div className="usuario-admin-form__actions">
        <p>
          <span aria-hidden="true">✉</span>
          Se enviará un correo de activación al nuevo usuario.
        </p>
        <button type="submit" disabled={cargando}>
          {cargando ? "Enviando invitación..." : "Enviar invitación"}
        </button>
      </div>
    </form>
  );
}

export default UsuarioFormAdmin;
