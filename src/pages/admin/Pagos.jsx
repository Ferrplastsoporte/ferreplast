import AdminHeader from "./components/AdminHeader";

function Pagos() {
  return (
    <section className="admin-page">
      <AdminHeader
        titulo="Pagos"
        descripcion="Consulta los pagos asociados a los pedidos realizados en la plataforma."
      />

      <section className="admin-section">
        <p>Módulo de pagos en desarrollo.</p>
      </section>
    </section>
  );
}

export default Pagos;