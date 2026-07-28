import { Link } from "react-router-dom"
import { useAuth } from "../../hooks/useAuth"
import { FaArrowLeft } from "react-icons/fa"
import AddToCartButton from "../carrito/AddToCartButton"
import AddToCotizacionButton from "../cotizacion/AddToCotizacionButton"

function ProductDetail({ producto }) {
  const { user } = useAuth()

  const precioOriginal = Number(producto.precio_prod)

  const precioActual =
    producto.precio_act !== null &&
    producto.precio_act !== undefined
      ? Number(producto.precio_act)
      : precioOriginal

  const tieneOferta =
    precioOriginal > 0 &&
    precioActual < precioOriginal

  const porcentajeDescuento = tieneOferta
    ? Math.round(
        ((precioOriginal - precioActual) /
          precioOriginal) *
          100
      )
    : 0

  function formatearPrecio(valor) {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }).format(Number(valor))
  }

  const subcategoria = producto.subcategoria
  const familia = subcategoria?.familia
  const unidadMedida = producto.unidad_medida
  const marca = producto.marca_producto

  return (
    <article className="product-detail">
      <div className="product-detail__top">
        <div className="product-detail__image-container">
          {tieneOferta && (
            <span className="product-detail__discount">
              -{porcentajeDescuento}%
            </span>
          )}

          <img
            className="product-detail__image"
            src={
              producto.imagen_url ||
              "https://placehold.co/800x600?text=Sin+imagen"
            }
            alt={producto.nom_prod}
            onError={(event) => {
              event.currentTarget.onerror = null
              event.currentTarget.src =
                "https://placehold.co/800x600?text=Sin+imagen"
            }}
          />
        </div>

        <div className="product-detail__information">
          <Link
            className="product-detail__back"
            to="/catalogo"
          >
            <FaArrowLeft />
            <span>Volver al catálogo</span>
          </Link>

          <div className="product-detail__classification">
            {familia?.nom_familia && (
              <span>{familia.nom_familia}</span>
            )}

            {familia?.nom_familia &&
              subcategoria?.nom_subcategoria && (
                <span>/</span>
              )}

            {subcategoria?.nom_subcategoria && (
              <span>
                {subcategoria.nom_subcategoria}
              </span>
            )}
          </div>

          <h1>{producto.nom_prod}</h1>

          {marca?.nom_marca && (
            <p className="product-detail__brand">
              Marca: <strong>{marca.nom_marca}</strong>
            </p>
          )}

          {producto.desc_prod && (
            <p className="product-detail__description">
              {producto.desc_prod}
            </p>
          )}

          <div className="product-detail__price">
            {tieneOferta && (
              <span className="product-detail__old-price">
                {formatearPrecio(precioOriginal)}
              </span>
            )}

            <strong>
              {formatearPrecio(precioActual)}
            </strong>

            {tieneOferta && (
              <span className="product-detail__offer-label">
                Ahorras{" "}
                {formatearPrecio(
                  precioOriginal - precioActual
                )}
              </span>
            )}
          </div>

          <dl className="product-detail__attributes">
            {marca?.nom_marca && (
              <div>
                <dt>Marca</dt>
                <dd>{marca.nom_marca}</dd>
              </div>
            )}

            {producto.color_prod && (
              <div>
                <dt>Color</dt>
                <dd>{producto.color_prod}</dd>
              </div>
            )}

            {producto.peso_prod !== null &&
              producto.peso_prod !== undefined && (
                <div>
                  <dt>Peso</dt>
                  <dd>
                    {producto.peso_prod}
                    {unidadMedida?.nom_und_medida
                      ? ` ${unidadMedida.nom_und_medida}`
                      : ""}
                  </dd>
                </div>
              )}

            {subcategoria?.nom_subcategoria && (
              <div>
                <dt>Subcategoría</dt>
                <dd>
                  {subcategoria.nom_subcategoria}
                </dd>
              </div>
            )}

            {familia?.nom_familia && (
              <div>
                <dt>Familia</dt>
                <dd>{familia.nom_familia}</dd>
              </div>
            )}

            {producto.stock_prod !== null && producto.stock_prod !== undefined && (
              <div>
                <dt>Stock</dt>
                <dd>{producto.stock_prod}</dd>
              </div>
            )}
          </dl>

          <AddToCartButton
            producto={producto}
            stockDisponible={
              Number(producto.stock_prod) || 0
            }
            className="product-detail__cart-button"
          />

          {user && (
            <AddToCotizacionButton
              producto={producto}
              stockDisponible={
                Number(producto.stock_prod) || 0
              }
            />
          )}

          {producto.documentos?.length > 0 && (
            <section className="product-detail__documents">
              <h2>Documentación</h2>

              <div className="product-detail__document-list">
                {producto.documentos.map(
                  (documento) => (
                    <a
                      key={documento.id_documento}
                      href={documento.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="product-detail__document"
                    >
                      <span
                        className="product-detail__document-icon"
                        aria-hidden="true"
                      >
                        PDF
                      </span>

                      <span className="product-detail__document-info">
                        <strong>
                          {documento.nombre_documento}
                        </strong>

                        <small>
                          Abrir documento
                        </small>
                      </span>

                      <span
                        className="product-detail__document-arrow"
                        aria-hidden="true"
                      >
                        ↓
                      </span>
                    </a>
                  )
                )}
              </div>
            </section>
          )}
        </div>
      </div>

      {producto.detalle_prod && (
        <section className="product-detail__full-description">
          <h2>Detalle del producto</h2>

          <p>{producto.detalle_prod}</p>
        </section>
      )}
    </article>
  )
}

export default ProductDetail