import { useNavigate } from "react-router-dom"
import AddToCartButton from "../carrito/AddToCartButton"
import AddToCotizacionButton from "../cotizacion/AddToCotizacionButton"
import { useAuth } from "../../hooks/useAuth"


function ProductCard({ producto }) {
  const { user } = useAuth()

  const navigate = useNavigate()

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

  function formatearPrecio(precio) {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }).format(precio)
  }

  function verDetalle() {
    navigate(`/producto/${producto.id_prod}`)
  }

  function manejarTeclado(event) {
    if (
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault()
      verDetalle()
    }
  }

  return (
    <article
      className="product-card"
      onClick={verDetalle}
      onKeyDown={manejarTeclado}
      role="link"
      tabIndex={0}
      aria-label={`Ver detalle de ${producto.nom_prod}`}
    >
      <div className="product-card__image-wrapper">
        {tieneOferta && (
          <span className="product-card__discount">
            -{porcentajeDescuento}%
          </span>
        )}

        <img
          src={
            producto.imagen_url ||
            "https://placehold.co/600x400?text=Sin+imagen"
          }
          alt={producto.nom_prod}
          className="product-card__image"
          onError={(event) => {
            event.currentTarget.src =
              "https://placehold.co/600x400?text=Sin+imagen"
          }}
        />
      </div>

      <div className="product-info">
        <h3>{producto.nom_prod}</h3>

        <p className="product-card__description">
          {producto.desc_prod ||
            "Producto disponible en Ferreplast."}
        </p>

        <div className="product-card__prices">
          {tieneOferta && (
            <span className="product-card__original-price">
              {formatearPrecio(precioOriginal)}
            </span>
          )}

          <span
            className={`product-card__current-price ${
              tieneOferta
                ? "product-card__current-price--offer"
                : ""
            }`}
          >
            {formatearPrecio(precioActual)}
          </span>
        </div>

        <AddToCartButton
          producto={producto}
          stockDisponible={
            Number(producto.stock_prod) || 0
          }
          className="btn-add"
        />
        {user && (
          <AddToCotizacionButton
            producto={producto}
            stockDisponible={Number(producto.stock_prod) || 0}
          />
        )}
      </div>
    </article>
  )
}

export default ProductCard