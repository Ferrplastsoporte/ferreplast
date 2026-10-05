import { motion } from "motion/react";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectFade } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";
import "../css/mision.css";

import { FaCheck } from "react-icons/fa";
import iconoMision from "../../../assets/iconos/home_mision/mision_logo_contacto.png";
import iconoVision from "../../../assets/iconos/home_mision/vision_logo_contacto.png";
import iconoValores from "../../../assets/iconos/home_mision/valores_logo_contacto.png";

import proyecto1 from "../../../assets/proyectos/proyecto1.png";
import proyecto2 from "../../../assets/proyectos/proyecto2.png";

const pilares = [
  {
    icono: iconoMision,
    titulo: "Misión",
    texto:
      "Brindar soluciones confiables mediante productos de alta calidad y atención personalizada.",
  },
  {
    icono: iconoVision,
    titulo: "Visión",
    texto:
      "Ser un referente nacional en resinas, herramientas y productos para la construcción.",
  },
  {
    icono: iconoValores,
    titulo: "Valores",
    texto:
      "Calidad, compromiso, honestidad, innovación y cercanía en cada compra.",
  },
];

function Mision() {
  return (
      <section className="mision">
        <div className="mision__brillo mision__brillo--uno" />
        <div className="mision__brillo mision__brillo--dos" />

        <div className="mision-encabezado">
          <motion.div
            className="mision-carrusel"
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
              className="mision-carrusel-principal"
            >
              <SwiperSlide>
                <img src={proyecto1} alt="Proyecto realizado con productos Ferreplast" />
              </SwiperSlide>

              <SwiperSlide>
                <img src={proyecto2} alt="Materiales y soluciones Ferreplast" />
              </SwiperSlide>
            </Swiper>

            <div className="mision-carrusel__insignia">
              <FaCheck />
              <span>Calidad para proyectos reales</span>
            </div>
          </motion.div>

          <motion.div
            className="mision-informacion"
            initial={{ opacity: 0, x: 35 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <span className="mision-subtitulo">DESDE PUERTO MONTT · CHILE</span>

            <h1>
              Insumos para <strong>plásticos reforzados (FRP)</strong> y ferretería
            </h1>

            <p className="mision-descripcion">
              Fibra de vidrio, resinas y herramientas para tus proyectos.
              En <strong>Ferreplast</strong> combinamos materiales profesionales,
              asesoría técnica y atención cercana desde Puerto Montt.
            </p>

            <div className="mision-estadisticas">
              <div className="estadistica">
                <strong>Calidad</strong>
                <span>Productos seleccionados</span>
              </div>

              <div className="estadistica">
                <strong>Asesoría</strong>
                <span>Atención especializada</span>
              </div>

              <div className="estadistica">
                <strong>Confianza</strong>
                <span>Compra segura</span>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="mision-tarjetas">
          {pilares.map((pilar, index) => (
            <motion.article
              key={pilar.titulo}
              className="mision-tarjeta"
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.12 }}
              whileHover={{ y: -5 }}
            >
              <div className="mision-icono"><img src={pilar.icono} alt="" /></div>
              <h2>{pilar.titulo}</h2>
              <p>{pilar.texto}</p>
              <span className="mision-tarjeta__linea" />
            </motion.article>
          ))}
        </div>
      </section>
  );
}

export default Mision;


