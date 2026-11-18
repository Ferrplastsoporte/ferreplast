import { Link } from "react-router-dom";
import Footer from "../../components/layout/Footer";
import { RUTA_VERSION_PRIVACIDAD, VERSION_PRIVACIDAD } from "../../utils/comunes/privacidad";
import "./css/Privacidad.css";

function Privacidad() {
  return (
    <>
      <main className="privacidad-page">
        <article className="privacidad-documento" aria-labelledby="privacidad-titulo">
          <header className="privacidad-header">
            <Link to="/" className="privacidad-inicio">Volver al inicio</Link>
            <h1 id="privacidad-titulo">Política de privacidad</h1>
            <p>Última actualización: <time dateTime="2026-11-18">18 de noviembre de 2026</time></p>
            <a href={RUTA_VERSION_PRIVACIDAD} target="_blank" rel="noopener noreferrer">
              Consultar versión {VERSION_PRIVACIDAD} (abre en otra pestaña)
            </a>
          </header>

          <p>En Ferreplast SpA utilizamos tus datos personales para administrar tu cuenta, atender tus solicitudes y gestionar las operaciones realizadas en ferreplastspa.cl.</p>

          <section>
            <h2>1. Responsable y contacto</h2>
            <p>Ferreplast SpA, RUT 77.968.289-7, con local en Avenida Angelmó 1952, Puerto Montt, Región de Los Lagos, es responsable del tratamiento de los datos personales recopilados mediante este sitio.</p>
            <p>Para consultas y solicitudes relacionadas con tu privacidad, escribe a <a href="mailto:Ferreplast.soporte@outlook.com">Ferreplast.soporte@outlook.com</a>.</p>
          </section>

          <section>
            <h2>2. Información que recopilamos</h2>
            <p>Al registrarte solicitamos nombre y apellidos, RUT, correo electrónico, celular, dirección, región y comuna. También debes establecer una contraseña, gestionada mediante nuestro servicio de autenticación.</p>
            <p>Cuando utilizas la plataforma, registramos los antecedentes necesarios para gestionar tus pedidos, cotizaciones, pagos y entregas, además de la información que proporciones al comunicarte con nosotros.</p>
            <p>Los servicios tecnológicos utilizados también pueden generar registros técnicos y de seguridad, como direcciones IP, fechas y eventos relacionados con el funcionamiento del sitio.</p>
          </section>

          <section>
            <h2>3. Para qué utilizamos tus datos</h2>
            <ul>
              <li>Crear y administrar tu cuenta y verificar tu correo electrónico.</li>
              <li>Gestionar compras, cotizaciones, pagos y entregas.</li>
              <li>Generar y enviar documentos y comunicaciones relacionados con tus operaciones.</li>
              <li>Atender consultas, solicitudes y reclamos.</li>
              <li>Prevenir abusos y proteger las cuentas y la plataforma.</li>
              <li>Mantener los antecedentes necesarios para respaldar operaciones y cumplir las obligaciones legales aplicables.</li>
            </ul>
            <p>La creación de una cuenta no autoriza por sí sola el envío de publicidad.</p>
          </section>

          <section>
            <h2>4. Acceso a la información</h2>
            <p>El personal autorizado de Ferreplast accede a la información necesaria para realizar sus funciones.</p>
            <p>El personal de administración gestiona los antecedentes de clientes y sus operaciones comerciales. El personal de bodega utiliza la información necesaria para preparar y entregar los pedidos, incluidos los datos de contacto y entrega correspondientes.</p>
          </section>

          <section>
            <h2>5. Servicios tecnológicos</h2>
            <p>La plataforma utiliza servicios de terceros para funcionar:</p>
            <ul>
              <li><strong>Supabase:</strong> autenticación, almacenamiento de datos y ejecución de procesos.</li>
              <li><strong>Cloudflare:</strong> alojamiento del sitio, protección frente a abusos, verificación CAPTCHA y envío de correos.</li>
              <li><strong>Proveedores de pago habilitados:</strong> procesamiento de las operaciones realizadas mediante el medio de pago seleccionado.</li>
            </ul>
            <p>Estos proveedores pueden tratar información en infraestructura ubicada fuera de Chile, dependiendo de la configuración y las condiciones del servicio contratado.</p>
          </section>

          <section>
            <h2>6. Conservación y eliminación de cuentas</h2>
            <p>Los datos de tu cuenta se mantienen mientras esta permanezca vigente y sean necesarios para prestar el servicio.</p>
            <p>Puedes deshabilitar voluntariamente tu cuenta cuando no tengas pedidos o cotizaciones pendientes. Transcurridos 30 días desde su deshabilitación, se realiza su eliminación conforme al proceso de la plataforma.</p>
            <p><strong>La eliminación de la cuenta no implica borrar todos los antecedentes de operaciones anteriores.</strong> Determinados registros de pedidos y cotizaciones conservan el nombre, RUT e identificador interno del cliente, junto con los antecedentes esenciales de esas operaciones. Se conserva también un registro interno del identificador de la cuenta y su fecha de eliminación.</p>
            <p>Esta información continúa siendo información personal y se mantiene para respaldar las operaciones, atender eventuales reclamaciones y cumplir las obligaciones que correspondan. Su conservación debe tener una justificación y no supone una autorización para mantenerla indefinidamente.</p>
            <p><strong>Ferreplast se encuentra definiendo los plazos específicos de conservación de estos registros.</strong> Puedes solicitar información o una revisión de su conservación mediante nuestro correo de privacidad.</p>
            <p>Si posteriormente creas otra cuenta, esta no hereda automáticamente el historial de la cuenta eliminada.</p>
          </section>

          <section>
            <h2>7. Solicitudes sobre tus datos</h2>
            <p>Puedes solicitar acceso a tus datos, corregir información inexacta, solicitar su eliminación o la revocación de una autorización y ejercer los demás derechos que reconozca la normativa aplicable escribiendo a <a href="mailto:Ferreplast.soporte@outlook.com">Ferreplast.soporte@outlook.com</a>.</p>
            <p>Podremos solicitar información proporcional para verificar tu identidad. Si determinada información debe conservarse, te explicaremos el motivo y el alcance de esa conservación. La revocación de una autorización no afecta retroactivamente al tratamiento ya realizado ni elimina las obligaciones legales que correspondan.</p>
          </section>

          <section>
            <h2>8. Seguridad</h2>
            <p>Aplicamos controles de acceso y medidas técnicas para proteger la información y limitar su utilización al personal y los servicios autorizados.</p>
            <p>Ningún sistema informático puede garantizar una seguridad absoluta. Mantén tu contraseña en reserva y no compartas enlaces de acceso, confirmación o recuperación de cuenta.</p>
          </section>

          <section>
            <h2>9. Cookies y almacenamiento del navegador</h2>
            <p>La plataforma utiliza mecanismos de almacenamiento del navegador y servicios necesarios para la autenticación, el funcionamiento de sus características y la protección frente a abusos.</p>
            <p>Estamos revisando los mecanismos de almacenamiento utilizados para proporcionar información más detallada sobre ellos.</p>
            <p>Si incorporamos herramientas adicionales de análisis o publicidad, informaremos su finalidad y solicitaremos autorización cuando corresponda.</p>
          </section>

          <section>
            <h2>10. Cambios en esta política</h2>
            <p>Las modificaciones se publicarán en esta página junto con su fecha de actualización. Cuando corresponda solicitar una nueva autorización para tratar tus datos, lo haremos antes de realizar ese tratamiento.</p>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}

export default Privacidad;
