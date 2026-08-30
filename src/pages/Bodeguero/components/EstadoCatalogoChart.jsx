import { obtenerPorcentajesEstados } from "../../../utils/panelBodeguero";

function EstadoCatalogoChart({ resumen }) {
  const porcentajes = obtenerPorcentajesEstados(resumen);

  const finActivos = porcentajes.activos;

  const finPendientes = finActivos + porcentajes.pendientes;

  const estiloGrafico = {
    background: `
      conic-gradient(
        #16a34a 0% ${finActivos}%,
        #f59e0b ${finActivos}% ${finPendientes}%,
        #dc2626 ${finPendientes}% 100%
      )
    `,
  };

  return (
    <section className="bodega-chart-card">
      <div className="bodega-chart-card__header">
        <div>
          <h2>Estado del catálogo</h2>
          <p>Distribución actual de los productos según su estado.</p>
        </div>
      </div>

      <div className="bodega-chart-card__content">
        <div
          className="bodega-donut"
          style={estiloGrafico}
          role="img"
          aria-label={`${resumen.activos} productos activos, ${resumen.pendientes} pendientes y ${resumen.noDisponibles} no disponibles`}
        >
          <div className="bodega-donut__center">
            <strong>{resumen.total}</strong>
            <span>Productos</span>
          </div>
        </div>

        <div className="bodega-chart-legend">
          <div className="bodega-chart-legend__item">
            <span className="bodega-chart-dot bodega-chart-dot--active" />

            <div>
              <strong>Activos</strong>
              <span>{resumen.activos}</span>
            </div>
          </div>

          <div className="bodega-chart-legend__item">
            <span className="bodega-chart-dot bodega-chart-dot--pending" />

            <div>
              <strong>Pendientes</strong>
              <span>{resumen.pendientes}</span>
            </div>
          </div>

          <div className="bodega-chart-legend__item">
            <span className="bodega-chart-dot bodega-chart-dot--inactive" />

            <div>
              <strong>No disponibles</strong>
              <span>{resumen.noDisponibles}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default EstadoCatalogoChart;
