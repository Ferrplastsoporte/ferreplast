import { FiRefreshCw as IconoActualizar } from "react-icons/fi";
import "../Css/BotonActualizarAdmin.css";

function BotonActualizarAdmin({
  alActualizar,
  cargando = false,
  deshabilitado = false,
  compacto = false,
  etiqueta = "Actualizar",
  claseExtra = "",
}) {
  return (
    <button
      type="button"
      className={`admin-boton-actualizar${compacto ? " admin-boton-actualizar--compacto" : ""}${claseExtra ? ` ${claseExtra}` : ""}`}
      onClick={alActualizar}
      disabled={deshabilitado || cargando}
      aria-label={etiqueta}
      aria-busy={cargando}
      title={compacto ? etiqueta : undefined}
    >
      <IconoActualizar aria-hidden="true" />
      {!compacto && (cargando ? "Actualizando..." : "Actualizar")}
    </button>
  );
}

export default BotonActualizarAdmin;
