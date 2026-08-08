import AdminHeader from "./components/AdminHeader";
import "./css/admin.css";

function Configuracion() {
  return (
    <section className="admin-page">
      <AdminHeader
        titulo="Configuración"
        descripcion="Administra las opciones generales de funcionamiento del sistema."
      />

      <section className="admin-section">
        <h2>Configuración del sistema</h2>

        <p>
          Las opciones de configuración administrativa se incorporarán
          progresivamente según las necesidades del sistema.
        </p>
      </section>
    </section>
  );
}

export default Configuracion;