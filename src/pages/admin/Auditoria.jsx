import AdminHeader from "./components/AdminHeader";

function Auditoria() {
  return (
    <section className="admin-page">
      <AdminHeader
        titulo="Auditoría"
        descripcion="Consulta los cambios y acciones realizadas dentro del sistema."
      />

      <section className="admin-section">
        <p>Módulo de auditoría en desarrollo.</p>
      </section>
    </section>
  );
}

export default Auditoria;