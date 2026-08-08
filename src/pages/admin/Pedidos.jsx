import AdminHeader from "./components/AdminHeader";

function Pedidos() {
  return (
    <section className="admin-page">
      <AdminHeader
        titulo="Pedidos"
        descripcion="Consulta el estado general de los pedidos y su registro en el ERP."
      />

      <section className="admin-section">
        <p>Módulo de pedidos en desarrollo.</p>
      </section>
    </section>
  );
}

export default Pedidos;