import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

import AdminHeader from "./components/AdminHeader";
import TablaUsuarios from "../../components/usuarios/TablaUsuarios";
import {
  sanitizarNombreUsuario,
  sanitizarTelefonoUsuario,
  validarUsuarioAdministrativo,
} from "../../utils/usuarios/validacionUsuarios";
import {
  LONGITUD_MAXIMA_BUSQUEDA,
  sanitizarTerminoBusqueda,
} from "../../utils/comunes/busqueda";

import "./css/Usuarios.css";

const FORMULARIO_INICIAL = {
  nombre: "",
  telefono: "",
  rol: "2",
  activo: true,
};

function obtenerRolId(usuario) {
  const rol = usuario?.rol_user;

  if (typeof rol === "number") {
    return rol;
  }

  return Number(usuario?.rol?.id_rol ?? rol?.id_rol ?? 0);
}

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("todos");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [usuarioCambioEstado, setUsuarioCambioEstado] = useState(null);
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);
  const [errores, setErrores] = useState({});

  useEffect(() => {
    cargarUsuarios();
  }, []);

  async function cargarUsuarios(mostrarCarga = true) {
    if (mostrarCarga) {
      setCargando(true);
    }

    setMensaje("");
    setTipoMensaje("");

    try {
      const { data, error } = await supabase
        .from("usuario")
        .select(`
          id_user,
          nom_user,
          rut_user,
          phone_user,
          est_user,
          rol_user,
          rol:rol_user (
            id_rol,
            nom_rol
          )
        `)
        .in("rol_user", [1, 2])
        .order("nom_user", { ascending: true });

      if (error) {
        throw error;
      }

      setUsuarios(data ?? []);
    } catch (error) {
      console.error("Error al cargar los trabajadores:", error);
      setMensaje("No fue posible cargar los trabajadores.");
      setTipoMensaje("error");
    } finally {
      if (mostrarCarga) {
        setCargando(false);
      }
    }
  }

  const resumen = useMemo(() => {
    const activos = usuarios.filter((usuario) => usuario.est_user).length;
    const administradores = usuarios.filter(
      (usuario) => obtenerRolId(usuario) === 1,
    ).length;

    return {
      total: usuarios.length,
      activos,
      inactivos: usuarios.length - activos,
      administradores,
    };
  }, [usuarios]);

  const usuariosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLocaleLowerCase("es");

    return usuarios.filter((usuario) => {
      const coincideBusqueda =
        !termino ||
        usuario.nom_user?.toLocaleLowerCase("es").includes(termino) ||
        usuario.rut_user?.toLocaleLowerCase("es").includes(termino) ||
        usuario.phone_user?.toLocaleLowerCase("es").includes(termino);
      const coincideRol =
        filtroRol === "todos" || obtenerRolId(usuario) === Number(filtroRol);
      const coincideEstado =
        filtroEstado === "todos" ||
        usuario.est_user === (filtroEstado === "activos");

      return coincideBusqueda && coincideRol && coincideEstado;
    });
  }, [busqueda, filtroEstado, filtroRol, usuarios]);

  function abrirEdicion(usuario) {
    setUsuarioEditando(usuario);
    setFormulario({
      nombre: usuario.nom_user ?? "",
      telefono: usuario.phone_user ?? "",
      rol: String(obtenerRolId(usuario)),
      activo: Boolean(usuario.est_user),
    });
    setErrores({});
  }

  function cerrarEdicion() {
    if (guardando) {
      return;
    }

    setUsuarioEditando(null);
    setErrores({});
  }

  function actualizarFormulario(campo, valor) {
    setFormulario((anterior) => ({ ...anterior, [campo]: valor }));
    setErrores((anteriores) => ({ ...anteriores, [campo]: "" }));
  }

  function validarFormulario() {
    const nuevosErrores = validarUsuarioAdministrativo(formulario, {
      modo: "editar",
      rolesPermitidos: [1, 2],
    });

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  }

  async function actualizarTrabajador(usuario, nuevosDatos) {
    setGuardando(true);
    setMensaje("");
    setTipoMensaje("");

    try {
      const { data, error } = await supabase.rpc("actualizar_trabajador", {
        p_id_user: usuario.id_user,
        p_nom_user: nuevosDatos.nombre.trim(),
        p_phone_user: nuevosDatos.telefono.trim(),
        p_rol_user: Number(nuevosDatos.rol),
        p_est_user: nuevosDatos.activo,
      });

      if (error) {
        throw error;
      }

      if (data !== true) {
        throw new Error("La actualización no pudo confirmarse.");
      }

      await cargarUsuarios(false);
      setMensaje(`Los datos de ${nuevosDatos.nombre.trim()} fueron actualizados.`);
      setTipoMensaje("success");
      setUsuarioEditando(null);
      setUsuarioCambioEstado(null);
      return true;
    } catch (error) {
      console.error("Error al actualizar el trabajador:", error);
      setMensaje(error?.message || "No fue posible actualizar al trabajador.");
      setTipoMensaje("error");
      return false;
    } finally {
      setGuardando(false);
    }
  }

  async function manejarGuardar(evento) {
    evento.preventDefault();

    if (!usuarioEditando || guardando || !validarFormulario()) {
      return;
    }

    await actualizarTrabajador(usuarioEditando, formulario);
  }

  async function confirmarCambioEstado() {
    if (!usuarioCambioEstado || guardando) {
      return;
    }

    await actualizarTrabajador(usuarioCambioEstado, {
      nombre: usuarioCambioEstado.nom_user,
      telefono: usuarioCambioEstado.phone_user,
      rol: String(obtenerRolId(usuarioCambioEstado)),
      activo: !usuarioCambioEstado.est_user,
    });
  }

  return (
    <section className="admin-page usuarios-page">
      <AdminHeader
        titulo="Gestión de trabajadores"
        descripcion="Consulta y administra las cuentas internas con acceso al sistema."
      />

      {mensaje && (
        <div
          className={`usuarios-mensaje usuarios-mensaje--${tipoMensaje}`}
          role={tipoMensaje === "error" ? "alert" : "status"}
        >
          <span aria-hidden="true">{tipoMensaje === "success" ? "✓" : "!"}</span>
          <p>{mensaje}</p>
          {tipoMensaje === "error" && usuarios.length === 0 && (
            <button type="button" onClick={() => cargarUsuarios()}>
              Reintentar
            </button>
          )}
        </div>
      )}

      <div className="usuarios-resumen" aria-label="Resumen de trabajadores">
        <article><span>Total</span><strong>{resumen.total}</strong><small>trabajadores registrados</small></article>
        <article><span>Activos</span><strong>{resumen.activos}</strong><small>con acceso al sistema</small></article>
        <article><span>Inactivos</span><strong>{resumen.inactivos}</strong><small>sin acceso actualmente</small></article>
        <article><span>Administradores</span><strong>{resumen.administradores}</strong><small>cuentas administrativas</small></article>
      </div>

      <section className="usuarios-panel">
        <div className="usuarios-panel__encabezado">
          <div>
            <span className="usuarios-panel__eyebrow">Equipo interno</span>
            <h2>Trabajadores</h2>
            <p>Administra los datos, roles y accesos de administradores y bodegueros.</p>
          </div>
          <span className="usuarios-panel__resultado">{usuariosFiltrados.length} de {usuarios.length}</span>
        </div>

        <div className="usuarios-filtros">
          <label className="usuarios-buscador">
            <span>Buscar trabajador</span>
            <input type="search" value={busqueda} onChange={(evento) => setBusqueda(sanitizarTerminoBusqueda(evento.target.value))} placeholder="Nombre, RUT o teléfono" maxLength={LONGITUD_MAXIMA_BUSQUEDA} />
          </label>
          <label>
            <span>Rol</span>
            <select value={filtroRol} onChange={(evento) => setFiltroRol(evento.target.value)}>
              <option value="todos">Todos los roles</option>
              <option value="1">Administradores</option>
              <option value="2">Bodegueros</option>
            </select>
          </label>
          <label>
            <span>Estado</span>
            <select value={filtroEstado} onChange={(evento) => setFiltroEstado(evento.target.value)}>
              <option value="todos">Todos los estados</option>
              <option value="activos">Activos</option>
              <option value="inactivos">Inactivos</option>
            </select>
          </label>
        </div>

        {cargando ? (
          <p className="usuarios-cargando">Cargando trabajadores...</p>
        ) : (
          <TablaUsuarios usuarios={usuariosFiltrados} onEditar={abrirEdicion} onCambiarEstado={setUsuarioCambioEstado} deshabilitado={guardando} />
        )}
      </section>

      {usuarioEditando && (
        <div className="usuarios-modal" role="presentation" onMouseDown={cerrarEdicion}>
          <section className="usuarios-modal__contenido" role="dialog" aria-modal="true" aria-labelledby="editarTrabajadorTitulo" onMouseDown={(evento) => evento.stopPropagation()}>
            <div className="usuarios-modal__encabezado">
              <div>
                <span>Editar trabajador</span>
                <h2 id="editarTrabajadorTitulo">{usuarioEditando.nom_user}</h2>
                <p>RUT {usuarioEditando.rut_user || "sin información"}</p>
              </div>
              <button type="button" onClick={cerrarEdicion} aria-label="Cerrar edición">×</button>
            </div>

            <form className="usuarios-formulario" onSubmit={manejarGuardar} noValidate>
              <label>
                <span>Nombre y apellidos</span>
                <input type="text" value={formulario.nombre} maxLength={80} onChange={(evento) => actualizarFormulario("nombre", sanitizarNombreUsuario(evento.target.value))} aria-invalid={Boolean(errores.nombre)} disabled={guardando} />
                {errores.nombre && <small>{errores.nombre}</small>}
              </label>
              <label>
                <span>Teléfono</span>
                <input type="tel" value={formulario.telefono} maxLength={12} placeholder="+56912345678" onChange={(evento) => actualizarFormulario("telefono", sanitizarTelefonoUsuario(evento.target.value))} aria-invalid={Boolean(errores.telefono)} disabled={guardando} />
                {errores.telefono && <small>{errores.telefono}</small>}
              </label>
              <label>
                <span>Rol</span>
                <select value={formulario.rol} onChange={(evento) => actualizarFormulario("rol", evento.target.value)} aria-invalid={Boolean(errores.rol)} disabled={guardando}>
                  <option value="1">Administrador</option>
                  <option value="2">Bodeguero</option>
                </select>
                {errores.rol && <small>{errores.rol}</small>}
              </label>
              <label>
                <span>Estado de la cuenta</span>
                <select value={formulario.activo ? "activo" : "inactivo"} onChange={(evento) => actualizarFormulario("activo", evento.target.value === "activo")} disabled={guardando}>
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </label>
              <div className="usuarios-formulario__acciones">
                <button type="button" onClick={cerrarEdicion} disabled={guardando}>Cancelar</button>
                <button type="submit" disabled={guardando}>{guardando ? "Guardando..." : "Guardar cambios"}</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {usuarioCambioEstado && (
        <div className="usuarios-modal" role="presentation">
          <section className="usuarios-confirmacion" role="alertdialog" aria-modal="true" aria-labelledby="cambiarEstadoTitulo">
            <span className="usuarios-confirmacion__icono" aria-hidden="true">{usuarioCambioEstado.est_user ? "!" : "✓"}</span>
            <h2 id="cambiarEstadoTitulo">{usuarioCambioEstado.est_user ? "Deshabilitar" : "Habilitar"} trabajador</h2>
            <p>{usuarioCambioEstado.est_user ? `${usuarioCambioEstado.nom_user} perderá temporalmente el acceso al sistema.` : `${usuarioCambioEstado.nom_user} recuperará el acceso al sistema.`}</p>
            <div className="usuarios-confirmacion__acciones">
              <button type="button" onClick={() => setUsuarioCambioEstado(null)} disabled={guardando}>Cancelar</button>
              <button type="button" className={usuarioCambioEstado.est_user ? "es-peligro" : "es-exito"} onClick={confirmarCambioEstado} disabled={guardando}>
                {guardando ? "Actualizando..." : usuarioCambioEstado.est_user ? "Sí, deshabilitar" : "Sí, habilitar"}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

export default Usuarios;
