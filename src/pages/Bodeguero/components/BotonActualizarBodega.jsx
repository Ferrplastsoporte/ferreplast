import { FiRefreshCw as IconoActualizar } from "react-icons/fi";
import "../css/botonActualizarBodega.css";

function BotonActualizarBodega({
  alActualizar,
  cargando = false,
  deshabilitado = false,
  etiqueta = "Actualizar datos de bodega",
  titulo = etiqueta,
}) {
  return (
    <button
      type="button"
      className="bodega-boton-actualizar"
      onClick={alActualizar}
      disabled={cargando || deshabilitado}
      aria-label={etiqueta}
      aria-busy={cargando}
      title={titulo}
    >
      <IconoActualizar aria-hidden="true" />
    </button>
  );
}

export default BotonActualizarBodega;
