import { Component, Suspense } from "react";
import { Outlet } from "react-router-dom";
import "./ruta-protegida.css";

// Este límite está dentro del guard: cargar una sección no detiene la comprobación del rol.
class ErrorCargaSeccion extends Component {
  state = { fallo: false };

  static getDerivedStateFromError() {
    return { fallo: true };
  }

  render() {
    if (this.state.fallo) {
      return (
        <div className="ruta-protegida__cargando" role="alert">
          <p>No se pudo abrir esta sección.</p>
          <button type="button" onClick={() => window.location.reload()}>
            Recargar página
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function CargaSeccion() {
  return (
    <ErrorCargaSeccion>
      <Suspense fallback={
        <div className="ruta-protegida__cargando" role="status">
          <span className="ruta-protegida__indicador" aria-hidden="true" />
          <p>Cargando sección...</p>
        </div>
      }>
        <Outlet />
      </Suspense>
    </ErrorCargaSeccion>
  );
}

export default CargaSeccion;
