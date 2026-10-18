import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabase";
import { useAutenticacion } from "../../../hooks/useAutenticacion";
import "../css/Admin.css";
import "../css/barra-lateral-admin.css";

const ICONOS = import.meta.glob(
  "../../../assets/iconos/vista_admin/admin_menu/*.png",
  { eager: true, query: "?url", import: "default" },
);

const enlaces = [
  {
    texto: "Dashboard",
    icono: "dashboard",
    ruta: "/admin",
    exacta: true,
  },
  {
    texto: "Usuarios",
    icono: "usuarios",
    ruta: "/admin/usuarios",
  },
  {
    texto: "Nuevo trabajador",
    icono: "crearusuario",
    ruta: "/admin/crearUsuario",
  },
  {
    texto: "Aprobaciones",
    icono: "solicitudes",
    ruta: "/admin/aprobaciones",
  },
  {
    texto: "Cotizaciones",
    icono: "cotizaciones",
    ruta: "/admin/cotizaciones",
  },
  {
    texto: "Pedidos",
    icono: "pedidos",
    ruta: "/admin/pedidos",
  },
  {
    texto: "Pagos",
    icono: "pagos",
    ruta: "/admin/pagos",
  },
  {
    texto: "Reportes",
    icono: "reportes",
    ruta: "/admin/reportes",
  },
  {
    texto: "Auditoría",
    icono: "auditoria",
    ruta: "/admin/auditoria",
  },
  {
    texto: "Configuración",
    icono: "configuracion",
    ruta: "/admin/configuracion",
  },
];

