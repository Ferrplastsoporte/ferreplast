import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaBars, FaBox, FaChevronDown, FaHome, FaQuestionCircle, FaSearch,
  FaShoppingCart, FaSignOutAlt, FaTimes, FaUser,
} from "react-icons/fa";
import { supabase } from "../../lib/supabase";
import {
  LONGITUD_MAXIMA_BUSQUEDA, normalizarTerminoBusqueda, sanitizarTerminoBusqueda,
} from "../../utils/comunes/busqueda";
import "../css/navbar.css";
import logo from "../../assets/logo.png";

const OPCIONES_CUENTA = [
  { ruta: "/pedidos", texto: "Pedidos", Icono: FaBox },
  { ruta: "/cuenta", texto: "Cuenta", Icono: FaUser },
  { ruta: "/ayuda", texto: "Ayuda", Icono: FaQuestionCircle },
];

function Navbar() {
  const navigate = useNavigate();
  const menuUsuarioRef = useRef(null);
  const menuCategoriasRef = useRef(null);
  const categoriasLateralesRef = useRef(null);
  const menuLateralRef = useRef(null);
  const [sesion, setSesion] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false);
  const [menuLateralAbierto, setMenuLateralAbierto] = useState(false);
  const [cargandoUsuario, setCargandoUsuario] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [categorias, setCategorias] = useState([]);
  const [cargandoCategorias, setCargandoCategorias] = useState(true);

  // Los dos menús comparten las categorías y la sesión existentes.
  useEffect(() => {
    let activo = true;
    async function obtenerPerfil(idUsuario) {
      const { data, error } = await supabase.from("usuario")
        .select("nom_user, est_user, rol_user").eq("id_user", idUsuario).single();
      if (!activo) return;
      if (error) console.error("Error al cargar el perfil:", error);
      setUsuario(error ? null : data);
      setCargandoUsuario(false);
    }
    async function obtenerSesionInicial() {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (!activo) return;
      if (error) {
        console.error("Error al obtener la sesión:", error);
        setCargandoUsuario(false);
        return;
      }
      setSesion(session);
      if (session?.user) await obtenerPerfil(session.user.id);
      else setCargandoUsuario(false);
    }
    async function cargarCategorias() {
      const { data, error } = await supabase.from("familia")
        .select("id_familia, nom_familia").order("nom_familia", { ascending: true });
      if (!activo) return;
      if (error) console.error("Error al cargar las categorías:", error);
      setCategorias(data || []);
      setCargandoCategorias(false);
    }
    obtenerSesionInicial();
    cargarCategorias();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_evento, nuevaSesion) => {
        if (!activo) return;
        setSesion(nuevaSesion);
        if (nuevaSesion?.user) {
          // Consultar el perfil fuera del callback de autenticación.
          setTimeout(() => { if (activo) void obtenerPerfil(nuevaSesion.user.id); }, 0);
        } else {
          setUsuario(null);
          setCargandoUsuario(false);
        }
      },
    );
    return () => {
      activo = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    function cerrarFuera(evento) {
      if (!menuUsuarioRef.current?.contains(evento.target)) setMenuUsuarioAbierto(false);
      if (!menuCategoriasRef.current?.contains(evento.target) && menuCategoriasRef.current) {
        menuCategoriasRef.current.open = false;
      }
    }
    function cerrarConEscape(evento) {
      if (evento.key !== "Escape") return;
      setMenuUsuarioAbierto(false);
      if (menuCategoriasRef.current) menuCategoriasRef.current.open = false;
    }
    document.addEventListener("pointerdown", cerrarFuera);
    document.addEventListener("keydown", cerrarConEscape);
    return () => {
      document.removeEventListener("pointerdown", cerrarFuera);
      document.removeEventListener("keydown", cerrarConEscape);
    };
  }, []);

  // El diálogo nativo contiene el foco y permite cerrar con Escape.
  useEffect(() => {
    if (!menuLateralAbierto) return;
    const desbordamientoAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const escritorio = window.matchMedia("(min-width: 993px)");
    const cerrarEnEscritorio = () => {
      if (escritorio.matches) menuLateralRef.current?.close();
    };
    escritorio.addEventListener("change", cerrarEnEscritorio);
    return () => {
      document.body.style.overflow = desbordamientoAnterior;
      escritorio.removeEventListener("change", cerrarEnEscritorio);
    };
  }, [menuLateralAbierto]);

  const primerNombre = usuario?.nom_user?.trim().split(/\s+/)[0] || "Usuario";
  const saludo = cargandoUsuario ? "Cargando..." : `Hola, ${primerNombre}`;

  function cerrarMenus() {
    setMenuUsuarioAbierto(false);
    if (menuCategoriasRef.current) menuCategoriasRef.current.open = false;
    if (categoriasLateralesRef.current) categoriasLateralesRef.current.open = false;
    menuLateralRef.current?.close();
  }
  function irA(ruta) {
    cerrarMenus();
    navigate(ruta);
  }
  function buscarProductos(evento) {
    evento.preventDefault();
    const texto = normalizarTerminoBusqueda(busqueda);
    irA(texto ? `/catalogo?buscar=${encodeURIComponent(texto)}` : "/catalogo");
  }
  function irACatalogo(idCategoria) {
    setBusqueda("");
    irA(idCategoria == null ? "/catalogo" : `/catalogo?categoria=${encodeURIComponent(idCategoria)}`);
  }
  async function cerrarSesion() {
    cerrarMenus();
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error al cerrar sesión:", error);
      return;
    }
    setSesion(null);
    setUsuario(null);
    navigate("/", { replace: true });
  }
  function abrirMenuLateral() {
    cerrarMenus();
    menuLateralRef.current?.showModal();
    setMenuLateralAbierto(true);
  }
  function cerrarDesdeFondo(evento) {
    if (evento.target !== evento.currentTarget) return;
    const limites = evento.currentTarget.getBoundingClientRect();
    if (evento.clientX < limites.left || evento.clientX > limites.right ||
        evento.clientY < limites.top || evento.clientY > limites.bottom) cerrarMenus();
  }
  function renderizarCategorias() {
    return (
      <>
        <button type="button" onClick={() => irACatalogo()}>
          <strong>Ver todo el catálogo</strong>
        </button>
        {cargandoCategorias ? (
          <span className="navbar__estado">Cargando categorías...</span>
        ) : categorias.length === 0 ? (
          <span className="navbar__estado">No hay categorías disponibles.</span>
        ) : categorias.map((categoria) => (
          <button key={categoria.id_familia} type="button"
            onClick={() => irACatalogo(categoria.id_familia)}>
            {categoria.nom_familia}
          </button>
        ))}
      </>
    );
  }

  return (
    <nav className="navbar" aria-label="Navegación principal">
      <div className="navbar__contenido">
        <Link to="/" className="navbar__logo" onClick={cerrarMenus}>
          <img src={logo} alt="Ferreplast" className="navbar__logo-imagen" />
        </Link>
        <form className="navbar__buscador" onSubmit={buscarProductos} role="search">
          <input type="search" placeholder="Buscar productos..." aria-label="Buscar productos"
            value={busqueda} maxLength={LONGITUD_MAXIMA_BUSQUEDA}
            onChange={(evento) => setBusqueda(sanitizarTerminoBusqueda(evento.target.value))} />
          <button type="submit" aria-label="Buscar"><FaSearch aria-hidden="true" /></button>
        </form>
        <div className="navbar__acciones">
          <details className="navbar__categorias" ref={menuCategoriasRef}>
            <summary className="navbar__accion">
              <FaBars aria-hidden="true" /><span>Catálogo</span>
            </summary>
            <div className="navbar__categorias-menu">{renderizarCategorias()}</div>
          </details>
          <div className="navbar__cuenta" ref={menuUsuarioRef}>
            {!sesion ? (
              <Link to="/login" className="navbar__accion" onClick={cerrarMenus}>
                <FaUser aria-hidden="true" /><span>Iniciar sesión</span>
              </Link>
            ) : (
              <>
                <button type="button" className="navbar__accion" title={saludo}
                  aria-expanded={menuUsuarioAbierto} aria-controls="navbar-cuenta"
                  onClick={() => setMenuUsuarioAbierto((abierto) => !abierto)}>
                  <FaUser aria-hidden="true" /><span>Cuenta</span>
                </button>
                {menuUsuarioAbierto && (
                  <div id="navbar-cuenta" className="navbar__cuenta-menu">
                    <p className="navbar__saludo">{saludo}</p>
                    {OPCIONES_CUENTA.map(({ ruta, texto, Icono }) => (
                      <button key={ruta} type="button" onClick={() => irA(ruta)}>
                        <Icono aria-hidden="true" /><span>{texto}</span>
                      </button>
                    ))}
                    <button type="button" className="navbar__cerrar-sesion" onClick={cerrarSesion}>
                      <FaSignOutAlt aria-hidden="true" /><span>Cerrar sesión</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
          <Link to="/carrito" className="navbar__accion" onClick={cerrarMenus}>
            <FaShoppingCart aria-hidden="true" /><span>Carrito</span>
          </Link>
        </div>
        <button type="button" className="navbar__abrir-menu" onClick={abrirMenuLateral}
          aria-label="Abrir menú" aria-expanded={menuLateralAbierto} aria-controls="navbar-menu-lateral">
          <FaBars aria-hidden="true" />
        </button>
      </div>
      <dialog id="navbar-menu-lateral" className="navbar__menu-lateral" ref={menuLateralRef}
        aria-labelledby="navbar-titulo-menu" onClick={cerrarDesdeFondo}
        onClose={() => setMenuLateralAbierto(false)}>
        <div className="navbar__menu-contenido">
          <header className="navbar__menu-cabecera">
            <h2 id="navbar-titulo-menu">Menú</h2>
            <button type="button" className="navbar__cerrar-menu" aria-label="Cerrar menú"
              onClick={cerrarMenus} autoFocus><FaTimes aria-hidden="true" /></button>
          </header>
          <div className="navbar__menu-navegacion">
            <details className="navbar__catalogo-lateral" ref={categoriasLateralesRef}>
              <summary className="navbar__opcion">
                <FaBars aria-hidden="true" /><span>Catálogo</span>
                <FaChevronDown className="navbar__flecha" aria-hidden="true" />
              </summary>
              <div className="navbar__categorias-lista">{renderizarCategorias()}</div>
            </details>
            <Link to="/" className="navbar__opcion" onClick={cerrarMenus}>
              <FaHome aria-hidden="true" /><span>Inicio</span>
            </Link>
            {!sesion && (
              <Link to="/ayuda" className="navbar__opcion" onClick={cerrarMenus}>
                <FaQuestionCircle aria-hidden="true" /><span>Ayuda</span>
              </Link>
            )}
          </div>
          <div className="navbar__menu-usuario">
            {sesion ? (
              <>
                <p className="navbar__saludo">{saludo}</p>
                {OPCIONES_CUENTA.map(({ ruta, texto, Icono }) => (
                  <Link key={ruta} to={ruta} className="navbar__opcion" onClick={cerrarMenus}>
                    <Icono aria-hidden="true" /><span>{texto}</span>
                  </Link>
                ))}
                <button type="button" className="navbar__opcion" onClick={cerrarSesion}>
                  <FaSignOutAlt aria-hidden="true" /><span>Cerrar sesión</span>
                </button>
              </>
            ) : (
              <Link to="/login" className="navbar__opcion" onClick={cerrarMenus}>
                <FaUser aria-hidden="true" /><span>Iniciar sesión</span>
              </Link>
            )}
            <Link to="/carrito" className="navbar__opcion" onClick={cerrarMenus}>
              <FaShoppingCart aria-hidden="true" /><span>Carrito</span>
            </Link>
          </div>
        </div>
      </dialog>
    </nav>
  );
}

export default Navbar;
