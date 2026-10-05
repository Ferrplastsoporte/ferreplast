import "../css/contacto.css";
import iconoUbicacion from "../../../assets/iconos/home_contacto/ubicacion_logo_contacto.png";
import iconoTelefono from "../../../assets/iconos/home_contacto/telefono_logo_contacto.png";
import iconoCorreo from "../../../assets/iconos/home_contacto/correo_logo_contacto.png";
import iconoHorario from "../../../assets/iconos/home_contacto/horario_logo_contacto.png";
function Contacto() {
  return (
    <section className="contacto">
      <div className="contacto-contenedor">

        <div className="contacto-informacion">

          <span className="contacto-etiqueta">
            CONTACTO
          </span>

          <h2>Visítanos en nuestra tienda</h2>

          <p>
            Encuentra fibra de vidrio, resinas y herramientas en Puerto Montt.
            Te orientamos para elegir los materiales adecuados para tu proyecto.
          </p>

          <div className="contacto-datos">
            <div className="contacto-tarjeta">
              <span className="contacto-icono"><img src={iconoUbicacion} alt="" /></span>
              <div>
                <h4>Dirección</h4>
                <p>
                  Angelmó 1952<br />
                  Puerto Montt, Región de Los Lagos
                </p>
              </div>
            </div>

            <div className="contacto-tarjeta">
              <span className="contacto-icono"><img src={iconoTelefono} alt="" /></span>
              <div>
                <h4>Teléfono</h4>
                <p>+56 9 5498 0237</p>
              </div>
            </div>

            <div className="contacto-tarjeta">
              <span className="contacto-icono"><img src={iconoCorreo} alt="" /></span>
              <div>
                <h4>Correo</h4>
                <p>efuentes.m@ferreplast.cl</p>
              </div>
            </div>

            <div className="contacto-tarjeta">
              <span className="contacto-icono"><img src={iconoHorario} alt="" /></span>
              <div>
                <h4>Horario</h4>
                <p>Lunes a Viernes</p>
                <p>09:00 a 18:00 hrs</p>
              </div>
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
  );
}

export default Contacto;


