import { useState } from "react";
import QuantitySelector from "../ui/QuantitySelector";
import "../css/AddToCotizacionButton.css";
import { agregarProductoCotizacion } from "../../services/cotizacionService";

function AddToCotizacionButton({ producto, stockDisponible = 0, onAgregar }) {
  const [mostrarCantidad, setMostrarCantidad] = useState(false);

  const [cantidad, setCantidad] = useState(1);

  const stock = Math.max(0, Number(stockDisponible) || 0);

  const sinStock = stock <= 0;

  function abrirSelector(evento) {
    evento.stopPropagation();

    if (sinStock) {
      return;
    }

    setCantidad(1);
    setMostrarCantidad(true);
  }

  function cerrarSelector(evento) {
    evento.stopPropagation();

    setMostrarCantidad(false);
    setCantidad(1);
  }

  function agregarACotizacion(evento) {
    evento.stopPropagation();

    const cantidadValidada = Number(cantidad);

    if (
      !Number.isInteger(cantidadValidada) ||
      cantidadValidada < 1 ||
      cantidadValidada > stock
    ) {
      return;
    }

    const productoCotizacion = {
      id_prod: producto.id_prod,
      nom_prod: producto.nom_prod,
      cantidad: cantidadValidada,

      stock_prod: stock,

      imagen_url: producto.imagen_url,

      precio_prod: producto.precio_prod,
      precio_act: producto.precio_act,

      observacion: "",

      es_producto_catalogo: true,
    };

    try {
      agregarProductoCotizacion(productoCotizacion);

      if (onAgregar) {
        onAgregar(productoCotizacion);
      }

      setMostrarCantidad(false);
      setCantidad(1);
    } catch (error) {
      console.error(error);

      alert(error.message);
    }
  }

  return (
    <div
      className="add-cotizacion"
      onClick={(evento) => evento.stopPropagation()}
    >
      <button
        type="button"
        className="add-cotizacion__button"
        onClick={abrirSelector}
        disabled={sinStock}
      >
        {sinStock ? "Sin stock para cotizar" : "Agregar a cotización"}
      </button>

      {mostrarCantidad && (
        <div
          className="add-cotizacion__selector"
          role="dialog"
          aria-modal="false"
          aria-label={`Seleccionar cantidad de ${producto.nom_prod}`}
        >
          <p className="add-cotizacion__title">Cantidad para cotizar</p>

          <p className="add-cotizacion__stock">Stock disponible: {stock}</p>

          <QuantitySelector
            cantidad={cantidad}
            minimo={1}
            maximo={stock}
            onChange={setCantidad}
          />

          <div className="add-cotizacion__actions">
            <button
              type="button"
              className="add-cotizacion__cancel"
              onClick={cerrarSelector}
            >
              Cancelar
            </button>

            <button
              type="button"
              className="add-cotizacion__confirm"
              onClick={agregarACotizacion}
            >
              Agregar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddToCotizacionButton;
