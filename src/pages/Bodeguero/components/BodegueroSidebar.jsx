import { NavLink } from "react-router-dom";

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
    texto: "Pedidos o Solicitudes??",
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
];

function BodegueroSidebar() {
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
        <span>Bodeguero</span>

        {/* El cierre de sesión se agregará aquí después */}
      </div>
    </aside>
  );
}

export default BodegueroSidebar;
