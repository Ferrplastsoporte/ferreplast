import { useState } from "react";
import "../css/ayuda.css";

function Ayuda() {
  const [abierta, setAbierta] = useState(null);

  const preguntas = [
    {
      pregunta: "¿Cómo puedo realizar una compra?",
      respuesta:
        "Busca el producto que necesitas en el catálogo, agrégalo al carrito y continúa con el proceso de compra. Antes de finalizar podrás revisar los productos, cantidades y total de tu pedido.",
    },
    {
      pregunta: "¿Cómo puedo revisar mis pedidos?",
      respuesta:
        "Puedes revisar tus pedidos desde el menú de tu cuenta, ingresando a la sección Mis pedidos. Allí podrás consultar el estado y la información de cada compra.",
    },
    {
      pregunta: "¿Cómo puedo modificar mis datos?",
      respuesta:
        "Puedes revisar tu información personal desde la sección Mi cuenta. Si necesitas modificar algún dato que no esté disponible para edición, puedes contactarnos directamente.",
    },
    {
      pregunta: "¿Qué medios de pago puedo utilizar?",
      respuesta:
        "Ferreplast permite realizar pagos mediante los medios habilitados durante el proceso de compra. Las opciones disponibles se mostrarán antes de confirmar el pedido.",
    },
    {
      pregunta: "¿Cómo funciona el despacho?",
      respuesta:
        "Las opciones y costos de despacho dependen de la modalidad disponible para tu pedido. La información correspondiente se mostrará durante el proceso de compra.",
    },
    {
      pregunta: "¿Qué hago si tengo un problema con mi pedido?",
      respuesta:
        "Si tienes algún inconveniente con una compra, puedes comunicarte con Ferreplast utilizando nuestros canales de contacto para que podamos revisar tu caso.",
    },
  ];

  function cambiarPregunta(index) {
    setAbierta(abierta === index ? null : index);
  }

  return (
    <main className="ayuda-page">

      {/* =====================================================
          ENCABEZADO
          ===================================================== */}

      <section className="ayuda-header">

        <span className="ayuda-eyebrow">
          CENTRO DE AYUDA
        </span>

        <h1>
          ¿Cómo podemos
          <span> ayudarte?</span>
        </h1>

        <p>
          Encuentra respuestas a las preguntas más frecuentes
          sobre tus compras, pedidos y cuenta Ferreplast.
        </p>

      </section>


      {/* =====================================================
          ACCESOS RÁPIDOS
          ===================================================== */}

      <section className="ayuda-accesos">

        <article className="ayuda-acceso">

          <div className="ayuda-acceso__icon">
            🛒
          </div>

          <div>
            <span>COMPRAS</span>

            <h2>
              Comprar productos
            </h2>

            <p>
              Revisa nuestro catálogo y encuentra
              lo que necesitas.
            </p>
          </div>

        </article>


        <article className="ayuda-acceso">

          <div className="ayuda-acceso__icon">
            📦
          </div>

          <div>
            <span>PEDIDOS</span>

            <h2>
              Revisar un pedido
            </h2>

            <p>
              Consulta el estado de tus compras
              realizadas.
            </p>
          </div>

        </article>


        <article className="ayuda-acceso">

          <div className="ayuda-acceso__icon">
            👤
          </div>

          <div>
            <span>CUENTA</span>

            <h2>
              Mi información
            </h2>

            <p>
              Revisa los datos asociados a tu cuenta.
            </p>
          </div>

        </article>

      </section>


      {/* =====================================================
          PREGUNTAS FRECUENTES
          ===================================================== */}

      <section className="ayuda-faq">

        <div className="ayuda-section-title">

          <span>
            PREGUNTAS FRECUENTES
          </span>

          <h2>
            Lo que necesitas saber
          </h2>

          <p>
            Revisa las respuestas a las consultas más
            habituales de nuestros clientes.
          </p>

        </div>


        <div className="ayuda-preguntas">

          {preguntas.map((item, index) => {

            const estaAbierta = abierta === index;

            return (
              <article
                key={index}
                className={`ayuda-pregunta ${
                  estaAbierta
                    ? "ayuda-pregunta--abierta"
                    : ""
                }`}
              >

                <button
                  type="button"
                  className="ayuda-pregunta__button"
                  onClick={() => cambiarPregunta(index)}
                  aria-expanded={estaAbierta}
                >

                  <span>
                    {item.pregunta}
                  </span>

                  <strong>
                    {estaAbierta ? "−" : "+"}
                  </strong>

                </button>


                {estaAbierta && (
                  <div className="ayuda-pregunta__respuesta">
                    <p>
                      {item.respuesta}
                    </p>
                  </div>
                )}

              </article>
            );
          })}

        </div>

      </section>


      {/* =====================================================
          CONTACTO
          ===================================================== */}

      <section className="ayuda-contacto">

        <div className="ayuda-contacto__icon">
          💬
        </div>

        <div className="ayuda-contacto__text">

          <span>
            ¿NECESITAS MÁS AYUDA?
          </span>

          <h2>
            Estamos para ayudarte
          </h2>

          <p>
            Si no encontraste la respuesta que buscabas,
            puedes comunicarte directamente con nuestro equipo.
          </p>

        </div>

        <a
          href="mailto:contacto@ferreplast.cl"
          className="ayuda-contacto__button"
        >
          Contactarnos
          <span>→</span>
        </a>

      </section>

    </main>
  );
}

export default Ayuda;