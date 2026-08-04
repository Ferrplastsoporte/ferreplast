import "../css/home.css";
import FadeIn from "../../../animations/FadeIn";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectFade } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

import { FaBullseye, FaEye, FaHandshake } from "react-icons/fa";

import proyecto1 from "../../../assets/proyectos/proyecto1.png";
import proyecto2 from "../../../assets/proyectos/proyecto2.png";

function Mission() {
  return (
    <FadeIn>
      <section className="mission">

        <div className="mission-header">

          {/* Carrusel */}

          <div className="mission-slider">

            <Swiper
              modules={[Autoplay, Pagination, EffectFade]}
              effect="fade"
              loop={true}
              autoplay={{
                delay: 4000,
                disableOnInteraction: false,
              }}
              pagination={{
                clickable: true,
              }}
              className="mission-swiper"
            >

              <SwiperSlide>
                <img src={proyecto1} alt="Proyecto Ferreplast 1" />
              </SwiperSlide>

              <SwiperSlide>
                <img src={proyecto2} alt="Proyecto Ferreplast 2" />
              </SwiperSlide>

            </Swiper>

          </div>

          {/* Información */}

          <div className="mission-info">

            <span className="mission-subtitle">
              NUESTRA EMPRESA
            </span>

            <h2>
              Construimos confianza para cada proyecto.
            </h2>

            <p className="mission-description">
              En <strong>Ferreplast</strong> creemos que cada proyecto merece
              materiales de calidad, asesoría especializada y soluciones que
              entreguen resultados duraderos. Trabajamos para acompañar a
              nuestros clientes desde la elección del producto hasta la
              ejecución de sus ideas.
            </p>

            <div className="mission-stats">

              <div className="stat">
                <h3>✔</h3>
                <span>Productos Profesionales</span>
              </div>

              <div className="stat">
                <h3>✔</h3>
                <span>Calidad Garantizada</span>
              </div>

              <div className="stat">
                <h3>✔</h3>
                <span>Atención Cercana</span>
              </div>

            </div>

          </div>

        </div>

        {/* Tarjetas */}

        <div className="mission-cards">

          <div className="mission-card">

            <div className="mission-icon">
              <FaBullseye />
            </div>

            <h3>Misión</h3>

            <p>
              Brindar soluciones confiables mediante productos de alta
              calidad y una atención personalizada que permita a nuestros
              clientes desarrollar sus proyectos con seguridad, eficiencia
              y confianza.
            </p>

          </div>

          <div className="mission-card">

            <div className="mission-icon">
              <FaEye />
            </div>

            <h3>Visión</h3>

            <p>
              Convertirnos en un referente nacional en la distribución de
              resinas epóxicas, herramientas y productos para la
              construcción, destacando por nuestra innovación, compromiso
              y excelencia.
            </p>

          </div>

          <div className="mission-card">

            <div className="mission-icon">
              <FaHandshake />
            </div>

            <h3>Valores</h3>

            <p>
              Calidad, compromiso, honestidad, innovación y cercanía con
              nuestros clientes son los pilares que guían cada una de
              nuestras acciones.
            </p>

          </div>

        </div>

      </section>
    </FadeIn>
  );
}

export default Mission;