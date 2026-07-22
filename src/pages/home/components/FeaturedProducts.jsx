import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Swiper, SwiperSlide } from "swiper/react"
import {
  Navigation,
  Pagination,
  Autoplay,
} from "swiper/modules"

import { supabase } from "../../../lib/supabase"
import AddToCartButton from "../../../components/carrito/AddToCartButton"

import "swiper/css"
import "swiper/css/navigation"
import "swiper/css/pagination"
import "../css/home.css"

function FeaturedProducts() {
  const navigate = useNavigate()

  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState("")

  useEffect(() => {
    cargarProductosDestacados()
  }, [])

  async function cargarProductosDestacados() {
    setCargando(true)
    setErrorCarga("")

    const { data, error } = await supabase
      .from("producto")
      .select(`
        id_prod,
        nom_prod,
        desc_prod,
        precio_prod,
        precio_act,
        imagen_url,
        created_prod,
        est_prod,
        subcategoria (
          id_subcategoria,
          nom_subcategoria,
          categoria (
            id_cat,
            nom_cat
          )
        )
      `)
      .eq("est_prod", 1)
      .order("created_prod", {
        ascending: false,
      })
      .limit(8)

    if (error) {
      console.error(
        "Error al cargar productos destacados:",
        error
      )

      setProductos([])
      setErrorCarga(
        "No fue posible cargar los productos destacados."
      )
      setCargando(false)
      return
    }

    setProductos(data || [])
    setCargando(false)
  }

  function formatearPrecio(precio) {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }).format(Number(precio))
  }

  function verDetalle(idProducto) {
    navigate(`/producto/${idProducto}`)
  }

  function manejarTeclado(event, idProducto) {
    if (
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault()
      verDetalle(idProducto)
    }
  }

  return (
    <section className="featured-products">
      <div className="section-title">
        <span>⭐ PRODUCTOS DESTACADOS</span>

        <h2>Lo más nuevo en Ferreplast</h2>

        <p>
          Descubre algunos de los últimos productos
          incorporados a nuestro catálogo.
        </p>
      </div>

      {cargando && (
        <p className="featured-products__status">
          Cargando productos...
        </p>
      )}

      {!cargando && errorCarga && (
        <div className="featured-products__error">
          <p>{errorCarga}</p>

          <button
            type="button"
            onClick={cargarProductosDestacados}
          >
            Reintentar
          </button>
        </div>
      )}

      {!cargando &&
        !errorCarga &&
        productos.length === 0 && (
          <p className="featured-products__status">
            Actualmente no hay productos disponibles.
          </p>
        )}

      {!cargando &&
        !errorCarga &&
        productos.length > 0 && (
          <Swiper
            modules={[
              Navigation,
              Pagination,
              Autoplay,
            ]}
            spaceBetween={25}
            navigation
            pagination={{ clickable: true }}
            autoplay={{
              delay: 3500,
              disableOnInteraction: false,
            }}
            loop={productos.length > 4}
            breakpoints={{
              0: {
                slidesPerView: 1,
              },
              640: {
                slidesPerView: 2,
              },
              1024: {
                slidesPerView: 3,
              },
              1400: {
                slidesPerView: 4,
              },
            }}
          >
            {productos.map((producto) => {
              const precioOriginal = Number(
                producto.precio_prod
              )

              const precioActual =
                producto.precio_act !== null &&
                producto.precio_act !== undefined
                  ? Number(producto.precio_act)
                  : precioOriginal

              const tieneOferta =
                precioOriginal > 0 &&
                precioActual < precioOriginal

              const categoria =
                producto.subcategoria?.categoria
                  ?.nom_cat || "Producto"

              return (
                <SwiperSlide
                  key={producto.id_prod}
                >
                  <article
                    className="featured-product-card"
                    onClick={() =>
                      verDetalle(producto.id_prod)
                    }
                    onKeyDown={(event) =>
                      manejarTeclado(
                        event,
                        producto.id_prod
                      )
                    }
                    role="link"
                    tabIndex={0}
                    aria-label={`Ver detalle de ${producto.nom_prod}`}
                  >
                    <div className="featured-product-card__image-wrapper">
                      {tieneOferta && (
                        <span className="featured-product-card__badge">
                          OFERTA
                        </span>
                      )}

                      <img
                        src={
                          producto.imagen_url ||
                          "https://placehold.co/600x400?text=Sin+imagen"
                        }
                        alt={producto.nom_prod}
                        className="featured-product-card__image"
                        onError={(event) => {
                          event.currentTarget.src =
                            "https://placehold.co/600x400?text=Sin+imagen"
                        }}
                      />
                    </div>

                    <div className="featured-product-card__info">
                      <small>{categoria}</small>

                      <h3>{producto.nom_prod}</h3>

                      <div className="featured-product-card__prices">
                        {tieneOferta && (
                          <span className="featured-product-card__old-price">
                            {formatearPrecio(
                              precioOriginal
                            )}
                          </span>
                        )}

                        <span className="featured-product-card__price">
                          {formatearPrecio(
                            precioActual
                          )}
                        </span>
                      </div>

                      <AddToCartButton
                        producto={producto}
                        className="featured-product-card__cart-button"
                      />
                    </div>
                  </article>
                </SwiperSlide>
              )
            })}
          </Swiper>
        )}
    </section>
  )
}

export default FeaturedProducts