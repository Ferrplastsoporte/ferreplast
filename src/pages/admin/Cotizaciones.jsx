import AdminHeader from "./components/AdminHeader";

function Cotizaciones() {
  return (
    <section className="admin-page">
      <AdminHeader
        titulo="Cotizaciones"
        descripcion="Consulta y revisa las solicitudes de cotización realizadas por clientes."
      />

      <section className="admin-section">
        <p>Módulo de cotizaciones en desarrollo.</p>
      </section>
    </section>
  );
}

export default Cotizaciones;