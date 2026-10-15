import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";

import "../css/mision.css";

import proyecto1 from "../../../assets/proyectos/proyecto1.png";
import proyecto2 from "../../../assets/proyectos/proyecto2.png";
import puertoMontt from "../../../assets/Puerto_Montt.jpeg";
import localFerreplast from "../../../assets/local_ferreplast.JPEG";

import iconoMision from "../../../assets/iconos/home_mision/mision_logo_contacto.png";
import iconoVision from "../../../assets/iconos/home_mision/vision_logo_contacto.png";
import iconoValores from "../../../assets/iconos/home_mision/valores_logo_contacto.png";

const proyectos = [
  {
    imagen: proyecto1,
    etiqueta: "Proyecto real",
    titulo: "Fabricación en fibra de vidrio",
  },
  {
    imagen: proyecto2,
    etiqueta: "Soluciones Ferreplast",
    titulo: "Materiales para proyectos industriales",
  },
];

const etapas = [
  {
    etiqueta: "Antes de comprar",
    icono: iconoMision,
    titulo: "Asesoría técnica",
    texto: "Te ayudamos a elegir la solución adecuada para tu proyecto.",
  },
  {
    etiqueta: "Durante",
    icono: iconoVision,
    titulo: "Atención directa",
    texto:
      "Canales directos para responder a tiempo y según tus necesidades.",
  },
  {
    etiqueta: "Después",
    icono: iconoValores,
    titulo: "Soporte y seguimiento",
    texto: "Seguimos acompañándote una vez concretada la compra.",
  },
];

const grupos = [
  {
    tono: "azul",
    titulo: "Fibra de vidrio y resinas",
    texto:
      "Resinas epóxicas, poliéster y viniléster para aplicaciones industriales y de construcción.",
  },
  {
    tono: "blanco",
    titulo: "Aditivos y solventes",
    texto:
      "Para optimizar la eficiencia y la seguridad de tus procesos productivos.",
  },
  {
    tono: "rojo",
    titulo: "Pinturas náuticas e industriales",
    texto: "Protegen y decoran superficies en entornos exigentes.",
  },
  {
    tono: "blanco",
    titulo: "Pallets y bandejas antiderrames",
    texto: "Manejo y almacenamiento seguro de materiales.",
  },
  {
    tono: "azul",
    titulo: "Grating y ferretería",
    texto:
      "Parrillas grating y artículos de ferretería para usos industriales y comerciales.",
  },
];

const productos = [
  "Resinas epóxicas",
  "Resinas poliéster",
  "Resinas viniléster",
  "Fibra de vidrio",
  "Aditivos",
  "Solventes industriales",
  "Pinturas náuticas",
  "Pinturas industriales",
  "Pallets plásticos",
  "Bandejas antiderrames",
  "Grating",
  "Ferretería",
];

const TIEMPO_CARRUSEL = 5000;

