import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabase";
import "../css/admin.css";

const enlaces = [
  {
    texto: "Dashboard",
    ruta: "/admin",
    exacta: true,
  },
  {
    texto: "Usuarios",
    ruta: "/admin/usuarios",
  },
  {
    texto: "Aprobaciones",
    ruta: "/admin/aprobaciones",
  },
  {
    texto: "Cotizaciones",
    ruta: "/admin/cotizaciones",
  },
  {
    texto: "Pedidos",
    ruta: "/admin/pedidos",
  },
  {
    texto: "Pagos",
    ruta: "/admin/pagos",
  },
  {
    texto: "Reportes",
    ruta: "/admin/reportes",
  },
  {
    texto: "Auditoría",
    ruta: "/admin/auditoria",
  },
  {
    texto: "Configuración",
    ruta: "/admin/configuracion",
  },
];

function AdminSidebar() {
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
    <aside className="admin-sidebar">
      <div className="admin-sidebar__brand">
        <span>FERREPLAST</span>
        <small>Panel de administración</small>
      </div>

      <nav
        className="admin-sidebar__nav"
        aria-label="Navegación del administrador"
      >
        {enlaces.map((enlace) => (
          <NavLink
            key={enlace.ruta}
            to={enlace.ruta}
            end={enlace.exacta}
            className={({ isActive }) =>
              `admin-sidebar__link ${
                isActive ? "admin-sidebar__link--active" : ""
              }`
            }
          >
            {enlace.texto}
          </NavLink>
        ))}
      </nav>

      <div className="admin-sidebar__footer">
        <button
          type="button"
          className="admin-sidebar__logout"
          onClick={cerrarSesion}
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

export default AdminSidebar;
