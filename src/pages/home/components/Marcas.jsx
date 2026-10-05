import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "../../../lib/supabase";

import FadeIn from "../../../animations/FadeIn";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";

import "swiper/css";
import "../css/marcas.css";

function Marcas() {
  const [marcas, setMarcas] = useState([]);

  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    cargarMarcas();
  }, []);

  function obtenerUrlLogo(rutaLogo) {
    if (!rutaLogo) {
      return "";
    }

    if (
      rutaLogo.startsWith("http://") ||
      rutaLogo.startsWith("https://")
    ) {
      return rutaLogo;
    }

    const { data } = supabase.storage
      .from("imagenes_productos")
      .getPublicUrl(rutaLogo);

    return data.publicUrl;
  }

  async function cargarMarcas() {
    setLoading(true);

    const { data, error } = await supabase
      .from("marca_producto")
      .select(`
        id_marca,
        nom_marca,
        logo_url,
        marca_destacar,
        est_marca
      `)
      .eq("est_marca", true)
      .eq("marca_destacar", true)
      .order("nom_marca", {
        ascending: true,
      });

    if (error) {
      console.error("Error al cargar marcas:", error);

      setMarcas([]);
      setLoading(false);

      return;
    }

    const marcasAdaptadas = (data || []).map((marca) => ({
      ...marca,
      logo_url: obtenerUrlLogo(marca.logo_url),
    }));

    setMarcas(marcasAdaptadas);

    setLoading(false);
  }

  function abrirMarca(idMarca) {
    navigate(`/catalogo?marca=${idMarca}`);
  }

  return (
    <FadeIn>
      <section className="marcas">

        <span>MARCAS EXCLUSIVAS</span>

        <h2>Representamos marcas líderes del mercado</h2>

        <p>
          En Ferreplast trabajamos con fabricantes reconocidos por su calidad,
          innovación y confianza, ofreciendo productos originales para cada
          tipo de proyecto.
        </p>

        {loading ? (
          <p className="marcas-cargando">
            Cargando marcas...
          </p>
        ) : marcas.length === 0 ? (
          <p className="marcas-cargando">
            No hay marcas destacadas disponibles.
          </p>
        ) : (
          <Swiper
            modules={[Autoplay]}
            loop={marcas.length > 5}
            rewind
            grabCursor
            speed={900}
            spaceBetween={25}
            autoplay={{
              delay: 2500,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            breakpoints={{
              0: {
                slidesPerView: 2,
              },
              600: {
                slidesPerView: 3,
              },
              900: {
                slidesPerView: 4,
              },
              1200: {
                slidesPerView: 5,
              },
            }}
          >
            {marcas.map((marca) => (
              <SwiperSlide key={marca.id_marca}>
                <button
                  type="button"
                  className="tarjeta-marca"
                  onClick={() => abrirMarca(marca.id_marca)}
                  aria-label={`Ver productos de ${marca.nom_marca}`}
                >
                  {marca.logo_url ? (
                    <img
                      src={marca.logo_url}
                      alt={marca.nom_marca}
                      className="logo-marca"
                    />
                  ) : <span className="tarjeta-marca__nombre">{marca.nom_marca}</span>}
                </button>
              </SwiperSlide>
            ))}
          </Swiper>
        )}

      </section>
    </FadeIn>
  );
}

export default Marcas;




