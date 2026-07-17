import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import "./Registro.css";

const FORMULARIO_INICIAL = {
  nombre: "",
  rut: "",
  email: "",
  password: "",
  confirmarPassword: "",
  direccion: "",
  telefono: "",
  region: "",
  comuna: "",
};

function Registro() {
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);
  const [errores, setErrores] = useState({});

  const [regiones, setRegiones] = useState([]);
  const [comunas, setComunas] = useState([]);

  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({
    visible: false,
    tipo: "",
    titulo: "",
    mensaje: "",
  });

  const referencias = {
    nombre: useRef(null),
    rut: useRef(null),
    email: useRef(null),
    password: useRef(null),
    confirmarPassword: useRef(null),
    direccion: useRef(null),
    telefono: useRef(null),
    region: useRef(null),
    comuna: useRef(null),
  };

  useEffect(() => {
    cargarRegiones();
  }, []);

  async function cargarRegiones() {
    const { data, error } = await supabase
      .from("region")
      .select("id_reg, nom_reg")
      .order("nom_reg", { ascending: true });

    if (error) {
      console.error("Error al cargar regiones:", error);

      abrirModal(
        "error",
        "No se pudieron cargar las regiones",
        "Ocurrió un problema al obtener las regiones disponibles."
      );

      return;
    }

    setRegiones(data ?? []);
  }

  async function cargarComunas(idRegion) {
    if (!idRegion) {
      setComunas([]);
      return;
    }

    const { data, error } = await supabase
      .from("comuna")
      .select("id_comuna, nom_comuna")
      .eq("id_reg", idRegion)
      .order("nom_comuna", { ascending: true });

    if (error) {
      console.error("Error al cargar comunas:", error);

      abrirModal(
        "error",
        "No se pudieron cargar las comunas",
        "Ocurrió un problema al obtener las comunas de la región seleccionada."
      );

      return;
    }

    setComunas(data ?? []);
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

  function normalizarEspacios(valor) {
    return valor.replace(/\s+/g, " ").trim();
  }

  function validarRut(rutCompleto) {
    if (!/^\d{7,8}-[\dkK]$/.test(rutCompleto)) {
      return false;
    }

    const [cuerpo, digitoIngresado] = rutCompleto.split("-");

    let suma = 0;
    let multiplicador = 2;

    for (let i = cuerpo.length - 1; i >= 0; i -= 1) {
      suma += Number(cuerpo[i]) * multiplicador;
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

    return digitoIngresado.toUpperCase() === digitoCalculado;
  }

  function validarCampo(nombreCampo, valor, formularioActual = formulario) {
    const valorTexto =
      typeof valor === "string" ? valor.trim() : valor;

    switch (nombreCampo) {
      case "nombre":
        if (!valorTexto) {
          return "Debes ingresar tu nombre y apellidos.";
        }

        if (valorTexto.length < 3) {
          return "El nombre debe tener al menos 3 caracteres.";
        }

        if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?: [A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/.test(valorTexto)) {
          return "El nombre solo puede contener letras y espacios.";
        }

        return "";

      case "rut":
        if (!valorTexto) {
          return "Debes ingresar tu RUT.";
        }

        if (!/^\d{7,8}-[\dkK]$/.test(valorTexto)) {
          return "Usa el formato sin puntos y con guion. Ejemplo: 12345678-5.";
        }

        if (!validarRut(valorTexto)) {
          return "El RUT ingresado no es válido.";
        }

        return "";

      case "email":
        if (!valorTexto) {
          return "Debes ingresar tu correo electrónico.";
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valorTexto)) {
          return "Ingresa un correo electrónico válido.";
        }

        return "";

      case "password":
        if (!valor) {
          return "Debes crear una contraseña.";
        }

        if (valor.length < 8) {
          return "La contraseña debe tener al menos 8 caracteres.";
        }

        return "";

      case "confirmarPassword":
        if (!valor) {
          return "Debes repetir la contraseña.";
        }

        if (valor !== formularioActual.password) {
          return "Las contraseñas no coinciden.";
        }

        return "";

      case "direccion":
        if (!valorTexto) {
          return "Debes ingresar tu dirección.";
        }

        if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9#]+(?: [A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9#]+)*$/.test(valorTexto)) {
          return "La dirección solo puede contener letras, números, espacios y #.";
        }

        if (valorTexto.length < 5) {
          return "Ingresa una dirección más completa.";
        }

        return "";

      case "telefono":
        if (!valorTexto) {
          return "Debes ingresar tu número de teléfono.";
        }

        if (!/^\+569\d{8}$/.test(valorTexto)) {
          return "Usa el formato +56912345678, sin espacios ni guiones.";
        }

        return "";

      case "region":
        if (!valor) {
          return "Debes seleccionar una región.";
        }

        return "";

      case "comuna":
        if (!valor) {
          return "Debes seleccionar una comuna.";
        }

        return "";

      default:
        return "";
    }
  }

  function validarFormularioCompleto() {
    const nuevosErrores = {};

    Object.entries(formulario).forEach(([campo, valor]) => {
      const error = validarCampo(campo, valor, formulario);

      if (error) {
        nuevosErrores[campo] = error;
      }
    });

    setErrores(nuevosErrores);

    const primerCampoConError = Object.keys(nuevosErrores)[0];

    if (primerCampoConError) {
      referencias[primerCampoConError]?.current?.focus();
    }

    return Object.keys(nuevosErrores).length === 0;
  }

  function actualizarCampo(e) {
    const { name, value } = e.target;

    let nuevoValor = value;

    if (name === "rut") {
      nuevoValor = value
        .replace(/\./g, "")
        .replace(/[^0-9kK-]/g, "")
        .toUpperCase()
        .slice(0, 10);
    }

    if (name === "telefono") {
      nuevoValor = value
        .replace(/[^\d+]/g, "")
        .slice(0, 12);
    }

    if (name === "nombre") {
      nuevoValor = value.replace(
        /[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]/g,
        ""
      );
    }

    if (name === "direccion") {
      nuevoValor = value.replace(
        /[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9# ]/g,
        ""
      );
    }

    const formularioActualizado = {
      ...formulario,
      [name]: nuevoValor,
    };

    setFormulario(formularioActualizado);

    if (errores[name]) {
      setErrores((anteriores) => ({
        ...anteriores,
        [name]: validarCampo(
          name,
          nuevoValor,
          formularioActualizado
        ),
      }));
    }

    if (
      name === "password" &&
      formulario.confirmarPassword
    ) {
      setErrores((anteriores) => ({
        ...anteriores,
        confirmarPassword: validarCampo(
          "confirmarPassword",
          formulario.confirmarPassword,
          formularioActualizado
        ),
      }));
    }
  }

  function validarAlSalir(e) {
    const { name, value } = e.target;

    setErrores((anteriores) => ({
      ...anteriores,
      [name]: validarCampo(name, value, formulario),
    }));
  }

  async function handleRegionChange(e) {
    const idRegion = e.target.value;

    const formularioActualizado = {
      ...formulario,
      region: idRegion,
      comuna: "",
    };

    setFormulario(formularioActualizado);
    setComunas([]);

    setErrores((anteriores) => ({
      ...anteriores,
      region: validarCampo("region", idRegion),
      comuna: "",
    }));

    if (idRegion) {
      await cargarComunas(idRegion);
    }
  }

  function limpiarFormulario() {
    setFormulario(FORMULARIO_INICIAL);
    setErrores({});
    setComunas([]);
  }

  function traducirErrorRegistro(error) {
    const mensaje = error?.message?.toLowerCase() ?? "";

    if (
      mensaje.includes("already registered") ||
      mensaje.includes("already exists")
    ) {
      return "El correo ingresado ya está asociado a una cuenta.";
    }

    if (
      mensaje.includes("database error") ||
      mensaje.includes("saving new user")
    ) {
      return "La cuenta no pudo guardarse en la base de datos. Revisa la función y el trigger de creación de usuarios.";
    }

    if (
      mensaje.includes("rate limit") ||
      mensaje.includes("email rate")
    ) {
      return "Se alcanzó temporalmente el límite de correos de confirmación. Inténtalo nuevamente más tarde.";
    }

    if (mensaje.includes("password")) {
      return "La contraseña no cumple con los requisitos configurados.";
    }

    if (mensaje.includes("email")) {
      return "El correo electrónico no es válido.";
    }

    return "No fue posible crear la cuenta. Inténtalo nuevamente.";
  }

  async function handleRegistro(e) {
    e.preventDefault();

    if (loading) {
      return;
    }

    const formularioValido = validarFormularioCompleto();

    if (!formularioValido) {
      return;
    }

    setLoading(true);

    try {
      const nombreNormalizado = normalizarEspacios(
        formulario.nombre
      );

      const direccionNormalizada = normalizarEspacios(
        formulario.direccion
      );

      const { data, error } = await supabase.auth.signUp({
        email: formulario.email.trim().toLowerCase(),
        password: formulario.password,
        options: {
          data: {
            nom_user: nombreNormalizado,
            rut_user: formulario.rut.trim().toUpperCase(),
            direc_user: direccionNormalizada,
            phone_user: formulario.telefono.trim(),
            id_comuna: Number(formulario.comuna),
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (error) {
        console.error("Error de registro:", error);

        abrirModal(
          "error",
          "No se pudo crear la cuenta",
          traducirErrorRegistro(error)
        );

        return;
      }

      if (!data?.user) {
        abrirModal(
          "error",
          "Registro incompleto",
          "Supabase no devolvió la información del nuevo usuario."
        );

        return;
      }

      limpiarFormulario();

      abrirModal(
        "success",
        "Cuenta creada correctamente",
        "Enviamos un enlace de confirmación a tu correo. Debes confirmar tu dirección antes de iniciar sesión."
      );
    } catch (error) {
      console.error("Error inesperado:", error);

      abrirModal(
        "error",
        "Ocurrió un problema inesperado",
        "No fue posible completar el registro. Inténtalo nuevamente."
      );
    } finally {
      setLoading(false);
    }
  }

  function claseCampo(nombreCampo) {
    return errores[nombreCampo]
      ? "form-control form-control--error"
      : "form-control";
  }

  return (
    <div className="registro-container">
      <div className="registro-card">
        <h1>Crear cuenta</h1>

        <p className="registro-subtitulo">
          Todos los campos son obligatorios.
        </p>

        <form onSubmit={handleRegistro} noValidate>
          <div className="form-group">
            <label htmlFor="nombre">
              Nombre y apellidos
            </label>

            <input
              ref={referencias.nombre}
              id="nombre"
              name="nombre"
              type="text"
              className={claseCampo("nombre")}
              value={formulario.nombre}
              onChange={actualizarCampo}
              onBlur={validarAlSalir}
              autoComplete="name"
              maxLength={80}
              aria-invalid={Boolean(errores.nombre)}
              aria-describedby="error-nombre"
            />

            {errores.nombre && (
              <span
                id="error-nombre"
                className="campo-error"
              >
                {errores.nombre}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="rut">RUT</label>

            <input
              ref={referencias.rut}
              id="rut"
              name="rut"
              type="text"
              className={claseCampo("rut")}
              value={formulario.rut}
              onChange={actualizarCampo}
              onBlur={validarAlSalir}
              placeholder="12345678-5"
              maxLength={10}
              aria-invalid={Boolean(errores.rut)}
              aria-describedby="error-rut"
            />

            {errores.rut && (
              <span id="error-rut" className="campo-error">
                {errores.rut}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>

            <input
              ref={referencias.email}
              id="email"
              name="email"
              type="email"
              className={claseCampo("email")}
              value={formulario.email}
              onChange={actualizarCampo}
              onBlur={validarAlSalir}
              autoComplete="email"
              maxLength={120}
              aria-invalid={Boolean(errores.email)}
              aria-describedby="error-email"
            />

            {errores.email && (
              <span
                id="error-email"
                className="campo-error"
              >
                {errores.email}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>

            <input
              ref={referencias.password}
              id="password"
              name="password"
              type="password"
              className={claseCampo("password")}
              value={formulario.password}
              onChange={actualizarCampo}
              onBlur={validarAlSalir}
              autoComplete="new-password"
              aria-invalid={Boolean(errores.password)}
              aria-describedby="error-password"
            />

            {errores.password && (
              <span
                id="error-password"
                className="campo-error"
              >
                {errores.password}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmarPassword">
              Confirmar contraseña
            </label>

            <input
              ref={referencias.confirmarPassword}
              id="confirmarPassword"
              name="confirmarPassword"
              type="password"
              className={claseCampo(
                "confirmarPassword"
              )}
              value={formulario.confirmarPassword}
              onChange={actualizarCampo}
              onBlur={validarAlSalir}
              autoComplete="new-password"
              aria-invalid={Boolean(
                errores.confirmarPassword
              )}
              aria-describedby="error-confirmarPassword"
            />

            {errores.confirmarPassword && (
              <span
                id="error-confirmarPassword"
                className="campo-error"
              >
                {errores.confirmarPassword}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="direccion">Dirección</label>

            <input
              ref={referencias.direccion}
              id="direccion"
              name="direccion"
              type="text"
              className={claseCampo("direccion")}
              value={formulario.direccion}
              onChange={actualizarCampo}
              onBlur={validarAlSalir}
              placeholder="Los Alerces 1234 #56"
              autoComplete="street-address"
              maxLength={120}
              aria-invalid={Boolean(errores.direccion)}
              aria-describedby="error-direccion"
            />

            {errores.direccion && (
              <span
                id="error-direccion"
                className="campo-error"
              >
                {errores.direccion}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="telefono">Teléfono</label>

            <input
              ref={referencias.telefono}
              id="telefono"
              name="telefono"
              type="tel"
              className={claseCampo("telefono")}
              value={formulario.telefono}
              onChange={actualizarCampo}
              onBlur={validarAlSalir}
              placeholder="+56912345678"
              autoComplete="tel"
              maxLength={12}
              aria-invalid={Boolean(errores.telefono)}
              aria-describedby="error-telefono"
            />

            {errores.telefono && (
              <span
                id="error-telefono"
                className="campo-error"
              >
                {errores.telefono}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="region">Región</label>

            <select
              ref={referencias.region}
              id="region"
              name="region"
              className={claseCampo("region")}
              value={formulario.region}
              onChange={handleRegionChange}
              onBlur={validarAlSalir}
              aria-invalid={Boolean(errores.region)}
              aria-describedby="error-region"
            >
              <option value="">
                Selecciona una región
              </option>

              {regiones.map((region) => (
                <option
                  key={region.id_reg}
                  value={region.id_reg}
                >
                  {region.nom_reg}
                </option>
              ))}
            </select>

            {errores.region && (
              <span
                id="error-region"
                className="campo-error"
              >
                {errores.region}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="comuna">Comuna</label>

            <select
              ref={referencias.comuna}
              id="comuna"
              name="comuna"
              className={claseCampo("comuna")}
              value={formulario.comuna}
              onChange={actualizarCampo}
              onBlur={validarAlSalir}
              disabled={!formulario.region}
              aria-invalid={Boolean(errores.comuna)}
              aria-describedby="error-comuna"
            >
              <option value="">
                {formulario.region
                  ? "Selecciona una comuna"
                  : "Primero selecciona una región"}
              </option>

              {comunas.map((comuna) => (
                <option
                  key={comuna.id_comuna}
                  value={comuna.id_comuna}
                >
                  {comuna.nom_comuna}
                </option>
              ))}
            </select>

            {errores.comuna && (
              <span
                id="error-comuna"
                className="campo-error"
              >
                {errores.comuna}
              </span>
            )}
          </div>

          <button
            type="submit"
            className="registro-boton"
            disabled={loading}
          >
            {loading
              ? "Creando cuenta..."
              : "Registrarse"}
          </button>
        </form>
      </div>

      {modal.visible && (
        <div
          className="modal-overlay"
          role="presentation"
          onMouseDown={cerrarModal}
        >
          <div
            className={`modal-registro modal-registro--${modal.tipo}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-titulo"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h2 id="modal-titulo">{modal.titulo}</h2>

            <p>{modal.mensaje}</p>

            <button type="button" onClick={cerrarModal}>
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Registro;