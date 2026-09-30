import SlideUp from "../../../animations/SlideUp";
import "../css/contacto.css";
function Contacto() {
  return (
    <SlideUp delay={0.3}>
    <section className="contacto">
      <div className="contacto-contenedor">

        <div className="contacto-informacion">

          <span className="contacto-etiqueta">
            CONTACTO
          </span>

          <h2>Visítanos en nuestra tienda</h2>

          <p>
            En Ferreplast encontrarás resinas epóxicas, herramientas,
            pinturas y una amplia variedad de productos para tus proyectos.
            Nuestro equipo está preparado para brindarte asesoría
            personalizada y ayudarte a elegir la mejor solución.
          </p>

          <div className="contacto-tarjeta">
            <span>📍</span>

            <div>
              <h4>Dirección</h4>
              <p>
                Angelmó 1952<br />
                Puerto Montt, Región de Los Lagos
              </p>
            </div>
          </div>

          <div className="contacto-tarjeta">
            <span>📞</span>

            <div>
              <h4>Teléfono</h4>
              <p>+56 9 5498 0237</p>
            </div>
          </div>

          <div className="contacto-tarjeta">
            <span>✉️</span>

            <div>
              <h4>Correo</h4>
              <p>efuentes.m@ferreplast.cl</p>
            </div>
          </div>

          <div className="contacto-tarjeta">
            <span>🕒</span>

            <div>
              <h4>Horario</h4>
              <p>Lunes a Viernes</p>
              <p>09:00 a 18:00 hrs</p>
            </div>
          </div>

        </div>

        <div className="contacto-mapa">

          <iframe
            title="Ubicación Ferreplast"
            src="https://maps.google.com/maps?q=Angelmó%201952,%20Puerto%20Montt,%20Chile&z=17&output=embed"
            loading="lazy"
            allowFullScreen
          />

        </div>

      </div>
    </section>
    </SlideUp>
  );
}

export default Contacto;


