import "../css/home.css";
import FadeIn from "../../../animations/FadeIn";
import { motion } from "motion/react";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectFade } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

import {
  FaBullseye,
  FaEye,
  FaHandshake,
  FaCheck,
} from "react-icons/fa";

import proyecto1 from "../../../assets/proyectos/proyecto1.png";
import proyecto2 from "../../../assets/proyectos/proyecto2.png";

const pilares = [
  {
    icono: <FaBullseye />,
    titulo: "Misión",
    texto:
      "Brindar soluciones confiables mediante productos de alta calidad y atención personalizada.",
  },
  {
    icono: <FaEye />,
    titulo: "Visión",
    texto:
      "Ser un referente nacional en resinas, herramientas y productos para la construcción.",
  },
  {
    icono: <FaHandshake />,
    titulo: "Valores",
    texto:
      "Calidad, compromiso, honestidad, innovación y cercanía en cada compra.",
  },
];

function Mission() {
  return (
    <FadeIn>
      <section className="mission">
        <div className="mission__glow mission__glow--one" />
        <div className="mission__glow mission__glow--two" />

        <div className="mission-header">
          <motion.div
            className="mission-slider"
            initial={{ opacity: 0, x: -35 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <Swiper
              modules={[Autoplay, Pagination, EffectFade]}
              effect="fade"
              loop
              autoplay={{ delay: 4000, disableOnInteraction: false }}
              pagination={{ clickable: true }}
              className="mission-swiper"
            >
              <SwiperSlide>
                <img src={proyecto1} alt="Proyecto realizado con productos Ferreplast" />
              </SwiperSlide>

              <SwiperSlide>
                <img src={proyecto2} alt="Materiales y soluciones Ferreplast" />
              </SwiperSlide>
            </Swiper>

            <div className="mission-slider__badge">
              <FaCheck />
              <span>Calidad para proyectos reales</span>
            </div>
          </motion.div>

          <motion.div
            className="mission-info"
            initial={{ opacity: 0, x: 35 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <span className="mission-subtitle">DESDE PUERTO MONTT · CHILE</span>

            <h1>
              Materiales que hacen
              <strong> durar tus proyectos.</strong>
            </h1>

            <p className="mission-description">
              En <strong>Ferreplast</strong> combinamos productos profesionales,
              asesoría técnica y atención cercana para acompañarte desde la idea
              hasta el resultado final.
            </p>

            <div className="mission-stats">
              <div className="stat">
                <strong>Calidad</strong>
                <span>Productos seleccionados</span>
              </div>

              <div className="stat">
                <strong>Asesoría</strong>
                <span>Atención especializada</span>
              </div>

              <div className="stat">
                <strong>Confianza</strong>
                <span>Compra segura</span>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="mission-cards">
          {pilares.map((pilar, index) => (
            <motion.article
              key={pilar.titulo}
              className="mission-card"
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.12 }}
              whileHover={{ y: -10 }}
            >
              <div className="mission-icon">{pilar.icono}</div>
              <h2>{pilar.titulo}</h2>
              <p>{pilar.texto}</p>
              <span className="mission-card__line" />
            </motion.article>
          ))}
        </div>
      </section>
    </FadeIn>
  );
}

export default Mission;