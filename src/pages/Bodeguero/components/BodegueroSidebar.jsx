import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabase";
import { useAutenticacion } from "../../../hooks/useAutenticacion";
import "../css/bodeguero.css";
import "../css/productos-bodeguero.css";
import "../css/stock.css";
import "../css/barra-lateral-bodega.css";

const ICONOS = import.meta.glob(
  "../../../assets/iconos/vista_bodega/bodega_menu/*.png",
  { eager: true, query: "?url", import: "default" },
);

const enlaces = [
  {
    texto: "Dashboard",
    icono: "dashboard",
    ruta: "/bodeguero",
    exacta: true,
  },
  {
    texto: "Stock",
    icono: "stock",
    ruta: "/bodeguero/stock",
  },
  {
    texto: "Documentos",
    icono: "documentos",
    ruta: "/bodeguero/documentos",
  },
  {
    texto: "Solicitudes pendientes",
    icono: "solicitudes",
    ruta: "/bodeguero/solicitudes",
  },
  {
    texto: "Familias/Subcategorias",
    icono: "categoria",
    ruta: "/bodeguero/familias",
  },
  {
    texto: "Marcas",
    icono: "marcas",
    ruta: "/bodeguero/marcas",
  },
  {
    texto: "Unidades de medida (productos)",
    icono: "unidades",
    ruta: "/bodeguero/unidades",
  },
  {
    texto: "Productos",
    icono: "productos",
    ruta: "/bodeguero/productos",
  },
  {
    texto: "Pedidos",
    icono: "pedidos",
    ruta: "/bodeguero/pedidos",
  },
];

function BodegueroSidebar() {
  const prefijo = "bodeguero";
  const carpetaIconos = "bodega_menu";
  const nombrePanel = "Panel de bodega";
  const etiquetaPanel = "Bodega";
  const etiquetaNavegacion = "Navegación del bodeguero";
  const navegar = useNavigate();
  const { profile: perfil, initializing: inicializando } = useAutenticacion();
  const [etiqueta, setEtiqueta] = useState(null);
  const [cerrando, setCerrando] = useState(false);
  const [errorSesion, setErrorSesion] = useState("");
  const idEtiqueta = useId();
  const nombreUsuario = inicializando ? "Cargando cuenta…" : perfil?.nom_user || "Cuenta actual";

  function icono(nombre) {
    return ICONOS[`../../../assets/iconos/vista_bodega/${carpetaIconos}/${carpetaIconos}_${nombre}.png`];
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
      if (!evento.target.closest(".barra-lateral-bodega__cuenta")) ocultar();
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
    <aside className={`${prefijo}-barra-lateral barra-lateral-bodega`}>
      <div className={`${prefijo}-barra-lateral__cabecera barra-lateral-bodega__cabecera`}>
        <img src={icono("logo")} alt="Ferreplast" className="barra-lateral-bodega__icono-logo" />
        <span className="barra-lateral-bodega__nombre-panel">{etiquetaPanel}</span>
        <span className="barra-lateral-bodega__texto-logo">FERREPLAST</span>
        <small className="barra-lateral-bodega__texto-logo">{nombrePanel}</small>
      </div>

      <nav className={`${prefijo}-barra-lateral__navegacion barra-lateral-bodega__navegacion`} aria-label={etiquetaNavegacion}>
        {enlaces.map((enlace) => (
          <NavLink
            key={enlace.ruta}
            to={enlace.ruta}
            end={enlace.exacta}
            aria-label={enlace.texto}
            aria-describedby={etiqueta?.texto === enlace.texto ? idEtiqueta : undefined}
            className={({ isActive: estaActivo }) => `${prefijo}-barra-lateral__enlace barra-lateral-bodega__opcion ${estaActivo ? `${prefijo}-barra-lateral__enlace--activo barra-lateral-bodega__opcion--activo` : ""}`}
            {...eventosEtiqueta(enlace.texto)}
          >
            <img src={icono(enlace.icono)} alt="" aria-hidden="true" className="barra-lateral-bodega__icono" />
            <span className="barra-lateral-bodega__texto">{enlace.texto}</span>
          </NavLink>
        ))}
      </nav>

      <div className={`${prefijo}-barra-lateral__pie barra-lateral-bodega__pie`}>
        <button
          type="button"
          className="barra-lateral-bodega__opcion barra-lateral-bodega__cuenta"
          aria-label={`Cuenta de ${nombreUsuario}`}
          aria-describedby={etiqueta?.texto === nombreUsuario ? idEtiqueta : undefined}
          {...eventosEtiqueta(nombreUsuario)}
          onClick={(evento) => {
            if (etiqueta?.texto === nombreUsuario) setEtiqueta(null);
            else mostrarEtiqueta(evento, nombreUsuario, true);
          }}
        >
          <img src={icono("miperfil")} alt="" aria-hidden="true" className="barra-lateral-bodega__icono" />
        </button>
        <button
          type="button"
          className={`${prefijo}-barra-lateral__cerrar-sesion barra-lateral-bodega__opcion barra-lateral-bodega__cerrar-sesion`}
          disabled={cerrando}
          aria-label={cerrando ? "Cerrando sesión" : "Cerrar sesión"}
          {...eventosEtiqueta("Cerrar sesión")}
          onClick={cerrarSesion}
        >
          <img src={icono("cerrarsesion")} alt="" aria-hidden="true" className="barra-lateral-bodega__icono" />
          <span className="barra-lateral-bodega__texto">{cerrando ? "Cerrando sesión…" : "Cerrar sesión"}</span>
        </button>
        {errorSesion && <p role="alert" className="barra-lateral-bodega__error">{errorSesion}</p>}
      </div>

      {etiqueta && createPortal(
        <div
          id={idEtiqueta}
          role="tooltip"
          className="barra-lateral-bodega-etiqueta-flotante"
          style={{ left: etiqueta.izquierda, top: etiqueta.arriba }}
        >
          {etiqueta.texto}
        </div>,
        document.body,
      )}
    </aside>
  );
}

export default BodegueroSidebar;