function AdminSidebar() {
  const prefijo = "admin";
  const carpetaIconos = "admin_menu";
  const nombrePanel = "Panel de administración";
  const etiquetaPanel = "Administrador";
  const etiquetaNavegacion = "Navegación del administrador";
  const navegar = useNavigate();
  const { profile: perfil, initializing: inicializando } = useAutenticacion();
  const [etiqueta, setEtiqueta] = useState(null);
  const [cerrando, setCerrando] = useState(false);
  const [errorSesion, setErrorSesion] = useState("");
  const idEtiqueta = useId();
  const nombreUsuario = inicializando ? "Cargando cuenta…" : perfil?.nom_user || "Cuenta actual";

  function icono(nombre) {
    return ICONOS[`../../../assets/iconos/vista_admin/${carpetaIconos}/${carpetaIconos}_${nombre}.png`];
  }

  function mostrarEtiqueta(evento, texto, permitirMovil = false) {
    if (!window.matchMedia("(min-width: 701px)").matches) {
      if (!permitirMovil) return;
      const barra = evento.currentTarget.closest("aside").getBoundingClientRect();
      setEtiqueta({ texto, izquierda: 12, arriba: barra.bottom + 8 });
      return;
    }
    const posicion = evento.currentTarget.getBoundingClientRect();
    setEtiqueta({
      texto,
      izquierda: posicion.right + 12,
      arriba: Math.min(window.innerHeight - 36, Math.max(36, posicion.top + posicion.height / 2)),
    });
  }

  function eventosEtiqueta(texto) {
    return {
      onMouseEnter: (evento) => mostrarEtiqueta(evento, texto),
      onMouseLeave: () => setEtiqueta(null),
      onFocus: (evento) => mostrarEtiqueta(evento, texto),
      onBlur: () => setEtiqueta(null),
      onClick: () => setEtiqueta(null),
    };
  }

  useEffect(() => {
    const ocultar = () => setEtiqueta(null);
    const alPresionar = (evento) => { if (evento.key === "Escape") ocultar(); };
    window.addEventListener("resize", ocultar);
    window.addEventListener("scroll", ocultar, true);
    document.addEventListener("keydown", alPresionar);
    const alTocarFuera = (evento) => {
      if (!evento.target.closest(".barra-lateral-admin__cuenta")) ocultar();
    };
    document.addEventListener("pointerdown", alTocarFuera);
    return () => {
      window.removeEventListener("resize", ocultar);
      window.removeEventListener("scroll", ocultar, true);
      document.removeEventListener("keydown", alPresionar);
      document.removeEventListener("pointerdown", alTocarFuera);
    };
  }, []);

  async function cerrarSesion() {
    if (cerrando) return;
    setCerrando(true);
    setEtiqueta(null);
    setErrorSesion("");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navegar("/", { replace: true });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      setErrorSesion("No fue posible cerrar sesión. Inténtalo nuevamente.");
    } finally {
      setCerrando(false);
    }
  }

  return (
    <aside className={`${prefijo}-barra-lateral barra-lateral-admin`}>
      <div className={`${prefijo}-barra-lateral__cabecera barra-lateral-admin__cabecera`}>
        <img src={icono("logo")} alt="Ferreplast" className="barra-lateral-admin__icono-logo" />
        <span className="barra-lateral-admin__nombre-panel">{etiquetaPanel}</span>
        <span className="barra-lateral-admin__texto-logo">FERREPLAST</span>
        <small className="barra-lateral-admin__texto-logo">{nombrePanel}</small>
      </div>

      <nav className={`${prefijo}-barra-lateral__navegacion barra-lateral-admin__navegacion`} aria-label={etiquetaNavegacion}>
        {enlaces.map((enlace) => (
          <NavLink
            key={enlace.ruta}
            to={enlace.ruta}
            end={enlace.exacta}
            aria-label={enlace.texto}
            aria-describedby={etiqueta?.texto === enlace.texto ? idEtiqueta : undefined}
            className={({ isActive: estaActivo }) => `${prefijo}-barra-lateral__enlace barra-lateral-admin__opcion ${estaActivo ? `${prefijo}-barra-lateral__enlace--activo barra-lateral-admin__opcion--activo` : ""}`}
            {...eventosEtiqueta(enlace.texto)}
          >
            <img src={icono(enlace.icono)} alt="" aria-hidden="true" className="barra-lateral-admin__icono" />
            <span className="barra-lateral-admin__texto">{enlace.texto}</span>
          </NavLink>
        ))}
      </nav>

      <div className={`${prefijo}-barra-lateral__pie barra-lateral-admin__pie`}>
        <button
          type="button"
          className="barra-lateral-admin__opcion barra-lateral-admin__cuenta"
          aria-label={`Cuenta de ${nombreUsuario}`}
          aria-describedby={etiqueta?.texto === nombreUsuario ? idEtiqueta : undefined}
          {...eventosEtiqueta(nombreUsuario)}
          onClick={(evento) => {
            if (etiqueta?.texto === nombreUsuario) setEtiqueta(null);
            else mostrarEtiqueta(evento, nombreUsuario, true);
          }}
        >
          <img src={icono("miperfil")} alt="" aria-hidden="true" className="barra-lateral-admin__icono" />
        </button>
        <button
          type="button"
          className={`${prefijo}-barra-lateral__cerrar-sesion barra-lateral-admin__opcion barra-lateral-admin__cerrar-sesion`}
          disabled={cerrando}
          aria-label={cerrando ? "Cerrando sesión" : "Cerrar sesión"}
          {...eventosEtiqueta("Cerrar sesión")}
          onClick={cerrarSesion}
        >
          <img src={icono("cerrarsesion")} alt="" aria-hidden="true" className="barra-lateral-admin__icono" />
          <span className="barra-lateral-admin__texto">{cerrando ? "Cerrando sesión…" : "Cerrar sesión"}</span>
        </button>
        {errorSesion && <p role="alert" className="barra-lateral-admin__error">{errorSesion}</p>}
      </div>

      {etiqueta && createPortal(
        <div
          id={idEtiqueta}
          role="tooltip"
          className="barra-lateral-admin-etiqueta-flotante"
          style={{ left: etiqueta.izquierda, top: etiqueta.arriba }}
        >
          {etiqueta.texto}
        </div>,
        document.body,
      )}
    </aside>
  );
}

export default AdminSidebar;
