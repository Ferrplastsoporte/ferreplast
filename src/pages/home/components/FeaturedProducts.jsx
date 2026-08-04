import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";

import { supabase } from "../../../lib/supabase";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "../css/home.css";

const IMAGEN_RESPALDO = "https://placehold.co/600x400?text=Sin+imagen";

function FeaturedProducts() {
  const navigate = useNavigate();

  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");

  useEffect(() => {
    cargarProductosDestacados();
  }, []);

  function obtenerUrlImagen(rutaImagen) {
    if (!rutaImagen) {
      return IMAGEN_RESPALDO;
    }

    if (rutaImagen.startsWith("http://") || rutaImagen.startsWith("https://")) {
      return rutaImagen;
    }

    const { data } = supabase.storage
      .from("imagenes_productos")
      .getPublicUrl(rutaImagen);

    return data.publicUrl;
  }

  async function cargarProductosDestacados() {
    setCargando(true);
    setErrorCarga("");

    const { data, error } = await supabase
      .from("producto")
      .select(
        `
        id_prod,
        nom_prod,
        desc_prod,
        precio_prod,
        precio_act,
        imagen_url,
        created_prod,
        stock_prod,
        est_prod,
        id_subcategoria,

        subcategoria (
          id_subcategoria,
          nom_subcategoria,
          id_familia,

          familia (
            id_familia,
            nom_familia
          )
        )
      `,
      )
      .eq("est_prod", 2)
      .order("created_prod", {
        ascending: false,
      })
      .limit(8);

    if (error) {
      console.error("Error al cargar productos destacados:", error);

      setProductos([]);
      setErrorCarga("No fue posible cargar los productos destacados.");
      setCargando(false);
      return;
    }

    const productosAdaptados = (data || []).map((producto) => ({
      ...producto,
      imagen_url: obtenerUrlImagen(producto.imagen_url),
    }));

    setProductos(productosAdaptados);
    setCargando(false);
  }

  function formatearPrecio(precio) {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }).format(Number(precio));
  }

  function verDetalle(idProducto) {
    navigate(`/producto/${idProducto}`);
  }

  function manejarTeclado(event, idProducto) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      verDetalle(idProducto);
    }
  }

  return (
    <section className="featured-products">
      <div className="section-title">
        <span>⭐ PRODUCTOS DESTACADOS</span>

        <h2>Lo más nuevo en Ferreplast</h2>

        <p>
          Descubre algunos de los últimos productos incorporados a nuestro
          catálogo.
        </p>
      </div>

      {cargando && (
        <p className="featured-products__status">Cargando productos...</p>
      )}

      {!cargando && errorCarga && (
        <div className="featured-products__error">
          <p>{errorCarga}</p>

          <button type="button" onClick={cargarProductosDestacados}>
            Reintentar
          </button>
        </div>
      )}

      {!cargando && !errorCarga && productos.length === 0 && (
        <p className="featured-products__status">
          Actualmente no hay productos disponibles.
        </p>
      )}

      {!cargando && !errorCarga && productos.length > 0 && (
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
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
            const precioOriginal = Number(producto.precio_prod);

            const precioActual =
              producto.precio_act !== null && producto.precio_act !== undefined
                ? Number(producto.precio_act)
                : precioOriginal;

            const tieneOferta =
              precioOriginal > 0 && precioActual < precioOriginal;

            const familia =
              producto.subcategoria?.familia?.nom_familia || "Producto";

            return (
              <SwiperSlide key={producto.id_prod}>
                <article
                  className="featured-product-card"
                  onClick={() => verDetalle(producto.id_prod)}
                  onKeyDown={(event) => manejarTeclado(event, producto.id_prod)}
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
                      src={producto.imagen_url}
                      alt={producto.nom_prod}
                      className="featured-product-card__image"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = IMAGEN_RESPALDO;
                      }}
                    />
                  </div>

                  <div className="featured-product-card__info">
                    <small>{familia}</small>

                    <h3>{producto.nom_prod}</h3>

                    <div className="featured-product-card__prices">
                      {tieneOferta && (
                        <span className="featured-product-card__old-price">
                          {formatearPrecio(precioOriginal)}
                        </span>
                      )}

                      <span className="featured-product-card__price">
                        {formatearPrecio(precioActual)}
                      </span>
                    </div>
                  </div>
                </article>
              </SwiperSlide>
            );
          })}
        </Swiper>
      )}
    </section>
  );
}

export default FeaturedProducts;
