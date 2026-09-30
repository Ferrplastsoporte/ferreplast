import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Swiper, SwiperSlide } from "swiper/react";
import {
  Navigation,
  Pagination,
  Autoplay,
} from "swiper/modules";

import { supabase } from "../../../lib/supabase";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "../css/productos-destacados.css";

const IMAGEN_RESPALDO =
  "https://placehold.co/600x400?text=Sin+imagen";

function ProductosDestacados() {
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

    if (
      rutaImagen.startsWith("http://") ||
      rutaImagen.startsWith("https://")
    ) {
      return rutaImagen;
    }

    const { data } = supabase.storage
      .from("imagenes_productos")
      .getPublicUrl(rutaImagen);

    return data?.publicUrl || IMAGEN_RESPALDO;
  }

  async function cargarProductosDestacados() {
    setCargando(true);
    setErrorCarga("");

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
      `)
      .eq("est_prod", 2)
      .order("created_prod", {
        ascending: false,
      })
      .limit(8);

    if (error) {
      console.error(
        "Error al cargar productos destacados:",
        error
      );

      setProductos([]);
      setErrorCarga(
        "No fue posible cargar los productos destacados."
      );
      setCargando(false);

      return;
    }

    const productosAdaptados = (data || []).map(
      (producto) => ({
        ...producto,
        imagen_url: obtenerUrlImagen(
          producto.imagen_url
        ),
      })
    );

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
    if (
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      verDetalle(idProducto);
    }
  }

  return (
    <section className="productos-destacados">

      {/* =========================
          ENCABEZADO
      ========================= */}

      <div className="productos-destacados__encabezado">

        <div className="productos-destacados__titulo">

          <span className="productos-destacados__etiqueta">
            FERREPLAST · SELECCIÓN
          </span>

          <h2>
            Productos
            <strong>destacados.</strong>
          </h2>

          <p>
            Descubre productos seleccionados
            recientemente incorporados a nuestro
            catálogo.
          </p>

        </div>

        <button
          type="button"
          className="productos-destacados__ver-todos"
          onClick={() => navigate("/catalogo")}
        >
          Ver catálogo
          <span>→</span>
        </button>

      </div>


      {/* =========================
          CARGANDO
      ========================= */}

      {cargando && (
        <div className="productos-destacados__carga">

          <div className="productos-destacados__indicador" />

          <span>
            Cargando productos...
          </span>

        </div>
      )}


      {/* =========================
          ERROR
      ========================= */}

      {!cargando && errorCarga && (
        <div className="productos-destacados__error">

          <div>
            <strong>
              No pudimos cargar los productos
            </strong>

            <p>
              {errorCarga}
            </p>
          </div>

          <button
            type="button"
            onClick={cargarProductosDestacados}
          >
            Reintentar
          </button>

        </div>
      )}


      {/* =========================
          SIN PRODUCTOS
      ========================= */}

      {!cargando &&
        !errorCarga &&
        productos.length === 0 && (
          <div className="productos-destacados__vacio">

            <span>📦</span>

            <p>
              Actualmente no hay productos
              disponibles.
            </p>

          </div>
        )}


      {/* =========================
          PRODUCTOS
      ========================= */}

      {!cargando &&
        !errorCarga &&
        productos.length > 0 && (

          <div className="productos-destacados__carrusel">

            <Swiper
              modules={[
                Navigation,
                Pagination,
                Autoplay,
              ]}
              spaceBetween={22}
              navigation
              pagination={{
                clickable: true,
              }}
              autoplay={{
                delay: 3800,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              loop={productos.length > 4}
              grabCursor
              breakpoints={{
                0: {
                  slidesPerView: 1,
                },
                560: {
                  slidesPerView: 2,
                },
                900: {
                  slidesPerView: 3,
                },
                1280: {
                  slidesPerView: 4,
                },
              }}
            >

              {productos.map((producto) => {

                const precioOriginal =
                  Number(
                    producto.precio_prod
                  );

                const precioActual =
                  producto.precio_act !== null &&
                  producto.precio_act !== undefined
                    ? Number(
                        producto.precio_act
                      )
                    : precioOriginal;

                const tieneOferta =
                  precioOriginal > 0 &&
                  precioActual <
                    precioOriginal;

                const familia =
                  producto.subcategoria
                    ?.familia
                    ?.nom_familia ||
                  "Producto";

                const stock =
                  Number(
                    producto.stock_prod
                  );

                const tieneStock =
                  stock > 0;

                return (
                  <SwiperSlide
                    key={producto.id_prod}
                  >

                    <article
                      className="tarjeta-producto-destacado"
                      onClick={() =>
                        verDetalle(
                          producto.id_prod
                        )
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

                      {/* Imagen */}

                      <div className="tarjeta-producto-destacado__contenedor-imagen">

                        <img
                          src={
                            producto.imagen_url
                          }
                          alt={
                            producto.nom_prod
                          }
                          className="tarjeta-producto-destacado__imagen"
                          loading="lazy"
                          onError={(
                            event
                          ) => {
                            event.currentTarget.onerror =
                              null;

                            event.currentTarget.src =
                              IMAGEN_RESPALDO;
                          }}
                        />

                        <div className="tarjeta-producto-destacado__capa-imagen" />


                        {/* Oferta */}

                        {tieneOferta && (
                          <span className="tarjeta-producto-destacado__insignia">
                            OFERTA
                          </span>
                        )}


                        {/* Stock */}

                        <span
                          className={`tarjeta-producto-destacado__disponibilidad ${
                            tieneStock
                              ? "tarjeta-producto-destacado__disponibilidad--available"
                              : "tarjeta-producto-destacado__disponibilidad--no-disponible"
                          }`}
                        >
                          <i />
                          {tieneStock
                            ? "Disponible"
                            : "Sin stock"}
                        </span>

                      </div>


                      {/* Información */}

                      <div className="tarjeta-producto-destacado__informacion">

                        <span className="tarjeta-producto-destacado__categoria">
                          {familia}
                        </span>

                        <h3>
                          {producto.nom_prod}
                        </h3>

                        <div className="tarjeta-producto-destacado__inferior">

                          <div className="tarjeta-producto-destacado__precios">

                            {tieneOferta && (
                              <span className="tarjeta-producto-destacado__precio-anterior">
                                {formatearPrecio(
                                  precioOriginal
                                )}
                              </span>
                            )}

                            <span className="tarjeta-producto-destacado__precio">
                              {formatearPrecio(
                                precioActual
                              )}
                            </span>

                          </div>

                          <span className="tarjeta-producto-destacado__flecha">
                            →
                          </span>

                        </div>

                      </div>

                    </article>

                  </SwiperSlide>
                );
              })}

            </Swiper>

          </div>
        )}

    </section>
  );
}

export default ProductosDestacados;


