import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import QuantitySelector from "../../components/ui/QuantitySelector";

import {
  obtenerCotizacionCompleta,
  guardarCotizacionCompleta,
  actualizarCantidadCotizacion,
  eliminarProductoCotizacion,
  limpiarCotizacion,
  enviarCotizacion,
} from "../../services/cotizacionService";

import "../css/Cotizacion.css";

const CANTIDAD_MINIMA = 1;
const CANTIDAD_MAXIMA = 100;

const limpiarTexto = (valor = "") => valor.replace(/[^\p{L}\p{N}\s.,]/gu, "");

function Cotizacion() {
  const navigate = useNavigate();

  const inicial = obtenerCotizacionCompleta();

  const [productos, setProductos] = useState(inicial.productosCatalogo);

  const [productosManuales, setProductosManuales] = useState(
    inicial.productosManuales,
  );

  const [medioContacto, setMedioContacto] = useState(inicial.medioContacto);

  const [comentarioGeneral, setComentarioGeneral] = useState(
    inicial.comentarioGeneral,
  );

  const [enviando, setEnviando] = useState(false);

  const [mensajeError, setMensajeError] = useState("");

  const [mostrarModal, setMostrarModal] = useState(false);

  const [idCotizacion, setIdCotizacion] = useState(null);

  useEffect(() => {
    guardarCotizacionCompleta({
      productosCatalogo: productos,
      productosManuales,
      medioContacto,
      comentarioGeneral,
    });
  }, [productos, productosManuales, medioContacto, comentarioGeneral]);

  function cambiarCantidad(idProducto, cantidad) {
    if (cantidad === "") {
      setProductos((actuales) =>
        actuales.map((producto) =>
          producto.id_prod === idProducto
            ? {
                ...producto,
                cantidad: "",
              }
            : producto,
        ),
      );

      return;
    }

    const cantidadNumerica = Number(cantidad);

    if (
      !Number.isInteger(cantidadNumerica) ||
      cantidadNumerica < CANTIDAD_MINIMA ||
      cantidadNumerica > CANTIDAD_MAXIMA
    ) {
      return;
    }

    setProductos(actualizarCantidadCotizacion(idProducto, cantidadNumerica));
  }

  const eliminarProducto = (idProducto) =>
    setProductos(eliminarProductoCotizacion(idProducto));

  function vaciarCotizacion() {
    limpiarCotizacion();

    setProductos([]);
    setProductosManuales([]);
    setMedioContacto("");
    setComentarioGeneral("");
    setMensajeError("");
  }

  function agregarProductoManual() {
    setProductosManuales((actuales) => [
      ...actuales,
      {
        id_temporal: crypto.randomUUID(),

        nom_producto_solicitado: "",

        cantidad: CANTIDAD_MINIMA,

        observacion: "",

        es_producto_catalogo: false,
      },
    ]);
  }

  function actualizarProductoManual(idTemporal, campo, valor) {
    let valorFinal = valor;

    if (campo === "cantidad") {
      const soloNumeros = String(valor).replace(/\D/g, "");

      if (soloNumeros === "") {
        valorFinal = "";
      } else {
        const cantidadNumerica = Number(soloNumeros);

        valorFinal = Math.min(
          CANTIDAD_MAXIMA,
          Math.max(CANTIDAD_MINIMA, cantidadNumerica),
        );
      }
    } else {
      valorFinal = limpiarTexto(valor);
    }

    setProductosManuales((actuales) =>
      actuales.map((producto) =>
        producto.id_temporal === idTemporal
          ? {
              ...producto,
              [campo]: valorFinal,
            }
          : producto,
      ),
    );
  }

  function validarCantidadManualAlSalir(idTemporal, cantidad) {
    const cantidadNumerica = Number(cantidad);

    let cantidadValidada = CANTIDAD_MINIMA;

    if (Number.isInteger(cantidadNumerica)) {
      cantidadValidada = Math.min(
        CANTIDAD_MAXIMA,
        Math.max(CANTIDAD_MINIMA, cantidadNumerica),
      );
    }

    setProductosManuales((actuales) =>
      actuales.map((producto) =>
        producto.id_temporal === idTemporal
          ? {
              ...producto,
              cantidad: cantidadValidada,
            }
          : producto,
      ),
    );
  }

  const eliminarProductoManual = (idTemporal) =>
    setProductosManuales((actuales) =>
      actuales.filter((producto) => producto.id_temporal !== idTemporal),
    );

  const productosManualesConNombre = productosManuales.filter(
    (producto) => producto.nom_producto_solicitado.trim() !== "",
  );

  const productosCatalogoValidos = productos.every((producto) => {
    const cantidad = Number(producto.cantidad);

    return (
      Number.isInteger(cantidad) &&
      cantidad >= CANTIDAD_MINIMA &&
      cantidad <= CANTIDAD_MAXIMA
    );
  });

  const productosManualesValidos = productosManuales.every((producto) => {
    const cantidad = Number(producto.cantidad);

    return (
      producto.nom_producto_solicitado.trim() !== "" &&
      Number.isInteger(cantidad) &&
      cantidad >= CANTIDAD_MINIMA &&
      cantidad <= CANTIDAD_MAXIMA
    );
  });

  const productosDistintos =
    productos.length + productosManualesConNombre.length;

  const cantidadTotal = [...productos, ...productosManualesConNombre].reduce(
    (total, producto) => total + (Number(producto.cantidad) || 0),
    0,
  );

  const tieneProductos =
    productos.length > 0 || productosManualesConNombre.length > 0;

  const cotizacionValida =
    tieneProductos &&
    medioContacto !== "" &&
    productosCatalogoValidos &&
    productosManualesValidos;

  async function manejarEnvio() {
    if (!cotizacionValida || enviando) {
      return;
    }

    setEnviando(true);
    setMensajeError("");

    try {
      const resultado = await enviarCotizacion({
        productosCatalogo: productos,

        productosManuales,

        medioContacto,

        comentarioGeneral,
      });

      setIdCotizacion(resultado.idCotizacion);

      setMostrarModal(true);
    } catch (error) {
      console.error("Error al enviar la cotización:", error);

      setMensajeError(
        error?.message ||
          "No fue posible enviar la cotización. Inténtalo nuevamente.",
      );
    } finally {
      setEnviando(false);
    }
  }

  function aceptarEnvio() {
    limpiarCotizacion();

    setProductos([]);
    setProductosManuales([]);
    setMedioContacto("");
    setComentarioGeneral("");
    setMensajeError("");
    setIdCotizacion(null);
    setMostrarModal(false);

    navigate("/");
  }

  let mensajeValidacion = "";

  if (!tieneProductos) {
    mensajeValidacion = "Agrega al menos un producto.";
  } else if (!productosCatalogoValidos) {
    mensajeValidacion =
      "Las cantidades de los productos deben estar entre 1 y 100.";
  } else if (productosManuales.length > 0 && !productosManualesValidos) {
    mensajeValidacion =
      "Completa todos los productos agregados con una cantidad entre 1 y 100.";
  } else if (!medioContacto) {
    mensajeValidacion = "Selecciona un medio de contacto.";
  }

  return (
    <main className="cotizacion-page">
      <section className="cotizacion-container">
        <header className="cotizacion-header">
          <div>
            <h1>Solicitud de cotización</h1>

            <p>
              Revisa los productos, agrega artículos fuera del catálogo e indica
              cómo prefieres ser contactado.
            </p>
          </div>

          {tieneProductos && (
            <button
              type="button"
              className="cotizacion-clear"
              onClick={vaciarCotizacion}
              disabled={enviando}
            >
              Vaciar cotización
            </button>
          )}
        </header>

        <div className="cotizacion-content">
          <div className="cotizacion-main">
            <section className="cotizacion-section">
              <div className="cotizacion-section__header">
                <div>
                  <h2>Productos del catálogo</h2>

                  <p>
                    Productos seleccionados desde nuestro catálogo en línea.
                  </p>
                </div>

                <Link
                  to="/catalogo"
                  className="cotizacion-section__catalog-link"
                >
                  Agregar desde el catálogo
                </Link>
              </div>

              {productos.length === 0 ? (
                <div className="cotizacion-section__empty">
                  <p>Aún no has agregado productos del catálogo.</p>
                </div>
              ) : (
                <div className="cotizacion-list">
                  {productos.map((producto) => (
                    <article key={producto.id_prod} className="cotizacion-item">
                      <div className="cotizacion-item__image-container">
                        {producto.imagen_url ? (
                          <img
                            src={producto.imagen_url}
                            alt={producto.nom_prod}
                            className="cotizacion-item__image"
                          />
                        ) : (
                          <div className="cotizacion-item__image-placeholder">
                            Sin imagen
                          </div>
                        )}
                      </div>

                      <div className="cotizacion-item__info">
                        <Link
                          to={`/producto/${producto.id_prod}`}
                          className="cotizacion-item__name"
                        >
                          {producto.nom_prod}
                        </Link>

                        <p className="cotizacion-item__stock">
                          Stock actual de referencia:{" "}
                          {Number(producto.stock_prod) || 0}
                        </p>
                      </div>

                      <div className="cotizacion-item__quantity">
                        <span>Cantidad</span>

                        <QuantitySelector
                          cantidad={producto.cantidad}
                          minimo={CANTIDAD_MINIMA}
                          maximo={CANTIDAD_MAXIMA}
                          onChange={(cantidad) =>
                            cambiarCantidad(producto.id_prod, cantidad)
                          }
                          disabled={enviando}
                        />
                      </div>

                      <button
                        type="button"
                        className="cotizacion-item__remove"
                        onClick={() => eliminarProducto(producto.id_prod)}
                        disabled={enviando}
                      >
                        Eliminar
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="cotizacion-section">
              <div className="cotizacion-section__header">
                <div>
                  <h2>Productos fuera del catálogo</h2>

                  <p>
                    Esta sección es opcional. Puedes agregar artículos que no
                    encuentres publicados.
                  </p>
                </div>
              </div>

              {productosManuales.length === 0 ? (
                <div className="cotizacion-section__empty">
                  <p>No has agregado productos externos al catálogo.</p>
                </div>
              ) : (
                <div className="cotizacion-manual-list">
                  {productosManuales.map((producto, indice) => (
                    <article
                      key={producto.id_temporal}
                      className="cotizacion-manual-item"
                    >
                      <div className="cotizacion-manual-item__header">
                        <h3>Producto solicitado {indice + 1}</h3>

                        <button
                          type="button"
                          className="cotizacion-manual-item__remove"
                          onClick={() =>
                            eliminarProductoManual(producto.id_temporal)
                          }
                          disabled={enviando}
                        >
                          Eliminar
                        </button>
                      </div>

                      <div className="cotizacion-manual-item__fields">
                        <div className="cotizacion-field cotizacion-field--name">
                          <label htmlFor={`nombre-${producto.id_temporal}`}>
                            Nombre del producto
                          </label>

                          <input
                            id={`nombre-${producto.id_temporal}`}
                            type="text"
                            value={producto.nom_producto_solicitado}
                            onChange={(evento) =>
                              actualizarProductoManual(
                                producto.id_temporal,
                                "nom_producto_solicitado",
                                evento.target.value,
                              )
                            }
                            placeholder="Ej: Disco de corte especial"
                            maxLength={150}
                            disabled={enviando}
                          />
                        </div>

                        <div className="cotizacion-field cotizacion-field--quantity">
                          <label htmlFor={`cantidad-${producto.id_temporal}`}>
                            Cantidad
                          </label>

                          <input
                            id={`cantidad-${producto.id_temporal}`}
                            type="number"
                            min={CANTIDAD_MINIMA}
                            max={CANTIDAD_MAXIMA}
                            step="1"
                            inputMode="numeric"
                            value={producto.cantidad}
                            onKeyDown={(evento) => {
                              if (
                                ["e", "E", "+", "-", ".", ","].includes(
                                  evento.key,
                                )
                              ) {
                                evento.preventDefault();
                              }
                            }}
                            onChange={(evento) =>
                              actualizarProductoManual(
                                producto.id_temporal,
                                "cantidad",
                                evento.target.value,
                              )
                            }
                            onBlur={() =>
                              validarCantidadManualAlSalir(
                                producto.id_temporal,
                                producto.cantidad,
                              )
                            }
                            disabled={enviando}
                          />
                        </div>

                        <div className="cotizacion-field cotizacion-field--observation">
                          <label
                            htmlFor={`observacion-${producto.id_temporal}`}
                          >
                            Descripción u observación
                          </label>

                          <textarea
                            id={`observacion-${producto.id_temporal}`}
                            value={producto.observacion}
                            onChange={(evento) =>
                              actualizarProductoManual(
                                producto.id_temporal,
                                "observacion",
                                evento.target.value,
                              )
                            }
                            placeholder="Indica marca, modelo, tamaño, color u otra característica."
                            rows={3}
                            maxLength={500}
                            disabled={enviando}
                          />
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              <button
                type="button"
                className="cotizacion-add-manual"
                onClick={agregarProductoManual}
                disabled={enviando}
              >
                + Agregar producto fuera del catálogo
              </button>
            </section>

            <section className="cotizacion-section">
              <div className="cotizacion-section__header">
                <div>
                  <h2>Datos de contacto</h2>

                  <p>
                    Indica cómo prefieres recibir la respuesta de Ferreplast.
                  </p>
                </div>
              </div>

              <div className="cotizacion-contact">
                <div className="cotizacion-field">
                  <label htmlFor="medioContacto">Medio de contacto</label>

                  <select
                    id="medioContacto"
                    value={medioContacto}
                    onChange={(evento) => setMedioContacto(evento.target.value)}
                    disabled={enviando}
                  >
                    <option value="">Selecciona una opción</option>

                    <option value="1">WhatsApp</option>

                    <option value="2">Llamada telefónica</option>

                    <option value="3">Correo electrónico</option>
                  </select>
                </div>

                <div className="cotizacion-field">
                  <label htmlFor="comentarioGeneral">Comentario general</label>

                  <textarea
                    id="comentarioGeneral"
                    value={comentarioGeneral}
                    onChange={(evento) =>
                      setComentarioGeneral(limpiarTexto(evento.target.value))
                    }
                    placeholder="Agrega información adicional sobre tu solicitud."
                    rows={4}
                    maxLength={1000}
                    disabled={enviando}
                  />
                </div>
              </div>
            </section>
          </div>

          <aside className="cotizacion-summary">
            <h2>Resumen</h2>

            <div className="cotizacion-summary__row">
              <span>Productos distintos</span>

              <strong>{productosDistintos}</strong>
            </div>

            <div className="cotizacion-summary__row">
              <span>Cantidad total</span>

              <strong>{cantidadTotal}</strong>
            </div>

            <p className="cotizacion-summary__message">
              Los precios y la disponibilidad final serán confirmados al revisar
              la solicitud.
            </p>

            {mensajeValidacion && (
              <p className="cotizacion-summary__warning">{mensajeValidacion}</p>
            )}

            {mensajeError && (
              <p className="cotizacion-summary__error">{mensajeError}</p>
            )}

            <button
              type="button"
              className="cotizacion-summary__button"
              disabled={!cotizacionValida || enviando}
              onClick={manejarEnvio}
            >
              {enviando ? "Enviando..." : "Enviar solicitud de cotización"}
            </button>
          </aside>
        </div>
      </section>

      {mostrarModal && (
        <div
          className="cotizacion-modal-overlay"
          role="dialog"
          aria-modal="true"
        >
          <div className="cotizacion-modal">
            <h2>Solicitud enviada</h2>

            <p>Tu cotización fue ingresada y pronto será atendida.</p>

            {idCotizacion && (
              <p>
                N.º de cotización: <strong>{idCotizacion}</strong>
              </p>
            )}

            <button type="button" onClick={aceptarEnvio}>
              Aceptar
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default Cotizacion;
