import "./ruta-protegida.css";

function EstadoCargaRuta() {
  return (
    <main className="ruta-protegida__cargando" aria-live="polite">
      <span className="ruta-protegida__indicador" aria-hidden="true" />
      <p>Comprobando tu acceso...</p>
    </main>
  );
}

export default EstadoCargaRuta;
