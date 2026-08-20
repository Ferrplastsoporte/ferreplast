import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabase";
import "../css/bodeguero.css";
import "../css/productos-bodeguero.css";
import "../css/stock.css";

const enlaces = [
  {
    texto: "Dashboard",
    ruta: "/bodeguero",
    exacta: true,
  },
  {
    texto: "Stock",
    ruta: "/bodeguero/stock",
  },
  {
    texto: "Documentos",
    ruta: "/bodeguero/documentos",
  },
  {
    texto: "Solicitudes pendientes",
    ruta: "/bodeguero/solicitudes",
  },
  {
    texto: "Familias/Subcategorias",
    ruta: "/bodeguero/familias",
  },
  {
    texto: "Marcas",
    ruta: "/bodeguero/marcas",
  },
  {
    texto: "Unidades de medida (productos)",
    ruta: "/bodeguero/unidades",
  },
  {
    texto: "Productos",
    ruta: "/bodeguero/productos",
  },
  {
    texto: "Pedidos (PRÓXIMAMENTE)",
    ruta: "/bodeguero/pedidos",
  },
];

function BodegueroSidebar() {
  const navigate = useNavigate();

  const cerrarSesion = async () => {
    try {
      await supabase.auth.signOut();

      navigate("/", {
        replace: true,
      });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <aside className="bodeguero-sidebar">
      <div className="bodeguero-sidebar__brand">
        <span>FERREPLAST</span>
        <small>Panel de bodega</small>
      </div>

      <nav
        className="bodeguero-sidebar__nav"
        aria-label="Navegación del bodeguero"
      >
        {enlaces.map((enlace) => (
          <NavLink
            key={enlace.ruta}
            to={enlace.ruta}
            end={enlace.exacta}
            className={({ isActive }) =>
              `bodeguero-sidebar__link ${
                isActive ? "bodeguero-sidebar__link--active" : ""
              }`
            }
          >
            {enlace.texto}
          </NavLink>
        ))}
      </nav>

      <div className="bodeguero-sidebar__footer">
        <button
          type="button"
          className="bodeguero-sidebar__logout"
          onClick={cerrarSesion}
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

export default BodegueroSidebar;
