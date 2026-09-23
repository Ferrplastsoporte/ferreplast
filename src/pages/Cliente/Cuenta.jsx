import { useCallback, useEffect, useState } from "react";
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaEdit,
  FaEnvelope,
  FaInfoCircle,
  FaMapMarkerAlt,
  FaShieldAlt,
  FaUser,
} from "react-icons/fa";
import { useFormulario } from "../../hooks/useFormulario";
import { supabase } from "../../lib/supabase";
import { LONGITUD_MAXIMA_CORREO, sanitizarCorreo } from "../../utils/comunes/correo";
import {
  LIMITES_PERFIL,
  normalizarPerfil,
  sanitizarCampoPerfil,
  validarCampoPerfil,
} from "../../utils/perfil/validacionPerfil";
import "./css/Cuenta.css";

const FORMULARIO_VACIO = {
  nombre: "",
  telefono: "",
  direccion: "",
  region: "",
  comuna: "",
};

const formularioDesdeUsuario = (usuario) => ({
  nombre: usuario?.nom_user ?? "",
  telefono: usuario?.phone_user ?? "",
  direccion: usuario?.direc_user ?? "",
  region: String(usuario?.comuna?.region?.id_reg ?? ""),
  comuna: String(usuario?.id_comuna ?? ""),
});

function mensajeDeError(error, textoPredeterminado) {
  const texto = `${error?.code ?? ""} ${error?.message ?? ""}`.toLowerCase();

  if (texto.includes("email_exists") || texto.includes("already")) {
    return "No pudimos usar ese correo. Verifica la dirección o prueba con otro.";
  }
  if (texto.includes("rate limit") || texto.includes("too many")) {
    return "Has realizado demasiados intentos. Espera unos minutos.";
  }
  if (texto.includes("network") || texto.includes("fetch")) {
    return "No fue posible conectar con el servidor.";
  }
  return textoPredeterminado;
}

function CampoPerfil({ campo, editando, formulario, errores, onChange, onBlur }) {
  const { nombre, etiqueta, valor, ancho, opciones, placeholder, soloLectura, ...propiedades } = campo;
  const clase = `cuenta-field${ancho ? " cuenta-field--wide" : ""}`;

  return (
    <label className={clase}>
      <span>{etiqueta}</span>
      {!editando || soloLectura ? (
        <strong>{valor || "No registrado"}</strong>
      ) : opciones ? (
        <select name={nombre} value={formulario[nombre]} onChange={onChange} onBlur={onBlur} aria-invalid={Boolean(errores[nombre])} {...propiedades}>
          <option value="">{placeholder}</option>
          {opciones.map((opcion) => <option key={opcion.id} value={opcion.id}>{opcion.nombre}</option>)}
        </select>
      ) : (
        <input name={nombre} value={formulario[nombre]} onChange={onChange} onBlur={onBlur} aria-invalid={Boolean(errores[nombre])} {...propiedades} />
      )}
      {editando && !soloLectura && errores[nombre] && <small>{errores[nombre]}</small>}
    </label>
  );
}

