import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";

import "../css/mision.css";

import proyecto1 from "../../../assets/proyectos/proyecto1.png";
import proyecto2 from "../../../assets/proyectos/proyecto2.png";
import puertoMontt from "../../../assets/Puerto_Montt.jpeg";

import iconoMision from "../../../assets/iconos/home_mision/mision_logo_contacto.png";
import iconoVision from "../../../assets/iconos/home_mision/vision_logo_contacto.png";
import iconoValores from "../../../assets/iconos/home_mision/valores_logo_contacto.png";


const proyectos = [
  {
    imagen: proyecto1,
    etiqueta: "PROYECTO REAL",
    titulo: "Fabricación en fibra de vidrio",
  },
  {
    imagen: proyecto2,
    etiqueta: "SOLUCIONES FERREPLAST",
    titulo: "Materiales para proyectos industriales",
  },
];


const pilares = [
  {
    numero: "01",
    icono: iconoMision,
    titulo: "Asesoría técnica",
    texto:
      "Te ayudamos a encontrar la solución adecuada según las necesidades de tu proyecto.",
  },
  {
    numero: "02",
    icono: iconoVision,
    titulo: "Atención personalizada",
    texto:
      "Mantenemos canales de comunicación directos para entregar respuestas oportunas.",
  },
  {
    numero: "03",
    icono: iconoValores,
    titulo: "Soporte postventa",
    texto:
      "Acompañamos al cliente desde la compra hasta el seguimiento posterior.",
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


function Mision() {
  const [proyectoActivo, setProyectoActivo] = useState(0);


  const cambiarProyecto = (direccion) => {
    setProyectoActivo(
      (actual) =>
        (actual + direccion + proyectos.length) % proyectos.length
    );
  };


  return (
    <section className="mision" id="mision">

      <div className="mision__seccion">


        {/* =====================================================
            CONTENIDO PRINCIPAL
        ====================================================== */}

        <div className="mision__principal">


          {/* ===================================================
              INTRO / MISIÓN
          ==================================================== */}

          <motion.div
            className="mision__intro"

            initial={{
              opacity: 0,
              x: -30,
            }}

            whileInView={{
              opacity: 1,
              x: 0,
            }}

            viewport={{
              once: true,
            }}

            transition={{
              duration: 0.7,
            }}
          >

            <div className="mision__numero">
              <span>01</span>
            </div>


            <div>

              <p className="mision__eyebrow">
                Desde Puerto Montt · Chile
              </p>


              <h1>
                Hacemos que tu{" "}
                <span>proyecto avance.</span>
              </h1>


              <p className="mision__descripcion">
                Productos químicos y materiales industriales para
                proyectos que necesitan soluciones confiables.
              </p>

            </div>


            <div className="mision__parte-inferior">


              {/* =================================================
                  ESTADÍSTICAS
              ================================================== */}

              <div className="mision__estadisticas">

                <div>

                  <strong>
                    15+
                  </strong>

                  <span>
                    Años de experiencia
                  </span>

                </div>


                <div>

                  <strong>
                    360°
                  </strong>

                  <span>
                    Soporte integral
                  </span>

                </div>

              </div>


              {/* =================================================
                  BOTONES
              ================================================== */}

              <div className="mision__acciones">


                {/* Solicitar cotización */}

                <Link
                  to="/cotizacion"
                  className="mision__accion mision__accion--principal"
                >
                  Solicitar cotización

                  <span>
                    →
                  </span>
                </Link>


                {/* Catálogo */}

                <Link
                  to="/catalogo"
                  className="mision__accion mision__accion--secundaria"
                >
                  Ver productos
                </Link>

              </div>

            </div>

          </motion.div>


          {/* ===================================================
              GALERÍA
          ==================================================== */}

          <motion.div
            className="mision__galeria"

            initial={{
              opacity: 0,
              x: 30,
            }}

            whileInView={{
              opacity: 1,
              x: 0,
            }}

            viewport={{
              once: true,
            }}

            transition={{
              duration: 0.7,
            }}
          >


            {/* =================================================
                CARRUSEL
            ================================================== */}

            <div className="mision__carrusel">


              {proyectos.map((proyecto, index) => (

                <figure
                  key={proyecto.imagen}

                  className={`mision__slide ${
                    proyectoActivo === index
                      ? "mision__slide--activo"
                      : ""
                  }`}
                >

                  <img
                    src={proyecto.imagen}
                    alt={proyecto.titulo}
                  />


                  <div className="mision__slide-overlay" />


                  <figcaption>

                    <p>
                      {proyecto.etiqueta}
                    </p>

                    <h2>
                      {proyecto.titulo}
                    </h2>

                  </figcaption>

                </figure>

              ))}


              {/* Etiqueta */}

              <div className="mision__etiqueta">
                Aplicaciones reales
              </div>


              {/* Controles */}

              <div className="mision__controles">

                <button
                  type="button"

                  onClick={() =>
                    cambiarProyecto(-1)
                  }

                  aria-label="Proyecto anterior"
                >
                  ←
                </button>


                <button
                  type="button"

                  onClick={() =>
                    cambiarProyecto(1)
                  }

                  aria-label="Proyecto siguiente"
                >
                  →
                </button>

              </div>

            </div>


            {/* =================================================
                PUERTO MONTT
            ================================================== */}

            <figure className="mision__card mision__card--puerto">

              <img
                src={puertoMontt}
                alt="Vista de Puerto Montt"
              />


              <div className="mision__card-overlay" />


              <figcaption>

                <p>
                  DESDE PUERTO MONTT
                </p>

                <h3>
                  Presencia local
                </h3>

              </figcaption>

            </figure>


            {/* =================================================
                FERREPLAST
            ================================================== */}

            <figure className="mision__card mision__card--local">

              <img
                src={proyecto2}
                alt="Soluciones industriales Ferreplast"
              />


              <div className="mision__card-overlay" />


              <figcaption>

                <p>
                  FERREPLAST
                </p>

                <h3>
                  Soluciones confiables
                </h3>

              </figcaption>

            </figure>

          </motion.div>

        </div>


        {/* =====================================================
            CLIENTES
        ====================================================== */}

        <motion.div
          className="mision__clientes"

          initial={{
            opacity: 0,
            y: 25,
          }}

          whileInView={{
            opacity: 1,
            y: 0,
          }}

          viewport={{
            once: true,
          }}

          transition={{
            duration: 0.6,
          }}
        >


          {/* =================================================
              CLIENTE MINORISTA
          ================================================== */}

          <div className="mision__cliente">

            <span className="mision__cliente-numero">
              01
            </span>


            <div className="mision__cliente-info">

              <p>
                Atención
              </p>

              <h3>
                Clientes minoristas
              </h3>

            </div>


            <Link
              to="/cotizacion"
              className="mision__cliente-boton"
              aria-label="Cotizar como cliente minorista"
            >
              →
            </Link>

          </div>


          {/* =================================================
              CLIENTE MAYORISTA
          ================================================== */}

          <div className="mision__cliente">

            <span className="mision__cliente-numero">
              02
            </span>


            <div className="mision__cliente-info">

              <p>
                Atención
              </p>

              <h3>
                Clientes mayoristas
              </h3>

            </div>


            <Link
              to="/cotizacion"
              className="mision__cliente-boton mision__cliente-boton--azul"
              aria-label="Cotizar como cliente mayorista"
            >
              →
            </Link>

          </div>


          {/* =================================================
              PRODUCTOS
          ================================================== */}

          <div className="mision__productos">

            <p>
              Principales productos
            </p>


            <div>

              {productos.map((producto) => (

                <span key={producto}>
                  {producto}
                </span>

              ))}

            </div>

          </div>

        </motion.div>


        {/* =====================================================
            PILARES
        ====================================================== */}

        <motion.section
          className="mision__pilares-seccion"

          initial={{
            opacity: 0,
            y: 30,
          }}

          whileInView={{
            opacity: 1,
            y: 0,
          }}

          viewport={{
            once: true,
          }}

          transition={{
            duration: 0.7,
          }}
        >


          <div className="mision__pilares-titulo">

            <p>
              NUESTRA PROPUESTA
            </p>


            <h2>
              Más que productos.
              <br />

              <span>
                Soluciones.
              </span>
            </h2>

          </div>


          <div className="mision__pilares">

            {pilares.map((pilar) => (

              <article
                className="mision__pilar"
                key={pilar.numero}
              >

                <div className="mision__pilar-top">

                  <span>
                    {pilar.numero}
                  </span>


                  <img
                    src={pilar.icono}
                    alt=""
                  />

                </div>


                <h3>
                  {pilar.titulo}
                </h3>


                <p>
                  {pilar.texto}
                </p>

              </article>

            ))}

          </div>

        </motion.section>


        {/* =====================================================
            FOOTER DE LA SECCIÓN
        ====================================================== */}

        <footer className="mision__footer">

          <p>
            <span className="mision__footer-destacado">
              FERREPLAST SPA
            </span>
          </p>


          <p>
            Productos químicos · Materiales industriales
          </p>


          <p>
            Puerto Montt · Chile
          </p>

        </footer>

      </div>

    </section>
  );
}


export default Mision;