function Mision() {
  const [proyectoActivo, setProyectoActivo] = useState(0);
  const reducirMovimiento = useReducedMotion();

  const cambiarProyecto = (direccion) => {
    setProyectoActivo(
      (actual) => (actual + direccion + proyectos.length) % proyectos.length
    );
  };

  /* Carrusel automático (se reinicia cada vez que el usuario cambia de slide) */
  useEffect(() => {
    if (reducirMovimiento) return undefined;

    const temporizador = setTimeout(() => {
      setProyectoActivo((actual) => (actual + 1) % proyectos.length);
    }, TIEMPO_CARRUSEL);

    return () => clearTimeout(temporizador);
  }, [proyectoActivo, reducirMovimiento]);

  const aparecer = {
    initial: { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.6, ease: "easeOut" },
  };

  return (
    <section className="mision" id="mision">
      {/* =====================================================
          HERO
      ====================================================== */}
      <div className="mision__hero">
        <div className="mision__contenedor mision__hero-grid">
          {/* ---------- Texto ---------- */}
          <motion.div
            className="mision__texto"
            initial={{ opacity: 0, x: -36 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <p className="mision__ubicacion">
              <span className="mision__punto" aria-hidden="true" />
              Desde Puerto Montt, Chile
            </p>

            <h1>
              Hacemos que tu <span className="mision__marca">proyecto</span>{" "}
              avance.
            </h1>

            <p className="mision__descripcion">
              Productos químicos y materiales industriales para proyectos que
              necesitan soluciones confiables.
            </p>

            <div className="mision__acciones">
              <Link
                to="/cotizacion"
                className="mision__accion mision__accion--principal"
              >
                Solicitar cotización
                <span aria-hidden="true">→</span>
              </Link>

              <Link
                to="/catalogo"
                className="mision__accion mision__accion--secundaria"
              >
                Ver productos
              </Link>
            </div>

            <div className="mision__estadisticas">
              <div className="mision__estadistica mision__estadistica--roja">
                <strong>15+</strong>
                <span>Años de experiencia</span>
              </div>

              <div className="mision__estadistica mision__estadistica--azul">
                <strong>360°</strong>
                <span>Soporte integral</span>
              </div>
            </div>
          </motion.div>

          {/* ---------- Visual ---------- */}
          <motion.div
            className="mision__visual"
            initial={{ opacity: 0, x: 36 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          >
            <div className="mision__carrusel">
              {proyectos.map((proyecto, index) => (
                <figure
                  key={proyecto.imagen}
                  className={`mision__slide ${
                    proyectoActivo === index ? "mision__slide--activo" : ""
                  }`}
                  aria-hidden={proyectoActivo !== index}
                >
                  <img src={proyecto.imagen} alt={proyecto.titulo} />

                  <div className="mision__slide-overlay" />

                  <figcaption>
                    <p>{proyecto.etiqueta}</p>
                    <h2>{proyecto.titulo}</h2>
                  </figcaption>
                </figure>
              ))}

              <div className="mision__etiqueta">Aplicaciones reales</div>

              <div className="mision__controles">
                <button
                  type="button"
                  onClick={() => cambiarProyecto(-1)}
                  aria-label="Proyecto anterior"
                >
                  ←
                </button>

                <button
                  type="button"
                  onClick={() => cambiarProyecto(1)}
                  aria-label="Proyecto siguiente"
                >
                  →
                </button>
              </div>

              <div className="mision__puntos">
                {proyectos.map((proyecto, index) => (
                  <button
                    key={proyecto.titulo}
                    type="button"
                    className={
                      proyectoActivo === index
                        ? "mision__punto-nav mision__punto-nav--activo"
                        : "mision__punto-nav"
                    }
                    onClick={() => setProyectoActivo(index)}
                    aria-label={`Ver proyecto ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            <div className="mision__mini">
              <figure className="mision__card">
                <img src={puertoMontt} alt="Vista de Puerto Montt" />
                <div className="mision__card-overlay" />
                <figcaption>
                  <p>Desde Puerto Montt</p>
                  <h3>Presencia local</h3>
                </figcaption>
              </figure>

              <figure className="mision__card">
                <img
                  src={localFerreplast}
                  alt="Fachada del local Ferreplast en Puerto Montt"
                />
                <div className="mision__card-overlay" />
                <figcaption>
                  <p>Ferreplast</p>
                  <h3>Soluciones confiables</h3>
                </figcaption>
              </figure>
            </div>
          </motion.div>
        </div>
      </div>

      {/* =====================================================
          CINTA DE PRODUCTOS
      ====================================================== */}
      <div className="mision__cinta" aria-label="Principales productos">
        <div className="mision__cinta-pista">
          {[0, 1].map((copia) => (
            <ul key={copia} aria-hidden={copia === 1}>
              {productos.map((producto) => (
                <li key={`${copia}-${producto}`}>{producto}</li>
              ))}
            </ul>
          ))}
        </div>
      </div>

      {/* =====================================================
          CARTA DE PRESENTACIÓN
      ====================================================== */}
      <section className="mision__carta">
        <div className="mision__contenedor mision__carta-grid">
          <motion.div className="mision__carta-texto" {...aparecer}>
            <p className="mision__carta-etiqueta">Carta de presentación</p>

            <h2>
              Soluciones eficaces y <span>expeditas.</span>
            </h2>

            <p>
              Somos Ferreplast SPA: venta de productos químicos y materiales
              industriales de alta calidad, respaldada por un equipo de
              expertos con más de 15 años de experiencia en el rubro.
            </p>

            <p>
              Nuestro sello es la atención personalizada, presente en todas las
              etapas de tu compra.
            </p>

            <blockquote className="mision__carta-cierre">
              <p>
                Nos enorgullece la confianza que hemos construido con nuestros
                clientes y seguiremos trabajando para tener relaciones
                comerciales sólidas y duraderas, que aporten al crecimiento de
                tu organización.
              </p>

              <footer>
                <strong>Erwin Fuentes Mayorga</strong>
                <span>Ventas técnicas · Quedo atento para coordinar una reunión</span>
              </footer>
            </blockquote>
          </motion.div>

          <ol className="mision__etapas">
            {etapas.map((etapa, index) => (
              <motion.li
                className="mision__etapa"
                key={etapa.titulo}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.55, delay: index * 0.12 }}
              >
                <div className="mision__etapa-icono">
                  <img src={etapa.icono} alt="" />
                </div>

                <div className="mision__etapa-info">
                  <p>{etapa.etiqueta}</p>
                  <h3>{etapa.titulo}</h3>
                  <span>{etapa.texto}</span>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      {/* =====================================================
          LO QUE OFRECEMOS
      ====================================================== */}
      <section className="mision__ofrece">
        <div className="mision__contenedor">
          <motion.div className="mision__ofrece-cabecera" {...aparecer}>
            <h2>Lo que ofrecemos</h2>

            <p>
              Distintas presentaciones para clientes
              <b>mayoristas</b>
              <b>minoristas</b>
            </p>
          </motion.div>

          <div className="mision__grupos">
            {grupos.map((grupo, index) => (
              <motion.article
                key={grupo.titulo}
                className={`mision__grupo mision__grupo--${grupo.tono}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
              >
                <h3>{grupo.titulo}</h3>
                <p>{grupo.texto}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
    </section>
  );
}

export default Mision;