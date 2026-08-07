import { useState } from "react";

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

function limpiarTexto(valor = "") {
  return String(valor)
    .replace(/[<>[\]{}]/g, "")
    .replace(/\s{2,}/g, " ");
}

function limpiarRut(valor = "") {
  return String(valor)
    .replace(/\./g, "")
    .replace(/[^0-9kK-]/g, "")
    .toUpperCase();
}

function limpiarTelefono(valor = "") {
  let limpio = String(valor).replace(/[^\d+]/g, "");

  if (limpio.length > 0 && !limpio.startsWith("+")) {
    limpio = `+${limpio}`;
  }

  return limpio.slice(0, 12);
}

function validarRut(rut) {
  if (!/^\d{7,8}-[\dK]$/.test(rut)) {
    return false;
  }

  const [numero, digitoIngresado] = rut.split("-");

  let suma = 0;
  let multiplicador = 2;

  for (let i = numero.length - 1; i >= 0; i -= 1) {
    suma += Number(numero[i]) * multiplicador;

    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }

  const resto = 11 - (suma % 11);

  let digitoCalculado;

  if (resto === 11) {
    digitoCalculado = "0";
  } else if (resto === 10) {
    digitoCalculado = "K";
  } else {
    digitoCalculado = String(resto);
  }

  return digitoCalculado === digitoIngresado;
}

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
    const nuevosErrores = {};

    const nombre = valores.nombre.trim();

    const email = valores.email.trim().toLowerCase();

    const rut = valores.rut.trim();

    const telefono = valores.telefono.trim();

    if (nombre.length < 3) {
      nuevosErrores.nombre = "Ingresa el nombre y apellidos.";
    }

    if (nombre.length > 80) {
      nuevosErrores.nombre = "El nombre no puede superar los 80 caracteres.";
    }

    if (!validarRut(rut)) {
      nuevosErrores.rut = "Ingresa un RUT válido sin puntos y con guion.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nuevosErrores.email = "Ingresa un correo electrónico válido.";
    }

    if (!/^\+569\d{8}$/.test(telefono)) {
      nuevosErrores.telefono =
        "El teléfono debe tener el formato +56912345678.";
    }

    if (!["1", "2", "3"].includes(valores.rol)) {
      nuevosErrores.rol = "Selecciona un rol.";
    }

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

    const datos = {
      nombre: valores.nombre.trim(),

      rut: valores.rut.trim(),

      email: valores.email.trim().toLowerCase(),

      telefono: valores.telefono.trim(),

      rol_user: Number(valores.rol),
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
        <h2>Crear usuario interno</h2>

        <p>
          Registra un administrador, bodeguero o vendedor. El usuario recibirá
          un correo para completar la activación de su cuenta.
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
              actualizarCampo("nombre", limpiarTexto(evento.target.value))
            }
            maxLength={80}
            autoComplete="name"
            disabled={cargando}
          />

          {errores.nombre && (
            <small className="usuario-admin-form__error">
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
              actualizarCampo("rut", limpiarRut(evento.target.value))
            }
            placeholder="12345678-5"
            maxLength={10}
            disabled={cargando}
          />

          {errores.rut && (
            <small className="usuario-admin-form__error">{errores.rut}</small>
          )}
        </div>

        <div className="usuario-admin-form__field">
          <label htmlFor="adminEmail">Correo electrónico</label>

          <input
            id="adminEmail"
            type="email"
            value={valores.email}
            onChange={(evento) => actualizarCampo("email", evento.target.value)}
            maxLength={120}
            autoComplete="email"
            disabled={cargando}
          />

          {errores.email && (
            <small className="usuario-admin-form__error">{errores.email}</small>
          )}
        </div>

        <div className="usuario-admin-form__field">
          <label htmlFor="adminTelefono">Teléfono</label>

          <input
            id="adminTelefono"
            type="tel"
            value={valores.telefono}
            onChange={(evento) =>
              actualizarCampo("telefono", limpiarTelefono(evento.target.value))
            }
            placeholder="+56912345678"
            maxLength={12}
            autoComplete="tel"
            disabled={cargando}
          />

          {errores.telefono && (
            <small className="usuario-admin-form__error">
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
          >
            <option value="">Selecciona un rol</option>

            {ROLES.map((rol) => (
              <option key={rol.value} value={rol.value}>
                {rol.label}
              </option>
            ))}
          </select>

          {errores.rol && (
            <small className="usuario-admin-form__error">{errores.rol}</small>
          )}
        </div>
      </div>

      <div className="usuario-admin-form__actions">
        <button type="submit" disabled={cargando}>
          {cargando ? "Enviando invitación..." : "Enviar invitación"}
        </button>
      </div>
    </form>
  );
}

export default UsuarioFormAdmin;
