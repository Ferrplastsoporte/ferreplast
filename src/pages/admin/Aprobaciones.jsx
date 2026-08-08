import AdminHeader from "./components/AdminHeader";

function Aprobaciones() {
  return (
    <section className="admin-page">
      <AdminHeader
        titulo="Aprobaciones"
        descripcion="Revisa productos y cambios pendientes enviados por bodega."
      />

      <section className="admin-section">
        <p>Módulo de aprobaciones en desarrollo.</p>
      </section>
    </section>
  );
}

export default Aprobaciones;