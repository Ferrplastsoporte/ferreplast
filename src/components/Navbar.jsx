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
import { supabase } from "../lib/supabase";
import "./css/navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const menuUsuarioRef = useRef(null);

  const [sesion, setSesion] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [menuUsuarioAbierto, setMenuUsuarioAbierto] =
    useState(false);
  const [cargandoUsuario, setCargandoUsuario] =
    useState(true);

  useEffect(() => {
    obtenerSesionInicial();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_evento, nuevaSesion) => {
        setSesion(nuevaSesion);

        if (nuevaSesion?.user) {
          await obtenerPerfil(nuevaSesion.user.id);
        } else {
          setUsuario(null);
          setCargandoUsuario(false);
        }
      }
    );

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

    document.addEventListener(
      "mousedown",
      cerrarMenuAlHacerClickFuera
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        cerrarMenuAlHacerClickFuera
      );
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

  function obtenerPrimerNombre() {
    if (!usuario?.nom_user) {
      return "Usuario";
    }

    return usuario.nom_user.trim().split(/\s+/)[0];
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
        FERREPLAST
      </Link>

      <div className="navbar__search">
        <input
          type="text"
          placeholder="Buscar productos..."
          aria-label="Buscar productos"
        />

        <button type="button" aria-label="Buscar">
          <FaSearch />
        </button>
      </div>

      <div className="navbar__categories">
        <details>
          <summary>
            <FaBars />
            Categorías
          </summary>

          <div className="navbar__categories-menu">
            <Link to="/catalogo">📦 Catálogo</Link>
            <Link to="/resinas">🧪 Resinas Epóxicas</Link>
            <Link to="/herramientas">🛠 Herramientas</Link>
            <Link to="/pinturas">🎨 Pinturas</Link>
            <Link to="/materiales">🧱 Materiales</Link>
            <Link to="/tornillos">🔩 Tornillos</Link>
            <Link to="/electricidad">⚡ Electricidad</Link>
            <Link to="/gasfiteria">🚿 Gasfitería</Link>
          </div>
        </details>
      </div>

      <div
        className="navbar__account-wrapper"
        ref={menuUsuarioRef}
      >
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
                setMenuUsuarioAbierto((estado) => !estado)
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
                  menuUsuarioAbierto
                    ? "navbar__account-arrow--open"
                    : ""
                }`}
              />
            </button>

            {menuUsuarioAbierto && (
              <div
                className="navbar__account-menu"
                role="menu"
              >
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

      <Link
        to="/carrito"
        className="navbar__cart"
        aria-label="Carrito"
      >
        <FaShoppingCart />
      </Link>
    </nav>
  );
}

export default Navbar;