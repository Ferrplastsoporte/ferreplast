import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaBars,
  FaBox,
  FaChevronDown,
  FaQuestionCircle,
  FaSearch,
  FaShoppingCart,
  FaSignOutAlt,
  FaUser,
} from "react-icons/fa";
import { supabase } from "../../lib/supabase";
import "../css/navbar.css";
/// import del logo
import logo from "../../assets/logo.png";

function Navbar() {
  const navigate = useNavigate();

  const menuUsuarioRef = useRef(null);
  const menuCategoriasRef = useRef(null);

  const [sesion, setSesion] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false);
  const [cargandoUsuario, setCargandoUsuario] = useState(true);

  const [busqueda, setBusqueda] = useState("");
  const [categorias, setCategorias] = useState([]);
  const [cargandoCategorias, setCargandoCategorias] = useState(true);

  useEffect(() => {
    obtenerSesionInicial();
    cargarCategorias();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_evento, nuevaSesion) => {
      setSesion(nuevaSesion);

      if (nuevaSesion?.user) {
        await obtenerPerfil(nuevaSesion.user.id);
      } else {
        setUsuario(null);
        setCargandoUsuario(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    function cerrarMenuAlHacerClickFuera(event) {
      if (
        menuUsuarioRef.current &&
        !menuUsuarioRef.current.contains(event.target)
      ) {
        setMenuUsuarioAbierto(false);
      }
    }

    document.addEventListener("mousedown", cerrarMenuAlHacerClickFuera);

    return () => {
      document.removeEventListener("mousedown", cerrarMenuAlHacerClickFuera);
    };
  }, []);

  async function obtenerSesionInicial() {
    setCargandoUsuario(true);

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("Error al obtener la sesión:", error);
      setCargandoUsuario(false);
      return;
    }

    setSesion(session);

    if (session?.user) {
      await obtenerPerfil(session.user.id);
    } else {
      setUsuario(null);
      setCargandoUsuario(false);
    }
  }

  async function obtenerPerfil(idUsuario) {
    const { data, error } = await supabase
      .from("usuario")
      .select("nom_user, est_user, rol_user")
      .eq("id_user", idUsuario)
      .single();

    if (error) {
      console.error("Error al cargar el perfil:", error);
      setUsuario(null);
      setCargandoUsuario(false);
      return;
    }

    setUsuario(data);
    setCargandoUsuario(false);
  }

  async function cargarCategorias() {
    setCargandoCategorias(true);

    const { data, error } = await supabase
      .from("familia")
      .select("id_familia, nom_familia")
      .order("nom_familia", { ascending: true });

    if (error) {
      console.error("Error al cargar las categorías:", error);
      setCategorias([]);
      setCargandoCategorias(false);
      return;
    }

    const categoriasAdaptadas = (data || []).map((familia) => ({
      id_cat: familia.id_familia,
      nom_cat: familia.nom_familia,
    }));

    setCategorias(categoriasAdaptadas);
    setCargandoCategorias(false);
  }

  function obtenerPrimerNombre() {
    if (!usuario?.nom_user) {
      return "Usuario";
    }

    return usuario.nom_user.trim().split(/\s+/)[0];
  }

  function buscarProductos(event) {
    event.preventDefault();

    const textoBusqueda = busqueda.trim();

    cerrarMenuCategorias();

    if (textoBusqueda) {
      navigate(`/catalogo?buscar=${encodeURIComponent(textoBusqueda)}`);
    } else {
      navigate("/catalogo");
    }
  }

  function irACategoria(idCategoria) {
    cerrarMenuCategorias();
    setBusqueda("");

    navigate(`/catalogo?categoria=${idCategoria}`);
  }

  function irATodasLasCategorias() {
    cerrarMenuCategorias();
    setBusqueda("");

    navigate("/catalogo");
  }

  function cerrarMenuCategorias() {
    if (menuCategoriasRef.current) {
      menuCategoriasRef.current.open = false;
    }
  }

  async function cerrarSesion() {
    setMenuUsuarioAbierto(false);

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Error al cerrar sesión:", error);
      return;
    }

    setSesion(null);
    setUsuario(null);

    navigate("/", { replace: true });
  }

  function irA(ruta) {
    setMenuUsuarioAbierto(false);
    navigate(ruta);
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar__logo">
        <img src={logo} alt="Ferreplast" className="navbar__logo-image" />
      </Link>

      <form className="navbar__search" onSubmit={buscarProductos}>
        <input
          type="search"
          placeholder="Buscar productos..."
          aria-label="Buscar productos"
          value={busqueda}
          onChange={(event) => setBusqueda(event.target.value)}
        />

        <button type="submit" aria-label="Buscar">
          <FaSearch />
        </button>
      </form>

      <div className="navbar__categories">
        <details ref={menuCategoriasRef}>
          <summary>
            <FaBars />
            Catálogo
          </summary>

          <div className="navbar__categories-menu">
            <button type="button" onClick={irATodasLasCategorias}>
              <b>Ver todo el Catálogo</b>
            </button>

            {cargandoCategorias && (
              <span className="navbar__categories-status">
                Cargando categorías...
              </span>
            )}

            {!cargandoCategorias && categorias.length === 0 && (
              <span className="navbar__categories-status">
                No hay categorías disponibles.
              </span>
            )}

            {!cargandoCategorias &&
              categorias.map((categoria) => (
                <button
                  key={categoria.id_cat}
                  type="button"
                  onClick={() => irACategoria(categoria.id_cat)}
                >
                  {categoria.nom_cat}
                </button>
              ))}
          </div>
        </details>
      </div>

      <div className="navbar__account-wrapper" ref={menuUsuarioRef}>
        {!sesion ? (
          <Link to="/login" className="navbar__login">
            <FaUser />
            <span>Iniciar sesión</span>
          </Link>
        ) : (
          <>
            <button
              type="button"
              className="navbar__account-button"
              onClick={() =>
                setMenuUsuarioAbierto((estadoActual) => !estadoActual)
              }
              aria-expanded={menuUsuarioAbierto}
              aria-haspopup="menu"
            >
              <FaUser className="navbar__account-icon" />

              <span className="navbar__account-text">
                <span className="navbar__greeting">
                  {cargandoUsuario
                    ? "Cargando..."
                    : `Hola, ${obtenerPrimerNombre()}`}
                </span>

                <strong>Cuenta</strong>
              </span>

              <FaChevronDown
                className={`navbar__account-arrow ${
                  menuUsuarioAbierto ? "navbar__account-arrow--open" : ""
                }`}
              />
            </button>

            {menuUsuarioAbierto && (
              <div className="navbar__account-menu" role="menu">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => irA("/pedidos")}
                >
                  <FaBox />
                  <span>Pedidos</span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => irA("/cuenta")}
                >
                  <FaUser />
                  <span>Cuenta</span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => irA("/ayuda")}
                >
                  <FaQuestionCircle />
                  <span>Ayuda</span>
                </button>

                <div className="navbar__account-divider" />

                <button
                  type="button"
                  role="menuitem"
                  className="navbar__logout"
                  onClick={cerrarSesion}
                >
                  <FaSignOutAlt />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <Link to="/carrito" className="navbar__cart" aria-label="Carrito">
        <FaShoppingCart />
      </Link>
    </nav>
  );
}

export default Navbar;
