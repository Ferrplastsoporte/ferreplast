import AdminHeader from "./components/AdminHeader";

function Reportes() {
  return (
    <section className="admin-page">
      <AdminHeader
        titulo="Reportes"
        descripcion="Consulta y descarga reportes de ventas, pedidos y cotizaciones."
      />
    </section>
  );
}

export default Reportes;
