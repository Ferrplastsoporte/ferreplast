import { useState } from "react";
import ModalCantidad from "../ui/ModalCantidad";
import "../css/BotonAgregarCotizacion.css";
import {
  agregarProductoCotizacion,
} from "../../services/cotizacionService";

function BotonAgregarCotizacion({
  producto,
  stockDisponible = 0,
  onAgregar,
}) {
  const [mostrarCantidad, setMostrarCantidad] =
    useState(false);

  const [cantidad, setCantidad] = useState(1);

  const stockActual = Math.max(
    0,
    Number(stockDisponible) || 0,
  );

  function abrirSelector(evento) {
    evento.stopPropagation();

    setCantidad(1);
    setMostrarCantidad(true);
  }

  function cerrarSelector() {
    setMostrarCantidad(false);
    setCantidad(1);
  }

  function agregarACotizacion() {
    const cantidadValidada = Number(cantidad);

    if (
      !Number.isInteger(cantidadValidada) ||
      cantidadValidada < 1
    ) {
      return;
    }

    const productoCotizacion = {
      id_prod: producto.id_prod,
      nom_prod: producto.nom_prod,

      cantidad: cantidadValidada,

      /*
       * Se conserva el stock actual como referencia,
       * pero no limita la cantidad cotizada.
       */
      stock_prod: stockActual,

      imagen_url: producto.imagen_url,

      precio_prod: producto.precio_prod,
      precio_act: producto.precio_act,

      observacion: "",

      es_producto_catalogo: true,
    };

    try {
      agregarProductoCotizacion(
        productoCotizacion,
      );

      if (onAgregar) {
        onAgregar(productoCotizacion);
      }

      setMostrarCantidad(false);
      setCantidad(1);
    } catch (error) {
      console.error(
        "Error al agregar a la cotización:",
        error,
      );
    }
  }

  return (
    <div
      className="add-cotizacion"
      onClick={(evento) =>
        evento.stopPropagation()
      }
    >
      <button
        type="button"
        className="add-cotizacion__button"
        onClick={abrirSelector}
      >
        Agregar a cotización
      </button>

      {mostrarCantidad && (
        <ModalCantidad
          titulo="Cantidad para cotizar"
          nombreProducto={producto.nom_prod}
          stockDisponible={stockActual}
          cantidad={cantidad}
          onCantidadChange={setCantidad}
          onCancelar={cerrarSelector}
          onConfirmar={agregarACotizacion}
          textoConfirmar="Agregar"

          /*
           * Este máximo corresponde solamente
           * a la cotización.
           *
           * El carrito no recibe esta propiedad,
           * por lo que continúa limitado por stock.
           */
          maximoCantidad={100}
        />
      )}
    </div>
  );
}

export default BotonAgregarCotizacion;