function Cuenta() {
  const [usuario, setUsuario] = useState(null);
  const [correo, setCorreo] = useState("");
  const [regiones, setRegiones] = useState([]);
  const [comunas, setComunas] = useState([]);
  const [editando, setEditando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [cargandoComunas, setCargandoComunas] = useState(false);
  const [errorCarga, setErrorCarga] = useState("");
  const [mensaje, setMensaje] = useState(null);
  const [editandoCorreo, setEditandoCorreo] = useState(false);
  const [nuevoCorreo, setNuevoCorreo] = useState("");
  const [errorCorreo, setErrorCorreo] = useState("");
  const [cambiandoCorreo, setCambiandoCorreo] = useState(false);

  const {
    values: formulario,
    errors: errores,
    setValues: setFormulario,
    setErrors: setErrores,
    handleChange: actualizarCampo,
    handleBlur: validarAlSalir,
    validateForm: validarFormulario,
    setFieldValue,
  } = useFormulario(FORMULARIO_VACIO, validarCampoPerfil, sanitizarCampoPerfil);

  const cargarComunas = useCallback(async (idRegion) => {
    if (!idRegion) {
      setComunas([]);
      return;
    }

    setCargandoComunas(true);
    const { data } = await supabase
      .from("comuna")
      .select("id_comuna, nom_comuna, id_reg")
      .eq("id_reg", idRegion)
      .order("nom_comuna");
    setComunas(data ?? []);
    setCargandoComunas(false);
  }, []);

  const cargarCuenta = useCallback(async () => {
    setCargando(true);
    setErrorCarga("");

    const { data: auth, error: errorAuth } = await supabase.auth.getUser();
    if (errorAuth || !auth.user) {
      setErrorCarga("No fue posible comprobar tu sesión.");
      setCargando(false);
      return;
    }

    const [perfil, regionesDisponibles] = await Promise.all([
      supabase.from("usuario").select(`
        id_user, nom_user, rut_user, create_user, direc_user, phone_user, id_comuna,
        comuna (id_comuna, nom_comuna, region (id_reg, nom_reg))
      `).eq("id_user", auth.user.id).single(),
      supabase.from("region").select("id_reg, nom_reg").order("nom_reg"),
    ]);

    if (perfil.error) {
      setErrorCarga("No fue posible cargar la información de tu cuenta.");
      setCargando(false);
      return;
    }

    const valores = formularioDesdeUsuario(perfil.data);
    setUsuario(perfil.data);
    setCorreo(auth.user.email ?? "");
    setNuevoCorreo(auth.user.email ?? "");
    setRegiones(regionesDisponibles.data ?? []);
    setFormulario(valores);
    if (valores.region) await cargarComunas(valores.region);
    setCargando(false);
  }, [cargarComunas, setFormulario]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarCuenta();
  }, [cargarCuenta]);

  const regionActual = usuario?.comuna?.region?.nom_reg || "No registrada";
  const comunaActual = usuario?.comuna?.nom_comuna || "No registrada";
  const fechaCreacion = usuario?.create_user
    ? new Intl.DateTimeFormat("es-CL", { dateStyle: "long" }).format(new Date(usuario.create_user))
    : "No disponible";

  const camposPersonales = [
    { nombre: "nombre", etiqueta: "Nombre completo", valor: usuario?.nom_user, ancho: true, maxLength: LIMITES_PERFIL.nombre, autoComplete: "name" },
    { nombre: "rut", etiqueta: "RUT", valor: usuario?.rut_user, soloLectura: true },
    { nombre: "telefono", etiqueta: "Teléfono", valor: usuario?.phone_user, type: "tel", maxLength: LIMITES_PERFIL.telefono, autoComplete: "tel", placeholder: "+56912345678" },
  ];
  const camposDireccion = [
    { nombre: "direccion", etiqueta: "Dirección", valor: usuario?.direc_user, ancho: true, maxLength: LIMITES_PERFIL.direccion, autoComplete: "street-address" },
    { nombre: "region", etiqueta: "Región", valor: regionActual, opciones: regiones.map((r) => ({ id: r.id_reg, nombre: r.nom_reg })), placeholder: "Selecciona una región" },
    { nombre: "comuna", etiqueta: "Comuna", valor: comunaActual, opciones: comunas.map((c) => ({ id: c.id_comuna, nombre: c.nom_comuna })), placeholder: cargandoComunas ? "Cargando comunas..." : "Selecciona una comuna", disabled: !formulario.region || cargandoComunas },
  ];

  function iniciarEdicion() {
    setFormulario(formularioDesdeUsuario(usuario));
    setErrores({});
    setMensaje(null);
    setEditando(true);
  }

  function cancelarEdicion() {
    setFormulario(formularioDesdeUsuario(usuario));
    setErrores({});
    setEditando(false);
  }

  async function cambiarRegion(evento) {
    const idRegion = sanitizarCampoPerfil("region", evento.target.value);
    setFieldValue("region", idRegion, { clearError: true });
    setFieldValue("comuna", "", { clearError: true });
    await cargarComunas(idRegion);
  }

  async function guardarPerfil(evento) {
    evento.preventDefault();
    if (guardando) return;

    if (!validarFormulario()) {
      setMensaje({ tipo: "error", texto: "Revisa los campos marcados antes de guardar." });
      return;
    }

    setGuardando(true);
    setMensaje(null);
    const datos = normalizarPerfil(formulario);
    const { error } = await supabase.rpc("actualizar_mi_perfil", {
      p_nombre: datos.nombre,
      p_telefono: datos.telefono,
      p_direccion: datos.direccion,
      p_id_comuna: datos.idComuna,
    });

    if (error) {
      setMensaje({ tipo: "error", texto: mensajeDeError(error, "No fue posible guardar los cambios.") });
      setGuardando(false);
      return;
    }

    const region = regiones.find((item) => Number(item.id_reg) === Number(formulario.region));
    const comuna = comunas.find((item) => Number(item.id_comuna) === datos.idComuna);
    setUsuario((actual) => ({
      ...actual,
      nom_user: datos.nombre,
      phone_user: datos.telefono,
      direc_user: datos.direccion,
      id_comuna: datos.idComuna,
      comuna: { id_comuna: datos.idComuna, nom_comuna: comuna?.nom_comuna, region: { id_reg: Number(formulario.region), nom_reg: region?.nom_reg } },
    }));
    setMensaje({ tipo: "exito", texto: "Tus datos fueron actualizados." });
    setEditando(false);
    setGuardando(false);
  }

  async function cambiarCorreo(evento) {
    evento.preventDefault();
    const correoLimpio = sanitizarCorreo(nuevoCorreo);
    const validacion = validarCampoPerfil("correo", correoLimpio);

    if (validacion || correoLimpio === sanitizarCorreo(correo)) {
      setErrorCorreo(validacion || "Ingresa un correo diferente al actual.");
      return;
    }

    setCambiandoCorreo(true);
    const { error } = await supabase.auth.updateUser(
      { email: correoLimpio },
      { emailRedirectTo: `${window.location.origin}/cuenta` },
    );
    setCambiandoCorreo(false);

    if (error) {
      setErrorCorreo(mensajeDeError(error, "No pudimos iniciar el cambio de correo."));
      return;
    }

    setEditandoCorreo(false);
    setMensaje({ tipo: "exito", texto: `Enviamos la confirmación a ${correoLimpio}.` });
  }

  if (cargando) {
    return <main className="cuenta-page"><div className="cuenta-status" role="status"><span className="cuenta-spinner" /><p>Cargando tu información...</p></div></main>;
  }

  if (errorCarga || !usuario) {
    return <main className="cuenta-page"><div className="cuenta-status cuenta-status--error" role="alert"><h2>No pudimos cargar tu cuenta</h2><p>{errorCarga}</p><button className="cuenta-button cuenta-button--primary" onClick={cargarCuenta}>Reintentar</button></div></main>;
  }

  return (
    <main className="cuenta-page">
      <section className="cuenta-header">
        <div><span className="cuenta-eyebrow">MI CUENTA</span><h1>Mi perfil</h1><p>Revisa y actualiza tus datos personales y de despacho.</p></div>
        {!editando && <button className="cuenta-button cuenta-button--primary" onClick={iniciarEdicion}><FaEdit />Editar perfil</button>}
      </section>

      {mensaje && <div className={`cuenta-message cuenta-message--${mensaje.tipo}`} role={mensaje.tipo === "error" ? "alert" : "status"}>{mensaje.tipo === "exito" ? <FaCheckCircle /> : <FaInfoCircle />}<span>{mensaje.texto}</span></div>}

      <section className="cuenta-summary" aria-label="Resumen de la cuenta">
        <div className="cuenta-summary__identity"><span className="cuenta-summary__label">CUENTA DE CLIENTE</span><h2>{usuario.nom_user}</h2><p>{correo}</p></div>
        <span className="cuenta-created"><FaCalendarAlt />Cliente desde {fechaCreacion}</span>
      </section>

      <form className="cuenta-form" onSubmit={guardarPerfil} noValidate>
        <div className="cuenta-grid">
          {[
            { titulo: "Datos personales", etiqueta: "PERFIL", icono: <FaUser />, campos: camposPersonales },
            { titulo: "Dirección principal", etiqueta: "DESPACHO", icono: <FaMapMarkerAlt />, campos: camposDireccion },
          ].map((tarjeta) => (
            <article className="cuenta-card" key={tarjeta.titulo}>
              <header className="cuenta-card__header"><span className="cuenta-card__icon">{tarjeta.icono}</span><div><span>{tarjeta.etiqueta}</span><h2>{tarjeta.titulo}</h2></div></header>
              <div className="cuenta-fields">
                {tarjeta.campos.map((campo) => <CampoPerfil key={campo.nombre} campo={campo} editando={editando} formulario={formulario} errores={errores} onChange={campo.nombre === "region" ? cambiarRegion : actualizarCampo} onBlur={validarAlSalir} />)}
              </div>
            </article>
          ))}
        </div>

        {editando && <div className="cuenta-form__actions"><div><button className="cuenta-button" type="button" onClick={cancelarEdicion} disabled={guardando}>Cancelar</button><button className="cuenta-button cuenta-button--primary" type="submit" disabled={guardando || cargandoComunas}>{guardando ? "Guardando..." : "Guardar cambios"}</button></div></div>}
      </form>

      <section className="cuenta-security" aria-labelledby="correo-titulo">
        <div className="cuenta-security__heading"><span className="cuenta-card__icon"><FaShieldAlt /></span><div><span>ACCESO Y SEGURIDAD</span><h2 id="correo-titulo">Correo de acceso</h2></div></div>
        {!editandoCorreo ? (
          <div className="cuenta-security__content"><div><span className="cuenta-security__label">Correo actual</span><strong>{correo}</strong><p>El cambio se activa después de confirmar el nuevo correo.</p></div><button className="cuenta-button" onClick={() => { setEditandoCorreo(true); setNuevoCorreo(correo); setErrorCorreo(""); }}><FaEnvelope />Cambiar correo</button></div>
        ) : (
          <form className="cuenta-email-form" onSubmit={cambiarCorreo} noValidate>
            <label><span>Nuevo correo</span><input type="email" value={nuevoCorreo} onChange={(e) => { setNuevoCorreo(sanitizarCorreo(e.target.value)); setErrorCorreo(""); }} maxLength={LONGITUD_MAXIMA_CORREO} aria-invalid={Boolean(errorCorreo)} />{errorCorreo && <small>{errorCorreo}</small>}</label>
            <p><FaInfoCircle />Tu correo actual seguirá funcionando hasta confirmar el nuevo.</p>
            <div><button className="cuenta-button" type="button" onClick={() => setEditandoCorreo(false)}>Cancelar</button><button className="cuenta-button cuenta-button--primary" disabled={cambiandoCorreo}>{cambiandoCorreo ? "Enviando..." : "Enviar confirmación"}</button></div>
          </form>
        )}
      </section>
    </main>
  );
}

export default Cuenta;
