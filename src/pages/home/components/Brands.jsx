import "../css/home.css";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "../../../lib/supabase";

import FadeIn from "../../../animations/FadeIn";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";

import "swiper/css";

function Brands() {
  const [brands, setBrands] = useState([]);

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

      setBrands([]);
      setLoading(false);

      return;
    }

    const marcasAdaptadas = (data || []).map((marca) => ({
      ...marca,
      logo_url: obtenerUrlLogo(marca.logo_url),
    }));

    setBrands(marcasAdaptadas);

    setLoading(false);
  }

  function abrirMarca(idMarca) {
    navigate(`/catalogo?marca=${idMarca}`);
  }

  return (
    <FadeIn>
      <section className="brands">

        <span>MARCAS EXCLUSIVAS</span>

        <h2>Representamos marcas líderes del mercado</h2>

        <p>
          En Ferreplast trabajamos con fabricantes reconocidos por su calidad,
          innovación y confianza, ofreciendo productos originales para cada
          tipo de proyecto.
        </p>

        {loading ? (
          <p className="brands-loading">
            Cargando marcas...
          </p>
        ) : brands.length === 0 ? (
          <p className="brands-loading">
            No hay marcas destacadas disponibles.
          </p>
        ) : (
          <Swiper
            modules={[Autoplay]}
            loop={true}
            speed={900}
            spaceBetween={25}
            autoplay={{
              delay: 2500,
              disableOnInteraction: false,
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
            {brands.map((brand) => (
              <SwiperSlide key={brand.id_marca}>
                <div
                  className="brand-card"
                  onClick={() => abrirMarca(brand.id_marca)}
                >
                  <img
                    src={brand.logo_url}
                    alt={brand.nom_marca}
                    className="brand-logo"
                  />

                  <h3>{brand.nom_marca}</h3>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        )}

      </section>
    </FadeIn>
  );
}

export default Brands;