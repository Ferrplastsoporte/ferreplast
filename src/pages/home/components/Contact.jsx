import "../css/home.css";

function Contact() {
  return (
    <section className="contact">
      <div className="contact-container">

        <div className="contact-info">

          <span className="contact-tag">
            CONTACTO
          </span>

          <h2>Visítanos en nuestra tienda</h2>

          <p>
            En Ferreplast encontrarás resinas epóxicas, herramientas,
            pinturas y una amplia variedad de productos para tus proyectos.
            Nuestro equipo está preparado para brindarte asesoría
            personalizada y ayudarte a elegir la mejor solución.
          </p>

          <div className="contact-card">
            <span>📍</span>

            <div>
              <h4>Dirección</h4>
              <p>
                Angelmó 1952<br />
                Puerto Montt, Región de Los Lagos
              </p>
            </div>
          </div>

          <div className="contact-card">
            <span>📞</span>

            <div>
              <h4>Teléfono</h4>
              <p>+56 9 XXXX XXXX</p>
            </div>
          </div>

          <div className="contact-card">
            <span>✉️</span>

            <div>
              <h4>Correo</h4>
              <p>contacto@ferreplast.cl</p>
            </div>
          </div>

          <div className="contact-card">
            <span>🕒</span>

            <div>
              <h4>Horario</h4>
              <p>Lunes a Viernes</p>
              <p>09:00 a 18:00 hrs</p>
            </div>
          </div>

        </div>

        <div className="contact-map">

          <iframe
            title="Ubicación Ferreplast"
            src="https://maps.google.com/maps?q=Angelmó%201952,%20Puerto%20Montt,%20Chile&z=17&output=embed"
            loading="lazy"
            allowFullScreen
          />

        </div>

      </div>
    </section>
  );
}

export default Contact;